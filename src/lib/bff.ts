/**
 * BFF de sesión del dashboard (solo servidor). El JWT de NestJS nunca llega al navegador:
 * vive en la cookie HttpOnly `zodall_session` y este módulo lo reenvía servidor a servidor
 * como `Authorization: Bearer` a una URL base fija, con lista blanca de rutas y métodos.
 *
 * Sin dependencias de Next: opera sobre Request/Response estándar para poder probarse con
 * `node --test` (ver tests/bff.test.mjs). Los route handlers de src/app/api solo delegan aquí.
 */
import { isIP } from 'node:net';

export const SESSION_COOKIE = 'zodall_session';
export const CSRF_COOKIE = 'zodall_csrf';
export const CSRF_HEADER = 'x-csrf-token';

const FALLBACK_SESSION_SECONDS = 12 * 60 * 60;
const MAX_BODY_BYTES = 64 * 1024;
const AUTH_BODY_BYTES = 16 * 1024;
const MAX_QUERY_LENGTH = 1024;
const PROXY_TIMEOUT_MS = 60_000;
const LOGOUT_TIMEOUT_MS = 5_000;
const SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

/** Lista blanca: única superficie de NestJS alcanzable desde el navegador. `:id` = un solo segmento. */
const ROUTES: ReadonlyArray<readonly [string, string]> = [
  ['GET', 'auth/me'],
  ['PUT', 'auth/profile'],
  ['GET', 'tenants/api-key'],
  ['POST', 'tenants/api-key/generate'],
  ['GET', 'tenants/plugin-download'],
  ['GET', 'tenants/plans'],
  ['PUT', 'tenants/admin/plans/:id'],
  ['POST', 'stripe/create-checkout-session'],
  ['POST', 'tenants/upgrade-plan'],
  ['GET', 'tenants/metrics'],
  ['GET', 'tenants/query-history'],
  ['GET', 'tenants/query-history/export-pdf'],
  ['POST', 'compliance/manual-verify'],
  ['GET', 'tenants/admin/users'],
  ['PUT', 'tenants/admin/users/:id/toggle-status'],
  ['GET', 'tenants/admin/audit-logs'],
  ['GET', 'tenants/admin/audit-logs/export-pdf'],
  ['GET', 'tenants/admin/event-logs'],
  ['GET', 'tenants/audit-logs/:id/certificate-pdf'],
];

const SAFE_METHODS = new Set(['GET']);
const PASS_RESPONSE_HEADERS = [
  'content-type',
  'content-disposition',
  'retry-after',
  'x-request-id',
  'x-quota-limit',
  'x-quota-remaining',
];

export interface BffDeps {
  fetch: typeof fetch;
  env: Record<string, string | undefined>;
  now?: () => number;
}

// ─── Cookies ────────────────────────────────────────────────────────────────

export function parseCookies(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 1) continue;
    const name = part.slice(0, i).trim();
    if (!(name in out)) out[name] = part.slice(i + 1).trim();
  }
  return out;
}

function cookie(name: string, value: string, opts: { httpOnly: boolean; maxAge: number; secure: boolean }): string {
  const attrs = [`${name}=${value}`, 'Path=/', 'SameSite=Lax', `Max-Age=${opts.maxAge}`];
  if (opts.maxAge <= 0) attrs.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  if (opts.httpOnly) attrs.push('HttpOnly');
  if (opts.secure) attrs.push('Secure');
  return attrs.join('; ');
}

/** Segundos de vida restantes del JWT según su `exp` (sin verificar la firma: la verifica NestJS). */
export function jwtRemainingSeconds(token: string, nowMs: number): number {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = JSON.parse(json).exp;
    if (typeof exp === 'number') return Math.floor(exp - nowMs / 1000);
  } catch {
    // JWT ilegible: se usa el plazo de reserva
  }
  return FALLBACK_SESSION_SECONDS;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function setSessionCookies(headers: Headers, jwt: string, deps: BffDeps): void {
  const secure = deps.env.NODE_ENV === 'production';
  const maxAge = Math.max(1, jwtRemainingSeconds(jwt, (deps.now ?? Date.now)()));
  headers.append('set-cookie', cookie(SESSION_COOKIE, jwt, { httpOnly: true, maxAge, secure }));
  headers.append('set-cookie', cookie(CSRF_COOKIE, randomToken(), { httpOnly: false, maxAge, secure }));
}

function clearSessionCookies(headers: Headers, deps: BffDeps): void {
  const secure = deps.env.NODE_ENV === 'production';
  headers.append('set-cookie', cookie(SESSION_COOKIE, '', { httpOnly: true, maxAge: 0, secure }));
  headers.append('set-cookie', cookie(CSRF_COOKIE, '', { httpOnly: false, maxAge: 0, secure }));
}

// ─── Origen y CSRF ──────────────────────────────────────────────────────────

function allowedOrigins(request: Request, env: BffDeps['env']): string[] {
  const headers = request.headers;
  const fixed = (env.APP_ORIGIN || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (fixed.length) return fixed;
  const host = (headers.get('x-forwarded-host') || headers.get('host') || '').split(',')[0].trim();
  if (!host) return [];
  const proto = (headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '')).split(',')[0].trim();
  return [`${proto}://${host}`];
}

/** Mutaciones: exige Origin propio y, si el navegador envía Sec-Fetch-Site, que sea same-origin. */
export function isSameOriginMutation(request: Request, env: BffDeps['env']): boolean {
  const headers = request.headers;
  const fetchSite = headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') return false;
  const origin = headers.get('origin');
  if (!origin || origin === 'null') return false;
  return allowedOrigins(request, env).includes(origin.replace(/\/$/, ''));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Double-submit: la cabecera x-csrf-token debe coincidir con la cookie zodall_csrf. */
export function hasValidCsrf(headers: Headers): boolean {
  const fromCookie = parseCookies(headers.get('cookie'))[CSRF_COOKIE];
  const fromHeader = headers.get(CSRF_HEADER);
  return !!fromCookie && !!fromHeader && fromCookie.length >= 32 && safeEqual(fromCookie, fromHeader);
}

// ─── Lista blanca y URL fija ────────────────────────────────────────────────

/**
 * Devuelve la ruta de NestJS (sin base) o null si el método/ruta no está permitido.
 * Rechaza `.`, `..`, `//`, `%`, `\`, esquemas y cualquier segmento fuera de [A-Za-z0-9_-].
 */
export function matchRoute(method: string, segments: string[]): { path: string } | { status: 404 | 405 } {
  if (!segments.length || !segments.every((s) => SEGMENT.test(s))) return { status: 404 };
  let pathKnown = false;
  for (const [m, pattern] of ROUTES) {
    const parts = pattern.split('/');
    if (parts.length !== segments.length) continue;
    if (!parts.every((p, i) => (p === ':id' ? true : p === segments[i]))) continue;
    pathKnown = true;
    if (m === method) return { path: segments.join('/') };
  }
  return { status: pathKnown ? 405 : 404 };
}

export function pathSegments(url: URL, prefix: string): string[] | null {
  if (!url.pathname.startsWith(prefix)) return null;
  const rest = url.pathname.slice(prefix.length);
  if (/[%\\]/.test(rest)) return null;
  return rest.split('/');
}

export function backendBase(env: BffDeps['env']): string | null {
  const raw =
    env.BACKEND_API_URL || env.NEXT_PUBLIC_BACKEND_URL || (env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:3001/api/v1');
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return `${u.origin}${u.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

function clientIp(headers: Headers): string | null {
  const last = (headers.get('x-forwarded-for') || '').split(',').pop()?.trim();
  return last && isIP(last) ? last : null;
}

// ─── Respuestas ─────────────────────────────────────────────────────────────

function json(status: number, body: unknown, extra?: Headers): Response {
  const headers = new Headers(extra);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(JSON.stringify(body), { status, headers });
}

function relay(upstream: Response, extra: Headers): Response {
  const headers = new Headers(extra);
  for (const name of PASS_RESPONSE_HEADERS) {
    const v = upstream.headers.get(name);
    if (v) headers.set(name, v);
  }
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  const noBody = upstream.status === 204 || upstream.status === 205 || upstream.status === 304;
  return new Response(noBody ? null : upstream.body, { status: upstream.status, headers });
}

async function readLimitedBody(request: Request, limit: number): Promise<{ text: string } | { status: 413 | 415 | 400 }> {
  if (request.method === 'GET') return { text: '' };
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > limit) return { status: 413 };
  const text = await request.text();
  if (new TextEncoder().encode(text).length > limit) return { status: 413 };
  if (text && !/^application\/json\b/i.test(request.headers.get('content-type') || '')) return { status: 415 };
  return { text };
}

async function callUpstream(
  deps: BffDeps,
  base: string,
  path: string,
  init: { method: string; search?: string; token?: string; body?: string; ip: string | null; timeoutMs: number },
): Promise<Response> {
  const headers: Record<string, string> = { accept: 'application/json, application/pdf' };
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  if (init.body) headers['content-type'] = 'application/json';
  if (init.ip) headers['x-forwarded-for'] = init.ip;
  return deps.fetch(`${base}/${path}${init.search ?? ''}`, {
    method: init.method,
    headers,
    body: init.body || undefined,
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(init.timeoutMs),
  });
}

function upstreamUnavailable(): Response {
  return json(502, { message: 'No se pudo contactar con el servicio. Intenta de nuevo en unos minutos.' });
}

// ─── Handlers ───────────────────────────────────────────────────────────────

/** Proxy autenticado: /api/bff/<ruta de NestJS>. */
export async function handleProxy(request: Request, deps: BffDeps): Promise<Response> {
  const url = new URL(request.url);
  const segments = pathSegments(url, '/api/bff/');
  const route = segments ? matchRoute(request.method, segments) : { status: 404 as const };
  if ('status' in route) return json(route.status, { message: route.status === 405 ? 'Método no permitido' : 'Ruta no permitida' });

  if (!SAFE_METHODS.has(request.method)) {
    if (!isSameOriginMutation(request, deps.env) || !hasValidCsrf(request.headers)) {
      return json(403, { message: 'Solicitud rechazada (origen o token CSRF inválido).' });
    }
  }

  const clear = new Headers();
  const token = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE];
  if (!token) {
    clearSessionCookies(clear, deps);
    return json(401, { message: 'Sesión no iniciada.' }, clear);
  }

  const base = backendBase(deps.env);
  if (!base) return json(500, { message: 'Servicio no configurado.' });
  if (url.search.length > MAX_QUERY_LENGTH) return json(414, { message: 'Consulta demasiado larga.' });

  const body = await readLimitedBody(request, MAX_BODY_BYTES);
  if ('status' in body) return json(body.status, { message: 'Cuerpo de la solicitud no válido.' });

  let upstream: Response;
  try {
    upstream = await callUpstream(deps, base, route.path, {
      method: request.method,
      search: url.search,
      token,
      body: body.text,
      ip: clientIp(request.headers),
      timeoutMs: PROXY_TIMEOUT_MS,
    });
  } catch {
    return upstreamUnavailable();
  }

  if (upstream.status >= 300 && upstream.status < 400) return upstreamUnavailable();
  if (upstream.status === 401) clearSessionCookies(clear, deps);

  // Ninguna respuesta JSON de la API entrega access_token al navegador. Si PUT auth/profile rota el JWT
  // (cambio de contraseña), el BFF lo guarda en la cookie (y rota el CSRF; el cliente lo relee en cada petición).
  if (upstream.ok && (upstream.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
    const text = await upstream.text();
    try {
      const data = JSON.parse(text);
      if (data && typeof data === 'object' && !Array.isArray(data) && 'access_token' in data) {
        const { access_token: rotated, ...safe } = data as Record<string, unknown>;
        if (request.method === 'PUT' && route.path === 'auth/profile' && typeof rotated === 'string' && rotated) {
          setSessionCookies(clear, rotated, deps);
        }
        return json(upstream.status, safe, clear);
      }
    } catch {
      // no es JSON válido: se retransmite tal cual
    }
    return relay(new Response(text, { status: upstream.status, headers: upstream.headers }), clear);
  }
  return relay(upstream, clear);
}

/** Login y registro: el servidor recibe el JWT, fija la cookie y no lo devuelve al cliente. */
export async function handleAuth(kind: 'login' | 'register', request: Request, deps: BffDeps): Promise<Response> {
  if (!isSameOriginMutation(request, deps.env)) {
    return json(403, { message: 'Solicitud rechazada (origen inválido).' });
  }
  const base = backendBase(deps.env);
  if (!base) return json(500, { message: 'Servicio no configurado.' });

  const body = await readLimitedBody(request, AUTH_BODY_BYTES);
  if ('status' in body) return json(body.status, { message: 'Cuerpo de la solicitud no válido.' });
  if (!body.text) return json(400, { message: 'Cuerpo de la solicitud no válido.' });
  try {
    const parsed = JSON.parse(body.text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('forma');
  } catch {
    return json(400, { message: 'Cuerpo de la solicitud no válido.' });
  }

  let upstream: Response;
  try {
    upstream = await callUpstream(deps, base, `auth/${kind}`, {
      method: 'POST',
      body: body.text,
      ip: clientIp(request.headers),
      timeoutMs: PROXY_TIMEOUT_MS,
    });
  } catch {
    return upstreamUnavailable();
  }
  if (upstream.status >= 300 && upstream.status < 400) return upstreamUnavailable();
  if (!upstream.ok) return relay(upstream, new Headers());

  let data: Record<string, unknown>;
  try {
    data = await upstream.json();
  } catch {
    return upstreamUnavailable();
  }
  const { access_token: jwt, ...safe } = data;
  if (typeof jwt !== 'string' || !jwt) return upstreamUnavailable();

  const headers = new Headers();
  setSessionCookies(headers, jwt, deps);
  return json(upstream.status, safe, headers);
}

/** Logout: borra las cookies siempre, aunque NestJS falle o no responda. */
export async function handleLogout(request: Request, deps: BffDeps): Promise<Response> {
  if (!isSameOriginMutation(request, deps.env)) {
    return json(403, { message: 'Solicitud rechazada (origen inválido).' });
  }
  const token = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE];
  const base = backendBase(deps.env);
  if (token && base) {
    try {
      const res = await callUpstream(deps, base, 'auth/logout', {
        method: 'POST',
        token,
        ip: clientIp(request.headers),
        timeoutMs: LOGOUT_TIMEOUT_MS,
      });
      await res.body?.cancel();
    } catch {
      // El cierre local no depende de la API.
    }
  }
  const headers = new Headers();
  clearSessionCookies(headers, deps);
  return json(200, { message: 'Sesión cerrada.' }, headers);
}

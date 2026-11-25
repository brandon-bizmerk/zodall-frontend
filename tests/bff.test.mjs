// Pruebas del BFF de sesión (src/lib/bff.ts) y de safeUrl. Ejecutar: yarn test (node --test, sin dependencias nuevas).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleAuth,
  handleLogout,
  handleProxy,
  matchRoute,
  jwtRemainingSeconds,
  SESSION_COOKIE,
  CSRF_COOKIE,
} from '../src/lib/bff.ts';
import { safeExternalUrl } from '../src/lib/safeUrl.ts';

const ORIGIN = 'https://app.test';
const API = 'https://api.test/api/v1';
const NOW = Date.UTC(2026, 10, 25, 12, 0, 0);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const FAKE_JWT = `${b64({ alg: 'HS256' })}.${b64({ sub: 'u1', exp: NOW / 1000 + 3600 })}.firma`;
const CSRF = 'c'.repeat(64);

const env = (extra = {}) => ({ NODE_ENV: 'production', BACKEND_API_URL: API, ...extra });

function mkDeps(handler, envVars = env()) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return handler(String(url), init);
  };
  return { deps: { fetch: fetchImpl, env: envVars, now: () => NOW }, calls };
}
const jsonRes = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

function req(path, { method = 'GET', headers = {}, body } = {}) {
  return new Request(`${ORIGIN}${path}`, {
    method,
    headers: { host: 'app.test', 'x-forwarded-proto': 'https', ...headers },
    body,
  });
}
const sameOrigin = { origin: ORIGIN, 'sec-fetch-site': 'same-origin' };
const session = { cookie: `${SESSION_COOKIE}=${FAKE_JWT}; ${CSRF_COOKIE}=${CSRF}` };
const mutating = (extra = {}) => ({ ...sameOrigin, ...session, 'x-csrf-token': CSRF, 'content-type': 'application/json', ...extra });
const setCookies = (res) => res.headers.getSetCookie();
const clean = (h) => Object.fromEntries(Object.entries(h).filter(([, v]) => v !== undefined));
const authReq = (kind, headers, body = '{"a":1}') =>
  req(`/api/auth/${kind}`, { method: 'POST', headers: clean(headers), body });

// ─── Login / registro ───────────────────────────────────────────────────────

test('login: cookie HttpOnly/Secure/SameSite=Lax/Path=/ con vida igual al JWT y sin access_token en el cuerpo', async () => {
  const { deps, calls } = mkDeps(() => jsonRes(200, { message: 'ok', access_token: FAKE_JWT, user: { id: 'u1' } }));
  const body = JSON.stringify({ email: 'a@b.co', password: 'x', recaptcha_token: 't' });
  const res = await handleAuth('login', authReq('login', { ...sameOrigin, 'content-type': 'application/json' }, body), deps);
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(!text.includes('access_token'));
  assert.ok(!text.includes(FAKE_JWT));
  assert.deepEqual(JSON.parse(text), { message: 'ok', user: { id: 'u1' } });
  const [sess, csrf] = setCookies(res);
  assert.ok(sess.startsWith(`${SESSION_COOKIE}=${FAKE_JWT}`));
  for (const attr of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=3600']) {
    assert.ok(sess.includes(attr), `sesión sin ${attr}`);
  }
  assert.ok(csrf.startsWith(`${CSRF_COOKIE}=`));
  assert.ok(!csrf.includes('HttpOnly') && csrf.includes('Secure') && csrf.includes('SameSite=Lax'));
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(calls[0].url, `${API}/auth/login`);
  assert.equal(JSON.parse(calls[0].init.body).recaptcha_token, 't');
});

test('login en desarrollo (http): cookie sin Secure', async () => {
  const { deps } = mkDeps(() => jsonRes(200, { access_token: FAKE_JWT }), env({ NODE_ENV: 'development' }));
  const res = await handleAuth('login', authReq('login', { origin: ORIGIN, 'content-type': 'application/json' }), deps);
  assert.ok(!setCookies(res)[0].includes('Secure'));
});

test('login/registro cross-site, sin Origin o con Sec-Fetch-Site distinto: 403 y no llama a la API', async () => {
  const variants = [
    { origin: 'https://evil.test', 'content-type': 'application/json' },
    { 'content-type': 'application/json' },
    { origin: 'null', 'content-type': 'application/json' },
    { origin: ORIGIN, 'sec-fetch-site': 'cross-site', 'content-type': 'application/json' },
  ];
  for (const headers of variants) {
    for (const kind of ['login', 'register']) {
      const { deps, calls } = mkDeps(() => jsonRes(200, { access_token: FAKE_JWT }));
      const res = await handleAuth(kind, authReq(kind, headers), deps);
      assert.equal(res.status, 403);
      assert.equal(calls.length, 0);
      assert.equal(setCookies(res).length, 0);
    }
  }
});

test('login con credenciales inválidas: 401 de la API sin cookies', async () => {
  const { deps } = mkDeps(() => jsonRes(401, { message: 'Correo o contraseña incorrectos.' }));
  const res = await handleAuth('login', authReq('login', { ...sameOrigin, 'content-type': 'application/json' }), deps);
  assert.equal(res.status, 401);
  assert.equal(setCookies(res).length, 0);
  assert.equal((await res.json()).message, 'Correo o contraseña incorrectos.');
});

test('login: respuesta 200 sin access_token es un error 502 sin cookies', async () => {
  const { deps } = mkDeps(() => jsonRes(200, { message: 'ok' }));
  const res = await handleAuth('login', authReq('login', { ...sameOrigin, 'content-type': 'application/json' }), deps);
  assert.equal(res.status, 502);
  assert.equal(setCookies(res).length, 0);
});

test('login: cuerpo no JSON, tipo incorrecto o demasiado grande se rechazan', async () => {
  const { deps, calls } = mkDeps(() => jsonRes(200, { access_token: FAKE_JWT }));
  const post = (headers, body) => handleAuth('login', authReq('login', { ...sameOrigin, ...headers }, body), deps);
  assert.equal((await post({ 'content-type': 'application/json' }, 'no-json')).status, 400);
  assert.equal((await post({ 'content-type': 'text/plain' }, '{"a":1}')).status, 415);
  assert.equal((await post({ 'content-type': 'application/json' }, JSON.stringify({ p: 'x'.repeat(20000) }))).status, 413);
  assert.equal(calls.length, 0);
});

// ─── Proxy autenticado ──────────────────────────────────────────────────────

test('proxy GET: Bearer del JWT de la cookie a la URL fija, sin reenviar cookies y con no-store', async () => {
  const { deps, calls } = mkDeps(() => jsonRes(200, { user: { id: 'u1' } }, { 'set-cookie': 'x=1', 'x-request-id': 'r1' }));
  const res = await handleProxy(req('/api/bff/tenants/query-history?search=ana&limit=10', { headers: session }), deps);
  assert.equal(res.status, 200);
  assert.equal(calls[0].url, `${API}/tenants/query-history?search=ana&limit=10`);
  assert.equal(calls[0].init.headers.authorization, `Bearer ${FAKE_JWT}`);
  assert.equal(calls[0].init.headers.cookie, undefined);
  assert.equal(calls[0].init.redirect, 'manual');
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(res.headers.get('set-cookie'), null);
  assert.equal(res.headers.get('x-request-id'), 'r1');
});

test('proxy: sin cookie de sesión responde 401, limpia cookies y no llama a la API', async () => {
  const { deps, calls } = mkDeps(() => jsonRes(200, {}));
  const res = await handleProxy(req('/api/bff/auth/me'), deps);
  assert.equal(res.status, 401);
  assert.equal(calls.length, 0);
  assert.equal(setCookies(res).length, 2);
  assert.ok(setCookies(res).every((c) => c.includes('Max-Age=0')));
});

test('proxy: 401 de NestJS borra la sesión', async () => {
  const { deps } = mkDeps(() => jsonRes(401, { message: 'Token inválido' }));
  const res = await handleProxy(req('/api/bff/auth/me', { headers: session }), deps);
  assert.equal(res.status, 401);
  const cookies = setCookies(res);
  assert.equal(cookies.length, 2);
  assert.ok(cookies[0].startsWith(`${SESSION_COOKIE}=;`));
  assert.ok(cookies[0].includes('Max-Age=0') && cookies[0].includes('HttpOnly'));
});

test('proxy: mutación sin CSRF, con CSRF erróneo, Origin ajeno o cross-site: 403 sin llamar a la API', async () => {
  const cases = [
    mutating({ 'x-csrf-token': undefined }),
    mutating({ 'x-csrf-token': 'd'.repeat(64) }),
    mutating({ origin: 'https://evil.test' }),
    mutating({ origin: undefined }),
    mutating({ 'sec-fetch-site': 'cross-site' }),
    mutating({ 'sec-fetch-site': 'same-site' }),
    mutating({ cookie: `${SESSION_COOKIE}=${FAKE_JWT}` }),
  ];
  for (const h of cases) {
    const headers = clean(h);
    const { deps, calls } = mkDeps(() => jsonRes(200, {}));
    const res = await handleProxy(req('/api/bff/tenants/api-key/generate', { method: 'POST', headers }), deps);
    assert.equal(res.status, 403, JSON.stringify(headers));
    assert.equal(calls.length, 0);
  }
});

test('proxy: mutación legítima pasa con cuerpo JSON y CSRF válido', async () => {
  const { deps, calls } = mkDeps(() => jsonRes(201, { ok: true }));
  const res = await handleProxy(
    req('/api/bff/stripe/create-checkout-session', { method: 'POST', headers: mutating(), body: '{"plan_id":"personal"}' }),
    deps,
  );
  assert.equal(res.status, 201);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.body, '{"plan_id":"personal"}');
  assert.equal(calls[0].init.headers['content-type'], 'application/json');
});

test('proxy: Origin se valida contra APP_ORIGIN si existe, o contra X-Forwarded-Host', async () => {
  const gen = (headers) => req('/api/bff/tenants/api-key/generate', { method: 'POST', headers });
  const a = mkDeps(() => jsonRes(200, {}), env({ APP_ORIGIN: 'https://app.test' }));
  assert.equal((await handleProxy(gen(mutating()), a.deps)).status, 200);
  const b = mkDeps(() => jsonRes(200, {}), env({ APP_ORIGIN: 'https://otro.test' }));
  assert.equal((await handleProxy(gen(mutating()), b.deps)).status, 403);
  const c = mkDeps(() => jsonRes(200, {}));
  const fwd = mutating({ origin: 'https://publico.test', 'x-forwarded-host': 'publico.test' });
  assert.equal((await handleProxy(gen(fwd), c.deps)).status, 200);
});

test('proxy: rutas fuera de la lista blanca, traversal y URLs absolutas se rechazan sin llamar a la API', async () => {
  const bad = [
    '/api/bff/auth/login',
    '/api/bff/auth/logout',
    '/api/bff/compliance/verify',
    '/api/bff/mcp/admin',
    '/api/bff/tenants/admin/users/x/y/toggle-status',
    '/api/bff/tenants/plans/extra',
    '/api/bff/tenants/%2e%2e/auth/login',
    '/api/bff/tenants/..%2fauth/me',
    '/api/bff/tenants/plans%2f..%2fadmin',
    '/api/bff/tenants/admin/users/..%5cx/toggle-status',
    '/api/bff/tenants//plans',
    '/api/bff/tenants/plans/',
    '/api/bff/https://evil.test/x',
    '/api/bff/%2f%2fevil.test',
    '/api/bff/',
    '/api/bff/tenants/admin/users/a%00b/toggle-status',
  ];
  for (const path of bad) {
    const { deps, calls } = mkDeps(() => jsonRes(200, {}));
    const res = await handleProxy(req(path, { headers: session }), deps);
    assert.ok([404, 405].includes(res.status), `${path} -> ${res.status}`);
    assert.equal(calls.length, 0, path);
  }
  assert.deepEqual(matchRoute('GET', ['tenants', '..', 'plans']), { status: 404 });
  assert.deepEqual(matchRoute('GET', ['a:b']), { status: 404 });
});

test('proxy: método no permitido en ruta conocida es 405 y PATCH/DELETE no llegan a la API', async () => {
  const { deps, calls } = mkDeps(() => jsonRes(200, {}));
  assert.equal((await handleProxy(req('/api/bff/tenants/plans', { method: 'POST', headers: mutating() }), deps)).status, 405);
  assert.equal((await handleProxy(req('/api/bff/tenants/plans', { method: 'DELETE', headers: mutating() }), deps)).status, 405);
  assert.equal(calls.length, 0);
});

test('proxy: el segmento :id admite un identificador simple y se reenvía tal cual', async () => {
  const { deps, calls } = mkDeps(() => jsonRes(200, { account_status: 'ACTIVE' }));
  const ok = await handleProxy(req('/api/bff/tenants/admin/users/0b1f-22_aa/toggle-status', { method: 'PUT', headers: mutating() }), deps);
  assert.equal(ok.status, 200);
  assert.equal(calls[0].url, `${API}/tenants/admin/users/0b1f-22_aa/toggle-status`);
});

test('proxy: redirección de la API (3xx) no se sigue', async () => {
  const { deps } = mkDeps(() => new Response(null, { status: 302, headers: { location: 'https://evil.test' } }));
  const res = await handleProxy(req('/api/bff/auth/me', { headers: session }), deps);
  assert.equal(res.status, 502);
  assert.equal(res.headers.get('location'), null);
});

test('proxy: API caída es 502 genérico, sin detalles internos', async () => {
  const { deps } = mkDeps(() => {
    throw new Error('connect ECONNREFUSED 10.0.0.5:3001');
  });
  const res = await handleProxy(req('/api/bff/auth/me', { headers: session }), deps);
  assert.equal(res.status, 502);
  assert.ok(!(await res.text()).includes('10.0.0.5'));
});

test('proxy: PDF (binario) se retransmite con su content-type', async () => {
  const pdf = new Response(new Uint8Array([37, 80, 68, 70]), {
    status: 200,
    headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="a.pdf"' },
  });
  const { deps } = mkDeps(() => pdf);
  const res = await handleProxy(req('/api/bff/tenants/audit-logs/abc-123/certificate-pdf', { headers: session }), deps);
  assert.equal(res.headers.get('content-type'), 'application/pdf');
  assert.equal(new Uint8Array(await res.arrayBuffer()).length, 4);
});

test('proxy: reenvía la IP del cliente (último valor de X-Forwarded-For) y descarta valores no IP', async () => {
  const { deps, calls } = mkDeps(() => jsonRes(200, {}));
  await handleProxy(req('/api/bff/auth/me', { headers: { ...session, 'x-forwarded-for': '6.6.6.6, 203.0.113.9' } }), deps);
  assert.equal(calls[0].init.headers['x-forwarded-for'], '203.0.113.9');
  await handleProxy(req('/api/bff/auth/me', { headers: { ...session, 'x-forwarded-for': 'no-es-ip' } }), deps);
  assert.equal(calls[1].init.headers['x-forwarded-for'], undefined);
});

test('proxy: sin URL de API en producción devuelve 500 y nunca usa un host del cliente', async () => {
  const { deps, calls } = mkDeps(() => jsonRes(200, {}), { NODE_ENV: 'production' });
  const headers = { ...session, host: 'evil.test', 'x-forwarded-host': 'evil.test' };
  const res = await handleProxy(req('/api/bff/auth/me', { headers }), deps);
  assert.equal(res.status, 500);
  assert.equal(calls.length, 0);
});

test('PUT auth/profile con access_token nuevo: cuerpo sin token y cookie de sesión rotada', async () => {
  const NEW = `${b64({ alg: 'HS256' })}.${b64({ sub: 'u1', tv: 2, exp: NOW / 1000 + 600 })}.nueva`;
  const { deps } = mkDeps(() => jsonRes(200, { user: { id: 'u1' }, access_token: NEW }));
  const res = await handleProxy(req('/api/bff/auth/profile', { method: 'PUT', headers: mutating(), body: '{"new_password":"x"}' }), deps);
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(!text.includes('access_token') && !text.includes(NEW));
  assert.deepEqual(JSON.parse(text), { user: { id: 'u1' } });
  const [sess, csrf] = setCookies(res);
  assert.ok(sess.startsWith(`${SESSION_COOKIE}=${NEW}`));
  for (const attr of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=600']) assert.ok(sess.includes(attr), attr);
  assert.ok(csrf.startsWith(`${CSRF_COOKIE}=`) && !csrf.includes('HttpOnly'));
});

test('PUT auth/profile sin access_token: sin Set-Cookie y cuerpo intacto', async () => {
  const { deps } = mkDeps(() => jsonRes(200, { user: { id: 'u1' } }));
  const res = await handleProxy(req('/api/bff/auth/profile', { method: 'PUT', headers: mutating(), body: '{"full_name":"A"}' }), deps);
  assert.equal(setCookies(res).length, 0);
  assert.deepEqual(await res.json(), { user: { id: 'u1' } });
});

test('ninguna otra ruta filtra access_token ni rota la sesión (aunque la API lo incluya)', async () => {
  const { deps } = mkDeps(() => jsonRes(200, { ok: true, access_token: 'secreto-no-debe-salir' }));
  for (const [method, path] of [['GET', '/api/bff/auth/me'], ['GET', '/api/bff/tenants/plans'], ['POST', '/api/bff/tenants/api-key/generate']]) {
    const headers = method === 'GET' ? session : mutating();
    const res = await handleProxy(req(path, { method, headers }), deps);
    const text = await res.text();
    assert.ok(!text.includes('access_token') && !text.includes('secreto-no-debe-salir'), path);
    assert.equal(setCookies(res).length, 0, path);
  }
});

test('respuestas no JSON (PDF) siguen en streaming sin tocarse', async () => {
  const bytes = new Uint8Array([37, 80, 68, 70, 0, 255]);
  const { deps } = mkDeps(() => new Response(bytes, { status: 200, headers: { 'content-type': 'application/pdf' } }));
  const res = await handleProxy(req('/api/bff/tenants/query-history/export-pdf', { headers: session }), deps);
  assert.deepEqual(new Uint8Array(await res.arrayBuffer()), bytes);
});

// ─── Logout ─────────────────────────────────────────────────────────────────

test('logout: borra las cookies aunque NestJS esté caído', async () => {
  const { deps, calls } = mkDeps(() => {
    throw new Error('ECONNREFUSED');
  });
  const res = await handleLogout(req('/api/auth/logout', { method: 'POST', headers: { ...sameOrigin, ...session } }), deps);
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.headers.authorization, `Bearer ${FAKE_JWT}`);
  const cookies = setCookies(res);
  assert.equal(cookies.length, 2);
  assert.ok(cookies.every((c) => c.includes('Max-Age=0') && c.includes('Path=/')));
});

test('logout: cross-site es 403; sin sesión igualmente limpia', async () => {
  const { deps } = mkDeps(() => jsonRes(200, {}));
  const evil = req('/api/auth/logout', { method: 'POST', headers: { origin: 'https://evil.test', ...session } });
  assert.equal((await handleLogout(evil, deps)).status, 403);
  const res = await handleLogout(req('/api/auth/logout', { method: 'POST', headers: sameOrigin }), deps);
  assert.equal(res.status, 200);
  assert.equal(setCookies(res).length, 2);
});

// ─── Utilidades ─────────────────────────────────────────────────────────────

test('jwtRemainingSeconds lee exp y cae a un plazo corto si el JWT es ilegible', () => {
  assert.equal(jwtRemainingSeconds(FAKE_JWT, NOW), 3600);
  assert.equal(jwtRemainingSeconds('basura', NOW), 12 * 60 * 60);
});

test('safeExternalUrl: solo https y host permitido', () => {
  const allowed = ['checkout.stripe.com'];
  assert.equal(
    safeExternalUrl('https://checkout.stripe.com/c/pay/cs_test_1', allowed),
    'https://checkout.stripe.com/c/pay/cs_test_1',
  );
  const bad = [
    'javascript:alert(1)',
    'data:text/html,x',
    'http://checkout.stripe.com/x',
    'https://checkout.stripe.com.evil.test/x',
    'https://evil.test/',
    'https://user:pw@checkout.stripe.com/',
    '//checkout.stripe.com',
    '',
    null,
    undefined,
    42,
  ];
  for (const b of bad) assert.equal(safeExternalUrl(b, allowed), null, String(b));
});

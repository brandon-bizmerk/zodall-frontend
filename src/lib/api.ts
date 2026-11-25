import {
  AuthResponse,
  UserProfile,
  TenantInfo,
  SubscriptionPlan,
  ApiKeyStatusResponse,
  GenerateApiKeyResponse,
  TenantMetricsData,
  AdminUserItem,
  AdminAuditLogsResponse,
} from '@/types/auth';
import { QueryHistoryItem, VerificationResult, ProofVerificationResult } from '@/types/compliance';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api/v1';

/** Clave que usaban versiones anteriores para guardar el JWT en localStorage (solo para limpiarla). */
const LEGACY_TOKEN_KEY = 'regtech_jwt_token';

/** Prefijo del BFF de Next.js: el navegador nunca habla con NestJS con el JWT. */
const BFF_PREFIX = '/api/bff';
const CSRF_COOKIE = 'zodall_csrf';

/** Evento que se emite cuando la API responde 401 (sesión vencida o revocada). */
export const SESSION_EXPIRED_EVENT = 'zodall:session-expired';

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// â”€â”€â”€ Token Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Borra el JWT que dejaron versiones anteriores en localStorage (migración suave). */
export function clearLegacyToken(): void {
  try {
    if (typeof window !== 'undefined') localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // almacenamiento no disponible
  }
}

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.split('; ').find((c) => c.startsWith(CSRF_COOKIE + '='));
  return match ? decodeURIComponent(match.slice(CSRF_COOKIE.length + 1)) : '';
}

// â”€â”€â”€ Generic Fetch Helper with Error Parsing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function parseError(response: Response): Promise<ApiError> {
  let errorMsg = `Error HTTP ${response.status}: ${response.statusText}`;
  let errorData: { message?: string | string[] } | undefined;
  try {
    errorData = await response.json();
    if (errorData?.message) {
      errorMsg = Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message;
    }
  } catch {
    // No JSON body
  }
  return new ApiError(errorMsg, response.status, errorData);
}

/** Petición autenticada al BFF: la cookie HttpOnly viaja sola; las mutaciones añaden el token CSRF. */
async function bffRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['x-csrf-token'] = getCsrfToken();

  const response = await fetch(`${BFF_PREFIX}${endpoint}`, {
    ...options,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      // Sesión vencida o revocada: el BFF ya borró las cookies; la UI vuelve al login.
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw await parseError(response);
  }
  return response;
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return (await bffRequest(endpoint, options)).json();
}

/** Login y registro: los atiende el BFF, que fija la cookie de sesión; no devuelven el JWT. */
async function authRequest(kind: 'login' | 'register', body: unknown): Promise<AuthResponse> {
  const response = await fetch(`/api/auth/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!response.ok) throw await parseError(response);
  return response.json();
}

// â”€â”€â”€ Auth API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function loginApi(email: string, password: string, recaptchaToken?: string): Promise<AuthResponse> {
  return authRequest('login', { email, password, ...(recaptchaToken ? { recaptcha_token: recaptchaToken } : {}) });
}

/** Cierra la sesión: el BFF borra la cookie aunque la API no responda. */
export async function logoutApi(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
}

export async function registerApi(payload: {
  company_name: string;
  full_name: string;
  email: string;
  password: string;
  country?: string;
  recaptcha_token?: string;
}): Promise<AuthResponse> {
  return authRequest('register', payload);
}

export async function getMeApi(): Promise<{ user: UserProfile; tenant: TenantInfo }> {
  return apiFetch<{ user: UserProfile; tenant: TenantInfo }>('/auth/me');
}

// â”€â”€â”€ Tenants & API Key Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getApiKeyStatusApi(): Promise<ApiKeyStatusResponse> {
  return apiFetch<ApiKeyStatusResponse>('/tenants/api-key');
}

/** Enlace de descarga del plugin de WordPress (firmado por la API para registrar el tenant). */
export async function getPluginDownloadApi(): Promise<{ url: string; firmado: boolean }> {
  return apiFetch<{ url: string; firmado: boolean }>('/tenants/plugin-download');
}

export async function generateApiKeyApi(): Promise<GenerateApiKeyResponse> {
  return apiFetch<GenerateApiKeyResponse>('/tenants/api-key/generate', {
    method: 'POST',
  });
}

export async function getPlansApi(): Promise<SubscriptionPlan[]> {
  return apiFetch<SubscriptionPlan[]>('/tenants/plans');
}

/**
 * Panel SuperAdmin: Actualiza el nombre, precio, lÃ­mite y caracterÃ­sticas de un plan
 * sincronizando automÃ¡ticamente en Stripe.
 */
export async function updatePlanAdminApi(
  planId: string,
  payload: {
    name: string;
    description?: string;
    price_monthly: number;
    query_limit: number;
    features: string[];
  }
): Promise<{ message: string; plan: SubscriptionPlan }> {
  return apiFetch<{ message: string; plan: SubscriptionPlan }>(`/tenants/admin/plans/${planId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function createStripeCheckoutSessionApi(plan_id: string): Promise<{ url: string; sessionId: string }> {
  return apiFetch<{ url: string; sessionId: string }>('/stripe/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ plan_id }),
  });
}


export async function upgradePlanApi(plan_id: string): Promise<{ message: string; plan: unknown }> {
  return apiFetch<{ message: string; plan: unknown }>('/tenants/upgrade-plan', {
    method: 'POST',
    body: JSON.stringify({ plan_id }),
  });
}

export async function getTenantMetricsApi(): Promise<TenantMetricsData> {
  return apiFetch<TenantMetricsData>('/tenants/metrics');
}

export async function getQueryHistoryApi(params?: {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  order?: string;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; limit: number; offset: number; data: QueryHistoryItem[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status && params.status !== 'all') query.append('status', params.status);
  if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
  if (params?.dateTo) query.append('dateTo', params.dateTo);
  if (params?.order) query.append('order', params.order);
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.offset) query.append('offset', String(params.offset));

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<{ total: number; limit: number; offset: number; data: QueryHistoryItem[] }>(
    `/tenants/query-history${qs}`
  );
}

// â”€â”€â”€ Health Check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function checkBackendHealth(): Promise<{ online: boolean; message?: string }> {
  try {
    const rootUrl = BACKEND_URL.replace(/\/v1\/?$/, '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(rootUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const text = await response.text();
      return { online: true, message: text || 'Online' };
    }
    return { online: false, message: `HTTP ${response.status}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No disponible';
    return { online: false, message };
  }
}

export async function verifyManualCompliance(payload: {
  queried_name?: string;
  queried_document?: string;
}): Promise<VerificationResult> {
  return apiFetch<VerificationResult>('/compliance/manual-verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyCompliance(
  payload: { queried_name: string; queried_document: string; order_reference?: string; strict_mode?: boolean },
  apiKey?: string
): Promise<VerificationResult> {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    throw new ApiError(
      'No se encontrÃ³ una API Key vÃ¡lida configurada. Por favor genera o copia tu clave en el mÃ³dulo de API Keys.',
      401
    );
  }

  const endpoint = `${BACKEND_URL}/compliance/verify`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cleanKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(errorData?.message || `HTTP Error ${res.status}`, res.status, errorData);
  }

  return res.json();
}

/**
 * Consulta de verificaciÃ³n de evidencia SAGRILAFT pÃºblica (Punto 9)
 */
export async function verifyProofApi(hash: string): Promise<ProofVerificationResult> {
  const cleanHash = (hash || '').trim();
  const endpoint = `${BACKEND_URL}/compliance/verify-proof/${cleanHash}`;
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(errorData?.message || `HTTP Error ${res.status}`, res.status, errorData);
  }

  return res.json();
}

/**
 * SuperAdmin: Obtener listado de usuarios clientes y sus empresas
 */
export async function getAdminUsersApi(): Promise<AdminUserItem[]> {
  return apiFetch<AdminUserItem[]>('/tenants/admin/users');
}

/**
 * SuperAdmin: Activar o desactivar cuenta de usuario cliente
 */
export async function toggleAdminUserStatusApi(userId: string): Promise<{ account_status: string }> {
  return apiFetch<{ account_status: string }>(`/tenants/admin/users/${userId}/toggle-status`, {
    method: 'PUT',
  });
}

/**
 * SuperAdmin: Obtener auditorÃ­a global de logs
 */
export async function getAdminAuditLogsApi(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  match_only?: boolean;
}): Promise<AdminAuditLogsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.offset) query.append('offset', String(params.offset));
  if (params?.search) query.append('search', params.search);
  if (params?.match_only !== undefined) query.append('match_only', String(params.match_only));

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<AdminAuditLogsResponse>(`/tenants/admin/audit-logs${qs}`);
}

/**
 * Actualizar perfil y/o contraseÃ±a del usuario autenticado
 */
export async function updateProfileApi(data: {
  full_name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
}): Promise<{ user: UserProfile }> {
  return apiFetch<{ user: UserProfile }>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Descarga el Reporte Completo de Historial del Cliente filtrado en formato PDF
 */
export async function downloadClientHistoryPdf(params?: {
  search?: string;
  match_only?: boolean;
}): Promise<void> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.match_only !== undefined) query.append('match_only', String(params.match_only));

  const qs = query.toString() ? `?${query.toString()}` : '';
  const endpoint = `/tenants/query-history/export-pdf${qs}`;

  let res: Response;
  try {
    res = await bffRequest(endpoint);
  } catch (err) {
    throw err instanceof ApiError ? new ApiError('Error al generar el reporte PDF del historial', err.statusCode) : err;
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `historial_consultas_zodall_${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

// â”€â”€â”€ Tipos para Event Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface EventLogItem {
  id: string;
  type: 'AUTH_EVENT' | 'API_KEY_EVENT' | 'SUBSCRIPTION_EVENT';
  action: string;
  tenant_id: string | null;
  tenant_name: string | null;
  user_email: string | null;
  status: 'SUCCESS' | 'ERROR' | 'WARN';
  ip_address: string | null;
  error_message: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface EventLogsResponse {
  total: number;
  limit: number;
  offset: number;
  data: EventLogItem[];
}

/**
 * SuperAdmin: Obtiene los event logs (logins, API keys, suscripciones)
 */
export async function getAdminEventLogsApi(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  type?: string;
}): Promise<EventLogsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.offset) query.append('offset', String(params.offset));
  if (params?.search) query.append('search', params.search);
  if (params?.type) query.append('type', params.type);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<EventLogsResponse>(`/tenants/admin/event-logs${qs}`);
}

/**
 * Descarga el Reporte Completo de AuditorÃ­a filtrado en formato PDF (SuperAdmin)
 */
export async function downloadFilteredAuditLogsPdf(params?: {
  search?: string;
  match_only?: boolean;
}): Promise<void> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.match_only !== undefined) query.append('match_only', String(params.match_only));

  const qs = query.toString() ? `?${query.toString()}` : '';
  const endpoint = `/tenants/admin/audit-logs/export-pdf${qs}`;

  let res: Response;
  try {
    res = await bffRequest(endpoint);
  } catch (err) {
    throw err instanceof ApiError ? new ApiError('Error al generar el reporte PDF', err.statusCode) : err;
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `reporte_auditoria_zodall_${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}


/**
 * Descarga el Certificado Oficial de Evidencia SAGRILAFT de un registro individual en PDF
 */
export async function downloadIndividualCertificatePdf(logId: string, documentNumber?: string): Promise<void> {
  const endpoint = `/tenants/audit-logs/${encodeURIComponent(logId)}/certificate-pdf`;

  let res: Response;
  try {
    res = await bffRequest(endpoint);
  } catch (err) {
    throw err instanceof ApiError ? new ApiError('Error al generar el certificado PDF', err.statusCode) : err;
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const docSuffix = documentNumber ? `_${documentNumber}` : '';
  a.download = `certificado_cumplimiento${docSuffix}_${logId.substring(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

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
import { QueryHistoryItem } from '@/types/compliance';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api/v1';

export const AUTH_TOKEN_KEY = 'regtech_jwt_token';
export const DEFAULT_API_KEY = 'rtk_live_supersecretkey12345';

export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// ─── Token Management ────────────────────────────────────────────────────────

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

// ─── Generic Fetch Helper with Error Parsing ─────────────────────────────────

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BACKEND_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401 && token) {
      // Token expirado o revocado: limpiar sesión para redirigir al login
      removeAuthToken();
    }

    let errorMsg = `Error HTTP ${response.status}: ${response.statusText}`;
    let errorData: any;
    try {
      errorData = await response.json();
      if (errorData?.message) {
        errorMsg = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message;
      }
    } catch {
      // No JSON body
    }
    throw new ApiError(errorMsg, response.status, errorData);
  }

  return response.json();
}

// ─── Auth API ────────────────────────────────────────────────────────────────

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function registerApi(payload: {
  company_name: string;
  full_name: string;
  email: string;
  password: string;
  country?: string;
}): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function getMeApi(): Promise<{ user: UserProfile; tenant: TenantInfo }> {
  return apiFetch<{ user: UserProfile; tenant: TenantInfo }>('/auth/me');
}

// ─── Tenants & API Key Management ────────────────────────────────────────────

export async function getApiKeyStatusApi(): Promise<ApiKeyStatusResponse> {
  return apiFetch<ApiKeyStatusResponse>('/tenants/api-key');
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
 * Panel SuperAdmin: Actualiza el nombre, precio, límite y características de un plan
 * sincronizando automáticamente en Stripe.
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

export async function verifyStripeSessionApi(session_id: string): Promise<{ success: boolean; plan: string; query_limit: number }> {
  return apiFetch<{ success: boolean; plan: string; query_limit: number }>(`/stripe/verify-session?session_id=${encodeURIComponent(session_id)}`);
}

export async function upgradePlanApi(plan_id: string): Promise<{ message: string; plan: any }> {
  return apiFetch<{ message: string; plan: any }>('/tenants/upgrade-plan', {
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

// ─── Health Check ────────────────────────────────────────────────────────────

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

export async function verifyCompliance(
  payload: { queried_name: string; queried_document: string; order_reference?: string; strict_mode?: boolean },
  apiKey?: string
): Promise<any> {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    throw new ApiError(
      'No se encontró una API Key válida configurada. Por favor genera o copia tu clave en el módulo de API Keys.',
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
 * Consulta de verificación de evidencia SAGRILAFT pública (Punto 9)
 */
export async function verifyProofApi(hash: string): Promise<any> {
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
export async function toggleAdminUserStatusApi(userId: string): Promise<any> {
  return apiFetch<any>(`/tenants/admin/users/${userId}/toggle-status`, {
    method: 'PUT',
  });
}

/**
 * SuperAdmin: Obtener auditoría global de logs
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
 * Actualizar perfil y/o contraseña del usuario autenticado
 */
export async function updateProfileApi(data: {
  full_name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
}): Promise<any> {
  return apiFetch<any>('/auth/profile', {
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
  const token = getAuthToken();
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.match_only !== undefined) query.append('match_only', String(params.match_only));

  const qs = query.toString() ? `?${query.toString()}` : '';
  const url = `${BACKEND_URL}/tenants/query-history/export-pdf${qs}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });

  if (!res.ok) {
    throw new ApiError('Error al generar el reporte PDF del historial', res.status);
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

/**
 * Descarga el Reporte Completo de Auditoría filtrado en formato PDF (SuperAdmin)
 */
export async function downloadFilteredAuditLogsPdf(params?: {
  search?: string;
  match_only?: boolean;
}): Promise<void> {
  const token = getAuthToken();
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.match_only !== undefined) query.append('match_only', String(params.match_only));

  const qs = query.toString() ? `?${query.toString()}` : '';
  const url = `${BACKEND_URL}/tenants/admin/audit-logs/export-pdf${qs}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });

  if (!res.ok) {
    throw new ApiError('Error al generar el reporte PDF', res.status);
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
  const token = getAuthToken();
  const url = `${BACKEND_URL}/tenants/audit-logs/${logId}/certificate-pdf`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });

  if (!res.ok) {
    throw new ApiError('Error al generar el certificado PDF', res.status);
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

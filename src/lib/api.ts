import {
  AuthResponse,
  UserProfile,
  TenantInfo,
  SubscriptionPlan,
  ApiKeyStatusResponse,
  GenerateApiKeyResponse,
  TenantMetricsData,
} from '@/types/auth';
import { QueryHistoryItem, VerificationResult } from '@/types/compliance';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api/v1';

export const AUTH_TOKEN_KEY = 'regtech_jwt_token';

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
    let errorMsg = `Error HTTP ${response.status}: ${response.statusText}`;
    let errorData: { message?: string | string[] } | undefined;
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

// El backend devuelve price_monthly como string ("19.00"); se normaliza aquí.
export async function getPlansApi(): Promise<SubscriptionPlan[]> {
  const plans = await apiFetch<Array<Omit<SubscriptionPlan, 'price_monthly'> & { price_monthly: number | string }>>(
    '/tenants/plans'
  );
  return plans.map((p) => ({ ...p, price_monthly: Number(p.price_monthly) }));
}

export async function upgradePlanApi(plan_id: string): Promise<{ message: string; plan: unknown }> {
  return apiFetch<{ message: string; plan: unknown }>('/tenants/upgrade-plan', {
    method: 'POST',
    body: JSON.stringify({ plan_id }),
  });
}

export async function createCheckoutSessionApi(
  plan_id: string
): Promise<{ url: string; sessionId: string }> {
  return apiFetch<{ url: string; sessionId: string }>('/stripe/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ plan_id }),
  });
}

export async function verifyCheckoutSessionApi(
  session_id: string
): Promise<{ success: boolean; plan: string; query_limit: number }> {
  return apiFetch<{ success: boolean; plan: string; query_limit: number }>(
    `/stripe/verify-session?session_id=${encodeURIComponent(session_id)}`
  );
}

export async function getQueryHistoryApi(
  limit = 100
): Promise<{ total: number; limit: number; offset: number; data: QueryHistoryItem[] }> {
  return apiFetch(`/tenants/query-history?limit=${limit}`);
}

export async function getTenantMetricsApi(): Promise<TenantMetricsData> {
  return apiFetch<TenantMetricsData>('/tenants/metrics');
}

// ─── Health Check ────────────────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<{ online: boolean; message?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return { online: true, message: 'Online' };
    }
    return { online: false, message: `HTTP ${response.status}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No disponible';
    return { online: false, message };
  }
}

export async function verifyCompliance(
  payload: { queried_name: string; queried_document: string; order_reference?: string },
  apiKey: string
): Promise<VerificationResult> {
  const endpoint = `${BACKEND_URL}/compliance/verify`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(errorData?.message || `HTTP Error ${res.status}`, res.status, errorData);
  }

  return res.json();
}

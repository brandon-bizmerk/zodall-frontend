export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  query_limit: number;
  features: string[];
  stripe_price_id?: string | null;
}

export interface TenantInfo {
  id: string;
  company_name: string;
  email: string;
  country?: string | null;
  account_status: string;
  plan_id: string;
  plan_name: string;
  price_monthly: number;
  query_count: number;
  query_limit: number;
  remaining_queries: number;
  has_api_key: boolean;
  api_key_prefix?: string | null;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  user: UserProfile;
  tenant: {
    id: string;
    company_name: string;
    plan: string;
    plan_id: string;
    query_count: number;
    query_limit: number;
    has_api_key?: boolean;
  };
}

export interface ApiKeyStatusResponse {
  has_api_key: boolean;
  api_key_prefix: string | null;
  last_generated?: string;
}

export interface GenerateApiKeyResponse {
  message: string;
  api_key: string;
  api_key_prefix: string;
}

export interface TenantMetricsData {
  company_name: string;
  email: string;
  account_status: string;
  plan_id: string;
  plan_name: string;
  price_monthly: number;
  query_count: number;
  query_limit: number;
  remaining_queries: number;
  usage_percentage: number;
  has_api_key: boolean;
  api_key_prefix?: string | null;
}

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  tenant: {
    id: string;
    company_name: string;
    account_status: string;
    plan_name: string;
    query_count: number;
    query_limit: number;
  } | null;
}

export interface AdminAuditLogItem {
  id: string;
  timestamp: string;
  tenant_name: string;
  tenant_id: string;
  queried_name: string;
  queried_document: string;
  order_reference?: string | null;
  match_found: boolean;
  match_score: number;
  response_time_ms: number;
  served_from_cache: boolean;
  integrity_proof_hash: string;
}

export interface AdminAuditLogsResponse {
  total: number;
  limit: number;
  offset: number;
  data: AdminAuditLogItem[];
}

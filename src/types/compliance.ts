export interface VerifyComplianceRequest {
  queried_name: string;
  queried_document: string;
  order_reference?: string;
}

export interface MatchedRecord {
  id: string;
  list_source: string;
  alert_type?: string | null;
  full_name: string;
}

export interface VerificationResult {
  match_found: boolean;
  match_score?: number;
  matched_record?: MatchedRecord;
  timeout_triggered: boolean;
  served_from_cache: boolean;
  response_time_ms: number;
  integrity_proof_hash: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  error?: string;
  message: string | string[];
  account_status?: string;
  query_count?: number;
  query_limit?: number;
}

export interface QueryHistoryItem extends VerificationResult {
  id: string;
  timestamp: string;
  queried_name: string;
  queried_document: string;
  order_reference?: string;
}

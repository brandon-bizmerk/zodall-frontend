export type MatchType = 'document' | 'name' | 'both' | 'none';
export type AlertType = 'individual' | 'entity' | 'pep';

export interface VerifyComplianceRequest {
  queried_name: string;
  queried_document: string;
  order_reference?: string;
  strict_mode?: boolean;
}

export interface MatchedRecord {
  id: string;
  list_source: string;
  alert_type: AlertType | string;
  match_type?: 'document' | 'name' | 'both';
  full_name: string;
  external_id?: string | null;
  description?: string | null;
}

export interface VerificationResult {
  match_found: boolean;
  match_type?: MatchType;
  match_score?: number;
  matched_record?: MatchedRecord | null;
  matched_records?: MatchedRecord[];
  timeout_triggered: boolean;
  served_from_cache: boolean;
  response_time_ms: number;
  integrity_proof_hash: string;
}

export interface ProofVerificationResult {
  valid: boolean;
  integrity_proof_hash: string;
  verification_date: string;
  match_found: boolean;
  match_score: number;
  order_reference: string | null;
  queried_entity: {
    masked_name: string;
    masked_document: string;
  };
  merchant: {
    id: string;
    company_name: string;
  };
  compliance_framework: {
    standard: string;
    custody_status: string;
    retention_guaranteed_years: number;
    retention_until: string;
  };
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

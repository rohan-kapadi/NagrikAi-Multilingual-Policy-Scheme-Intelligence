export interface CitizenProfile {
  age?: number | null;
  gender?: string | null;
  state?: string | null;
  district?: string | null;
  residence?: string | null;
  occupation?: string | null;
  annual_family_income?: number | null;
  caste_category?: string | null;
  land_holding_hectares?: number | null;
  education_level?: string | null;
  is_disabled?: boolean | null;
  is_bpl?: boolean | null;
  language?: string;
}

export interface SchemeCriterion {
  id: string;
  label: Record<string, string>;
  field: string;
  op: string;
  value: any;
  source_ref?: string;
}

export interface Scheme {
  id: string;
  name: Record<string, string>;
  level: string;
  state?: string | null;
  category: string[];
  summary: Record<string, string>;
  benefits: Record<string, string>;
  criteria: SchemeCriterion[];
  exclusions: SchemeCriterion[];
  required_documents: Record<string, string>[];
  how_to_apply: Record<string, string>;
  official_url: string;
  source_documents: any[];
  verified: boolean;
}

export interface CriterionResult {
  criterion_id: string;
  label: string;
  status: 'met' | 'not_met' | 'missing';
  user_value?: any;
  required: string;
}

export interface EligibilityResult {
  scheme_id: string;
  overall: 'eligible' | 'likely_eligible' | 'not_eligible' | 'need_more_info';
  criteria_results: CriterionResult[];
  missing_fields: string[];
  required_documents: string[];
  citations: any[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  language?: string;
  schemes?: Array<{ id: string; name: string; why_relevant: string }>;
  eligibility?: EligibilityResult[];
  citations?: Array<{ title: string; page?: number; section?: string; url: string }>;
  clarifying_question?: string | null;
}

export interface FilterState {
  rateType: string;
  loanPurpose: string;
  repaymentType: string;
  maxLvr: number;
  search: string;
  sortKey: "rate" | "comparison_rate" | "bank_name" | "product_name" | "rate_type" | "repayment_type" | "loan_purpose" | "lvr_max";
  sortAsc: boolean;
}

export interface RateRow {
  bank_name: string;
  brand_group: string;
  product_name: string;
  product_id: string;
  description: string;
  rate_type: string;
  rate: number;
  comparison_rate: number;
  repayment_type: string;
  loan_purpose: string;
  lvr_min: number;
  lvr_max: number;
  fixed_term: string;
  is_tailored: number;
  last_updated: string;
}

export interface BankSummary {
  bank_name: string;
  brand_group: string;
  product_count: number;
  best_variable_rate: number | null;
  best_fixed_rate: number | null;
  best_product_name: string;
}

export interface BankProduct {
  product_name: string;
  product_id: string;
  description: string;
  rate_type: string;
  rate: number;
  comparison_rate: number;
  repayment_type: string;
  loan_purpose: string;
  lvr_min: number;
  lvr_max: number;
  fixed_term: string;
  last_updated: string;
}

export interface RateTrendPoint {
  date: string;
  rate: number;
}

export interface DashboardStats {
  lowestVariable: number;
  lowestFixed: number;
  avgRate: number;
  bankCount: number;
  rateCount: number;
}

export interface RateDistributionBucket {
  bucket: string;
  variable: number;
  fixed: number;
}

export interface BestRateByBank {
  bank_name: string;
  rate: number;
  product_name: string;
}

export interface RateHistoryPoint {
  date: string;
  rate: number;
}

export interface MetaFile {
  generatedAt: string;
  bankCount: number;
  rateCount: number;
  dbSizeBytes: number;
}

export const DEFAULT_FILTERS: FilterState = {
  rateType: "",
  loanPurpose: "",
  repaymentType: "",
  maxLvr: 0,
  search: "",
  sortKey: "rate",
  sortAsc: true,
};

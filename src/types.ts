export interface MortgageRate {
  bankName: string;
  brandGroup: string;
  productName: string;
  productId: string;
  rateType: "VARIABLE" | "FIXED" | "INTRODUCTORY" | "DISCOUNT" | "BUNDLE_DISCOUNT_FIXED" | "BUNDLE_DISCOUNT_VARIABLE";
  rate: number;
  comparisonRate: number;
  repaymentType: "PRINCIPAL_AND_INTEREST" | "INTEREST_ONLY" | "OTHER" | "UNCONSTRAINED";
  loanPurpose: "OWNER_OCCUPIED" | "INVESTMENT" | "OTHER" | "UNCONSTRAINED";
  lvrMin: number;
  lvrMax: number;
  fixedTerm: string;
  isTailored: boolean;
  lastUpdated: string;
}

export interface RatesFile {
  metadata: {
    generatedAt: string;
    bankCount: number;
    rateCount: number;
  };
  rates: MortgageRate[];
}

export interface FilterState {
  rateType: string;
  loanPurpose: string;
  repaymentType: string;
  maxLvr: number;
  search: string;
}

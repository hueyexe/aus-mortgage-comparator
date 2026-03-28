import { useState } from "react";
import type { MortgageRate } from "../types";

interface RateTableProps {
  rates: MortgageRate[];
  total: number;
}

type SortKey = "rate" | "comparisonRate";

function formatRate(r: number) {
  return `${(r * 100).toFixed(2)}%`;
}

function formatLvr(min: number, max: number) {
  if (min === 0 && max === 0) return "—";
  if (min === 0) return `≤${(max * 100).toFixed(0)}%`;
  return `${(min * 100).toFixed(0)}–${(max * 100).toFixed(0)}%`;
}

function rateTypeLabel(r: MortgageRate) {
  const labels: Record<string, string> = {
    VARIABLE: "Variable",
    FIXED: "Fixed",
    INTRODUCTORY: "Intro",
    DISCOUNT: "Discount",
    BUNDLE_DISCOUNT_FIXED: "Bundle Fixed",
    BUNDLE_DISCOUNT_VARIABLE: "Bundle Var",
  };
  const base = labels[r.rateType] ?? r.rateType;
  return r.fixedTerm ? `${base} ${r.fixedTerm}` : base;
}

const REPAYMENT_LABELS: Record<string, string> = {
  PRINCIPAL_AND_INTEREST: "P&I",
  INTEREST_ONLY: "IO",
  OTHER: "Other",
  UNCONSTRAINED: "Any",
};

const PURPOSE_LABELS: Record<string, string> = {
  OWNER_OCCUPIED: "Owner Occ.",
  INVESTMENT: "Investment",
  OTHER: "Other",
  UNCONSTRAINED: "Any",
};

export default function RateTable({ rates, total }: RateTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("rate");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...rates].sort((a, b) => (sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const arrow = (key: SortKey) => sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  return (
    <div className="flex-1 flex flex-col">
      <p className="px-4 md:px-6 py-3 text-sm text-gray-500 bg-gray-50 border-b border-gray-200">
        Showing {rates.length} of {total} rates
      </p>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs sticky top-0">
            <tr>
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("rate")} aria-sort={sortKey === "rate" ? (sortAsc ? "ascending" : "descending") : "none"}>
                Rate{arrow("rate")}
              </th>
              <th className="px-4 py-3 cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("comparisonRate")} aria-sort={sortKey === "comparisonRate" ? (sortAsc ? "ascending" : "descending") : "none"}>
                Comparison{arrow("comparisonRate")}
              </th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Repayment</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3">LVR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.productId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-3 font-medium whitespace-nowrap">{r.brandGroup}</td>
                <td className="px-4 py-3">{r.productName}{r.isTailored && <span className="ml-1 text-xs text-amber-600">Tailored</span>}</td>
                <td className="px-4 py-3 font-semibold text-indigo-700">{formatRate(r.rate)}</td>
                <td className="px-4 py-3 text-gray-600">{formatRate(r.comparisonRate)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{rateTypeLabel(r)}</td>
                <td className="px-4 py-3">{REPAYMENT_LABELS[r.repaymentType]}</td>
                <td className="px-4 py-3">{PURPOSE_LABELS[r.loanPurpose]}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatLvr(r.lvrMin, r.lvrMax)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No rates match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

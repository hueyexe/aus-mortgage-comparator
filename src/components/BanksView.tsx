import { useState, useMemo, useCallback } from "react";
import type { Database } from "sql.js";
import type { FilterState, BankSummary, BankProduct } from "../types";
import { queryBanks, queryBankProducts } from "../db";

interface BanksViewProps {
  db: Database;
  onBankSelect?: (bankName: string) => void;
}

function formatRate(v: number | null): string {
  if (v == null) return "—";
  return `${(v * 100).toFixed(2)}%`;
}

export default function BanksView({ db, onBankSelect }: BanksViewProps) {
  const [expandedBank, setExpandedBank] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rateFilter, setRateFilter] = useState<"all" | "variable" | "fixed">("all");

  const banks = useMemo(() => queryBanks(db), [db]);

  const filteredBanks = useMemo(() => {
    let result = banks;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.bank_name.toLowerCase().includes(q) ||
          b.brand_group.toLowerCase().includes(q),
      );
    }
    if (rateFilter === "variable") {
      result = result.filter((b) => b.best_variable_rate != null);
    } else if (rateFilter === "fixed") {
      result = result.filter((b) => b.best_fixed_rate != null);
    }
    return result;
  }, [banks, search, rateFilter]);

  const toggleBank = useCallback(
    (bankName: string) => {
      setExpandedBank((prev) => {
        const next = prev === bankName ? null : bankName;
        onBankSelect?.(next ?? "");
        return next;
      });
    },
    [onBankSelect],
  );

  return (
    <div>
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search banks…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
          {(["all", "variable", "fixed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setRateFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                rateFilter === f
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {f === "all" ? "All" : f === "variable" ? "Variable" : "Fixed"}
            </button>
          ))}
        </div>
      </div>

      {/* Bank list */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {/* Header row */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
          <div className="col-span-4">Bank</div>
          <div className="col-span-2 text-right">Best Variable</div>
          <div className="col-span-2 text-right">Best Fixed</div>
          <div className="col-span-2 text-right">Products</div>
          <div className="col-span-2 text-right">Best Product</div>
        </div>

        {filteredBanks.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No banks match your search.
          </div>
        )}

        {filteredBanks.map((bank) => (
          <BankRow
            key={bank.bank_name}
            bank={bank}
            isExpanded={expandedBank === bank.bank_name}
            onToggle={() => toggleBank(bank.bank_name)}
            db={db}
          />
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        {filteredBanks.length} banks · Click a bank to see all products
      </div>
    </div>
  );
}

interface BankRowProps {
  bank: BankSummary;
  isExpanded: boolean;
  onToggle: () => void;
  db: Database;
}

function BankRow({ bank, isExpanded, onToggle, db }: BankRowProps) {
  const products = useMemo(
    () => (isExpanded ? queryBankProducts(db, bank.bank_name) : []),
    [db, bank.bank_name, isExpanded],
  );

  const groupedProducts = useMemo(() => {
    const groups: Record<string, BankProduct[]> = {};
    for (const p of products) {
      if (!groups[p.product_name]) groups[p.product_name] = [];
      groups[p.product_name].push(p);
    }
    return groups;
  }, [products]);

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-900/50"
        aria-expanded={isExpanded}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
          <div className="md:col-span-4">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {bank.bank_name}
              </span>
            </div>
          </div>
          <div className="md:col-span-2 md:text-right">
            <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatRate(bank.best_variable_rate)}
            </span>
          </div>
          <div className="md:col-span-2 md:text-right">
            <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatRate(bank.best_fixed_rate)}
            </span>
          </div>
          <div className="md:col-span-2 md:text-right">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {bank.product_count}
            </span>
          </div>
          <div className="md:col-span-2 md:text-right">
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate block">
              {bank.best_product_name}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded products */}
      {isExpanded && (
        <div className="bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800">
          {Object.entries(groupedProducts).map(([productName, productGroup]) => (
            <div
              key={productName}
              className="border-b border-gray-100 dark:border-gray-800 last:border-b-0"
            >
              <div className="px-4 py-2 md:px-12">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {productName}
                </div>
                {productGroup[0].description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {productGroup[0].description}
                  </div>
                )}
              </div>
              {/* Product rate variants */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-4 md:px-12 py-1.5 font-medium">Type</th>
                      <th className="text-right px-4 py-1.5 font-medium">Rate</th>
                      <th className="text-right px-4 py-1.5 font-medium">Comparison</th>
                      <th className="text-right px-4 py-1.5 font-medium hidden sm:table-cell">Repayment</th>
                      <th className="text-right px-4 py-1.5 font-medium hidden sm:table-cell">Purpose</th>
                      <th className="text-right px-4 py-1.5 font-medium hidden md:table-cell">LVR</th>
                      {productGroup.some((p) => p.fixed_term) && (
                        <th className="text-right px-4 py-1.5 font-medium hidden md:table-cell">Term</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {productGroup.map((p, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-50 dark:border-gray-800/50 last:border-b-0 hover:bg-white dark:hover:bg-gray-900/50"
                      >
                        <td className="px-4 md:px-12 py-1.5">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${
                              p.rate_type === "VARIABLE" ||
                              p.rate_type === "BUNDLE_DISCOUNT_VARIABLE" ||
                              p.rate_type === "INTRODUCTORY"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {p.rate_type === "BUNDLE_DISCOUNT_VARIABLE"
                              ? "Bundle Var"
                              : p.rate_type === "BUNDLE_DISCOUNT_FIXED"
                                ? "Bundle Fix"
                                : p.rate_type === "INTRODUCTORY"
                                  ? "Intro"
                                  : p.rate_type === "VARIABLE"
                                    ? "Variable"
                                    : "Fixed"}
                          </span>
                        </td>
                        <td className="px-4 py-1.5 text-right font-mono font-semibold text-gray-900 dark:text-gray-100">
                          {(p.rate * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-1.5 text-right font-mono text-gray-500 dark:text-gray-400">
                          {(p.comparison_rate * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-1.5 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                          {p.repayment_type === "PRINCIPAL_AND_INTEREST"
                            ? "P&I"
                            : p.repayment_type === "INTEREST_ONLY"
                              ? "IO"
                              : p.repayment_type}
                        </td>
                        <td className="px-4 py-1.5 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                          {p.loan_purpose === "OWNER_OCCUPIED"
                            ? "Owner"
                            : p.loan_purpose === "INVESTMENT"
                              ? "Invest"
                              : p.loan_purpose}
                        </td>
                        <td className="px-4 py-1.5 text-right text-gray-500 dark:text-gray-400 hidden md:table-cell">
                          {p.lvr_max > 0 ? `${(p.lvr_max * 100).toFixed(0)}%` : "—"}
                        </td>
                        {productGroup.some((pp) => pp.fixed_term) && (
                          <td className="px-4 py-1.5 text-right text-gray-500 dark:text-gray-400 hidden md:table-cell">
                            {p.fixed_term || "—"}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

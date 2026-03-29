import { useState, useMemo } from "react";
import type { Database } from "sql.js";
import { queryBestRatesByBank, queryRates } from "../db";
import type { RateRow } from "../types";
import { DEFAULT_FILTERS } from "../types";

interface CompareDrawerProps {
  db: Database;
  isOpen: boolean;
  onClose: () => void;
}

export default function CompareDrawer({ db, isOpen, onClose }: CompareDrawerProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const banks = useMemo(() => {
    return queryBestRatesByBank(db, 100).map((b) => b.bank_name);
  }, [db]);

  const compared = useMemo(() => {
    if (selected.length === 0) return [];
    return selected.map((bank) => {
      const rates = queryRates(db, { ...DEFAULT_FILTERS, search: bank });
      const best = rates.reduce<Record<string, RateRow>>((acc, r) => {
        const key = r.rate_type.includes("FIXED") ? "fixed" : "variable";
        if (!acc[key] || r.rate < acc[key].rate) acc[key] = r;
        return acc;
      }, {});
      return { bank, best };
    });
  }, [db, selected]);

  const toggle = (bank: string) => {
    setSelected((prev) =>
      prev.includes(bank) ? prev.filter((b) => b !== bank) : prev.length < 3 ? [...prev, bank] : prev
    );
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-gray-950 z-50 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold">Compare Banks</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            aria-label="Close comparison drawer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Select up to 3 banks to compare ({selected.length}/3)
          </p>

          {/* Bank selector */}
          <div className="flex flex-wrap gap-2 mb-6 max-h-48 overflow-y-auto">
            {banks.map((bank) => (
              <button
                key={bank}
                onClick={() => toggle(bank)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                  selected.includes(bank)
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                } ${!selected.includes(bank) && selected.length >= 3 ? "opacity-40 cursor-not-allowed" : ""}`}
                disabled={!selected.includes(bank) && selected.length >= 3}
              >
                {bank}
              </button>
            ))}
          </div>

          {/* Comparison */}
          {compared.length > 0 && (
            <div className="space-y-4">
              {compared.map(({ bank, best }) => (
                <div key={bank} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <h3 className="font-semibold text-sm mb-3">{bank}</h3>
                  {Object.entries(best).map(([type, row]) => (
                    <div key={type} className="flex items-center justify-between py-1.5 border-t border-gray-100 dark:border-gray-800 first:border-0">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                          type === "fixed"
                            ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                        }`}>
                          {type === "fixed" ? "Fixed" : "Variable"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{row.product_name}</span>
                      </div>
                      <span className="font-bold font-mono text-sm">{(row.rate * 100).toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {selected.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
              Select banks above to compare their best rates
            </div>
          )}
        </div>
      </div>
    </>
  );
}

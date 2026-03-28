import { useState, useEffect, useMemo } from "react";
import type { RatesFile, FilterState, MortgageRate } from "./types";
import Header from "./components/Header";
import Filters from "./components/Filters";
import RateTable from "./components/RateTable";

const VARIABLE_TYPES = new Set(["VARIABLE", "INTRODUCTORY", "DISCOUNT", "BUNDLE_DISCOUNT_VARIABLE"]);
const FIXED_TYPES = new Set(["FIXED", "BUNDLE_DISCOUNT_FIXED"]);

function applyFilters(rates: MortgageRate[], f: FilterState): MortgageRate[] {
  return rates.filter((r) => {
    if (f.rateType === "VARIABLE" && !VARIABLE_TYPES.has(r.rateType)) return false;
    if (f.rateType === "FIXED" && !FIXED_TYPES.has(r.rateType)) return false;
    if (f.loanPurpose && r.loanPurpose !== f.loanPurpose && r.loanPurpose !== "UNCONSTRAINED") return false;
    if (f.repaymentType && r.repaymentType !== f.repaymentType && r.repaymentType !== "UNCONSTRAINED") return false;
    if (f.maxLvr > 0 && r.lvrMax !== 0 && r.lvrMax > f.maxLvr) return false;
    if (f.search) {
      const q = f.search.toLowerCase();
      if (!r.bankName.toLowerCase().includes(q) && !r.productName.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

const DEFAULT_FILTERS: FilterState = { rateType: "", loanPurpose: "", repaymentType: "", maxLvr: 0, search: "" };

export default function App() {
  const [data, setData] = useState<RatesFile | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "rates.json")
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => (data ? applyFilters(data.rates, filters) : []), [data, filters]);

  if (error) return <div className="flex items-center justify-center h-screen text-red-600">Failed to load rates: {error}</div>;
  if (!data) return <div className="flex items-center justify-center h-screen text-gray-500">Loading rates…</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header generatedAt={data.metadata.generatedAt} bankCount={data.metadata.bankCount} rateCount={data.metadata.rateCount} />
      <Filters filters={filters} onChange={setFilters} />
      <RateTable rates={filtered} total={data.rates.length} />
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import type { Database } from "sql.js";
import type { MetaFile } from "./types";
import { initDB, queryRates, queryDashboardStats, queryRateDistribution, queryBestRatesByBank } from "./db";
import { useUrlFilters } from "./hooks/useUrlState";
import Header from "./components/Header";
import Filters from "./components/Filters";
import RateTable from "./components/RateTable";
import LoadingSkeleton from "./components/LoadingSkeleton";

const Dashboard = lazy(() => import("./components/Dashboard"));
const CompareDrawer = lazy(() => import("./components/CompareDrawer"));

export default function App() {
  const [db, setDb] = useState<Database | null>(null);
  const [meta, setMeta] = useState<MetaFile | null>(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useUrlFilters();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      initDB(),
      fetch(import.meta.env.BASE_URL + "meta.json").then((r) => r.json()),
    ])
      .then(([database, metaData]) => {
        setDb(database);
        setMeta(metaData as MetaFile);
      })
      .catch((e) => setError(e.message));
  }, []);

  const stats = useMemo(() => (db ? queryDashboardStats(db) : null), [db]);
  const distribution = useMemo(() => (db ? queryRateDistribution(db) : []), [db]);
  const bestRates = useMemo(() => (db ? queryBestRatesByBank(db, 12) : []), [db]);
  const rates = useMemo(() => (db ? queryRates(db, filters) : []), [db, filters]);
  const totalRates = useMemo(() => (db ? queryRates(db, { ...filters, search: "", rateType: "", loanPurpose: "", repaymentType: "", maxLvr: 0 }).length : 0), [db, filters]);

  const handleSort = useCallback((key: "rate" | "comparison_rate") => {
    setFilters({
      ...filters,
      sortKey: key,
      sortAsc: filters.sortKey === key ? !filters.sortAsc : true,
    });
  }, [filters, setFilters]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <div className="text-center p-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-600 dark:text-red-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">Failed to load</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!db) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Header meta={meta} />
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />)}</div>}>
          <Dashboard stats={stats} distribution={distribution} bestRates={bestRates} />
        </Suspense>
        <Filters filters={filters} onChange={setFilters} total={totalRates} filtered={rates.length} />
        <RateTable rates={rates} filters={filters} onSort={handleSort} />
      </main>

      {/* Compare FAB */}
      {db && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-6 right-6 px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 z-30"
          aria-label="Compare banks"
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Compare
          </span>
        </button>
      )}

      {db && (
        <Suspense fallback={null}>
          <CompareDrawer db={db} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

import type { FilterState } from "../types";

interface FiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500 ${
        active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

const LVR_OPTIONS = [
  { label: "Any", value: 0 },
  { label: "≤60%", value: 0.6 },
  { label: "≤70%", value: 0.7 },
  { label: "≤80%", value: 0.8 },
  { label: "≤90%", value: 0.9 },
  { label: "≤95%", value: 0.95 },
];

export default function Filters({ filters, onChange }: FiltersProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="p-4 md:p-6 bg-white border-b border-gray-200 space-y-4">
      <div className="flex flex-col md:flex-row md:flex-wrap gap-4">
        <fieldset className="space-y-1">
          <legend className="text-xs font-semibold text-gray-500 uppercase">Rate Type</legend>
          <div className="flex gap-1.5" role="group" aria-label="Rate type filter">
            {([["", "All"], ["VARIABLE", "Variable"], ["FIXED", "Fixed"]] as const).map(([val, label]) => (
              <Pill key={val} label={label} active={filters.rateType === val} onClick={() => set({ rateType: val })} />
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-1">
          <legend className="text-xs font-semibold text-gray-500 uppercase">Loan Purpose</legend>
          <div className="flex gap-1.5" role="group" aria-label="Loan purpose filter">
            {([["", "All"], ["OWNER_OCCUPIED", "Owner Occupier"], ["INVESTMENT", "Investment"]] as const).map(([val, label]) => (
              <Pill key={val} label={label} active={filters.loanPurpose === val} onClick={() => set({ loanPurpose: val })} />
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-1">
          <legend className="text-xs font-semibold text-gray-500 uppercase">Repayment</legend>
          <div className="flex gap-1.5" role="group" aria-label="Repayment type filter">
            {([["", "All"], ["PRINCIPAL_AND_INTEREST", "P&I"], ["INTEREST_ONLY", "Interest Only"]] as const).map(([val, label]) => (
              <Pill key={val} label={label} active={filters.repaymentType === val} onClick={() => set({ repaymentType: val })} />
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-1">
          <legend className="text-xs font-semibold text-gray-500 uppercase">Max LVR</legend>
          <div className="flex gap-1.5" role="group" aria-label="Max LVR filter">
            {LVR_OPTIONS.map(({ label, value }) => (
              <Pill key={value} label={label} active={filters.maxLvr === value} onClick={() => set({ maxLvr: value })} />
            ))}
          </div>
        </fieldset>
      </div>

      <div>
        <label htmlFor="search" className="sr-only">Search by bank or product name</label>
        <input
          id="search"
          type="text"
          placeholder="Search bank or product name…"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-2 focus:outline-indigo-500"
        />
      </div>
    </div>
  );
}

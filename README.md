# Australian Mortgage Rate Comparator

Compare home loan rates from 65+ Australian banks, updated every 6 hours from official open banking data.

https://hueyexe.github.io/aus-mortgage-comparator/

## What is this?

Australian banks are required by law to publish their mortgage rates through the [Consumer Data Right (CDR)](https://www.cdr.gov.au/) APIs. This project pulls those rates automatically and puts them in a searchable, filterable table.

You can filter by variable/fixed, owner occupier/investment, P&I/interest only, LVR bracket, and bank name. Rates are sortable by interest rate or comparison rate.

There's also a dashboard with charts showing rate distribution across the market and the cheapest rates by bank.

## Not financial advice

Rates shown here are the advertised rates banks publish through CDR. The rate you'd actually get depends on your circumstances. Check with the lender directly and get independent advice before making decisions.

## How it works

A Go program runs every 6 hours via GitHub Actions. It queries the CDR Register to find all participating banks, fetches their mortgage products, and writes the results to a SQLite database. The React frontend loads that database in the browser using sql.js (SQLite compiled to WebAssembly) and runs SQL queries for filtering and sorting.

The whole thing is static — no backend server, just files on GitHub Pages.

```
CDR Register --> Go aggregator --> rates.db (SQLite) --> GitHub Pages
                (every 6h)        meta.json              Browser loads DB via WASM
                                                         SQL queries power the UI
```

## Data source

All rates come from the [Consumer Data Standards](https://consumerdatastandardsaustralia.github.io/standards/) APIs. Public endpoints, no authentication, no scraping.

---

## Development

### Prerequisites

- [Bun](https://bun.sh/) — frontend package manager
- [Go 1.26+](https://go.dev/dl/) — aggregator
- [golangci-lint v2](https://golangci-lint.run/welcome/install/) — Go linting

### Quick start

```sh
git clone https://github.com/hueyexe/aus-mortgage-comparator.git
cd aus-mortgage-comparator

# frontend
bun install
bun run dev

# aggregator (optional — a rates.db is already committed)
cd aggregator
go run .
```

### Commands

```sh
# frontend
bun run build        # typecheck + production build
bun run lint         # eslint

# go
cd aggregator
go build ./...
golangci-lint run ./...
```

### Project layout

```
aggregator/
  main.go            entry point, concurrency
  register.go        CDR Register API client
  products.go        bank product/rate fetching
  db.go              SQLite write operations
  meta.go            meta.json export
  types.go           type definitions
  .golangci.yml      linter config (v2)
src/
  App.tsx            root component, DB init
  db.ts              sql.js wrapper, query functions
  ThemeProvider.tsx   dark/light mode
  types.ts           shared interfaces
  hooks/
    useUrlState.ts   filter state <-> URL params
  components/
    Header.tsx
    Dashboard.tsx    stats cards + recharts
    Filters.tsx      filter pills + search
    RateTable.tsx    virtualized table / mobile cards
    CompareDrawer.tsx
    LoadingSkeleton.tsx
.github/workflows/
  update-rates.yml   fetch rates every 6h
  deploy.yml         build + deploy to GitHub Pages
```

### Tech

- React + TypeScript + Vite + Tailwind CSS v4
- sql.js (SQLite in the browser via WASM)
- Recharts for data viz
- @tanstack/react-virtual for table virtualization
- Go 1.26 + modernc.org/sqlite for the aggregator
- Bun as package manager

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to submit changes. [AGENTS.md](AGENTS.md) has the full code style guide.

## License

[MIT](LICENSE)

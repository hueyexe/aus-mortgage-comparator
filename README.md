# Australian Mortgage Rate Comparator

A free, open source tool that compares residential mortgage rates from Australian banks. Data is sourced directly from the [Consumer Data Right (CDR)](https://www.cdr.gov.au/) open banking APIs — the same regulated data banks are required to publish.

**[View the live site](https://hueyexe.github.io/aus-mortgage-comparator/)**

## What This Does

Australian banks publish their mortgage rates through government-mandated open banking APIs. This project collects those rates automatically every 6 hours and presents them in a simple, searchable table.

You can filter by:
- **Rate type** — Variable or Fixed
- **Loan purpose** — Owner Occupier or Investment
- **Repayment type** — Principal & Interest or Interest Only
- **Maximum LVR** — 60%, 70%, 80%, 90%, or 95%
- **Bank or product name** — free text search

Rates are sortable by interest rate or comparison rate to help you find the best deal.

## Important Disclaimer

This tool is for **informational purposes only**. It is not financial advice. Rates shown are the advertised rates published by banks through the CDR APIs and may not reflect the rate you would actually receive. Always confirm rates directly with the lender and consider seeking independent financial advice before making any decisions.

---

## How It Works

```
CDR Register API          Bank CDR APIs              GitHub Pages
(discover banks)    -->   (fetch mortgage rates)  --> (static website)
       |                         |                         |
   Go aggregator            Go aggregator            React frontend
   (every 6 hours via GitHub Actions)                (reads rates.json)
```

1. A **Go program** queries the CDR Register to discover all participating banks
2. It then fetches residential mortgage products and rates from each bank's public API
3. The rates are normalised into a single `rates.json` file
4. A **GitHub Actions** workflow runs this every 6 hours and commits the updated data
5. A **React frontend** loads the JSON and provides filtering, sorting, and search

No backend server is needed — the entire site is static and hosted free on GitHub Pages.

## Data Source

All rate data comes from the [Consumer Data Standards](https://consumerdatastandardsaustralia.github.io/standards/) APIs. These are public, unauthenticated endpoints that Australian banks are legally required to maintain under the CDR regime. No scraping, no manual data entry — just official open banking data.

---

## For Developers

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS v4 |
| Data aggregator | Go 1.26 |
| Package manager | Bun |
| Linting | ESLint (frontend), golangci-lint v2 (Go) |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

### Quick Start

```sh
# Clone
git clone https://github.com/hueyexe/aus-mortgage-comparator.git
cd aus-mortgage-comparator

# Frontend
bun install
bun run dev              # dev server at localhost:5173

# Go aggregator
cd aggregator
go build ./...           # compile
go run .                 # fetch live rates → ../public/rates.json
golangci-lint run ./...  # lint
```

A sample `public/rates.json` is committed so the frontend works immediately without running the aggregator.

### Project Structure

```
aggregator/              Go data aggregator (CDR API client)
  main.go                CLI entry point, concurrency
  register.go            Bank discovery via CDR Register
  products.go            Product/rate fetching and normalisation
  types.go               All type definitions
  .golangci.yml          Linter config
src/                     React frontend
  App.tsx                Root component, data loading, filter logic
  types.ts               Shared TypeScript interfaces
  components/
    Header.tsx           App header with metadata
    Filters.tsx          Filter pill controls
    RateTable.tsx        Sortable data table
.github/workflows/
  update-rates.yml       Cron: fetch rates every 6 hours
  deploy.yml             Build + deploy to GitHub Pages
```

### Build & Lint

```sh
# Frontend
bun run build            # typecheck (tsc) + vite build
bun run lint             # eslint

# Go
cd aggregator
go build ./...
golangci-lint run ./...
```

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, code conventions, and how to submit a pull request.

For detailed code style guidelines (useful for AI coding agents and new contributors), see [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)

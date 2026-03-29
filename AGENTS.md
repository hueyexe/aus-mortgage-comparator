# AGENTS.md

## Project Overview

Australian mortgage rate comparator. Two codebases in one repo:
1. **Go data aggregator** (`aggregator/`) — CLI that fetches CDR open banking APIs and writes `public/rates.db` (SQLite) + `public/meta.json`
2. **React frontend** (repo root) — Vite + React + TypeScript + Tailwind CSS v4 SPA that loads the SQLite DB via sql.js (WASM) in the browser

## Build & Run Commands

### Frontend (React + Vite)

Package manager is **bun** (not npm/yarn/pnpm).

```sh
bun install          # install dependencies
bun run build        # typecheck (tsc -b) then vite build → dist/
bun run dev          # local dev server
bun run preview      # preview production build
bun run lint         # eslint across all .ts/.tsx files
```

No test framework is configured yet. If adding tests, use vitest:
```sh
bun add -d vitest
bun run vitest run              # run all tests
bun run vitest run src/App.test.tsx  # run a single test file
```

### Go Aggregator

```sh
cd aggregator
go build ./...       # compile check
go run .             # run aggregator, writes ../public/rates.db + ../public/meta.json
go test ./...        # run all tests (none yet)
go test -run TestFoo # run a single test
go mod tidy          # sync dependencies
golangci-lint run ./...  # lint (v2 config in aggregator/.golangci.yml)
```

Dependencies: `golang.org/x/sync`, `modernc.org/sqlite`. Go version: 1.26. Linter: golangci-lint v2.

### CI Workflows

- `.github/workflows/update-rates.yml` — runs `go run .` in aggregator/ every 6h, commits rates.db + meta.json if changed
- `.github/workflows/deploy.yml` — `bun run build`, deploys dist/ to GitHub Pages on push to main

## Architecture — Data Flow

```
CDR Register API → Go aggregator → public/rates.db (SQLite)
                                 → public/meta.json (tiny metadata)
                                        ↓
                              Vite build copies to dist/
                                        ↓
                              Browser fetches rates.db
                              sql.js WASM loads it
                              SQL queries power all filtering/sorting
```

### SQLite Schema
- `snapshots` table — one row per aggregator run (fetched_at, bank_count, rate_count)
- `rates` table — one row per rate entry, FK to snapshot_id
- Indexes on (snapshot_id, rate_type, repayment_type, loan_purpose, lvr_max, rate) for fast filtered queries
- Historical snapshots retained for 30 days (pruned each run)

### Frontend Data Layer
- `src/db.ts` — sql.js wrapper with typed query functions (queryRates, queryDashboardStats, queryRateDistribution, queryBestRatesByBank, queryRateHistory)
- All filtering/sorting happens via parameterized SQL — no JS array filtering
- `src/hooks/useUrlState.ts` — filter state synced to URL search params

## Code Style — TypeScript / React

### Formatting & Syntax
- Double quotes for strings in TSX/TS files
- Semicolons at end of statements
- 2-space indentation
- `verbatimModuleSyntax` is enabled — use `import type` for type-only imports
- Target: ES2023, JSX: react-jsx

### Imports
- Use `import type { X }` for type-only imports (enforced by verbatimModuleSyntax)
- React hooks from `"react"`, types from `"./types"`, components from `"./components/X"`
- Database functions from `"./db"`, theme from `"./ThemeProvider"`
- No path aliases configured — use relative paths

```tsx
import { useState, useEffect, useMemo } from "react";
import type { Database } from "sql.js";
import type { FilterState, RateRow, MetaFile } from "./types";
import { initDB, queryRates } from "./db";
import { useTheme } from "./ThemeProvider";
```

### Components
- Default exports for components: `export default function ComponentName()`
- Functional components only, no classes
- Props interfaces defined inline above the component in the same file
- No separate props files — keep interface next to the component

### Types
- Shared types in `src/types.ts`, exported as named interfaces
- DB row types use snake_case to match SQLite columns: `RateRow.bank_name`
- Use string literal unions for enums: `"VARIABLE" | "FIXED" | ...`
- No TypeScript enums — use string unions or `Record<string, string>` lookup maps
- Strict mode enabled: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`

### State & Data
- `useState` / `useMemo` for local state — no Redux or external state management
- SQLite DB loaded once via `initDB()` in `useEffect`, stored in `useState<Database | null>`
- Queries run synchronously via sql.js — wrap in `useMemo` keyed on filter state
- Use `import.meta.env.BASE_URL` prefix when fetching static assets
- Filter state synced to URL via `useUrlFilters()` hook

### Styling
- Tailwind CSS v4 via `@tailwindcss/vite` plugin — no tailwind.config.js
- All styling via utility classes in className strings
- Dark mode via `dark:` variant classes + ThemeProvider context
- Color scheme: indigo/violet for primary, gray for neutral
- Responsive: `md:` breakpoint prefix for desktop layouts
- Active/inactive states on interactive elements (filled vs outlined pills)
- Custom theme colors defined in `src/index.css` via `@theme` block

### Error Handling
- Early return for error/loading states in components
- Graceful handling of missing data (optional chaining, fallback values)
- Loading skeleton component shown while DB initializes

## Code Style — Go

### Formatting
- `gofmt` standard formatting (tabs, no config needed)
- All files in `package main` (single binary)

### Naming
- Exported types: PascalCase (`MortgageRate`, `BankBrand`)
- Unexported helpers: camelCase (`fetchProducts`, `fetchBankRates`)
- JSON tags: camelCase (`json:"bankName"`)
- Constants: camelCase for unexported (`userAgent`), PascalCase for exported

### Types
- CDR API response types mirror the JSON structure with `json` struct tags
- `MortgageRate` struct is the normalized output written to SQLite
- Embed structs for API type extension: `BankingProductDetailV7` embeds `BankingProductV6`
- Use `float64` for rates/LVR values, `string` for dates and ISO durations

### Error Handling
- Return `(result, error)` pairs from all functions that can fail
- Wrap errors with `fmt.Errorf("context: %w", err)`
- In main: log errors to stderr with `fmt.Fprintf(os.Stderr, ...)`
- Skip individual bank/product failures gracefully — don't abort the whole run
- Use `errgroup` with `g.SetLimit(10)` for concurrent fetching
- Use separate context for errgroup vs DB operations (errgroup cancels its context)

### HTTP Requests
- Set `x-v` header on all CDR API requests (version negotiation)
- Set `x-min-v` header for fallback version support
- Retry with lower API version on 406 (Not Acceptable)
- Custom `RoundTripper` for global User-Agent header
- Per-bank timeout: 30s. Register timeout: 60s.

### Structure
- `types.go` — all struct definitions (output + API response types)
- `register.go` — CDR Register API client (bank discovery)
- `products.go` — bank product/rate fetching and normalization
- `db.go` — SQLite database operations (schema, write, prune, optimize)
- `meta.go` — meta.json export
- `main.go` — CLI entry point, concurrency orchestration

### Dependencies
- `golang.org/x/sync/errgroup` — concurrent bank fetching
- `modernc.org/sqlite` — pure Go SQLite driver (no CGO)
- Use stdlib for HTTP, JSON, file I/O

## File Layout

```
aggregator/          # Go data aggregator
  main.go            # CLI entry, concurrency, orchestration
  register.go        # CDR Register API client
  products.go        # Bank products/rates client
  db.go              # SQLite write operations
  meta.go            # meta.json export
  types.go           # All type definitions
  .golangci.yml      # Linter config (v2)
  go.mod
public/
  rates.db           # SQLite database (committed by CI)
  meta.json          # Tiny metadata file for fast initial load
src/
  main.tsx           # React entry point (wrapped in ThemeProvider)
  App.tsx            # Root component, DB init, layout orchestration
  db.ts              # sql.js wrapper, typed query functions
  types.ts           # Shared TypeScript interfaces
  ThemeProvider.tsx   # Dark/light mode context + toggle
  index.css          # Tailwind import + @theme color tokens
  hooks/
    useUrlState.ts   # Filter state ↔ URL search params sync
  components/
    Header.tsx       # Gradient header with dark mode toggle
    Dashboard.tsx    # Stats cards + Recharts visualizations
    Filters.tsx      # Sticky filter bar with pills + search
    RateTable.tsx    # Virtualized table (desktop) / cards (mobile)
    CompareDrawer.tsx # Bank comparison side panel
    LoadingSkeleton.tsx # Animated loading placeholder
.github/workflows/
  update-rates.yml   # Cron: fetch rates every 6h → rates.db
  deploy.yml         # Build + deploy to GitHub Pages
```

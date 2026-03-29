# Contributing

Thanks for your interest in contributing! This project is open source under the MIT license and we welcome contributions of all kinds.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (frontend package manager)
- [Go 1.26+](https://go.dev/dl/) (data aggregator)
- [golangci-lint v2](https://golangci-lint.run/welcome/install/) (Go linting)

### Setup

```sh
# Clone the repo
git clone https://github.com/hueyexe/aus-mortgage-comparator.git
cd aus-mortgage-comparator

# Frontend
bun install
bun run dev          # starts dev server at localhost:5173

# Go aggregator
cd aggregator
go build ./...       # verify it compiles
```

The frontend loads `public/rates.json` at runtime. A sample file with test data is already committed, so the dev server works out of the box.

## Making Changes

### Frontend (React + TypeScript + Tailwind)

```sh
bun run dev          # dev server with hot reload
bun run build        # typecheck + production build
bun run lint         # eslint
```

Key conventions:
- Use **bun**, not npm/yarn/pnpm
- Double quotes, semicolons, 2-space indent
- `import type` for type-only imports (enforced by `verbatimModuleSyntax`)
- Default exports for components, props interfaces inline in the same file
- Tailwind utility classes only — no custom CSS

### Go Aggregator

```sh
cd aggregator
go build ./...              # compile check
golangci-lint run ./...     # lint (must pass before PR)
go test ./...               # run tests
go test -run TestFoo        # run a single test
```

Key conventions:
- `gofmt` formatting (tabs)
- Wrap errors with `fmt.Errorf("context: %w", err)`
- Skip individual bank failures gracefully — never abort the whole run
- Minimise external dependencies (currently only `golang.org/x/sync`)

See [AGENTS.md](AGENTS.md) for the full code style guide.

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure both builds pass:
   ```sh
   bun run build
   cd aggregator && go build ./... && golangci-lint run ./...
   ```
4. Open a pull request with a clear description of what you changed and why

### What We're Looking For

- Bug fixes and reliability improvements
- Better handling of edge cases in CDR API responses
- UI/UX improvements (accessibility, mobile experience, new filter options)
- Performance optimisations
- Documentation improvements
- Additional bank coverage or data enrichment

### Good First Issues

Look for issues labelled `good first issue` — these are scoped tasks suitable for newcomers to the codebase.

## Reporting Issues

If you find a bug or have a feature request, please [open an issue](https://github.com/hueyexe/aus-mortgage-comparator/issues). Include:
- What you expected to happen
- What actually happened
- Steps to reproduce (if applicable)
- Browser/OS details for frontend issues

## Code of Conduct

Be respectful and constructive. We're all here to build something useful for Australian mortgage borrowers.

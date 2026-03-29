# Contributing

MIT licensed, contributions welcome.

## Setup

You need [Bun](https://bun.sh/), [Go 1.26+](https://go.dev/dl/), and [golangci-lint v2](https://golangci-lint.run/welcome/install/).

```sh
git clone https://github.com/hueyexe/aus-mortgage-comparator.git
cd aus-mortgage-comparator

bun install
bun run dev          # frontend dev server

cd aggregator
go build ./...       # check it compiles
```

A `rates.db` is already committed so the frontend works without running the aggregator.

## Making changes

### Frontend

```sh
bun run dev          # dev server with hot reload
bun run build        # typecheck + build
bun run lint         # eslint
```

Conventions: bun (not npm), double quotes, semicolons, 2-space indent, `import type` for type-only imports, default exports for components, Tailwind utility classes only.

### Go aggregator

```sh
cd aggregator
go build ./...
golangci-lint run ./...     # must pass
go test ./...
```

Conventions: gofmt, wrap errors with `fmt.Errorf("context: %w", err)`, skip individual bank failures gracefully, minimise external deps.

Full style guide in [AGENTS.md](AGENTS.md).

## Pull requests

PRs go to `main`. Squash merge only. Branches auto-delete after merge.

1. Fork and branch from `main`
2. Make your changes
3. Check both builds pass:
   ```sh
   bun run build
   cd aggregator && go build ./... && golangci-lint run ./...
   ```
4. Open a PR describing what changed and why

## What's useful to work on

- Bug fixes
- CDR API edge case handling (lots of banks return weird data)
- UI/UX improvements, especially mobile
- Accessibility
- Performance
- Docs

Issues labelled `good first issue` are a good starting point.

## Reporting bugs

[Open an issue](https://github.com/hueyexe/aus-mortgage-comparator/issues) with what you expected, what happened, and steps to reproduce.

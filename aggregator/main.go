package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"
)

const userAgent = "aus-mortgage-comparator/1.0"

type uaTransport struct {
	rt http.RoundTripper
}

func (t *uaTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("User-Agent", userAgent)
	return t.rt.RoundTrip(req)
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	ctx := context.Background()

	transport := &uaTransport{rt: http.DefaultTransport}
	regClient := &http.Client{Transport: transport, Timeout: 60 * time.Second}

	brands, err := fetchBankBrands(ctx, regClient)
	if err != nil {
		return fmt.Errorf("fetching bank brands: %w", err)
	}
	fmt.Fprintf(os.Stderr, "Found %d bank brands\n", len(brands))

	var (
		mu       sync.Mutex
		allRates []MortgageRate
		errCount int
		bankSet  = make(map[string]bool)
	)

	g, gCtx := errgroup.WithContext(ctx)
	g.SetLimit(10)

	for _, b := range brands {
		b := b
		g.Go(func() error {
			bankClient := &http.Client{Transport: transport, Timeout: 30 * time.Second}
			rates, err := fetchBankRates(gCtx, bankClient, b)
			mu.Lock()
			defer mu.Unlock()
			if err != nil {
				fmt.Fprintf(os.Stderr, "error fetching %s: %v\n", b.BrandName, err)
				errCount++
				return nil // skip, don't fail the group
			}
			allRates = append(allRates, rates...)
			if len(rates) > 0 {
				bankSet[b.BrandName] = true
			}
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return err
	}

	sort.Slice(allRates, func(i, j int) bool {
		return allRates[i].Rate < allRates[j].Rate
	})

	exe, _ := os.Executable()
	repoRoot := filepath.Dir(filepath.Dir(exe))
	outDir := filepath.Join(repoRoot, "public")

	// If run via `go run`, use working directory heuristic
	if wd, err := os.Getwd(); err == nil {
		if filepath.Base(wd) == "aggregator" {
			outDir = filepath.Join(filepath.Dir(wd), "public")
		} else {
			outDir = filepath.Join(wd, "public")
		}
	}

	if err := os.MkdirAll(outDir, 0o750); err != nil {
		return fmt.Errorf("creating output dir: %w", err)
	}

	dbPath := filepath.Join(outDir, "rates.db")
	db, err := openDB(ctx, dbPath)
	if err != nil {
		return fmt.Errorf("opening database: %w", err)
	}

	if err := writeSnapshot(ctx, db, allRates, len(bankSet), errCount); err != nil {
		_ = db.Close()
		return fmt.Errorf("writing snapshot: %w", err)
	}

	if err := pruneOldSnapshots(ctx, db, 30); err != nil {
		_ = db.Close()
		return fmt.Errorf("pruning old snapshots: %w", err)
	}

	if err := optimizeDB(ctx, db); err != nil {
		_ = db.Close()
		return fmt.Errorf("optimizing database: %w", err)
	}

	if err := db.Close(); err != nil {
		return fmt.Errorf("closing database: %w", err)
	}

	fi, err := os.Stat(dbPath)
	if err != nil {
		return fmt.Errorf("stat database: %w", err)
	}

	if err := writeMeta(filepath.Join(outDir, "meta.json"), MetaFile{
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
		BankCount:   len(bankSet),
		RateCount:   len(allRates),
		DBSizeBytes: fi.Size(),
	}); err != nil {
		return fmt.Errorf("writing meta: %w", err)
	}

	fmt.Printf("Fetched %d rates from %d banks (%d errors)\n", len(allRates), len(bankSet), errCount)
	return nil
}

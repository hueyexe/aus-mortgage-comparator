package main

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

const schema = `
CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fetched_at TEXT NOT NULL,
  bank_count INTEGER NOT NULL,
  rate_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_id INTEGER NOT NULL,
  bank_name TEXT NOT NULL,
  brand_group TEXT NOT NULL DEFAULT '',
  product_name TEXT NOT NULL,
  product_id TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  rate_type TEXT NOT NULL,
  rate REAL NOT NULL,
  comparison_rate REAL NOT NULL DEFAULT 0,
  repayment_type TEXT NOT NULL DEFAULT '',
  loan_purpose TEXT NOT NULL DEFAULT '',
  lvr_min REAL NOT NULL DEFAULT 0,
  lvr_max REAL NOT NULL DEFAULT 0,
  fixed_term TEXT NOT NULL DEFAULT '',
  is_tailored INTEGER NOT NULL DEFAULT 0,
  last_updated TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (snapshot_id) REFERENCES snapshots(id)
);

CREATE INDEX IF NOT EXISTS idx_rates_snapshot ON rates(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_rates_filter ON rates(snapshot_id, rate_type, repayment_type, loan_purpose, lvr_max, rate);
CREATE INDEX IF NOT EXISTS idx_rates_search ON rates(snapshot_id, bank_name, product_name);
`

func openDB(ctx context.Context, path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("opening database: %w", err)
	}
	for _, pragma := range []string{
		"PRAGMA journal_mode=WAL",
		"PRAGMA page_size=4096",
	} {
		if _, err := db.ExecContext(ctx, pragma); err != nil {
			_ = db.Close()
			return nil, fmt.Errorf("setting %s: %w", pragma, err)
		}
	}
	if _, err := db.ExecContext(ctx, schema); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("creating schema: %w", err)
	}
	return db, nil
}

func writeSnapshot(ctx context.Context, db *sql.DB, rates []MortgageRate, bankCount, errCount int) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("beginning transaction: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	var snapshotID int64
	err = tx.QueryRowContext(ctx,
		`INSERT INTO snapshots (fetched_at, bank_count, rate_count, error_count) VALUES (?, ?, ?, ?) RETURNING id`,
		time.Now().UTC().Format(time.RFC3339), bankCount, len(rates), errCount,
	).Scan(&snapshotID)
	if err != nil {
		return fmt.Errorf("inserting snapshot: %w", err)
	}

	stmt, err := tx.PrepareContext(ctx, `INSERT INTO rates (snapshot_id, bank_name, brand_group, product_name, product_id, description, rate_type, rate, comparison_rate, repayment_type, loan_purpose, lvr_min, lvr_max, fixed_term, is_tailored, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		return fmt.Errorf("preparing statement: %w", err)
	}
	defer stmt.Close()

	for _, r := range rates {
		tailored := 0
		if r.IsTailored {
			tailored = 1
		}
		if _, err := stmt.ExecContext(ctx, snapshotID, r.BankName, r.BrandGroup, r.ProductName, r.ProductID, r.Description, r.RateType, r.Rate, r.ComparisonRate, r.RepaymentType, r.LoanPurpose, r.LvrMin, r.LvrMax, r.FixedTerm, tailored, r.LastUpdated); err != nil {
			return fmt.Errorf("inserting rate: %w", err)
		}
	}

	return tx.Commit()
}

func pruneOldSnapshots(ctx context.Context, db *sql.DB, keepDays int) error {
	cutoff := time.Now().UTC().AddDate(0, 0, -keepDays).Format(time.RFC3339)
	if _, err := db.ExecContext(ctx, `DELETE FROM rates WHERE snapshot_id IN (SELECT id FROM snapshots WHERE fetched_at < ?)`, cutoff); err != nil {
		return fmt.Errorf("pruning old rates: %w", err)
	}
	if _, err := db.ExecContext(ctx, `DELETE FROM snapshots WHERE fetched_at < ?`, cutoff); err != nil {
		return fmt.Errorf("pruning old snapshots: %w", err)
	}
	return nil
}

func optimizeDB(ctx context.Context, db *sql.DB) error {
	if _, err := db.ExecContext(ctx, `PRAGMA journal_mode=delete`); err != nil {
		return fmt.Errorf("setting journal_mode=delete: %w", err)
	}
	if _, err := db.ExecContext(ctx, `VACUUM`); err != nil {
		return fmt.Errorf("vacuuming: %w", err)
	}
	return nil
}

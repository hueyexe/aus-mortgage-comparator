import initSqlJs from "sql.js";
import type { Database } from "sql.js";
import type {
  FilterState,
  RateRow,
  RateHistoryPoint,
  DashboardStats,
  RateDistributionBucket,
  BestRateByBank,
} from "./types";

let db: Database | null = null;

export async function initDB(): Promise<Database> {
  if (db) return db;

  const [SQL, buf] = await Promise.all([
    initSqlJs({
      locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
    }),
    fetch(`${import.meta.env.BASE_URL}rates.db`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load database: ${r.statusText}`);
      return r.arrayBuffer();
    }),
  ]);

  db = new SQL.Database(new Uint8Array(buf));
  return db;
}

const VARIABLE_TYPES = "'VARIABLE','INTRODUCTORY','BUNDLE_DISCOUNT_VARIABLE'";
const FIXED_TYPES = "'FIXED','BUNDLE_DISCOUNT_FIXED'";

function latestSnapshotId(db: Database): number | null {
  const r = db.exec("SELECT id FROM snapshots ORDER BY id DESC LIMIT 1");
  if (!r.length || !r[0].values.length) return null;
  return r[0].values[0][0] as number;
}

export function queryRates(db: Database, filters: FilterState): RateRow[] {
  const sid = latestSnapshotId(db);
  if (sid === null) return [];

  const conditions: string[] = ["snapshot_id = ?"];
  const params: (string | number)[] = [sid];

  if (filters.rateType === "VARIABLE") {
    conditions.push(`rate_type IN (${VARIABLE_TYPES})`);
  } else if (filters.rateType === "FIXED") {
    conditions.push(`rate_type IN (${FIXED_TYPES})`);
  }

  if (filters.loanPurpose) {
    conditions.push("(loan_purpose = ? OR loan_purpose = 'UNCONSTRAINED')");
    params.push(filters.loanPurpose);
  }

  if (filters.repaymentType) {
    conditions.push("(repayment_type = ? OR repayment_type = 'UNCONSTRAINED')");
    params.push(filters.repaymentType);
  }

  if (filters.maxLvr > 0) {
    conditions.push("(lvr_max <= ? OR lvr_max = 0)");
    params.push(filters.maxLvr);
  }

  if (filters.search) {
    conditions.push("(bank_name LIKE ? OR product_name LIKE ?)");
    const q = `%${filters.search}%`;
    params.push(q, q);
  }

  const orderCol = filters.sortKey === "comparison_rate" ? "comparison_rate" : "rate";
  const orderDir = filters.sortAsc ? "ASC" : "DESC";

  const sql = `SELECT * FROM rates WHERE ${conditions.join(" AND ")} ORDER BY ${orderCol} ${orderDir}`;

  const result = db.exec(sql, params);
  if (!result.length) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as RateRow;
  });
}

export function queryRateHistory(
  db: Database,
  productId: string,
  rateType: string,
  repaymentType: string,
  loanPurpose: string,
): RateHistoryPoint[] {
  const sql = `
    SELECT s.fetched_at as date, r.rate
    FROM rates r
    JOIN snapshots s ON r.snapshot_id = s.id
    WHERE r.product_id = ? AND r.rate_type = ? AND r.repayment_type = ? AND r.loan_purpose = ?
    ORDER BY s.fetched_at ASC
  `;
  const result = db.exec(sql, [productId, rateType, repaymentType, loanPurpose]);
  if (!result.length) return [];
  return result[0].values.map((row) => ({
    date: row[0] as string,
    rate: row[1] as number,
  }));
}

export function queryDashboardStats(db: Database): DashboardStats {
  const sid = latestSnapshotId(db);
  if (sid === null) return { lowestVariable: 0, lowestFixed: 0, avgRate: 0, bankCount: 0, rateCount: 0 };

  const stats = db.exec(
    `
    SELECT
      MIN(CASE WHEN rate_type IN (${VARIABLE_TYPES}) THEN rate END) as lowest_var,
      MIN(CASE WHEN rate_type IN (${FIXED_TYPES}) THEN rate END) as lowest_fixed,
      AVG(rate) as avg_rate,
      COUNT(DISTINCT bank_name) as bank_count,
      COUNT(*) as rate_count
    FROM rates WHERE snapshot_id = ?
  `,
    [sid],
  );

  if (!stats.length) return { lowestVariable: 0, lowestFixed: 0, avgRate: 0, bankCount: 0, rateCount: 0 };
  const row = stats[0].values[0];
  return {
    lowestVariable: (row[0] as number) || 0,
    lowestFixed: (row[1] as number) || 0,
    avgRate: (row[2] as number) || 0,
    bankCount: (row[3] as number) || 0,
    rateCount: (row[4] as number) || 0,
  };
}

export function queryRateDistribution(db: Database): RateDistributionBucket[] {
  const sid = latestSnapshotId(db);
  if (sid === null) return [];

  const result = db.exec(
    `
    SELECT
      CAST(ROUND(rate * 200) / 200.0 AS TEXT) || '-' || CAST((ROUND(rate * 200) + 1) / 200.0 AS TEXT) as bucket_label,
      ROUND(rate * 200) / 200.0 as bucket_start,
      SUM(CASE WHEN rate_type IN (${VARIABLE_TYPES}) THEN 1 ELSE 0 END) as variable_count,
      SUM(CASE WHEN rate_type IN (${FIXED_TYPES}) THEN 1 ELSE 0 END) as fixed_count
    FROM rates
    WHERE snapshot_id = ? AND rate > 0.03
    GROUP BY bucket_start
    ORDER BY bucket_start
  `,
    [sid],
  );

  if (!result.length) return [];
  return result[0].values.map((row) => ({
    bucket: `${((row[1] as number) * 100).toFixed(1)}%`,
    variable: row[2] as number,
    fixed: row[3] as number,
  }));
}

export function queryBestRatesByBank(db: Database, limit: number = 15): BestRateByBank[] {
  const sid = latestSnapshotId(db);
  if (sid === null) return [];

  const result = db.exec(
    `
    SELECT bank_name, MIN(rate) as best_rate, product_name
    FROM rates
    WHERE snapshot_id = ? AND rate > 0.03
    GROUP BY bank_name
    ORDER BY best_rate ASC
    LIMIT ?
  `,
    [sid, limit],
  );

  if (!result.length) return [];
  return result[0].values.map((row) => ({
    bank_name: row[0] as string,
    rate: row[1] as number,
    product_name: row[2] as string,
  }));
}

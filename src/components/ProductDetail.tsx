import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import type { Database } from "sql.js";
import { queryProductById } from "../db";

interface ProductDetailProps {
  db: Database;
}

function formatRate(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

export default function ProductDetail({ db }: ProductDetailProps) {
  const { productId = "" } = useParams<{ productId: string }>();
  const products = useMemo(() => queryProductById(db, productId), [db, productId]);

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400 text-sm">No product found.</p>
        <Link to="/banks" className="text-primary-600 dark:text-primary-400 text-sm mt-2 inline-block hover:underline">
          ← Back to all banks
        </Link>
      </div>
    );
  }

  const product = products[0];

  return (
    <div className="max-w-3xl">
      <Link to={`/bank/${encodeURIComponent(product.bank_name)}`} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2 inline-block">
        ← Back to {product.bank_name}
      </Link>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{product.product_name}</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{product.description || "No description available."}</p>
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-gray-500 dark:text-gray-400">Rate</div>
          <div className="font-mono font-semibold text-lg text-gray-900 dark:text-gray-100">{formatRate(product.rate)}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-gray-500 dark:text-gray-400">Comparison</div>
          <div className="font-mono font-semibold text-lg text-gray-900 dark:text-gray-100">{formatRate(product.comparison_rate)}</div>
        </div>
      </div>
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-900 dark:to-violet-900 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-80 bg-white/20 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-white/10 rounded mt-3 animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded mt-3 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-gray-50 dark:bg-gray-900 p-4 md:p-6 h-80">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
              <div className="h-full bg-gray-200/50 dark:bg-gray-800/50 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Filter bar skeleton */}
        <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 p-4">
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        {/* Table rows skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-50 dark:bg-gray-900 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OralHygieneLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-28 space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="h-12 bg-surface rounded-xl w-48" />

      {/* Today's status cards */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl h-24" />
        ))}
      </div>

      {/* Streak + stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-2xl h-20 col-span-2 sm:col-span-1" />
        <div className="grid grid-cols-2 gap-3 col-span-2 sm:col-span-1">
          <div className="bg-surface rounded-2xl h-20" />
          <div className="bg-surface rounded-2xl h-20" />
        </div>
      </div>

      {/* Log form */}
      <div className="bg-surface rounded-2xl h-64" />

      {/* Recent logs */}
      <div className="bg-surface rounded-2xl h-48" />

      {/* Chart */}
      <div className="bg-surface rounded-2xl h-48" />
    </div>
  )
}

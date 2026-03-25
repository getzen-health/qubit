export default function DashboardLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 bg-surface rounded-lg w-40" />
        <div className="h-8 w-8 bg-surface rounded-full" />
      </div>

      {/* Recovery ring + score */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="h-40 w-40 bg-surface rounded-full" />
        <div className="h-5 bg-surface rounded w-32" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl p-4 h-24" />
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="bg-surface rounded-2xl p-4 h-48" />

      {/* Insights strip */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl h-14" />
        ))}
      </div>
    </div>
  )
}

export default function SleepLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {/* Header */}
      <div className="h-7 bg-surface rounded-lg w-36 mb-6" />

      {/* Sleep score ring */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="h-36 w-36 bg-surface rounded-full" />
        <div className="h-5 bg-surface rounded w-28" />
      </div>

      {/* Stage breakdown bar */}
      <div className="bg-surface rounded-2xl p-4 h-20" />

      {/* Recent nights list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl h-16" />
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-surface rounded-2xl p-4 h-44" />
    </div>
  )
}

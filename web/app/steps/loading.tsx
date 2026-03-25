export default function StepsLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {/* Header */}
      <div className="h-7 bg-surface rounded-lg w-28 mb-6" />

      {/* Big step count */}
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="h-12 bg-surface rounded-lg w-40" />
        <div className="h-4 bg-surface rounded w-24" />
      </div>

      {/* Progress bar towards goal */}
      <div className="bg-surface rounded-full h-3 w-full" />

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl p-4 h-20" />
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-surface rounded-2xl p-4 h-48" />

      {/* Weekly breakdown */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl h-12" />
        ))}
      </div>
    </div>
  )
}

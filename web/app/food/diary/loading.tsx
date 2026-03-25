export default function FoodDiaryLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {/* Date nav */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 bg-surface rounded-xl" />
        <div className="h-5 bg-surface rounded w-32" />
        <div className="h-8 w-8 bg-surface rounded-xl" />
      </div>

      {/* Macro summary grid */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl h-20 border-t-4 border-surface-alt" />
        ))}
      </div>

      {/* Meal sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl p-4 space-y-3">
          <div className="h-4 bg-surface-alt rounded w-24" />
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="h-12 bg-surface-alt rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  )
}

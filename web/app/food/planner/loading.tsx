export default function MealPlannerLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 bg-surface rounded-xl" />
        <div className="h-5 bg-surface rounded w-48" />
        <div className="h-8 w-8 bg-surface rounded-xl" />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px] space-y-2">
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-14 bg-surface rounded-xl" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, row) => (
            <div key={row}>
              <div className="h-3 bg-surface rounded w-20 mb-1 mx-1" />
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 7 }).map((_, col) => (
                  <div key={col} className="h-24 bg-surface rounded-xl" />
                ))}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-12 bg-surface rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

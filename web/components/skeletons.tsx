export function ReadinessBannerSkeleton() {
  return (
    <div className="animate-pulse mb-4 rounded-2xl bg-surface border border-border p-4 h-20" />
  )
}

export function DashboardDataSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-4 animate-pulse">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="h-40 w-40 bg-surface rounded-full" />
        <div className="h-5 bg-surface rounded w-32" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl p-4 h-24" />
        ))}
      </div>
      <div className="bg-surface rounded-2xl p-4 h-48" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl h-14" />
        ))}
      </div>
    </div>
  )
}

export function ReadyPageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="h-36 w-36 bg-surface rounded-full" />
        <div className="h-5 bg-surface rounded w-28" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl p-4 h-20" />
        ))}
      </div>
      <div className="bg-surface rounded-2xl p-4 h-48" />
    </div>
  )
}

export function TrendsPageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl p-4 h-32" />
        ))}
      </div>
      <div className="bg-surface rounded-2xl p-4 h-48" />
    </div>
  )
}

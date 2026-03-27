/** Single shimmer block — use as the building brick for all skeleton layouts */
function Bone({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ''}`} />
}

export function ReadinessBannerSkeleton() {
  return (
    <div className="mb-4 rounded-2xl border border-border p-4 h-20 overflow-hidden">
      <Bone className="h-full w-full rounded-2xl" />
    </div>
  )
}

export function DashboardDataSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-5">
      {/* Readiness card skeleton */}
      <Bone className="h-32 w-full rounded-2xl" />

      {/* Metric card grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border p-5 space-y-3 bg-surface">
            <div className="flex items-center justify-between">
              <Bone className="h-3 w-16 rounded" />
              <Bone className="h-4 w-4 rounded-md" />
            </div>
            <Bone className="h-8 w-24 rounded" />
            <Bone className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <Bone className="h-52 w-full rounded-2xl" />

      {/* List skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export function ReadyPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <Bone className="h-52 w-full rounded-2xl" />
    </div>
  )
}

export function TrendsPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
      <Bone className="h-52 w-full rounded-2xl" />
    </div>
  )
}

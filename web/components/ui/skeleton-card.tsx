export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-border p-4 animate-pulse space-y-3">
      <div className="h-4 bg-muted rounded w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-muted rounded" style={{ width: `${70 + i * 10}%` }} />
      ))}
    </div>
  )
}

export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded h-4 ${className}`} />
}

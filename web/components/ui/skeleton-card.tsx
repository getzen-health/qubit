export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-surface rounded-2xl p-4 h-24" />
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
  return <div className={`animate-pulse bg-surface rounded h-4 ${className}`} />
}

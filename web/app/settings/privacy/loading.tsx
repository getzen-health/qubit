export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      <div className="h-7 bg-surface rounded-lg w-48 mb-8" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-xl p-4 space-y-3 border border-border">
          <div className="h-4 bg-surface-secondary rounded w-32" />
          <div className="h-10 bg-surface-secondary rounded" />
        </div>
      ))}
    </div>
  )
}

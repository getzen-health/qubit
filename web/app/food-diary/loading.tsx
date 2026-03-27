export default function Loading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-7 bg-surface rounded-lg w-36 mb-6" />
      <div className="bg-surface rounded-2xl h-28" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl h-16" />
        ))}
      </div>
      <div className="bg-surface rounded-2xl h-48" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-7 bg-surface rounded-lg w-48 mb-6" />
      <div className="bg-surface rounded-2xl h-40" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl h-24" />
        ))}
      </div>
      <div className="bg-surface rounded-2xl h-64" />
      <div className="bg-surface rounded-2xl h-32" />
    </div>
  )
}

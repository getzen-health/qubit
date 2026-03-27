export default function Loading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-7 bg-surface rounded-lg w-44 mb-6" />
      <div className="bg-surface rounded-2xl h-36" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl h-20" />
        ))}
      </div>
      <div className="bg-surface rounded-2xl h-56" />
    </div>
  )
}

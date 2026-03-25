export default function VitalsLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-7 bg-surface rounded-lg w-32 mb-6" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl h-28" />
        ))}
      </div>
      <div className="bg-surface rounded-2xl h-48" />
      <div className="bg-surface rounded-2xl h-48" />
    </div>
  )
}

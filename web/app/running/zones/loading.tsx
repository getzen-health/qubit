export default function RunningZonesLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-7 bg-surface rounded-lg w-44 mb-6" />
      <div className="bg-surface rounded-2xl h-16" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl h-14" />
      ))}
      <div className="bg-surface rounded-2xl h-44 mt-4" />
    </div>
  )
}

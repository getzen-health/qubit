export default function WaterLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-7 bg-surface rounded-lg w-32 mb-6" />
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="h-36 w-36 bg-surface rounded-full" />
        <div className="h-5 bg-surface rounded w-24" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl h-12" />
        ))}
      </div>
      <div className="bg-surface rounded-2xl h-44" />
    </div>
  )
}

export default function HistoryLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-3 animate-pulse">
      <div className="h-7 bg-surface rounded-lg w-36 mb-4" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl h-20" />
      ))}
    </div>
  )
}

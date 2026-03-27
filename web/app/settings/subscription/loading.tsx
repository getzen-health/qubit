export default function Loading() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-surface rounded-xl w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-4">
        <div className="h-8 bg-surface-secondary rounded-lg animate-pulse w-48" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-secondary rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-surface-secondary rounded-xl animate-pulse" />
        <div className="h-48 bg-surface-secondary rounded-xl animate-pulse" />
      </div>
    </div>
  )
}

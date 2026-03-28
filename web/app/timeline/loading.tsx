export default function Loading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-7 bg-muted rounded-lg w-40 mb-6" />
      <div className="bg-muted rounded-2xl h-32" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted rounded-2xl h-16" />
        ))}
      </div>
      <div className="bg-muted rounded-2xl h-48" />
    </div>
  )
}

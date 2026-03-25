export default function SocialLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-7 bg-surface rounded-lg w-24 mb-4" />
      {/* Tab bar skeleton */}
      <div className="h-10 bg-surface rounded-xl" />
      {/* Friend cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-xl h-16 border border-border" />
      ))}
    </div>
  )
}

export default function HabitsLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-7 bg-surface rounded-lg w-28 mb-6" />
      <div className="bg-surface rounded-2xl h-14" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl h-24" />
      ))}
      <div className="bg-surface rounded-2xl h-12 mt-4" />
    </div>
  )
}

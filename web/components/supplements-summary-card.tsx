interface SupplementsSummaryProps { taken: number; total?: number }
export function SupplementsSummaryCard({ taken, total = 8 }: SupplementsSummaryProps) {
  return (
    <a href="/supplements" className="block rounded-xl border border-border p-4 hover:border-primary transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">💊 Supplements</span>
        <span className="text-xs text-muted-foreground">{taken}/{total}</span>
      </div>
      <p className="text-2xl font-bold">{taken}<span className="text-sm text-muted-foreground font-normal">/{total} taken</span></p>
      <div className="mt-2 h-1.5 bg-muted rounded-full">
        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.round((taken/total)*100)}%` }} />
      </div>
      <p className="text-xs text-muted-foreground mt-1">Today&apos;s supplements</p>
    </a>
  )
}

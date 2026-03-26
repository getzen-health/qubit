const MOOD_EMOJIS = ['😔','😞','😕','😐','🙂','😊','😄','😁','🤩','🥳']
interface MoodSummaryProps { todayScore?: number; weekAvg?: number }
export function MoodSummaryCard({ todayScore, weekAvg }: MoodSummaryProps) {
  return (
    <a href="/mood" className="block rounded-xl border border-border p-4 hover:border-primary transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">😊 Mood</span>
        <span className="text-xs text-muted-foreground">today</span>
      </div>
      <p className="text-2xl font-bold">
        {todayScore ? MOOD_EMOJIS[todayScore - 1] : '—'}
        <span className="text-sm text-muted-foreground font-normal ml-1">{todayScore ? `${todayScore}/10` : 'Not logged'}</span>
      </p>
      {weekAvg && <p className="text-xs text-muted-foreground mt-1">7-day avg: {weekAvg.toFixed(1)}/10</p>}
    </a>
  )
}

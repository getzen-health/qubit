import Link from 'next/link'
import { Smile } from 'lucide-react'

const MOOD_EMOJIS = ['😔', '😞', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥳']
const MOOD_LABELS = ['Very Low', 'Low', 'Below Avg', 'Neutral', 'Okay', 'Good', 'Great', 'Excellent', 'Amazing', 'Peak']

interface MoodSummaryProps {
  todayScore?: number
  weekAvg?: number
}

export function MoodSummaryCard({ todayScore, weekAvg }: MoodSummaryProps) {
  const emoji = todayScore ? MOOD_EMOJIS[todayScore - 1] : null
  const moodLabel = todayScore ? MOOD_LABELS[todayScore - 1] : null

  return (
    <Link
      href="/mood"
      className="block bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">MOOD</span>
        <Smile className="w-4 h-4 text-[hsl(var(--color-hrv))]" />
      </div>

      {todayScore ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl leading-none">{emoji}</span>
            <span className="text-lg font-bold text-text-primary">{moodLabel}</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">{todayScore}/10 today</p>
          {weekAvg !== undefined && (
            <p className="text-xs text-text-secondary mt-0.5">7-day avg: {weekAvg.toFixed(1)}/10</p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 py-2 text-center">
          <span className="text-3xl">😊</span>
          <p className="text-xs text-text-secondary mt-1">No mood logged today</p>
          <span className="mt-1 text-xs text-[hsl(var(--color-hrv))] font-medium">Log mood →</span>
        </div>
      )}
    </Link>
  )
}

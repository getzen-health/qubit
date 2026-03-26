'use client'
import { getEcoColor, getEcoLabel, EcoGrade } from '@/lib/eco-score'

export function EcoScoreBadge({ grade }: { grade: EcoGrade }) {
  const color = getEcoColor(grade)
  const label = getEcoLabel(grade)
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: color }}>
        {grade === 'unknown' ? '?' : grade}
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color }}>Eco-Score {grade === 'unknown' ? '' : grade}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

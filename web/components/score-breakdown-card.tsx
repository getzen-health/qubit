'use client'
import { ScoreBreakdown } from '@/lib/product-score'

const GRADE_COLORS = { excellent: 'text-green-600 bg-green-50', good: 'text-lime-600 bg-lime-50', mediocre: 'text-yellow-600 bg-yellow-50', poor: 'text-red-600 bg-red-50' }
const GRADE_LABELS = { excellent: 'Excellent', good: 'Good', mediocre: 'Mediocre', poor: 'Poor' }

export function ScoreBreakdownCard({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Health Score</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${GRADE_COLORS[breakdown.grade]}`}>{GRADE_LABELS[breakdown.grade]}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-4xl font-bold">{breakdown.total}</div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs"><span>Nutrition</span><span>{breakdown.nutritionScore}/60</span></div>
          <div className="h-1.5 bg-muted rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${(breakdown.nutritionScore/60)*100}%` }}/></div>
          <div className="flex justify-between text-xs"><span>Additives</span><span>{breakdown.additivesScore}/30</span></div>
          <div className="h-1.5 bg-muted rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(breakdown.additivesScore/30)*100}%` }}/></div>
        </div>
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">Score details</summary>
        <ul className="mt-2 space-y-1">{breakdown.details.map((d, i) => <li key={i}>• {d}</li>)}</ul>
      </details>
    </div>
  )
}

'use client'
import { IngredientInfo } from '@/lib/ingredients'

const RISK_COLORS = { avoid: 'text-red-600 bg-red-50 border-red-200', caution: 'text-yellow-600 bg-yellow-50 border-yellow-200', safe: 'text-green-600 bg-green-50 border-green-200' }
const RISK_ICONS = { avoid: '⚠️', caution: '⚡', safe: '✓' }

export function IngredientAnalysis({ ingredients }: { ingredients: IngredientInfo[] }) {
  if (ingredients.length === 0) return <p className="text-sm text-muted-foreground">No concerning ingredients detected.</p>
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Ingredient Analysis</p>
      {ingredients.map((ing, i) => (
        <div key={i} className={`rounded-lg border p-3 space-y-1 ${RISK_COLORS[ing.risk]}`}>
          <div className="flex items-center gap-2">
            <span>{RISK_ICONS[ing.risk]}</span>
            <span className="font-medium text-sm">{ing.name}</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${RISK_COLORS[ing.risk]}`}>{ing.risk.toUpperCase()}</span>
          </div>
          <p className="text-xs opacity-80">{ing.description}</p>
        </div>
      ))}
    </div>
  )
}

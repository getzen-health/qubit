'use client'
import { ProductAlternative } from '@/lib/product-alternatives'

export function ProductAlternativesSection({ alternatives }: { alternatives: ProductAlternative[] }) {
  if (alternatives.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="font-semibold text-sm">Healthier Alternatives</p>
      <div className="space-y-2">
        {alternatives.map((alt, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{alt.name}</p>
              {alt.brand && <p className="text-xs text-muted-foreground">{alt.brand}</p>}
              <p className="text-xs text-green-600 mt-0.5">{alt.reason}</p>
            </div>
            <div className="ml-3 text-right flex-shrink-0">
              <p className="text-lg font-bold text-green-600">{alt.score}</p>
              <p className="text-xs text-muted-foreground">score</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

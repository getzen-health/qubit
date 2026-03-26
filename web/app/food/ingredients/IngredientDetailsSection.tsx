import { INGREDIENT_GLOSSARY, lookupIngredient, getRiskColor } from '@/lib/ingredient-glossary'
import Link from 'next/link'

export function IngredientDetailsSection({ ingredientsText }: { ingredientsText?: string | null }) {
  if (!ingredientsText) return null
  const terms = ingredientsText.split(/,|\./).map(t => t.trim()).filter(Boolean)
  const found = terms.map(term => ({ term, info: lookupIngredient(term) })).filter(x => x.info)
  if (found.length === 0) return null
  return (
    <div className="mt-6">
      <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">🧪 Ingredient Details</h3>
      <div className="flex flex-wrap gap-2 mb-2">
        {found.map(({ term, info }) => (
          <span key={term} className={`px-2 py-0.5 rounded-2xl text-xs font-semibold ${getRiskColor(info!.risk)}`}>{info!.name}</span>
        ))}
      </div>
      {found.map(({ term, info }) => (
        (info!.risk === 'caution' || info!.risk === 'avoid') && (
          <div key={term+':detail'} className={`mb-2 p-3 rounded-xl border ${getRiskColor(info!.risk)}`}> 
            <div className="font-semibold mb-1">{info!.name} ({info!.risk.charAt(0).toUpperCase() + info!.risk.slice(1)})</div>
            <div className="text-sm">{info!.detail}</div>
            {info!.source && <div className="text-xs text-text-secondary mt-1">Source: {info!.source}</div>}
          </div>
        )
      ))}
      <Link href="/food/ingredients" className="text-primary underline text-xs mt-2 inline-block">🧪 Learn More</Link>
    </div>
  )
}

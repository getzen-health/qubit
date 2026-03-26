"use client"
import { useState, useMemo } from 'react'
import { INGREDIENT_GLOSSARY, IngredientInfo, getRiskColor } from '@/lib/ingredient-glossary'
import Link from 'next/link'

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Sweeteners', value: 'sweetener' },
  { label: 'Preservatives', value: 'preservative' },
  { label: 'Colorants', value: 'colorant' },
  { label: 'Emulsifiers', value: 'emulsifier' },
  { label: 'Thickeners', value: 'thickener' },
  { label: 'Flavoring', value: 'flavoring' },
]

function categoryLabel(cat: IngredientInfo['category']) {
  switch (cat) {
    case 'sweetener': return 'Sweetener'
    case 'preservative': return 'Preservative'
    case 'colorant': return 'Colorant'
    case 'emulsifier': return 'Emulsifier'
    case 'thickener': return 'Thickener'
    case 'flavoring': return 'Flavoring'
    case 'nutrient': return 'Nutrient'
    default: return 'Other'
  }
}

export default function IngredientGlossaryPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const ingredients = useMemo(() => {
    let arr = Object.entries(INGREDIENT_GLOSSARY)
    if (filter !== 'all') arr = arr.filter(([, i]) => i.category === filter)
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      arr = arr.filter(([, i]) =>
        i.name.toLowerCase().includes(s) ||
        i.aliases.some(a => a.toLowerCase().includes(s)) ||
        i.description.toLowerCase().includes(s)
      )
    }
    return arr
  }, [search, filter])

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">🧪 Ingredient Encyclopedia</h1>
      <p className="text-text-secondary mb-6">Search and learn about common food ingredients, additives, and their health risks.</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            className={`px-3 py-1 rounded-2xl border border-border text-sm ${filter === cat.value ? 'bg-primary text-white' : 'bg-surface text-text-primary'}`}
            onClick={() => setFilter(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <input
        className="w-full mb-6 px-4 py-2 border border-border rounded-2xl bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Search ingredients..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {ingredients.map(([key, info]) => (
          <div key={key} className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-lg">{info.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-2xl border border-border bg-surface text-text-secondary`}>{categoryLabel(info.category)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-2xl ml-auto font-semibold ${getRiskColor(info.risk)}`}>{info.risk.charAt(0).toUpperCase() + info.risk.slice(1)}</span>
            </div>
            <div className="text-text-secondary text-sm mb-2">{info.description}</div>
            <button
              className="text-primary text-xs underline self-start mb-1"
              onClick={() => setExpanded(e => ({ ...e, [key]: !e[key] }))}
            >
              {expanded[key] ? 'Hide details' : 'Show details'}
            </button>
            {expanded[key] && (
              <div className="text-sm mt-1">
                <div className="mb-1">{info.detail}</div>
                {info.source && <div className="text-xs text-text-secondary">Source: {info.source}</div>}
                <Link href={`/food/ingredients/${encodeURIComponent(key)}`} className="text-primary underline text-xs">Full page →</Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

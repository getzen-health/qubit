import { INGREDIENT_GLOSSARY, getRiskColor } from '@/lib/ingredient-glossary'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default function IngredientDetailPage({ params }: { params: { slug: string } }) {
  const info = INGREDIENT_GLOSSARY[decodeURIComponent(params.slug).toLowerCase()]
  if (!info) return notFound()
  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <Link href="/food/ingredients" className="text-primary underline mb-4 inline-block">← Back to glossary</Link>
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">{info.name}
        <span className={`text-xs px-2 py-0.5 rounded-2xl ml-2 font-semibold ${getRiskColor(info.risk)}`}>{info.risk.charAt(0).toUpperCase() + info.risk.slice(1)}</span>
      </h1>
      <div className="mb-2 text-text-secondary">{info.description}</div>
      <div className="mb-4 text-sm">{info.detail}</div>
      <div className="mb-2">
        <span className="text-xs px-2 py-0.5 rounded-2xl border border-border bg-surface text-text-secondary">{info.category.charAt(0).toUpperCase() + info.category.slice(1)}</span>
        {info.aliases.length > 0 && (
          <span className="ml-2 text-xs text-text-secondary">Also known as: {info.aliases.join(', ')}</span>
        )}
      </div>
      {info.source && <div className="text-xs text-text-secondary mb-2">Source: {info.source}</div>}
    </div>
  )
}

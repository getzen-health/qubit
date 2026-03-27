'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { IngredientDetailsSection } from '../../ingredients/IngredientDetailsSection'

// Nutrient reference daily values (adult, 2000 kcal diet)
const DAILY_VALUES: Record<string, { label: string; unit: string; dv: number; category: string }> = {
  'energy-kcal': { label: 'Calories', unit: 'kcal', dv: 2000, category: 'Energy' },
  fat: { label: 'Total Fat', unit: 'g', dv: 78, category: 'Fats' },
  'saturated-fat': { label: 'Saturated Fat', unit: 'g', dv: 20, category: 'Fats' },
  'trans-fat': { label: 'Trans Fat', unit: 'g', dv: 2, category: 'Fats' },
  cholesterol: { label: 'Cholesterol', unit: 'mg', dv: 300, category: 'Fats' },
  sodium: { label: 'Sodium', unit: 'mg', dv: 2300, category: 'Minerals' },
  carbohydrates: { label: 'Total Carbohydrates', unit: 'g', dv: 275, category: 'Carbs' },
  fiber: { label: 'Dietary Fiber', unit: 'g', dv: 28, category: 'Carbs' },
  sugars: { label: 'Total Sugars', unit: 'g', dv: 50, category: 'Carbs' },
  proteins: { label: 'Protein', unit: 'g', dv: 50, category: 'Protein' },
  'vitamin-d': { label: 'Vitamin D', unit: 'µg', dv: 20, category: 'Vitamins' },
  calcium: { label: 'Calcium', unit: 'mg', dv: 1300, category: 'Minerals' },
  iron: { label: 'Iron', unit: 'mg', dv: 18, category: 'Minerals' },
  potassium: { label: 'Potassium', unit: 'mg', dv: 4700, category: 'Minerals' },
  'vitamin-c': { label: 'Vitamin C', unit: 'mg', dv: 90, category: 'Vitamins' },
  'vitamin-a': { label: 'Vitamin A', unit: 'µg', dv: 900, category: 'Vitamins' },
  magnesium: { label: 'Magnesium', unit: 'mg', dv: 420, category: 'Minerals' },
  zinc: { label: 'Zinc', unit: 'mg', dv: 11, category: 'Minerals' },
}

const FLAGGED_INGREDIENTS = [
  { pattern: /palm oil/i, label: 'Palm Oil', severity: 'caution', note: 'High in saturated fat; environmental concerns' },
  { pattern: /high.fructose corn syrup|hfcs/i, label: 'High Fructose Corn Syrup', severity: 'avoid', note: 'Linked to metabolic issues at high intake' },
  { pattern: /partially hydrogenated/i, label: 'Trans Fats', severity: 'avoid', note: 'Associated with cardiovascular risk' },
  { pattern: /sodium nitrate|sodium nitrite/i, label: 'Nitrates/Nitrites', severity: 'caution', note: 'Preservatives in processed meats' },
  { pattern: /artificial colou?r|red 40|yellow 5|yellow 6|blue 1/i, label: 'Artificial Colors', severity: 'caution', note: 'Some linked to hyperactivity in children' },
  { pattern: /monosodium glutamate|msg/i, label: 'MSG', severity: 'neutral', note: 'Generally safe; may cause sensitivity in some' },
  { pattern: /aspartame|sucralose|acesulfame/i, label: 'Artificial Sweeteners', severity: 'caution', note: 'May affect gut microbiome' },
  { pattern: /carrageenan/i, label: 'Carrageenan', severity: 'caution', note: 'Emulsifier linked to gut inflammation in some studies' },
]

const GRADE_COLORS: Record<string, string> = {
  a: 'bg-green-500', b: 'bg-green-400', c: 'bg-yellow-400', d: 'bg-orange-400', e: 'bg-red-500'
}

function NutrientBar({ value, dv, isHigh }: { value: number; dv: number; isHigh?: boolean }) {
  const pct = Math.min((value / dv) * 100, 100)
  const color = isHigh
    ? (pct > 20 ? 'bg-red-400' : 'bg-yellow-400')
    : (pct >= 15 ? 'bg-green-400' : pct >= 5 ? 'bg-blue-400' : 'bg-gray-500')
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-text-secondary w-8 text-right">{Math.round(pct)}%</span>
    </div>
  )
}

interface Product {
  product_name: string
  brands: string
  image_url: string
  nutriscore_grade: string
  nutriments: Record<string, number>
  ingredients_text: string
  labels_tags?: string[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const barcode = params.barcode as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 1) setProduct(data.product)
        else setNotFound(true)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [barcode])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8"><div className="h-64 animate-pulse bg-surface rounded-2xl" /></div>
  if (notFound || !product) return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-center">
      <p className="text-text-secondary">Product not found for barcode {barcode}</p>
      <Link href="/food/scanner" className="text-primary hover:underline mt-4 block">← Back to scanner</Link>
    </div>
  )

  const nutriments = product.nutriments ?? {}
  
  // Group nutrients by category
  const grouped: Record<string, Array<{ key: string; value: number; meta: typeof DAILY_VALUES[string] }>> = {}
  for (const [key, meta] of Object.entries(DAILY_VALUES)) {
    const rawKey = key.replace(/-/g, '_')
    const value = nutriments[`${rawKey}_100g`] ?? nutriments[rawKey] ?? null
    if (value === null) continue
    if (!grouped[meta.category]) grouped[meta.category] = []
    grouped[meta.category].push({ key, value, meta })
  }

  // Flag ingredients
  const ingredientsText = product.ingredients_text ?? ''
  const flags = FLAGGED_INGREDIENTS.filter(f => f.pattern.test(ingredientsText))

  // Dietary compatibility badges
  const labels = (product.labels_tags ?? []) as string[]
  const dietaryBadges = [
    { label: 'Vegan', tag: 'vegan', color: labels.includes('vegan') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700', ok: labels.includes('vegan') },
    { label: 'Vegetarian', tag: 'vegetarian', color: labels.includes('vegetarian') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700', ok: labels.includes('vegetarian') },
    { label: 'Gluten-Free', tag: 'gluten-free', color: labels.includes('gluten-free') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700', ok: labels.includes('gluten-free') },
    { label: 'Halal', tag: 'halal', color: labels.includes('halal') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700', ok: labels.includes('halal') },
    { label: 'Kosher', tag: 'kosher', color: labels.includes('kosher') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700', ok: labels.includes('kosher') },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/food/scanner" className="flex items-center gap-2 text-text-secondary text-sm mb-6 hover:text-text-primary">
        <ArrowLeft className="w-4 h-4" /> Back to Scanner
      </Link>

      {/* Product header */}
      <div className="flex gap-4 mb-6">
        {product.image_url && (
          <img src={product.image_url} alt={product.product_name} className="w-20 h-20 object-contain rounded-xl bg-white flex-shrink-0" />
        )}
        <div>
          <h1 className="text-xl font-bold text-text-primary">{product.product_name}</h1>
          {product.brands && <p className="text-text-secondary text-sm">{product.brands}</p>}
          {product.nutriscore_grade && (
            <span className={`inline-block mt-2 text-sm font-bold text-white px-3 py-1 rounded-full uppercase ${GRADE_COLORS[product.nutriscore_grade] ?? 'bg-gray-500'}`}>
              Nutri-Score {product.nutriscore_grade.toUpperCase()}
            </span>
          )}
          {/* Dietary badges */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {dietaryBadges.map(b => (
              <span key={b.label} className={`px-2 py-0.5 rounded-2xl text-xs font-semibold ${b.color}`}>{b.label} {b.ok ? '✓' : '✗'}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Nutrient table */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <h2 className="font-semibold text-text-primary mb-4">Nutrition Facts <span className="text-xs font-normal text-text-secondary">per 100g</span></h2>
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">{category}</p>
            <div className="space-y-2">
              {items.map(({ key, value, meta }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-text-primary w-36 flex-shrink-0">{meta.label}</span>
                  <span className="text-sm font-medium text-text-primary w-16 flex-shrink-0">{value.toFixed(1)}{meta.unit}</span>
                  <NutrientBar value={value} dv={meta.dv} isHigh={['fat', 'saturated-fat', 'sodium', 'sugars', 'trans-fat'].includes(key)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Ingredient flags */}
      {flags.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h2 className="font-semibold text-text-primary">Ingredient Flags</h2>
          </div>
          <div className="space-y-2">
            {flags.map((f, i) => (
              <div key={i} className={`rounded-xl p-3 border ${f.severity === 'avoid' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                <p className={`text-sm font-medium ${f.severity === 'avoid' ? 'text-red-400' : 'text-yellow-400'}`}>{f.label}</p>
                <p className="text-xs text-text-secondary mt-0.5">{f.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients text */}
      {ingredientsText && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h2 className="font-semibold text-text-primary mb-2">Ingredients</h2>
          <p className="text-xs text-text-secondary leading-relaxed">{ingredientsText}</p>
          <IngredientDetailsSection ingredientsText={ingredientsText} />
        </div>
      )}
    </div>
  )
}

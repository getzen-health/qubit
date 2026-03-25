'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, ScanLine, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, RefreshCw, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
import { getReadinessContext, getFoodReadinessWarning } from '@/lib/readiness'
import { createClient } from '@/lib/supabase/client'

// Dynamically import the scanner (client-only, uses browser APIs)
const BarcodeScanner = dynamic(() => import('./barcode-scanner'), { ssr: false })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FlaggedAdditive {
  code: string
  name: string
  risk: 'avoid' | 'limited' | 'safe'
  description: string
}

interface HealthScore {
  score: number
  grade: 'excellent' | 'good' | 'mediocre' | 'poor'
  color: string
  nutriScore: string | null
  additivesPenalty: number
  organicBonus: number
  flaggedAdditives: FlaggedAdditive[]
  allergens: string[]
  novaGroup?: 1 | 2 | 3 | 4 | null
}

interface FoodProduct {
  name: string
  brand?: string
  quantity?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  servingSize: string
  barcode?: string
  imageUrl?: string
  healthScore: HealthScore
  ingredients?: string | null
  categories?: string[]
  dataSource?: 'off' | 'usda'
}

interface Alternative {
  id?: string
  name?: string
  brand?: string
  imageUrl?: string
  calories: number
  healthScore: { score: number; grade: string; color: string; nutriScore: string | null }
}

// ---------------------------------------------------------------------------
// Score Badge
// ---------------------------------------------------------------------------

function ScoreBadge({ score, grade, size = 'lg' }: { score: number; grade: string; size?: 'sm' | 'lg' }) {
  const colorMap: Record<string, string> = {
    excellent: 'bg-green-500',
    good: 'bg-lime-500',
    mediocre: 'bg-orange-500',
    poor: 'bg-red-500',
  }
  const bg = colorMap[grade] ?? 'bg-gray-400'
  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center justify-center rounded-full ${bg} text-white font-bold text-xs w-9 h-9 shrink-0`}>
        {score}
      </span>
    )
  }
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl ${bg} text-white w-24 h-24 shrink-0`}>
      <span className="text-3xl font-black">{score}</span>
      <span className="text-xs font-semibold capitalize mt-0.5">{grade}</span>
    </div>
  )
}

function RiskBadge({ risk }: { risk: 'avoid' | 'limited' | 'safe' }) {
  const styles = {
    avoid: 'bg-red-100 text-red-700 dark:bg-red-900/30',
    limited: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30',
    safe: 'bg-green-100 text-green-700 dark:bg-green-900/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize shrink-0 ${styles[risk]}`}>
      {risk}
    </span>
  )
}

function NutriScoreBar({ grade }: { grade: string | null }) {
  const grades = ['a', 'b', 'c', 'd', 'e']
  const colors = ['bg-green-500', 'bg-lime-400', 'bg-yellow-400', 'bg-orange-500', 'bg-red-500']
  if (!grade) return null
  return (
    <div className="flex gap-1 items-end">
      {grades.map((g, i) => (
        <div
          key={g}
          className={`flex items-center justify-center rounded text-white font-black uppercase
            ${colors[i]}
            ${g === grade.toLowerCase() ? 'h-9 w-9 text-base' : 'h-6 w-7 opacity-40 text-xs'}`}
        >
          {g.toUpperCase()}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function FoodScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [readinessScore, setReadinessScore] = useState<number | null>(null)
  const [product, setProduct] = useState<FoodProduct | null>(null)
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showIngredients, setShowIngredients] = useState(false)

  // Fetch latest readiness/body-battery score for contextual food guidance
  useEffect(() => {
    const fetchReadiness = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('daily_summaries')
          .select('hrv, resting_heart_rate, sleep_duration_minutes, recovery_score')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(14)
        if (!data?.length) return
        const latest = data[0]
        const history = data.slice(1)
        const hrvHistory = history.map(s => s.hrv).filter((v): v is number => v != null && v > 0)
        const baselineHrv = hrvHistory.length > 0 ? hrvHistory.reduce((a, b) => a + b, 0) / hrvHistory.length : null
        if (latest.hrv && baselineHrv) {
          const dev = (latest.hrv - baselineHrv) / baselineHrv
          const score = Math.max(0, Math.min(100, Math.round(50 + dev * 125)))
          setReadinessScore(score)
        } else if (latest.recovery_score) {
          setReadinessScore(latest.recovery_score)
        }
      } catch { /* non-critical */ }
    }
    fetchReadiness()
  }, [])

  const readinessCtx = getReadinessContext(readinessScore)

  const lookupBarcode = useCallback(async (code: string) => {
    setLoading(true)
    setError(null)
    setProduct(null)
    setAlternatives([])
    setShowIngredients(false)
    try {
      const res = await fetch(`/api/food/barcode?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Product not found')
      setProduct(data.food)
      if (data.food?.healthScore?.score < 75 && data.food?.categories?.[0]) {
        const cat = data.food.categories[0].replace('en:', '')
        const altRes = await fetch(
          `/api/food/alternatives?category=${encodeURIComponent(cat)}&currentScore=${data.food.healthScore.score}`
        )
        const altData = await altRes.json()
        setAlternatives(altData.alternatives ?? [])
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not find product')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleScanResult = useCallback((code: string) => {
    setScanning(false)
    setBarcode(code)
    lookupBarcode(code)
  }, [lookupBarcode])

  const handleManualSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError(null)
    setProduct(null)
    setAlternatives([])
    setShowIngredients(false)
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(searchQuery)}&page=1`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Search failed')
      if (data.products?.length > 0 && data.products[0].id) {
        await lookupBarcode(data.products[0].id)
      } else {
        setError('No products found')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, lookupBarcode])

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/nutrition" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Food Scanner</h1>
            <p className="text-xs text-text-secondary">Scan barcode · search · see health score</p>
            {readinessScore != null && (
              <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${readinessCtx.colorClass}`}>
                <Activity className="w-3.5 h-3.5" />
                <span>Readiness: {readinessCtx.label}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Search + Scan */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search food name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              className="w-full pl-9 pr-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            onClick={() => setScanning(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-medium whitespace-nowrap"
          >
            <ScanLine className="w-4 h-4" />
            Scan
          </button>
        </div>

        {barcode && !loading && (
          <p className="text-xs text-text-secondary text-center">Barcode: {barcode}</p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-accent animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {product && !loading && (
          <div className="space-y-4">
            {/* Hero card */}
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="p-4 flex gap-4 items-start">
                {product.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-contain rounded-xl bg-surface-secondary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-text-primary text-lg leading-tight">{product.name}</h2>
                  {product.brand && <p className="text-sm text-text-secondary mt-0.5">{product.brand}</p>}
                  {product.quantity && <p className="text-xs text-text-secondary">{product.quantity}</p>}
                  {product.dataSource && (
                    <p className="text-xs text-text-secondary mt-1">
                      {product.dataSource === 'usda' ? '🇺🇸 USDA FoodData Central' : '🌍 Open Food Facts'}
                    </p>
                  )}
                </div>
                <ScoreBadge score={product.healthScore.score} grade={product.healthScore.grade} />
              </div>

              {product.healthScore.nutriScore && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-text-secondary mb-1.5">Nutri-Score</p>
                  <NutriScoreBar grade={product.healthScore.nutriScore} />
                </div>
              )}

              {product.healthScore.novaGroup && (
                <div className="px-4 pb-3 flex items-center gap-2">
                  <span className="text-xs text-text-secondary">NOVA Group {product.healthScore.novaGroup}:</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    product.healthScore.novaGroup === 1 ? 'bg-green-100 text-green-800' :
                    product.healthScore.novaGroup === 2 ? 'bg-lime-100 text-lime-800' :
                    product.healthScore.novaGroup === 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.healthScore.novaGroup === 1 ? 'Unprocessed' :
                     product.healthScore.novaGroup === 2 ? 'Culinary ingredient' :
                     product.healthScore.novaGroup === 3 ? 'Processed' : 'Ultra-processed ⚠️'}
                  </span>
                </div>
              )}

              {/* Readiness-aware food warning */}
              {(() => {
                const warning = getFoodReadinessWarning(
                  product.healthScore.score,
                  product.healthScore.novaGroup ?? null,
                  readinessScore
                )
                return warning ? (
                  <div className="mx-4 mb-3 flex gap-2 items-start bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                    <Activity className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-orange-300">{warning}</p>
                  </div>
                ) : null
              })()}

              <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
                {[
                  { label: 'Calories', value: product.calories, unit: 'kcal' },
                  { label: 'Protein', value: product.protein, unit: 'g' },
                  { label: 'Carbs', value: product.carbs, unit: 'g' },
                  { label: 'Fat', value: product.fat, unit: 'g' },
                ].map((m) => (
                  <div key={m.label} className="py-3 px-2 text-center">
                    <p className="text-xs text-text-secondary">{m.label}</p>
                    <p className="font-bold text-text-primary text-sm">{m.value}</p>
                    <p className="text-xs text-text-secondary">{m.unit}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-secondary text-center pb-2">Per {product.servingSize}</p>
            </div>

            {/* Additives */}
            {product.healthScore.flaggedAdditives.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border p-4">
                <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Additives ({product.healthScore.flaggedAdditives.length})
                </h3>
                <div className="space-y-3">
                  {product.healthScore.flaggedAdditives.map((a) => (
                    <div key={a.code} className="flex items-start gap-3">
                      <RiskBadge risk={a.risk} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{a.name}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{a.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergens */}
            {product.healthScore.allergens.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border p-4">
                <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Allergens
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.healthScore.allergens.map((a) => (
                    <span key={a} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium capitalize">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients (collapsible) */}
            {product.ingredients && (
              <div className="bg-surface rounded-2xl border border-border p-4">
                <button onClick={() => setShowIngredients((v) => !v)} className="w-full flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">Ingredients</h3>
                  {showIngredients ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
                </button>
                {showIngredients && (
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed">{product.ingredients}</p>
                )}
              </div>
            )}

            {/* Score breakdown */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <h3 className="font-semibold text-text-primary mb-3">Score Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Nutritional quality (60%)</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {product.healthScore.nutriScore ? `Nutri-Score ${product.healthScore.nutriScore.toUpperCase()}` : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Additive penalty (30%)</span>
                  <span className={`text-sm font-semibold ${product.healthScore.additivesPenalty > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    -{product.healthScore.additivesPenalty} pts
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Organic bonus (10%)</span>
                  <span className={`text-sm font-semibold ${product.healthScore.organicBonus > 0 ? 'text-green-500' : 'text-text-secondary'}`}>
                    {product.healthScore.organicBonus > 0 ? '+10 pts ✓' : 'No'}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between items-center">
                  <span className="text-sm font-semibold text-text-primary">Final score</span>
                  <span className="text-lg font-black text-text-primary">{product.healthScore.score}/100</span>
                </div>
              </div>
            </div>

            {/* Healthier alternatives */}
            {alternatives.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border p-4">
                <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Healthier Alternatives
                </h3>
                <div className="space-y-2">
                  {alternatives.map((alt, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-secondary transition-colors">
                      {alt.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={alt.imageUrl} alt={alt.name ?? ''} className="w-12 h-12 object-contain rounded-lg bg-surface-secondary shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{alt.name}</p>
                        {alt.brand && <p className="text-xs text-text-secondary truncate">{alt.brand}</p>}
                      </div>
                      <ScoreBadge score={alt.healthScore.score} grade={alt.healthScore.grade} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!product && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <ScanLine className="w-16 h-16 text-text-secondary opacity-30" />
            <p className="text-text-secondary font-medium">Scan or search a product</p>
            <p className="text-xs text-text-secondary">See its health score, additives &amp; allergens</p>
          </div>
        )}
      </div>

      {scanning && (
        <BarcodeScanner onResult={handleScanResult} onClose={() => setScanning(false)} />
      )}

      <BottomNav />
    </div>
  )
}

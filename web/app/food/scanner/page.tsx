'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Search, ScanLine, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, RefreshCw, Activity, Bookmark, BookmarkCheck, Clock } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
import { getReadinessContext, getFoodReadinessWarning } from '@/lib/readiness'
import { NutrientTrafficLights } from '@/components/nutrient-traffic-lights'
import { createClient } from '@/lib/supabase/client'
import { ShareButton } from '@/components/share-button'
import { IngredientDetailsSection } from '../ingredients/IngredientDetailsSection'

// Dynamically import the scanner (client-only, uses browser APIs)
const BarcodeScanner = dynamic(() => import('./barcode-scanner'), { ssr: false })
import { FoodPhotoAnalyzer } from '@/components/food-photo-analyzer'

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
  hasCompleteData?: boolean
}

interface ScoreComponents {
  nutrientBalance?: number
  processingIntegrity?: number
  additiveSafety?: number
  ingredientQuality?: number
  nutrition?: number
  additives?: number
  organic?: number
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
  score_components?: ScoreComponents
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
  // ZenScore™ grade color map (A+ through F)
  const colorMap: Record<string, string> = {
    'A+': 'bg-emerald-500',
    'A':  'bg-green-500',
    'B':  'bg-lime-500',
    'C':  'bg-orange-400',
    'D':  'bg-red-500',
    'F':  'bg-gray-700',
    // legacy compat
    excellent: 'bg-emerald-500',
    good:      'bg-green-500',
    mediocre:  'bg-orange-400',
    poor:      'bg-red-500',
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
      <span className="text-xs font-semibold mt-0.5">{grade}</span>
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

function scoreToLetterGrade(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

function GradeBadge({ grade }: { grade: string }) {
  const colorMap: Record<string, string> = {
    'A+': 'bg-green-500/20 text-green-400 border-green-500/30',
    'A':  'bg-green-500/20 text-green-400 border-green-500/30',
    'B':  'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'C':  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'D':  'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'F':  'bg-red-500/20 text-red-400 border-red-500/30',
  }
  const classes = colorMap[grade] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-xs font-bold ${classes}`}>
      {grade}
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

function FoodPhotoTabScanner({ onAdd }: { onAdd: (foods: any[]) => void }) {
  const [result, setResult] = useState<any>(null)
  return (
    <div>
      <FoodPhotoAnalyzer onResult={(res) => setResult(res)} />
      {result?.foods?.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90"
            onClick={() => onAdd(result.foods)}
          >
            Add to diary
          </button>
        </div>
      )}
    </div>
  )
}

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
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [addingToMeal, setAddingToMeal] = useState(false)
  const [mealAdded, setMealAdded] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportName, setReportName] = useState('')
  const [reportBrand, setReportBrand] = useState('')
  const [reportNotes, setReportNotes] = useState('')
  const [reportingMissing, setReportingMissing] = useState(false)
  const [servings, setServings] = useState(1)
  const [manualBarcode, setManualBarcode] = useState('')

  function getDefaultMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 10) return 'breakfast'
    if (hour >= 10 && hour < 14) return 'lunch'
    if (hour >= 14 && hour < 18) return 'snack'
    if (hour >= 18 && hour < 22) return 'dinner'
    return 'snack'
  }

  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(getDefaultMealType)

  async function handleAddToMeal() {
    if (!product) return
    setAddingToMeal(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const today = new Date().toISOString().split('T')[0]
      // Ensure a 'snack' meal row exists for today
      const { data: meal, error: mealErr } = await supabase
        .from('meals')
        .upsert({ user_id: user.id, date: today, meal_type: selectedMealType }, { onConflict: 'user_id,date,meal_type' })
        .select('id')
        .single()
      if (mealErr || !meal) throw mealErr ?? new Error('Could not create meal')
      
      // Scale nutrition by servings multiplier
      const scaledCalories = Math.round((product.calories ?? 0) * servings)
      const scaledProtein = +(((product.protein ?? 0) * servings).toFixed(1))
      const scaledCarbs = +(((product.carbs ?? 0) * servings).toFixed(1))
      const scaledFat = +(((product.fat ?? 0) * servings).toFixed(1))
      
      await supabase.from('meal_items').insert({
        meal_id: meal.id,
        food_name: product.name,
        quantity_g: 100 * servings,
        calories: scaledCalories,
        protein_g: scaledProtein,
        carbs_g: scaledCarbs,
        fat_g: scaledFat,
        servings_count: servings,
      })
      setMealAdded(true)
      setTimeout(() => setMealAdded(false), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add meal'
      setError(message)
      setTimeout(() => setError(null), 4000)
    } finally {
      setAddingToMeal(false)
    }
  }

  async function toggleFavorite() {
    if (!product) return
    const bc = product.barcode
    if (!bc) return
    setFavoriteLoading(true)
    try {
      if (isFavorited) {
        await fetch(`/api/food/favorites?barcode=${encodeURIComponent(bc)}`, { method: 'DELETE' })
        setIsFavorited(false)
      } else {
        await fetch('/api/food/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barcode: bc,
            product_name: product.name,
            brand: product.brand ?? null,
            health_score: product.healthScore?.score ?? null,
            nova_group: product.healthScore?.novaGroup ?? null,
            thumbnail_url: product.imageUrl ?? null,
          }),
        })
        setIsFavorited(true)
      }
    } finally {
      setFavoriteLoading(false)
    }
  }

  // Check if current product is already favorited
  useEffect(() => {
    if (!product?.barcode) { setIsFavorited(false); return }
    const bc = product.barcode
    fetch('/api/food/favorites')
      .then((r) => r.json())
      .then((data) => {
        const favs: Array<{ barcode: string | null }> = data.favorites ?? []
        setIsFavorited(favs.some((f) => f.barcode === bc))
      })
      .catch(() => {})
  }, [product?.barcode])

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
        const hrvHistory = history.map((s: { hrv: number | null }) => s.hrv).filter((v: number | null): v is number => v != null && v > 0)
        const baselineHrv = hrvHistory.length > 0 ? hrvHistory.reduce((a: number, b: number) => a + b, 0) / hrvHistory.length : null
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
    setShowBreakdown(false)
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
    setShowBreakdown(false)
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

  const handleReportMissing = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportName.trim()) return
    setReportingMissing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      
      const { error } = await supabase.from('missing_products').insert({
        user_id: user.id,
        barcode: barcode || null,
        product_name: reportName,
        brand: reportBrand || null,
        notes: reportNotes || null,
      })
      if (error) throw error
      
      setReportName('')
      setReportBrand('')
      setReportNotes('')
      setShowReportForm(false)
      setError('Thank you for reporting! We\'ll investigate this product.')
      setTimeout(() => setError(null), 3000)
    } catch (err) {
      console.error('Failed to report missing product:', err)
    } finally {
      setReportingMissing(false)
    }
  }, [reportName, reportBrand, reportNotes, barcode])

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/nutrition" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Food Scanner</h1>
            <p className="text-xs text-text-secondary">Scan barcode · search · see health score</p>
            <Link href="/food/history" className="text-sm text-accent">History →</Link>
            {readinessScore != null && (
              <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${readinessCtx.colorClass}`}>
                <Activity className="w-3.5 h-3.5" />
                <span>Readiness: {readinessCtx.label}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Link href="/food/favorites" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Favourites">
              <Bookmark className="w-5 h-5 text-text-secondary" />
            </Link>
            <Link href="/food/history" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="History">
              <Clock className="w-5 h-5 text-text-secondary" />
            </Link>
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

        {!loading && !error && !product && !barcode && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <ScanLine className="w-14 h-14 text-text-muted" />
            <p className="text-base font-medium text-text-secondary">Scan or search a product</p>
            <p className="text-xs text-text-muted max-w-xs">Point your camera at a barcode, or type a product name above to see its health score</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col gap-3 p-4 rounded-xl border" style={{
            backgroundColor: error.includes('Thank you') ? '#f0fdf4' : '#fef2f2',
            borderColor: error.includes('Thank you') ? '#86efac' : '#fecaca',
          }}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" style={{color: error.includes('Thank you') ? '#22c55e' : '#ef4444'}} />
              <p className="text-sm" style={{color: error.includes('Thank you') ? '#166534' : '#991b1b'}}>
                {error}
              </p>
            </div>
            
            {!error.includes('Thank you') && !product && !showReportForm && (
              <button
                onClick={() => setShowReportForm(true)}
                className="text-purple-400 text-sm underline text-left hover:text-purple-300"
              >
                Report missing product
              </button>
            )}
            
            {!product && showReportForm && (
              <form onSubmit={handleReportMissing} className="flex flex-col gap-2 mt-2">
                <input
                  required
                  placeholder="Product name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="bg-zinc-700 text-white rounded px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <input
                  placeholder="Brand (optional)"
                  value={reportBrand}
                  onChange={(e) => setReportBrand(e.target.value)}
                  className="bg-zinc-700 text-white rounded px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <textarea
                  placeholder="Notes (optional)"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="bg-zinc-700 text-white rounded px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={reportingMissing}
                    className="flex-1 bg-purple-600 text-white rounded py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {reportingMissing ? 'Submitting...' : 'Submit Report'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="px-4 bg-zinc-700 text-white rounded py-2 text-sm font-medium hover:bg-zinc-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {product && !loading && (
          <div className="space-y-4">
            {/* Share button */}
            <div className="flex justify-end">
              <ShareButton
                title={`I just checked ${product.name} on GetZen`}
                text={`I just checked ${product.name} on GetZen — it scored ${product.healthScore.score}/100 for health! Try it:`}
              />
            </div>
            {/* Hero card */}
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="p-4 flex gap-4 items-start">
                {product.imageUrl && (
                    <Image
                    src={product.imageUrl} 
                    alt={product.name} 
                    width={80}
                    height={80}
                    className="object-contain rounded-xl bg-surface-secondary shrink-0" 
                  />
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
                <div className="flex flex-col items-end gap-2">
                  <ScoreBadge score={product.healthScore.score} grade={product.healthScore.grade} />
{/* ZenScore™ 4-pillar breakdown */}
{product.score_components && (
  <div className="flex gap-1 mt-1 flex-wrap justify-end max-w-full sm:max-w-[200px]">
    <span title="Nutrient Balance (50 pts max)" className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium">🥦 {product.score_components.nutrientBalance ?? product.score_components.nutrition}/{50}</span>
    <span title="Additive Safety (25 pts max)" className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium">🧪 {product.score_components.additiveSafety ?? product.score_components.additives}/{25}</span>
    <span title="Processing Level (15 pts max)" className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium">🏭 {product.score_components.processingIntegrity ?? 0}/{15}</span>
    <span title="Ingredient Quality (10 pts max)" className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium">🌾 {product.score_components.ingredientQuality ?? 0}/{10}</span>
  </div>
)}
                  {product.barcode && (
                    <button
                      onClick={toggleFavorite}
                      disabled={favoriteLoading}
                      className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
                      aria-label={isFavorited ? 'Remove from favourites' : 'Add to favourites'}
                    >
                      {isFavorited
                        ? <BookmarkCheck className="w-5 h-5 text-accent" />
                        : <Bookmark className="w-5 h-5 text-text-secondary" />
                      }
                    </button>
                  )}
                </div>
              </div>

              {product.healthScore.hasCompleteData === false && (
                <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
                  <span className="text-amber-500 text-sm">⚠️</span>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Limited nutritional data — score is approximate</p>
                </div>
              )}

              {product.healthScore.nutriScore && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-text-secondary mb-1.5">Nutri-Score</p>
                  <NutriScoreBar grade={product.healthScore.nutriScore} />
                  {product.barcode && (
                    <Link href={`/food/product/${product.barcode}`} className="text-primary text-xs font-medium underline ml-2">View full details →</Link>
                  )}
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

              {/* Serving size multiplier */}
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary">Servings:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setServings(s => Math.max(0.5, s - 0.5))}
                      className="w-8 h-8 rounded-full bg-zinc-700 text-white flex items-center justify-center text-sm hover:bg-zinc-600 transition-colors"
                    >
                      −
                    </button>
                    <span className="text-white font-semibold w-6 text-center">{servings}</span>
                    <button
                      onClick={() => setServings(s => Math.min(10, s + 0.5))}
                      className="w-8 h-8 rounded-full bg-zinc-700 text-white flex items-center justify-center text-sm hover:bg-zinc-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="text-xs text-zinc-500">
                  {product.servingSize ? `${(100 * servings).toFixed(0)}g` : `${servings}x`}
                </span>
              </div>

              {/* Nutrition grid with scaled values */}
              <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
                {[
                  {
                    label: 'Calories',
                    value: Math.round((product.calories ?? 0) * servings),
                    unit: 'kcal',
                  },
                  {
                    label: 'Protein',
                    value: (((product.protein ?? 0) * servings).toFixed(1)),
                    unit: 'g',
                  },
                  {
                    label: 'Carbs',
                    value: (((product.carbs ?? 0) * servings).toFixed(1)),
                    unit: 'g',
                  },
                  {
                    label: 'Fat',
                    value: (((product.fat ?? 0) * servings).toFixed(1)),
                    unit: 'g',
                  },
                ].map((m) => (
                  <div key={m.label} className="py-3 px-2 text-center">
                    <p className="text-xs text-text-secondary">{m.label}</p>
                    <p className="font-bold text-text-primary text-sm">{m.value}</p>
                    <p className="text-xs text-text-secondary">{m.unit}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-secondary text-center pb-2">
                Per {product.servingSize}{servings !== 1 ? ` × ${servings}` : ''}
              </p>

              {/* Add to Meal diary */}
              <div className="px-4 pb-4 pt-1">
                {mealAdded ? (
                  <div className="flex items-center justify-center gap-2 bg-green-500/15 text-green-400 rounded-xl py-2.5 text-sm font-medium">
                    ✓ Added to {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}
                    <Link href="/food/diary" className="underline underline-offset-2 text-green-300 ml-1">View diary →</Link>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectedMealType(type)}
                          className={`flex-1 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                            selectedMealType === type
                              ? 'bg-purple-600 text-white'
                              : 'bg-surface text-text-secondary border border-border'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleAddToMeal}
                      disabled={addingToMeal}
                      className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 rounded-xl py-2.5 text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {addingToMeal ? 'Adding…' : '+ Add to Today\'s Diary'}
                    </button>
                  </>
                )}
              </div>
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
                  <>
                    <p className="text-xs text-text-secondary mt-2 leading-relaxed">{product.ingredients}</p>
                    <IngredientDetailsSection ingredientsText={product.ingredients} />
                  </>
                )}
              </div>
            )}

            {/* ZenScore™ breakdown */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text-primary">ZenScore™ Breakdown</h3>
                <button
                  onClick={() => setShowBreakdown(v => !v)}
                  className="flex items-center gap-1 text-xs text-accent"
                >
                  {showBreakdown ? <><ChevronUp className="w-3 h-3" />Hide details</> : <><ChevronDown className="w-3 h-3" />Show details</>}
                </button>
              </div>
              {showBreakdown && (
                <div className="space-y-2.5 mb-3">
                  {[
                    { icon: '🥦', label: 'Nutrient Balance', key: 'nutrientBalance', fallback: 'nutrition', max: 50, color: 'bg-green-500' },
                    { icon: '🧪', label: 'Additive Safety',  key: 'additiveSafety', fallback: 'additives', max: 25, color: 'bg-purple-500' },
                    { icon: '🏭', label: 'Processing Level', key: 'processingIntegrity', fallback: 'processingIntegrity', max: 15, color: 'bg-blue-500' },
                    { icon: '🌾', label: 'Ingredient Quality', key: 'ingredientQuality', fallback: 'ingredientQuality', max: 10, color: 'bg-amber-500' },
                  ].map(({ icon, label, key, fallback, max, color }) => {
                    const val = product.score_components
                      ? ((product.score_components as Record<string, number>)[key] ?? (product.score_components as Record<string, number>)[fallback] ?? 0)
                      : 0
                    const pct = Math.round((val / max) * 100)
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-text-secondary">{icon} {label}</span>
                          <span className="text-xs font-semibold text-text-primary">{val}/{max}</span>
                        </div>
                        <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="text-sm font-semibold text-text-primary">Total ZenScore™</span>
                <span className="flex items-center gap-2">
                  <span className="text-lg font-black text-text-primary">{product.healthScore.score}/100</span>
                  <GradeBadge grade={scoreToLetterGrade(product.healthScore.score)} />
                  <span className="relative group cursor-help">
                    <span className="text-text-secondary text-sm">ℹ️</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-secondary w-52 hidden group-hover:block z-10 pointer-events-none">
                      ZenScore™ rates food quality 0–100 across nutrition balance, processing level, additives, ingredients, and context fit.
                    </span>
                  </span>
                </span>
              </div>
              {showBreakdown && (
                <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                  Powered by Food Compass 2.0 (Tufts/Nature Food 2024), NOVA processing classification, and IARC/EFSA additive safety tiers.
                </p>
              )}
            </div>

            {/* Nutrient traffic lights */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <NutrientTrafficLights nutriments={product as any} />
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
                        <Image 
                          src={alt.imageUrl} 
                          alt={alt.name ?? ''} 
                          width={48}
                          height={48}
                          className="object-contain rounded-lg bg-surface-secondary shrink-0" 
                        />
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

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Utensils, X, Search, ChevronLeft, ChevronRight, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { createClient } from '@/lib/supabase/client'
import { getReadinessContext } from '@/lib/readiness'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'

interface MealItem {
  id: string
  name: string
  brand?: string
  serving_size?: string
  servings: number
  calories: number
  protein?: number
  carbs?: number
  fat?: number
}

interface Meal {
  id: string
  name: string
  meal_type: string
  logged_at: string
  notes?: string
  meal_items: MealItem[]
}

interface PeriodizationData {
  calories: number
  protein: number
  carbs: number
  fat: number
  phase: 'high-carb' | 'low-carb' | 'moderate'
  rationale: string
}

const MACRO_PIE_COLORS = { protein: '#6366f1', carbs: '#f59e0b', fat: '#10b981' }

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const MEAL_COLORS: Record<string, string> = {
  Breakfast: '#f59e0b',
  Lunch: '#3b82f6',
  Dinner: '#8b5cf6',
  Snack: '#10b981',
}

const MACRO_COLORS = {
  protein: '#ef4444',
  carbs: '#f59e0b',
  fat: '#3b82f6',
}

function MacroBar({ protein, carbs, fat, proteinGoal, carbsGoal, fatGoal }: {
  protein: number; carbs: number; fat: number
  proteinGoal?: number; carbsGoal?: number; fatGoal?: number
}) {
  const total = protein * 4 + carbs * 4 + fat * 9
  if (total === 0) return null
  const pPct = Math.round((protein * 4 / total) * 100)
  const cPct = Math.round((carbs * 4 / total) * 100)
  const fPct = 100 - pPct - cPct

  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        <div style={{ width: `${pPct}%`, background: MACRO_COLORS.protein }} />
        <div style={{ width: `${cPct}%`, background: MACRO_COLORS.carbs }} />
        <div style={{ width: `${fPct}%`, background: MACRO_COLORS.fat }} />
      </div>
      <div className="flex gap-4 text-xs text-text-secondary">
        <span>
          <span className="font-semibold" style={{ color: MACRO_COLORS.protein }}>{protein}g</span>
          {proteinGoal ? <span className="opacity-50">/{proteinGoal}g</span> : null}
          {' '}protein
        </span>
        <span>
          <span className="font-semibold" style={{ color: MACRO_COLORS.carbs }}>{carbs}g</span>
          {carbsGoal ? <span className="opacity-50">/{carbsGoal}g</span> : null}
          {' '}carbs
        </span>
        <span>
          <span className="font-semibold" style={{ color: MACRO_COLORS.fat }}>{fat}g</span>
          {fatGoal ? <span className="opacity-50">/{fatGoal}g</span> : null}
          {' '}fat
        </span>
      </div>
    </div>
  )
}

interface FoodResult {
  name: string
  brand?: string
  calories100g: number
  protein100g: number
  carbs100g: number
  fat100g: number
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function FoodSearchInput({
  value,
  onChange,
  onSelect,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onSelect: (food: FoodResult) => void
  placeholder?: string
}) {
  const [results, setResults] = useState<FoodResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebounce(value, 400)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); setOpen(false); return }
    let cancelled = false
    setSearching(true)
    fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?action=process&json=true&search_terms=${encodeURIComponent(debouncedQuery)}&fields=product_name,brands,nutriments&page_size=6&sort_by=popularity_key`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const products: FoodResult[] = (data.products ?? [])
          .filter((p: { product_name?: string; nutriments?: { 'energy-kcal_100g'?: number } }) => p.product_name && (p.nutriments?.['energy-kcal_100g'] ?? 0) > 0)
          .slice(0, 6)
          .map((p: { product_name: string; brands?: string; nutriments: Record<string, number> }) => ({
            name: p.product_name,
            brand: p.brands?.split(',')[0]?.trim(),
            calories100g: Math.round(p.nutriments['energy-kcal_100g'] ?? 0),
            protein100g: Math.round((p.nutriments['proteins_100g'] ?? 0) * 10) / 10,
            carbs100g: Math.round((p.nutriments['carbohydrates_100g'] ?? 0) * 10) / 10,
            fat100g: Math.round((p.nutriments['fat_100g'] ?? 0) * 10) / 10,
          }))
        setResults(products)
        setOpen(products.length > 0)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSearching(false) })
    return () => { cancelled = true }
  }, [debouncedQuery])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder ?? 'Food name'}
          value={value}
          onChange={(e) => { onChange(e.target.value); if (e.target.value.length >= 2) setOpen(true) }}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          className="w-full px-2.5 py-2 pr-8 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {searching
          ? <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          : <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
        }
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
          {results.map((food, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(food); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 hover:bg-surface-secondary transition-colors border-b border-border last:border-0"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-text-primary truncate">{food.name}</p>
                  {food.brand && <p className="text-xs text-text-secondary truncate">{food.brand}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-text-primary">{food.calories100g} kcal</p>
                  <p className="text-xs text-text-secondary">per 100g</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AddMealModal({
  onClose,
  onAdded,
  defaultType,
}: {
  onClose: () => void
  onAdded: () => void
  defaultType?: string
}) {
  const [mealType, setMealType] = useState(defaultType ?? 'Breakfast')
  const [mealName, setMealName] = useState('')
  const [items, setItems] = useState([{ name: '', calories: '', protein: '', carbs: '', fat: '', servings: '1' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateItem = (i: number, field: string, value: string) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const handleFoodSelect = (i: number, food: FoodResult) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? {
      ...item,
      name: food.name,
      calories: food.calories100g.toString(),
      protein: food.protein100g.toString(),
      carbs: food.carbs100g.toString(),
      fat: food.fat100g.toString(),
      servings: '1',
    } : item))
  }

  const addItem = () => {
    setItems((prev) => [...prev, { name: '', calories: '', protein: '', carbs: '', fat: '', servings: '1' }])
  }

  const removeItem = (i: number) => {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSave = async () => {
    const firstItem = items[0]
    if (!firstItem.name.trim()) { setError('Enter at least one food item'); return }
    const cal = parseInt(firstItem.calories, 10)
    if (isNaN(cal) || cal < 0) { setError('Enter valid calories for first item'); return }

    setSaving(true)
    setError('')
    try {
      const body = {
        name: mealName.trim() || mealType,
        meal_type: mealType.toLowerCase(),
        logged_at: new Date().toISOString(),
        items: items
          .filter((it) => it.name.trim())
          .map((it) => ({
            name: it.name.trim(),
            calories: parseInt(it.calories, 10) || 0,
            protein: parseFloat(it.protein) || 0,
            carbs: parseFloat(it.carbs) || 0,
            fat: parseFloat(it.fat) || 0,
            servings: parseFloat(it.servings) || 1,
            serving_size: '',
          })),
      }
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        onAdded()
        onClose()
      } else {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Failed to save meal')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="font-bold text-text-primary">Log Meal</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Meal type selector */}
          <div className="grid grid-cols-4 gap-1.5">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                  mealType === type
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Optional meal name */}
          <input
            type="text"
            placeholder={`${mealType} name (optional)`}
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          />

          {/* Food items */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Food Items</p>
            {items.map((item, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border p-3 space-y-2">
                <div className="flex gap-2">
                  <FoodSearchInput
                    value={item.name}
                    onChange={(v) => updateItem(i, 'name', v)}
                    onSelect={(food) => handleFoodSelect(i, food)}
                    placeholder="Search food or enter name…"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="p-2 text-text-secondary hover:text-red-400 rounded-lg hover:bg-surface-secondary shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {item.name && item.calories && (
                  <p className="text-xs text-text-secondary">Values shown are per 100g — adjust servings as needed</p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { field: 'calories', label: 'Cal', unit: 'kcal' },
                    { field: 'protein', label: 'Protein', unit: 'g' },
                    { field: 'carbs', label: 'Carbs', unit: 'g' },
                    { field: 'fat', label: 'Fat', unit: 'g' },
                  ].map(({ field, label, unit }) => (
                    <div key={field}>
                      <label className="text-[10px] text-text-secondary mb-0.5 block">{label}</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={(item as Record<string, string>)[field]}
                        onChange={(e) => updateItem(i, field, e.target.value)}
                        className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add another food item
            </button>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Log Meal'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MealCard({ meal, onDelete }: { meal: Meal; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const totalCal = meal.meal_items.reduce((s, it) => s + it.calories * it.servings, 0)
  const totalProtein = meal.meal_items.reduce((s, it) => s + (it.protein ?? 0) * it.servings, 0)
  const totalCarbs = meal.meal_items.reduce((s, it) => s + (it.carbs ?? 0) * it.servings, 0)
  const totalFat = meal.meal_items.reduce((s, it) => s + (it.fat ?? 0) * it.servings, 0)
  const color = MEAL_COLORS[meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)] ?? '#6366f1'
  const time = new Date(meal.logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-primary text-sm truncate">{meal.name}</span>
            <span className="text-sm font-semibold text-text-primary shrink-0">{Math.round(totalCal)} cal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">{time}</span>
            <span className="text-xs text-text-secondary">·</span>
            <span className="text-xs text-text-secondary">{meal.meal_items.length} item{meal.meal_items.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-text-secondary shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {/* Items list */}
          <div className="space-y-1.5">
            {meal.meal_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-text-primary">{item.name}</span>
                  {item.brand && <span className="text-xs text-text-secondary ml-1.5">{item.brand}</span>}
                </div>
                <span className="text-sm text-text-secondary">{Math.round(item.calories * item.servings)} cal</span>
              </div>
            ))}
          </div>

          {/* Macro bar */}
          {(totalProtein > 0 || totalCarbs > 0 || totalFat > 0) && (
            <MacroBar
              protein={Math.round(totalProtein)}
              carbs={Math.round(totalCarbs)}
              fat={Math.round(totalFat)}
            />
          )}

          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete meal
          </button>
        </div>
      )}
    </div>
  )
}

export default function NutritionPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [weeklyCalories, setWeeklyCalories] = useState<{ day: string; cal: number; date: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [defaultMealType, setDefaultMealType] = useState<string | undefined>()
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [proteinGoal, setProteinGoal] = useState(150)
  const [carbsGoal, setCarbsGoal] = useState(250)
  const [fatGoal, setFatGoal] = useState(65)
  const [readinessScore, setReadinessScore] = useState<number | null>(null)
  const [periodization, setPeriodization] = useState<PeriodizationData | null>(null)
  const [periodizationOverride, setPeriodizationOverride] = useState<'training' | 'rest' | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const [currentDate, setCurrentDate] = useState(today)
  const isToday = currentDate === today

  function shiftDate(delta: number) {
    const d = new Date(currentDate + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    const next = d.toISOString().slice(0, 10)
    if (next <= today) setCurrentDate(next)
  }

  const loadSettings = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('user_nutrition_settings')
      .select('calorie_target, protein_target, carbs_target, fat_target')
      .eq('user_id', user.id)
      .single()
    if (data) {
      if (data.calorie_target) setCalorieGoal(data.calorie_target)
      if (data.protein_target) setProteinGoal(data.protein_target)
      if (data.carbs_target) setCarbsGoal(data.carbs_target)
      if (data.fat_target) setFatGoal(data.fat_target)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/meals?date=${currentDate}`)
    if (res.ok) {
      const data = await res.json()
      setMeals(data.meals ?? [])
    }
    setLoading(false)
  }, [currentDate])

  const loadWeekly = useCallback(async () => {
    const days: { day: string; cal: number; date: string }[] = []
    const promises = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('en-US', { weekday: 'short' })
      return fetch(`/api/meals?date=${dateStr}`)
        .then((r) => r.ok ? r.json() : { meals: [] })
        .then((data) => {
          const totalCal = (data.meals ?? []).reduce((sum: number, m: Meal) =>
            sum + m.meal_items.reduce((s, it) => s + it.calories * it.servings, 0), 0)
          return { day: label, cal: Math.round(totalCal), date: dateStr }
        })
    })
    const results = await Promise.all(promises)
    setWeeklyCalories(results)
  }, [])

  useEffect(() => {
    load()
    loadSettings()
  }, [load, loadSettings])

  // Fetch readiness score for adaptive macro goals
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
        const hrvHistory = history.map((s) => s.hrv).filter((v): v is number => v != null && v > 0)
        const baselineHrv = hrvHistory.length > 0 ? hrvHistory.reduce((a, b) => a + b, 0) / hrvHistory.length : null
        if (latest.hrv && baselineHrv) {
          const dev = (latest.hrv - baselineHrv) / baselineHrv
          setReadinessScore(Math.max(0, Math.min(100, Math.round(50 + dev * 125))))
        } else if (latest.recovery_score) {
          setReadinessScore(latest.recovery_score)
        }
      } catch { /* non-critical */ }
    }
    fetchReadiness()
  }, [])

  useEffect(() => {
    loadWeekly()
  }, [loadWeekly])

  useEffect(() => {
    const params = periodizationOverride ? `?override=${periodizationOverride}` : ''
    fetch(`/api/nutrition/periodization${params}`)
      .then((r) => r.json())
      .then((d) => setPeriodization(d))
      .catch(() => {})
  }, [periodizationOverride])

  const deleteMeal = async (id: string) => {
    await fetch(`/api/meals?id=${id}`, { method: 'DELETE' })
    await load()
    loadWeekly()
  }

  // Readiness-adaptive macro context (WHOOP/Oura periodization principle)
  const readinessCtx = getReadinessContext(readinessScore)
  const adaptedCarbsGoal = Math.round(carbsGoal * readinessCtx.macroShift.carbMultiplier)
  const adaptedProteinGoal = Math.round(proteinGoal * readinessCtx.macroShift.proteinMultiplier)
  const adaptedFatGoal = Math.round(fatGoal * readinessCtx.macroShift.fatMultiplier)

  // Aggregate totals
  const totalCal = meals.reduce((s, m) =>
    s + m.meal_items.reduce((ss, it) => ss + it.calories * it.servings, 0), 0)
  const totalProtein = meals.reduce((s, m) =>
    s + m.meal_items.reduce((ss, it) => ss + (it.protein ?? 0) * it.servings, 0), 0)
  const totalCarbs = meals.reduce((s, m) =>
    s + m.meal_items.reduce((ss, it) => ss + (it.carbs ?? 0) * it.servings, 0), 0)
  const totalFat = meals.reduce((s, m) =>
    s + m.meal_items.reduce((ss, it) => ss + (it.fat ?? 0) * it.servings, 0), 0)

  // Group meals by type
  const mealsByType = MEAL_TYPES.map((type) => ({
    type,
    items: meals.filter((m) => m.meal_type.toLowerCase() === type.toLowerCase()),
  })).filter((g) => g.items.length > 0)

  const openModal = (type?: string) => {
    setDefaultMealType(type)
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1 flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary shrink-0"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0 text-center flex-1">
              <h1 className="text-base font-bold text-text-primary truncate">
                {isToday ? 'Today' : new Date(currentDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h1>
              {!isToday && (
                <button
                  type="button"
                  onClick={() => setCurrentDate(today)}
                  className="text-xs text-accent hover:underline"
                >
                  Back to today
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              disabled={isToday}
              className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary shrink-0 disabled:opacity-30"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {isToday && (
            <button
              type="button"
              onClick={() => openModal()}
              className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Log
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Daily summary */}
        {!loading && (
          <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-text-primary">{Math.round(totalCal)}</p>
                <p className="text-sm text-text-secondary">calories today</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary">Goal</p>
                <p className="text-lg font-semibold text-text-primary">{calorieGoal}</p>
                <p className={`text-xs font-medium ${totalCal <= calorieGoal ? 'text-green-400' : 'text-red-400'}`}>
                  {totalCal <= calorieGoal
                    ? `${calorieGoal - Math.round(totalCal)} remaining`
                    : `${Math.round(totalCal) - calorieGoal} over`}
                </p>
              </div>
            </div>

            {/* Calorie progress bar */}
            <div className="h-2.5 bg-surface-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${totalCal > calorieGoal ? 'bg-red-400' : 'bg-accent'}`}
                style={{ width: `${Math.min((totalCal / calorieGoal) * 100, 100)}%` }}
              />
            </div>

                        {/* Readiness-adaptive macro guidance */}
            {readinessScore != null && readinessCtx.zone !== 'optimal' && (
              <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs mt-1 ${
                readinessCtx.zone === 'peak' ? 'bg-green-500/10 border-green-500/20 text-green-300' :
                readinessCtx.zone === 'moderate' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' :
                'bg-orange-500/10 border-orange-500/20 text-orange-300'
              }`}>
                <Activity className="w-4 h-4 mt-0.5 shrink-0" />
                <span><span className="font-semibold">{readinessCtx.label}:</span> {readinessCtx.nutritionAdvice}</span>
              </div>
            )}

{/* Macros */}
            {(totalProtein > 0 || totalCarbs > 0 || totalFat > 0) && (
              <MacroBar
                protein={Math.round(totalProtein)}
                carbs={Math.round(totalCarbs)}
                fat={Math.round(totalFat)}
                proteinGoal={adaptedProteinGoal}
                carbsGoal={adaptedCarbsGoal}
                fatGoal={adaptedFatGoal}
              />
            )}
          </div>
        )}

        {/* Macro Periodization Card */}
        {periodization && (
          <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Today&apos;s Macro Targets</h2>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                  periodization.phase === 'high-carb'
                    ? 'bg-blue-500/15 text-blue-400'
                    : periodization.phase === 'low-carb'
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'bg-green-500/15 text-green-400'
                }`}>
                  {periodization.phase}
                </span>
              </div>
              {/* Training / Rest day toggle */}
              <div className="flex gap-1 text-xs">
                {(['training', 'rest'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPeriodizationOverride(periodizationOverride === mode ? null : mode)}
                    className={`px-2.5 py-1 rounded-full border transition-colors capitalize ${
                      periodizationOverride === mode
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface-secondary text-text-secondary border-border hover:text-text-primary'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-text-secondary">{periodization.rationale}</p>

            {/* Macro targets row */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Calories', value: periodization.calories, unit: 'kcal', color: 'text-accent' },
                { label: 'Protein', value: periodization.protein, unit: 'g', color: 'text-indigo-400' },
                { label: 'Carbs', value: periodization.carbs, unit: 'g', color: 'text-yellow-400' },
                { label: 'Fat', value: periodization.fat, unit: 'g', color: 'text-emerald-400' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="bg-surface-secondary rounded-lg p-2">
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-text-secondary">{unit}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Pie chart */}
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Protein', value: periodization.protein * 4, fill: MACRO_PIE_COLORS.protein },
                      { name: 'Carbs', value: periodization.carbs * 4, fill: MACRO_PIE_COLORS.carbs },
                      { name: 'Fat', value: periodization.fat * 9, fill: MACRO_PIE_COLORS.fat },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v} kcal`]}
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick add by meal type */}
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((type) => {
            const count = meals.filter((m) => m.meal_type.toLowerCase() === type.toLowerCase()).length
            return (
              <button
                key={type}
                type="button"
                onClick={() => openModal(type)}
                className="flex flex-col items-center gap-1.5 p-3 bg-surface rounded-xl border border-border hover:bg-surface-secondary transition-colors"
              >
                <div className="w-3 h-3 rounded-full" style={{ background: MEAL_COLORS[type] }} />
                <span className="text-xs font-semibold text-text-primary">{type}</span>
                {count > 0 && <span className="text-[10px] text-text-secondary">{count} logged</span>}
              </button>
            )
          })}
        </div>

        {/* Meals list */}
        {mealsByType.length > 0 && (
          <div className="space-y-4">
            {mealsByType.map(({ type, items: typeItems }) => (
              <div key={type} className="space-y-2">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: MEAL_COLORS[type] }} />
                  {type}
                </p>
                {typeItems.map((meal) => (
                  <MealCard key={meal.id} meal={meal} onDelete={() => deleteMeal(meal.id)} />
                ))}
              </div>
            ))}
          </div>
        )}

        {meals.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Utensils className="w-10 h-10 text-text-secondary/40 mb-3" />
            <p className="text-text-secondary text-sm">No meals logged today.</p>
            <p className="text-text-secondary text-xs mt-1">Tap Log to record what you ate.</p>
          </div>
        )}

        {/* 7-day calorie chart */}
        {weeklyCalories.some((d) => d.cal > 0) && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Last 7 Days</p>
            <div className="bg-surface rounded-xl border border-border p-4">
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={weeklyCalories} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface, #1a1a1a)',
                      border: '1px solid var(--color-border, #333)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${value} cal`, 'Calories']}
                  />
                  <ReferenceLine
                    y={calorieGoal}
                    stroke="rgba(99,102,241,0.4)"
                    strokeDasharray="4 4"
                    label={{ value: 'Goal', position: 'right', fontSize: 10, fill: 'rgba(99,102,241,0.7)' }}
                  />
                  <Bar dataKey="cal" radius={[4, 4, 0, 0]}>
                    {weeklyCalories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.date === today ? '#6366f1' : 'rgba(99,102,241,0.4)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      {showModal && (
        <AddMealModal
          onClose={() => setShowModal(false)}
          onAdded={() => { load(); loadWeekly() }}
          defaultType={defaultMealType}
        />
      )}
    </div>
  )
}

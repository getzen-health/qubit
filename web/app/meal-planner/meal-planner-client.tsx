'use client'

import { useState, useCallback, useTransition } from 'react'
import dynamic from 'next/dynamic'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  Line,
} from 'recharts'
import {
  Search,
  Plus,
  Loader2,
  UtensilsCrossed,
  Target,
  TrendingUp,
  Clock,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Leaf,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Minus,
} from 'lucide-react'
import {
  searchOpenFoodFacts,
  sumFoodMacros,
  calculateTDEE,
  calculateMacroTargets,
  calculateDietAdherenceScore,
  glLabel,
  MEAL_TEMPLATES,
  type FoodItem,
  type MealEntry,
  type MacroTargets,
  type TDEEResult,
  type ActivityLevel,
  type DietGoal,
  type MealType,
} from '@/lib/meal-planner'

const BarChart = dynamic(() => import('recharts').then((m) => ({ default: m.BarChart })), { ssr: false })
const LineChart = dynamic(() => import('recharts').then((m) => ({ default: m.LineChart })), { ssr: false })

// ─── Props ────────────────────────────────────────────────────────────────────

interface DaySummary {
  date: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  gl: number
  meal_count: number
}

interface NutritionSettings {
  weight_kg?: number | null
  height_cm?: number | null
  age?: number | null
  sex?: string | null
  activity_level?: string | null
  goal?: string | null
  body_fat_pct?: number | null
}

interface Props {
  todayMeals: MealEntry[]
  weekSummary: DaySummary[]
  settings: NutritionSettings | null
  macroTargets: MacroTargets | null
  tdee: TDEEResult | null
  adherenceScore: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Tab = 'log' | 'today' | 'targets' | 'insights'

function MacroRing({
  label,
  value,
  target,
  color,
  unit = 'g',
}: {
  label: string
  value: number
  target: number
  color: string
  unit?: string
}) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0
  const r = 30
  const circ = 2 * Math.PI * r
  const strokeDash = `${(pct / 100) * circ} ${circ}`

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={72} height={72} className="-rotate-90">
        <circle cx={36} cy={36} r={r} fill="none" stroke="currentColor" strokeWidth={6} className="text-border" />
        <circle
          cx={36}
          cy={36}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={strokeDash}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center -mt-1">
        <p className="text-sm font-bold text-text-primary" style={{ color }}>
          {Math.round(value)}{unit}
        </p>
        <p className="text-[10px] text-text-secondary">/ {Math.round(target)}{unit}</p>
        <p className="text-[10px] font-medium text-text-secondary">{label}</p>
      </div>
    </div>
  )
}

function ProgressBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0
  return (
    <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

const MEAL_COLORS: Record<MealType, string> = {
  breakfast: '#f59e0b',
  lunch: '#10b981',
  dinner: '#3b82f6',
  snack: '#a855f7',
}

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '☀️',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍎',
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MealPlannerClient({
  todayMeals: initialMeals,
  weekSummary,
  settings,
  macroTargets: initialTargets,
  tdee: initialTdee,
  adherenceScore: initialScore,
}: Props) {
  const [tab, setTab] = useState<Tab>('today')
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>(initialMeals)
  const [macroTargets, setMacroTargets] = useState<MacroTargets | null>(initialTargets)
  const [tdeeResult, setTdeeResult] = useState<TDEEResult | null>(initialTdee)
  const [isPending, startTransition] = useTransition()

  // ── Log tab state ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [stagingFoods, setStagingFoods] = useState<FoodItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  // ── Targets tab state ──────────────────────────────────────────────────────
  const [formWeight, setFormWeight] = useState(String(settings?.weight_kg ?? ''))
  const [formHeight, setFormHeight] = useState(String(settings?.height_cm ?? ''))
  const [formAge, setFormAge] = useState(String(settings?.age ?? ''))
  const [formSex, setFormSex] = useState<'male' | 'female'>(
    (settings?.sex as 'male' | 'female') ?? 'male',
  )
  const [formActivity, setFormActivity] = useState<ActivityLevel>(
    (settings?.activity_level as ActivityLevel) ?? 'moderate',
  )
  const [formGoal, setFormGoal] = useState<DietGoal>((settings?.goal as DietGoal) ?? 'maintain')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // ── Derived ────────────────────────────────────────────────────────────────
  const adherenceScore = macroTargets
    ? calculateDietAdherenceScore(todayMeals, macroTargets)
    : (initialScore ?? 0)

  const todayTotals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.total_calories,
      protein_g: acc.protein_g + m.total_protein_g,
      carbs_g: acc.carbs_g + m.total_carbs_g,
      fat_g: acc.fat_g + m.total_fat_g,
      fiber_g: acc.fiber_g + m.total_fiber_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
  )

  const stagingTotals = sumFoodMacros(stagingFoods)

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setSearching(true)
    const results = await searchOpenFoodFacts(query.trim())
    setSearchResults(results)
    setSearching(false)
  }, [query])

  const addFoodToStaging = (food: FoodItem) => {
    setStagingFoods((prev) => [...prev, { ...food, quantity_g: 100 }])
    setSearchResults([])
    setQuery('')
  }

  const addTemplateToStaging = (templateIdx: number) => {
    const t = MEAL_TEMPLATES[templateIdx]
    setMealType(t.type)
    setStagingFoods([
      {
        name: t.name,
        quantity_g: 100,
        calories_per_100g: t.macros.calories,
        protein_per_100g: t.macros.protein_g,
        carbs_per_100g: t.macros.carbs_g,
        fat_per_100g: t.macros.fat_g,
        fiber_per_100g: t.macros.fiber_g,
      },
    ])
    setShowTemplates(false)
  }

  const updateQuantity = (idx: number, val: string) => {
    const qty = parseFloat(val)
    if (isNaN(qty) || qty <= 0) return
    setStagingFoods((prev) => prev.map((f, i) => (i === idx ? { ...f, quantity_g: qty } : f)))
  }

  const removeFood = (idx: number) => {
    setStagingFoods((prev) => prev.filter((_, i) => i !== idx))
  }

  const submitMeal = async () => {
    if (stagingFoods.length === 0) return
    setSubmitting(true)
    const totals = sumFoodMacros(stagingFoods)
    const payload = {
      type: 'meal',
      meal_type: mealType,
      foods: stagingFoods,
      ...totals,
      date: new Date().toISOString().split('T')[0],
    }
    const res = await fetch('/api/meal-planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const logged = await res.json()
      startTransition(() => {
        setTodayMeals((prev) => [...prev, logged as MealEntry])
        setStagingFoods([])
        setTab('today')
      })
    }
    setSubmitting(false)
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    const w = parseFloat(formWeight)
    const h = parseFloat(formHeight)
    const a = parseInt(formAge, 10)
    if (!w || !h || !a) {
      setSavingSettings(false)
      return
    }
    const newTdee = calculateTDEE(w, h, a, formSex, formActivity)
    const newMacros = calculateMacroTargets(newTdee.tdee, formGoal, w)
    setTdeeResult(newTdee)
    setMacroTargets(newMacros)

    await fetch('/api/meal-planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'settings',
        weight_kg: w,
        height_cm: h,
        age: a,
        sex: formSex,
        activity_level: formActivity,
        goal: formGoal,
      }),
    })
    setSavingSettings(false)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2500)
  }

  // ── Chart data ─────────────────────────────────────────────────────────────
  const weekChartData = weekSummary.map((d) => ({
    date: new Date(d.date + 'T00:00').toLocaleDateString('en', { weekday: 'short' }),
    calories: Math.round(d.calories),
    protein: Math.round(d.protein_g),
    fiber: Math.round(d.fiber_g),
    adherence: macroTargets
      ? calculateDietAdherenceScore(
          todayMeals.filter((m) => m.timestamp?.startsWith(d.date)),
          macroTargets,
        )
      : 0,
    target_cal: macroTargets?.calories ?? 2000,
  }))

  const nutritionGaps = macroTargets
    ? [
        { nutrient: 'Protein', gap: macroTargets.protein_g - todayTotals.protein_g, unit: 'g', color: '#ef4444' },
        { nutrient: 'Fiber', gap: macroTargets.fiber_g - todayTotals.fiber_g, unit: 'g', color: '#10b981' },
        { nutrient: 'Calories', gap: macroTargets.calories - todayTotals.calories, unit: 'kcal', color: '#f59e0b' },
      ].filter((g) => g.gap > 0)
    : []

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'log', label: 'Log', icon: <Plus className="w-3.5 h-3.5" /> },
    { id: 'today', label: 'Today', icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
    { id: 'targets', label: 'Targets', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'insights', label: 'Insights', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-surface rounded-2xl p-1 border border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors ${
              tab === t.id
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── LOG TAB ── */}
      {tab === 'log' && (
        <div className="space-y-4">
          {/* Meal type selector */}
          <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Meal Type</p>
            <div className="grid grid-cols-4 gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mt) => (
                <button
                  key={mt}
                  onClick={() => setMealType(mt)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                    mealType === mt
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-text-secondary hover:border-accent/50'
                  }`}
                >
                  {MEAL_ICONS[mt]} {mt.charAt(0).toUpperCase() + mt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Food search */}
          <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Search Food</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search OpenFoodFacts…"
                  className="w-full pl-9 pr-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((food, i) => (
                  <button
                    key={i}
                    onClick={() => addFoodToStaging(food)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-secondary text-left transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary truncate max-w-[200px]">{food.name}</p>
                      <p className="text-xs text-text-secondary">
                        {food.calories_per_100g} kcal · {food.protein_per_100g}g P · {food.carbs_per_100g}g C · {food.fat_per_100g}g F
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-accent shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Template picker */}
            <button
              onClick={() => setShowTemplates((v) => !v)}
              className="w-full py-2 text-xs text-accent font-medium hover:underline flex items-center justify-center gap-1"
            >
              <ChefHat className="w-3.5 h-3.5" /> Add from meal templates
            </button>

            {showTemplates && (
              <div className="space-y-1 max-h-56 overflow-y-auto border-t border-border pt-3">
                {MEAL_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => addTemplateToStaging(i)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-secondary text-left transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{t.name}</p>
                      <p className="text-xs text-text-secondary">
                        {t.macros.calories} kcal · {t.macros.protein_g}g P · ⏱ {t.prepTime}min
                      </p>
                      <div className="flex gap-1 mt-0.5">
                        {t.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm">{MEAL_ICONS[t.type]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Staging foods */}
          {stagingFoods.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Foods in this meal</p>
              {stagingFoods.map((food, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{food.name}</p>
                    <p className="text-xs text-text-secondary">
                      {Math.round((food.calories_per_100g * food.quantity_g) / 100)} kcal
                    </p>
                  </div>
                  <input
                    type="number"
                    value={food.quantity_g}
                    onChange={(e) => updateQuantity(i, e.target.value)}
                    className="w-16 text-center py-1.5 bg-surface-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                  <span className="text-xs text-text-secondary">g</span>
                  <button onClick={() => removeFood(i)} className="p-1 hover:bg-surface-secondary rounded-lg">
                    <Minus className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>
              ))}

              {/* Running totals */}
              <div className="pt-3 border-t border-border grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'kcal', value: stagingTotals.total_calories, color: '#f59e0b' },
                  { label: 'Protein', value: stagingTotals.total_protein_g, color: '#ef4444' },
                  { label: 'Carbs', value: stagingTotals.total_carbs_g, color: '#f59e0b' },
                  { label: 'Fat', value: stagingTotals.total_fat_g, color: '#3b82f6' },
                ].map((m) => (
                  <div key={m.label}>
                    <p className="text-sm font-bold" style={{ color: m.color }}>{Math.round(m.value)}</p>
                    <p className="text-[10px] text-text-secondary">{m.label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={submitMeal}
                disabled={submitting || isPending}
                className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Log {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TODAY TAB ── */}
      {tab === 'today' && (
        <div className="space-y-4">
          {/* Adherence score */}
          {macroTargets && (
            <div className="bg-surface rounded-2xl border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold">Diet Adherence</p>
                <p className="text-3xl font-bold text-text-primary mt-0.5">{adherenceScore}<span className="text-base text-text-secondary">/100</span></p>
              </div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center border-4 font-bold text-lg"
                style={{
                  borderColor: adherenceScore >= 75 ? '#10b981' : adherenceScore >= 50 ? '#f59e0b' : '#ef4444',
                  color: adherenceScore >= 75 ? '#10b981' : adherenceScore >= 50 ? '#f59e0b' : '#ef4444',
                }}
              >
                {adherenceScore >= 75 ? '✓' : adherenceScore >= 50 ? '~' : '!'}
              </div>
            </div>
          )}

          {/* Macro rings */}
          {macroTargets && (
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Today's Macros</p>
              <div className="grid grid-cols-4 gap-2">
                <MacroRing label="Calories" value={todayTotals.calories} target={macroTargets.calories} color="#f59e0b" unit=" kcal" />
                <MacroRing label="Protein" value={todayTotals.protein_g} target={macroTargets.protein_g} color="#ef4444" />
                <MacroRing label="Carbs" value={todayTotals.carbs_g} target={macroTargets.carbs_g} color="#f59e0b" />
                <MacroRing label="Fat" value={todayTotals.fat_g} target={macroTargets.fat_g} color="#3b82f6" />
              </div>
            </div>
          )}

          {/* Fiber + GL */}
          {macroTargets && (
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-text-primary">Fiber</span>
                </div>
                <span className="text-sm text-text-secondary">
                  {Math.round(todayTotals.fiber_g)}g / {macroTargets.fiber_g}g
                </span>
              </div>
              <ProgressBar value={todayTotals.fiber_g} target={macroTargets.fiber_g} color="#10b981" />

              {/* GL summary */}
              {todayMeals.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm text-text-secondary">Avg Glycemic Load</span>
                  <span className={`text-sm font-semibold ${glLabel(todayMeals.reduce((s, m) => s + m.glycemic_load, 0) / todayMeals.length).color}`}>
                    {glLabel(todayMeals.reduce((s, m) => s + m.glycemic_load, 0) / todayMeals.length).label}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Meal timeline */}
          {todayMeals.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-border p-8 flex flex-col items-center gap-3 text-center">
              <UtensilsCrossed className="w-10 h-10 text-text-secondary opacity-30" />
              <p className="text-sm text-text-secondary">No meals logged today. Tap <strong>Log</strong> to add your first meal.</p>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Meal Timeline</p>
              <div className="space-y-3">
                {todayMeals.map((meal, i) => {
                  const mt = meal.meal_type as MealType
                  const color = MEAL_COLORS[mt]
                  return (
                    <div key={meal.id ?? i} className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: color + '20', color }}
                      >
                        {MEAL_ICONS[mt]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-text-primary capitalize">{mt}</p>
                          <p className="text-xs text-text-secondary">{Math.round(meal.total_calories)} kcal</p>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {Math.round(meal.total_protein_g)}g P · {Math.round(meal.total_carbs_g)}g C · {Math.round(meal.total_fat_g)}g F
                        </p>
                        {meal.glycemic_load > 0 && (
                          <span className={`text-[10px] font-medium ${glLabel(meal.glycemic_load).color}`}>
                            {glLabel(meal.glycemic_load).label}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TARGETS TAB ── */}
      {tab === 'targets' && (
        <div className="space-y-4">
          <div className="bg-surface rounded-2xl border border-border p-4 space-y-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">TDEE Calculator</p>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-xs text-text-secondary">Weight (kg)</span>
                <input
                  type="number"
                  value={formWeight}
                  onChange={(e) => setFormWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
                  placeholder="70"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs text-text-secondary">Height (cm)</span>
                <input
                  type="number"
                  value={formHeight}
                  onChange={(e) => setFormHeight(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
                  placeholder="175"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs text-text-secondary">Age</span>
                <input
                  type="number"
                  value={formAge}
                  onChange={(e) => setFormAge(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
                  placeholder="30"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs text-text-secondary">Sex</span>
                <select
                  value={formSex}
                  onChange={(e) => setFormSex(e.target.value as 'male' | 'female')}
                  className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs text-text-secondary">Activity Level</span>
              <select
                value={formActivity}
                onChange={(e) => setFormActivity(e.target.value as ActivityLevel)}
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="sedentary">Sedentary (desk job, no exercise)</option>
                <option value="light">Light (1-3 days/week exercise)</option>
                <option value="moderate">Moderate (3-5 days/week exercise)</option>
                <option value="active">Active (6-7 days/week exercise)</option>
                <option value="very_active">Very Active (athlete / physical job)</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs text-text-secondary">Goal</span>
              <div className="grid grid-cols-3 gap-2">
                {(['cut', 'maintain', 'bulk'] as DietGoal[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setFormGoal(g)}
                    className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                      formGoal === g
                        ? 'bg-accent border-accent text-white'
                        : 'border-border text-text-secondary hover:border-accent/50'
                    }`}
                  >
                    {g === 'cut' ? '🔥 Cut' : g === 'maintain' ? '⚖️ Maintain' : '💪 Bulk'}
                  </button>
                ))}
              </div>
            </label>

            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : settingsSaved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              {settingsSaved ? 'Saved!' : 'Calculate & Save Targets'}
            </button>
          </div>

          {/* Calculated results */}
          {tdeeResult && macroTargets && (
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Your Results</p>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'BMR', value: tdeeResult.bmr, unit: 'kcal', color: '#a855f7' },
                  { label: 'TDEE', value: tdeeResult.tdee, unit: 'kcal', color: '#3b82f6' },
                  { label: 'Target', value: macroTargets.calories, unit: 'kcal', color: '#10b981' },
                ].map((item) => (
                  <div key={item.label} className="bg-surface-secondary rounded-xl p-3">
                    <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[10px] text-text-secondary">{item.unit}</p>
                    <p className="text-xs font-medium text-text-secondary mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Daily Macro Targets</p>
                {[
                  { icon: <Flame className="w-4 h-4" />, label: 'Calories', value: macroTargets.calories, unit: 'kcal', color: '#f59e0b' },
                  { icon: <Beef className="w-4 h-4" />, label: 'Protein', value: macroTargets.protein_g, unit: 'g', color: '#ef4444' },
                  { icon: <Wheat className="w-4 h-4" />, label: 'Carbs', value: macroTargets.carbs_g, unit: 'g', color: '#f59e0b' },
                  { icon: <Droplets className="w-4 h-4" />, label: 'Fat', value: macroTargets.fat_g, unit: 'g', color: '#3b82f6' },
                  { icon: <Leaf className="w-4 h-4" />, label: 'Fiber', value: macroTargets.fiber_g, unit: 'g', color: '#10b981' },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2" style={{ color: m.color }}>
                      {m.icon}
                      <span className="text-sm text-text-primary">{m.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">
                      {m.value} {m.unit}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-surface-secondary rounded-xl text-xs text-text-secondary space-y-1">
                <p>📐 Mifflin-St Jeor equation (Frankenfield 2005, ±10% accuracy)</p>
                <p>🥩 Protein: {formGoal === 'cut' ? '2.0' : formGoal === 'bulk' ? '2.2' : '1.6'}g/kg (Morton 2018 BJSM meta-analysis)</p>
                <p>🌿 Fiber: 14g/1000kcal (Threapleton 2013 BMJ, ↓16% CVD per 10g/day)</p>
              </div>
            </div>
          )}

          {!tdeeResult && (
            <div className="bg-surface rounded-2xl border border-border p-6 text-center text-sm text-text-secondary">
              Fill in your stats above to calculate personalized TDEE and macro targets.
            </div>
          )}
        </div>
      )}

      {/* ── INSIGHTS TAB ── */}
      {tab === 'insights' && (
        <div className="space-y-4">
          {/* 7-day adherence bar chart */}
          {weekSummary.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">7-Day Calorie Adherence</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${Math.round(v)} kcal`, 'Calories']}
                  />
                  <Bar dataKey="calories" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  {macroTargets && (
                    <Line
                      type="monotone"
                      dataKey="target_cal"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="4 4"
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Protein consistency line chart */}
          {weekSummary.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Protein Consistency</p>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={weekChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${Math.round(v)}g`, 'Protein']}
                  />
                  <Line type="monotone" dataKey="protein" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Fiber trend */}
          {weekSummary.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Fiber Trend</p>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={weekChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${Math.round(v)}g`, 'Fiber']}
                  />
                  <Line type="monotone" dataKey="fiber" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Best/worst days */}
          {weekSummary.length > 1 && (
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Weekly Highlights</p>
              {(() => {
                const sorted = [...weekSummary].sort((a, b) => b.calories - a.calories)
                const best = sorted[0]
                const worst = sorted[sorted.length - 1]
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-500/10 rounded-xl p-3">
                      <p className="text-xs text-green-400 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Best Day</p>
                      <p className="text-sm font-bold text-text-primary mt-1">
                        {new Date(best.date + 'T00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-text-secondary">{Math.round(best.calories)} kcal · {best.meal_count} meals</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-xl p-3">
                      <p className="text-xs text-yellow-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Needs Work</p>
                      <p className="text-sm font-bold text-text-primary mt-1">
                        {new Date(worst.date + 'T00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-text-secondary">{Math.round(worst.calories)} kcal · {worst.meal_count} meals</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Nutrient gap summary */}
          {nutritionGaps.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Today's Nutrient Gaps</p>
              {nutritionGaps.map((gap) => (
                <div key={gap.nutrient} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">{gap.nutrient}</span>
                  <span className="text-sm font-semibold" style={{ color: gap.color }}>
                    {Math.round(gap.gap)} {gap.unit} short
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Meal timing analysis */}
          <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Meal Timing</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-primary">
                {todayMeals.length} meal{todayMeals.length !== 1 ? 's' : ''} logged today
              </span>
            </div>
            {todayMeals.length < 3 && (
              <p className="text-xs text-yellow-400 bg-yellow-400/10 rounded-xl p-2.5">
                💡 Areta 2013 (J Physiol): distributing protein across 3-4 meals every 3-4h maximises muscle protein synthesis.
              </p>
            )}
            {todayMeals.length >= 3 && (
              <p className="text-xs text-green-400 bg-green-400/10 rounded-xl p-2.5">
                ✓ Great meal frequency! Aim to space meals 3-4h apart for optimal protein utilisation.
              </p>
            )}
          </div>

          {weekSummary.length === 0 && (
            <div className="bg-surface rounded-2xl border border-border p-8 flex flex-col items-center gap-3 text-center">
              <TrendingUp className="w-10 h-10 text-text-secondary opacity-30" />
              <p className="text-sm text-text-secondary">Log meals for 2+ days to unlock weekly insights.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// local alias to avoid unused-import error
function ChefHat({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
      <line x1="6" x2="18" y1="17" y2="17" />
    </svg>
  )
}

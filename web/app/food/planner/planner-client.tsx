'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  Loader2,
  CalendarCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealType = (typeof MEAL_TYPES)[number]

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

type MealPlan = {
  id: string
  plan_date: string
  meal_type: string
  food_name: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  notes: string | null
}

type ScanRecord = {
  id: string
  product_name: string
  brand: string | null
  thumbnail_url: string | null
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().split('T')[0]
}

function formatDayLabel(dateStr: string): { day: string; date: string; isToday: boolean } {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return {
    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    isToday: d.getTime() === today.getTime(),
  }
}

// ─── Add Food Modal ───────────────────────────────────────────────────────────

type FoodPayload = {
  food_name: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
}

function AddFoodModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (food: FoodPayload) => void
}) {
  const [tab, setTab] = useState<'history' | 'manual'>('history')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ScanRecord[]>([])
  const [searching, setSearching] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualCals, setManualCals] = useState('')
  const [manualProtein, setManualProtein] = useState('')
  const [manualCarbs, setManualCarbs] = useState('')
  const [manualFat, setManualFat] = useState('')

  const searchHistory = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch('/api/food/history?limit=50')
      if (!res.ok) return
      const json = await res.json()
      const lower = q.toLowerCase()
      setResults(
        (json.scans ?? []).filter((s: ScanRecord) =>
          s.product_name.toLowerCase().includes(lower)
        )
      )
    } finally {
      setSearching(false)
    }
  }, [])

  function submitManual() {
    if (!manualName.trim()) return
    onAdd({
      food_name: manualName.trim(),
      calories: manualCals ? Math.round(parseFloat(manualCals)) : undefined,
      protein_g: manualProtein ? parseFloat(manualProtein) : undefined,
      carbs_g: manualCarbs ? parseFloat(manualCarbs) : undefined,
      fat_g: manualFat ? parseFloat(manualFat) : undefined,
    })
  }

  const inputCls =
    'w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 z-10 max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary">Add Food</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['history', 'manual'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === t
                  ? 'bg-accent text-white'
                  : 'bg-surface text-text-secondary hover:bg-surface-secondary'
              )}
            >
              {t === 'history' ? 'Search History' : 'Manual Entry'}
            </button>
          ))}
        </div>

        {tab === 'history' ? (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              <input
                type="text"
                placeholder="Search your food history…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  searchHistory(e.target.value)
                }}
                className={cn(inputCls, 'pl-9')}
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1 space-y-2 min-h-[120px]">
              {searching && (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                </div>
              )}
              {!searching && query && results.length === 0 && (
                <p className="text-center text-sm text-text-secondary py-6">
                  No results — try Manual Entry.
                </p>
              )}
              {!searching && !query && (
                <p className="text-center text-sm text-text-secondary py-6">
                  Type to search your scan history.
                </p>
              )}
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onAdd({ food_name: r.product_name })}
                  className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-surface-secondary transition-colors text-left"
                >
                  {r.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.thumbnail_url}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface-alt flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {r.product_name}
                    </p>
                    {r.brand && (
                      <p className="text-xs text-text-secondary truncate">{r.brand}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-3 overflow-y-auto flex-1">
            <input
              type="text"
              placeholder="Food name *"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className={inputCls}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                placeholder="Calories"
                value={manualCals}
                onChange={(e) => setManualCals(e.target.value)}
                className={inputCls}
              />
              <input
                type="number"
                min="0"
                placeholder="Protein (g)"
                value={manualProtein}
                onChange={(e) => setManualProtein(e.target.value)}
                className={inputCls}
              />
              <input
                type="number"
                min="0"
                placeholder="Carbs (g)"
                value={manualCarbs}
                onChange={(e) => setManualCarbs(e.target.value)}
                className={inputCls}
              />
              <input
                type="number"
                min="0"
                placeholder="Fat (g)"
                value={manualFat}
                onChange={(e) => setManualFat(e.target.value)}
                className={inputCls}
              />
            </div>
            <button
              onClick={submitManual}
              disabled={!manualName.trim()}
              className="w-full py-3 bg-accent text-white rounded-xl font-medium text-sm disabled:opacity-50 transition-opacity"
            >
              Add to Plan
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Planner Grid ─────────────────────────────────────────────────────────────

export function PlannerClient({
  initialPlans,
  startDate,
}: {
  initialPlans: MealPlan[]
  startDate: string
}) {
  const [plans, setPlans] = useState<MealPlan[]>(initialPlans)
  const [adding, setAdding] = useState<{ date: string; meal_type: MealType } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copyingToToday, setCopyingToToday] = useState<string | null>(null)
  const [copyingWeek, setCopyingWeek] = useState(false)

  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))
  const prevWeek = getMondayOf(addDays(startDate, -7))
  const nextWeek = getMondayOf(addDays(startDate, 7))

  const weekLabel = (() => {
    const s = new Date(startDate + 'T00:00:00')
    const e = new Date(addDays(startDate, 6) + 'T00:00:00')
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  })()

  function plansForCell(date: string, mealType: MealType) {
    return plans.filter((p) => p.plan_date === date && p.meal_type === mealType)
  }

  function dailyCalories(date: string) {
    return plans
      .filter((p) => p.plan_date === date)
      .reduce((sum, p) => sum + (p.calories ?? 0), 0)
  }

  async function handleAddFood(food: FoodPayload) {
    if (!adding) return
    const res = await fetch('/api/meal-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_date: adding.date,
        meal_type: adding.meal_type,
        food_name: food.food_name,
        calories: food.calories ?? null,
        protein_g: food.protein_g ?? null,
        carbs_g: food.carbs_g ?? null,
        fat_g: food.fat_g ?? null,
      }),
    })
    if (res.ok) {
      const json = await res.json()
      setPlans((prev) => [...prev, json.plan])
    }
    setAdding(null)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/meal-plans?id=${id}`, { method: 'DELETE' })
    if (res.ok) setPlans((prev) => prev.filter((p) => p.id !== id))
    setDeleting(null)
  }

  async function handleCopyToToday(plan: MealPlan) {
    setCopyingToToday(plan.id)
    try {
      const today = new Date().toISOString().split('T')[0]
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: MEAL_LABELS[plan.meal_type as MealType] ?? plan.meal_type,
          meal_type: plan.meal_type,
          logged_at: `${today}T12:00:00.000Z`,
          items: [
            {
              name: plan.food_name,
              calories: Math.round(plan.calories ?? 0),
              protein: plan.protein_g ?? 0,
              carbs: plan.carbs_g ?? 0,
              fat: plan.fat_g ?? 0,
              serving_size: '1 serving',
              servings: 1,
              source: 'manual' as const,
            },
          ],
        }),
      })
    } finally {
      setCopyingToToday(null)
    }
  }

  async function handleCopyLastWeek() {
    setCopyingWeek(true)
    try {
      const lastWeekStart = addDays(startDate, -7)
      const res = await fetch(`/api/meal-plans?startDate=${lastWeekStart}`)
      if (!res.ok) return
      const { plans: lastWeekPlans } = (await res.json()) as { plans: MealPlan[] }

      const newPlans: MealPlan[] = []
      for (const p of lastWeekPlans) {
        const dayOffset = Math.round(
          (new Date(p.plan_date + 'T00:00:00').getTime() -
            new Date(lastWeekStart + 'T00:00:00').getTime()) /
            86400000
        )
        const newDate = addDays(startDate, dayOffset)
        const exists = plans.some(
          (ep) =>
            ep.plan_date === newDate &&
            ep.meal_type === p.meal_type &&
            ep.food_name === p.food_name
        )
        if (!exists) {
          const r = await fetch('/api/meal-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              plan_date: newDate,
              meal_type: p.meal_type,
              food_name: p.food_name,
              calories: p.calories,
              protein_g: p.protein_g,
              carbs_g: p.carbs_g,
              fat_g: p.fat_g,
            }),
          })
          if (r.ok) {
            const json = await r.json()
            newPlans.push(json.plan)
          }
        }
      }
      setPlans((prev) => [...prev, ...newPlans])
    } finally {
      setCopyingWeek(false)
    }
  }

  return (
    <>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <Link
          href={`/food/planner?week=${prevWeek}`}
          className="p-2 rounded-lg bg-surface hover:bg-surface-secondary transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <span className="text-sm font-semibold text-text-primary">{weekLabel}</span>
        <Link
          href={`/food/planner?week=${nextWeek}`}
          className="p-2 rounded-lg bg-surface hover:bg-surface-secondary transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </Link>
      </div>

      {/* Copy last week */}
      <div className="flex justify-end mb-3 px-1">
        <button
          onClick={handleCopyLastWeek}
          disabled={copyingWeek}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-sm text-text-secondary transition-colors disabled:opacity-50"
        >
          {copyingWeek ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          Copy last week
        </button>
      </div>

      {/* Horizontal-scroll grid */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[700px]">
          {/* Day header row */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {days.map((d) => {
              const { day, date, isToday } = formatDayLabel(d)
              return (
                <div
                  key={d}
                  className={cn(
                    'rounded-xl px-2 py-2 text-center',
                    isToday
                      ? 'bg-accent/10 border border-accent/30'
                      : 'bg-surface border border-transparent'
                  )}
                >
                  <p
                    className={cn(
                      'text-[11px] font-semibold uppercase tracking-wide',
                      isToday ? 'text-accent' : 'text-text-secondary'
                    )}
                  >
                    {day}
                  </p>
                  <p
                    className={cn(
                      'text-sm font-bold',
                      isToday ? 'text-accent' : 'text-text-primary'
                    )}
                  >
                    {date}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Meal type rows */}
          {MEAL_TYPES.map((mealType) => (
            <div key={mealType} className="mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1 mb-1">
                {MEAL_LABELS[mealType]}
              </p>
              <div className="grid grid-cols-7 gap-1.5">
                {days.map((d) => {
                  const cellPlans = plansForCell(d, mealType)
                  return (
                    <div
                      key={d}
                      className="bg-surface rounded-xl p-2 min-h-[88px] flex flex-col gap-1"
                    >
                      {cellPlans.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-start gap-1 bg-surface-secondary rounded-lg px-2 py-1.5"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-text-primary leading-tight line-clamp-2">
                              {p.food_name}
                            </p>
                            {p.calories != null && (
                              <p className="text-[10px] text-text-secondary mt-0.5">
                                {p.calories} kcal
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 flex-shrink-0 ml-0.5">
                            <button
                              onClick={() => handleCopyToToday(p)}
                              disabled={copyingToToday === p.id}
                              title="Log to today's diary"
                              className="p-0.5 rounded hover:bg-accent/20 text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
                            >
                              {copyingToToday === p.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CalendarCheck className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={deleting === p.id}
                              title="Remove"
                              className="p-0.5 rounded hover:bg-red-500/20 text-text-secondary hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                              {deleting === p.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setAdding({ date: d, meal_type: mealType })}
                        className="mt-auto flex items-center justify-center w-full py-1.5 rounded-lg border border-dashed border-border hover:border-accent/60 hover:bg-accent/5 transition-colors group"
                        aria-label={`Add ${mealType} on ${d}`}
                      >
                        <Plus className="w-3.5 h-3.5 text-text-secondary group-hover:text-accent transition-colors" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Daily calorie totals */}
          <div className="grid grid-cols-7 gap-1.5 mt-2">
            {days.map((d) => {
              const total = dailyCalories(d)
              return (
                <div key={d} className="bg-surface rounded-xl px-2 py-2 text-center">
                  <p className="text-[9px] text-text-secondary uppercase tracking-wide mb-0.5">
                    Total
                  </p>
                  {total > 0 ? (
                    <>
                      <p className="text-sm font-bold text-accent">{total.toLocaleString()}</p>
                      <p className="text-[9px] text-text-secondary">kcal</p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-text-secondary">—</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {adding && <AddFoodModal onClose={() => setAdding(null)} onAdd={handleAddFood} />}
    </>
  )
}

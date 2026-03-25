import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { DiaryClient } from './diary-client'

// ── constants ──────────────────────────────────────────────────────────────────

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'other'] as const
type MealType = (typeof MEAL_TYPES)[number]

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
  other: 'Other',
}

const MACRO_DEFAULTS = {
  calories_target: 2000,
  protein_target: 150,
  carbs_target: 250,
  fat_target: 65,
}

// ── types ──────────────────────────────────────────────────────────────────────

interface MealItem {
  id: string
  meal_id: string
  name: string
  brand: string | null
  serving_size: string
  servings: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Meal {
  id: string
  name: string
  meal_type: string
  logged_at: string
  meal_items: MealItem[]
}

interface NutritionTargets {
  calories_target: number
  protein_target: number
  carbs_target: number
  fat_target: number
}

interface MacroCardProps {
  label: string
  consumed: number
  target: number
  unit: string
  borderColor: string
  textColor: string
  barColor: string
}

// ── helpers ────────────────────────────────────────────────────────────────────

function parseDateParam(raw: string | string[] | undefined): string {
  const s = Array.isArray(raw) ? raw[0] : raw
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date().toISOString().slice(0, 10)
  }
  return s
}

function shiftDate(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function formatDisplayDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = shiftDate(today, -1)
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const d = new Date(`${dateStr}T00:00:00Z`)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// ── server component ───────────────────────────────────────────────────────────

export default async function FoodDiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const dateStr = parseDateParam(params.date)
  const nextDateStr = shiftDate(dateStr, 1)

  const [{ data: mealsRaw }, { data: nutritionRaw }] = await Promise.all([
    supabase
      .from('meals')
      .select(
        'id, name, meal_type, logged_at, meal_items(id, meal_id, name, brand, serving_size, servings, calories, protein, carbs, fat)'
      )
      .eq('user_id', user.id)
      .gte('logged_at', `${dateStr}T00:00:00.000Z`)
      .lt('logged_at', `${nextDateStr}T00:00:00.000Z`)
      .order('logged_at', { ascending: true }),

    supabase
      .from('daily_nutrition')
      .select('calories_target, protein_target, carbs_target, fat_target')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .maybeSingle(),
  ])

  const meals = (mealsRaw ?? []) as Meal[]

  const dn = nutritionRaw as {
    calories_target: number | null
    protein_target: number | null
    carbs_target: number | null
    fat_target: number | null
  } | null

  const targets: NutritionTargets = {
    calories_target: dn?.calories_target ?? MACRO_DEFAULTS.calories_target,
    protein_target: dn?.protein_target ?? MACRO_DEFAULTS.protein_target,
    carbs_target: dn?.carbs_target ?? MACRO_DEFAULTS.carbs_target,
    fat_target: dn?.fat_target ?? MACRO_DEFAULTS.fat_target,
  }

  // Compute consumed totals directly from meal_items
  const allItems = meals.flatMap((m) => m.meal_items ?? [])
  const consumed = {
    calories: allItems.reduce((sum, i) => sum + i.calories * i.servings, 0),
    protein: allItems.reduce((sum, i) => sum + i.protein * i.servings, 0),
    carbs: allItems.reduce((sum, i) => sum + i.carbs * i.servings, 0),
    fat: allItems.reduce((sum, i) => sum + i.fat * i.servings, 0),
  }

  // Group meals by meal_type
  const grouped: Partial<Record<MealType, MealItem[]>> = {}
  for (const meal of meals) {
    const type: MealType = (MEAL_TYPES as readonly string[]).includes(meal.meal_type)
      ? (meal.meal_type as MealType)
      : 'other'
    if (!grouped[type]) grouped[type] = []
    const existing = grouped[type]
    if (existing) existing.push(...(meal.meal_items ?? []))
  }

  const displayDate = formatDisplayDate(dateStr)
  const hasAnyMeals = meals.length > 0 && allItems.length > 0

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Food Diary</h1>
            <p className="text-sm text-text-secondary">{displayDate}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Date navigation */}
        <DiaryClient dateStr={dateStr} displayDate={displayDate} />

        {/* Macro summary */}
        <div className="grid grid-cols-4 gap-2">
          <MacroCard
            label="Calories"
            consumed={Math.round(consumed.calories)}
            target={targets.calories_target}
            unit="kcal"
            borderColor="border-orange-400"
            textColor="text-orange-500"
            barColor="bg-orange-400"
          />
          <MacroCard
            label="Protein"
            consumed={Math.round(consumed.protein)}
            target={targets.protein_target}
            unit="g"
            borderColor="border-blue-400"
            textColor="text-blue-500"
            barColor="bg-blue-400"
          />
          <MacroCard
            label="Carbs"
            consumed={Math.round(consumed.carbs)}
            target={targets.carbs_target}
            unit="g"
            borderColor="border-yellow-400"
            textColor="text-yellow-500"
            barColor="bg-yellow-400"
          />
          <MacroCard
            label="Fat"
            consumed={Math.round(consumed.fat)}
            target={targets.fat_target}
            unit="g"
            borderColor="border-red-400"
            textColor="text-red-500"
            barColor="bg-red-400"
          />
        </div>

        {/* Meal sections or empty state */}
        {hasAnyMeals ? (
          <div className="space-y-4">
            {MEAL_TYPES.map((mealType) => {
              const items = grouped[mealType]
              if (!items || items.length === 0) return null
              const typeCalories = Math.round(
                items.reduce((s, i) => s + i.calories * i.servings, 0)
              )
              return (
                <section key={mealType} className="bg-surface rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-text-primary">{MEAL_LABELS[mealType]}</h2>
                    <span className="text-sm text-text-secondary">{typeCalories} kcal</span>
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((item) => (
                      <FoodItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <EmptyDay dateStr={dateStr} />
        )}
      </main>

      <BottomNav />
    </div>
  )
}

// ── sub-components ─────────────────────────────────────────────────────────────

function MacroCard({
  label,
  consumed,
  target,
  unit,
  borderColor,
  textColor,
  barColor,
}: MacroCardProps) {
  const pct = Math.min(100, target > 0 ? Math.round((consumed / target) * 100) : 0)

  return (
    <div className={`bg-surface rounded-xl p-3 border-t-2 ${borderColor} flex flex-col gap-1`}>
      <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide truncate">
        {label}
      </p>
      <p className={`text-base font-bold ${textColor} leading-none`}>{consumed}</p>
      <p className="text-[10px] text-text-tertiary">
        / {target} {unit}
      </p>
      <div className="w-full h-1 bg-surface-secondary rounded-full overflow-hidden mt-1">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function FoodItemRow({ item }: { item: MealItem }) {
  const totalCalories = Math.round(item.calories * item.servings)
  const totalProtein = (item.protein * item.servings).toFixed(1)
  const totalCarbs = (item.carbs * item.servings).toFixed(1)
  const totalFat = (item.fat * item.servings).toFixed(1)

  return (
    <div className="py-3 flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
        {item.brand && (
          <p className="text-xs text-text-tertiary truncate">{item.brand}</p>
        )}
        <p className="text-xs text-text-secondary mt-0.5">
          {item.servings !== 1 ? `${item.servings} × ` : ''}
          {item.serving_size}
        </p>
        <p className="text-xs text-text-tertiary mt-1">
          P {totalProtein}g · C {totalCarbs}g · F {totalFat}g
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-text-primary">{totalCalories}</p>
        <p className="text-[10px] text-text-tertiary">kcal</p>
      </div>
    </div>
  )
}

function EmptyDay({ dateStr }: { dateStr: string }) {
  const today = new Date().toISOString().slice(0, 10)
  const isToday = dateStr === today

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
        <span className="text-4xl" role="img" aria-label="Empty plate">
          🍽️
        </span>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-text-primary">
          No meals logged{isToday ? ' today' : ''}
        </p>
        <p className="text-sm text-text-secondary">Start tracking your food intake</p>
      </div>
      <Link
        href="/food/scanner"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
      >
        📷 Scan Food
      </Link>
    </div>
  )
}

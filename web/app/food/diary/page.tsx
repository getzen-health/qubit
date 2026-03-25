import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { DiaryClient } from './diary-client'
import { DiaryMealsClient } from './diary-meals-client'

// ── constants ──────────────────────────────────────────────────────────────────

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

  const displayDate = formatDisplayDate(dateStr)

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

        <DiaryMealsClient initialMeals={meals} targets={targets} dateStr={dateStr} />
      </main>

      <BottomNav />
    </div>
  )
}


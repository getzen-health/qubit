import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2 } from 'lucide-react'
import dynamic from 'next/dynamic'
const CaloriesClient = dynamic(() => import('./calories-client').then(m => ({ default: m.CaloriesClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Calorie Balance' }

export default async function CaloriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10)

  // Active calories burned per day
  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, active_calories')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .order('date', { ascending: true })

  // Calories consumed per day (from meals)
  const { data: meals } = await supabase
    .from('meals')
    .select('logged_at, meal_items(calories, servings)')
    .eq('user_id', user.id)
    .gte('logged_at', `${startDate}T00:00:00`)
    .order('logged_at', { ascending: true })

  // Calorie target from nutrition settings
  const { data: nutritionSettings } = await supabase
    .from('user_nutrition_settings')
    .select('calorie_target')
    .eq('user_id', user.id)
    .single()

  // Aggregate meals by day
  const mealsByDay: Record<string, number> = {}
  for (const meal of meals ?? []) {
    const day = meal.logged_at.slice(0, 10)
    const items = (meal as { meal_items: Array<{ calories: number; servings: number }> }).meal_items ?? []
    const cal = items.reduce((s, it) => s + it.calories * it.servings, 0)
    mealsByDay[day] = (mealsByDay[day] ?? 0) + cal
  }

  // Build day-by-day balance
  const days = (summaries ?? []).map((s) => ({
    date: s.date,
    burned: Math.round(s.active_calories ?? 0),
    consumed: Math.round(mealsByDay[s.date] ?? 0),
  }))

  const calorieTarget = nutritionSettings?.calorie_target ?? 2000

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
            <h1 className="text-xl font-bold text-text-primary">Calorie Balance</h1>
            <p className="text-sm text-text-secondary">Intake vs. active burn · 30 days</p>
          </div>
          <Link
            href="/calories/patterns"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Calorie patterns"
            title="Calorie Patterns"
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <CaloriesClient days={days} calorieTarget={calorieTarget} />
      </main>
      <BottomNav />
    </div>
  )
}

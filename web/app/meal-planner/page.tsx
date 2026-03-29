import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const MealPlannerClient = dynamic(() => import('./meal-planner-client').then(m => ({ default: m.MealPlannerClient })), { ssr: false })
import { calculateTDEE, calculateMacroTargets, calculateDietAdherenceScore, type MealEntry } from '@/lib/meal-planner'

export const metadata = { title: 'Meal Planner | KQuarks' }

export default async function MealPlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [{ data: todayMeals }, { data: weekMeals }, { data: settings }] = await Promise.all([
    supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('logged_at', { ascending: true }),
    supabase
      .from('meal_logs')
      .select('date, total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g, glycemic_load, meal_type')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: true }),
    supabase
      .from('nutrition_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  // Derive targets from saved settings
  const tdee =
    settings?.weight_kg && settings?.height_cm && settings?.age && settings?.sex && settings.sex !== 'other'
      ? calculateTDEE(
          settings.weight_kg,
          settings.height_cm,
          settings.age,
          settings.sex as 'male' | 'female',
          settings.activity_level ?? 'moderate',
        )
      : null

  const macroTargets = tdee
    ? calculateMacroTargets(
        tdee.tdee,
        (settings?.goal ?? 'maintain') as 'cut' | 'maintain' | 'bulk',
        settings!.weight_kg!,
        settings?.body_fat_pct ?? undefined,
      )
    : null

  const adherenceScore = macroTargets && todayMeals
    ? calculateDietAdherenceScore(todayMeals as MealEntry[], macroTargets)
    : null

  // Build weekly summary by date
  const weekSummaryMap: Record<string, { date: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; gl: number; meal_count: number }> = {}
  for (const row of weekMeals ?? []) {
    const key = row.date as string
    if (!weekSummaryMap[key]) {
      weekSummaryMap[key] = { date: key, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, gl: 0, meal_count: 0 }
    }
    weekSummaryMap[key].calories += row.total_calories ?? 0
    weekSummaryMap[key].protein_g += row.total_protein_g ?? 0
    weekSummaryMap[key].carbs_g += row.total_carbs_g ?? 0
    weekSummaryMap[key].fat_g += row.total_fat_g ?? 0
    weekSummaryMap[key].fiber_g += row.total_fiber_g ?? 0
    weekSummaryMap[key].gl += row.glycemic_load ?? 0
    weekSummaryMap[key].meal_count += 1
  }
  const weekSummary = Object.values(weekSummaryMap)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <div>
            <h1 className="text-base font-semibold text-text-primary">Meal Planner</h1>
            <p className="text-xs text-text-secondary">TDEE · Macro tracking · Adherence</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-24">
        <MealPlannerClient
          todayMeals={(todayMeals ?? []) as MealEntry[]}
          weekSummary={weekSummary}
          settings={settings}
          macroTargets={macroTargets}
          tdee={tdee}
          adherenceScore={adherenceScore}
        />
      </main>

      <BottomNav />
    </div>
  )
}

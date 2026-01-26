import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardContent } from './dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const today = new Date().toISOString().split('T')[0]

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch recent daily summaries
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })

  // Fetch recent insights
  const { data: insights } = await supabase
    .from('health_insights')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch today's nutrition data
  const { data: dailyNutrition } = await supabase
    .from('daily_nutrition')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  // Fetch today's meals with items
  const { data: meals } = await supabase
    .from('meals')
    .select(`
      *,
      meal_items (*)
    `)
    .eq('user_id', user.id)
    .gte('logged_at', `${today}T00:00:00`)
    .lt('logged_at', `${today}T23:59:59`)
    .order('logged_at', { ascending: false })

  // Fetch today's water
  const { data: dailyWater } = await supabase
    .from('daily_water')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  // Fetch active fasting session
  const { data: fastingSession } = await supabase
    .from('fasting_sessions')
    .select('*')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .single()

  // Fetch user nutrition settings
  const { data: nutritionSettings } = await supabase
    .from('user_nutrition_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Build nutrition data from real data with fallbacks
  const nutritionData = {
    calories: {
      consumed: dailyNutrition?.calories_consumed ?? 0,
      target: nutritionSettings?.calorie_target ?? 2000,
      burned: summaries?.[0]?.active_calories ?? 0,
    },
    protein: {
      consumed: dailyNutrition?.protein_consumed ?? 0,
      target: nutritionSettings?.protein_target ?? 150,
    },
    carbs: {
      consumed: dailyNutrition?.carbs_consumed ?? 0,
      target: nutritionSettings?.carbs_target ?? 250,
    },
    fat: {
      consumed: dailyNutrition?.fat_consumed ?? 0,
      target: nutritionSettings?.fat_target ?? 65,
    },
    water: {
      consumed: dailyWater?.total_ml ?? 0,
      target: nutritionSettings?.water_target_ml ?? 2500,
    },
    fiber: {
      consumed: dailyNutrition?.fiber_consumed ?? 0,
      target: nutritionSettings?.fiber_target ?? 30,
    },
  }

  // Transform meals to the expected format
  const formattedMeals = (meals ?? []).map((meal) => {
    const items = meal.meal_items ?? []
    const totalCalories = items.reduce((sum: number, item: { calories: number; servings: number }) => sum + (item.calories * item.servings), 0)
    const totalProtein = items.reduce((sum: number, item: { protein: number; servings: number }) => sum + (item.protein * item.servings), 0)
    const totalCarbs = items.reduce((sum: number, item: { carbs: number; servings: number }) => sum + (item.carbs * item.servings), 0)
    const totalFat = items.reduce((sum: number, item: { fat: number; servings: number }) => sum + (item.fat * item.servings), 0)

    return {
      id: meal.id,
      name: meal.name,
      time: new Date(meal.logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
    }
  })

  return (
    <DashboardContent
      user={user}
      profile={profile}
      summaries={summaries ?? []}
      insights={insights ?? []}
      nutritionData={nutritionData}
      meals={formattedMeals}
      fastingSession={fastingSession}
      defaultFastingProtocol={nutritionSettings?.default_fasting_protocol ?? '16:8'}
      defaultFastingHours={nutritionSettings?.default_fasting_hours ?? 16}
    />
  )
}

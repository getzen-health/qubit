import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { calculateTDEE, calculateMacroTargets } from '@/lib/meal-planner'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [{ data: todayMeals }, { data: weekMeals }, { data: settings }] = await Promise.all([
      supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', today)
        .order('logged_at', { ascending: true }),
      supabase
        .from('meal_logs')
        .select('date, total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g, glycemic_load')
        .eq('user_id', user!.id)
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: true }),
      supabase
        .from('nutrition_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle(),
    ])

    // Aggregate weekly summaries by date
    const weekSummary = Object.values(
      (weekMeals ?? []).reduce<Record<string, {
        date: string
        calories: number
        protein_g: number
        carbs_g: number
        fat_g: number
        fiber_g: number
        gl: number
        meal_count: number
      }>>((acc, row) => {
        const key = row.date as string
        if (!acc[key]) {
          acc[key] = { date: key, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, gl: 0, meal_count: 0 }
        }
        acc[key].calories += row.total_calories ?? 0
        acc[key].protein_g += row.total_protein_g ?? 0
        acc[key].carbs_g += row.total_carbs_g ?? 0
        acc[key].fat_g += row.total_fat_g ?? 0
        acc[key].fiber_g += row.total_fiber_g ?? 0
        acc[key].gl += row.glycemic_load ?? 0
        acc[key].meal_count += 1
        return acc
      }, {}),
    )

    return secureJsonResponse({ todayMeals: todayMeals ?? [], weekSummary, settings })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { type } = body

    if (type === 'meal') {
      const {
        meal_type,
        foods,
        total_calories,
        total_protein_g,
        total_carbs_g,
        total_fat_g,
        total_fiber_g,
        glycemic_load,
        notes,
        date,
      } = body

      if (!meal_type || !foods) {
        return secureErrorResponse('meal_type and foods are required', 400)
      }

      const { data, error } = await supabase.from('meal_logs').insert({
        user_id: user!.id,
        date: date ?? new Date().toISOString().split('T')[0],
        meal_type,
        foods,
        total_calories: total_calories ?? 0,
        total_protein_g: total_protein_g ?? 0,
        total_carbs_g: total_carbs_g ?? 0,
        total_fat_g: total_fat_g ?? 0,
        total_fiber_g: total_fiber_g ?? 0,
        glycemic_load: glycemic_load ?? 0,
        notes: notes ?? null,
      }).select().single()

      if (error) return secureErrorResponse(error.message, 500)
      return secureJsonResponse(data, 201)
    }

    if (type === 'settings') {
      const { weight_kg, height_cm, age, sex, activity_level, goal, body_fat_pct } = body

      // Compute TDEE if we have enough data
      let tdeeData = null
      let macros = null
      if (weight_kg && height_cm && age && sex && sex !== 'other') {
        tdeeData = calculateTDEE(weight_kg, height_cm, age, sex as 'male' | 'female', activity_level ?? 'moderate')
        macros = calculateMacroTargets(tdeeData.tdee, goal ?? 'maintain', weight_kg, body_fat_pct)
      }

      const { data, error } = await supabase
        .from('nutrition_settings')
        .upsert({
          user_id: user!.id,
          weight_kg,
          height_cm,
          age,
          sex,
          activity_level: activity_level ?? 'moderate',
          goal: goal ?? 'maintain',
          body_fat_pct: body_fat_pct ?? null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) return secureErrorResponse(error.message, 500)
      return secureJsonResponse({ settings: data, tdee: tdeeData, macros })
    }

    return secureErrorResponse('Invalid type. Must be "meal" or "settings".', 400)
  }
)

import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { BRISTOL_TYPES, calculateGutScore, GutLog } from '@/lib/gut-health'

const GUT_TIPS: Record<string, string[]> = {
  constipation: ['Increase fiber intake to 25-38g/day', 'Drink more water (2-3L/day)', 'Try prunes, flaxseeds, or psyllium husk'],
  ideal: ['Keep up your current fiber and hydration habits', 'Continue fermented foods for microbiome health'],
  diarrhea: ['Reduce insoluble fiber temporarily', 'Try the BRAT diet (bananas, rice, applesauce, toast)', 'Stay hydrated with electrolytes'],
}

// Helper: flatten symptoms to average severity
function avgSymptomSeverity(logs: any[]): number {
  let total = 0, count = 0
  for (const log of logs) {
    if (log.symptoms) {
      for (const val of Object.values(log.symptoms)) {
        total += typeof val === 'number' ? val : 0
        count++
      }
    }
  }
  return count ? total / count : 0
}

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { supabase }) => {
    const {
      data: logs,
      error
    } = await supabase
      .from('gut_health_logs')
      .select('*')
      .order('logged_at', { ascending: false })
      .limit(7)

    if (error) return secureErrorResponse(error.message, 500)

    const logsSorted = logs.sort((a: any, b: any) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
    const avgBristolType = logsSorted.length ? logsSorted.reduce((a: number, b: any) => a + (b.bristol_type || 0), 0) / logsSorted.length : 0
    const avgDailyFrequency = logsSorted.length ? logsSorted.reduce((a: number, b: any) => a + (b.frequency_today || 1), 0) / logsSorted.length : 0
    const avgSymptom = avgSymptomSeverity(logsSorted)
    const fiberIntakeDays = logsSorted.filter((l: any) => (l.fiber_intake_g || 0) >= 25).length
    const fermentedFoodDays = logsSorted.filter((l: any) => l.fermented_food).length

    const gutLog: Partial<GutLog> = {
      bristol_type: Math.round(avgBristolType),
      bowel_movement_count: Math.round(avgDailyFrequency),
      bloating: avgSymptom > 0 ? Math.round(avgSymptom) : 0,
      gas: 0, pain: 0, nausea: 0,
      plant_species_count: fermentedFoodDays,
      fermented_food_servings: fermentedFoodDays,
      ultra_processed_servings: 0,
      fiber_g: fiberIntakeDays * 25,
      probiotic_strain: '', prebiotic_taken: false,
      nsaid_use: false, alcohol_drinks: 0, gluten_sensitivity: false,
      stress_level: 5, antibiotic_recent: false, water_l: 2, notes: '',
      date: new Date().toISOString().split('T')[0],
    }
    const weeklyScore = calculateGutScore(gutLog as GutLog, fiberIntakeDays)

    // Determine tendency for tips
    let tendency: 'constipation' | 'ideal' | 'diarrhea' = 'ideal'
    if (avgBristolType < 3) tendency = 'constipation'
    else if (avgBristolType > 5) tendency = 'diarrhea'

    return secureJsonResponse({
      logs: logsSorted,
      weeklyScore,
      tips: GUT_TIPS[tendency]
    })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { supabase }) => {
    const body = await req.json()
    const { bristol_type, frequency_today, symptoms, fiber_intake_g, fermented_food, trigger_foods, notes, logged_at } = body
    const { data, error } = await supabase.from('gut_health_logs').insert([
      { bristol_type, frequency_today, symptoms, fiber_intake_g, fermented_food, trigger_foods, notes, logged_at }
    ]).select()
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ data })
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { supabase }) => {
    const { id } = await req.json()
    const { error } = await supabase.from('gut_health_logs').delete().eq('id', id)
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ success: true })
  }
)

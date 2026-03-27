import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

// Deurenberg equation for estimated BF% from BMI
function estimateBodyFat(bmi: number, age: number, isMale: boolean): number {
  return Math.max(0, Math.min(60, 1.2 * bmi + 0.23 * age - (isMale ? 10.8 : 0) - 5.4))
}

// Mifflin-St Jeor BMR
function calculateBMR(weightKg: number, heightCm: number, age: number, isMale: boolean): number {
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (isMale ? 5 : -161))
}

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data } = await supabase
      .from('body_composition')
      .select('*')
      .eq('user_id', user!.id)
      .order('recorded_at', { ascending: false })
      .limit(90)
    return secureJsonResponse({ entries: data ?? [] })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { weight_kg, height_cm, body_fat_pct, age, is_male, ...rest } = body

    let bmi: number | null = null
    let bmr_kcal: number | null = null
    let lean_body_mass_kg: number | null = null
    let estimated_body_fat: number | null = null

    if (weight_kg && height_cm) {
      const heightM = height_cm / 100
      bmi = Math.round((weight_kg / (heightM * heightM)) * 10) / 10
      if (age) {
        bmr_kcal = calculateBMR(weight_kg, height_cm, age, is_male ?? true)
        if (!body_fat_pct) {
          estimated_body_fat = Math.round(estimateBodyFat(bmi, age, is_male ?? true) * 10) / 10
        }
      }
    }

    const bf = body_fat_pct ?? estimated_body_fat
    if (bf && weight_kg) {
      lean_body_mass_kg = Math.round(weight_kg * (1 - bf / 100) * 10) / 10
    }

    const { data, error } = await supabase
      .from('body_composition')
      .insert({
        user_id: user!.id,
        weight_kg,
        height_cm,
        body_fat_pct: body_fat_pct ?? estimated_body_fat,
        bmi,
        bmr_kcal,
        lean_body_mass_kg,
        ...rest,
      })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save body composition', 500)
    return secureJsonResponse({ entry: data })
  }
)

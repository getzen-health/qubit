import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user!.id)
      .single()
    if (error && error.code !== 'PGRST116') {
      return secureErrorResponse(error.message, 500)
    }
    // Defaults if not set
    const defaults = {
      daily_steps: 10000,
      sleep_hours: 8.0,
      water_liters: 2.5,
      target_weight_kg: null,
      calorie_budget: 2000,
    }
    return secureJsonResponse(data ? data : { ...defaults, user_id: user!.id })
  }
)

export const PATCH = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { daily_steps, sleep_hours, water_liters, target_weight_kg, calorie_budget } = body
    const { error } = await supabase
      .from('user_goals')
      .upsert({
        user_id: user!.id,
        daily_steps,
        sleep_hours,
        water_liters,
        target_weight_kg,
        calorie_budget,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    if (error) {
      return secureErrorResponse(error.message, 500)
    }
    return secureJsonResponse({ success: true })
  }
)

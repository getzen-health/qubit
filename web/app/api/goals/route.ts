import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const goalUpdateSchema = z.object({
  goal_type: z.string().min(1).max(50).optional(),
  target_value: z.number().positive().optional(),
  current_value: z.number().min(0).optional(),
  unit: z.string().max(20).optional(),
  deadline: z.string().datetime().optional(),
  is_active: z.boolean().optional(),
})

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
  { rateLimit: 'healthData', requireAuth: true, bodySchema: goalUpdateSchema },
  async (_req, { user, supabase, body }) => {
    const { goal_type, target_value, current_value, unit, deadline, is_active } = body as z.infer<typeof goalUpdateSchema>
    const { error } = await supabase
      .from('user_goals')
      .upsert({
        user_id: user!.id,
        goal_type,
        target_value,
        current_value,
        unit,
        deadline,
        is_active,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    if (error) {
      return secureErrorResponse(error.message, 500)
    }
    return secureJsonResponse({ success: true })
  }
)

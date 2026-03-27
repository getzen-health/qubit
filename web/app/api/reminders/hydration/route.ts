import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const hydrationPatchSchema = z.object({
  enabled: z.boolean().optional(),
  start_hour: z.number().optional(),
  end_hour: z.number().optional(),
  interval_hours: z.number().optional(),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data, error } = await supabase
      .from('hydration_reminder_settings')
      .select('*')
      .eq('user_id', user!.id)
      .single()

    if (error && error.code !== 'PGRST116') return secureErrorResponse(error.message, 500)

    return secureJsonResponse(
      data || {
        enabled: true,
        start_hour: 8,
        end_hour: 20,
        interval_hours: 2
      }
    )
  }
)

export const PATCH = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: hydrationPatchSchema },
  async (_req, { user, body, supabase }) => {
    const { enabled, start_hour, end_hour, interval_hours } = body as z.infer<typeof hydrationPatchSchema>

    const { error } = await supabase
      .from('hydration_reminder_settings')
      .upsert({
        user_id: user!.id,
        enabled,
        start_hour,
        end_hour,
        interval_hours,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ success: true })
  }
)

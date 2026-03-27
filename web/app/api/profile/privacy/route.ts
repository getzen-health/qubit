import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const privacyBodySchema = z.object({
  privacy_mode: z.enum(['public', 'friends', 'private']).optional(),
  share_steps: z.boolean().optional(),
  share_workouts: z.boolean().optional(),
  share_sleep: z.boolean().optional(),
  share_hrv: z.boolean().optional(),
  share_readiness: z.boolean().optional(),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('privacy_mode, share_steps, share_workouts, share_sleep, share_hrv, share_readiness')
      .eq('id', user!.id)
      .single()

    if (error) return secureErrorResponse(error.message, 400)

    return secureJsonResponse(data || {
      privacy_mode: 'friends',
      share_steps: true,
      share_workouts: true,
      share_sleep: false,
      share_hrv: false,
      share_readiness: true,
    })
  }
)

export const PUT = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true, bodySchema: privacyBodySchema },
  async (_req, { user, body, supabase }) => {
    const { privacy_mode, share_steps, share_workouts, share_sleep, share_hrv, share_readiness } = body as z.infer<typeof privacyBodySchema>

    const { data, error } = await supabase
      .from('profiles')
      .update({
        privacy_mode: privacy_mode || 'friends',
        share_steps: share_steps !== undefined ? share_steps : true,
        share_workouts: share_workouts !== undefined ? share_workouts : true,
        share_sleep: share_sleep !== undefined ? share_sleep : false,
        share_hrv: share_hrv !== undefined ? share_hrv : false,
        share_readiness: share_readiness !== undefined ? share_readiness : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user!.id)
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 400)

    return secureJsonResponse(data)
  }
)

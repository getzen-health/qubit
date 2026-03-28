import { apiLogger } from '@/lib/api-logger'
import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const streakFreezeBodySchema = z.object({
  streakType: z.string().min(1),
})

export const POST = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true, bodySchema: streakFreezeBodySchema },
  async (_req, { user, body, supabase }) => {
    const { streakType } = body as z.infer<typeof streakFreezeBodySchema>

    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('streak_freezes_available, streak_freeze_used_date')
      .eq('user_id', user!.id)
      .single()

    const today = new Date().toISOString().split('T')[0]

    if (!prefs || prefs.streak_freezes_available <= 0) {
      return secureErrorResponse('No freezes available', 400)
    }

    if (prefs.streak_freeze_used_date === today) {
      return secureErrorResponse('Already used a freeze today', 400)
    }

    await supabase
      .from('user_preferences')
      .update({
        streak_freezes_available: prefs.streak_freezes_available - 1,
        streak_freeze_used_date: today,
      })
      .eq('user_id', user!.id)

    const { error: eventErr } = await supabase.from('streak_events').insert({
      user_id: user!.id,
      streak_type: streakType,
      event_type: 'frozen',
      event_date: today,
    })
    if (eventErr) apiLogger('streak_events insert error', eventErr)

    return secureJsonResponse({
      success: true,
      freezesRemaining: prefs.streak_freezes_available - 1,
    })
  }
)

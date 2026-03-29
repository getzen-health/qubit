import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const settingsSchema = z.object({
  optIn: z.boolean(),
  displayName: z.string().min(1).max(30).optional(),
})

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: settingsSchema },
  async (_req, { user, supabase, body }) => {
    const { optIn, displayName } = body as z.infer<typeof settingsSchema>

    const update: Record<string, unknown> = { leaderboard_opt_in: optIn }
    if (displayName !== undefined) update.display_name = displayName

    const { error } = await supabase
      .from('user_profiles')
      .update(update)
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to update leaderboard settings', 500)

    return secureJsonResponse({ success: true })
  }
)

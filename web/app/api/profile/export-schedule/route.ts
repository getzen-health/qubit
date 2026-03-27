import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const dynamic = 'force-dynamic'

const exportScheduleBodySchema = z.object({
  export_schedule: z.enum(['none', 'weekly', 'monthly']),
})

export const POST = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true, bodySchema: exportScheduleBodySchema },
  async (_req, { user, body, supabase }) => {
    const { export_schedule } = body as z.infer<typeof exportScheduleBodySchema>

    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id, export_schedule')
      .eq('user_id', user!.id)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('user_preferences')
        .update({ export_schedule })
        .eq('user_id', user!.id)
      if (error) return secureErrorResponse('Failed to update export schedule', 500)
    } else {
      const { error } = await supabase
        .from('user_preferences')
        .insert({ user_id: user!.id, export_schedule })
      if (error) return secureErrorResponse('Failed to update export schedule', 500)
    }

    return secureJsonResponse({
      success: true,
      export_schedule,
      message: export_schedule === 'none'
        ? 'Auto-export disabled'
        : `Reports will be emailed ${export_schedule}ly`,
    })
  }
)

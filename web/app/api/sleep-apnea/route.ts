import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const postSleepApneaSchema = z.object({
  stopbang_score: z.number().int().min(0).max(8),
  ess_score: z.number().int().min(0).max(24).optional(),
  stopbang_risk: z.enum(['Low', 'Intermediate', 'High']),
  ess_category: z.string().max(50).nullable().optional(),
  answers: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_request, { user, supabase }) => {
    const { data, error } = await supabase
      .from('sleep_apnea_screens')
      .select('*')
      .eq('user_id', user!.id)
      .order('screened_at', { ascending: false })
      .limit(20)

    if (error) return secureErrorResponse('Failed to fetch sleep apnea screens', 500)
    return secureJsonResponse({ data })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: postSleepApneaSchema },
  async (_request, { user, supabase, body }) => {
    const { stopbang_score, ess_score, stopbang_risk, ess_category, answers } = body as z.infer<typeof postSleepApneaSchema>

    const { data, error } = await supabase
      .from('sleep_apnea_screens')
      .insert({
        user_id: user!.id,
        screened_at: new Date().toISOString().slice(0, 10),
        stopbang_score,
        ess_score: typeof ess_score === 'number' ? ess_score : null,
        stopbang_risk,
        ess_category: ess_category ?? null,
        answers: answers ?? null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save sleep apnea screen', 500)
    return secureJsonResponse({ data }, 201)
  }
)

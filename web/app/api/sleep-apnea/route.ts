import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

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
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { stopbang_score, ess_score, stopbang_risk, ess_category, answers } = body

    if (
      typeof stopbang_score !== 'number' ||
      stopbang_score < 0 ||
      stopbang_score > 8 ||
      !stopbang_risk
    ) {
      return secureErrorResponse('Invalid payload', 400)
    }

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

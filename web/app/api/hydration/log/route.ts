import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { amount_ml, drink_type = 'water' } = body
    if (!amount_ml || amount_ml <= 0 || amount_ml > 10000)
      return secureErrorResponse('Invalid amount (1–10000 ml)', 400)
    const { data, error } = await supabase
      .from('water_logs')
      .insert({ user_id: user!.id, amount_ml, drink_type })
      .select()
      .single()
    if (error) return secureErrorResponse('Failed to log hydration', 500)
    return secureJsonResponse({ log: data })
  }
)

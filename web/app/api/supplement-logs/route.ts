import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { supplement_id, taken_at, skipped } = body

    if (!supplement_id) {
      return secureErrorResponse('Supplement ID is required', 400)
    }

    const { data, error } = await supabase
      .from('supplement_logs')
      .insert({
        user_id: user!.id,
        supplement_id,
        taken_at: taken_at || new Date().toISOString(),
        skipped: skipped || false,
      })
      .select()
      .single()

    if (error) {
      return secureErrorResponse('Failed to log supplement', 400)
    }

    return secureJsonResponse(data)
  }
)

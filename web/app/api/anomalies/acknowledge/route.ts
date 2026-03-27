import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const { id } = await req.json()

    if (!id) {
      return secureErrorResponse('Anomaly ID required', 400)
    }

    // Verify the anomaly belongs to the user before updating
    const { data: anomaly, error: fetchError } = await supabase
      .from('anomalies')
      .select('id')
      .eq('id', id)
      .eq('user_id', user!.id)
      .single()

    if (fetchError || !anomaly) {
      return secureErrorResponse('Anomaly not found', 404)
    }

    // Mark as dismissed
    const { error: updateError } = await supabase
      .from('anomalies')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user!.id)

    if (updateError) {
      return secureErrorResponse('Failed to acknowledge anomaly', 500)
    }

    return secureJsonResponse({ success: true })
  }
)

import { apiLogger } from '@/lib/api-logger'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'predictions',
  },
  async (_request, { user, supabase }) => {
    const { data: prediction, error } = await supabase
      .from('predictions')
      .select('recovery_forecast, performance_window, caution_flags, generated_at, week_of')
      .eq('user_id', user!.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      apiLogger('[predictions] GET error:', error)
      return secureErrorResponse('Failed to fetch prediction', 500)
    }

    return secureJsonResponse({ prediction })
  }
)

export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'CREATE',
    auditResource: 'predictions',
  },
  async (_request, { user, supabase }) => {
    // Check if the most recent prediction is still fresh (< 24 hours old)
    const { data: existing } = await supabase
      .from('predictions')
      .select('generated_at')
      .eq('user_id', user!.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing?.generated_at) {
      const age = Date.now() - new Date(existing.generated_at).getTime()
      if (age < TWENTY_FOUR_HOURS_MS) {
        return secureJsonResponse(
          { error: 'Prediction is still fresh. Try again after 24 hours.', generated_at: existing.generated_at },
          429
        )
      }
    }

    // Require at least 7 daily_summaries to generate a meaningful forecast
    const { count: summaryCount } = await supabase
      .from('daily_summaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)

    if ((summaryCount ?? 0) < 7) {
      return secureJsonResponse(
        { error: 'Not enough data. At least 7 days of health data are required.', has_enough_data: false },
        422
      )
    }

    // Invoke the predictions edge function
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/predictions`

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      return secureErrorResponse('Unauthorized', 401)
    }
    const authHeader = `Bearer ${session.access_token}`

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      },
      body: JSON.stringify({ user_id: user!.id }),
    })

    if (!response.ok) {
      const text = await response.text()
      apiLogger('[predictions] Edge function error:', response.status, text)
      return secureErrorResponse('Failed to generate forecast. Please try again later.', 502)
    }

    const result = await response.json()
    return secureJsonResponse({ prediction: result.prediction }, 200)
  }
)

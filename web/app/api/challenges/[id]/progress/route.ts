import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

// PUT: Update user's current_value for a challenge
export const PUT = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const challenge_id = req.nextUrl.pathname.split('/').at(-2)!
    const { data: challenge, error: challengeErr } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challenge_id)
      .single()
    if (challengeErr) console.error('challenges fetch error', challengeErr)
    let value = 0
    if (challenge?.type === 'steps') {
      const { data: metrics } = await supabase
        .from('health_metrics')
        .select('value, date')
        .eq('user_id', user!.id)
        .eq('type', 'steps')
        .gte('date', challenge.starts_at)
        .lte('date', challenge.ends_at)
      value = (metrics || []).reduce((sum, m) => sum + (m.value || 0), 0)
    } else {
      const body = await req.json()
      value = body.value || 0
    }
    const { error } = await supabase
      .from('challenge_participants')
      .update({ current_value: value })
      .eq('challenge_id', challenge_id)
      .eq('user_id', user!.id)
    if (error) return secureErrorResponse('Failed to update progress', 500)
    return secureJsonResponse({ success: true, value })
  }
)

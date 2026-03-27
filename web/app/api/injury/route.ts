import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

// GET /api/injury — active injuries + 90-day history
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
    const { data: logs, error } = await supabase
      .from('injury_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', since)
      .order('logged_at', { ascending: false })
      .limit(200)
    if (error) return secureErrorResponse('Failed to fetch injuries', 500)
    const active = (logs ?? []).filter(l => l.recovery_status !== 'resolved')
    const history = (logs ?? []).filter(l => l.recovery_status === 'resolved')
    return secureJsonResponse({ active, history, total: logs?.length ?? 0 })
  }
)

// POST /api/injury — log a new injury or update recovery_status
export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    if (body.id && body.recovery_status) {
      const { data, error } = await supabase
        .from('injury_logs')
        .update({ recovery_status: body.recovery_status })
        .eq('id', body.id)
        .eq('user_id', user!.id)
        .select()
        .single()
      if (error) return secureErrorResponse('Failed to update injury', 500)
      return secureJsonResponse({ log: data })
    }
    const { data, error } = await supabase
      .from('injury_logs')
      .insert({
        user_id: user!.id,
        body_region: body.body_region,
        pain_type: body.pain_type,
        intensity: body.intensity,
        onset_type: body.onset_type ?? 'acute',
        onset_date: body.onset_date ?? null,
        aggravating_factors: body.aggravating_factors ?? [],
        relieving_factors: body.relieving_factors ?? [],
        recovery_status: 'active',
        notes: body.notes ?? '',
      })
      .select()
      .single()
    if (error) return secureErrorResponse('Failed to log injury', 500)
    return secureJsonResponse({ log: data }, 201)
  }
)

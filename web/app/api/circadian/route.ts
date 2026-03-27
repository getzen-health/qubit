import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const since = thirtyDaysAgo.toISOString().split('T')[0]

    const [
      { data: lightLogs, error: lightErr },
      { data: assessment, error: assessErr },
    ] = await Promise.all([
      supabase
        .from('light_exposure_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', since)
        .order('date', { ascending: false }),
      supabase
        .from('circadian_assessments')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (lightErr)  return secureErrorResponse('Failed to fetch light logs', 500)
    if (assessErr) return secureErrorResponse('Failed to fetch assessment', 500)

    return secureJsonResponse({ lightLogs: lightLogs ?? [], assessment: assessment ?? null })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const today = new Date().toISOString().split('T')[0]

    if (body.type === 'assessment') {
      const { meq_score, chronotype, dlmo_estimate, social_jet_lag, meal_alignment_score, overall_score } = body
      const { data, error } = await supabase
        .from('circadian_assessments')
        .insert({
          user_id: user!.id,
          date: today,
          meq_score: meq_score ?? null,
          chronotype: chronotype ?? null,
          dlmo_estimate: dlmo_estimate ?? null,
          social_jet_lag: social_jet_lag ?? null,
          meal_alignment_score: meal_alignment_score ?? null,
          overall_score: overall_score ?? null,
        })
        .select()
        .single()
      if (error) return secureErrorResponse('Failed to save assessment', 500)
      return secureJsonResponse({ assessment: data })
    }

    // Default: upsert light exposure log
    const { date = today, morning_lux, afternoon_lux, evening_lux, blue_light_glasses, outdoor_minutes } = body
    const { data, error } = await supabase
      .from('light_exposure_logs')
      .upsert({
        user_id: user!.id,
        date,
        morning_lux:        morning_lux        ?? null,
        afternoon_lux:      afternoon_lux      ?? null,
        evening_lux:        evening_lux        ?? null,
        blue_light_glasses: blue_light_glasses ?? false,
        outdoor_minutes:    outdoor_minutes    ?? 0,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) return secureErrorResponse('Failed to save light exposure log', 500)
    return secureJsonResponse({ log: data })
  }
)

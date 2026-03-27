import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_request, { user, supabase }) => {
    const [{ data: assessments, error }, { data: summaries }, { data: recoveryLogs }] =
      await Promise.all([
        supabase
          .from('biological_age_assessments')
          .select('*')
          .eq('user_id', user!.id)
          .order('assessed_at', { ascending: false })
          .limit(30),
        supabase
          .from('daily_summaries')
          .select('avg_hrv, resting_heart_rate, steps, sleep_duration_minutes')
          .eq('user_id', user!.id)
          .gte(
            'date',
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          )
          .not('date', 'is', null),
        supabase
          .from('recovery_logs')
          .select('hrv_ms, resting_hr, sleep_hours, sleep_quality')
          .eq('user_id', user!.id)
          .gte(
            'logged_at',
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          ),
      ])

    if (error && error.code !== '42P01') {
      return secureErrorResponse('Failed to fetch biological age assessments', 500)
    }

    function avg(vals: (number | null | undefined)[]): number | null {
      const v = vals.filter((x): x is number => x != null && x > 0)
      return v.length > 0 ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null
    }

    const s = summaries ?? []
    const r = recoveryLogs ?? []

    const prefill = {
      resting_hr: avg([...s.map((x) => x.resting_heart_rate), ...r.map((x) => x.resting_hr)]),
      hrv_ms: avg([...s.map((x) => x.avg_hrv), ...r.map((x) => x.hrv_ms)]),
      sleep_hours: avg([
        ...s.map((x) => (x.sleep_duration_minutes ? x.sleep_duration_minutes / 60 : null)),
        ...r.map((x) => x.sleep_hours),
      ]),
      sleep_quality: avg(r.map((x) => x.sleep_quality)),
      steps_per_day: avg(s.map((x) => x.steps)),
    }

    return secureJsonResponse({ assessments: assessments ?? [], prefill })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()

    const { data, error } = await supabase
      .from('biological_age_assessments')
      .insert({
        user_id: user!.id,
        assessed_at: new Date().toISOString().slice(0, 10),
        chronological_age: body.chronological_age ?? null,
        biological_age: body.biological_age ?? null,
        pace_of_aging: body.pace_of_aging ?? null,
        blue_zone_score: body.blue_zone_score ?? null,
        inputs: body.inputs ?? null,
        result: body.result ?? null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save biological age assessment', 500)

    return secureJsonResponse({ assessment: data }, 201)
  }
)

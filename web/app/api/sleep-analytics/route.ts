import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { calculateSleepDebt } from '@/lib/sleep-analytics'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [{ data: sleepRecords, error: sleepErr }, { data: assessments, error: assessErr }, { data: profile }] =
      await Promise.all([
        supabase
          .from('sleep_records')
          .select('start_time, duration_minutes')
          .eq('user_id', user!.id)
          .gte('start_time', thirtyDaysAgo.toISOString())
          .gt('duration_minutes', 60)
          .order('start_time', { ascending: true }),
        supabase
          .from('sleep_quality_assessments')
          .select('*')
          .eq('user_id', user!.id)
          .order('assessed_at', { ascending: false })
          .limit(12),
        supabase.from('users').select('sleep_goal_minutes').eq('id', user!.id).single(),
      ])

    if (sleepErr) return secureErrorResponse('Failed to fetch sleep records', 500)
    if (assessErr) return secureErrorResponse('Failed to fetch assessments', 500)

    const targetHours = profile?.sleep_goal_minutes ? profile.sleep_goal_minutes / 60 : 8

    const logs = (sleepRecords ?? []).map((r) => ({
      date: r.start_time.slice(0, 10),
      hours: r.duration_minutes / 60,
    }))

    const debtResult = calculateSleepDebt(logs, targetHours)

    return secureJsonResponse({
      sleep_logs: logs,
      debt: debtResult,
      assessments: assessments ?? [],
      target_hours: targetHours,
    })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { psqi_global_score, psqi_answers, psqi_components, sleep_efficiency_pct } = body

    if (
      typeof psqi_global_score !== 'number' ||
      psqi_global_score < 0 ||
      psqi_global_score > 21
    ) {
      return secureErrorResponse('Invalid PSQI score', 400)
    }

    const { data, error } = await supabase
      .from('sleep_quality_assessments')
      .insert({
        user_id: user!.id,
        assessed_at: new Date().toISOString().slice(0, 10),
        psqi_global_score,
        psqi_answers: psqi_answers ?? null,
        psqi_components: psqi_components ?? null,
        sleep_efficiency_pct: typeof sleep_efficiency_pct === 'number' ? sleep_efficiency_pct : null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save assessment', 500)
    return secureJsonResponse({ data }, 201)
  }
)

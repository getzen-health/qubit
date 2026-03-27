import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: entries, error } = await supabase
      .from('recovery_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', thirtyDaysAgo.toISOString().slice(0, 10))
      .order('logged_at', { ascending: true })

    if (error) return secureErrorResponse('Failed to fetch recovery logs', 500)

    // 7-day HRV baseline (need ≥ 3 readings for a meaningful baseline)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentHrv = (entries ?? [])
      .filter((e) => e.logged_at >= sevenDaysAgo.toISOString().slice(0, 10) && e.hrv_ms)
      .map((e) => e.hrv_ms as number)

    const baseline =
      recentHrv.length >= 3
        ? { hrv: recentHrv.reduce((a, b) => a + b, 0) / recentHrv.length, hr: 0 }
        : undefined

    const today = new Date().toISOString().slice(0, 10)
    const todayEntry = (entries ?? []).find((e) => e.logged_at === today) ?? null

    return secureJsonResponse({ entries: entries ?? [], baseline, today: todayEntry })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const today = new Date().toISOString().slice(0, 10)

    const { data: entry, error } = await supabase
      .from('recovery_logs')
      .upsert(
        {
          user_id: user!.id,
          logged_at: today,
          hrv_ms: body.hrv_ms ?? null,
          resting_hr: body.resting_hr ?? null,
          sleep_hours: body.sleep_hours ?? null,
          sleep_quality: body.sleep_quality ?? null,
          soreness: body.soreness ?? null,
          mood: body.mood ?? null,
          acute_load: body.acute_load ?? null,
          chronic_load: body.chronic_load ?? null,
          recovery_score: body.recovery_score ?? null,
          acwr: body.acwr ?? null,
        },
        { onConflict: 'user_id,logged_at' },
      )
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save recovery log', 500)
    return secureJsonResponse({ entry })
  }
)

import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { calculateImmuneScore } from '@/lib/immune-score'
import type { ImmuneLog } from '@/lib/immune-score'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data: logs, error } = await supabase
      .from('immune_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse('Failed to fetch immune logs', 500)

    const today = new Date().toISOString().slice(0, 10)
    const todayLog = logs?.find((l) => l.date === today) ?? null

    const currentScore = todayLog
      ? calculateImmuneScore(todayLog as ImmuneLog)
      : null

    // 7-day trend: scores for the last 7 logged days
    const trend = (logs ?? []).slice(0, 7).map((l) => ({
      date: l.date,
      score: calculateImmuneScore(l as ImmuneLog).total,
    }))

    return secureJsonResponse({ logs: logs ?? [], currentScore, trend, todayLog })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const today = new Date().toISOString().slice(0, 10)

    const payload = {
      user_id: user!.id,
      date: today,
      sleep_hours: Number(body.sleep_hours ?? 0),
      vit_c_mg: Number(body.vit_c_mg ?? 0),
      vit_d_iu: Number(body.vit_d_iu ?? 0),
      zinc_mg: Number(body.zinc_mg ?? 0),
      selenium_mcg: Number(body.selenium_mcg ?? 0),
      stress_level: Number(body.stress_level ?? 5),
      exercise_minutes: Number(body.exercise_minutes ?? 0),
      exercise_intensity: body.exercise_intensity ?? 'none',
      fiber_g: Number(body.fiber_g ?? 0),
      probiotic_taken: Boolean(body.probiotic_taken),
      symptoms: body.symptoms ?? {},
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('immune_logs')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save immune log', 500)

    const score = calculateImmuneScore(data as ImmuneLog)
    return secureJsonResponse({ log: data, score })
  }
)

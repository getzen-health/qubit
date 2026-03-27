import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { analyzeBreathing, type BreathingLog } from '@/lib/breathing-health'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const sinceStr = since.toISOString().slice(0, 10)

    const { data: logs, error } = await supabase
      .from('breathing_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('date', sinceStr)
      .order('date', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse(error.message, 500)

    const typedLogs = (logs ?? []) as BreathingLog[]
    const analysis = typedLogs.length > 0 ? analyzeBreathing(typedLogs[0]) : null

    // Trend data for charts
    const trend = typedLogs.map(l => ({
      date: l.date,
      rate: l.resting_breathing_rate,
      mrc: l.mrc_scale,
      pattern: l.breathing_pattern,
      sessionsCount: (l.exercises_completed ?? []).length,
      peak_flow: l.peak_flow_measured ?? null,
      avgStressBefore: (l.exercises_completed ?? []).length > 0
        ? Math.round(
            (l.exercises_completed ?? []).reduce((s, e) => s + (e.stress_before ?? 0), 0) /
              (l.exercises_completed ?? []).length * 10
          ) / 10
        : null,
      avgStressAfter: (l.exercises_completed ?? []).length > 0
        ? Math.round(
            (l.exercises_completed ?? []).reduce((s, e) => s + (e.stress_after ?? 0), 0) /
              (l.exercises_completed ?? []).length * 10
          ) / 10
        : null,
    })).reverse()

    return secureJsonResponse({ logs: typedLogs, analysis, trend })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const date = body.date ?? new Date().toISOString().slice(0, 10)

    const rate = Number(body.resting_breathing_rate ?? 14)
    if (rate < 4 || rate > 60) {
      return secureErrorResponse('Breathing rate must be between 4 and 60 breaths/min', 400)
    }
    const mrc = Number(body.mrc_scale ?? 0)
    if (mrc < 0 || mrc > 4) {
      return secureErrorResponse('MRC scale must be 0–4', 400)
    }

    const payload = {
      user_id: user!.id,
      date,
      resting_breathing_rate: rate,
      breathing_pattern: body.breathing_pattern ?? 'nasal',
      breathing_type: body.breathing_type ?? 'diaphragmatic',
      mrc_scale: mrc,
      symptoms: body.symptoms ?? [],
      exercises_completed: body.exercises_completed ?? [],
      peak_flow_measured: body.peak_flow_measured ? Number(body.peak_flow_measured) : null,
      height_cm: body.height_cm ? Number(body.height_cm) : null,
      age: body.age ? Number(body.age) : null,
      sex: body.sex ?? null,
      notes: body.notes ?? '',
    }

    const { data, error } = await supabase
      .from('breathing_logs')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 400)
    return secureJsonResponse({ log: data })
  }
)

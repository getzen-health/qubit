import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { analyzePainScience, type PainScienceLog } from '@/lib/pain-science'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const sinceStr = since.toISOString().slice(0, 10)

    const { data: logs, error } = await supabase
      .from('pain_science_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('date', sinceStr)
      .order('date', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse(error.message, 500)

    const today = new Date().toISOString().slice(0, 10)
    const todayLog = (logs ?? []).find((l: PainScienceLog) => l.date === today) ?? null
    const analysis = todayLog ? analyzePainScience(todayLog as PainScienceLog) : null

    // Trends: reverse chronological → ascending for charts
    const trendsAsc = [...(logs ?? [])].reverse()

    const trends = {
      painLevel: trendsAsc.map((l: PainScienceLog) => ({
        date: l.date,
        value: l.pain_level,
      })),
      catastrophizing: trendsAsc.map((l: PainScienceLog) => ({
        date: l.date,
        value: l.pcs_rumination + l.pcs_magnification + l.pcs_helplessness,
      })),
      kinesiophobia: trendsAsc.map((l: PainScienceLog) => ({
        date: l.date,
        value: l.tsk_q1 + l.tsk_q2 + l.tsk_q3 + l.tsk_q4,
      })),
      biopsychosocial: trendsAsc.map((l: PainScienceLog) => ({
        date: l.date,
        biological: l.biological_contributors,
        psychological: l.psychological_contributors,
        social: l.social_contributors,
      })),
      movement: trendsAsc.map((l: PainScienceLog) => ({
        date: l.date,
        moved: l.movement_today ? 1 : 0,
        minutes: l.movement_minutes,
      })),
    }

    // Pain location frequency
    const locationFreq: Record<string, number> = {}
    for (const l of logs ?? []) {
      for (const loc of (l as PainScienceLog).pain_locations ?? []) {
        locationFreq[loc] = (locationFreq[loc] || 0) + 1
      }
    }
    const topLocations = Object.entries(locationFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([location, count]) => ({ location, count }))

    return secureJsonResponse({ logs, todayLog, analysis, trends, topLocations })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    let body: Partial<PainScienceLog>
    try {
      body = await req.json()
    } catch {
      return secureErrorResponse('invalid JSON', 400)
    }

    const date = body.date ?? new Date().toISOString().slice(0, 10)

    const payload: Partial<PainScienceLog> & { user_id: string; date: string } = {
      user_id: user!.id,
      date,
      pain_level: Math.min(10, Math.max(0, Number(body.pain_level ?? 0))),
      pain_locations: body.pain_locations ?? [],
      pain_quality: body.pain_quality ?? [],
      biological_contributors: Math.min(10, Math.max(1, Number(body.biological_contributors ?? 5))),
      psychological_contributors: Math.min(10, Math.max(1, Number(body.psychological_contributors ?? 5))),
      social_contributors: Math.min(10, Math.max(1, Number(body.social_contributors ?? 5))),
      pcs_rumination: Math.min(4, Math.max(0, Number(body.pcs_rumination ?? 0))),
      pcs_magnification: Math.min(4, Math.max(0, Number(body.pcs_magnification ?? 0))),
      pcs_helplessness: Math.min(4, Math.max(0, Number(body.pcs_helplessness ?? 0))),
      tsk_q1: Math.min(4, Math.max(1, Number(body.tsk_q1 ?? 1))),
      tsk_q2: Math.min(4, Math.max(1, Number(body.tsk_q2 ?? 1))),
      tsk_q3: Math.min(4, Math.max(1, Number(body.tsk_q3 ?? 1))),
      tsk_q4: Math.min(4, Math.max(1, Number(body.tsk_q4 ?? 1))),
      csi_symptoms: (body.csi_symptoms ?? [0, 0, 0, 0, 0, 0, 0, 0, 0]).map((v) =>
        Math.min(4, Math.max(0, Number(v))),
      ),
      movement_today: Boolean(body.movement_today),
      movement_minutes: Math.max(0, Number(body.movement_minutes ?? 0)),
      avoided_activities: body.avoided_activities ?? [],
      helpful_strategies: body.helpful_strategies ?? [],
      notes: body.notes ?? '',
    }

    const { data, error } = await supabase
      .from('pain_science_logs')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)

    const analysis = analyzePainScience(data as PainScienceLog)
    return secureJsonResponse({ log: data, analysis })
  }
)

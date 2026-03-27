import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import {
  analyzeDeepWork,
  buildHourlyHeatmap,
  buildDistractionBreakdown,
  FocusSession,
} from '@/lib/deep-work'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const today = new Date().toISOString().slice(0, 10)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)

    const [{ data: todaySessions, error: e1 }, { data: trendSessions, error: e2 }] = await Promise.all([
      supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', today)
        .order('created_at', { ascending: true }),
      supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: true }),
    ])

    if (e1 || e2) {
      return secureErrorResponse((e1 ?? e2)!.message, 500)
    }

    const sessions: FocusSession[] = todaySessions ?? []
    const allSessions: FocusSession[] = trendSessions ?? []

    // Today's analysis
    const analysis = analyzeDeepWork(sessions)

    // 30-day trend: group by date
    const dateMap: Record<string, FocusSession[]> = {}
    for (const s of allSessions) {
      if (!dateMap[s.date]) dateMap[s.date] = []
      dateMap[s.date].push(s)
    }
    const trend = Object.entries(dateMap).map(([date, daySessions]) => {
      const a = analyzeDeepWork(daySessions)
      return {
        date,
        focusScore: a.focusScore,
        totalDeepWorkMin: a.totalDeepWorkMin,
        avgQuality: Math.round(a.avgSessionQuality * 10) / 10,
        flowSessions: a.flowSessions,
        distractionsPerHour: Math.round(a.distractionsPerHour * 10) / 10,
      }
    })

    // Best focus hours heatmap (14-day rolling)
    const heatmapSessions = allSessions.filter(s => s.date >= fourteenDaysAgo)
    const hourlyHeatmap = buildHourlyHeatmap(heatmapSessions)

    // Distraction breakdown (30 days)
    const distractionBreakdown = buildDistractionBreakdown(allSessions)

    // Flow sessions per week (last 4 weeks)
    const weeklyFlow: Record<string, number> = {}
    for (const s of allSessions) {
      const d = new Date(s.date + 'T12:00:00')
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const wk = weekStart.toISOString().slice(0, 10)
      if (!weeklyFlow[wk]) weeklyFlow[wk] = 0
      if (s.flow_state) weeklyFlow[wk]++
    }
    const flowByWeek = Object.entries(weeklyFlow)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))

    // Productivity patterns: best day of week + best hour
    const dowQuality: Record<number, { sum: number; count: number }> = {}
    for (const s of allSessions) {
      const dow = new Date(s.date + 'T12:00:00').getDay()
      if (!dowQuality[dow]) dowQuality[dow] = { sum: 0, count: 0 }
      dowQuality[dow].sum += s.quality_rating
      dowQuality[dow].count++
    }
    const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dowData = Array.from({ length: 7 }, (_, i) => {
      const b = dowQuality[i] ?? { sum: 0, count: 0 }
      return { day: DOW_LABELS[i], avgQuality: b.count > 0 ? Math.round((b.sum / b.count) * 10) / 10 : 0, count: b.count }
    })

    return secureJsonResponse({
      sessions,
      analysis,
      trend,
      hourlyHeatmap,
      distractionBreakdown,
      flowByWeek,
      dowData,
    })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    let body: Omit<FocusSession, 'id' | 'user_id' | 'created_at'>
    try {
      body = await req.json()
    } catch {
      return secureErrorResponse('invalid JSON', 400)
    }

    const required = ['date', 'start_time', 'end_time', 'duration_min', 'task_type', 'mode', 'quality_rating', 'energy_level']
    for (const field of required) {
      if (body[field as keyof typeof body] == null) {
        return secureErrorResponse(`missing field: ${field}`, 400)
      }
    }

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: user!.id,
        date: body.date,
        start_time: body.start_time,
        end_time: body.end_time,
        duration_min: body.duration_min,
        task_type: body.task_type,
        task_description: body.task_description ?? null,
        mode: body.mode,
        quality_rating: body.quality_rating,
        flow_state: body.flow_state ?? false,
        flow_depth: body.flow_depth ?? null,
        distractions: body.distractions ?? [],
        energy_level: body.energy_level,
        notes: body.notes ?? null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)

    return secureJsonResponse({ session: data }, 201)
  }
)

import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

// GET: last 30 days of logs, grouped by date with aggregate severity
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (_request, { user, supabase }) => {
    // Get logs for last 30 days
    const { data: logs, error } = await supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('log_date', new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10))
      .order('log_date', { ascending: false })
      .order('logged_at', { ascending: false })

    if (error) return secureErrorResponse(error.message, 500)

    // Group by date
    const grouped: Record<string, any[]> = {}
    for (const log of logs || []) {
      if (!grouped[log.log_date]) grouped[log.log_date] = []
      grouped[log.log_date].push(log)
    }

    // Aggregate severity per day
    const days = Object.entries(grouped).map(([date, dayLogs]) => ({
      date,
      logs: dayLogs,
      avg_intensity: dayLogs.reduce((sum, l) => sum + l.intensity, 0) / dayLogs.length,
      max_intensity: Math.max(...dayLogs.map(l => l.intensity)),
      count: dayLogs.length,
    }))

    // Compute weekly averages for trend
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 86400 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400 * 1000)
    const thisWeek = (logs || []).filter(l => new Date(l.log_date) >= weekAgo)
    const lastWeek = (logs || []).filter(l => new Date(l.log_date) < weekAgo && new Date(l.log_date) >= twoWeeksAgo)
    const avg_this_week = thisWeek.length ? thisWeek.reduce((s, l) => s + l.intensity, 0) / thisWeek.length : null
    const avg_last_week = lastWeek.length ? lastWeek.reduce((s, l) => s + l.intensity, 0) / lastWeek.length : null
    const trend = avg_this_week && avg_last_week ? (avg_this_week > avg_last_week ? 'up' : avg_this_week < avg_last_week ? 'down' : 'flat') : null

    return secureJsonResponse({ days, avg_this_week, avg_last_week, trend })
  }
)

// POST: create new symptom log
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { body_region, symptom_type, intensity, pain_quality, triggers, duration_minutes, notes } = body
    if (!symptom_type || !intensity) return secureErrorResponse('Missing required fields', 400)
    const { error } = await supabase.from('symptom_logs').insert({
      user_id: user!.id,
      body_region,
      symptom_type,
      intensity,
      pain_quality,
      triggers,
      duration_minutes,
      notes,
      log_date: new Date().toISOString().slice(0, 10),
    })
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ success: true })
  }
)

import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

// GET: weekly aggregates for last 8 weeks
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    // Get logs for last 8 weeks
    const since = new Date(Date.now() - 56 * 86400 * 1000).toISOString().slice(0, 10)
    const { data: logs, error } = await supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('log_date', since)
      .order('log_date', { ascending: false })

    if (error) return secureErrorResponse('Failed to fetch symptom trends', 500)

    // Group by week
    const weekMap: Record<string, any[]> = {}
    for (const log of logs || []) {
      const d = new Date(log.log_date)
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const weekKey = weekStart.toISOString().slice(0, 10)
      if (!weekMap[weekKey]) weekMap[weekKey] = []
      weekMap[weekKey].push(log)
    }
    const weeks = Object.entries(weekMap).map(([week, logs]) => ({
      week,
      avg_intensity: logs.reduce((s, l) => s + l.intensity, 0) / logs.length,
      count: logs.length,
    })).sort((a, b) => a.week.localeCompare(b.week))

    // Top triggers
    const triggerCounts: Record<string, number> = {}
    for (const log of logs || []) {
      for (const t of log.triggers || []) {
        triggerCounts[t] = (triggerCounts[t] || 0) + 1
      }
    }
    const top_triggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]).map(([trigger, count]) => ({ trigger, count }))

    // Top body regions
    const regionCounts: Record<string, number> = {}
    for (const log of logs || []) {
      if (log.body_region) regionCounts[log.body_region] = (regionCounts[log.body_region] || 0) + 1
    }
    const top_regions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).map(([region, count]) => ({ region, count }))

    return secureJsonResponse({ weeks, top_triggers, top_regions })
  }
)

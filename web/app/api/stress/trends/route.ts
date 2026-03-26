import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const trendsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
})

/** Replicates hrv_to_stress_level() DB function client-side */
function hrvToStressLevel(hrv: number): number {
  return Math.max(1, Math.min(10, Math.round((200 - hrv) / 18)))
}

// GET /api/stress/trends — 7 and 30-day daily averages with HRV overlay
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: trendsQuerySchema,
    auditAction: 'READ',
    auditResource: 'health_data',
  },
  async (_request, { user, query, supabase }) => {
    const { days } = query as z.infer<typeof trendsQuerySchema>

    const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    const since7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const sinceN = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

    const [
      { data: stressLogs, error: logsError },
      { data: summaries, error: summariesError },
    ] = await Promise.all([
      supabase
        .from('stress_logs')
        .select('stress_level, source, logged_at')
        .eq('user_id', user!.id)
        .eq('source', 'manual')
        .gte('logged_at', `${sinceN}T00:00:00.000Z`)
        .order('logged_at', { ascending: true }),
      supabase
        .from('daily_summaries')
        .select('date, avg_hrv')
        .eq('user_id', user!.id)
        .gte('date', sinceN)
        .order('date', { ascending: true }),
    ])

    if (logsError) return secureErrorResponse('Failed to fetch stress trends', 500)
    if (summariesError) return secureErrorResponse('Failed to fetch HRV data', 500)

    // Group manual logs by date
    const byDate: Record<string, number[]> = {}
    for (const log of stressLogs ?? []) {
      const date = log.logged_at.slice(0, 10)
      ;(byDate[date] ??= []).push(log.stress_level)
    }

    // Build HRV-derived map
    const hrvMap: Record<string, number> = {}
    for (const row of summaries ?? []) {
      if (row.avg_hrv != null) {
        hrvMap[row.date] = hrvToStressLevel(row.avg_hrv)
      }
    }

    // Merge into daily data points
    const allDates = new Set([...Object.keys(byDate), ...Object.keys(hrvMap)])
    const daily = Array.from(allDates)
      .sort()
      .map(date => {
        const levels = byDate[date] ?? []
        const avg =
          levels.length > 0
            ? Math.round((levels.reduce((s, v) => s + v, 0) / levels.length) * 10) / 10
            : null
        return {
          date,
          avg_stress: avg,
          log_count: levels.length,
          hrv_derived_stress: hrvMap[date] ?? null,
        }
      })

    // Compute rolling stats
    function computeStats(points: typeof daily) {
      const withData = points.filter(p => p.avg_stress !== null)
      if (withData.length === 0) return { avg: null, min: null, max: null, days_logged: 0 }
      const vals = withData.map(p => p.avg_stress as number)
      return {
        avg: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10,
        min: Math.min(...vals),
        max: Math.max(...vals),
        days_logged: withData.length,
      }
    }

    const last7 = daily.filter(p => p.date >= since7)
    const last30 = daily.filter(p => p.date >= since30)

    return secureJsonResponse({
      daily,
      stats: {
        last_7_days: computeStats(last7),
        last_30_days: computeStats(last30),
      },
      generated_at: new Date().toISOString(),
    })
  }
)

import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const correlationsQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(90).default(30),
})

/** Pearson correlation coefficient for two equal-length arrays */
function pearsonR(xs: number[], ys: number[]): number | null {
  const n = xs.length
  if (n < 3) return null

  const meanX = xs.reduce((s, v) => s + v, 0) / n
  const meanY = ys.reduce((s, v) => s + v, 0) / n

  let num = 0, denomX = 0, denomY = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    num += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }
  const denom = Math.sqrt(denomX * denomY)
  return denom === 0 ? null : Math.round((num / denom) * 1000) / 1000
}

// GET /api/stress/correlations — stress vs sleep (and HRV) paired data points
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: correlationsQuerySchema,
    auditAction: 'READ',
    auditResource: 'health_data',
  },
  async (_request, { user, query, supabase }) => {
    const { days } = query as z.infer<typeof correlationsQuerySchema>
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

    const [
      { data: stressLogs, error: logsError },
      { data: summaries, error: summariesError },
    ] = await Promise.all([
      supabase
        .from('stress_logs')
        .select('stress_level, logged_at')
        .eq('user_id', user!.id)
        .eq('source', 'manual')
        .gte('logged_at', `${since}T00:00:00.000Z`)
        .order('logged_at', { ascending: true }),
      supabase
        .from('daily_summaries')
        .select('date, sleep_duration_minutes, avg_hrv, resting_heart_rate')
        .eq('user_id', user!.id)
        .gte('date', since)
        .order('date', { ascending: true }),
    ])

    if (logsError) return secureErrorResponse('Failed to fetch stress logs', 500)
    if (summariesError) return secureErrorResponse('Failed to fetch daily summaries', 500)

    // Average manual stress per day
    const stressByDate: Record<string, number[]> = {}
    for (const log of stressLogs ?? []) {
      const date = log.logged_at.slice(0, 10)
      ;(stressByDate[date] ??= []).push(log.stress_level)
    }
    const dailyStress: Record<string, number> = {}
    for (const [date, levels] of Object.entries(stressByDate)) {
      dailyStress[date] = levels.reduce((s, v) => s + v, 0) / levels.length
    }

    // Build paired data points keyed by date
    const summaryMap: Record<string, { sleep_hours: number | null; avg_hrv: number | null; resting_hr: number | null }> = {}
    for (const row of summaries ?? []) {
      summaryMap[row.date] = {
        sleep_hours: row.sleep_duration_minutes != null ? Math.round((row.sleep_duration_minutes / 60) * 10) / 10 : null,
        avg_hrv: row.avg_hrv ?? null,
        resting_hr: row.resting_heart_rate ?? null,
      }
    }

    // Only include days where we have both stress AND at least one health metric
    const dataPoints = Object.entries(dailyStress)
      .filter(([date]) => summaryMap[date] !== undefined)
      .map(([date, stress]) => ({
        date,
        stress_level: Math.round(stress * 10) / 10,
        sleep_hours: summaryMap[date].sleep_hours,
        avg_hrv: summaryMap[date].avg_hrv,
        resting_heart_rate: summaryMap[date].resting_hr,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Compute Pearson r for stress vs sleep
    const sleepPairs = dataPoints.filter(p => p.sleep_hours !== null)
    const sleepR = pearsonR(
      sleepPairs.map(p => p.stress_level),
      sleepPairs.map(p => p.sleep_hours as number)
    )

    const hrvPairs = dataPoints.filter(p => p.avg_hrv !== null)
    const hrvR = pearsonR(
      hrvPairs.map(p => p.stress_level),
      hrvPairs.map(p => p.avg_hrv as number)
    )

    const hrPairs = dataPoints.filter(p => p.resting_heart_rate !== null)
    const hrR = pearsonR(
      hrPairs.map(p => p.stress_level),
      hrPairs.map(p => p.resting_heart_rate as number)
    )

    function interpretR(r: number | null): string {
      if (r === null) return 'insufficient_data'
      const abs = Math.abs(r)
      if (abs < 0.2) return 'negligible'
      if (abs < 0.4) return 'weak'
      if (abs < 0.6) return 'moderate'
      if (abs < 0.8) return 'strong'
      return 'very_strong'
    }

    return secureJsonResponse({
      period_days: days,
      data_points: dataPoints,
      correlations: {
        stress_vs_sleep: {
          r: sleepR,
          strength: interpretR(sleepR),
          n: sleepPairs.length,
          interpretation:
            sleepR !== null && sleepR < -0.2
              ? 'More sleep associated with lower stress'
              : sleepR !== null && sleepR > 0.2
              ? 'More sleep associated with higher stress'
              : 'No clear relationship between sleep and stress',
        },
        stress_vs_hrv: {
          r: hrvR,
          strength: interpretR(hrvR),
          n: hrvPairs.length,
          interpretation:
            hrvR !== null && hrvR < -0.2
              ? 'Higher HRV associated with lower stress'
              : hrvR !== null && hrvR > 0.2
              ? 'Higher HRV associated with higher stress (unexpected)'
              : 'No clear relationship between HRV and stress',
        },
        stress_vs_resting_hr: {
          r: hrR,
          strength: interpretR(hrR),
          n: hrPairs.length,
          interpretation:
            hrR !== null && hrR > 0.2
              ? 'Higher resting HR associated with higher stress'
              : hrR !== null && hrR < -0.2
              ? 'Higher resting HR associated with lower stress (unexpected)'
              : 'No clear relationship between resting HR and stress',
        },
      },
      generated_at: new Date().toISOString(),
    })
  }
)

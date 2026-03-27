import {
  createSecureApiHandler,
  secureJsonResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const d90 = new Date(Date.now() - 90 * 86400000).toISOString()

    const [{ data: maxHRData }, { data: restingHRData }] = await Promise.all([
      supabase.from('health_records').select('value,recorded_at').eq('user_id', user!.id).eq('metric_type', 'heartRate').gte('recorded_at', d90).order('value', { ascending: false }).limit(30),
      supabase.from('health_records').select('value,recorded_at').eq('user_id', user!.id).eq('metric_type', 'restingHeartRate').gte('recorded_at', d90).order('recorded_at', { ascending: false }).limit(30),
    ])

    const weeklyData: Record<string, { maxHR: number; restingHR: number }> = {}
    for (const r of maxHRData ?? []) {
      const week = new Date(r.recorded_at).toISOString().slice(0, 7)
      if (!weeklyData[week]) weeklyData[week] = { maxHR: 0, restingHR: 60 }
      weeklyData[week].maxHR = Math.max(weeklyData[week].maxHR, Number(r.value))
    }
    for (const r of restingHRData ?? []) {
      const week = new Date(r.recorded_at).toISOString().slice(0, 7)
      if (weeklyData[week]) weeklyData[week].restingHR = Number(r.value)
    }

    const trend = Object.entries(weeklyData)
      .sort()
      .map(([week, data]) => ({
        week,
        vo2max:
          data.maxHR > 0 && data.restingHR > 0
            ? Math.round(15.3 * (data.maxHR / data.restingHR) * 10) / 10
            : null,
      }))
      .filter((d) => d.vo2max !== null)

    const latest = trend[trend.length - 1]?.vo2max ?? null
    const fitnessAge = latest ? Math.max(20, Math.round(70 - latest * 0.6)) : null

    return secureJsonResponse({ trend, current: latest, fitnessAge })
  }
)

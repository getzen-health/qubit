import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'
import { getPercentile, getAgeGroup, getInsight, METRIC_CONFIG } from '@/lib/cohort-norms'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data: profile, error: profileErr } = await supabase.from('user_profiles').select('date_of_birth, biological_sex').eq('user_id', user!.id).single()
    if (profileErr && profileErr.code !== 'PGRST116') console.error('user_profiles fetch error', profileErr)

    const age = profile?.date_of_birth
      ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
      : 35
    const sex = profile?.biological_sex === 'male' ? 'male' : profile?.biological_sex === 'female' ? 'female' : 'all'

    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: metrics, error: metricsErr } = await supabase.from('health_metrics')
      .select('metric_type, value')
      .eq('user_id', user!.id)
      .gte('recorded_at', since7d)
    if (metricsErr) console.error('health_metrics fetch error', metricsErr)

    const metricAvgs: Record<string, number> = {}
    if (metrics) {
      const grouped: Record<string, number[]> = {}
      for (const m of metrics) {
        if (!grouped[m.metric_type]) grouped[m.metric_type] = []
        grouped[m.metric_type].push(m.value)
      }
      for (const [k, vals] of Object.entries(grouped)) {
        metricAvgs[k] = vals.reduce((s, v) => s + v, 0) / vals.length
      }
    }

    const comparisons = Object.entries(METRIC_CONFIG).map(([metric, config]) => {
      const userValue = metricAvgs[metric] ?? null
      let displayValue = userValue
      if (metric === 'sleep_duration_minutes' && userValue) displayValue = Math.round(userValue / 6) / 10

      const percentile = userValue !== null ? getPercentile(metric, userValue, age, sex, config.lowerIsBetter) : null
      const ageGroup = getAgeGroup(age)

      return {
        metric,
        label: config.label,
        icon: config.icon,
        unit: config.unit === 'h' && metric === 'sleep_duration_minutes' ? 'h' : config.unit,
        user_value: displayValue !== null ? Math.round(displayValue * 10) / 10 : null,
        percentile,
        insight: percentile !== null ? getInsight(metric, percentile) : 'No data yet — keep tracking!',
        age_group: ageGroup,
        has_data: userValue !== null,
      }
    })

    return secureJsonResponse({ comparisons, age, age_group: getAgeGroup(age), sex })
  }
)

import { apiLogger } from '@/lib/api-logger'
import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'

const METRIC_LABELS: Record<string, string> = {
  heart_rate: 'Heart Rate (bpm)',
  resting_heart_rate: 'Resting Heart Rate (bpm)',
  hrv: 'HRV (ms)',
  steps: 'Steps',
  sleep_duration_minutes: 'Sleep (min)',
  weight: 'Weight (kg)',
  blood_pressure_systolic: 'Systolic BP',
  body_fat: 'Body Fat %',
  stress_level: 'Stress Level (1-10)',
  readiness_score: 'Readiness Score',
}
void METRIC_LABELS

function evaluateCondition(condition: { metric: string; operator: string; value: number }, metricValue: number | null): boolean {
  if (metricValue === null) return false
  switch (condition.operator) {
    case '>': return metricValue > condition.value
    case '<': return metricValue < condition.value
    case '>=': return metricValue >= condition.value
    case '<=': return metricValue <= condition.value
    case '==': return Math.abs(metricValue - condition.value) < 0.01
    default: return false
  }
}

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    // Fetch user's enabled rules
    const { data: rules, error: rulesErr } = await supabase.from('alert_rules').select('*').eq('user_id', user!.id).eq('enabled', true)
    if (rulesErr) apiLogger('alert_rules fetch error', rulesErr)
    if (!rules || rules.length === 0) return secureJsonResponse({ triggered: [] })

    // Fetch recent metrics (last 24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: metrics, error: metricsErr } = await supabase.from('health_metrics')
      .select('metric_type, value')
      .eq('user_id', user!.id)
      .gte('recorded_at', since)
    if (metricsErr) apiLogger('metrics fetch error', metricsErr)

    // Get latest value per metric type
    const latestMetrics: Record<string, number> = {}
    if (metrics) {
      for (const m of metrics) {
        latestMetrics[m.metric_type] = m.value
      }
    }

    const triggered = []
    for (const rule of rules) {
      const conditions = rule.conditions as Array<{ metric: string; operator: string; value: number }>
      const results = conditions.map(c => evaluateCondition(c, latestMetrics[c.metric] ?? null))
      const fired = rule.logic === 'AND' ? results.every(Boolean) : results.some(Boolean)
      if (!fired) continue

      // Don't fire same rule twice within 6 hours
      if (rule.last_triggered_at) {
        const lastFired = new Date(rule.last_triggered_at).getTime()
        if (Date.now() - lastFired < 6 * 60 * 60 * 1000) continue
      }

      // Record in history
      const { error: historyErr } = await supabase.from('alert_history').insert({
        user_id: user!.id,
        rule_id: rule.id,
        rule_name: rule.name,
        message: rule.message,
        severity: rule.severity,
      })
      if (historyErr) apiLogger('alert_history insert error', historyErr)

      const { error: updateErr } = await supabase.from('alert_rules').update({
        last_triggered_at: new Date().toISOString(),
        trigger_count: (rule.trigger_count ?? 0) + 1,
      }).eq('id', rule.id)
      if (updateErr) apiLogger('alert_rules update error', updateErr)

      triggered.push({ rule_id: rule.id, name: rule.name, message: rule.message, severity: rule.severity })
    }

    return secureJsonResponse({ triggered })
  }
)

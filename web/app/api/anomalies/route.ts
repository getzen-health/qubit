import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'anomaly',
  },
  async (_request, { user, supabase }) => {
    // Fetch unacknowledged anomalies from last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: anomalies, error } = await supabase
      .from('anomalies')
      .select('id, metric, value, avg_value, deviation, severity, claude_explanation, detected_at, dismissed_at')
      .eq('user_id', user!.id)
      .is('dismissed_at', null)
      .gte('detected_at', sevenDaysAgo.toISOString())
      .order('detected_at', { ascending: false })

    if (error) {
      return secureErrorResponse('Failed to fetch anomalies', 500)
    }

    return secureJsonResponse({
      anomalies: anomalies ?? [],
      count: (anomalies ?? []).length,
    })
  }
)

import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { calculateReadinessScore, getReadinessContext } from '@/lib/readiness'
import { API_VERSION } from '@/lib/api-version'

export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'health_data',
  },
  async (_request, { user, supabase }) => {
    const today = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('daily_summaries')
      .select('date, avg_hrv, resting_heart_rate, sleep_duration_minutes, strain_score')
      .eq('user_id', user!.id)
      .eq('date', today)
      .maybeSingle()

    if (error) return secureErrorResponse('Failed to fetch readiness data', 500)

    const sleepHours = data?.sleep_duration_minutes != null
      ? data.sleep_duration_minutes / 60
      : null

    const score = calculateReadinessScore(
      data?.avg_hrv ?? null,
      data?.resting_heart_rate ?? null,
      sleepHours,
      data?.strain_score ?? null,
    )

    const context = getReadinessContext(score)
    const response = secureJsonResponse({
      date: today,
      score: context.score,
      zone: context.zone,
      label: context.label,
      components: {
        hrv: data?.avg_hrv ?? null,
        resting_heart_rate: data?.resting_heart_rate ?? null,
        sleep_hours: sleepHours,
        strain_score: data?.strain_score ?? null,
      },
    })
    response.headers.set('X-API-Version', API_VERSION)
    return response
  }
)

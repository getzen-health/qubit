import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: steps } = await supabase
      .from('health_metrics')
      .select('value, recorded_at')
      .eq('user_id', user!.id)
      .eq('metric_type', 'steps')
      .gte('recorded_at', sevenDaysAgo.toISOString())
      .order('recorded_at', { ascending: false })

    const todaySteps = steps?.[0]?.value ?? 0
    const streak = steps?.length ?? 0

    return secureJsonResponse({ streak, steps: todaySteps })
  }
)

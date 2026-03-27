import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'export', requireAuth: true, querySchema },
  async (_req, { user, query, supabase }) => {
    const { from: rawFrom, to: rawTo } = query as z.infer<typeof querySchema>
    const from = rawFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const to = rawTo ?? new Date().toISOString().split('T')[0]

    const [metrics, sleepData, medications] = await Promise.all([
      supabase.from('health_metrics').select('*').eq('user_id', user!.id).gte('recorded_at', from).lte('recorded_at', to).order('recorded_at'),
      supabase.from('sleep_records').select('*').eq('user_id', user!.id).gte('sleep_start', from).lte('sleep_start', to).order('sleep_start'),
      supabase.from('medications').select('*').eq('user_id', user!.id).eq('is_active', true),
    ])

    if (metrics.error) return secureErrorResponse('Failed to fetch health metrics', 500)

    // Return data for client-side PDF generation
    return secureJsonResponse({
      generated_at: new Date().toISOString(),
      period: { from, to },
      user_id: user!.id,
      summary: {
        total_days: Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1,
        metrics_recorded: metrics.data?.length ?? 0,
        sleep_sessions: sleepData.data?.length ?? 0,
        active_medications: medications.data?.length ?? 0,
      },
      health_metrics: metrics.data ?? [],
      sleep_records: sleepData.data ?? [],
      medications: medications.data ?? [],
    })
  }
)

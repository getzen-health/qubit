import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (request, { user, supabase }) => {
    const { bedtime, wake_time, quality } = await request.json()
    if (!bedtime || !wake_time) return secureErrorResponse('bedtime and wake_time required', 400)
    const duration_minutes = Math.round((new Date(wake_time).getTime() - new Date(bedtime).getTime()) / 60000)
    const { data, error } = await supabase
      .from('sleep_records')
      .insert({ user_id: user!.id, start_time: bedtime, end_time: wake_time, duration_minutes, quality: quality || null, source: 'manual' })
      .select().single()
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ data }, 201)
  }
)

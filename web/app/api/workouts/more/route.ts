import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { WORKOUT_API_CONFIG } from '@/lib/config'
import { z } from 'zod'

export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: z.object({
      offset: z.coerce.number().int().min(0).default(0),
      limit: z.coerce.number().int().min(1).max(WORKOUT_API_CONFIG.MAX_WORKOUTS_LIMIT).default(WORKOUT_API_CONFIG.DEFAULT_WORKOUTS_LIMIT),
    }),
    auditAction: 'READ',
    auditResource: 'workout',
  },
  async (_request, { user, query, supabase }) => {
    const { offset, limit } = query as { offset: number; limit: number }

    const { data: workouts, error } = await supabase
      .from('workout_records')
      .select('id, workout_type, start_time, duration_minutes, active_calories, distance_meters, avg_heart_rate, avg_pace_per_km')
      .eq('user_id', user!.id)
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching workouts:', error)
      return secureErrorResponse('Failed to fetch workouts', 500)
    }

    const results = workouts ?? []
    return secureJsonResponse({ workouts: results, hasMore: results.length === limit })
  }
)

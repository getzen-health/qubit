import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since = new Date()
    since.setDate(since.getDate() - 90)

    const { data, error } = await supabase
      .from('workout_records')
      .select('start_time, duration_minutes, distance_meters, avg_pace_per_km, workout_type')
      .eq('user_id', user!.id)
      .ilike('workout_type', '%walk%')
      .gte('start_time', since.toISOString())
      .gt('duration_minutes', 0)
      .order('start_time', { ascending: true })

    if (error) return secureErrorResponse('Failed to fetch walking data', 500)

    const readings = (data ?? [])
      .filter((w) => w.duration_minutes > 0 && (w.avg_pace_per_km ?? w.distance_meters))
      .map((w) => {
        const speed = w.avg_pace_per_km
          ? 1000 / w.avg_pace_per_km
          : (w.distance_meters ?? 0) / (w.duration_minutes * 60)
        return {
          date: new Date(w.start_time as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          speed: Math.round(speed * 1000) / 1000,
        }
      })
      .filter((r) => r.speed > 0.2 && r.speed < 5)

    return secureJsonResponse({ data: readings })
  },
)

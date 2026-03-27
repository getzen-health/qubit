import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return secureJsonResponse({ food: [], workouts: [], health_metrics: [] })
    }

    const searchPattern = `%${query}%`

    // Search food logs
    const { data: foodLogs, error: foodError } = await supabase
      .from('meal_items')
      .select('id, food_name, created_at, meal_id')
      .eq('user_id', user!.id)
      .ilike('food_name', searchPattern)
      .order('created_at', { ascending: false })
      .limit(5)

    if (foodError) return secureErrorResponse('Search failed', 500)

    // Search workouts
    const { data: workouts, error: workoutError } = await supabase
      .from('workouts')
      .select('id, activity_type, duration_minutes, distance_km, calories_burned, created_at')
      .eq('user_id', user!.id)
      .ilike('activity_type', searchPattern)
      .order('created_at', { ascending: false })
      .limit(5)

    if (workoutError) return secureErrorResponse('Search failed', 500)

    // Search health metrics/notes
    const { data: metrics, error: metricsError } = await supabase
      .from('health_records')
      .select('id, type, value, start_time')
      .eq('user_id', user!.id)
      .ilike('type', searchPattern)
      .order('start_time', { ascending: false })
      .limit(5)

    if (metricsError) return secureErrorResponse('Search failed', 500)

    return secureJsonResponse({
      food: (foodLogs ?? []).map((item) => ({
        id: item.id,
        name: item.food_name,
        type: 'food',
        date: item.created_at,
        mealId: item.meal_id,
      })),
      workouts: (workouts ?? []).map((w) => ({
        id: w.id,
        name: w.activity_type,
        type: 'workout',
        duration: w.duration_minutes,
        distance: w.distance_km,
        calories: w.calories_burned,
        date: w.created_at,
      })),
      health_metrics: (metrics ?? []).map((m) => ({
        id: m.id,
        name: m.type,
        type: 'health',
        value: m.value,
        date: m.start_time,
      })),
    })
  }
)

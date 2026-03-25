import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({
      food: [],
      workouts: [],
      health_metrics: [],
    })
  }

  const searchPattern = `%${query}%`

  try {
    // Search food logs
    const { data: foodLogs, error: foodError } = await supabase
      .from('meal_items')
      .select('id, food_name, created_at, meal_id')
      .eq('user_id', user.id)
      .ilike('food_name', searchPattern)
      .order('created_at', { ascending: false })
      .limit(5)

    if (foodError) throw foodError

    // Search workouts
    const { data: workouts, error: workoutError } = await supabase
      .from('workouts')
      .select('id, activity_type, duration_minutes, distance_km, calories_burned, created_at')
      .eq('user_id', user.id)
      .ilike('activity_type', searchPattern)
      .order('created_at', { ascending: false })
      .limit(5)

    if (workoutError) throw workoutError

    // Search health metrics/notes
    const { data: metrics, error: metricsError } = await supabase
      .from('health_records')
      .select('id, type, value, start_time')
      .eq('user_id', user.id)
      .ilike('type', searchPattern)
      .order('start_time', { ascending: false })
      .limit(5)

    if (metricsError) throw metricsError

    return NextResponse.json({
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
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

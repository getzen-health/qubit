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
  const type = searchParams.get('type') ?? 'daily'

  if (type === 'workouts') {
    const { data } = await supabase
      .from('workout_records')
      .select('start_time, workout_type, duration_minutes, active_calories, distance_meters, avg_heart_rate, max_heart_rate')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })

    const rows = data ?? []
    const headers = ['date', 'type', 'duration_minutes', 'active_calories', 'distance_meters', 'avg_heart_rate', 'max_heart_rate']
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.start_time?.slice(0, 10) ?? '',
          r.workout_type ?? '',
          r.duration_minutes ?? '',
          r.active_calories ?? '',
          r.distance_meters ?? '',
          r.avg_heart_rate ?? '',
          r.max_heart_rate ?? '',
        ].join(',')
      ),
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="kquarks_workouts.csv"',
      },
    })
  }

  if (type === 'sleep') {
    const { data } = await supabase
      .from('sleep_records')
      .select('start_time, end_time, duration_minutes, deep_minutes, rem_minutes, core_minutes, awake_minutes')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })

    const rows = data ?? []
    const headers = ['date', 'start_time', 'end_time', 'duration_minutes', 'deep_minutes', 'rem_minutes', 'core_minutes', 'awake_minutes']
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.start_time?.slice(0, 10) ?? '',
          r.start_time ?? '',
          r.end_time ?? '',
          r.duration_minutes ?? '',
          r.deep_minutes ?? '',
          r.rem_minutes ?? '',
          r.core_minutes ?? '',
          r.awake_minutes ?? '',
        ].join(',')
      ),
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="kquarks_sleep.csv"',
      },
    })
  }

  // Default: daily summaries
  const { data } = await supabase
    .from('daily_summaries')
    .select('date, steps, active_calories, distance_meters, floors_climbed, resting_heart_rate, avg_hrv, sleep_duration_minutes, weight_kg, recovery_score, strain_score')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const rows = data ?? []
  const headers = [
    'date', 'steps', 'active_calories', 'distance_meters',
    'resting_heart_rate', 'avg_hrv', 'sleep_duration_minutes',
    'weight_kg', 'recovery_score', 'strain_score',
  ]
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.date ?? '',
        r.steps ?? '',
        r.active_calories ?? '',
        r.distance_meters ?? '',
        r.resting_heart_rate ?? '',
        r.avg_hrv ?? '',
        r.sleep_duration_minutes ?? '',
        r.weight_kg ?? '',
        r.recovery_score ?? '',
        r.strain_score ?? '',
      ].join(',')
    ),
  ].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="kquarks_daily.csv"',
    },
  })
}

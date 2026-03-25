import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Escape a CSV cell to prevent formula injection (OWASP CSV injection prevention)
// Prepend tab to values starting with formula trigger chars: =, +, -, @
function escapeCsvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(str)) return `\t${str}`
  // Quote strings containing comma, newline, or double-quote
  if (/[,"\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

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
    const { data, error } = await supabase
      .from('workout_records')
      .select('start_time, workout_type, duration_minutes, active_calories, distance_meters, avg_heart_rate, max_heart_rate')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })

    if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 })

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
    const { data, error } = await supabase
      .from('sleep_records')
      .select('start_time, end_time, duration_minutes, deep_minutes, rem_minutes, core_minutes, awake_minutes')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })

    if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 })

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

  if (type === 'water') {
    const { data, error } = await supabase
      .from('daily_water')
      .select('date, total_ml')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 })

    const rows = data ?? []
    const headers = ['date', 'total_ml']
    const csv = [
      headers.join(','),
      ...rows.map((r) => [r.date ?? '', r.total_ml ?? ''].join(',')),
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="kquarks_water.csv"',
      },
    })
  }

  if (type === 'nutrition') {
    const { data, error } = await supabase
      .from('meals')
      .select('logged_at, name, meal_type, meal_items(name, servings, calories, protein, carbs, fat)')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 })

    const rows: string[] = []
    const headers = ['date', 'meal_type', 'meal_name', 'food_name', 'servings', 'calories', 'protein_g', 'carbs_g', 'fat_g']
    rows.push(headers.join(','))

    for (const meal of data ?? []) {
      const date = meal.logged_at?.slice(0, 10) ?? ''
      for (const item of (Array.isArray(meal.meal_items) ? meal.meal_items as Array<{ name: string; servings: number; calories: number; protein?: number | null; carbs?: number | null; fat?: number | null }> : [])) {
        rows.push([
          escapeCsvCell(date),
          escapeCsvCell(meal.meal_type),
          escapeCsvCell(meal.name),
          escapeCsvCell(item.name),
          escapeCsvCell(item.servings),
          escapeCsvCell(item.calories),
          escapeCsvCell(item.protein),
          escapeCsvCell(item.carbs),
          escapeCsvCell(item.fat),
        ].join(','))
      }
    }

    return new Response(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="kquarks_nutrition.csv"',
      },
    })
  }

  if (type === 'checkins') {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('date, energy, mood, stress, notes, created_at')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 })

    const rows = data ?? []
    const headers = ['date', 'energy', 'mood', 'stress', 'notes', 'created_at']
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          escapeCsvCell(r.date),
          escapeCsvCell(r.energy),
          escapeCsvCell(r.mood),
          escapeCsvCell(r.stress),
          escapeCsvCell(r.notes),
          escapeCsvCell(r.created_at),
        ].join(',')
      ),
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="kquarks_checkins.csv"',
      },
    })
  }

  if (type === 'habits') {
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('name, emoji, target_days, created_at')
      .eq('user_id', user.id)
      .is('archived_at', null)

    if (habitsError) return NextResponse.json({ error: 'Export failed' }, { status: 500 })

    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('habit_id, date, completed_at')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (completionsError) return NextResponse.json({ error: 'Export failed' }, { status: 500 })


    // Simple flat export: date + habit_id (use name if possible)
    const rows = completions ?? []
    const headers = ['date', 'habit_id', 'completed_at']
    const csv = [
      headers.join(','),
      ...rows.map((r: { habit_id: string; date: string; completed_at: string }) =>
        [r.date ?? '', r.habit_id ?? '', r.completed_at ?? ''].join(',')
      ),
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="kquarks_habits.csv"',
      },
    })
  }

  if (type === 'fasting') {
    const { data, error } = await supabase
      .from('fasting_sessions')
      .select('protocol, target_hours, started_at, ended_at, actual_hours, completed')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 })

    const rows = data ?? []
    const headers = ['protocol', 'target_hours', 'started_at', 'ended_at', 'actual_hours', 'completed']
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          escapeCsvCell(r.protocol),
          escapeCsvCell(r.target_hours),
          escapeCsvCell(r.started_at),
          escapeCsvCell(r.ended_at),
          escapeCsvCell(r.actual_hours),
          escapeCsvCell(r.completed),
        ].join(',')
      ),
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="kquarks_fasting.csv"',
      },
    })
  }

  // Default: daily summaries
  const { data, error } = await supabase
    .from('daily_summaries')
    .select('date, steps, active_calories, distance_meters, floors_climbed, resting_heart_rate, avg_hrv, sleep_duration_minutes, weight_kg, recovery_score, strain_score')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 })

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

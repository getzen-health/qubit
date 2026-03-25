import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { API_VERSION } from '@/lib/api-version'

// Escape a CSV cell to prevent formula injection (OWASP CSV injection prevention)
// Prepend tab to values starting with formula trigger chars: =, +, -, @
function escapeCsvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(str)) return `\t${str}`
  // Quote strings containing comma, newline, or double-quote
  if (/[,"\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

const RESOURCE_TYPE_MAP: Record<string, string> = {
  workouts: 'health_data',
  sleep: 'health_data',
  water: 'water_log',
  nutrition: 'meal',
  checkins: 'health_data',
  habits: 'health_data',
  fasting: 'fasting_session',
  daily: 'daily_summary',
}

async function logExportAudit(userId: string, exportType: string, rowCount: number): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  const admin = createAdminClient(url, key, { auth: { persistSession: false } })
  await admin.from('audit_logs').insert({
    user_id: userId,
    action: 'EXPORT',
    resource_type: RESOURCE_TYPE_MAP[exportType] ?? 'health_data',
    details: { export_type: exportType, row_count: rowCount },
  })
}

type ExportResult = { csv: string; filename: string; rowCount: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildExport(supabase: any, userId: string, type: string): Promise<ExportResult | null> {
  if (type === 'workouts') {
    const { data, error } = await supabase
      .from('workout_records')
      .select('start_time, workout_type, duration_minutes, active_calories, distance_meters, avg_heart_rate, max_heart_rate')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })

    if (error) return null

    const rows = data ?? []
    const headers = ['date', 'type', 'duration_minutes', 'active_calories', 'distance_meters', 'avg_heart_rate', 'max_heart_rate']
    const csv = [
      headers.join(','),
      ...rows.map((r: { start_time: string; workout_type: string; duration_minutes: number; active_calories: number; distance_meters: number; avg_heart_rate: number; max_heart_rate: number }) =>
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

    return { csv, filename: 'kquarks_workouts.csv', rowCount: rows.length }
  }

  if (type === 'sleep') {
    const { data, error } = await supabase
      .from('sleep_records')
      .select('start_time, end_time, duration_minutes, deep_minutes, rem_minutes, core_minutes, awake_minutes')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })

    if (error) return null

    const rows = data ?? []
    const headers = ['date', 'start_time', 'end_time', 'duration_minutes', 'deep_minutes', 'rem_minutes', 'core_minutes', 'awake_minutes']
    const csv = [
      headers.join(','),
      ...rows.map((r: { start_time: string; end_time: string; duration_minutes: number; deep_minutes: number; rem_minutes: number; core_minutes: number; awake_minutes: number }) =>
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

    return { csv, filename: 'kquarks_sleep.csv', rowCount: rows.length }
  }

  if (type === 'water') {
    const { data, error } = await supabase
      .from('daily_water')
      .select('date, total_ml')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) return null

    const rows = data ?? []
    const headers = ['date', 'total_ml']
    const csv = [
      headers.join(','),
      ...rows.map((r: { date: string; total_ml: number }) => [r.date ?? '', r.total_ml ?? ''].join(',')),
    ].join('\n')

    return { csv, filename: 'kquarks_water.csv', rowCount: rows.length }
  }

  if (type === 'nutrition') {
    const { data, error } = await supabase
      .from('meals')
      .select('logged_at, name, meal_type, meal_items(name, servings, calories, protein, carbs, fat)')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })

    if (error) return null

    const csvRows: string[] = []
    const headers = ['date', 'meal_type', 'meal_name', 'food_name', 'servings', 'calories', 'protein_g', 'carbs_g', 'fat_g']
    csvRows.push(headers.join(','))

    for (const meal of data ?? []) {
      const date = meal.logged_at?.slice(0, 10) ?? ''
      for (const item of (Array.isArray(meal.meal_items) ? meal.meal_items as Array<{ name: string; servings: number; calories: number; protein?: number | null; carbs?: number | null; fat?: number | null }> : [])) {
        csvRows.push([
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

    return { csv: csvRows.join('\n'), filename: 'kquarks_nutrition.csv', rowCount: data?.length ?? 0 }
  }

  if (type === 'checkins') {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('date, energy, mood, stress, notes, created_at')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) return null

    const rows = data ?? []
    const headers = ['date', 'energy', 'mood', 'stress', 'notes', 'created_at']
    const csv = [
      headers.join(','),
      ...rows.map((r: { date: string; energy: number; mood: number; stress: number; notes: string; created_at: string }) =>
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

    return { csv, filename: 'kquarks_checkins.csv', rowCount: rows.length }
  }

  if (type === 'habits') {
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('name, emoji, target_days, created_at')
      .eq('user_id', userId)
      .is('archived_at', null)

    if (habitsError) return null

    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('habit_id, date, completed_at')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (completionsError) return null

    void habits // available for future enrichment

    const rows = completions ?? []
    const headers = ['date', 'habit_id', 'completed_at']
    const csv = [
      headers.join(','),
      ...rows.map((r: { habit_id: string; date: string; completed_at: string }) =>
        [r.date ?? '', r.habit_id ?? '', r.completed_at ?? ''].join(',')
      ),
    ].join('\n')

    return { csv, filename: 'kquarks_habits.csv', rowCount: rows.length }
  }

  if (type === 'fasting') {
    const { data, error } = await supabase
      .from('fasting_sessions')
      .select('protocol, target_hours, started_at, ended_at, actual_hours, completed')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (error) return null

    const rows = data ?? []
    const headers = ['protocol', 'target_hours', 'started_at', 'ended_at', 'actual_hours', 'completed']
    const csv = [
      headers.join(','),
      ...rows.map((r: { protocol: string; target_hours: number; started_at: string; ended_at: string; actual_hours: number; completed: boolean }) =>
        [
          escapeCsvCell(r.protocol),
          escapeCsvCell(r.target_hours),
          escapeCsvCell(r.started_at),
          escapeCsvCell(r.ended_at),
          escapeCsvCell(r.actual_hours),
          escapeCsvCell(r.completed ? 1 : r.completed === false ? 0 : null),
        ].join(',')
      ),
    ].join('\n')

    return { csv, filename: 'kquarks_fasting.csv', rowCount: rows.length }
  }

  // Default: daily summaries
  const { data, error } = await supabase
    .from('daily_summaries')
    .select('date, steps, active_calories, distance_meters, floors_climbed, resting_heart_rate, avg_hrv, sleep_duration_minutes, weight_kg, recovery_score, strain_score')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) return null

  const rows = data ?? []
  const headers = [
    'date', 'steps', 'active_calories', 'distance_meters',
    'resting_heart_rate', 'avg_hrv', 'sleep_duration_minutes',
    'weight_kg', 'recovery_score', 'strain_score',
  ]
  const csv = [
    headers.join(','),
    ...rows.map((r: { date: string; steps: number; active_calories: number; distance_meters: number; resting_heart_rate: number; avg_hrv: number; sleep_duration_minutes: number; weight_kg: number; recovery_score: number; strain_score: number }) =>
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

  return { csv, filename: 'kquarks_daily.csv', rowCount: rows.length }
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
  const format = searchParams.get('format') ?? 'csv'

  // Rate limiting: max 3 exports per hour per user
  const rl = await checkRateLimit(user.id, 'export')
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 3 exports per hour.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    )
  }

  const result = await buildExport(supabase, user.id, type)
  if (!result) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }

  // Audit log the successful export (fire-and-forget)
  void logExportAudit(user.id, type, result.rowCount)

  // Support JSON format
  if (format === 'json') {
    const lines = result.csv.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const data = lines.slice(1).filter(l => l.trim()).map(line => {
      const values = line.split(',')
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => {
        obj[h] = values[i]?.trim() ?? ''
      })
      return obj
    })
    
    const filename = result.filename.replace('.csv', '.json')
    return new Response(JSON.stringify({ data, exportedAt: new Date().toISOString() }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-API-Version': API_VERSION,
      },
    })
  }

  return new Response(result.csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'X-API-Version': API_VERSION,
    },
  })
}

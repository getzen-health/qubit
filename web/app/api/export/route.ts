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

const BATCH_SIZE = 1000
const MAX_ROWS = 10000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function* fetchBatches(query: any, batchSize: number, maxRows: number): AsyncGenerator<any[]> {
  let offset = 0
  while (offset < maxRows) {
    const { data, error } = await query.range(offset, offset + batchSize - 1)
    if (error || !data || data.length === 0) break
    yield data
    if (data.length < batchSize) break
    offset += batchSize
  }
}

type ExportResult = { csv: string; filename: string; rowCount: number; truncated?: boolean }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildExport(supabase: any, userId: string, type: string, from?: string, to?: string): Promise<ExportResult | null> {
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
  let query = supabase
    .from('daily_summaries')
    .select('date, steps, active_calories, distance_meters, floors_climbed, resting_heart_rate, avg_hrv, sleep_duration_minutes, weight_kg, recovery_score, strain_score')
    .eq('user_id', userId)

  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  query = query.order('date', { ascending: false })

  const headers = [
    'date', 'steps', 'active_calories', 'distance_meters',
    'resting_heart_rate', 'avg_hrv', 'sleep_duration_minutes',
    'weight_kg', 'recovery_score', 'strain_score',
  ]
  const csvRows: string[] = [headers.join(',')]
  let rowCount = 0
  let truncated = false

  for await (const batch of fetchBatches(query, BATCH_SIZE, MAX_ROWS)) {
    for (const r of batch) {
      if (rowCount >= MAX_ROWS) {
        truncated = true
        break
      }
      csvRows.push(
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
      )
      rowCount++
    }
    if (truncated) break
  }

  return { csv: csvRows.join('\n'), filename: 'kquarks_daily.csv', rowCount, truncated }
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
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  // Rate limiting: max 3 exports per hour per user
  const rl = await checkRateLimit(user.id, 'export')
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 3 exports per hour.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    )
  }

  const result = await buildExport(supabase, user.id, type, from ?? undefined, to ?? undefined)
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
    const responseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-API-Version': API_VERSION,
    }
    if (result.truncated) responseHeaders['X-Truncated'] = 'true'

    return new Response(JSON.stringify({ data, exportedAt: new Date().toISOString() }, null, 2), {
      headers: responseHeaders,
    })
  }

  const responseHeaders: Record<string, string> = {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="${result.filename}"`,
    'X-API-Version': API_VERSION,
  }
  if (result.truncated) responseHeaders['X-Truncated'] = 'true'

  return new Response(result.csv, {
    headers: responseHeaders,
  })
}

// ─── POST: aggregate export data for FHIR / CSV / PDF ────────────────────────

interface ExportRequestOptions {
  date_range?: { start?: string; end?: string }
  include_metrics?: boolean
  include_sleep?: boolean
  include_food_scans?: boolean
  include_workouts?: boolean
  include_lab_results?: boolean
  include_medications?: boolean
}

interface ExportRequestBody {
  format: 'fhir' | 'csv' | 'pdf'
  options?: ExportRequestOptions
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await checkRateLimit(user.id, 'export')
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 3 exports per hour.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    )
  }

  let body: ExportRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { format, options = {} } = body
  const dateStart = options.date_range?.start ?? null
  const dateEnd = options.date_range?.end ?? null

  const {
    include_metrics = true,
    include_sleep = true,
    include_food_scans = true,
    include_workouts = true,
    include_lab_results = true,
    include_medications = true,
  } = options

  // Fetch profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, display_name, timezone')
    .eq('id', user.id)
    .single()

  // Fetch each requested data type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = { profile }

  if (include_metrics) {
    let q = supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, distance_meters, resting_heart_rate, avg_hrv, sleep_duration_minutes, weight_kg, recovery_score, strain_score')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(3650)
    if (dateStart) q = q.gte('date', dateStart)
    if (dateEnd) q = q.lte('date', dateEnd)
    const { data: rows } = await q
    data.metrics = rows ?? []
  }

  if (include_sleep) {
    let q = supabase
      .from('sleep_records')
      .select('start_time, end_time, duration_minutes, deep_minutes, rem_minutes, core_minutes, awake_minutes')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(1000)
    if (dateStart) q = q.gte('start_time', dateStart)
    if (dateEnd) q = q.lte('start_time', dateEnd + 'T23:59:59Z')
    const { data: rows } = await q
    data.sleep = rows ?? []
  }

  if (include_food_scans) {
    let q = supabase
      .from('product_scans')
      .select('product_name, brand, barcode, health_score, nova_group, nutriscore, scanned_at')
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })
      .limit(2000)
    if (dateStart) q = q.gte('scanned_at', dateStart)
    if (dateEnd) q = q.lte('scanned_at', dateEnd + 'T23:59:59Z')
    const { data: rows } = await q
    data.food_scans = rows ?? []
  }

  if (include_workouts) {
    let q = supabase
      .from('workout_logs')
      .select('type, duration_minutes, calories, workout_date, notes')
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false })
      .limit(1000)
    if (dateStart) q = q.gte('workout_date', dateStart)
    if (dateEnd) q = q.lte('workout_date', dateEnd + 'T23:59:59Z')
    const { data: rows } = await q
    data.workouts = rows ?? []
  }

  if (include_lab_results) {
    let q = supabase
      .from('lab_results')
      .select('biomarker_key, value, unit, lab_date, lab_name, notes')
      .eq('user_id', user.id)
      .order('lab_date', { ascending: false })
      .limit(1000)
    if (dateStart) q = q.gte('lab_date', dateStart)
    if (dateEnd) q = q.lte('lab_date', dateEnd)
    const { data: rows } = await q
    data.lab_results = rows ?? []
  }

  if (include_medications) {
    const { data: rows } = await supabase
      .from('user_medications')
      .select('id, medication_name, generic_name, dosage, frequency, start_date, end_date, is_active')
      .eq('user_id', user.id)
      .order('medication_name')
    data.medications = rows ?? []
  }

  // Count total records
  const recordCount =
    (data.metrics?.length ?? 0) +
    (data.sleep?.length ?? 0) +
    (data.food_scans?.length ?? 0) +
    (data.workouts?.length ?? 0) +
    (data.lab_results?.length ?? 0) +
    (data.medications?.length ?? 0)

  // Log the export (fire-and-forget via admin client to bypass RLS)
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) {
      const admin = createAdminClient(url, key, { auth: { persistSession: false } })
      await admin.from('export_logs').insert({
        user_id: user.id,
        format,
        date_range_start: dateStart ?? null,
        date_range_end: dateEnd ?? null,
        record_count: recordCount,
        filename: `kquarks-export-${new Date().toISOString().split('T')[0]}.${format === 'fhir' ? 'json' : format}`,
      })
    }
  } catch {
    // Non-fatal — don't fail the export if logging fails
  }

  return NextResponse.json(
    { data },
    { headers: { 'X-API-Version': API_VERSION } }
  )
}

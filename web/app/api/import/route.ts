import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from '@/lib/security/rate-limit'
import { parseAuto } from '@/lib/wearable-parsers'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: imports } = await supabase
    .from('import_logs')
    .select('id, imported_at, source_format, filename, total_records, imported_records, skipped_records, date_range_start, date_range_end, status')
    .eq('user_id', user.id)
    .order('imported_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ imports: imports ?? [] })
}

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req)
  const rateLimit = await checkRateLimit(clientId, 'import')
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { error: 'Too many import requests. Try again in an hour.' },
      { status: 429 }
    )
    Object.entries(createRateLimitHeaders(0, rateLimit.resetIn)).forEach(([key, value]) => {
      response.headers.set(key, String(value))
    })
    return response
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { filename?: string; content?: string; conflict?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { filename, content, conflict = 'skip' } = body
  if (!filename || !content) {
    return NextResponse.json({ error: 'filename and content are required' }, { status: 400 })
  }
  if (content.length > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'File content too large (max 50 MB)' }, { status: 413 })
  }

  const parsed = parseAuto(filename, content)

  if (parsed.format === 'unknown' || parsed.records.length === 0) {
    await supabase.from('import_logs').insert({
      user_id: user.id,
      source_format: parsed.format,
      filename,
      total_records: 0,
      imported_records: 0,
      skipped_records: 0,
      status: 'failed',
      errors: parsed.errors.length ? parsed.errors : ['No records parsed'],
    })
    return NextResponse.json({
      imported: 0,
      skipped: 0,
      errors: parsed.errors.length ? parsed.errors : ['No records parsed'],
      date_range: parsed.date_range,
    })
  }

  let imported = 0
  let skipped = 0
  const rowErrors: string[] = [...parsed.errors]

  for (const record of parsed.records) {
    try {
      const row: Record<string, unknown> = {
        user_id: user.id,
        date: record.date,
      }
      if (record.steps != null)           row.steps = record.steps
      if (record.sleep_hours != null)     row.sleep_duration_minutes = Math.round(record.sleep_hours * 60)
      if (record.resting_hr != null)      row.resting_heart_rate = record.resting_hr
      if (record.hrv_ms != null)          row.avg_hrv = record.hrv_ms
      if (record.recovery_score != null)  row.recovery_score = record.recovery_score
      if (record.calories_burned != null) row.active_calories = record.calories_burned
      if (record.active_minutes != null)  row.active_minutes = record.active_minutes

      if (conflict === 'skip') {
        const { error } = await supabase
          .from('daily_summaries')
          .upsert(row, { onConflict: 'user_id,date', ignoreDuplicates: true })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('daily_summaries')
          .upsert(row, { onConflict: 'user_id,date' })
        if (error) throw error
      }
      imported++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      rowErrors.push(`${record.date}: ${msg}`)
      skipped++
    }
  }

  const status = imported === 0 ? 'failed' : rowErrors.length > 0 ? 'partial' : 'completed'
  await supabase.from('import_logs').insert({
    user_id: user.id,
    source_format: parsed.format,
    filename,
    total_records: parsed.total_rows,
    imported_records: imported,
    skipped_records: skipped,
    date_range_start: parsed.date_range.start || null,
    date_range_end: parsed.date_range.end || null,
    status,
    errors: rowErrors.length ? rowErrors.slice(0, 20) : null,
  })

  return NextResponse.json({ imported, skipped, errors: rowErrors, date_range: parsed.date_range })
}

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createSecureApiHandler, secureErrorResponse } from '@/lib/security'
import { API_VERSION } from '@/lib/api-version'

const BATCH_SIZE = 1000
const MAX_ROWS = 10000

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(str)) return `\t${str}`
  if (/[,"\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

async function logExportAudit(userId: string, days: number, rowCount: number): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  const admin = createAdminClient(url, key, { auth: { persistSession: false } })
  await admin.from('audit_logs').insert({
    user_id: userId,
    action: 'EXPORT',
    resource_type: 'health_data',
    details: { export_type: 'consolidated_health', days, row_count: rowCount },
  })
}

// Generator function to fetch rows in batches
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function* fetchBatches(query: any, batchSize: number, maxTotal: number) {
  let offset = 0
  let totalFetched = 0

  while (totalFetched < maxTotal) {
    const toFetch = Math.min(batchSize, maxTotal - totalFetched)
    const { data, error } = await query.range(offset, offset + toFetch - 1)

    if (error || !data || data.length === 0) break
    yield data
    totalFetched += data.length
    offset += toFetch
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildHealthDataExport(supabase: any, userId: string, days: number, from?: string, to?: string): Promise<{ csv: string; json: string; filename: string; rowCount: number; truncated: boolean } | null> {
  let startDate: string
  if (from) {
    startDate = from
  } else {
    const date = new Date()
    date.setDate(date.getDate() - days)
    startDate = date.toISOString().split('T')[0]
  }
  const endDate = to ?? new Date().toISOString().split('T')[0]

  let query = supabase
    .from('daily_summaries')
    .select('date, steps, active_calories, distance_meters, resting_heart_rate, avg_hrv, sleep_duration_minutes, weight_kg')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  const headers = ['date', 'steps', 'active_calories', 'distance_meters', 'resting_heart_rate', 'avg_hrv', 'sleep_hours', 'weight_kg']
  
  const csvRows: string[] = [headers.join(',')]
  const jsonData: Array<Record<string, string | number | null>> = []

  let rowCount = 0
  let truncated = false

  for await (const batch of fetchBatches(query, BATCH_SIZE, MAX_ROWS)) {
    for (const row of batch) {
      if (rowCount >= MAX_ROWS) {
        truncated = true
        break
      }
      const sleepHours = row.sleep_duration_minutes ? Math.round((row.sleep_duration_minutes / 60) * 10) / 10 : null
      const csvRow = [
        escapeCsvCell(row.date),
        escapeCsvCell(row.steps),
        escapeCsvCell(row.active_calories),
        escapeCsvCell(row.distance_meters),
        escapeCsvCell(row.resting_heart_rate),
        escapeCsvCell(row.avg_hrv),
        escapeCsvCell(sleepHours),
        escapeCsvCell(row.weight_kg),
      ].join(',')
      csvRows.push(csvRow)
      
      jsonData.push({
        date: row.date,
        steps: row.steps || 0,
        active_calories: row.active_calories || 0,
        distance_meters: row.distance_meters || 0,
        resting_heart_rate: row.resting_heart_rate || null,
        avg_hrv: row.avg_hrv || null,
        sleep_hours: sleepHours,
        weight_kg: row.weight_kg || null,
      })
      rowCount++
    }
    if (truncated) break
  }

  const csv = csvRows.join('\n')
  const json = JSON.stringify({ data: jsonData, days, exportedAt: new Date().toISOString(), truncated }, null, 2)
  const filename = `getzen_health_${days}d`

  return { csv, json, filename, rowCount, truncated }
}

export const GET = createSecureApiHandler(
  { rateLimit: 'export', requireAuth: true },
  async (request, { user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') ?? '30', 10)
    const format = searchParams.get('format') ?? 'csv'
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (![30, 90, 365].includes(days)) {
      return secureErrorResponse('Days must be 30, 90, or 365', 400)
    }

    const result = await buildHealthDataExport(supabase, user!.id, days, from ?? undefined, to ?? undefined)
    if (!result) {
      return secureErrorResponse('Export failed', 500)
    }

    void logExportAudit(user!.id, days, result.rowCount)

    if (format === 'json') {
      const responseHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${result.filename}.json"`,
        'X-API-Version': API_VERSION,
      }
      if (result.truncated) responseHeaders['X-Truncated'] = 'true'

      return new NextResponse(result.json, {
        headers: responseHeaders,
      })
    }

    const responseHeaders: Record<string, string> = {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${result.filename}.csv"`,
      'X-API-Version': API_VERSION,
    }
    if (result.truncated) responseHeaders['X-Truncated'] = 'true'

    return new NextResponse(result.csv, {
      headers: responseHeaders,
    })
  }
)

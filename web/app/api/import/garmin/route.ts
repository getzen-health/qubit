import { NextRequest } from 'next/server'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const runtime = 'nodejs'
export const maxDuration = 60

// ---------------------------------------------------------------------------
// CSV parser (handles quoted fields)
// ---------------------------------------------------------------------------

function parseCSVRow(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

function parseGarminCSV(csv: string): Array<Record<string, string>> {
  const lines = csv.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = parseCSVRow(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCSVRow(line)
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (values[i] ?? '').trim()]))
  })
}

// ---------------------------------------------------------------------------
// Date normalization — Garmin exports "2024-01-15 10:30:45" or locale strings
// ---------------------------------------------------------------------------

function parseActivityDate(raw: string): string | null {
  if (!raw) return null
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]
  const d = new Date(raw)
  if (isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const POST = createSecureApiHandler(
  { rateLimit: 'import', requireAuth: true },
  async (req: NextRequest, { user, supabase }) => {
    const contentType = req.headers.get('content-type') ?? ''
    let rows: Array<Record<string, string>> = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) return secureErrorResponse('No file provided', 400)
      const text = await file.text()
      rows = parseGarminCSV(text)
    } else {
      let body: { rows?: Array<Record<string, string>> }
      try {
        body = await req.json()
      } catch {
        return secureErrorResponse('Invalid JSON body', 400)
      }
      rows = body.rows ?? []
    }

    if (rows.length === 0) return secureErrorResponse('No data rows found', 400)

    // Aggregate multiple activities per calendar day
    interface DayRecord {
      date: string
      active_calories: number
      active_minutes: number
      distance_meters: number
      resting_heart_rate: number | null
    }
    const byDate = new Map<string, DayRecord>()
    const errors: string[] = []

    for (const row of rows) {
      const rawDate = row['Activity Date'] ?? row['activity_date'] ?? ''
      const date = parseActivityDate(rawDate)
      if (!date) {
        errors.push(`Skipped row — unparseable date: "${rawDate}"`)
        continue
      }

      const elapsedSec = parseFloat(row['Elapsed Time'] ?? row['elapsed_time'] ?? '0') || 0
      const calories   = parseFloat(row['Calories']     ?? row['calories']     ?? '0') || 0
      const distKm     = parseFloat(row['Distance']     ?? row['distance']     ?? '0') || 0
      const avgHR      = parseInt(row['Avg HR']         ?? row['avg_hr']       ?? '0', 10) || 0

      if (byDate.has(date)) {
        const r = byDate.get(date)!
        r.active_calories += calories
        r.active_minutes  += Math.round(elapsedSec / 60)
        r.distance_meters += Math.round(distKm * 1000)
        if (avgHR > 0) r.resting_heart_rate = avgHR
      } else {
        byDate.set(date, {
          date,
          active_calories:   calories,
          active_minutes:    Math.round(elapsedSec / 60),
          distance_meters:   Math.round(distKm * 1000),
          resting_heart_rate: avgHR > 0 ? avgHR : null,
        })
      }
    }

    let imported = 0
    let skipped  = 0

    for (const summary of byDate.values()) {
      const record: Record<string, unknown> = {
        user_id:         user!.id,
        date:            summary.date,
        active_calories: summary.active_calories,
        active_minutes:  summary.active_minutes,
        distance_meters: summary.distance_meters,
        updated_at:      new Date().toISOString(),
      }
      if (summary.resting_heart_rate !== null) {
        record.resting_heart_rate = summary.resting_heart_rate
      }

      const { error } = await supabase
        .from('daily_summaries')
        .upsert(record, { onConflict: 'user_id,date', ignoreDuplicates: false })

      if (error) {
        errors.push(`Failed to upsert ${summary.date}: ${error.message}`)
        skipped++
      } else {
        imported++
      }
    }

    return secureJsonResponse({ imported, skipped, errors })
  }
)

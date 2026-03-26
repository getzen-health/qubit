/**
 * Wearable Data Parsers
 * Supports: Garmin (Activities + Sleep CSV), Fitbit (Sleep + Heart JSON),
 * Whoop (physiological cycles CSV), Apple Health (export.xml)
 */

export type WearableFormat =
  | 'garmin_activities'
  | 'garmin_sleep'
  | 'fitbit_sleep'
  | 'fitbit_heart'
  | 'whoop'
  | 'apple_health'
  | 'unknown'

export interface ParsedHealthRecord {
  date: string            // YYYY-MM-DD
  steps?: number
  sleep_hours?: number
  sleep_deep_hours?: number
  sleep_rem_hours?: number
  sleep_light_hours?: number
  resting_hr?: number
  hrv_ms?: number
  recovery_score?: number
  calories_burned?: number
  active_minutes?: number
  source: WearableFormat
}

export interface ParseResult {
  format: WearableFormat
  records: ParsedHealthRecord[]
  total_rows: number
  date_range: { start: string; end: string }
  errors: string[]
  warnings: string[]
}

// ---------------------------------------------------------------------------
// CSV utilities
// ---------------------------------------------------------------------------

function parseCSVRow(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

function parseCSV(csv: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csv.split('\n').map(l => l.replace(/\r$/, ''))
  const nonEmpty = lines.filter(l => l.trim())
  if (nonEmpty.length < 2) return { headers: [], rows: [] }

  // Normalise header names: lowercase, replace non-alphanumeric runs with _
  const headers = parseCSVRow(nonEmpty[0]).map(h =>
    h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  )
  const rows: Record<string, string>[] = []
  for (let i = 1; i < nonEmpty.length; i++) {
    const line = nonEmpty[i].trim()
    if (!line) continue
    const values = parseCSVRow(line)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] ?? '').trim() })
    rows.push(row)
  }
  return { headers, rows }
}

// ---------------------------------------------------------------------------
// Common helpers
// ---------------------------------------------------------------------------

/** Normalise various date strings to YYYY-MM-DD. Returns null on failure. */
function toISODate(raw: string | undefined | null): string | null {
  if (!raw) return null
  const s = raw.trim()
  if (!s || s === '--') return null
  // Already YYYY-MM-DD (possibly with trailing time)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10)
  // MM/DD/YY or MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (mdy) {
    const yr = mdy[3].length === 2 ? `20${mdy[3]}` : mdy[3]
    return `${yr}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`
  }
  // Try Date constructor as last resort
  try {
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10)
  } catch { /* ignore */ }
  return null
}

/** Parse duration strings like "7:23" (h:mm), "7:23:05" (h:mm:ss), or decimal to hours. */
function parseHours(raw: string | undefined | null): number | undefined {
  if (!raw) return undefined
  const s = raw.trim()
  if (!s || s === '--' || s.toLowerCase() === 'n/a') return undefined
  const hms = s.match(/^(\d+):(\d{2}):(\d{2})$/)
  if (hms) return parseInt(hms[1]) + parseInt(hms[2]) / 60 + parseInt(hms[3]) / 3600
  const hm = s.match(/^(\d+):(\d{2})$/)
  if (hm) return parseInt(hm[1]) + parseInt(hm[2]) / 60
  const n = parseFloat(s.replace(/,/g, ''))
  return isNaN(n) ? undefined : n
}

/** Parse a numeric string, handling commas and dashes. */
function parseNum(raw: string | undefined | null): number | undefined {
  if (!raw) return undefined
  const s = raw.trim()
  if (!s || s === '--' || s.toLowerCase() === 'n/a') return undefined
  const n = parseFloat(s.replace(/,/g, ''))
  return isNaN(n) ? undefined : n
}

/** Build a normalised ParseResult with sorted records and computed date range. */
function buildResult(
  format: WearableFormat,
  records: ParsedHealthRecord[],
  errors: string[],
  warnings: string[]
): ParseResult {
  const sorted = records
    .filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.date))
    .sort((a, b) => a.date.localeCompare(b.date))
  const dates = sorted.map(r => r.date)
  return {
    format,
    records: sorted,
    total_rows: sorted.length,
    date_range: { start: dates[0] ?? '', end: dates[dates.length - 1] ?? '' },
    errors,
    warnings,
  }
}

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

export function detectFormat(filename: string, content: string): WearableFormat {
  const lower = filename.toLowerCase()
  const head = content.substring(0, 2000)

  // Apple Health XML
  if (lower.endsWith('.xml') || head.includes('HKQuantityTypeIdentifier') || head.includes('<HealthData')) {
    return 'apple_health'
  }

  // JSON formats
  if (lower.endsWith('.json')) {
    if (lower.includes('sleep-')) return 'fitbit_sleep'
    if (lower.includes('activities-heart') || lower.includes('heart')) return 'fitbit_heart'
    try {
      const obj = JSON.parse(content)
      if (obj.sleep || (Array.isArray(obj) && obj[0]?.dateOfSleep)) return 'fitbit_sleep'
      if (obj['activities-heart'] || (Array.isArray(obj) && obj[0]?.value?.restingHeartRate !== undefined)) return 'fitbit_heart'
    } catch { /* ignore */ }
    return 'unknown'
  }

  // CSV formats
  if (lower.endsWith('.csv')) {
    const firstLine = head.split('\n')[0].toLowerCase()

    if (lower.includes('physiological_cycles') || lower.includes('whoop')) return 'whoop'
    if (firstLine.includes('recovery score') || firstLine.includes('hrv_rmssd') ||
        firstLine.includes('heart rate variability (ms)') || head.toLowerCase().includes('hrv_rmssd')) return 'whoop'
    if (firstLine.includes('activity type') || firstLine.includes('activity_type')) return 'garmin_activities'
    if (firstLine.includes('total sleep') || firstLine.includes('total_sleep') ||
        firstLine.includes('deep sleep') || firstLine.includes('deep_sleep')) return 'garmin_sleep'
  }

  return 'unknown'
}

// ---------------------------------------------------------------------------
// Garmin – Activities CSV
// Typical headers: Activity Type, Date, Calories, Time, Avg HR, Steps, Distance
// ---------------------------------------------------------------------------

export function parseGarminActivities(csv: string): ParseResult {
  const { rows } = parseCSV(csv)
  const errors: string[] = []
  const warnings: string[] = []
  const raw: ParsedHealthRecord[] = []

  for (const row of rows) {
    const dateRaw = row.date || row.start_time || row['start_time']
    const date = toISODate(dateRaw)
    if (!date) { errors.push(`Invalid date: "${dateRaw}"`); continue }

    const record: ParsedHealthRecord = { date, source: 'garmin_activities' }

    const cal = parseNum(row.calories)
    if (cal != null) record.calories_burned = Math.round(cal)

    const steps = parseNum(row.steps)
    if (steps != null) record.steps = Math.round(steps)

    // "Time" column holds activity duration (h:mm:ss or h:mm)
    const durationHrs = parseHours(row.time || row.duration)
    if (durationHrs != null) record.active_minutes = Math.round(durationHrs * 60)

    raw.push(record)
  }

  // Aggregate multiple activities on the same day
  const byDate = new Map<string, ParsedHealthRecord>()
  for (const r of raw) {
    if (!byDate.has(r.date)) {
      byDate.set(r.date, { ...r })
    } else {
      const e = byDate.get(r.date)!
      if (r.calories_burned) e.calories_burned = (e.calories_burned ?? 0) + r.calories_burned
      if (r.steps) e.steps = (e.steps ?? 0) + r.steps
      if (r.active_minutes) e.active_minutes = (e.active_minutes ?? 0) + r.active_minutes
    }
  }

  return buildResult('garmin_activities', Array.from(byDate.values()), errors, warnings)
}

// ---------------------------------------------------------------------------
// Garmin – Sleep CSV
// Headers: date, total_sleep, deep_sleep, light_sleep, rem_sleep, awake_time
// Values may be in H:MM or decimal-hours format
// ---------------------------------------------------------------------------

export function parseGarminSleep(csv: string): ParseResult {
  const { rows } = parseCSV(csv)
  const errors: string[] = []
  const warnings: string[] = []
  const records: ParsedHealthRecord[] = []

  for (const row of rows) {
    const dateRaw = row.date || row.sleep_date || row['sleep_date']
    const date = toISODate(dateRaw)
    if (!date) { errors.push(`Invalid date: "${dateRaw}"`); continue }

    const record: ParsedHealthRecord = { date, source: 'garmin_sleep' }

    const total = parseHours(row.total_sleep || row['total_sleep'])
    if (total != null) record.sleep_hours = total

    const deep = parseHours(row.deep_sleep || row['deep_sleep'])
    if (deep != null) record.sleep_deep_hours = deep

    const light = parseHours(row.light_sleep || row['light_sleep'])
    if (light != null) record.sleep_light_hours = light

    const rem = parseHours(row.rem_sleep || row['rem_sleep'] || row.rem)
    if (rem != null) record.sleep_rem_hours = rem

    records.push(record)
  }

  return buildResult('garmin_sleep', records, errors, warnings)
}

// ---------------------------------------------------------------------------
// Fitbit – Sleep JSON
// Format: { "sleep": [...] } or [...] where each item has dateOfSleep,
// minutesAsleep, and levels.summary.{ deep, light, rem, wake }
// ---------------------------------------------------------------------------

export function parseFitbitSleep(json: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  let data: unknown
  try { data = JSON.parse(json) } catch {
    return { format: 'fitbit_sleep', records: [], total_rows: 0, date_range: { start: '', end: '' }, errors: ['Invalid JSON'], warnings: [] }
  }

  const arr: unknown[] = Array.isArray(data)
    ? data
    : (data as Record<string, unknown>).sleep as unknown[] ?? []

  const records: ParsedHealthRecord[] = []
  for (const entry of arr) {
    const e = entry as Record<string, unknown>
    const dateRaw = (e.dateOfSleep as string) ?? (e.startTime as string)?.substring(0, 10)
    const date = toISODate(dateRaw)
    if (!date) { warnings.push('Skipping entry with missing date'); continue }

    const record: ParsedHealthRecord = { date, source: 'fitbit_sleep' }

    const mins = e.minutesAsleep as number | undefined
    if (mins != null) record.sleep_hours = mins / 60

    const summary = (e.levels as Record<string, unknown> | undefined)?.summary as Record<string, { minutes: number }> | undefined
    if (summary) {
      if (summary.deep?.minutes != null) record.sleep_deep_hours = summary.deep.minutes / 60
      if (summary.rem?.minutes != null) record.sleep_rem_hours = summary.rem.minutes / 60
      if (summary.light?.minutes != null) record.sleep_light_hours = summary.light.minutes / 60
    }

    records.push(record)
  }

  return buildResult('fitbit_sleep', records, errors, warnings)
}

// ---------------------------------------------------------------------------
// Fitbit – Heart Rate JSON
// Format: { "activities-heart": [{ dateTime, value: { restingHeartRate } }] }
// ---------------------------------------------------------------------------

export function parseFitbitHeart(json: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  let data: unknown
  try { data = JSON.parse(json) } catch {
    return { format: 'fitbit_heart', records: [], total_rows: 0, date_range: { start: '', end: '' }, errors: ['Invalid JSON'], warnings: [] }
  }

  const arr: unknown[] = Array.isArray(data)
    ? data
    : ((data as Record<string, unknown>)['activities-heart'] as unknown[] ?? [])

  const records: ParsedHealthRecord[] = []
  for (const entry of arr) {
    const e = entry as Record<string, unknown>
    const date = toISODate(e.dateTime as string)
    if (!date) { warnings.push('Skipping entry with missing date'); continue }

    const rhr = (e.value as Record<string, number> | undefined)?.restingHeartRate
    if (rhr == null) continue

    records.push({ date, resting_hr: Math.round(rhr), source: 'fitbit_heart' })
  }

  return buildResult('fitbit_heart', records, errors, warnings)
}

// ---------------------------------------------------------------------------
// Whoop – physiological_cycles.csv
// Headers vary between exports; handles both simplified and full Whoop export
// ---------------------------------------------------------------------------

export function parseWhoop(csv: string): ParseResult {
  const { rows } = parseCSV(csv)
  const errors: string[] = []
  const warnings: string[] = []
  const records: ParsedHealthRecord[] = []

  for (const row of rows) {
    // Date: "day" (simplified) or "cycle_start_time" (full export)
    const dateRaw =
      row.day ||
      row.cycle_start_time ||
      row.date
    const date = toISODate(dateRaw)
    if (!date) { warnings.push(`Skipping row with invalid date: "${dateRaw}"`); continue }

    const record: ParsedHealthRecord = { date, source: 'whoop' }

    // Recovery score (may have trailing %)
    const recRaw =
      row.recovery_score ||
      row['recovery_score_'] ||
      row.recovery_score_
    const rec = parseNum(recRaw?.replace('%', ''))
    if (rec != null) record.recovery_score = Math.round(Math.min(100, Math.max(0, rec)))

    // HRV (rmssd in ms)
    const hrv = parseNum(
      row.hrv_rmssd ||
      row.heart_rate_variability_ms ||
      row['heart_rate_variability_(ms)']
    )
    if (hrv != null) record.hrv_ms = hrv

    // Resting heart rate
    const rhr = parseNum(
      row.resting_heart_rate ||
      row['resting_heart_rate_(bpm)'] ||
      row.resting_heart_rate_bpm
    )
    if (rhr != null) record.resting_hr = Math.round(rhr)

    records.push(record)
  }

  return buildResult('whoop', records, errors, warnings)
}

// ---------------------------------------------------------------------------
// Apple Health – export.xml
// Parses <Record …/> elements via regex (works in both browser and Node)
// ---------------------------------------------------------------------------

function extractXmlAttr(attrs: string, name: string): string | undefined {
  const re = new RegExp(`\\b${name}="([^"]*)"`)
  return attrs.match(re)?.[1]
}

export function parseAppleHealth(xml: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Safety cap: process at most 100 MB
  const MAX = 100 * 1024 * 1024
  const src = xml.length > MAX ? xml.substring(0, MAX) : xml
  if (xml.length > MAX) {
    warnings.push(`File truncated to 100 MB for parsing (original: ${(xml.length / 1024 / 1024).toFixed(0)} MB)`)
  }

  type Entry = {
    steps: number
    sleepMinutes: number
    deepMinutes: number
    remMinutes: number
    lightMinutes: number
    hrValues: number[]
    hrvValues: number[]
    calories: number
  }

  const byDate = new Map<string, Entry>()
  const get = (date: string): Entry => {
    if (!byDate.has(date)) {
      byDate.set(date, { steps: 0, sleepMinutes: 0, deepMinutes: 0, remMinutes: 0, lightMinutes: 0, hrValues: [], hrvValues: [], calories: 0 })
    }
    return byDate.get(date)!
  }

  const recordRe = /<Record\s+((?:[^>"]|"[^"]*")*?)\/>/g
  let m: RegExpExecArray | null

  while ((m = recordRe.exec(src)) !== null) {
    const attrs = m[1]
    const type = extractXmlAttr(attrs, 'type')
    if (!type) continue

    const startDateRaw = extractXmlAttr(attrs, 'startDate')
    if (!startDateRaw) continue
    const date = startDateRaw.substring(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue

    const valueStr = extractXmlAttr(attrs, 'value')

    switch (type) {
      case 'HKQuantityTypeIdentifierStepCount': {
        const v = parseFloat(valueStr ?? '')
        if (!isNaN(v)) get(date).steps += v
        break
      }
      case 'HKCategoryTypeIdentifierSleepAnalysis': {
        if (!valueStr) break
        const endRaw = extractXmlAttr(attrs, 'endDate')
        if (!endRaw) break
        const startMs = new Date(startDateRaw).getTime()
        const endMs = new Date(endRaw).getTime()
        if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) break
        const mins = (endMs - startMs) / 60_000
        const v = valueStr
        // Ignore InBed – only count actual sleep
        if (v.includes('AsleepDeep')) {
          get(date).deepMinutes += mins
          get(date).sleepMinutes += mins
        } else if (v.includes('AsleepREM')) {
          get(date).remMinutes += mins
          get(date).sleepMinutes += mins
        } else if (v.includes('AsleepCore')) {
          get(date).lightMinutes += mins
          get(date).sleepMinutes += mins
        } else if (v === 'HKCategoryValueSleepAnalysisAsleep') {
          // Older iOS format without stage breakdown
          get(date).sleepMinutes += mins
        }
        break
      }
      case 'HKQuantityTypeIdentifierRestingHeartRate': {
        const v = parseFloat(valueStr ?? '')
        if (!isNaN(v)) get(date).hrValues.push(v)
        break
      }
      case 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN': {
        const v = parseFloat(valueStr ?? '')
        if (!isNaN(v)) get(date).hrvValues.push(v)
        break
      }
      case 'HKQuantityTypeIdentifierActiveEnergyBurned': {
        const v = parseFloat(valueStr ?? '')
        if (!isNaN(v)) get(date).calories += v
        break
      }
    }
  }

  const records: ParsedHealthRecord[] = []
  for (const [date, d] of byDate) {
    const rec: ParsedHealthRecord = { date, source: 'apple_health' }
    if (d.steps > 0) rec.steps = Math.round(d.steps)
    if (d.sleepMinutes > 0) rec.sleep_hours = d.sleepMinutes / 60
    if (d.deepMinutes > 0) rec.sleep_deep_hours = d.deepMinutes / 60
    if (d.remMinutes > 0) rec.sleep_rem_hours = d.remMinutes / 60
    if (d.lightMinutes > 0) rec.sleep_light_hours = d.lightMinutes / 60
    if (d.hrValues.length > 0) rec.resting_hr = Math.round(d.hrValues.reduce((a, b) => a + b, 0) / d.hrValues.length)
    if (d.hrvValues.length > 0) rec.hrv_ms = d.hrvValues.reduce((a, b) => a + b, 0) / d.hrvValues.length
    if (d.calories > 0) rec.calories_burned = Math.round(d.calories)
    records.push(rec)
  }

  return buildResult('apple_health', records, errors, warnings)
}

// ---------------------------------------------------------------------------
// Auto-detect and parse
// ---------------------------------------------------------------------------

export function parseAuto(filename: string, content: string): ParseResult {
  const fmt = detectFormat(filename, content)
  switch (fmt) {
    case 'garmin_activities': return parseGarminActivities(content)
    case 'garmin_sleep':      return parseGarminSleep(content)
    case 'fitbit_sleep':      return parseFitbitSleep(content)
    case 'fitbit_heart':      return parseFitbitHeart(content)
    case 'whoop':             return parseWhoop(content)
    case 'apple_health':      return parseAppleHealth(content)
    default: {
      // Last-ditch heuristic based on content shape
      const trimmed = content.trimStart()
      if (trimmed.startsWith('<')) return parseAppleHealth(content)
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const obj = JSON.parse(content) as Record<string, unknown>
          if (obj.sleep || (Array.isArray(obj) && (obj as unknown[])[0] && ((obj as unknown[])[0] as Record<string, unknown>).dateOfSleep)) return parseFitbitSleep(content)
          if (obj['activities-heart']) return parseFitbitHeart(content)
        } catch { /* ignore */ }
      }
      return {
        format: 'unknown',
        records: [],
        total_rows: 0,
        date_range: { start: '', end: '' },
        errors: ['Unable to detect file format. Supported: Garmin CSV, Fitbit JSON, Whoop CSV, Apple Health XML.'],
        warnings: [],
      }
    }
  }
}

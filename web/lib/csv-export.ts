/**
 * CSV export utilities for GetZen health data.
 * Each function returns a CSV string with headers.
 * Uses browser Blob + URL.createObjectURL for client-side downloads.
 */

export interface CSVExportOptions {
  date_range: { start: string; end: string }
  include_metrics: boolean
  include_sleep: boolean
  include_food_scans: boolean
  include_workouts: boolean
  include_lab_results: boolean
  include_medications: boolean
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(str)) return `\t${str}`
  if (/[,"\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

function buildCSV(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return [headers.join(','), ...rows.map(r => r.map(escapeCsvCell).join(','))].join('\n')
}

export type MetricsRow = {
  date?: string
  steps?: number
  active_calories?: number
  distance_meters?: number
  resting_heart_rate?: number
  avg_hrv?: number
  sleep_duration_minutes?: number
  weight_kg?: number
  recovery_score?: number
  strain_score?: number
}

export type SleepRow = {
  start_time?: string
  end_time?: string
  duration_minutes?: number
  deep_minutes?: number
  rem_minutes?: number
  core_minutes?: number
  awake_minutes?: number
}

export type ProductScan = {
  product_name?: string
  brand?: string
  barcode?: string
  health_score?: number
  nova_group?: number
  nutriscore?: string
  scanned_at?: string
}

export type LabResult = {
  biomarker_key?: string
  value?: number
  unit?: string
  lab_date?: string
  lab_name?: string
  notes?: string
}

export type MedicationRow = {
  medication_name?: string
  generic_name?: string
  dosage?: string
  frequency?: string
  start_date?: string
  end_date?: string
  is_active?: boolean
}

export function metricsToCSV(data: MetricsRow[]): string {
  return buildCSV(
    ['date', 'steps', 'active_calories', 'distance_meters', 'resting_heart_rate', 'avg_hrv', 'sleep_duration_minutes', 'weight_kg', 'recovery_score', 'strain_score'],
    data.map(r => [r.date, r.steps, r.active_calories, r.distance_meters, r.resting_heart_rate, r.avg_hrv, r.sleep_duration_minutes, r.weight_kg, r.recovery_score, r.strain_score])
  )
}

export function sleepToCSV(data: SleepRow[]): string {
  return buildCSV(
    ['date', 'start_time', 'end_time', 'duration_minutes', 'deep_minutes', 'rem_minutes', 'core_minutes', 'awake_minutes'],
    data.map(r => [r.start_time?.slice(0, 10), r.start_time, r.end_time, r.duration_minutes, r.deep_minutes, r.rem_minutes, r.core_minutes, r.awake_minutes])
  )
}

export function foodScansToCSV(data: ProductScan[]): string {
  return buildCSV(
    ['scanned_at', 'product_name', 'brand', 'barcode', 'health_score', 'nova_group', 'nutriscore'],
    data.map(r => [r.scanned_at, r.product_name, r.brand, r.barcode, r.health_score, r.nova_group, r.nutriscore])
  )
}

export function labResultsToCSV(data: LabResult[]): string {
  return buildCSV(
    ['lab_date', 'biomarker_key', 'value', 'unit', 'lab_name', 'notes'],
    data.map(r => [r.lab_date, r.biomarker_key, r.value, r.unit, r.lab_name, r.notes])
  )
}

export function medicationsToCSV(data: MedicationRow[]): string {
  return buildCSV(
    ['medication_name', 'generic_name', 'dosage', 'frequency', 'start_date', 'end_date', 'is_active'],
    data.map(r => [r.medication_name, r.generic_name, r.dosage, r.frequency, r.start_date, r.end_date, r.is_active != null ? (r.is_active ? 'yes' : 'no') : ''])
  )
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

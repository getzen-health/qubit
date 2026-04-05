import { describe, it, expect } from 'vitest'
import {
  metricsToCSV,
  sleepToCSV,
  foodScansToCSV,
  labResultsToCSV,
  medicationsToCSV,
  type MetricsRow,
  type SleepRow,
  type ProductScan,
  type LabResult,
  type MedicationRow,
} from '../lib/csv-export'

describe('metricsToCSV', () => {
  it('returns correct headers', () => {
    const csv = metricsToCSV([])
    const headers = csv.split('\n')[0]
    expect(headers).toBe('date,steps,active_calories,distance_meters,resting_heart_rate,avg_hrv,sleep_duration_minutes,weight_kg,recovery_score,strain_score')
  })

  it('returns only headers for empty data', () => {
    const csv = metricsToCSV([])
    expect(csv.split('\n')).toHaveLength(1)
  })

  it('renders data rows correctly', () => {
    const data: MetricsRow[] = [{
      date: '2024-01-01', steps: 10000, active_calories: 500,
      distance_meters: 8000, resting_heart_rate: 60, avg_hrv: 45,
      sleep_duration_minutes: 480, weight_kg: 70, recovery_score: 85, strain_score: 12,
    }]
    const csv = metricsToCSV(data)
    const lines = csv.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toBe('2024-01-01,10000,500,8000,60,45,480,70,85,12')
  })
})

describe('sleepToCSV', () => {
  it('returns correct headers', () => {
    const csv = sleepToCSV([])
    expect(csv.split('\n')[0]).toContain('duration_minutes')
    expect(csv.split('\n')[0]).toContain('deep_minutes')
  })

  it('returns only headers for empty data', () => {
    expect(sleepToCSV([]).split('\n')).toHaveLength(1)
  })

  it('extracts date from start_time', () => {
    const data: SleepRow[] = [{
      start_time: '2024-01-01T22:00:00', end_time: '2024-01-02T06:00:00',
      duration_minutes: 480, deep_minutes: 90, rem_minutes: 120,
      core_minutes: 240, awake_minutes: 30,
    }]
    const csv = sleepToCSV(data)
    const row = csv.split('\n')[1]
    expect(row.startsWith('2024-01-01')).toBe(true)
  })
})

describe('foodScansToCSV', () => {
  it('returns correct headers', () => {
    const csv = foodScansToCSV([])
    expect(csv.split('\n')[0]).toContain('product_name')
    expect(csv.split('\n')[0]).toContain('health_score')
  })

  it('returns only headers for empty data', () => {
    expect(foodScansToCSV([]).split('\n')).toHaveLength(1)
  })

  it('renders product scan data', () => {
    const data: ProductScan[] = [{
      product_name: 'Oats', brand: 'NatureCo', barcode: '1234567890',
      health_score: 92, nova_group: 1, nutriscore: 'A', scanned_at: '2024-01-01',
    }]
    const csv = foodScansToCSV(data)
    expect(csv.split('\n')[1]).toContain('Oats')
    expect(csv.split('\n')[1]).toContain('NatureCo')
  })
})

describe('labResultsToCSV', () => {
  it('returns correct headers', () => {
    const csv = labResultsToCSV([])
    expect(csv.split('\n')[0]).toContain('biomarker_key')
    expect(csv.split('\n')[0]).toContain('lab_name')
  })

  it('returns only headers for empty data', () => {
    expect(labResultsToCSV([]).split('\n')).toHaveLength(1)
  })

  it('renders lab result data', () => {
    const data: LabResult[] = [{
      biomarker_key: 'glucose', value: 95, unit: 'mg/dL',
      lab_date: '2024-01-01', lab_name: 'LabCorp', notes: 'fasting',
    }]
    const csv = labResultsToCSV(data)
    expect(csv.split('\n')[1]).toContain('glucose')
    expect(csv.split('\n')[1]).toContain('95')
  })
})

describe('medicationsToCSV', () => {
  it('returns correct headers', () => {
    const csv = medicationsToCSV([])
    expect(csv.split('\n')[0]).toContain('is_active')
    expect(csv.split('\n')[0]).toContain('medication_name')
  })

  it('returns only headers for empty data', () => {
    expect(medicationsToCSV([]).split('\n')).toHaveLength(1)
  })

  it('converts is_active boolean to "yes"/"no"', () => {
    const data: MedicationRow[] = [
      { medication_name: 'Metformin', is_active: true, dosage: '500mg', frequency: 'daily' },
      { medication_name: 'Aspirin', is_active: false, dosage: '81mg', frequency: 'daily' },
    ]
    const csv = medicationsToCSV(data)
    const lines = csv.split('\n')
    expect(lines[1]).toContain('yes')
    expect(lines[2]).toContain('no')
  })

  it('renders empty string for undefined is_active', () => {
    const data: MedicationRow[] = [{ medication_name: 'Vitamin D' }]
    const csv = medicationsToCSV(data)
    const row = csv.split('\n')[1]
    // The row has trailing empty fields separated by commas
    const fields = row.split(',')
    const isActiveField = fields[fields.length - 1]
    expect(isActiveField).toBe('')
  })
})

describe('CSV special characters', () => {
  it('escapes commas by wrapping in quotes', () => {
    const data: LabResult[] = [{
      biomarker_key: 'test', notes: 'note, with comma',
    }]
    const csv = labResultsToCSV(data)
    expect(csv).toContain('"note, with comma"')
  })

  it('escapes double quotes by doubling them', () => {
    const data: LabResult[] = [{
      biomarker_key: 'test', notes: 'has "quotes" inside',
    }]
    const csv = labResultsToCSV(data)
    expect(csv).toContain('"has ""quotes"" inside"')
  })

  it('prefixes dangerous characters with tab to prevent CSV injection', () => {
    const data: LabResult[] = [{
      biomarker_key: 'test', notes: '=cmd|calc',
    }]
    const csv = labResultsToCSV(data)
    expect(csv).toContain('\t=cmd|calc')
  })
})

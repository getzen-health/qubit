/**
 * FHIR R4 export utilities
 * Builds HL7 FHIR R4-compliant Bundle resources from GetZen health data.
 * References: https://hl7.org/fhir/R4/
 */

export interface FHIRBundle {
  resourceType: 'Bundle'
  type: 'collection'
  timestamp: string
  entry: FHIREntry[]
}

export interface FHIREntry {
  resource: FHIRResource
}

type FHIRResource = FHIRPatient | FHIRObservation | FHIRMedicationStatement

interface FHIRCoding {
  system: string
  code: string
  display?: string
}

interface FHIRPatient {
  resourceType: 'Patient'
  id: string
  name?: Array<{ text?: string }>
  telecom?: Array<{ system: string; value: string }>
}

interface FHIRObservation {
  resourceType: 'Observation'
  id: string
  status: 'final'
  category: Array<{ coding: FHIRCoding[] }>
  code: { coding: FHIRCoding[]; text: string }
  subject: { reference: string }
  effectiveDateTime: string
  valueQuantity?: {
    value: number
    unit: string
    system: 'http://unitsofmeasure.org'
    code: string
  }
}

interface FHIRMedicationStatement {
  resourceType: 'MedicationStatement'
  id: string
  status: 'active' | 'completed' | 'unknown'
  subject: { reference: string }
  medicationCodeableConcept: { text: string }
  dosage?: Array<{ text: string }>
  effectivePeriod?: { start?: string; end?: string }
}

export interface UserProfile {
  id: string
  email?: string
  display_name?: string
  timezone?: string
}

export interface HealthMetric {
  date: string
  type: string
  value: number
  unit?: string
}

export interface UserMedication {
  id?: string
  medication_name: string
  generic_name?: string
  dosage?: string
  frequency?: string
  start_date?: string
  end_date?: string
  is_active?: boolean
}

export interface ExportData {
  profile?: UserProfile
  metrics?: Array<{
    date: string
    steps?: number
    active_calories?: number
    distance_meters?: number
    resting_heart_rate?: number
    avg_hrv?: number
    sleep_duration_minutes?: number
    weight_kg?: number
    recovery_score?: number
    strain_score?: number
  }>
  sleep?: Array<{
    start_time: string
    end_time?: string
    duration_minutes?: number
    deep_minutes?: number
    rem_minutes?: number
    core_minutes?: number
    awake_minutes?: number
  }>
  food_scans?: Array<{
    product_name: string
    brand?: string
    barcode?: string
    health_score?: number
    nova_group?: number
    nutriscore?: string
    scanned_at: string
  }>
  workouts?: Array<{
    type?: string
    duration_minutes?: number
    calories?: number
    workout_date?: string
  }>
  lab_results?: Array<{
    biomarker_key: string
    value: number
    unit?: string
    lab_date: string
    lab_name?: string
    notes?: string
  }>
  medications?: UserMedication[]
  fasting?: Array<{
    protocol_id?: string
    start_time: string
    end_time?: string
    target_hours?: number
    actual_hours?: number
    completed?: boolean
  }>
}

// LOINC codes for common health observations
// Reference: https://loinc.org/
const LOINC_CODES: Record<string, { code: string; display: string; unit: string; ucum: string }> = {
  steps: { code: '55423-8', display: 'Number of steps in 24 hour Measured', unit: 'steps/day', ucum: '/d' },
  weight_kg: { code: '29463-7', display: 'Body weight', unit: 'kg', ucum: 'kg' },
  resting_heart_rate: { code: '8867-4', display: 'Heart rate', unit: 'beats/min', ucum: '/min' },
  sleep_duration_minutes: { code: '93832-4', display: 'Sleep duration', unit: 'min', ucum: 'min' },
  avg_hrv: { code: '80404-7', display: 'R-R interval.standard deviation (Heart rate variability)', unit: 'ms', ucum: 'ms' },
  bmi: { code: '39156-5', display: 'Body mass index (BMI)', unit: 'kg/m2', ucum: 'kg/m2' },
  active_calories: { code: '41981-2', display: 'Calories burned', unit: 'kcal', ucum: 'kcal' },
  distance_meters: { code: '55430-3', display: 'Walking distance 24 hour Measured', unit: 'm', ucum: 'm' },
}

const ACTIVITY_CATEGORY: FHIRCoding = {
  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
  code: 'activity',
  display: 'Activity',
}

export function buildPatientResource(profile: UserProfile): FHIRPatient {
  const patient: FHIRPatient = {
    resourceType: 'Patient',
    id: profile.id,
  }
  if (profile.display_name) {
    patient.name = [{ text: profile.display_name }]
  }
  if (profile.email) {
    patient.telecom = [{ system: 'email', value: profile.email }]
  }
  return patient
}

export function buildObservationResource(metric: HealthMetric, patientId: string): FHIRObservation {
  const loinc = LOINC_CODES[metric.type]
  const safeId = `obs-${metric.type}-${metric.date.replace(/\D/g, '')}`

  return {
    resourceType: 'Observation',
    id: safeId,
    status: 'final',
    category: [{ coding: [ACTIVITY_CATEGORY] }],
    code: loinc
      ? { coding: [{ system: 'http://loinc.org', code: loinc.code, display: loinc.display }], text: loinc.display }
      : { coding: [{ system: 'http://kquarks.app/codes', code: metric.type }], text: metric.type },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: new Date(metric.date).toISOString(),
    valueQuantity: {
      value: metric.value,
      unit: metric.unit ?? loinc?.unit ?? '',
      system: 'http://unitsofmeasure.org',
      code: loinc?.ucum ?? metric.unit ?? '',
    },
  }
}

export function buildMedicationStatement(med: UserMedication, patientId: string): FHIRMedicationStatement {
  const safeId = `med-${(med.id ?? med.medication_name).replace(/[^a-z0-9]/gi, '-').toLowerCase()}`

  const stmt: FHIRMedicationStatement = {
    resourceType: 'MedicationStatement',
    id: safeId,
    status: med.is_active ? 'active' : med.end_date ? 'completed' : 'unknown',
    subject: { reference: `Patient/${patientId}` },
    medicationCodeableConcept: {
      text: med.generic_name
        ? `${med.medication_name} (${med.generic_name})`
        : med.medication_name,
    },
  }
  if (med.dosage || med.frequency) {
    stmt.dosage = [{ text: [med.dosage, med.frequency].filter(Boolean).join(', ') }]
  }
  if (med.start_date || med.end_date) {
    stmt.effectivePeriod = { start: med.start_date, end: med.end_date }
  }
  return stmt
}

const METRIC_KEYS = [
  'steps',
  'active_calories',
  'distance_meters',
  'resting_heart_rate',
  'avg_hrv',
  'sleep_duration_minutes',
  'weight_kg',
] as const

export function buildFHIRBundle(data: ExportData): FHIRBundle {
  const entries: FHIREntry[] = []
  const patientId = data.profile?.id ?? 'unknown-patient'

  if (data.profile) {
    entries.push({ resource: buildPatientResource(data.profile) })
  }

  for (const row of data.metrics ?? []) {
    for (const key of METRIC_KEYS) {
      const val = row[key]
      if (val != null) {
        entries.push({
          resource: buildObservationResource({ date: row.date, type: key, value: val }, patientId),
        })
      }
    }
  }

  for (const med of data.medications ?? []) {
    entries.push({ resource: buildMedicationStatement(med, patientId) })
  }

  return {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: entries,
  }
}

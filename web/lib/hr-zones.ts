// ─── Types ─────────────────────────────────────────────────────────────────

export type MaxHRFormula = 'tanaka' | 'fox' | 'manual'

export interface HRZone {
  zone: number
  name: string
  description: string
  min_bpm: number
  max_bpm: number
  min_hrr_pct: number
  max_hrr_pct: number
  color: string          // tailwind bg color class
  benefit: string
  typical_feel: string   // RPE description
  weekly_target_pct: number // Seiler 80/20 distribution
}

export interface HRZoneProfile {
  age: number
  resting_hr: number
  max_hr: number
  formula_used: MaxHRFormula
  hr_reserve: number
  zones: HRZone[]
  vo2max_estimate: number
  cardio_fitness: 'Poor' | 'Fair' | 'Good' | 'Excellent' | 'Superior'
}

export interface WorkoutZoneLog {
  date: string
  duration_min: number
  avg_hr: number
  zone: number
  calories?: number
}

// ─── Internal zone definitions ─────────────────────────────────────────────

const ZONE_DEFS = [
  {
    zone: 1,
    name: 'Recovery',
    min_hrr_pct: 50,
    max_hrr_pct: 60,
    color: 'bg-sky-400',
    benefit: 'Active recovery, fat oxidation, aerobic base',
    description: 'Very light effort. Easy conversation possible. Used for warm-up, cool-down, and recovery days.',
    typical_feel: 'RPE 1–2: Very easy, could sustain for hours',
    weekly_target_pct: 40,
  },
  {
    zone: 2,
    name: 'Aerobic Base',
    min_hrr_pct: 60,
    max_hrr_pct: 70,
    color: 'bg-green-500',
    benefit: 'Endurance, fat metabolism, mitochondrial development',
    description: 'Comfortable, conversational pace. Primary fat-burning zone. Forms the foundation of aerobic fitness.',
    typical_feel: 'RPE 3–4: Comfortable, full sentences possible',
    weekly_target_pct: 40,
  },
  {
    zone: 3,
    name: 'Tempo',
    min_hrr_pct: 70,
    max_hrr_pct: 80,
    color: 'bg-yellow-400',
    benefit: 'Cardio efficiency, aerobic power, lactate clearance',
    description: 'Moderate-hard effort. Speech becomes fragmented. Improves cardiovascular efficiency and tempo pace.',
    typical_feel: 'RPE 5–6: Somewhat hard, short phrases only',
    weekly_target_pct: 10,
  },
  {
    zone: 4,
    name: 'Threshold',
    min_hrr_pct: 80,
    max_hrr_pct: 90,
    color: 'bg-orange-500',
    benefit: 'Lactate threshold, VO₂max development, speed',
    description: 'Hard effort near lactate threshold. Only brief sentences possible. Raises performance ceiling.',
    typical_feel: 'RPE 7–8: Hard, only single words possible',
    weekly_target_pct: 7,
  },
  {
    zone: 5,
    name: 'Anaerobic',
    min_hrr_pct: 90,
    max_hrr_pct: 100,
    color: 'bg-red-500',
    benefit: 'VO₂max, anaerobic capacity, neuromuscular power',
    description: 'Maximum effort. Cannot sustain for more than a few minutes. Develops peak performance capacity.',
    typical_feel: 'RPE 9–10: Maximal, no talking',
    weekly_target_pct: 3,
  },
]

// ─── Core calculations ─────────────────────────────────────────────────────

/** Tanaka et al. (J Am Coll Cardiol 2001): 208 − 0.7 × age */
export function calculateMaxHR(age: number, formula: MaxHRFormula, manual_hr?: number): number {
  if (formula === 'manual' && manual_hr && manual_hr > 0) return manual_hr
  if (formula === 'tanaka') return Math.round(208 - 0.7 * age)
  return 220 - age // fox
}

/** Karvonen method: target HR = ((HRmax − HRrest) × intensity%) + HRrest */
export function calculateHRZones(
  age: number,
  resting_hr: number,
  formula: MaxHRFormula = 'tanaka',
  manual_max?: number,
): HRZoneProfile {
  const max_hr = calculateMaxHR(age, formula, manual_max)
  const hr_reserve = max_hr - resting_hr

  const zones: HRZone[] = ZONE_DEFS.map(def => ({
    zone: def.zone,
    name: def.name,
    description: def.description,
    min_bpm: Math.round(resting_hr + (hr_reserve * def.min_hrr_pct) / 100),
    max_bpm: Math.round(resting_hr + (hr_reserve * def.max_hrr_pct) / 100),
    min_hrr_pct: def.min_hrr_pct,
    max_hrr_pct: def.max_hrr_pct,
    color: def.color,
    benefit: def.benefit,
    typical_feel: def.typical_feel,
    weekly_target_pct: def.weekly_target_pct,
  }))

  const vo2max_estimate = estimateVO2max(max_hr, resting_hr)
  const cardio_fitness = cardioFitnessCategory(vo2max_estimate, age, 'male') as HRZoneProfile['cardio_fitness']

  return { age, resting_hr, max_hr, formula_used: formula, hr_reserve, zones, vo2max_estimate, cardio_fitness }
}

export function detectZone(hr: number, zones: HRZone[]): number {
  for (const z of zones) {
    if (hr >= z.min_bpm && hr < z.max_bpm) return z.zone
  }
  return hr >= (zones[zones.length - 1]?.max_bpm ?? 0) ? 5 : 1
}

/** Uth et al. (2004): VO₂max ≈ 15 × (HRmax / HRrest) */
export function estimateVO2max(max_hr: number, resting_hr: number): number {
  return Math.round((15 * (max_hr / resting_hr)) * 10) / 10
}

/** ACSM normative VO₂max categories */
export function cardioFitnessCategory(vo2max: number, age: number, sex: 'male' | 'female'): string {
  type Threshold = { label: string; max: number }
  const row = (p: number, f: number, g: number, e: number): Threshold[] => [
    { label: 'Poor', max: p },
    { label: 'Fair', max: f },
    { label: 'Good', max: g },
    { label: 'Excellent', max: e },
    { label: 'Superior', max: Infinity },
  ]
  const male: Record<string, Threshold[]> = {
    '<30': row(34, 42, 52, 60),
    '30s': row(32, 40, 49, 57),
    '40s': row(30, 37, 46, 54),
    '50s': row(26, 34, 42, 50),
    '60+': row(22, 30, 38, 46),
  }
  const female: Record<string, Threshold[]> = {
    '<30': row(27, 36, 45, 55),
    '30s': row(25, 34, 43, 53),
    '40s': row(23, 32, 41, 51),
    '50s': row(21, 29, 38, 47),
    '60+': row(18, 26, 34, 43),
  }
  const bucket = age < 30 ? '<30' : age < 40 ? '30s' : age < 50 ? '40s' : age < 60 ? '50s' : '60+'
  const table = sex === 'male' ? male : female
  return table[bucket].find(t => vo2max <= t.max)?.label ?? 'Superior'
}

/** Seiler 80/20 polarized training compliance analysis */
export function analyzePolarizedBalance(logs: WorkoutZoneLog[]): {
  zone12_pct: number
  zone345_pct: number
  compliant: boolean
  recommendation: string
} {
  if (!logs.length) {
    return {
      zone12_pct: 0,
      zone345_pct: 0,
      compliant: false,
      recommendation: 'Start logging workouts to analyse your training distribution.',
    }
  }

  const totalMin = logs.reduce((s, l) => s + l.duration_min, 0)
  const zone12Min = logs.filter(l => l.zone <= 2).reduce((s, l) => s + l.duration_min, 0)
  const zone345Min = logs.filter(l => l.zone >= 3).reduce((s, l) => s + l.duration_min, 0)

  const zone12_pct = Math.round((zone12Min / totalMin) * 100)
  const zone345_pct = Math.round((zone345Min / totalMin) * 100)
  const compliant = zone12_pct >= 75 && zone12_pct <= 85

  let recommendation: string
  if (zone12_pct < 75) {
    recommendation = `You're spending too much time in high-intensity zones (${zone345_pct}%). Shift more sessions to easy zone 1–2 work to build aerobic base and speed recovery.`
  } else if (zone12_pct > 85) {
    recommendation = `Great aerobic base work! Add 1–2 high-intensity zone 4–5 sessions per week to stimulate further adaptation.`
  } else {
    recommendation = `Perfect polarised balance! Your 80/20 split matches elite training distribution (Seiler model). Keep it up.`
  }

  return { zone12_pct, zone345_pct, compliant, recommendation }
}

// ─── Backward-compatible exports (used by /training/hr-zones) ──────────────

/** @deprecated Use calculateHRZones instead */
export function calculateZones(age: number, restingHR = 60) {
  const profile = calculateHRZones(age, restingHR, 'fox')
  return profile.zones.map(z => ({
    zone: z.zone,
    name: z.name,
    minPct: z.min_hrr_pct,
    maxPct: z.max_hrr_pct,
    color: z.color,
    benefit: z.benefit,
    description: z.description,
    minBPM: z.min_bpm,
    maxBPM: z.max_bpm,
    maxAbsBPM: z.max_bpm,
  }))
}

/** @deprecated Use detectZone + calculateHRZones instead */
export function getZoneForHR(hr: number, age: number, restingHR = 60) {
  const profile = calculateHRZones(age, restingHR, 'fox')
  const num = detectZone(hr, profile.zones)
  return profile.zones.find(z => z.zone === num) ?? null
}

export const HR_ZONES = ZONE_DEFS

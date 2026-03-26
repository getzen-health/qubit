// Biometric calculation library
// References: Deurenberg 1991 (BMI-based BF%), Hodgdon/Beckett 1984 (Navy method),
// Garthe 2011 (rate of loss), Browning 2010 (WHtR), WHO/NHLBI/IDF thresholds

export interface BiometricLog {
  id?: string
  date: string
  weight_kg?: number | null
  body_fat_pct?: number | null
  waist_cm?: number | null
  hip_cm?: number | null
  neck_cm?: number | null
  chest_cm?: number | null
  arm_cm?: number | null
  thigh_cm?: number | null
  calf_cm?: number | null
  notes?: string | null
}

export interface BiometricSettings {
  height_cm?: number | null
  sex?: 'male' | 'female' | 'other' | null
  ethnicity?: 'european' | 'asian' | 'other'
  target_weight_kg?: number | null
  target_date?: string | null
  goal_type?: 'lose' | 'maintain' | 'gain'
}

// ─── BMI ────────────────────────────────────────────────────────────────────

export interface BMIResult {
  value: number
  category: string
  categoryAsian: string
  color: string
}

export function calculateBMI(weight_kg: number, height_cm: number): BMIResult {
  const h = height_cm / 100
  const bmi = weight_kg / (h * h)
  const v = +bmi.toFixed(1)

  let category: string
  let color: string
  if (v < 18.5) { category = 'Underweight'; color = '#60a5fa' }
  else if (v < 25) { category = 'Normal weight'; color = '#4ade80' }
  else if (v < 30) { category = 'Overweight'; color = '#facc15' }
  else { category = 'Obese'; color = '#f87171' }

  let categoryAsian: string
  if (v < 18.5) categoryAsian = 'Underweight'
  else if (v < 23) categoryAsian = 'Normal weight'
  else if (v < 27.5) categoryAsian = 'Overweight'
  else categoryAsian = 'Obese'

  return { value: v, category, categoryAsian, color }
}

// ─── Body Fat – Navy Method (Hodgdon & Beckett 1984) ────────────────────────

export function navyBodyFat(
  neck_cm: number,
  waist_cm: number,
  hip_cm: number,
  height_cm: number,
  sex: 'male' | 'female'
): number {
  if (sex === 'male') {
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(waist_cm - neck_cm) + 0.15456 * Math.log10(height_cm)) - 450
    return +Math.max(0, bf).toFixed(1)
  }
  const bf = 495 / (1.29579 - 0.35004 * Math.log10(waist_cm + hip_cm - neck_cm) + 0.22100 * Math.log10(height_cm)) - 450
  return +Math.max(0, bf).toFixed(1)
}

// ─── Body Fat – Deurenberg 1991 (BMI-based) ─────────────────────────────────

export function bmiBodyFat(bmi: number, age: number, sex: 'male' | 'female'): number {
  const sexVal = sex === 'male' ? 1 : 0
  const bf = 1.20 * bmi + 0.23 * age - 10.8 * sexVal - 5.4
  return +Math.max(0, bf).toFixed(1)
}

// ─── Fat Mass / Lean Mass ────────────────────────────────────────────────────

export function calculateFatMassLeanMass(
  weight_kg: number,
  bodyFatPct: number
): { fatMass: number; leanMass: number } {
  const fatMass = +(weight_kg * bodyFatPct / 100).toFixed(2)
  const leanMass = +(weight_kg - fatMass).toFixed(2)
  return { fatMass, leanMass }
}

// ─── 7-day moving average ────────────────────────────────────────────────────

export function smoothWeightTrend(logs: BiometricLog[]): Array<{ date: string; smoothed: number | null }> {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((log, i) => {
    const start = Math.max(0, i - 6)
    const window = sorted.slice(start, i + 1).filter(l => l.weight_kg != null)
    if (window.length === 0) return { date: log.date, smoothed: null }
    const avg = window.reduce((s, l) => s + l.weight_kg!, 0) / window.length
    return { date: log.date, smoothed: +avg.toFixed(2) }
  })
}

// ─── Weekly Rate ─────────────────────────────────────────────────────────────

export interface WeeklyRateResult {
  kgPerWeek: number
  pctPerWeek: number
  flag: boolean
  direction: 'loss' | 'gain' | 'stable'
}

export function calculateWeeklyRate(logs: BiometricLog[]): WeeklyRateResult | null {
  const withWeight = logs.filter(l => l.weight_kg != null).sort((a, b) => a.date.localeCompare(b.date))
  if (withWeight.length < 2) return null
  const first = withWeight[0]
  const last = withWeight[withWeight.length - 1]
  const days = (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000
  if (days < 1) return null
  const totalChange = last.weight_kg! - first.weight_kg!
  const kgPerWeek = +(totalChange / (days / 7)).toFixed(2)
  const pctPerWeek = +(kgPerWeek / first.weight_kg! * 100).toFixed(2)
  const flag = Math.abs(pctPerWeek) > 1
  const direction = kgPerWeek < -0.05 ? 'loss' : kgPerWeek > 0.05 ? 'gain' : 'stable'
  return { kgPerWeek, pctPerWeek, flag, direction }
}

// ─── Ideal Weight Formulas ───────────────────────────────────────────────────

export const IDEAL_WEIGHT_FORMULAS = {
  robinson: (height_cm: number, sex: 'male' | 'female') => {
    const inches = height_cm / 2.54
    const over5ft = Math.max(0, inches - 60)
    return sex === 'male' ? 52 + 1.9 * over5ft : 49 + 1.7 * over5ft
  },
  miller: (height_cm: number, sex: 'male' | 'female') => {
    const inches = height_cm / 2.54
    const over5ft = Math.max(0, inches - 60)
    return sex === 'male' ? 56.2 + 1.41 * over5ft : 53.1 + 1.36 * over5ft
  },
  devine: (height_cm: number, sex: 'male' | 'female') => {
    const inches = height_cm / 2.54
    const over5ft = Math.max(0, inches - 60)
    return sex === 'male' ? 50 + 2.3 * over5ft : 45.5 + 2.3 * over5ft
  },
  hamwi: (height_cm: number, sex: 'male' | 'female') => {
    const inches = height_cm / 2.54
    const over5ft = Math.max(0, inches - 60)
    return sex === 'male' ? 48 + 2.7 * over5ft : 45.4 + 2.27 * over5ft
  },
}

export interface IdealWeightRange {
  min: number
  max: number
  formulas: Record<string, number>
}

export function getIdealWeightRange(height_cm: number, sex: 'male' | 'female'): IdealWeightRange {
  const formulas: Record<string, number> = {
    Robinson: +IDEAL_WEIGHT_FORMULAS.robinson(height_cm, sex).toFixed(1),
    Miller: +IDEAL_WEIGHT_FORMULAS.miller(height_cm, sex).toFixed(1),
    Devine: +IDEAL_WEIGHT_FORMULAS.devine(height_cm, sex).toFixed(1),
    Hamwi: +IDEAL_WEIGHT_FORMULAS.hamwi(height_cm, sex).toFixed(1),
  }
  const values = Object.values(formulas)
  return { min: +Math.min(...values).toFixed(1), max: +Math.max(...values).toFixed(1), formulas }
}

// ─── Waist Risk (NHLBI + IDF Asian thresholds) ───────────────────────────────

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high'

export function waistRisk(
  waist_cm: number,
  sex: 'male' | 'female',
  ethnicity: 'european' | 'asian' | 'other' = 'european'
): { risk: RiskLevel; label: string; threshold: number } {
  const thresholds = ethnicity === 'asian'
    ? { male: { moderate: 80, high: 90 }, female: { moderate: 75, high: 80 } }
    : { male: { moderate: 94, high: 102 }, female: { moderate: 80, high: 88 } }

  const t = thresholds[sex]
  if (waist_cm < t.moderate) return { risk: 'low', label: 'Low risk', threshold: t.moderate }
  if (waist_cm < t.high) return { risk: 'moderate', label: 'Moderate risk', threshold: t.high }
  return { risk: 'high', label: 'High risk', threshold: t.high }
}

// ─── WHR Risk (WHO) ──────────────────────────────────────────────────────────

export function whrRisk(
  waist_cm: number,
  hip_cm: number,
  sex: 'male' | 'female'
): { ratio: number; risk: RiskLevel; label: string } {
  const ratio = +(waist_cm / hip_cm).toFixed(3)
  const limits = sex === 'male'
    ? { moderate: 0.90, high: 0.95, very_high: 1.0 }
    : { moderate: 0.80, high: 0.85, very_high: 0.90 }

  let risk: RiskLevel
  let label: string
  if (ratio < limits.moderate) { risk = 'low'; label = 'Low risk' }
  else if (ratio < limits.high) { risk = 'moderate'; label = 'Moderate risk' }
  else if (ratio < limits.very_high) { risk = 'high'; label = 'High risk' }
  else { risk = 'very_high'; label = 'Very high risk' }

  return { ratio, risk, label }
}

// ─── WHtR Risk (Browning 2010) ───────────────────────────────────────────────

export function whtRisk(
  waist_cm: number,
  height_cm: number
): { ratio: number; risk: RiskLevel; label: string } {
  const ratio = +(waist_cm / height_cm).toFixed(3)
  if (ratio < 0.5) return { ratio, risk: 'low', label: 'Healthy' }
  if (ratio < 0.6) return { ratio, risk: 'moderate', label: 'Increased risk' }
  return { ratio, risk: 'high', label: 'High risk' }
}

// ─── Goal Projection ─────────────────────────────────────────────────────────

export interface Milestone {
  label: string
  targetWeight: number
  weeks: number
  date: string
}

export interface ProjectionResult {
  weeksToGoal: number
  targetDate: string
  feasible: boolean
  milestones: Milestone[]
}

export function projectWeightGoal(
  currentWeight: number,
  targetWeight: number,
  weeklyRateKg: number
): ProjectionResult {
  const totalChange = targetWeight - currentWeight
  const absRate = Math.abs(weeklyRateKg)
  if (absRate < 0.01) {
    const far = new Date()
    far.setFullYear(far.getFullYear() + 10)
    return { weeksToGoal: 9999, targetDate: far.toISOString().split('T')[0], feasible: false, milestones: [] }
  }

  const weeksToGoal = Math.ceil(Math.abs(totalChange) / absRate)
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + weeksToGoal * 7)

  // Generate milestones every 5% of goal progress
  const milestones: Milestone[] = []
  const step = Math.abs(totalChange) * 0.05
  for (let pct = 25; pct <= 100; pct += 25) {
    const progressKg = (Math.abs(totalChange) * pct) / 100
    const weeks = Math.ceil(progressKg / absRate)
    const date = new Date()
    date.setDate(date.getDate() + weeks * 7)
    const mWeight = totalChange < 0 ? currentWeight - progressKg : currentWeight + progressKg
    milestones.push({
      label: `${pct}% to goal`,
      targetWeight: +mWeight.toFixed(1),
      weeks,
      date: date.toISOString().split('T')[0],
    })
  }

  const feasible = absRate <= 1.0 // Garthe 2011: >1 kg/wk risks lean mass loss
  return { weeksToGoal, targetDate: targetDate.toISOString().split('T')[0], feasible, milestones }
}

// ─── ACE Body Fat Classification ─────────────────────────────────────────────

export function bodyFatCategory(
  bodyFatPct: number,
  sex: 'male' | 'female',
  age: number
): { category: string; color: string } {
  // ACE norms simplified (not age-stratified for brevity, using general adult ranges)
  const ranges = sex === 'male'
    ? [
        { max: 5, category: 'Essential fat', color: '#a78bfa' },
        { max: 13, category: 'Athletic', color: '#4ade80' },
        { max: 17, category: 'Fitness', color: '#86efac' },
        { max: 24, category: 'Average', color: '#facc15' },
        { max: Infinity, category: 'Obese', color: '#f87171' },
      ]
    : [
        { max: 13, category: 'Essential fat', color: '#a78bfa' },
        { max: 20, category: 'Athletic', color: '#4ade80' },
        { max: 24, category: 'Fitness', color: '#86efac' },
        { max: 31, category: 'Average', color: '#facc15' },
        { max: Infinity, category: 'Obese', color: '#f87171' },
      ]

  const match = ranges.find(r => bodyFatPct <= r.max)!
  return { category: match.category, color: match.color }
}

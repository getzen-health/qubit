export interface BodyMeasurement {
  date: string
  weight_kg?: number
  height_cm?: number
  waist_cm?: number
  hips_cm?: number
  chest_cm?: number
  neck_cm?: number
  left_arm_cm?: number
  right_arm_cm?: number
  left_thigh_cm?: number
  right_thigh_cm?: number
  left_calf_cm?: number
  right_calf_cm?: number
}

export interface BodyRatios {
  bmi?: number
  whr?: number     // waist-to-hip ratio
  whtr?: number    // waist-to-height ratio
  bmi_category: string
  whr_risk: 'Low' | 'Moderate' | 'High' | 'Unknown'
  whtr_risk: 'Low' | 'Moderate' | 'High' | 'Unknown'
  waist_risk: 'Normal' | 'Increased' | 'Substantially Increased' | 'Unknown'
}

/**
 * BMI category per WHO classification.
 */
export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  if (bmi < 35) return 'Obese I'
  if (bmi < 40) return 'Obese II'
  return 'Obese III'
}

/**
 * Waist-to-hip ratio risk — Snijder et al. (Int J Obes 2006).
 * Men >1.0 = high risk; Women >0.85 = high risk.
 * Moderate: Men 0.90–1.0; Women 0.80–0.85.
 */
export function whrRisk(whr: number, sex: 'male' | 'female'): BodyRatios['whr_risk'] {
  if (sex === 'male') {
    if (whr > 1.0) return 'High'
    if (whr > 0.9) return 'Moderate'
    return 'Low'
  }
  // female
  if (whr > 0.85) return 'High'
  if (whr > 0.8) return 'Moderate'
  return 'Low'
}

/**
 * Waist circumference risk per WHO (2008).
 * Men: >94 cm = Increased, >102 cm = Substantially Increased.
 * Women: >80 cm = Increased, >88 cm = Substantially Increased.
 */
export function waistRisk(waist_cm: number, sex: 'male' | 'female'): BodyRatios['waist_risk'] {
  const [inc, subInc] = sex === 'male' ? [94, 102] : [80, 88]
  if (waist_cm > subInc) return 'Substantially Increased'
  if (waist_cm > inc) return 'Increased'
  return 'Normal'
}

/**
 * WHtR risk — Lean et al. (Lancet 1995) universal threshold 0.5.
 * 0.5–0.6 = moderate risk; >0.6 = high risk.
 */
export function whtrRisk(whtr: number): BodyRatios['whtr_risk'] {
  if (whtr >= 0.6) return 'High'
  if (whtr >= 0.5) return 'Moderate'
  return 'Low'
}

/**
 * Compute all ratios and risk categories from a single measurement entry.
 */
export function calculateRatios(
  measurement: BodyMeasurement,
  sex: 'male' | 'female'
): BodyRatios {
  const { weight_kg, height_cm, waist_cm, hips_cm } = measurement

  let bmi: number | undefined
  if (weight_kg && height_cm && height_cm > 0) {
    const h = height_cm / 100
    bmi = Math.round((weight_kg / (h * h)) * 10) / 10
  }

  let whr: number | undefined
  if (waist_cm && hips_cm && hips_cm > 0) {
    whr = Math.round((waist_cm / hips_cm) * 1000) / 1000
  }

  let whtr: number | undefined
  if (waist_cm && height_cm && height_cm > 0) {
    whtr = Math.round((waist_cm / height_cm) * 1000) / 1000
  }

  return {
    bmi,
    whr,
    whtr,
    bmi_category: bmi ? bmiCategory(bmi) : 'Unknown',
    whr_risk: whr ? whrRisk(whr, sex) : 'Unknown',
    whtr_risk: whtr ? whtrRisk(whtr) : 'Unknown',
    waist_risk: waist_cm ? waistRisk(waist_cm, sex) : 'Unknown',
  }
}

type MeasurementKey = keyof Omit<BodyMeasurement, 'date'>

/**
 * Progress summary: numeric change from earliest to most recent entry.
 */
export function getProgressSummary(
  measurements: BodyMeasurement[]
): { change: Partial<BodyMeasurement>; trend: string } {
  if (measurements.length < 2) {
    return { change: {}, trend: 'Not enough data' }
  }

  const sorted = [...measurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  const numericKeys: MeasurementKey[] = [
    'weight_kg', 'waist_cm', 'hips_cm', 'chest_cm', 'neck_cm',
    'left_arm_cm', 'right_arm_cm', 'left_thigh_cm', 'right_thigh_cm',
    'left_calf_cm', 'right_calf_cm',
  ]

  const change: Partial<BodyMeasurement> = {}
  const parts: string[] = []

  for (const key of numericKeys) {
    const fv = first[key] as number | undefined
    const lv = last[key] as number | undefined
    if (fv != null && lv != null) {
      const delta = Math.round((lv - fv) * 10) / 10
      ;(change as Record<string, number>)[key] = delta
      if (key === 'waist_cm' || key === 'weight_kg') {
        const sign = delta > 0 ? '+' : ''
        const label = key === 'weight_kg' ? 'weight' : 'waist'
        const unit = key === 'weight_kg' ? 'kg' : 'cm'
        parts.push(`${sign}${delta}${unit} ${label}`)
      }
    }
  }

  const trend = parts.length > 0 ? parts.join(', ') : 'No changes recorded'
  return { change, trend }
}

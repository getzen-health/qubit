/**
 * Hydration Science Library
 *
 * Research basis:
 * - Cheuvront & Kenefick 2014 — dehydration >2% BW impairs performance
 * - Casa et al. 2000 — Armstrong 1-8 urine color scale
 * - Montain & Coyle 1992 — sweat rate formula
 * - Shirreffs 2003 — electrolyte replacement guidelines
 * - IOM 2004 — adequate intake reference values
 * - Noakes 2012 — hyponatremia risk in endurance athletes
 * - Maughan 2016 — Beverage Hydration Index
 */

export interface HydrationLog {
  id?: string
  user_id?: string
  date: string
  // Fluid intake
  water_ml: number
  beverages: BeverageEntry[]
  // Urine
  urine_color: number // 1–8 Armstrong scale
  urine_frequency: number // times/day
  // Sweat rate test (optional)
  pre_exercise_weight_kg?: number
  post_exercise_weight_kg?: number
  exercise_fluid_ml?: number
  exercise_duration_min?: number
  // Electrolytes
  sodium_mg: number
  potassium_mg: number
  magnesium_mg: number
  electrolyte_drink: boolean
  // Context
  exercise_minutes: number
  exercise_intensity: 'none' | 'light' | 'moderate' | 'vigorous'
  ambient_temp_f: number
  altitude_ft: number
  is_pregnant: boolean
  is_breastfeeding: boolean
  weight_kg?: number
  caffeine_drinks: number
  created_at?: string
}

export interface BeverageEntry {
  type: string
  volume_ml: number
  bhi: number // Beverage Hydration Index
}

export interface HydrationAnalysis {
  totalFluidMl: number
  effectiveHydrationMl: number // BHI-adjusted
  goalMl: number
  percentOfGoal: number
  hydrationStatus: 'optimal' | 'adequate' | 'mild_dehydration' | 'dehydration' | 'severe_dehydration'
  urineColorStatus: string
  sweatRateMlPerHour?: number
  electrolytesAdequate: boolean
  hyponatremiaRisk: boolean
  recommendations: string[]
  deficit: number // ml remaining to goal
}

// Armstrong 1994 urine color scale
export const URINE_COLORS = [
  { level: 1, label: 'Pale Straw',   status: 'Optimal',                  color: '#f7f3a0', textColor: '#666' },
  { level: 2, label: 'Straw',        status: 'Optimal',                  color: '#f0e060', textColor: '#555' },
  { level: 3, label: 'Yellow',       status: 'Adequate',                 color: '#e8c832', textColor: '#444' },
  { level: 4, label: 'Dark Yellow',  status: 'Mildly Dehydrated',        color: '#d4a800', textColor: '#333' },
  { level: 5, label: 'Amber',        status: 'Dehydrated',               color: '#c08000', textColor: '#fff' },
  { level: 6, label: 'Honey',        status: 'Significantly Dehydrated', color: '#a05800', textColor: '#fff' },
  { level: 7, label: 'Orange',       status: 'Severely Dehydrated',      color: '#c04000', textColor: '#fff' },
  { level: 8, label: 'Brown',        status: 'Seek Medical Help',        color: '#7b2d00', textColor: '#fff' },
]

// Maughan 2016 Beverage Hydration Index relative to water (BHI = 1.0)
export const BEVERAGES_BHI: Record<string, { bhi: number; label: string }> = {
  water:        { bhi: 1.00, label: 'Water' },
  milk:         { bhi: 1.50, label: 'Milk (full fat)' },
  juice:        { bhi: 1.10, label: 'Fruit juice / OJ' },
  sports_drink: { bhi: 1.00, label: 'Sports drink' },
  coffee:       { bhi: 1.00, label: 'Coffee' },
  tea:          { bhi: 1.00, label: 'Tea' },
  diet_soda:    { bhi: 0.98, label: 'Diet soda' },
  beer:         { bhi: 0.83, label: 'Beer' },
}

/**
 * Personalised daily hydration goal (ml)
 * Base: weight_kg × 35 ml (IOM-based)
 * Activity: +500ml / 30min moderate, +750ml / 30min vigorous
 * Climate: +300ml hot (>85°F), +200ml dry/arid is handled by temperature
 * Caffeine: +150ml per caffeinated drink
 * Altitude: +500ml above 8000ft
 * Pregnancy: +300ml; Breastfeeding: +700ml
 */
export function calculateHydrationGoal(params: {
  weight_kg: number
  exercise_min: number
  intensity: 'none' | 'light' | 'moderate' | 'vigorous'
  temp_f: number
  altitude_ft: number
  caffeine_drinks: number
  pregnant?: boolean
  breastfeeding?: boolean
}): number {
  const { weight_kg, exercise_min, intensity, temp_f, altitude_ft, caffeine_drinks, pregnant, breastfeeding } = params

  let goal = weight_kg * 35

  // Activity adjustment per 30 min
  if (exercise_min > 0 && intensity !== 'none') {
    const blocks = exercise_min / 30
    if (intensity === 'moderate') goal += blocks * 500
    else if (intensity === 'vigorous') goal += blocks * 750
    else goal += blocks * 250 // light
  }

  // Climate
  if (temp_f > 85) goal += 300

  // Caffeine (mild diuretic, +150ml per drink)
  goal += caffeine_drinks * 150

  // Altitude above 8000ft / 2400m
  if (altitude_ft > 8000) goal += 500

  // Life stage
  if (pregnant) goal += 300
  if (breastfeeding) goal += 700

  // IOM rounds to nearest 50ml; floor at 1500ml
  return Math.max(1500, Math.round(goal / 50) * 50)
}

/**
 * Sweat rate (ml/hour) — Montain & Coyle 1992
 * = ((pre_kg - post_kg) × 1000 + fluid_consumed_ml) / duration_hours
 */
export function calculateSweatRate(log: HydrationLog): number | null {
  const { pre_exercise_weight_kg, post_exercise_weight_kg, exercise_fluid_ml, exercise_duration_min } = log
  if (
    pre_exercise_weight_kg == null ||
    post_exercise_weight_kg == null ||
    exercise_duration_min == null ||
    exercise_duration_min <= 0
  ) return null

  const fluidMl = exercise_fluid_ml ?? 0
  const durationHours = exercise_duration_min / 60
  return ((pre_exercise_weight_kg - post_exercise_weight_kg) * 1000 + fluidMl) / durationHours
}

/** Classify urine color status */
function urineColorStatus(level: number): string {
  if (level <= 2) return 'Optimal'
  if (level === 3) return 'Adequate'
  if (level === 4) return 'Mildly Dehydrated'
  if (level === 5) return 'Dehydrated'
  if (level === 6) return 'Significantly Dehydrated'
  if (level === 7) return 'Severely Dehydrated'
  return 'Seek Medical Help'
}

/**
 * Full hydration analysis for a single log entry
 */
export function analyzeHydration(log: HydrationLog): HydrationAnalysis {
  const recommendations: string[] = []

  // Total fluid (water + BHI-weighted beverages)
  const bevTotal = (log.beverages ?? []).reduce((sum, b) => sum + b.volume_ml, 0)
  const totalFluidMl = log.water_ml + bevTotal
  const effectiveHydrationMl = log.water_ml +
    (log.beverages ?? []).reduce((sum, b) => sum + b.volume_ml * b.bhi, 0)

  const goalMl = calculateHydrationGoal({
    weight_kg: log.weight_kg ?? 70,
    exercise_min: log.exercise_minutes,
    intensity: log.exercise_intensity,
    temp_f: log.ambient_temp_f,
    altitude_ft: log.altitude_ft,
    caffeine_drinks: log.caffeine_drinks,
    pregnant: log.is_pregnant,
    breastfeeding: log.is_breastfeeding,
  })

  const percentOfGoal = Math.round((effectiveHydrationMl / goalMl) * 100)
  const deficit = Math.max(0, goalMl - effectiveHydrationMl)

  // Hydration status — correlate fluid %  with urine color
  let hydrationStatus: HydrationAnalysis['hydrationStatus']
  if (percentOfGoal >= 100 && log.urine_color <= 3) {
    hydrationStatus = 'optimal'
  } else if (percentOfGoal >= 80 || log.urine_color <= 3) {
    hydrationStatus = 'adequate'
  } else if (log.urine_color <= 5) {
    hydrationStatus = 'mild_dehydration'
  } else if (log.urine_color <= 6) {
    hydrationStatus = 'dehydration'
  } else {
    hydrationStatus = 'severe_dehydration'
  }

  // Sweat rate
  const sweatRateMlPerHour = calculateSweatRate(log) ?? undefined

  // Electrolytes adequacy — Shirreffs 2003
  // After exercise >60min recommend sodium 20-50mmol/L (460-1150mg/L)
  const electrolytesAdequate = log.exercise_minutes > 60
    ? log.electrolyte_drink || log.sodium_mg >= 500
    : true

  // Noakes 2012 hyponatremia risk
  // Risk: water intake >1L/hr + exercise >4h + no electrolytes
  const waterLPerHour = log.exercise_duration_min
    ? log.water_ml / (log.exercise_duration_min / 60) / 1000
    : 0
  const hyponatremiaRisk =
    waterLPerHour > 1 &&
    (log.exercise_duration_min ?? 0) > 240 &&
    !log.electrolyte_drink &&
    log.sodium_mg < 500

  // Recommendations
  if (deficit > 0) {
    recommendations.push(`Drink ~${Math.round(deficit / 100) * 100}ml more today to reach your goal.`)
  }
  if (log.urine_color >= 4) {
    recommendations.push('Urine color suggests dehydration — increase water intake promptly.')
  }
  if (log.urine_color >= 7) {
    recommendations.push('⚠️ Dark urine — drink water now and consider seeking medical advice.')
  }
  if (!electrolytesAdequate) {
    recommendations.push('After prolonged exercise, replenish sodium (500–2300mg) and potassium.')
  }
  if (hyponatremiaRisk) {
    recommendations.push('⚠️ Hyponatremia risk: you are drinking large volumes of plain water during extended exercise — add electrolytes.')
  }
  if (log.caffeine_drinks > 0) {
    recommendations.push(`Caffeine from ${log.caffeine_drinks} drink(s) increases fluid needs by ~${log.caffeine_drinks * 150}ml.`)
  }
  if (log.altitude_ft > 8000) {
    recommendations.push('High altitude increases water loss through respiration — extra 500ml added to goal.')
  }
  if (hydrationStatus === 'optimal') {
    recommendations.push('Great job — you\'re well hydrated today! 🎉')
  }

  return {
    totalFluidMl,
    effectiveHydrationMl,
    goalMl,
    percentOfGoal,
    hydrationStatus,
    urineColorStatus: urineColorStatus(log.urine_color),
    sweatRateMlPerHour,
    electrolytesAdequate,
    hyponatremiaRisk,
    recommendations,
    deficit,
  }
}

/**
 * Alcohol Health Library — research-backed calculations for GetZen
 *
 * Sources:
 *  - NIAAA 2023 low-risk drinking guidelines
 *  - AUDIT-C screening tool (Bush et al. 1998)
 *  - Colrain et al. 2014 — sleep/alcohol review
 *  - Bjarnason et al. 1984 — gut tight-junction disruption
 *  - IARC Monograph Vol. 100E — alcohol as Group 1 carcinogen
 */

// ─── Standard drink definitions ───────────────────────────────────────────────

/** One US standard drink = 14 g pure alcohol */
export const STANDARD_DRINK_GRAMS = 14

export interface DrinkSpec {
  type: 'beer' | 'wine' | 'spirits' | 'other'
  oz: number
  abv: number // 0–100
}

/**
 * Calculate US standard drinks from a serving.
 * Formula: (oz × abv% × 0.01 × 29.574 mL/oz × 0.789 g/mL) / 14
 */
export function calcStandardDrinks(oz: number, abv: number): number {
  const mlPerOz = 29.574
  const ethanolDensity = 0.789
  const grams = oz * (abv / 100) * mlPerOz * ethanolDensity
  return Math.round((grams / STANDARD_DRINK_GRAMS) * 100) / 100
}

/** Canonical one-standard-drink examples */
export const STANDARD_DRINK_EXAMPLES = [
  { label: 'Regular beer (12 oz, 5% ABV)', oz: 12, abv: 5, standardDrinks: 1 },
  { label: 'Table wine (5 oz, 12% ABV)', oz: 5, abv: 12, standardDrinks: 1 },
  { label: 'Distilled spirits (1.5 oz, 40% ABV)', oz: 1.5, abv: 40, standardDrinks: 1 },
] as const

// ─── NIAAA 2023 low-risk limits ───────────────────────────────────────────────

export const NIAAA_LIMITS = {
  male: { dailyMax: 4, weeklyMax: 14 },
  female: { dailyMax: 3, weeklyMax: 7 },
} as const

export type BiologicalSex = 'male' | 'female'

export interface NIAAAStatus {
  withinDailyLimit: boolean
  withinWeeklyLimit: boolean
  withinBothLimits: boolean
  dailyDrinks: number
  weeklyDrinks: number
  dailyLimit: number
  weeklyLimit: number
}

export function checkNIAAALimits(
  dailyDrinks: number,
  weeklyDrinks: number,
  sex: BiologicalSex
): NIAAAStatus {
  const limits = NIAAA_LIMITS[sex]
  return {
    withinDailyLimit: dailyDrinks <= limits.dailyMax,
    withinWeeklyLimit: weeklyDrinks <= limits.weeklyMax,
    withinBothLimits: dailyDrinks <= limits.dailyMax && weeklyDrinks <= limits.weeklyMax,
    dailyDrinks,
    weeklyDrinks,
    dailyLimit: limits.dailyMax,
    weeklyLimit: limits.weeklyMax,
  }
}

// ─── AUDIT-C Screener ─────────────────────────────────────────────────────────

/**
 * AUDIT-C: 3-question subset of the 10-question AUDIT.
 * Each answer is scored 0–4; total range 0–12.
 * Positive screen: men ≥ 4, women ≥ 3 (Bush et al. 1998).
 */
export interface AuditCAnswers {
  /** Q1 — How often did you have a drink? (0=Never … 4=4+/week) */
  frequency: 0 | 1 | 2 | 3 | 4
  /** Q2 — How many drinks on a typical drinking day? (0=1–2 … 4=10+) */
  typicalQuantity: 0 | 1 | 2 | 3 | 4
  /** Q3 — How often did you have 6+ drinks on one occasion? (0=Never … 4=Daily/Almost daily) */
  heavyEpisode: 0 | 1 | 2 | 3 | 4
}

export const AUDIT_C_Q1_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Monthly or less' },
  { value: 2, label: '2–4 times/month' },
  { value: 3, label: '2–3 times/week' },
  { value: 4, label: '4+ times/week' },
] as const

export const AUDIT_C_Q2_OPTIONS = [
  { value: 0, label: '1–2 drinks' },
  { value: 1, label: '3–4 drinks' },
  { value: 2, label: '5–6 drinks' },
  { value: 3, label: '7–9 drinks' },
  { value: 4, label: '10+ drinks' },
] as const

export const AUDIT_C_Q3_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Less than monthly' },
  { value: 2, label: 'Monthly' },
  { value: 3, label: 'Weekly' },
  { value: 4, label: 'Daily or almost daily' },
] as const

export interface AuditCResult {
  score: number
  positiveScreen: boolean
  interpretation: string
  color: 'green' | 'yellow' | 'orange' | 'red'
}

export function scoreAuditC(answers: AuditCAnswers, sex: BiologicalSex): AuditCResult {
  const score = answers.frequency + answers.typicalQuantity + answers.heavyEpisode
  const threshold = sex === 'male' ? 4 : 3
  const positiveScreen = score >= threshold

  let interpretation: string
  let color: AuditCResult['color']

  if (score === 0) {
    interpretation = 'No alcohol use detected'
    color = 'green'
  } else if (score < threshold) {
    interpretation = 'Below positive screen threshold — low-risk pattern'
    color = 'green'
  } else if (score <= 7) {
    interpretation = 'Positive screen — hazardous use likely; consider counseling'
    color = 'yellow'
  } else if (score <= 10) {
    interpretation = 'High-risk use — likely alcohol use disorder; professional evaluation recommended'
    color = 'orange'
  } else {
    interpretation = 'Very high-risk — strongly recommend clinical evaluation'
    color = 'red'
  }

  return { score, positiveScreen, interpretation, color }
}

// ─── Liver Health Proxy Score ─────────────────────────────────────────────────

export interface LiverHealthInputs {
  weeklyStandardDrinks: number
  drinkFreeDaysPerWeek: number // 0–7
  eatsFoodWithDrinks: boolean
  hydrationScore: number // 0–100
  yearsOfCurrentPattern: number
  sex: BiologicalSex
}

/**
 * Composite liver health proxy (0–100, higher = healthier).
 * Not a clinical diagnostic — educational estimate only.
 */
export function calcLiverHealthScore(inputs: LiverHealthInputs): number {
  const weeklyLimit = NIAAA_LIMITS[inputs.sex].weeklyMax

  let score = 100

  // Weekly drinks penalty (proportional overage)
  if (inputs.weeklyStandardDrinks > 0) {
    const ratio = inputs.weeklyStandardDrinks / weeklyLimit
    if (ratio <= 1) {
      score -= ratio * 15 // up to -15 at the limit
    } else {
      score -= 15 + Math.min(35, (ratio - 1) * 20) // -15 to -50 over limit
    }
  }

  // Drink-free days reward/penalty
  if (inputs.drinkFreeDaysPerWeek >= 5) score += 10
  else if (inputs.drinkFreeDaysPerWeek >= 3) score += 5
  else if (inputs.drinkFreeDaysPerWeek <= 1) score -= 10

  // Food pairing mitigates some gastric and absorption effects
  if (inputs.eatsFoodWithDrinks) score += 5

  // Hydration supports liver detox pathways
  const hydrationBonus = (inputs.hydrationScore / 100) * 8
  score += hydrationBonus - 4 // net +4 at perfect, -4 at zero

  // Chronic exposure penalty (long-duration patterns are harder to reverse)
  if (inputs.yearsOfCurrentPattern > 10) score -= 10
  else if (inputs.yearsOfCurrentPattern > 5) score -= 5

  return Math.min(100, Math.max(0, Math.round(score)))
}

export function liverScoreLabel(score: number): { label: string; color: string; emoji: string } {
  if (score >= 80) return { label: 'Excellent', color: 'emerald', emoji: '💚' }
  if (score >= 65) return { label: 'Good', color: 'green', emoji: '🟢' }
  if (score >= 50) return { label: 'Fair', color: 'yellow', emoji: '🟡' }
  if (score >= 35) return { label: 'At Risk', color: 'orange', emoji: '🟠' }
  return { label: 'Concerning', color: 'red', emoji: '🔴' }
}

// ─── Sleep Impact ─────────────────────────────────────────────────────────────

/**
 * Estimates REM disruption (% reduction) based on drinks within 3h of bedtime.
 * Colrain et al. 2014 — alcohol and sleep: a review.
 * ~10% REM reduction per standard drink in the 3h window (first half of night).
 */
export function estimateREMDisruption(drinksWithin3hOfBed: number): {
  remReductionPercent: number
  firstHalfSleepEffect: string
  secondHalfEffect: string
  overallNote: string
} {
  const remReductionPercent = Math.min(60, Math.round(drinksWithin3hOfBed * 10))
  return {
    remReductionPercent,
    firstHalfSleepEffect:
      drinksWithin3hOfBed > 0
        ? 'Increased slow-wave sleep, faster sleep onset'
        : 'Normal sleep architecture',
    secondHalfEffect:
      drinksWithin3hOfBed > 0
        ? `REM sleep reduced ~${remReductionPercent}%; more fragmented, vivid dreams`
        : 'Normal REM cycling',
    overallNote:
      drinksWithin3hOfBed === 0
        ? 'No near-bedtime alcohol detected'
        : drinksWithin3hOfBed <= 1
        ? 'Mild disruption — consider finishing drinks 3h before bed'
        : 'Significant disruption — alcohol within 3h materially degrades sleep quality',
  }
}

// ─── Cancer Risk Education ────────────────────────────────────────────────────

export const CANCER_RISK_EDUCATION = {
  classification: 'IARC Group 1 carcinogen (sufficient evidence in humans)',
  cancerTypes: [
    'Mouth, pharynx, larynx',
    'Oesophagus',
    'Colorectum',
    'Liver',
    'Female breast',
  ],
  doseResponseNote:
    'Risk increases linearly with consumption — no threshold has been established where alcohol is safe from a cancer perspective (IARC Monograph Vol. 100E).',
  reductionNote:
    'Risk begins to fall after reducing or stopping alcohol, though the timeline varies by cancer type.',
} as const

// ─── Gut Health Impact ────────────────────────────────────────────────────────

export const GUT_HEALTH_IMPACT = {
  mechanism: 'Tight junction disruption',
  reference: 'Bjarnason et al. 1984 — "Leakiness of the intestine in chronic alcoholism"',
  effects: [
    'Increased intestinal permeability ("leaky gut") at even moderate doses',
    'Disruption of gut microbiome diversity (dysbiosis)',
    'Impaired nutrient absorption (B vitamins, zinc, folate)',
    'Elevated systemic inflammation via endotoxin translocation',
  ],
  recoveryNote:
    'Gut barrier integrity begins recovering within days of abstinence; microbiome diversity improves over 3–4 weeks.',
} as const

// ─── Liver Recovery Timeline ──────────────────────────────────────────────────

export const LIVER_RECOVERY_TIMELINE = [
  {
    period: '1 week',
    milestone: 'Fatty liver (steatosis) starts to reverse',
    detail: 'Hepatic fat accumulation from recent heavy use begins clearing; ALT may start normalising.',
  },
  {
    period: '1 month',
    milestone: 'Liver enzymes (ALT/AST) approach normal range',
    detail: 'For moderate drinkers, inflammatory markers typically normalise; energy and sleep often improve noticeably.',
  },
  {
    period: '3 months',
    milestone: 'Significant regeneration in non-cirrhotic livers',
    detail: 'The liver has substantial regenerative capacity. Blood tests usually reflect near-normal function. Long-term heavy use requires longer recovery.',
  },
] as const

// ─── Lower-Risk Strategies ────────────────────────────────────────────────────

export const LOWER_RISK_STRATEGIES = [
  {
    title: 'Alternate with water',
    detail: 'Drink one glass of water between each alcoholic drink to slow consumption and improve hydration.',
  },
  {
    title: 'Set a time window',
    detail: 'Limit drinking to a defined window (e.g. 6–9 pm) and stop at least 3h before sleep to protect REM.',
  },
  {
    title: 'Always eat when drinking',
    detail: 'Food slows alcohol absorption, lowers peak BAC, and reduces gastric irritation.',
  },
  {
    title: 'Plan drink-free days',
    detail: 'NIAAA recommends aiming for at least 2–3 consecutive drink-free days per week to allow liver recovery.',
  },
  {
    title: 'Track in real time',
    detail: 'Logging each drink as you have it is more accurate than end-of-day recall and increases awareness.',
  },
  {
    title: 'Choose lower-ABV options',
    detail: 'Switching from 8% to 4% beer halves the ethanol load per drink. Session beers and lower-alcohol wines exist in most categories.',
  },
] as const

// ─── Drink-Free Day Streak ────────────────────────────────────────────────────

/**
 * Calculate the current drink-free day streak ending on today's date.
 * `drinkDates` is a Set of ISO date strings (YYYY-MM-DD) on which any drinks were logged.
 */
export function calcDrinkFreeStreak(
  drinkDates: Set<string>,
  todayISO: string
): { streak: number; longestStreak: number; thisWeekFreeDays: number } {
  const today = new Date(todayISO)

  // Current streak — walk backwards from yesterday (today may not be over)
  let streak = 0
  const cursor = new Date(today)
  cursor.setDate(cursor.getDate() - 1)
  while (!drinkDates.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
    if (streak > 365) break // safety cap
  }

  // Longest streak in the available data range
  const allDates = Array.from(drinkDates).sort()
  if (allDates.length === 0) return { streak, longestStreak: streak, thisWeekFreeDays: 7 }

  const rangeStart = new Date(allDates[0])
  const rangeEnd = today
  let longest = 0
  let current = 0
  const c = new Date(rangeStart)
  while (c <= rangeEnd) {
    const iso = c.toISOString().slice(0, 10)
    if (!drinkDates.has(iso)) {
      current++
      if (current > longest) longest = current
    } else {
      current = 0
    }
    c.setDate(c.getDate() + 1)
  }
  longest = Math.max(longest, streak)

  // This week's drink-free days (Mon–Sun)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))
  let thisWeekFreeDays = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    if (d > today) break
    if (!drinkDates.has(d.toISOString().slice(0, 10))) thisWeekFreeDays++
  }

  return { streak, longestStreak: longest, thisWeekFreeDays }
}

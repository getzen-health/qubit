/**
 * Body Battery — Composite Readiness Score
 * Aggregates 8 health sub-scores into a single 0–100 readiness index.
 *
 * Inspired by:
 * - Firstbeat Body Battery algorithm (Garmin) — HRV-based energy reserves
 * - Oura Ring Readiness Score — sleep + activity + temperature + HRV
 * - Whoop Recovery — HRV + RHR + sleep performance + respiratory rate
 * - Pichot 2016: HRV training adaptation markers
 * - Spiegel 1999: sleep debt cortisol & immune suppression
 */

// ─── Sub-score inputs ──────────────────────────────────────────────────────────

export interface BodyBatteryInputs {
  // Sleep (0–100 raw score from sleep optimizer or derived)
  sleepEfficiency?: number        // % of time in bed actually asleep (0–100)
  sleepDurationHours?: number     // last night total
  sleepDebtHours?: number         // cumulative 7-day debt (positive = deficit)
  sleepStageScore?: number        // % of night in restorative stages (deep+REM) x 100

  // HRV & Cardiac
  hrvRmssdMs?: number             // last night average RMSSD in ms
  hrvBaseline7d?: number          // personal 7-day rolling RMSSD baseline
  restingHrBpm?: number           // this morning resting HR
  restingHrBaseline7d?: number    // personal 7-day rolling RHR baseline

  // Training Load (from athletic-performance module)
  atl?: number                    // Acute Training Load (7-day)
  ctl?: number                    // Chronic Training Load (42-day)
  tsb?: number                    // Training Stress Balance (CTL - ATL)

  // Nutrition
  caloricBalancePct?: number      // (consumed / target) * 100 yesterday
  proteinAdequacyPct?: number     // (consumed protein / target) * 100
  hydrationLitres?: number        // yesterday total fluid intake

  // Mental
  phq9Score?: number              // 0–27 PHQ-9 depression screen
  stressLevel?: number            // subjective 1–10
  mindfulnessMinutes?: number     // yesterday mindfulness/meditation

  // Acute symptoms
  sicknessFlag?: boolean          // user reported illness
  alcoholDrinksYesterday?: number

  // Environmental
  uvIndex?: number                // yesterday peak UV
  airQualityAqi?: number          // yesterday AQI
}

// ─── Sub-scores ────────────────────────────────────────────────────────────────

export interface BodyBatterySubScores {
  sleep: number           // 0–25 pts — highest weight (Oura: sleep dominates readiness)
  cardiac: number         // 0–20 pts — HRV + RHR vs baseline
  trainingBalance: number // 0–20 pts — TSB freshness
  nutrition: number       // 0–15 pts — calories + protein + hydration
  mental: number          // 0–10 pts — mood + stress + mindfulness
  recovery: number        // 0–5 pts  — absence of illness, alcohol
  environment: number     // 0–5 pts  — UV, AQI
  total: number           // 0–100
}

export type ReadinessCategory = 'peak' | 'high' | 'moderate' | 'low' | 'rest'
export type TrainingRecommendation = 'hard' | 'moderate' | 'easy' | 'recovery' | 'rest'

export interface BodyBatteryResult {
  score: number                           // 0–100
  category: ReadinessCategory
  label: string
  color: string                           // Tailwind color class
  subScores: BodyBatterySubScores
  trainingRecommendation: TrainingRecommendation
  topInsights: string[]                   // 2–3 actionable sentences
  limitingFactor: string                  // single biggest drag on readiness
}

// ─── Scoring functions ─────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, v))
}

/** Sleep sub-score: 0–25 pts */
function scoreSleep(inputs: BodyBatteryInputs): number {
  let pts = 0

  // Sleep duration: 7–9h = full 10pts (Walker 2017 "Why We Sleep")
  const h = inputs.sleepDurationHours ?? 7
  if (h >= 8) pts += 10
  else if (h >= 7) pts += 8
  else if (h >= 6) pts += 5
  else if (h >= 5) pts += 2
  // else 0

  // Sleep efficiency: >85% = 8pts (Oura threshold)
  const eff = inputs.sleepEfficiency ?? 80
  if (eff >= 90) pts += 8
  else if (eff >= 85) pts += 6
  else if (eff >= 75) pts += 3
  else pts += 1

  // Sleep debt: 0h debt = 7pts; each hour of debt costs 1.5pts
  const debt = inputs.sleepDebtHours ?? 0
  pts += Math.max(0, 7 - debt * 1.5)

  return clamp(pts, 0, 25)
}

/** Cardiac sub-score: 0–20 pts — HRV vs baseline + RHR vs baseline */
function scoreCardiac(inputs: BodyBatteryInputs): number {
  let pts = 10 // start at neutral

  // HRV delta from personal baseline
  if (inputs.hrvRmssdMs !== undefined && inputs.hrvBaseline7d !== undefined && inputs.hrvBaseline7d > 0) {
    const delta = (inputs.hrvRmssdMs - inputs.hrvBaseline7d) / inputs.hrvBaseline7d
    // +10% above baseline = +4pts; -10% = -4pts
    pts += clamp(delta * 40, -8, 8)
  }

  // RHR delta (lower is better on recovery days)
  if (inputs.restingHrBpm !== undefined && inputs.restingHrBaseline7d !== undefined && inputs.restingHrBaseline7d > 0) {
    const delta = (inputs.restingHrBpm - inputs.restingHrBaseline7d) / inputs.restingHrBaseline7d
    // +5bpm above baseline = -2pts
    pts += clamp(-delta * 20, -5, 5)
  }

  return clamp(pts, 0, 20)
}

/** Training balance: 0–20 pts based on TSB (freshness) */
function scoreTrainingBalance(inputs: BodyBatteryInputs): number {
  if (inputs.tsb === undefined) return 12 // neutral when no data

  const tsb = inputs.tsb
  // TSB guide: +5 to +15 = peak race freshness; 0 to +5 = trained; -10 to 0 = building; < -20 = overtrained
  // Adapted for daily readiness: positive TSB = well-rested from training
  if (tsb >= 10) return 20
  if (tsb >= 5) return 17
  if (tsb >= 0) return 14
  if (tsb >= -10) return 10
  if (tsb >= -20) return 6
  return 2  // heavily overtrained
}

/** Nutrition sub-score: 0–15 pts */
function scoreNutrition(inputs: BodyBatteryInputs): number {
  let pts = 0

  // Caloric adequacy: 90–110% of target = full 6pts
  const cal = inputs.caloricBalancePct ?? 100
  if (cal >= 90 && cal <= 115) pts += 6
  else if (cal >= 80 && cal <= 125) pts += 4
  else if (cal >= 70) pts += 2

  // Protein adequacy: >100% = 5pts
  const prot = inputs.proteinAdequacyPct ?? 80
  if (prot >= 100) pts += 5
  else if (prot >= 80) pts += 3
  else if (prot >= 60) pts += 1

  // Hydration: 2L+ = 4pts
  const hydration = inputs.hydrationLitres ?? 1.5
  if (hydration >= 2.5) pts += 4
  else if (hydration >= 2.0) pts += 3
  else if (hydration >= 1.5) pts += 1

  return clamp(pts, 0, 15)
}

/** Mental sub-score: 0–10 pts */
function scoreMental(inputs: BodyBatteryInputs): number {
  let pts = 5 // neutral baseline

  // PHQ-9 depression screen (0=none, 27=severe)
  if (inputs.phq9Score !== undefined) {
    if (inputs.phq9Score <= 4) pts += 3        // minimal
    else if (inputs.phq9Score <= 9) pts += 1   // mild
    else if (inputs.phq9Score <= 14) pts -= 1  // moderate
    else pts -= 3                              // severe
  }

  // Subjective stress 1–10 (lower = better)
  if (inputs.stressLevel !== undefined) {
    pts += clamp((10 - inputs.stressLevel) * 0.3, -2, 2)
  }

  // Mindfulness minutes (dose-response)
  if (inputs.mindfulnessMinutes !== undefined) {
    if (inputs.mindfulnessMinutes >= 20) pts += 2
    else if (inputs.mindfulnessMinutes >= 10) pts += 1
  }

  return clamp(pts, 0, 10)
}

/** Recovery/lifestyle: 0–5 pts */
function scoreRecovery(inputs: BodyBatteryInputs): number {
  let pts = 5

  if (inputs.sicknessFlag) pts -= 4

  const drinks = inputs.alcoholDrinksYesterday ?? 0
  if (drinks > 4) pts -= 3
  else if (drinks > 2) pts -= 2
  else if (drinks > 0) pts -= 1

  return clamp(pts, 0, 5)
}

/** Environment: 0–5 pts */
function scoreEnvironment(inputs: BodyBatteryInputs): number {
  let pts = 5

  const aqi = inputs.airQualityAqi ?? 50
  if (aqi > 150) pts -= 3
  else if (aqi > 100) pts -= 2
  else if (aqi > 50) pts -= 1

  return clamp(pts, 0, 5)
}

// ─── Main calculator ───────────────────────────────────────────────────────────

export function calculateBodyBattery(inputs: BodyBatteryInputs): BodyBatteryResult {
  const sleep = scoreSleep(inputs)
  const cardiac = scoreCardiac(inputs)
  const trainingBalance = scoreTrainingBalance(inputs)
  const nutrition = scoreNutrition(inputs)
  const mental = scoreMental(inputs)
  const recovery = scoreRecovery(inputs)
  const environment = scoreEnvironment(inputs)

  const total = clamp(
    Math.round(sleep + cardiac + trainingBalance + nutrition + mental + recovery + environment),
    0, 100
  )

  const subScores: BodyBatterySubScores = { sleep, cardiac, trainingBalance, nutrition, mental, recovery, environment, total }

  // Category
  let category: ReadinessCategory
  let label: string
  let color: string
  let trainingRecommendation: TrainingRecommendation

  if (total >= 85) {
    category = 'peak'; label = 'Peak'; color = 'text-emerald-400'
    trainingRecommendation = 'hard'
  } else if (total >= 70) {
    category = 'high'; label = 'High'; color = 'text-green-400'
    trainingRecommendation = 'moderate'
  } else if (total >= 50) {
    category = 'moderate'; label = 'Moderate'; color = 'text-yellow-400'
    trainingRecommendation = 'easy'
  } else if (total >= 30) {
    category = 'low'; label = 'Low'; color = 'text-orange-400'
    trainingRecommendation = 'recovery'
  } else {
    category = 'rest'; label = 'Rest'; color = 'text-red-400'
    trainingRecommendation = 'rest'
  }

  // Identify limiting factor
  const factors = [
    { name: 'Sleep quality', score: sleep / 25 },
    { name: 'Heart rate variability', score: cardiac / 20 },
    { name: 'Training freshness', score: trainingBalance / 20 },
    { name: 'Nutrition adequacy', score: nutrition / 15 },
    { name: 'Mental wellbeing', score: mental / 10 },
    { name: 'Recovery lifestyle', score: recovery / 5 },
  ]
  const limitingFactor = factors.sort((a, b) => a.score - b.score)[0].name

  // Insights
  const topInsights: string[] = []

  if (sleep < 15) topInsights.push(`Sleep is your biggest drain today (${inputs.sleepDurationHours?.toFixed(1) ?? '?'}h last night). Aim for 8h to restore body battery.`)
  if (inputs.hrvRmssdMs !== undefined && inputs.hrvBaseline7d !== undefined && inputs.hrvRmssdMs < inputs.hrvBaseline7d * 0.9) {
    topInsights.push(`HRV is ${Math.round(inputs.hrvRmssdMs)}ms — below your ${Math.round(inputs.hrvBaseline7d)}ms baseline. Your nervous system needs recovery.`)
  }
  if (inputs.tsb !== undefined && inputs.tsb < -15) topInsights.push(`Training load is high (TSB ${inputs.tsb.toFixed(0)}). An easy day will accelerate adaptation.`)
  if (total >= 85) topInsights.push(`You are fully charged today. Great day for a hard workout or demanding cognitive work.`)
  if (inputs.alcoholDrinksYesterday && inputs.alcoholDrinksYesterday > 2) topInsights.push(`Alcohol last night suppressed REM sleep by ~25% and raises resting HR.`)
  if (inputs.phq9Score !== undefined && inputs.phq9Score > 9) topInsights.push(`PHQ-9 suggests elevated depressive symptoms. Consider speaking with your healthcare provider.`)

  if (topInsights.length === 0) topInsights.push(`Body battery is at ${total}%. Maintain your current routines.`)

  return { score: total, category, label, color, subScores, trainingRecommendation, topInsights, limitingFactor }
}

// ─── Training recommendation text ─────────────────────────────────────────────

export const TRAINING_RECOMMENDATION_LABELS: Record<TrainingRecommendation, { label: string; description: string; emoji: string }> = {
  hard:     { label: 'Train Hard',    emoji: '🔥', description: 'High-intensity intervals, heavy lifts, or race-effort. Your body is primed for adaptation.' },
  moderate: { label: 'Train Normal',  emoji: '💪', description: 'Tempo runs, moderate weights, skill work. Good day to build fitness.' },
  easy:     { label: 'Train Easy',    emoji: '🚶', description: 'Zone 1–2 aerobic, yoga, mobility. Stimulus without digging deeper into deficit.' },
  recovery: { label: 'Active Recovery', emoji: '🧘', description: '20–30 min walk, stretching, foam rolling. Let the body rebuild.' },
  rest:     { label: 'Rest Day',      emoji: '😴', description: 'Skip structured training. Prioritise sleep, nutrition, and hydration to recharge.' },
}

// ─── 7-day trend analysis ──────────────────────────────────────────────────────

export interface BatteryTrendPoint {
  date: string
  score: number
  category: ReadinessCategory
}

export function analyzeBatteryTrend(points: BatteryTrendPoint[]): {
  direction: 'improving' | 'declining' | 'stable'
  weekAvg: number
  bestDay: BatteryTrendPoint | null
  worstDay: BatteryTrendPoint | null
  message: string
} {
  if (!points.length) return { direction: 'stable', weekAvg: 0, bestDay: null, worstDay: null, message: 'No data yet.' }

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  const scores = sorted.map(p => p.score)
  const weekAvg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

  // Linear trend over last 7 days
  const n = scores.length
  let direction: 'improving' | 'declining' | 'stable' = 'stable'
  if (n >= 3) {
    const firstHalf = scores.slice(0, Math.floor(n / 2))
    const secondHalf = scores.slice(Math.ceil(n / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    if (secondAvg - firstAvg > 5) direction = 'improving'
    else if (firstAvg - secondAvg > 5) direction = 'declining'
  }

  const bestDay = sorted.reduce((a, b) => a.score >= b.score ? a : b)
  const worstDay = sorted.reduce((a, b) => a.score <= b.score ? a : b)

  const message = direction === 'improving'
    ? `Your readiness has been improving this week (avg ${weekAvg}). Keep up the recovery habits.`
    : direction === 'declining'
    ? `Readiness has been declining (avg ${weekAvg}). Prioritise sleep and reduce training load.`
    : `Readiness is stable at ${weekAvg} this week.`

  return { direction, weekAvg, bestDay, worstDay, message }
}

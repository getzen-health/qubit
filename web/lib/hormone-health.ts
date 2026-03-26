// Hormone Health Tracker — science-based proxy scoring
// Sources:
//   Leproult & Van Cauter 2011 (JAMA) — sleep restriction reduces testosterone 10-15%
//   Kumari et al. 2009 — cortisol awakening response (CAR), healthy = 50-100% rise within 30-45min
//   Bhasin et al. 2010 (NEJM) — testosterone, body composition, exercise response
//   Zimmermann 2009 — iodine deficiency most preventable thyroid dysfunction cause
//   Chrousos 2009 — HPA axis, chronic stress, cortisol resistance, metabolic dysregulation

export interface HormoneLog {
  date: string
  // Sleep
  sleep_hours: number
  sleep_quality: number // 1-5
  // Training
  resistance_training_days_week: number // 0-7
  // Nutrition
  zinc_mg: number
  healthy_fat_servings: number // olive oil, avocado, nuts, fish
  vitamin_d_iu: number
  adequate_calories: boolean
  // Stress / HPA
  stress_level: number // 1-10
  // Body
  bmi_estimate: number
  body_fat_estimate: number // percentage
  // Cortisol rhythm
  morning_energy: number // 1-10
  afternoon_crash: number // 0=none, 1=mild, 2=moderate, 3=severe
  evening_alertness_9pm: number // 1-10
  // Thyroid symptoms (each 0-3: 0=none, 1=mild, 2=moderate, 3=severe)
  thyroid_symptoms: Record<string, number>
  iodine_rich_foods_week: number // count of servings (sardines, seaweed, dairy, eggs, iodized salt)
  // Estrogen balance
  fiber_g: number
  cruciferous_servings: number // broccoli, cauliflower, kale, cabbage (DIM pathway)
  alcohol_drinks: number
  // Meta
  notes: string
}

export interface HormoneScore {
  testosterone_index: number // 0-100
  cortisol_rhythm_score: number // 0-100
  thyroid_score: number // 0-100 (higher = better, fewer symptoms)
  estrogen_balance: number // 0-100
  cortisol_pattern: 'healthy' | 'flat' | 'inverted' | 'elevated'
  iodine_risk: boolean
  testosterone_pillars: HormonePillar[]
  cortisol_pillars: HormonePillar[]
  thyroid_pillars: HormonePillar[]
  estrogen_pillars: HormonePillar[]
  recommendations: string[]
}

export interface HormonePillar {
  label: string
  score: number // 0-100
  weight: number // 0-1
  detail: string
}

// ─────────────────────────────────────────────────────────
// Testosterone Vitality Index (0-100) — applies to all genders
// Score = (Sleep_T × 0.25) + (Training_T × 0.20) + (Nutrition_T × 0.20) + (Stress_T × 0.20) + (Body_T × 0.15)
// ─────────────────────────────────────────────────────────
function calcSleepT(hours: number): number {
  if (hours >= 8) return 100
  if (hours >= 7) return 80
  if (hours >= 6) return 55
  return 20
}

function calcTrainingT(days: number): number {
  if (days >= 3) return 100
  if (days === 2) return 70
  if (days === 1) return 40
  return 15
}

function calcNutritionT(log: HormoneLog): number {
  let score = 0
  if (log.zinc_mg >= 8) score += 25
  else score += Math.round((log.zinc_mg / 8) * 25)
  if (log.healthy_fat_servings >= 2) score += 25
  else score += Math.round((log.healthy_fat_servings / 2) * 25)
  if (log.adequate_calories) score += 25
  if (log.vitamin_d_iu >= 600) score += 25
  else score += Math.round((log.vitamin_d_iu / 600) * 25)
  return Math.min(100, score)
}

function calcStressT(stressLevel: number): number {
  return Math.max(0, 100 - stressLevel * 10)
}

function calcBodyT(bmi: number): number {
  if (bmi >= 18.5 && bmi < 25) return 100
  if (bmi >= 25 && bmi < 27) return 80
  if (bmi >= 27 && bmi < 30) return 60
  return 30
}

export function calculateTestosteroneIndex(log: HormoneLog): {
  score: number
  pillars: HormonePillar[]
} {
  const sleepT = calcSleepT(log.sleep_hours)
  const trainingT = calcTrainingT(log.resistance_training_days_week)
  const nutritionT = calcNutritionT(log)
  const stressT = calcStressT(log.stress_level)
  const bodyT = calcBodyT(log.bmi_estimate)

  const score = Math.round(
    sleepT * 0.25 + trainingT * 0.20 + nutritionT * 0.20 + stressT * 0.20 + bodyT * 0.15
  )

  const pillars: HormonePillar[] = [
    {
      label: 'Sleep',
      score: sleepT,
      weight: 0.25,
      detail: `${log.sleep_hours}h sleep — Van Cauter 2011: <6h reduces testosterone up to 15%`,
    },
    {
      label: 'Resistance Training',
      score: trainingT,
      weight: 0.20,
      detail: `${log.resistance_training_days_week} day(s)/week — Bhasin 2010: resistance training optimises androgen receptor sensitivity`,
    },
    {
      label: 'Nutrition',
      score: nutritionT,
      weight: 0.20,
      detail: `Zinc ${log.zinc_mg}mg, Vit D ${log.vitamin_d_iu}IU, healthy fats ${log.healthy_fat_servings} servings`,
    },
    {
      label: 'Stress',
      score: stressT,
      weight: 0.20,
      detail: `Stress level ${log.stress_level}/10 — cortisol opposes testosterone synthesis`,
    },
    {
      label: 'Body Composition',
      score: bodyT,
      weight: 0.15,
      detail: `BMI ${log.bmi_estimate?.toFixed(1)} — adipose tissue aromatises testosterone to estrogen`,
    },
  ]

  return { score: Math.max(0, Math.min(100, score)), pillars }
}

// ─────────────────────────────────────────────────────────
// Cortisol Rhythm Score (0-100)
// Based on CAR (cortisol awakening response) proxies — Kumari et al. 2009
// ─────────────────────────────────────────────────────────
export function calculateCortisolRhythm(log: HormoneLog): {
  score: number
  pattern: 'healthy' | 'flat' | 'inverted' | 'elevated'
  pillars: HormonePillar[]
} {
  const morningProxy = log.morning_energy * 10 // 10-100
  const afternoonPenalty = log.afternoon_crash * 15
  const eveningPenalty = log.evening_alertness_9pm > 6 ? 20 : 0

  const raw = morningProxy - afternoonPenalty - eveningPenalty
  const score = Math.max(0, Math.min(100, raw))

  // Pattern classification
  let pattern: 'healthy' | 'flat' | 'inverted' | 'elevated'
  if (log.morning_energy >= 6 && log.afternoon_crash <= 1 && log.evening_alertness_9pm <= 5) {
    pattern = 'healthy' // high morning, gradual decline, low evening
  } else if (log.morning_energy <= 4 && log.evening_alertness_9pm <= 4) {
    pattern = 'flat' // exhausted / adrenal fatigue proxy
  } else if (log.morning_energy < log.evening_alertness_9pm) {
    pattern = 'inverted' // evening dominant — circadian disruption
  } else {
    pattern = 'elevated' // high morning + poor clearance — chronic stress
  }

  const pillars: HormonePillar[] = [
    {
      label: 'Morning Energy (CAR)',
      score: morningProxy,
      weight: 0.45,
      detail: `${log.morning_energy}/10 morning energy — proxy for cortisol awakening response`,
    },
    {
      label: 'Afternoon Stability',
      score: Math.max(0, 100 - afternoonPenalty * 2.2),
      weight: 0.30,
      detail: `Crash severity ${log.afternoon_crash}/3 — afternoon dip indicates poor cortisol rhythm`,
    },
    {
      label: 'Evening Clearance',
      score: log.evening_alertness_9pm <= 6 ? 100 : 40,
      weight: 0.25,
      detail: `Evening alertness ${log.evening_alertness_9pm}/10 at 9pm — high = poor cortisol clearance`,
    },
  ]

  return { score, pattern, pillars }
}

// ─────────────────────────────────────────────────────────
// Thyroid Health Score (0-100) — lower symptom burden = higher score
// Zimmermann 2009: iodine deficiency is the most preventable cause of thyroid dysfunction
// ─────────────────────────────────────────────────────────
export const THYROID_SYMPTOM_KEYS = [
  'fatigue',
  'cold_sensitivity',
  'weight_gain',
  'hair_loss',
  'dry_skin',
  'constipation',
  'brain_fog',
  'depression',
] as const

export type ThyroidSymptomKey = (typeof THYROID_SYMPTOM_KEYS)[number]

export const THYROID_SYMPTOM_LABELS: Record<ThyroidSymptomKey, string> = {
  fatigue: 'Fatigue',
  cold_sensitivity: 'Cold Sensitivity',
  weight_gain: 'Unexplained Weight Gain',
  hair_loss: 'Hair Loss / Thinning',
  dry_skin: 'Dry Skin',
  constipation: 'Constipation',
  brain_fog: 'Brain Fog',
  depression: 'Low Mood / Depression',
}

export const IODINE_RICH_FOODS = [
  { name: 'Seaweed / Kelp', emoji: '🌿' },
  { name: 'Sardines / Fish', emoji: '🐟' },
  { name: 'Dairy (milk, yogurt)', emoji: '🥛' },
  { name: 'Eggs', emoji: '🥚' },
  { name: 'Iodized Salt', emoji: '🧂' },
]

export function calculateThyroidScore(log: HormoneLog): {
  score: number
  symptomBurden: number
  pillars: HormonePillar[]
} {
  const symptoms = log.thyroid_symptoms ?? {}
  const totalBurden = THYROID_SYMPTOM_KEYS.reduce(
    (sum, key) => sum + (symptoms[key] ?? 0),
    0
  )
  const maxBurden = THYROID_SYMPTOM_KEYS.length * 3 // 8 × 3 = 24
  const score = Math.round(100 - (totalBurden / maxBurden) * 100)

  const pillars: HormonePillar[] = [
    {
      label: 'Symptom Burden',
      score: Math.max(0, 100 - (totalBurden / maxBurden) * 100),
      weight: 0.70,
      detail: `Total burden ${totalBurden}/24 across 8 hypothyroid symptoms`,
    },
    {
      label: 'Iodine Intake',
      score: log.iodine_rich_foods_week >= 3 ? 100 : Math.round((log.iodine_rich_foods_week / 3) * 100),
      weight: 0.30,
      detail: `${log.iodine_rich_foods_week} iodine-rich servings/week — Zimmermann 2009: ≥3/week reduces deficiency risk`,
    },
  ]

  return { score: Math.max(0, Math.min(100, score)), symptomBurden: totalBurden, pillars }
}

// ─────────────────────────────────────────────────────────
// Estrogen Balance Score (0-100) — relevant all genders
// Chrousos 2009: chronic stress → HPA–HPG axis cross-talk, excess estrogen
// ─────────────────────────────────────────────────────────
export function calculateEstrogenBalance(log: HormoneLog): {
  score: number
  pillars: HormonePillar[]
} {
  // Penalties
  const stressPenalty = log.stress_level >= 8 ? 20 : log.stress_level >= 6 ? 12 : log.stress_level >= 4 ? 5 : 0
  const bodyFatPenalty = log.body_fat_estimate > 30 ? 20 : log.body_fat_estimate > 25 ? 10 : 0
  const alcoholPenalty = log.alcohol_drinks >= 3 ? 20 : log.alcohol_drinks >= 1 ? log.alcohol_drinks * 5 : 0

  // Bonuses
  const fiberBonus = log.fiber_g >= 25 ? 15 : Math.round((log.fiber_g / 25) * 15)
  const crucBon = log.cruciferous_servings >= 2 ? 10 : log.cruciferous_servings * 5

  const raw = 70 - stressPenalty - bodyFatPenalty - alcoholPenalty + fiberBonus + crucBon
  const score = Math.max(0, Math.min(100, raw))

  const pillars: HormonePillar[] = [
    {
      label: 'Stress Load',
      score: Math.max(0, 100 - stressPenalty * 4),
      weight: 0.25,
      detail: `Stress ${log.stress_level}/10 — high cortisol drives aromatase activity`,
    },
    {
      label: 'Body Fat',
      score: bodyFatPenalty === 0 ? 100 : bodyFatPenalty === 10 ? 60 : 30,
      weight: 0.20,
      detail: `~${log.body_fat_estimate}% body fat — adipose tissue produces estrogen via aromatase`,
    },
    {
      label: 'Alcohol',
      score: Math.max(0, 100 - alcoholPenalty * 4),
      weight: 0.20,
      detail: `${log.alcohol_drinks} drinks — alcohol impairs hepatic estrogen metabolism`,
    },
    {
      label: 'Fiber Intake',
      score: fiberBonus > 0 ? Math.min(100, (fiberBonus / 15) * 100) : 0,
      weight: 0.20,
      detail: `${log.fiber_g}g fiber — aids estrogen clearance via gut-liver axis`,
    },
    {
      label: 'Cruciferous Veg (DIM)',
      score: crucBon > 0 ? Math.min(100, (crucBon / 10) * 100) : 0,
      weight: 0.15,
      detail: `${log.cruciferous_servings} servings — DIM from broccoli/cauliflower supports estrogen metabolism`,
    },
  ]

  return { score, pillars }
}

// ─────────────────────────────────────────────────────────
// Master scorer
// ─────────────────────────────────────────────────────────
export function calculateHormoneScores(log: HormoneLog): HormoneScore {
  const { score: testosterone_index, pillars: testosterone_pillars } = calculateTestosteroneIndex(log)
  const { score: cortisol_rhythm_score, pattern: cortisol_pattern, pillars: cortisol_pillars } = calculateCortisolRhythm(log)
  const { score: thyroid_score, pillars: thyroid_pillars } = calculateThyroidScore(log)
  const { score: estrogen_balance, pillars: estrogen_pillars } = calculateEstrogenBalance(log)

  const iodine_risk = (log.iodine_rich_foods_week ?? 0) < 3

  const recommendations = buildRecommendations(log, {
    testosterone_index,
    cortisol_rhythm_score,
    thyroid_score,
    estrogen_balance,
    cortisol_pattern,
    iodine_risk,
  })

  return {
    testosterone_index,
    cortisol_rhythm_score,
    thyroid_score,
    estrogen_balance,
    cortisol_pattern,
    iodine_risk,
    testosterone_pillars,
    cortisol_pillars,
    thyroid_pillars,
    estrogen_pillars,
    recommendations,
  }
}

function buildRecommendations(
  log: HormoneLog,
  scores: {
    testosterone_index: number
    cortisol_rhythm_score: number
    thyroid_score: number
    estrogen_balance: number
    cortisol_pattern: string
    iodine_risk: boolean
  }
): string[] {
  const tips: string[] = []

  // Testosterone
  if (scores.testosterone_index < 60) {
    if (log.sleep_hours < 7)
      tips.push('Prioritise 7-9h sleep — Van Cauter 2011 shows each hour below 7h reduces testosterone by ~4%')
    if (log.resistance_training_days_week < 2)
      tips.push('Add 2-3 resistance training sessions/week — Bhasin 2010 confirms acute testosterone release with compound lifts')
    if (log.zinc_mg < 8)
      tips.push('Increase zinc intake (oysters, pumpkin seeds, beef) — zinc is a co-factor for LH-stimulated testosterone synthesis')
    if (log.stress_level >= 7)
      tips.push('Reduce chronic stress — sustained cortisol suppresses GnRH pulsatility and downstream testosterone production')
  }

  // Cortisol rhythm
  if (scores.cortisol_rhythm_score < 60 || scores.cortisol_pattern !== 'healthy') {
    if (scores.cortisol_pattern === 'flat')
      tips.push('Flat cortisol pattern detected — try bright light exposure within 30 min of waking to stimulate the cortisol awakening response (CAR)')
    if (scores.cortisol_pattern === 'inverted')
      tips.push('Inverted cortisol pattern — avoid screens and bright lights after 9pm; high evening alertness indicates disrupted circadian cortisol rhythm')
    if (scores.cortisol_pattern === 'elevated')
      tips.push('Elevated cortisol pattern — incorporate NSDR (non-sleep deep rest) or 10-min breathwork after lunch to lower afternoon cortisol')
    if (log.afternoon_crash >= 2)
      tips.push('Severe afternoon crash: stabilise blood sugar with a protein + fat snack at 3pm; consider adaptogenic herbs (ashwagandha KSM-66)')
  }

  // Thyroid
  if (scores.thyroid_score < 70) {
    if (scores.iodine_risk)
      tips.push('Low iodine intake (<3 servings/week) — add seaweed, sardines, or iodized salt; Zimmermann 2009 confirms iodine as most preventable thyroid dysfunction cause')
    const symptoms = log.thyroid_symptoms ?? {}
    const highBurden = THYROID_SYMPTOM_KEYS.filter((k) => (symptoms[k] ?? 0) >= 2)
    if (highBurden.length >= 3)
      tips.push('Multiple moderate-severe thyroid symptoms — consider requesting TSH, free T4, free T3, and TPO antibody panel from your clinician')
    if ((symptoms.brain_fog ?? 0) >= 2 || (symptoms.fatigue ?? 0) >= 2)
      tips.push('Brain fog + fatigue may indicate subclinical hypothyroidism — selenium (200mcg) supports T4→T3 conversion alongside adequate iodine')
  }

  // Estrogen balance
  if (scores.estrogen_balance < 60) {
    if (log.alcohol_drinks >= 2)
      tips.push('Reduce alcohol — even 2 drinks/day impairs hepatic P450 enzymes responsible for estrogen clearance')
    if (log.fiber_g < 20)
      tips.push('Increase dietary fiber to ≥25g/day — beta-glucuronidase inhibition from fiber reduces reabsorption of conjugated estrogen in the gut')
    if (log.cruciferous_servings < 1)
      tips.push('Add 1-2 servings cruciferous vegetables daily — DIM (diindolylmethane) from broccoli shifts estrogen towards safer 2-OH metabolites')
    if (log.body_fat_estimate > 25)
      tips.push('Reducing body fat to <25% lowers aromatase activity in adipose tissue, reducing peripheral estrogen conversion')
  }

  return tips.slice(0, 6)
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
export function scoreToGrade(score: number): string {
  if (score >= 85) return 'Optimal'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  if (score >= 30) return 'Low'
  return 'Critical'
}

export function scoreToColor(score: number): string {
  if (score >= 85) return '#22c55e'
  if (score >= 70) return '#84cc16'
  if (score >= 50) return '#eab308'
  if (score >= 30) return '#f97316'
  return '#ef4444'
}

export const CORTISOL_PATTERN_LABELS: Record<HormoneScore['cortisol_pattern'], string> = {
  healthy: 'Healthy Rhythm',
  flat: 'Flat (HPA Exhaustion)',
  inverted: 'Inverted (Evening Dominant)',
  elevated: 'Elevated (Chronic Stress)',
}

export const CORTISOL_PATTERN_DESCRIPTIONS: Record<HormoneScore['cortisol_pattern'], string> = {
  healthy: 'High morning cortisol for alertness, gradual decline through the day, low evening levels — supports good sleep.',
  flat: 'Consistently low cortisol across the day. Associated with HPA exhaustion, chronic fatigue, and poor stress resilience.',
  inverted: 'Low morning, high evening cortisol. Indicates circadian disruption — often from late-night light exposure or shift work.',
  elevated: 'Persistently high cortisol. Chrousos 2009: chronic stress drives cortisol resistance, metabolic dysregulation, and immune suppression.',
}

export function emptyHormoneLog(date: string): HormoneLog {
  return {
    date,
    sleep_hours: 7,
    sleep_quality: 3,
    resistance_training_days_week: 0,
    zinc_mg: 0,
    healthy_fat_servings: 0,
    vitamin_d_iu: 0,
    adequate_calories: true,
    stress_level: 5,
    bmi_estimate: 22,
    body_fat_estimate: 20,
    morning_energy: 5,
    afternoon_crash: 0,
    evening_alertness_9pm: 5,
    thyroid_symptoms: {},
    iodine_rich_foods_week: 0,
    fiber_g: 0,
    cruciferous_servings: 0,
    alcohol_drinks: 0,
    notes: '',
  }
}

// Functional Fitness & Aging Biomarkers
// Research basis:
//   Studenski et al. 2011 (JAMA) — gait speed predicts survival
//   Leong et al. 2015 (Lancet, n=140,000) — grip strength & CVD mortality
//   Bohannon 2006 — 30-sec chair stand norms
//   Rikli & Jones — senior fitness test norms
//   Cooper et al. 2014 (BMJ) — grip strength & cardiovascular mortality
//   Taekema et al. 2010 — EWGSOP2 clinical weakness cutoffs

export type Sex = 'male' | 'female'
export type TestGrade = 'Poor' | 'Fair' | 'Good' | 'Excellent'
export type GaitRisk = 'Very High' | 'High' | 'Moderate' | 'Low' | 'Very Low'

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface FunctionalFitnessTest {
  id?: string
  user_id?: string
  date: string
  age: number
  sex: Sex
  height_cm?: number
  weight_kg?: number

  // Grip strength (kg)
  grip_strength_kg?: number

  // Gait speed — computed from distance/time or entered directly
  gait_speed_mps?: number
  gait_distance_m?: number
  gait_time_sec?: number

  // 30-second chair stand
  chair_stand_reps?: number

  // Single-leg balance (seconds held)
  balance_eyes_open_sec?: number
  balance_eyes_closed_sec?: number

  // 6-minute walk test (meters walked)
  walk_6min_meters?: number

  notes?: string
  created_at?: string
}

export interface TestResult {
  value: number
  grade: TestGrade
  percentile: number
  label: string
  description: string
  color: string
}

export interface FunctionalFitnessAnalysis {
  // Individual test results
  gripStrength?: TestResult
  gaitSpeed?: TestResult & { risk: GaitRisk; mortalityNote: string }
  chairStand?: TestResult
  balanceEyesOpen?: TestResult
  balanceEyesClosed?: TestResult
  walkTest?: TestResult & { predictedMeters?: number; percentOfPredicted?: number }

  // Composite
  compositeScore: number        // 0–100
  compositePercentile: number   // 0–100
  functionalAge: number         // years
  ageAdjustment: number         // negative = younger, positive = older

  weakestTest: string
  recommendations: string[]
  citations: string[]
}

// ─── Grip Strength Norms (EWGSOP2 + Leong 2015) ──────────────────────────────

interface GripNorm { poor: number; fair: number; good: number; excellent: number }

const GRIP_NORMS: Record<Sex, Record<string, GripNorm>> = {
  male: {
    '20-29': { poor: 40, fair: 50, good: 60, excellent: Infinity },
    '30-39': { poor: 38, fair: 48, good: 58, excellent: Infinity },
    '40-49': { poor: 36, fair: 46, good: 56, excellent: Infinity },
    '50-59': { poor: 32, fair: 42, good: 52, excellent: Infinity },
    '60+':   { poor: 26, fair: 36, good: 46, excellent: Infinity },
  },
  female: {
    '20-29': { poor: 22, fair: 32, good: 42, excellent: Infinity },
    '30-39': { poor: 20, fair: 30, good: 40, excellent: Infinity },
    '40-49': { poor: 18, fair: 28, good: 38, excellent: Infinity },
    '50-59': { poor: 16, fair: 26, good: 36, excellent: Infinity },
    '60+':   { poor: 16, fair: 24, good: 32, excellent: Infinity },
  },
}

function getGripAgeKey(age: number): string {
  if (age < 30) return '20-29'
  if (age < 40) return '30-39'
  if (age < 50) return '40-49'
  if (age < 60) return '50-59'
  return '60+'
}

export function analyzeGripStrength(kg: number, age: number, sex: Sex): TestResult {
  const norm = GRIP_NORMS[sex][getGripAgeKey(age)]

  let grade: TestGrade
  let percentile: number

  if (kg < norm.poor) {
    grade = 'Poor'
    percentile = Math.round(Math.max(1, (kg / norm.poor) * 20))
  } else if (kg < norm.fair) {
    grade = 'Fair'
    percentile = Math.round(20 + ((kg - norm.poor) / (norm.fair - norm.poor)) * 20)
  } else if (kg < norm.good) {
    grade = 'Good'
    percentile = Math.round(40 + ((kg - norm.fair) / (norm.good - norm.fair)) * 30)
  } else {
    grade = 'Excellent'
    percentile = Math.round(Math.min(99, 70 + ((kg - norm.good) / (norm.good * 0.3)) * 29))
  }

  const clinicalCutoff = sex === 'male' ? 26 : 18
  const isWeak = kg < clinicalCutoff

  return {
    value: kg,
    grade,
    percentile,
    label: `${kg} kg`,
    description: isWeak
      ? `Below EWGSOP2 clinical weakness threshold (${clinicalCutoff} kg). Elevated CVD mortality risk (Leong 2015).`
      : `Grip strength is ${grade.toLowerCase()}. Each 5 kg increase reduces CVD mortality ~17% (Leong 2015).`,
    color: GRADE_COLORS[grade],
  }
}

// ─── Gait Speed Norms (Studenski 2011 JAMA) ──────────────────────────────────

export function analyzeGaitSpeed(mps: number): TestResult & { risk: GaitRisk; mortalityNote: string } {
  let grade: TestGrade
  let percentile: number
  let risk: GaitRisk
  let mortalityNote: string

  if (mps < 0.6) {
    grade = 'Poor'; risk = 'Very High'; percentile = 5
    mortalityNote = 'Studenski 2011: <0.6 m/s strongly predicts mortality within 1 year'
  } else if (mps < 0.8) {
    grade = 'Poor'; risk = 'High'; percentile = 15
    mortalityNote = 'Studenski 2011: 0.6–0.8 m/s indicates elevated fall and mortality risk'
  } else if (mps < 1.0) {
    grade = 'Fair'; risk = 'Moderate'; percentile = 35
    mortalityNote = 'Studenski 2011: Moderate speed — room for improvement to reach low-risk zone'
  } else if (mps < 1.2) {
    grade = 'Good'; risk = 'Low'; percentile = 65
    mortalityNote = 'Studenski 2011: ≥1.0 m/s is associated with lower mortality risk'
  } else {
    grade = 'Excellent'; risk = 'Very Low'; percentile = 90
    mortalityNote = 'Studenski 2011: ≥1.2 m/s optimal — lowest mortality risk category'
  }

  return {
    value: mps,
    grade,
    percentile,
    risk,
    mortalityNote,
    label: `${mps.toFixed(2)} m/s`,
    description: `${risk} risk. ${mortalityNote}`,
    color: GRADE_COLORS[grade],
  }
}

// ─── 30-sec Chair Stand Norms (Rikli & Jones) ────────────────────────────────

interface ChairNorm { poor: number; avg: number }

const CHAIR_NORMS: Record<Sex, Record<string, ChairNorm>> = {
  male: {
    '<60':   { poor: 18, avg: 22 },
    '60-64': { poor: 14, avg: 19 },
    '65-69': { poor: 12, avg: 18 },
    '70-74': { poor: 12, avg: 17 },
    '75-79': { poor: 11, avg: 15 },
    '80+':   { poor: 10, avg: 14 },
  },
  female: {
    '<60':   { poor: 14, avg: 18 },
    '60-64': { poor: 12, avg: 17 },
    '65-69': { poor: 11, avg: 16 },
    '70-74': { poor: 10, avg: 15 },
    '75-79': { poor: 10, avg: 14 },
    '80+':   { poor: 8,  avg: 12 },
  },
}

function getChairAgeKey(age: number): string {
  if (age < 60) return '<60'
  if (age < 65) return '60-64'
  if (age < 70) return '65-69'
  if (age < 75) return '70-74'
  if (age < 80) return '75-79'
  return '80+'
}

export function analyzeChairStand(reps: number, age: number, sex: Sex): TestResult {
  const norm = CHAIR_NORMS[sex][getChairAgeKey(age)]
  const excellent = norm.avg + Math.round((norm.avg - norm.poor) * 0.5)

  let grade: TestGrade
  let percentile: number

  if (reps < norm.poor) {
    grade = 'Poor'
    percentile = Math.round(Math.max(1, (reps / norm.poor) * 20))
  } else if (reps < norm.avg) {
    grade = 'Fair'
    percentile = Math.round(20 + ((reps - norm.poor) / (norm.avg - norm.poor)) * 20)
  } else if (reps < excellent) {
    grade = 'Good'
    percentile = Math.round(40 + ((reps - norm.avg) / (excellent - norm.avg)) * 30)
  } else {
    grade = 'Excellent'
    percentile = Math.min(99, Math.round(70 + ((reps - excellent) / excellent) * 29))
  }

  return {
    value: reps,
    grade,
    percentile,
    label: `${reps} reps`,
    description: reps < 10
      ? 'Below 10 reps: elevated fall risk (Bohannon 2006). Focus on leg strength & power.'
      : `${grade} lower-body power. Average for your age/sex is ${norm.avg} reps.`,
    color: GRADE_COLORS[grade],
  }
}

// ─── Single-Leg Balance Norms (ACSM) ─────────────────────────────────────────

export function analyzeBalanceEyesOpen(sec: number, age: number): TestResult {
  const threshold = age < 45 ? 30 : age < 65 ? 20 : 10
  const excellent = age < 45 ? 60 : age < 65 ? 45 : 30

  let grade: TestGrade
  let percentile: number

  if (sec < threshold * 0.5) {
    grade = 'Poor'; percentile = 10
  } else if (sec < threshold) {
    grade = 'Fair'; percentile = 30
  } else if (sec < excellent) {
    grade = 'Good'; percentile = 65
  } else {
    grade = 'Excellent'; percentile = 90
  }

  return {
    value: sec,
    grade,
    percentile,
    label: `${sec}s`,
    description: `Eyes-open balance. Target for your age: >${threshold}s good, >${excellent}s excellent (ACSM).`,
    color: GRADE_COLORS[grade],
  }
}

export function analyzeBalanceEyesClosed(sec: number, age: number): TestResult {
  const threshold = age < 45 ? 25 : age < 65 ? 10 : 4
  const excellent = age < 45 ? 45 : age < 65 ? 25 : 12

  let grade: TestGrade
  let percentile: number

  if (sec < threshold * 0.4) {
    grade = 'Poor'; percentile = 10
  } else if (sec < threshold) {
    grade = 'Fair'; percentile = 30
  } else if (sec < excellent) {
    grade = 'Good'; percentile = 65
  } else {
    grade = 'Excellent'; percentile = 90
  }

  return {
    value: sec,
    grade,
    percentile,
    label: `${sec}s`,
    description: `Eyes-closed balance tests vestibular/proprioceptive function. Target: >${threshold}s (ACSM).`,
    color: GRADE_COLORS[grade],
  }
}

// ─── 6-Minute Walk Test (Enright 2003) ───────────────────────────────────────

export function predicted6MinWalk(age: number, sex: Sex, heightCm: number, weightKg: number): number {
  if (sex === 'male') {
    return (7.57 * heightCm) - (5.02 * age) - (1.76 * weightKg) - 309
  }
  return (2.11 * heightCm) - (2.29 * weightKg) - (5.78 * age) + 667
}

export function analyzeWalkTest(
  meters: number,
  age: number,
  sex: Sex,
  heightCm?: number,
  weightKg?: number,
): TestResult & { predictedMeters?: number; percentOfPredicted?: number } {
  let predictedMeters: number | undefined
  let percentOfPredicted: number | undefined

  if (heightCm && weightKg) {
    predictedMeters = Math.round(predicted6MinWalk(age, sex, heightCm, weightKg))
    percentOfPredicted = Math.round((meters / predictedMeters) * 100)
  }

  // General thresholds (meters)
  const poor = sex === 'male' ? 400 : 350
  const fair = sex === 'male' ? 500 : 450
  const good = sex === 'male' ? 600 : 550

  let grade: TestGrade
  let percentile: number

  if (meters < poor) {
    grade = 'Poor'; percentile = 15
  } else if (meters < fair) {
    grade = 'Fair'; percentile = 35
  } else if (meters < good) {
    grade = 'Good'; percentile = 65
  } else {
    grade = 'Excellent'; percentile = 88
  }

  // Override percentile if predicted available
  if (percentOfPredicted !== undefined) {
    if (percentOfPredicted < 70) percentile = 15
    else if (percentOfPredicted < 85) percentile = 35
    else if (percentOfPredicted < 100) percentile = 60
    else if (percentOfPredicted < 120) percentile = 80
    else percentile = 92
  }

  return {
    value: meters,
    grade,
    percentile,
    predictedMeters,
    percentOfPredicted,
    label: `${meters} m`,
    description: predictedMeters
      ? `${percentOfPredicted}% of your predicted distance (${predictedMeters} m) based on Enright 2003.`
      : `${grade} aerobic capacity. Reference: 400–600 m typical for healthy adults.`,
    color: GRADE_COLORS[grade],
  }
}

// ─── Composite Score & Functional Age ────────────────────────────────────────

const WEIGHTS = {
  gripStrength: 0.25,
  gaitSpeed: 0.25,
  chairStand: 0.20,
  balance: 0.15,
  walkTest: 0.15,
}

export function computeComposite(percentiles: {
  gripStrength?: number
  gaitSpeed?: number
  chairStand?: number
  balance?: number    // avg of eyes-open + eyes-closed if both available
  walkTest?: number
}): number {
  let weightedSum = 0
  let totalWeight = 0

  if (percentiles.gripStrength !== undefined) { weightedSum += percentiles.gripStrength * WEIGHTS.gripStrength; totalWeight += WEIGHTS.gripStrength }
  if (percentiles.gaitSpeed !== undefined) { weightedSum += percentiles.gaitSpeed * WEIGHTS.gaitSpeed; totalWeight += WEIGHTS.gaitSpeed }
  if (percentiles.chairStand !== undefined) { weightedSum += percentiles.chairStand * WEIGHTS.chairStand; totalWeight += WEIGHTS.chairStand }
  if (percentiles.balance !== undefined) { weightedSum += percentiles.balance * WEIGHTS.balance; totalWeight += WEIGHTS.balance }
  if (percentiles.walkTest !== undefined) { weightedSum += percentiles.walkTest * WEIGHTS.walkTest; totalWeight += WEIGHTS.walkTest }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
}

export function functionalAgeAdjustment(compositePercentile: number): number {
  if (compositePercentile >= 80) return -5
  if (compositePercentile >= 60) return -2
  if (compositePercentile >= 40) return 0
  if (compositePercentile >= 20) return 3
  return 6
}

// ─── Full Analysis ────────────────────────────────────────────────────────────

export function analyzeFunctionalFitness(test: FunctionalFitnessTest): FunctionalFitnessAnalysis {
  const results: Partial<FunctionalFitnessAnalysis> = {}
  const percentiles: Parameters<typeof computeComposite>[0] = {}
  const weaknesses: Array<{ name: string; percentile: number }> = []

  // Grip strength
  if (test.grip_strength_kg !== undefined) {
    results.gripStrength = analyzeGripStrength(test.grip_strength_kg, test.age, test.sex)
    percentiles.gripStrength = results.gripStrength.percentile
    weaknesses.push({ name: 'Grip Strength', percentile: results.gripStrength.percentile })
  }

  // Gait speed
  let gaitMps = test.gait_speed_mps
  if (!gaitMps && test.gait_distance_m && test.gait_time_sec && test.gait_time_sec > 0) {
    gaitMps = test.gait_distance_m / test.gait_time_sec
  }
  if (gaitMps !== undefined) {
    results.gaitSpeed = analyzeGaitSpeed(gaitMps)
    percentiles.gaitSpeed = results.gaitSpeed.percentile
    weaknesses.push({ name: 'Gait Speed', percentile: results.gaitSpeed.percentile })
  }

  // Chair stand
  if (test.chair_stand_reps !== undefined) {
    results.chairStand = analyzeChairStand(test.chair_stand_reps, test.age, test.sex)
    percentiles.chairStand = results.chairStand.percentile
    weaknesses.push({ name: 'Chair Stand', percentile: results.chairStand.percentile })
  }

  // Balance
  let balancePctSum = 0; let balancePctCount = 0
  if (test.balance_eyes_open_sec !== undefined) {
    results.balanceEyesOpen = analyzeBalanceEyesOpen(test.balance_eyes_open_sec, test.age)
    balancePctSum += results.balanceEyesOpen.percentile; balancePctCount++
  }
  if (test.balance_eyes_closed_sec !== undefined) {
    results.balanceEyesClosed = analyzeBalanceEyesClosed(test.balance_eyes_closed_sec, test.age)
    balancePctSum += results.balanceEyesClosed.percentile; balancePctCount++
  }
  if (balancePctCount > 0) {
    percentiles.balance = Math.round(balancePctSum / balancePctCount)
    weaknesses.push({ name: 'Balance', percentile: percentiles.balance })
  }

  // 6-min walk
  if (test.walk_6min_meters !== undefined) {
    results.walkTest = analyzeWalkTest(test.walk_6min_meters, test.age, test.sex, test.height_cm, test.weight_kg)
    percentiles.walkTest = results.walkTest.percentile
    weaknesses.push({ name: '6-Min Walk', percentile: results.walkTest.percentile })
  }

  // Composite
  const compositeScore = computeComposite(percentiles)
  const ageAdjustment = functionalAgeAdjustment(compositeScore)
  const functionalAge = test.age + ageAdjustment

  // Weakest test
  weaknesses.sort((a, b) => a.percentile - b.percentile)
  const weakestTest = weaknesses[0]?.name ?? 'N/A'

  // Recommendations
  const recommendations = buildRecommendations(weaknesses, test)

  return {
    ...results,
    compositeScore,
    compositePercentile: compositeScore,
    functionalAge,
    ageAdjustment,
    weakestTest,
    recommendations,
    citations: CITATIONS,
  }
}

function buildRecommendations(
  weaknesses: Array<{ name: string; percentile: number }>,
  test: FunctionalFitnessTest,
): string[] {
  const recs: string[] = []
  for (const w of weaknesses.slice(0, 3)) {
    if (w.percentile < 40) {
      switch (w.name) {
        case 'Grip Strength':
          recs.push('Grip: Farmer carries, dead hangs, and wrist curls 3×/week. Each 5 kg gain reduces CVD risk ~17%.')
          break
        case 'Gait Speed':
          recs.push('Gait: Brisk walking 30 min/day, step-ups, and incline treadmill to improve speed and stability.')
          break
        case 'Chair Stand':
          recs.push('Chair Stand: Goblet squats, step-ups, leg press, and seated-to-stand practice for lower-body power.')
          break
        case 'Balance':
          recs.push('Balance: Single-leg stance practice, heel-to-toe walking, yoga, and tai chi 3× per week.')
          break
        case '6-Min Walk':
          recs.push('Aerobic capacity: Zone 2 cardio 3–4×/week (brisk walk, cycling) to improve 6-min walk distance.')
          break
      }
    }
  }
  if (recs.length === 0) recs.push('Maintain your current level with consistent exercise. Consider progressive overload for further improvement.')
  return recs
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

export const GRADE_COLORS: Record<TestGrade, string> = {
  Poor: '#ef4444',
  Fair: '#f97316',
  Good: '#22c55e',
  Excellent: '#8b5cf6',
}

export const GRADE_BG: Record<TestGrade, string> = {
  Poor: 'bg-red-500/10 text-red-500 border-red-500/20',
  Fair: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Good: 'bg-green-500/10 text-green-500 border-green-500/20',
  Excellent: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
}

export const RISK_COLORS: Record<GaitRisk, string> = {
  'Very High': '#dc2626',
  'High': '#ea580c',
  'Moderate': '#ca8a04',
  'Low': '#16a34a',
  'Very Low': '#7c3aed',
}

// ─── Citations ────────────────────────────────────────────────────────────────

const CITATIONS = [
  'Studenski S, et al. Gait speed and survival in older adults. JAMA. 2011;305(1):50-58.',
  'Leong DP, et al. Prognostic value of grip strength: findings from the Prospective Urban Rural Epidemiology (PURE) study. Lancet. 2015;386(9990):266-273.',
  'Bohannon RW. Reference values for the five-repetition sit-to-stand test: a descriptive meta-analysis. Percept Mot Skills. 2006;103(1):215-222.',
  'Rikli RE, Jones CJ. Senior Fitness Test Manual. 2nd ed. Human Kinetics; 2013.',
  'Cooper R, et al. Grip strength in mid-life and mortality: evidence from the British Regional Heart Study. Int J Epidemiol. 2014.',
  'Cruz-Jentoft AJ, et al. Sarcopenia: revised European consensus on definition and diagnosis (EWGSOP2). Age Ageing. 2019;48(1):16-31.',
  'Enright PL, et al. The 6-min walk test: a quick measure of functional status in elderly adults. Chest. 2003;123(2):387-392.',
  'American College of Sports Medicine. ACSM\'s Guidelines for Exercise Testing and Prescription. 11th ed.',
]

// Longevity and fitness age calculation utilities
// See: Kokkinos et al. 2010, Leong et al. 2015, Brito et al. 2012, Araujo et al. 2022, Nes et al. 2013

// VO2 max norms by age/sex (ACSM 2021 guidelines)
export interface VO2MaxNorm { poor: number; fair: number; good: number; excellent: number; superior: number }
export const VO2_MAX_NORMS: Record<string, Record<string, VO2MaxNorm>> = {
  male: {
    '20-29': { poor: 25, fair: 34, good: 42, excellent: 52, superior: 60 },
    '30-39': { poor: 23, fair: 32, good: 40, excellent: 49, superior: 57 },
    '40-49': { poor: 20, fair: 29, good: 36, excellent: 45, superior: 53 },
    '50-59': { poor: 18, fair: 25, good: 32, excellent: 40, superior: 47 },
    '60-69': { poor: 16, fair: 22, good: 29, excellent: 36, superior: 43 },
  },
  female: {
    '20-29': { poor: 20, fair: 28, good: 36, excellent: 45, superior: 53 },
    '30-39': { poor: 18, fair: 26, good: 33, excellent: 41, superior: 49 },
    '40-49': { poor: 16, fair: 23, good: 30, excellent: 38, superior: 46 },
    '50-59': { poor: 14, fair: 20, good: 27, excellent: 34, superior: 42 },
    '60-69': { poor: 12, fair: 18, good: 24, excellent: 31, superior: 38 },
  },
}

export function getAgeGroup(age: number): string {
  if (age < 30) return '20-29'
  if (age < 40) return '30-39'
  if (age < 50) return '40-49'
  if (age < 60) return '50-59'
  return '60-69'
}

// Cooper 12-min run VO2 max estimate
export function cooperVO2Max(distanceMeters: number): number {
  return Math.round((distanceMeters - 504.9) / 44.73 * 10) / 10
}

// Non-exercise VO2 max estimate (Jackson et al. 1990)
export function nonExerciseVO2Max(age: number, sex: 'male' | 'female', bmi: number, exerciseRating: number): number {
  // exerciseRating: 0=none, 1=light, 2=moderate, 3=vigorous, 4=very vigorous
  const base = sex === 'male' ? 56.363 : 44.868
  return Math.round((base + (1.921 * exerciseRating) - (0.381 * age) - (0.754 * bmi) + (sex === 'male' ? 10.987 : 0)) * 10) / 10
}

// Fitness age (HUNT Fitness Study based)
export function calculateFitnessAge(
  age: number, sex: 'male' | 'female',
  vo2max: number, rhr: number,
  weeklyExerciseHours: number, waistCircumferenceCm?: number
): number {
  // Simplified model based on HUNT study coefficients
  let fitnessAge = age

  // VO2 max adjustment
  const ageGroup = getAgeGroup(age)
  const norms = VO2_MAX_NORMS[sex][ageGroup]
  if (vo2max >= norms.superior) fitnessAge -= 12
  else if (vo2max >= norms.excellent) fitnessAge -= 8
  else if (vo2max >= norms.good) fitnessAge -= 4
  else if (vo2max <= norms.poor) fitnessAge += 8
  else if (vo2max <= norms.fair) fitnessAge += 4

  // RHR adjustment
  if (rhr < 50) fitnessAge -= 4
  else if (rhr < 60) fitnessAge -= 2
  else if (rhr > 80) fitnessAge += 4
  else if (rhr > 70) fitnessAge += 2

  // Exercise frequency adjustment
  if (weeklyExerciseHours >= 7) fitnessAge -= 4
  else if (weeklyExerciseHours >= 4) fitnessAge -= 2
  else if (weeklyExerciseHours < 1) fitnessAge += 4

  // Waist circumference
  if (waistCircumferenceCm) {
    const threshold = sex === 'male' ? 94 : 80
    if (waistCircumferenceCm > threshold + 10) fitnessAge += 4
    else if (waistCircumferenceCm > threshold) fitnessAge += 2
  }

  return Math.max(18, Math.round(fitnessAge))
}

// Longevity score 0-100 (composite)
export interface LongevityInputs {
  vo2max?: number; vo2maxAge?: number; vo2maxSex?: 'male' | 'female'
  restingHR?: number
  sleepHoursAvg?: number
  dailyStepsAvg?: number
  bmi?: number
  hrv?: number
  canBalanceOneLeg10s?: boolean
  srtScore?: number // 0-10 sitting-rising test
}

export function calculateLongevityScore(inputs: LongevityInputs): { score: number; breakdown: Record<string, number>; grade: string } {
  const breakdown: Record<string, number> = {}

  // VO2 max (30 pts)
  if (inputs.vo2max && inputs.vo2maxAge && inputs.vo2maxSex) {
    const ageGroup = getAgeGroup(inputs.vo2maxAge)
    const norms = VO2_MAX_NORMS[inputs.vo2maxSex][ageGroup]
    if (inputs.vo2max >= norms.superior) breakdown.vo2max = 30
    else if (inputs.vo2max >= norms.excellent) breakdown.vo2max = 24
    else if (inputs.vo2max >= norms.good) breakdown.vo2max = 18
    else if (inputs.vo2max >= norms.fair) breakdown.vo2max = 10
    else breakdown.vo2max = 4
  }

  // Resting HR (15 pts)
  if (inputs.restingHR) {
    if (inputs.restingHR < 50) breakdown.rhr = 15
    else if (inputs.restingHR < 60) breakdown.rhr = 12
    else if (inputs.restingHR < 70) breakdown.rhr = 8
    else if (inputs.restingHR < 80) breakdown.rhr = 5
    else breakdown.rhr = 2
  }

  // Sleep (15 pts)
  if (inputs.sleepHoursAvg) {
    if (inputs.sleepHoursAvg >= 7 && inputs.sleepHoursAvg <= 9) breakdown.sleep = 15
    else if (inputs.sleepHoursAvg >= 6 && inputs.sleepHoursAvg <= 9.5) breakdown.sleep = 10
    else breakdown.sleep = 4
  }

  // Daily steps (15 pts)
  if (inputs.dailyStepsAvg) {
    if (inputs.dailyStepsAvg >= 10000) breakdown.steps = 15
    else if (inputs.dailyStepsAvg >= 7500) breakdown.steps = 11
    else if (inputs.dailyStepsAvg >= 5000) breakdown.steps = 7
    else breakdown.steps = 3
  }

  // BMI (10 pts)
  if (inputs.bmi) {
    if (inputs.bmi >= 18.5 && inputs.bmi < 25) breakdown.bmi = 10
    else if (inputs.bmi < 27) breakdown.bmi = 7
    else if (inputs.bmi < 30) breakdown.bmi = 4
    else breakdown.bmi = 1
  }

  // HRV (10 pts)
  if (inputs.hrv) {
    if (inputs.hrv >= 60) breakdown.hrv = 10
    else if (inputs.hrv >= 40) breakdown.hrv = 7
    else if (inputs.hrv >= 20) breakdown.hrv = 4
    else breakdown.hrv = 2
  }

  // Functional tests (5 pts)
  if (inputs.canBalanceOneLeg10s !== undefined) {
    breakdown.functional = inputs.canBalanceOneLeg10s ? 3 : 0
  }
  if (inputs.srtScore !== undefined) {
    breakdown.functional = (breakdown.functional ?? 0) + Math.round(inputs.srtScore / 10 * 2)
  }

  const score = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0))
  const grade = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Average' : score >= 35 ? 'Below Average' : 'Poor'

  return { score, breakdown, grade }
}

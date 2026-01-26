/**
 * Health Calculations Module
 *
 * Provides health-related calculations using Rust WASM for performance.
 * Includes BMI, BMR, TDEE, macro calculations, and more.
 */

import * as wasm from './wasm-loader'

// Re-export types
export type { MacroBreakdown } from './wasm-loader'

// ============================================
// BODY METRICS
// ============================================

/**
 * Calculate Body Mass Index (BMI)
 * Formula: weight (kg) / height (m)^2
 */
export async function calculateBmi(weightKg: number, heightCm: number): Promise<number> {
  return wasm.calculateBmi(weightKg, heightCm)
}

/**
 * Get BMI category (Underweight, Normal, Overweight, Obese)
 */
export async function getBmiCategory(bmi: number): Promise<string> {
  return wasm.getBmiCategory(bmi)
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * More accurate than Harris-Benedict for modern populations
 */
export async function calculateBmr(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  isMale: boolean
): Promise<number> {
  return wasm.calculateBmr(weightKg, heightCm, ageYears, isMale)
}

/**
 * Calculate Total Daily Energy Expenditure
 *
 * Activity Levels:
 * - 1.2: Sedentary (little to no exercise)
 * - 1.375: Lightly active (light exercise 1-3 days/week)
 * - 1.55: Moderately active (moderate exercise 3-5 days/week)
 * - 1.725: Very active (hard exercise 6-7 days/week)
 * - 1.9: Extra active (very hard exercise, physical job)
 */
export async function calculateTdee(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  isMale: boolean,
  activityLevel: number
): Promise<number> {
  return wasm.calculateTdee(weightKg, heightCm, ageYears, isMale, activityLevel)
}

/**
 * Calculate recommended daily water intake in milliliters
 * Based on 33ml per kg of body weight
 */
export async function recommendedWaterIntake(weightKg: number): Promise<number> {
  return wasm.recommendedWaterIntake(weightKg)
}

// ============================================
// HEART RATE
// ============================================

/**
 * Estimate maximum heart rate based on age
 * Uses Tanaka formula: 208 - (0.7 x age)
 */
export async function estimateMaxHeartRate(ageYears: number): Promise<number> {
  return wasm.estimateMaxHeartRate(ageYears)
}

/**
 * Calculate heart rate training zones
 * Returns array: [Zone1Min, Zone1Max/Zone2Min, Zone2Max/Zone3Min, Zone3Max/Zone4Min, Zone4Max/Zone5Min, Zone5Max]
 *
 * Zone 1 (50-60%): Recovery/Easy
 * Zone 2 (60-70%): Fat burning/Endurance
 * Zone 3 (70-80%): Aerobic/Tempo
 * Zone 4 (80-90%): Threshold/Lactate
 * Zone 5 (90-100%): VO2 Max/Anaerobic
 */
export async function calculateHeartRateZones(maxHr: number): Promise<{
  zone1: { min: number; max: number }
  zone2: { min: number; max: number }
  zone3: { min: number; max: number }
  zone4: { min: number; max: number }
  zone5: { min: number; max: number }
}> {
  const zones = await wasm.heartRateZones(maxHr)
  return {
    zone1: { min: zones[0], max: zones[1] },
    zone2: { min: zones[1], max: zones[2] },
    zone3: { min: zones[2], max: zones[3] },
    zone4: { min: zones[3], max: zones[4] },
    zone5: { min: zones[4], max: zones[5] },
  }
}

// ============================================
// NUTRITION
// ============================================

/**
 * Calculate macro percentages from grams
 * Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
 */
export async function calculateMacroPercentages(
  proteinG: number,
  carbsG: number,
  fatG: number
) {
  return wasm.calculateMacroPercentages(proteinG, carbsG, fatG)
}

/**
 * Calculate total calories from macros
 */
export async function calculateCaloriesFromMacros(
  proteinG: number,
  carbsG: number,
  fatG: number
): Promise<number> {
  return wasm.calculateCaloriesFromMacros(proteinG, carbsG, fatG)
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate email format
 */
export async function validateEmail(email: string): Promise<boolean> {
  return wasm.validateEmail(email)
}

/**
 * Validate barcode format (UPC-A, EAN-13, EAN-8)
 */
export async function validateBarcode(barcode: string): Promise<boolean> {
  return wasm.validateBarcode(barcode)
}

/**
 * Sanitize string input (remove HTML tags, dangerous characters)
 */
export async function sanitizeString(input: string): Promise<string> {
  return wasm.sanitizeString(input)
}

/**
 * Validate UUID format
 */
export async function validateUuid(uuid: string): Promise<boolean> {
  return wasm.validateUuid(uuid)
}

/**
 * Validate date string (YYYY-MM-DD format)
 */
export async function validateDate(date: string): Promise<boolean> {
  return wasm.validateDate(date)
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export interface HealthProfile {
  weightKg: number
  heightCm: number
  ageYears: number
  isMale: boolean
  activityLevel: number
}

export interface HealthMetrics {
  bmi: number
  bmiCategory: string
  bmr: number
  tdee: number
  recommendedWaterMl: number
  maxHeartRate: number
  heartRateZones: {
    zone1: { min: number; max: number }
    zone2: { min: number; max: number }
    zone3: { min: number; max: number }
    zone4: { min: number; max: number }
    zone5: { min: number; max: number }
  }
}

/**
 * Calculate all health metrics from a profile
 */
export async function calculateAllMetrics(profile: HealthProfile): Promise<HealthMetrics> {
  const { weightKg, heightCm, ageYears, isMale, activityLevel } = profile

  const [bmi, bmr, tdee, recommendedWaterMl, maxHeartRate] = await Promise.all([
    calculateBmi(weightKg, heightCm),
    calculateBmr(weightKg, heightCm, ageYears, isMale),
    calculateTdee(weightKg, heightCm, ageYears, isMale, activityLevel),
    recommendedWaterIntake(weightKg),
    estimateMaxHeartRate(ageYears),
  ])

  const [bmiCategory, heartRateZones] = await Promise.all([
    getBmiCategory(bmi),
    calculateHeartRateZones(maxHeartRate),
  ])

  return {
    bmi,
    bmiCategory,
    bmr,
    tdee,
    recommendedWaterMl,
    maxHeartRate,
    heartRateZones,
  }
}

/**
 * Calculate daily macro targets based on TDEE and goal
 */
export async function calculateDailyMacroTargets(
  tdee: number,
  goal: 'lose' | 'maintain' | 'gain',
  weightKg: number,
  proteinPerKg: number = 1.8
): Promise<{
  calories: number
  protein: number
  carbs: number
  fat: number
}> {
  // Adjust calories based on goal
  let targetCalories = tdee
  if (goal === 'lose') {
    targetCalories = tdee * 0.8 // 20% deficit
  } else if (goal === 'gain') {
    targetCalories = tdee * 1.15 // 15% surplus
  }

  // Calculate macros
  const protein = weightKg * Math.min(Math.max(proteinPerKg, 1.2), 2.5)
  const proteinCal = protein * 4

  const fatCal = targetCalories * 0.25
  const fat = fatCal / 9

  const carbsCal = targetCalories - proteinCal - fatCal
  const carbs = Math.max(carbsCal / 4, 50) // Minimum 50g carbs

  return {
    calories: Math.round(targetCalories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  }
}

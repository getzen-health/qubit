// Mifflin-St Jeor BMR equation (most accurate per Academy of Nutrition and Dietetics)
export interface UserProfile {
  weightKg: number
  heightCm: number
  ageYears: number
  sex: 'male' | 'female'
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal: 'lose' | 'maintain' | 'gain'
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // Little/no exercise
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week
  active: 1.725,       // Hard exercise 6-7 days/week
  very_active: 1.9,    // Very hard exercise + physical job
}

const GOAL_ADJUSTMENTS = {
  lose: -500,      // 500 cal deficit ≈ 0.5kg/week loss
  maintain: 0,
  gain: 300,       // 300 cal surplus for lean muscle gain
}

export function calculateBMR(profile: UserProfile): number {
  const { weightKg, heightCm, ageYears, sex } = profile
  // Mifflin-St Jeor: Men: 10W + 6.25H - 5A + 5, Women: 10W + 6.25H - 5A - 161
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears
  return sex === 'male' ? base + 5 : base - 161
}

export function calculateTDEE(profile: UserProfile): number {
  return Math.round(calculateBMR(profile) * ACTIVITY_MULTIPLIERS[profile.activityLevel])
}

export function calculateTargetCalories(profile: UserProfile): number {
  return Math.round(calculateTDEE(profile) + GOAL_ADJUSTMENTS[profile.goal])
}

export function calculateMacroTargets(targetCalories: number, goal: UserProfile['goal']) {
  // Macro splits based on goal
  const splits = {
    lose:     { protein: 0.35, carbs: 0.35, fat: 0.30 },
    maintain: { protein: 0.25, carbs: 0.45, fat: 0.30 },
    gain:     { protein: 0.30, carbs: 0.50, fat: 0.20 },
  }
  const split = splits[goal]
  return {
    calories: targetCalories,
    proteinG: Math.round((targetCalories * split.protein) / 4),
    carbsG: Math.round((targetCalories * split.carbs) / 4),
    fatG: Math.round((targetCalories * split.fat) / 9),
  }
}

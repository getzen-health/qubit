/**
 * Meal Planner Library
 * Research basis:
 * - Frankenfield 2005: Mifflin-St Jeor most accurate RMR equation (±10%)
 * - Morton 2018 BJSM meta-analysis: 1.6-2.2g/kg protein for muscle gain
 * - Areta 2013 J Physiol: protein distribution every 3-4h optimal
 * - Threapleton 2013 BMJ: each 10g/day fiber reduces CVD risk 16%
 * - Estruch 2013 NEJM: PREDIMED Mediterranean diet 30% CVD reduction
 */

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type DietGoal = 'cut' | 'maintain' | 'bulk'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface TDEEResult {
  bmr: number
  tdee: number
  activity_multiplier: number
}

export interface MacroTargets {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

export interface FoodItem {
  name: string
  quantity_g: number
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g: number
  glycemic_index?: number
}

export interface MealEntry {
  id?: string
  meal_type: MealType
  foods: FoodItem[]
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  total_fiber_g: number
  glycemic_load: number
  timestamp: string
}

export interface MealTemplate {
  name: string
  type: MealType
  macros: MacroTargets
  tags: string[]
  prepTime: number // minutes
}

// Activity multipliers (Mifflin-St Jeor activity factors)
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation (Frankenfield 2005)
 * Men:   10×weight + 6.25×height - 5×age + 5
 * Women: 10×weight + 6.25×height - 5×age - 161
 */
export function calculateTDEE(
  weight_kg: number,
  height_cm: number,
  age: number,
  sex: 'male' | 'female',
  activity: ActivityLevel,
): TDEEResult {
  const bmr =
    sex === 'male'
      ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
      : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

  const activity_multiplier = ACTIVITY_MULTIPLIERS[activity]
  const tdee = Math.round(bmr * activity_multiplier)

  return { bmr: Math.round(bmr), tdee, activity_multiplier }
}

/**
 * Calculate macro targets based on TDEE and goal.
 * Protein: 2.0g/kg cut, 1.6g/kg maintain, 2.2g/kg bulk (Morton 2018 BJSM)
 * Fat: 30% of target calories
 * Carbs: remainder
 * Fiber: 14g per 1000 kcal (Threapleton 2013 BMJ)
 */
export function calculateMacroTargets(
  tdee: number,
  goal: DietGoal,
  weight_kg: number,
  _body_fat_pct?: number,
): MacroTargets {
  const calorie_adjustment = goal === 'cut' ? -500 : goal === 'bulk' ? 300 : 0
  const calories = Math.round(tdee + calorie_adjustment)

  const protein_multiplier = goal === 'cut' ? 2.0 : goal === 'bulk' ? 2.2 : 1.6
  const protein_g = Math.round(protein_multiplier * weight_kg)

  const fat_g = Math.round((calories * 0.3) / 9)
  const protein_calories = protein_g * 4
  const fat_calories = fat_g * 9
  const carbs_g = Math.round((calories - protein_calories - fat_calories) / 4)

  const fiber_g = Math.round((calories / 1000) * 14)

  return { calories, protein_g, carbs_g: Math.max(carbs_g, 0), fat_g, fiber_g }
}

/**
 * Calculate glycemic load for a meal.
 * GL = (GI × available carbs in grams) / 100
 * Categorized: low <10, medium 11-19, high ≥20
 */
export function calculateMealGlycemicLoad(foods: FoodItem[]): number {
  let totalGL = 0
  for (const food of foods) {
    const gi = food.glycemic_index ?? 55 // default moderate GI if unknown
    const available_carbs = (food.carbs_per_100g * food.quantity_g) / 100
    totalGL += (gi * available_carbs) / 100
  }
  return Math.round(totalGL * 10) / 10
}

/**
 * Calculate diet adherence score 0-100.
 * Components:
 * - Calorie accuracy (±10% = full 30pts, pro-rated outside)
 * - Protein hit (≥target = 25pts)
 * - Fiber goal (≥target = 15pts)
 * - Meal timing (4 meals/day ~3-4h apart = 15pts, Areta 2013)
 * - Glycemic load control (<20 avg = 15pts)
 */
export function calculateDietAdherenceScore(
  meals: MealEntry[],
  targets: MacroTargets,
): number {
  if (meals.length === 0) return 0

  const totalCalories = meals.reduce((s, m) => s + m.total_calories, 0)
  const totalProtein = meals.reduce((s, m) => s + m.total_protein_g, 0)
  const totalFiber = meals.reduce((s, m) => s + m.total_fiber_g, 0)
  const avgGL = meals.reduce((s, m) => s + m.glycemic_load, 0) / meals.length

  // Calorie accuracy — 30 points
  const calorieDiff = Math.abs(totalCalories - targets.calories) / targets.calories
  const calorieScore = calorieDiff <= 0.1 ? 30 : Math.max(0, 30 - calorieDiff * 150)

  // Protein hit — 25 points
  const proteinRatio = Math.min(totalProtein / targets.protein_g, 1)
  const proteinScore = proteinRatio * 25

  // Fiber goal — 15 points
  const fiberRatio = Math.min(totalFiber / targets.fiber_g, 1)
  const fiberScore = fiberRatio * 15

  // Meal timing (Areta 2013: protein distribution every 3-4h) — 15 points
  const mealTimingScore = (() => {
    if (meals.length < 3) return 0
    const mealCount = new Set(meals.map((m) => m.meal_type)).size
    if (mealCount >= 4) return 15
    if (mealCount === 3) return 10
    return 5
  })()

  // Glycemic load control — 15 points
  const glScore = avgGL < 10 ? 15 : avgGL < 20 ? 10 : 5

  const total =
    calorieScore + proteinScore + fiberScore + mealTimingScore + glScore
  return Math.round(Math.min(100, total))
}

export const MEAL_TEMPLATES: MealTemplate[] = [
  {
    name: 'Greek Yogurt Parfait',
    type: 'breakfast',
    macros: { calories: 350, protein_g: 25, carbs_g: 40, fat_g: 8, fiber_g: 4 },
    tags: ['high-protein', 'probiotic', 'quick'],
    prepTime: 5,
  },
  {
    name: 'Overnight Oats with Berries',
    type: 'breakfast',
    macros: { calories: 420, protein_g: 18, carbs_g: 60, fat_g: 10, fiber_g: 8 },
    tags: ['fiber-rich', 'antioxidants', 'meal-prep'],
    prepTime: 5,
  },
  {
    name: 'Veggie Egg White Omelette',
    type: 'breakfast',
    macros: { calories: 280, protein_g: 28, carbs_g: 12, fat_g: 12, fiber_g: 3 },
    tags: ['high-protein', 'low-carb', 'keto-friendly'],
    prepTime: 10,
  },
  {
    name: 'Avocado Toast with Poached Egg',
    type: 'breakfast',
    macros: { calories: 380, protein_g: 16, carbs_g: 34, fat_g: 20, fiber_g: 6 },
    tags: ['healthy-fats', 'mediterranean'],
    prepTime: 10,
  },
  {
    name: 'Grilled Chicken Salad',
    type: 'lunch',
    macros: { calories: 380, protein_g: 42, carbs_g: 18, fat_g: 14, fiber_g: 5 },
    tags: ['high-protein', 'low-carb', 'anti-inflammatory'],
    prepTime: 15,
  },
  {
    name: 'Salmon & Quinoa Bowl',
    type: 'lunch',
    macros: { calories: 520, protein_g: 38, carbs_g: 48, fat_g: 16, fiber_g: 6 },
    tags: ['omega-3', 'complete-protein', 'mediterranean'],
    prepTime: 20,
  },
  {
    name: 'Lentil & Vegetable Soup',
    type: 'lunch',
    macros: { calories: 320, protein_g: 18, carbs_g: 52, fat_g: 4, fiber_g: 14 },
    tags: ['high-fiber', 'plant-protein', 'mediterranean'],
    prepTime: 30,
  },
  {
    name: 'Turkey & Avocado Wrap',
    type: 'lunch',
    macros: { calories: 440, protein_g: 32, carbs_g: 38, fat_g: 16, fiber_g: 7 },
    tags: ['balanced', 'portable', 'meal-prep'],
    prepTime: 10,
  },
  {
    name: 'Tuna Nicoise Salad',
    type: 'lunch',
    macros: { calories: 420, protein_g: 35, carbs_g: 22, fat_g: 20, fiber_g: 6 },
    tags: ['omega-3', 'mediterranean', 'low-GL'],
    prepTime: 15,
  },
  {
    name: 'Chickpea & Spinach Curry',
    type: 'lunch',
    macros: { calories: 380, protein_g: 16, carbs_g: 58, fat_g: 9, fiber_g: 12 },
    tags: ['plant-based', 'high-fiber', 'anti-inflammatory'],
    prepTime: 25,
  },
  {
    name: 'Baked Salmon with Roasted Vegetables',
    type: 'dinner',
    macros: { calories: 480, protein_g: 40, carbs_g: 28, fat_g: 22, fiber_g: 8 },
    tags: ['omega-3', 'mediterranean', 'anti-inflammatory'],
    prepTime: 25,
  },
  {
    name: 'Chicken & Broccoli Stir-Fry',
    type: 'dinner',
    macros: { calories: 420, protein_g: 38, carbs_g: 32, fat_g: 14, fiber_g: 6 },
    tags: ['high-protein', 'low-GL', 'quick'],
    prepTime: 20,
  },
  {
    name: 'Lean Beef & Vegetable Stir-Fry',
    type: 'dinner',
    macros: { calories: 460, protein_g: 36, carbs_g: 30, fat_g: 18, fiber_g: 5 },
    tags: ['high-protein', 'iron-rich', 'balanced'],
    prepTime: 20,
  },
  {
    name: 'Turkey Meatballs with Zucchini Noodles',
    type: 'dinner',
    macros: { calories: 380, protein_g: 34, carbs_g: 18, fat_g: 16, fiber_g: 4 },
    tags: ['high-protein', 'low-carb', 'mediterranean'],
    prepTime: 30,
  },
  {
    name: 'Black Bean Tacos',
    type: 'dinner',
    macros: { calories: 440, protein_g: 20, carbs_g: 62, fat_g: 12, fiber_g: 14 },
    tags: ['plant-based', 'high-fiber', 'budget-friendly'],
    prepTime: 20,
  },
  {
    name: 'Cottage Cheese & Fruit Bowl',
    type: 'snack',
    macros: { calories: 220, protein_g: 22, carbs_g: 20, fat_g: 4, fiber_g: 2 },
    tags: ['high-protein', 'casein', 'bedtime-snack'],
    prepTime: 3,
  },
  {
    name: 'Apple with Almond Butter',
    type: 'snack',
    macros: { calories: 280, protein_g: 7, carbs_g: 30, fat_g: 16, fiber_g: 5 },
    tags: ['healthy-fats', 'fiber-rich', 'portable'],
    prepTime: 2,
  },
  {
    name: 'Hummus & Veggie Sticks',
    type: 'snack',
    macros: { calories: 200, protein_g: 8, carbs_g: 22, fat_g: 9, fiber_g: 6 },
    tags: ['plant-protein', 'fiber-rich', 'mediterranean'],
    prepTime: 5,
  },
  {
    name: 'Edamame with Sea Salt',
    type: 'snack',
    macros: { calories: 190, protein_g: 17, carbs_g: 14, fat_g: 8, fiber_g: 8 },
    tags: ['plant-protein', 'complete-protein', 'high-fiber'],
    prepTime: 5,
  },
  {
    name: 'Protein Smoothie Bowl',
    type: 'snack',
    macros: { calories: 310, protein_g: 28, carbs_g: 36, fat_g: 6, fiber_g: 5 },
    tags: ['high-protein', 'post-workout', 'antioxidants'],
    prepTime: 5,
  },
]

/**
 * Nutrient density scores by food category.
 * Higher = more nutrients per calorie.
 */
export const NUTRIENT_DENSITY_SCORES: Record<string, number> = {
  'leafy greens': 95,
  'cruciferous vegetables': 90,
  legumes: 85,
  'wild-caught fish': 85,
  'organ meats': 80,
  'whole grains': 75,
  berries: 75,
  eggs: 72,
  'lean poultry': 70,
  nuts: 68,
  seeds: 65,
  'root vegetables': 60,
  fruit: 58,
  dairy: 55,
  'red meat': 50,
  'refined grains': 30,
  'processed snacks': 15,
  'sugary beverages': 5,
  'fast food': 10,
}

interface OpenFoodFactsProduct {
  product_name?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
  }
}

interface OpenFoodFactsResponse {
  products?: OpenFoodFactsProduct[]
}

/**
 * Search OpenFoodFacts API for food items.
 * Returns parsed FoodItem[] with nutritional data.
 */
export async function searchOpenFoodFacts(query: string): Promise<FoodItem[]> {
  const encoded = encodeURIComponent(query)
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encoded}&json=1&page_size=10`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'KQuarks-NutritionApp/1.0' },
    next: { revalidate: 3600 },
  })

  if (!res.ok) return []

  const data: OpenFoodFactsResponse = await res.json()
  const products = data.products ?? []

  return products
    .filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null)
    .map((p) => ({
      name: p.product_name ?? 'Unknown',
      quantity_g: 100,
      calories_per_100g: p.nutriments?.['energy-kcal_100g'] ?? 0,
      protein_per_100g: p.nutriments?.proteins_100g ?? 0,
      carbs_per_100g: p.nutriments?.carbohydrates_100g ?? 0,
      fat_per_100g: p.nutriments?.fat_100g ?? 0,
      fiber_per_100g: p.nutriments?.fiber_100g ?? 0,
    }))
    .slice(0, 10)
}

/** Compute scaled macro totals for a single food item at the given quantity. */
export function scaleFoodMacros(food: FoodItem) {
  const scale = food.quantity_g / 100
  return {
    calories: Math.round(food.calories_per_100g * scale * 10) / 10,
    protein_g: Math.round(food.protein_per_100g * scale * 10) / 10,
    carbs_g: Math.round(food.carbs_per_100g * scale * 10) / 10,
    fat_g: Math.round(food.fat_per_100g * scale * 10) / 10,
    fiber_g: Math.round(food.fiber_per_100g * scale * 10) / 10,
  }
}

/** Compute running totals across an array of FoodItem. */
export function sumFoodMacros(foods: FoodItem[]): Omit<MealEntry, 'id' | 'meal_type' | 'foods' | 'timestamp'> {
  const totals = foods.reduce(
    (acc, food) => {
      const s = scaleFoodMacros(food)
      return {
        total_calories: acc.total_calories + s.calories,
        total_protein_g: acc.total_protein_g + s.protein_g,
        total_carbs_g: acc.total_carbs_g + s.carbs_g,
        total_fat_g: acc.total_fat_g + s.fat_g,
        total_fiber_g: acc.total_fiber_g + s.fiber_g,
      }
    },
    { total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0, total_fiber_g: 0 },
  )
  return {
    ...totals,
    glycemic_load: calculateMealGlycemicLoad(foods),
  }
}

/** GL category label for UI */
export function glLabel(gl: number): { label: string; color: string } {
  if (gl < 10) return { label: 'Low GL', color: 'text-green-400' }
  if (gl < 20) return { label: 'Med GL', color: 'text-yellow-400' }
  return { label: 'High GL', color: 'text-red-400' }
}

export const DAILY_VALUES = {
  calories: 2000,
  totalFat: 78,        // g
  saturatedFat: 20,    // g
  transFat: 0,         // g
  cholesterol: 300,    // mg
  sodium: 2300,        // mg
  totalCarbohydrate: 275, // g
  dietaryFiber: 28,    // g
  totalSugars: 50,     // g
  addedSugars: 50,     // g
  protein: 50,         // g
  vitaminD: 20,        // mcg
  calcium: 1300,       // mg
  iron: 18,            // mg
  potassium: 4700,     // mg
  vitaminA: 900,       // mcg
  vitaminC: 90,        // mg
  vitaminE: 15,        // mg
  vitaminK: 120,       // mcg
  vitaminB12: 2.4,     // mcg
  folate: 400,         // mcg
  magnesium: 420,      // mg
  zinc: 11,            // mg
} as const

export const NUTRIENT_LABELS: Record<keyof typeof DAILY_VALUES, string> = {
  calories: 'Calories',
  totalFat: 'Total Fat',
  saturatedFat: 'Saturated Fat',
  transFat: 'Trans Fat',
  cholesterol: 'Cholesterol',
  sodium: 'Sodium',
  totalCarbohydrate: 'Total Carbohydrate',
  dietaryFiber: 'Dietary Fiber',
  totalSugars: 'Total Sugars',
  addedSugars: 'Added Sugars',
  protein: 'Protein',
  vitaminD: 'Vitamin D',
  calcium: 'Calcium',
  iron: 'Iron',
  potassium: 'Potassium',
  vitaminA: 'Vitamin A',
  vitaminC: 'Vitamin C',
  vitaminE: 'Vitamin E',
  vitaminK: 'Vitamin K',
  vitaminB12: 'Vitamin B12',
  folate: 'Folate',
  magnesium: 'Magnesium',
  zinc: 'Zinc',
}

export const NUTRIENT_UNITS: Record<keyof typeof DAILY_VALUES, string> = {
  calories: 'kcal',
  totalFat: 'g', saturatedFat: 'g', transFat: 'g',
  cholesterol: 'mg', sodium: 'mg',
  totalCarbohydrate: 'g', dietaryFiber: 'g', totalSugars: 'g', addedSugars: 'g',
  protein: 'g',
  vitaminD: 'mcg', calcium: 'mg', iron: 'mg', potassium: 'mg',
  vitaminA: 'mcg', vitaminC: 'mg', vitaminE: 'mg', vitaminK: 'mcg',
  vitaminB12: 'mcg', folate: 'mcg', magnesium: 'mg', zinc: 'mg',
}

export function getDailyValuePercent(nutrient: keyof typeof DAILY_VALUES, amount: number): number {
  const dv = DAILY_VALUES[nutrient]
  if (!dv) return 0
  return Math.round((amount / dv) * 100)
}

export function getNutrientQuality(nutrient: string, dvPercent: number): 'good' | 'neutral' | 'bad' {
  const goodNutrients = ['dietaryFiber', 'protein', 'vitaminD', 'calcium', 'iron', 'potassium', 'vitaminA', 'vitaminC', 'vitaminE', 'vitaminK', 'vitaminB12', 'folate', 'magnesium', 'zinc']
  const badNutrients = ['saturatedFat', 'transFat', 'sodium', 'addedSugars']
  if (goodNutrients.includes(nutrient)) return dvPercent >= 20 ? 'good' : 'neutral'
  if (badNutrients.includes(nutrient)) return dvPercent >= 20 ? 'bad' : 'neutral'
  return 'neutral'
}

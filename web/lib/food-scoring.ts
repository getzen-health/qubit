// Yuka-inspired food scoring algorithm
// Weights: 60% Nutrition + 30% Additives + 10% Organic

export type FoodGrade = 'A' | 'B' | 'C' | 'D'

interface NutrimentData {
  'energy-kcal_100g'?: number
  sugars_100g?: number
  'saturated-fat_100g'?: number
  sodium_100g?: number
  fiber_100g?: number
  proteins_100g?: number
  'fruits-vegetables-nuts-estimate-from-ingredients_100g'?: number
  [key: string]: number | undefined
}

const HAZARDOUS_ADDITIVES = new Set([
  'e102', 'e104', 'e110', 'e122', 'e124', 'e129', 'e133', 'e150d',
  'e151', 'e171', 'e320', 'e321', 'e407', 'e924'
])

const MODERATE_ADDITIVES = new Set([
  'e250', 'e251', 'e621', 'e951', 'e955', 'e954', 'e211', 'e210', 'e212'
])

const LIMITED_ADDITIVES = new Set([
  'e330', 'e300', 'e301', 'e302', 'e471', 'e472', 'e450', 'e451', 'e452'
])

function parseAdditives(additivesStr: string | undefined): string[] {
  if (!additivesStr) return []
  return additivesStr.toLowerCase().split(',').map(a => a.trim().replace(/\s/g, ''))
}

function calcNutritionScore(nutriments: NutrimentData): number {
  // Simplified Nutri-Score-inspired calculation (0-60)
  let score = 30 // neutral base

  const energy = nutriments['energy-kcal_100g'] ?? 0
  const sugars = nutriments.sugars_100g ?? 0
  const satFat = nutriments['saturated-fat_100g'] ?? 0
  const sodium = (nutriments.sodium_100g ?? 0) * 1000 // convert g to mg
  const fiber = nutriments.fiber_100g ?? 0
  const protein = nutriments.proteins_100g ?? 0
  const fruitsVeg = nutriments['fruits-vegetables-nuts-estimate-from-ingredients_100g'] ?? 0

  // Negative factors (reduce score)
  if (energy > 800) score -= 8
  else if (energy > 400) score -= 4
  if (sugars > 45) score -= 10
  else if (sugars > 22.5) score -= 6
  else if (sugars > 9) score -= 3
  if (satFat > 10) score -= 8
  else if (satFat > 5) score -= 4
  else if (satFat > 2) score -= 2
  if (sodium > 900) score -= 8
  else if (sodium > 600) score -= 4
  else if (sodium > 300) score -= 2

  // Positive factors (increase score)
  if (fiber > 7) score += 7
  else if (fiber > 4) score += 4
  else if (fiber > 2) score += 2
  if (protein > 8) score += 6
  else if (protein > 4) score += 3
  if (fruitsVeg > 60) score += 5
  else if (fruitsVeg > 40) score += 3

  return Math.max(0, Math.min(60, score))
}

function calcAdditiveScore(additivesStr: string | undefined): number {
  // 0-30 points (start at 30, subtract for additives)
  const additives = parseAdditives(additivesStr)
  if (additives.length === 0) return 30

  let penalty = 0
  for (const additive of additives) {
    if (HAZARDOUS_ADDITIVES.has(additive)) penalty += 15
    else if (MODERATE_ADDITIVES.has(additive)) penalty += 7
    else if (LIMITED_ADDITIVES.has(additive)) penalty += 2
  }

  return Math.max(0, 30 - penalty)
}

function calcOrganicBonus(labels: string | undefined): number {
  if (!labels) return 0
  const lower = labels.toLowerCase()
  if (lower.includes('organic') || lower.includes('bio') || lower.includes('en:organic')) return 10
  return 0
}

export function scoreFoodProduct(product: {
  nutriments?: NutrimentData
  additives_tags?: string[]
  additives_original_tags?: string[]
  labels?: string
  labels_tags?: string[]
}): { score: number; grade: FoodGrade; components: { nutrition: number; additives: number; organic: number } } {
  const nutriments = product.nutriments ?? {}
  const additivesStr = (product.additives_tags ?? product.additives_original_tags ?? []).join(',')
  const labels = product.labels ?? (product.labels_tags ?? []).join(',')

  const nutritionScore = calcNutritionScore(nutriments)
  const additiveScore = calcAdditiveScore(additivesStr)
  const organicBonus = calcOrganicBonus(labels)

  const total = Math.round(Math.min(100, nutritionScore + additiveScore + organicBonus))
  
  let grade: FoodGrade
  if (total >= 75) grade = 'A'
  else if (total >= 50) grade = 'B'
  else if (total >= 25) grade = 'C'
  else grade = 'D'

  return { score: total, grade, components: { nutrition: nutritionScore, additives: additiveScore, organic: organicBonus } }
}

export function getAdditiveDetails(additivesStr: string | undefined): Array<{ code: string; risk: 'hazardous' | 'moderate' | 'limited' | 'safe' }> {
  const additives = parseAdditives(additivesStr)
  return additives.map(code => ({
    code: code.toUpperCase(),
    risk: HAZARDOUS_ADDITIVES.has(code) ? 'hazardous'
        : MODERATE_ADDITIVES.has(code) ? 'moderate'
        : LIMITED_ADDITIVES.has(code) ? 'limited'
        : 'safe'
  }))
}

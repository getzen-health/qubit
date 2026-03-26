export type TrafficLight = 'green' | 'yellow' | 'red'

export interface NutrientLight {
  name: string
  value: number | null
  unit: string
  per100g: number | null
  light: TrafficLight
  label: string
  description: string
}

// Per 100g thresholds (based on UK/EU traffic light system)
const THRESHOLDS = {
  energy_kcal: { green: 80, yellow: 150 },       // kcal per 100g
  sugars: { green: 5, yellow: 12.5 },             // g per 100g
  saturated_fat: { green: 1.5, yellow: 5 },       // g per 100g
  fat: { green: 3, yellow: 17.5 },                // g per 100g  
  salt: { green: 0.3, yellow: 1.5 },              // g per 100g
  sodium: { green: 0.12, yellow: 0.6 },           // g per 100g
  fiber: { green: 3, yellow: 1.5 },               // g (higher is better)
  protein: { green: 12, yellow: 6 },              // g (higher is better)
}

function getLight(key: keyof typeof THRESHOLDS, value: number): TrafficLight {
  const { green, yellow } = THRESHOLDS[key]
  // For fiber and protein, higher is better (inverted)
  if (key === 'fiber' || key === 'protein') {
    if (value >= green) return 'green'
    if (value >= yellow) return 'yellow'
    return 'red'
  }
  // For everything else, lower is better
  if (value <= green) return 'green'
  if (value <= yellow) return 'yellow'
  return 'red'
}

export function analyzeNutrients(nutriments: Record<string, any>): NutrientLight[] {
  const nutrients: NutrientLight[] = []
  
  const checks: Array<{ key: string; thresholdKey: keyof typeof THRESHOLDS; name: string; unit: string }> = [
    { key: 'energy-kcal_100g', thresholdKey: 'energy_kcal', name: 'Calories', unit: 'kcal' },
    { key: 'sugars_100g', thresholdKey: 'sugars', name: 'Sugars', unit: 'g' },
    { key: 'saturated-fat_100g', thresholdKey: 'saturated_fat', name: 'Saturated Fat', unit: 'g' },
    { key: 'fat_100g', thresholdKey: 'fat', name: 'Total Fat', unit: 'g' },
    { key: 'salt_100g', thresholdKey: 'salt', name: 'Salt', unit: 'g' },
    { key: 'fiber_100g', thresholdKey: 'fiber', name: 'Fiber', unit: 'g' },
    { key: 'proteins_100g', thresholdKey: 'protein', name: 'Protein', unit: 'g' },
  ]
  
  for (const { key, thresholdKey, name, unit } of checks) {
    const value = nutriments?.[key]
    if (value == null || isNaN(Number(value))) continue
    const numVal = Number(value)
    const light = getLight(thresholdKey, numVal)
    const labels = { green: 'Low', yellow: 'Medium', red: 'High' }
    const descriptions: Record<string, Record<TrafficLight, string>> = {
      sugars: { green: 'Low sugar', yellow: 'Moderate sugar', red: 'High sugar — limit intake' },
      saturated_fat: { green: 'Low saturated fat', yellow: 'Medium saturated fat', red: 'High saturated fat — watch out' },
      fat: { green: 'Low fat', yellow: 'Medium fat', red: 'High fat' },
      salt: { green: 'Low salt', yellow: 'Medium salt', red: 'High salt — watch out' },
      energy_kcal: { green: 'Low calorie', yellow: 'Medium calorie', red: 'High calorie' },
      fiber: { green: 'Good fiber source', yellow: 'Some fiber', red: 'Low fiber' },
      protein: { green: 'High protein', yellow: 'Some protein', red: 'Low protein' },
    }
    nutrients.push({
      name,
      value: numVal,
      unit,
      per100g: numVal,
      light,
      label: labels[light],
      description: descriptions[thresholdKey]?.[light] ?? labels[light],
    })
  }
  
  return nutrients
}

export const LIGHT_COLORS = {
  green: { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-200', bg_light: 'bg-green-50' },
  yellow: { bg: 'bg-yellow-400', text: 'text-yellow-700', border: 'border-yellow-200', bg_light: 'bg-yellow-50' },
  red: { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-200', bg_light: 'bg-red-50' },
}

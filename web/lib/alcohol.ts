export type DrinkType = 'beer' | 'wine' | 'spirits' | 'cocktail' | 'cider' | 'other'

export interface DrinkTemplate {
  name: string
  type: DrinkType
  emoji: string
  abv: number         // % alcohol by volume
  volume_ml: number   // standard serving
  units: number       // UK units (8g alcohol)
}

export const DRINK_TEMPLATES: DrinkTemplate[] = [
  { name: 'Regular Beer', type: 'beer', emoji: '🍺', abv: 5, volume_ml: 330, units: 1.7 },
  { name: 'Strong Beer', type: 'beer', emoji: '🍺', abv: 8, volume_ml: 500, units: 4.0 },
  { name: 'Pint (4%)', type: 'beer', emoji: '🍺', abv: 4, volume_ml: 568, units: 2.3 },
  { name: 'Wine (glass)', type: 'wine', emoji: '🍷', abv: 12, volume_ml: 175, units: 2.1 },
  { name: 'Wine (large)', type: 'wine', emoji: '🍷', abv: 12, volume_ml: 250, units: 3.0 },
  { name: 'Prosecco', type: 'wine', emoji: '🥂', abv: 11, volume_ml: 125, units: 1.4 },
  { name: 'Spirits (single)', type: 'spirits', emoji: '🥃', abv: 40, volume_ml: 25, units: 1.0 },
  { name: 'Spirits (double)', type: 'spirits', emoji: '🥃', abv: 40, volume_ml: 50, units: 2.0 },
  { name: 'Cocktail', type: 'cocktail', emoji: '🍹', abv: 15, volume_ml: 150, units: 2.2 },
  { name: 'Cider (pint)', type: 'cider', emoji: '🍻', abv: 5, volume_ml: 568, units: 2.8 },
]

export function calculateUnits(abv: number, volume_ml: number): number {
  return Math.round((abv * volume_ml * 0.789) / 8 * 10) / 10
}

// Widmark formula: BAC (g/dL)
export function estimateBAC(units: number, weight_kg: number, sex: 'male' | 'female', hoursSince: number): number {
  const grams = units * 8 // 1 UK unit = 8g ethanol
  const r = sex === 'female' ? 0.55 : 0.68
  const bac = (grams / (weight_kg * r * 10)) - (0.015 * hoursSince)
  return Math.max(0, Math.round(bac * 1000) / 1000)
}

export function bacDescription(bac: number): { label: string; color: string; detail: string } {
  if (bac === 0) return { label: 'Sober', color: 'green', detail: 'No impairment' }
  if (bac < 0.02) return { label: 'Trace', color: 'green', detail: 'Minimal effect' }
  if (bac < 0.05) return { label: 'Mild', color: 'yellow', detail: 'Slight relaxation, reduced inhibition' }
  if (bac < 0.08) return { label: 'Moderate', color: 'orange', detail: 'Impaired judgement, do not drive' }
  if (bac < 0.15) return { label: 'High', color: 'red', detail: 'Significant impairment, confusion' }
  return { label: 'Dangerous', color: 'red', detail: 'Severe impairment, seek help' }
}

export function weeklyRiskCategory(weeklyUnits: number, sex: 'male' | 'female'): { label: string; color: string; icon: string } {
  const limit = sex === 'female' ? 14 : 14 // same for both in UK guidelines
  if (weeklyUnits === 0) return { label: 'Alcohol-free', color: 'green', icon: '🌟' }
  if (weeklyUnits <= limit) return { label: 'Low Risk', color: 'green', icon: '✅' }
  if (weeklyUnits <= 21) return { label: 'Increasing Risk', color: 'yellow', icon: '⚠️' }
  if (weeklyUnits <= 35) return { label: 'High Risk', color: 'orange', icon: '🔴' }
  return { label: 'Very High Risk', color: 'red', icon: '🚨' }
}

// Simple liver health score 0-100 (100 = best)
export function liverHealthScore(weeklyUnits: number, drinkFreeDays: number, weeksTracked: number): number {
  let score = 100
  // Penalize high weekly units
  if (weeklyUnits > 14) score -= Math.min(30, (weeklyUnits - 14) * 2)
  // Reward drink-free days
  if (drinkFreeDays < 2) score -= 15
  else if (drinkFreeDays >= 4) score += 5
  // Penalize consistent heavy drinking
  if (weeksTracked > 0) score = Math.max(20, score)
  return Math.min(100, Math.max(0, Math.round(score)))
}

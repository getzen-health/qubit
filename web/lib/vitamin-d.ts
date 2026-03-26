// Fitzpatrick skin type: I (very fair) → VI (very dark)
export type SkinType = 1 | 2 | 3 | 4 | 5 | 6

export interface SkinTypeInfo {
  label: string
  description: string
  emoji: string
  productionMultiplier: number // relative to type III baseline
}

export const SKIN_TYPES: Record<SkinType, SkinTypeInfo> = {
  1: { label: 'Type I', description: 'Very fair, always burns, never tans', emoji: '👱', productionMultiplier: 1.5 },
  2: { label: 'Type II', description: 'Fair, burns easily, tans minimally', emoji: '🧑‍🦱', productionMultiplier: 1.2 },
  3: { label: 'Type III', description: 'Medium, sometimes burns, tans gradually', emoji: '🧑', productionMultiplier: 1.0 },
  4: { label: 'Type IV', description: 'Olive, rarely burns, tans easily', emoji: '🧑‍🦳', productionMultiplier: 0.7 },
  5: { label: 'Type V', description: 'Brown skin, very rarely burns', emoji: '🧑🏾', productionMultiplier: 0.4 },
  6: { label: 'Type VI', description: 'Very dark, never burns', emoji: '🧑🏿', productionMultiplier: 0.25 },
}

// Body exposure factor (what fraction of skin is exposed)
export const BODY_EXPOSURE: Record<string, number> = {
  'face_only': 0.07,
  'face_arms': 0.18,
  'arms_legs': 0.35,
  'arms_legs_torso': 0.50,
  'swimsuit': 0.65,
  'full_body': 0.80,
}

// Estimate Vitamin D IU synthesized
// Based on: Holick 2004 model simplified
export function estimateVitaminD(params: {
  durationMin: number
  uvIndex: number
  skinType: SkinType
  bodyExposure: string // key from BODY_EXPOSURE
  spf: number // 0 = no sunscreen, 15, 30, 50
  season: 'winter' | 'spring' | 'summer' | 'autumn'
  latitudeRisk: 'low' | 'medium' | 'high' // >50° lat = high, 35-50° = medium, <35° = low
}): number {
  const { durationMin, uvIndex, skinType, bodyExposure, spf, season, latitudeRisk } = params
  if (uvIndex < 3) return 0 // no UVB synthesis below UVI 3

  // Base: ~1000 IU per 15 min full body at UVI 5 for type III (Holick model)
  let baseIU = (durationMin / 15) * 1000 * (uvIndex / 5)

  // Skin type adjustment
  baseIU *= SKIN_TYPES[skinType].productionMultiplier

  // Body exposure
  const exposureFactor = BODY_EXPOSURE[bodyExposure] ?? 0.18
  baseIU *= exposureFactor / 0.80 // normalize to full body baseline

  // SPF reduction (SPF 30 blocks 97%)
  if (spf >= 50) baseIU *= 0.02
  else if (spf >= 30) baseIU *= 0.03
  else if (spf >= 15) baseIU *= 0.07
  else if (spf >= 8) baseIU *= 0.20

  // Season/latitude reduction
  if (season === 'winter' && latitudeRisk === 'high') baseIU *= 0
  else if (season === 'winter' && latitudeRisk === 'medium') baseIU *= 0.1
  else if (season === 'autumn' && latitudeRisk === 'high') baseIU *= 0.3
  else if (season === 'spring' && latitudeRisk === 'high') baseIU *= 0.5

  return Math.round(baseIU)
}

export function getSeasonFromMonth(month: number): 'winter' | 'spring' | 'summer' | 'autumn' {
  if (month <= 2 || month === 12) return 'winter'
  if (month <= 5) return 'spring'
  if (month <= 8) return 'summer'
  return 'autumn'
}

// Daily recommended IU by age (NIH ODS 2023)
export function getDailyVitaminDRecommendation(age: number): { rda: number; ul: number } {
  if (age < 1) return { rda: 400, ul: 1000 }
  if (age <= 70) return { rda: 600, ul: 4000 }
  return { rda: 800, ul: 4000 }
}

export function getUVIRisk(uvi: number): { label: string; color: string; advice: string } {
  if (uvi < 3) return { label: 'Low', color: 'green', advice: 'No protection needed. Minimal Vitamin D synthesis.' }
  if (uvi < 6) return { label: 'Moderate', color: 'yellow', advice: 'Some protection recommended. Good for Vitamin D.' }
  if (uvi < 8) return { label: 'High', color: 'orange', advice: 'Protection needed. Limit exposure to 15-20 min.' }
  if (uvi < 11) return { label: 'Very High', color: 'red', advice: 'Extra protection required. Cover up, SPF 30+.' }
  return { label: 'Extreme', color: 'purple', advice: 'Avoid midday sun. Stay in shade.' }
}

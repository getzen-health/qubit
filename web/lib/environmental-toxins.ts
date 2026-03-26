export interface ToxinLog {
  id?: string
  user_id?: string
  date: string
  // Plastics & endocrine disruptors
  heated_plastic_containers: number
  receipt_handling: number
  canned_food_servings: number
  plastic_bottles: number
  // Heavy metals
  high_mercury_fish: number
  medium_mercury_fish: number
  tap_water_concern: boolean
  old_paint_exposure: boolean
  // Pesticides
  dirty_dozen_servings: number
  conventional_produce_servings: number
  organic_produce_servings: number
  // VOCs
  cleaning_products_used: number
  air_fresheners_used: boolean
  new_furniture_offgassing: boolean
  dry_cleaned_items: number
  // Detox practices
  cruciferous_veg_servings: number
  fiber_g: number
  sauna_minutes: number
  water_l: number
  // Air quality (optional, from external AQI data)
  aqi?: number
  created_at?: string
  updated_at?: string
}

export interface ToxinScore {
  total: number
  risk: 'Low' | 'Moderate' | 'High' | 'Very High'
  pillars: { plastics: number; heavyMetals: number; pesticides: number; vocs: number }
  detoxOffset: number
  aqiPenalty: number
  topExposures: string[]
  recommendations: string[]
}

// EWG Dirty Dozen 2023 — always buy organic (highest pesticide residues)
export const DIRTY_DOZEN_2023 = [
  'Strawberries', 'Spinach', 'Kale/Collard Greens', 'Peaches', 'Pears',
  'Nectarines', 'Apples', 'Grapes', 'Bell Peppers', 'Cherries', 'Blueberries', 'Green Beans',
]

// EWG Clean Fifteen 2023 — lowest pesticide load; conventional is generally fine
export const CLEAN_FIFTEEN_2023 = [
  'Avocados', 'Sweet Corn', 'Pineapple', 'Onions', 'Papaya',
  'Frozen Sweet Peas', 'Asparagus', 'Honeydew Melon', 'Kiwi', 'Cabbage',
  'Mushrooms', 'Mango', 'Sweet Potatoes', 'Watermelon', 'Carrots',
]

// FDA 2021 mercury fish guide
export const MERCURY_FISH = {
  high: [
    'Shark', 'Swordfish', 'King Mackerel', 'Orange Roughy',
    'Bigeye Tuna', 'Marlin', 'Tilefish (Gulf of Mexico)',
  ],
  medium: [
    'Albacore/Yellowfin Tuna', 'Halibut', 'Sea Bass',
    'Grouper', 'Mahi-Mahi', 'Snapper',
  ],
  low: [
    'Salmon', 'Shrimp', 'Tilapia', 'Catfish', 'Cod',
    'Pollock', 'Canned Light Tuna', 'Sardines', 'Oysters',
  ],
}

/**
 * Toxin Burden Score Algorithm
 * Based on: Landrigan et al. 2018 (Lancet Commission), Trasande et al. 2016,
 * EWG Dirty Dozen 2023, FDA 2021 Fish Advice, WHO 2021 indoor VOC guidance.
 *
 * Score range: 0–90+ (lower = better)
 * Risk thresholds: Low 0–15, Moderate 16–35, High 36–55, Very High >55
 */
export function calculateToxinBurden(log: ToxinLog): ToxinScore {
  // Plastics & endocrine disruptors (0–25)
  const plastics = Math.min(
    25,
    log.heated_plastic_containers * 5 +
      log.receipt_handling * 3 +
      log.canned_food_servings * 4 +
      log.plastic_bottles * 3,
  )

  // Heavy metals (0–25)
  const heavyMetals = Math.min(
    25,
    log.high_mercury_fish * 10 +
      log.medium_mercury_fish * 5 +
      (log.tap_water_concern ? 5 : 0) +
      (log.old_paint_exposure ? 5 : 0),
  )

  // Pesticides (0–25): clean fifteen = 0 pts; organic = 0 pts
  const pesticides = Math.min(
    25,
    log.dirty_dozen_servings * 5 + log.conventional_produce_servings * 2,
  )

  // VOCs & indoor air (0–25)
  const vocs = Math.min(
    25,
    log.cleaning_products_used * 5 +
      (log.air_fresheners_used ? 5 : 0) +
      (log.new_furniture_offgassing ? 5 : 0) +
      log.dry_cleaned_items * 3,
  )

  // Air quality penalty (0–10) — applies when AQI > 100 (unhealthy range)
  const aqiPenalty =
    log.aqi != null && log.aqi > 100
      ? Math.min(10, Math.floor((log.aqi - 100) / 25))
      : 0

  // Detox offset (0–10) — reduces final score
  const detoxOffset = Math.min(
    10,
    log.cruciferous_veg_servings * 2 +
      log.fiber_g / 5 +
      (log.sauna_minutes > 0 ? 3 : 0) +
      log.water_l,
  )

  const total = Math.max(0, plastics + heavyMetals + pesticides + vocs + aqiPenalty - detoxOffset)

  const risk: ToxinScore['risk'] =
    total <= 15 ? 'Low' : total <= 35 ? 'Moderate' : total <= 55 ? 'High' : 'Very High'

  const topExposures: string[] = []
  if (plastics >= 15) topExposures.push('High plastic/BPA-phthalate exposure')
  if (heavyMetals >= 15) topExposures.push('Elevated heavy metal intake')
  if (pesticides >= 15) topExposures.push('Significant pesticide residue load')
  if (vocs >= 15) topExposures.push('High indoor VOC levels')
  if (aqiPenalty > 0) topExposures.push(`Poor outdoor air quality (AQI ${log.aqi})`)

  const recommendations: string[] = []
  if (plastics > 10)
    recommendations.push(
      'Switch to glass or stainless-steel containers; never heat food in plastic',
    )
  if (heavyMetals > 10)
    recommendations.push('Limit high-mercury fish to ≤1 serving/week; use a certified water filter')
  if (pesticides > 10)
    recommendations.push('Buy organic for Dirty Dozen; wash all produce with water')
  if (vocs > 10)
    recommendations.push('Open windows ≥10 min/day; choose fragrance-free cleaners; add HEPA filter')
  if (log.water_l < 2)
    recommendations.push('Increase water intake to ≥2 L/day to support renal toxin clearance')
  if (log.cruciferous_veg_servings < 1)
    recommendations.push('Add cruciferous veg (broccoli, cauliflower) — activates Phase II liver detox enzymes')
  if (recommendations.length === 0)
    recommendations.push('Excellent! Maintain your low-toxin lifestyle.')

  return { total, risk, pillars: { plastics, heavyMetals, pesticides, vocs }, detoxOffset, aqiPenalty, topExposures, recommendations }
}

export const DEFAULT_TOXIN_LOG: Omit<ToxinLog, 'date'> = {
  heated_plastic_containers: 0,
  receipt_handling: 0,
  canned_food_servings: 0,
  plastic_bottles: 0,
  high_mercury_fish: 0,
  medium_mercury_fish: 0,
  tap_water_concern: false,
  old_paint_exposure: false,
  dirty_dozen_servings: 0,
  conventional_produce_servings: 0,
  organic_produce_servings: 0,
  cleaning_products_used: 0,
  air_fresheners_used: false,
  new_furniture_offgassing: false,
  dry_cleaned_items: 0,
  cruciferous_veg_servings: 0,
  fiber_g: 0,
  sauna_minutes: 0,
  water_l: 0,
}

// Inflammation Tracker — research basis:
// Shivappa et al. 2014 (Nutr J) — Dietary Inflammatory Index (DII)
// Calder et al. 2017 (Nutrients) — omega-3 (EPA/DHA) reduces CRP, IL-6, TNF-α
// Minihane et al. 2015 (Br J Nutr) — low-grade chronic inflammation & chronic disease
// Simopoulos 2002 (Biomed Pharmacother) — omega-6:3 ratio; optimal ≤4:1

export interface InflammationLog {
  id?: string
  user_id?: string
  date: string

  // Diet inputs
  omega3_servings: number        // fatty fish, algae oil
  vegetables_servings: number
  berries_servings: number
  turmeric_used: boolean
  ginger_used: boolean
  green_tea_cups: number
  fiber_g: number
  sugar_drinks: number           // servings
  processed_meat: number         // servings
  trans_fat_items: number        // servings

  // Omega-6:3 ratio inputs
  cooking_oil_servings: number   // vegetable oils (corn/soy/sunflower)
  processed_snacks: number
  grain_fed_meat: number
  fatty_fish_servings: number
  omega3_supplement: boolean
  flax_chia_servings: number
  walnuts_servings: number

  // Lifestyle
  sleep_hours: number
  stress_level: number           // 1-10
  exercise_minutes_week: number  // weekly total

  // Body composition
  waist_cm: number | null
  biological_sex: 'male' | 'female' | null

  // Smoking
  smoking_status: 'never' | 'former' | 'current'

  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface InflammationScore {
  total: number                  // 0-100, LOWER = better
  crp_proxy: number              // overall CRP proxy 0-100
  anti_inflammatory_diet_score: number  // 0-100
  omega_ratio: number            // numeric ratio
  omega_ratio_category: 'Optimal' | 'Good' | 'Moderate' | 'Poor'
  dii_category: 'Anti-inflammatory' | 'Neutral' | 'Pro-inflammatory' | 'Highly Pro-inflammatory'
  sleep_factor: number
  exercise_factor: number
  diet_factor: number
  stress_factor: number
  adiposity_factor: number
  smoking_factor: number
  top_drivers: string[]
  recommendations: string[]
}

// ─── Anti-inflammatory diet score (0-100) ───────────────────────────────────
export function calcAntiInflammatoryDietScore(log: InflammationLog): number {
  const turmericBonus = (log.turmeric_used ? 1 : 0) + (log.ginger_used ? 1 : 0)
  const raw =
    log.omega3_servings * 15 +
    log.vegetables_servings * 10 +
    log.berries_servings * 10 +
    turmericBonus * 5 +
    log.green_tea_cups * 5 +
    (log.fiber_g / 30) * 20 -
    log.sugar_drinks * 15 -
    log.processed_meat * 15 -
    log.trans_fat_items * 20
  return Math.max(0, Math.min(100, Math.round(raw)))
}

// ─── Omega-6:3 ratio ─────────────────────────────────────────────────────────
export function calcOmegaRatio(log: InflammationLog): number {
  const omega6 =
    log.cooking_oil_servings * 3 +
    log.processed_snacks * 2 +
    log.grain_fed_meat * 1
  const omega3 =
    log.fatty_fish_servings * 5 +
    (log.omega3_supplement ? 4 : 0) +
    log.flax_chia_servings * 2 +
    log.walnuts_servings * 1
  return Math.round((omega6 / Math.max(omega3, 1)) * 10) / 10
}

export function omegaRatioCategory(
  ratio: number
): InflammationScore['omega_ratio_category'] {
  if (ratio <= 4) return 'Optimal'
  if (ratio <= 8) return 'Good'
  if (ratio <= 15) return 'Moderate'
  return 'Poor'
}

// ─── DII category ─────────────────────────────────────────────────────────────
export function calcDIICategory(
  log: InflammationLog
): InflammationScore['dii_category'] {
  const dietScore = calcAntiInflammatoryDietScore(log)
  // Proxy mapping based on anti-inflammatory diet score
  if (dietScore >= 70) return 'Anti-inflammatory'
  if (dietScore >= 45) return 'Neutral'
  if (dietScore >= 20) return 'Pro-inflammatory'
  return 'Highly Pro-inflammatory'
}

// ─── Individual CRP proxy sub-factors (lower = better) ──────────────────────
function sleepFactor(hours: number): number {
  if (hours >= 7) return 0
  if (hours >= 6) return 15
  if (hours >= 5) return 30
  return 50
}

function exerciseFactor(minutesPerWeek: number): number {
  if (minutesPerWeek >= 150) return 0
  if (minutesPerWeek >= 90) return 15
  if (minutesPerWeek >= 30) return 25
  return 40
}

function adiposityFactor(
  waist_cm: number | null,
  sex: 'male' | 'female' | null
): number {
  if (!waist_cm) return 10 // unknown — partial penalty
  const threshold = sex === 'female' ? 88 : 102
  const borderline = sex === 'female' ? 80 : 94
  if (waist_cm > threshold) return 30
  if (waist_cm > borderline) return 15
  return 0
}

function smokingFactor(status: 'never' | 'former' | 'current'): number {
  if (status === 'current') return 50
  if (status === 'former') return 10
  return 0
}

// ─── Full CRP Proxy Score ─────────────────────────────────────────────────────
export function calcInflammationScore(log: InflammationLog): InflammationScore {
  const dietScore = calcAntiInflammatoryDietScore(log)
  const omegaRatio = calcOmegaRatio(log)

  const sf = sleepFactor(log.sleep_hours)
  const ef = exerciseFactor(log.exercise_minutes_week)
  const df = 100 - dietScore                          // higher diet score = lower inflammation
  const stf = Math.min(50, log.stress_level * 5)
  const af = adiposityFactor(log.waist_cm, log.biological_sex)
  const smf = smokingFactor(log.smoking_status)

  const crpProxy = Math.round(
    sf * 0.20 +
    ef * 0.20 +
    df * 0.25 +
    stf * 0.15 +
    af * 0.10 +
    smf * 0.10
  )

  const dii = calcDIICategory(log)
  const ratioCategory = omegaRatioCategory(omegaRatio)

  // Identify top drivers (highest factor contributions)
  const drivers: { label: string; value: number }[] = [
    { label: 'Poor diet / low anti-inflammatory foods', value: df * 0.25 },
    { label: 'Insufficient sleep', value: sf * 0.20 },
    { label: 'Low physical activity', value: ef * 0.20 },
    { label: 'High stress levels', value: stf * 0.15 },
    { label: 'Elevated waist circumference', value: af * 0.10 },
    { label: 'Smoking exposure', value: smf * 0.10 },
  ]
  const top_drivers = drivers
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((d) => d.label)

  const recommendations: string[] = []
  if (sf > 0) recommendations.push('Aim for 7–9 hours of sleep to reduce CRP by up to 40%')
  if (ef > 15) recommendations.push('Target 150+ min/week of moderate exercise (e.g., brisk walking)')
  if (dietScore < 50) recommendations.push('Add omega-3 rich fish (salmon/sardines) 2× per week')
  if (dietScore < 50) recommendations.push('Include turmeric + black pepper daily for curcumin bioavailability')
  if (stf > 20) recommendations.push('Practice 10 min daily mindfulness or box breathing to lower cortisol')
  if (omegaRatio > 8) recommendations.push('Reduce vegetable oils; swap for olive oil to improve omega-6:3 ratio')
  if (log.sugar_drinks > 1) recommendations.push('Swap sugar-sweetened drinks for green tea or water')
  if (log.processed_meat > 1) recommendations.push('Limit processed meat; substitute legumes or fatty fish')
  if (smf > 0) recommendations.push('Smoking cessation reduces CRP within weeks — consult your GP')
  if (log.vegetables_servings < 5) recommendations.push('Target 5+ servings of colourful vegetables daily')
  if (log.berries_servings < 1) recommendations.push('Add berries (blueberries/strawberries) — rich in flavonoids')

  return {
    total: crpProxy,
    crp_proxy: crpProxy,
    anti_inflammatory_diet_score: dietScore,
    omega_ratio: omegaRatio,
    omega_ratio_category: ratioCategory,
    dii_category: dii,
    sleep_factor: sf,
    exercise_factor: ef,
    diet_factor: df,
    stress_factor: stf,
    adiposity_factor: af,
    smoking_factor: smf,
    top_drivers,
    recommendations,
  }
}

export function crpProxyColor(score: number): string {
  if (score <= 20) return '#22c55e'  // green-500 — low
  if (score <= 40) return '#eab308'  // yellow-500 — moderate
  if (score <= 60) return '#f97316'  // orange-500 — high
  return '#ef4444'                    // red-500 — very high
}

export function crpProxyLabel(score: number): string {
  if (score <= 20) return 'Low'
  if (score <= 40) return 'Moderate'
  if (score <= 60) return 'High'
  return 'Very High'
}

export function diiCategoryColor(cat: InflammationScore['dii_category']): string {
  if (cat === 'Anti-inflammatory') return '#22c55e'
  if (cat === 'Neutral') return '#eab308'
  if (cat === 'Pro-inflammatory') return '#f97316'
  return '#ef4444'
}

// ─── Anti-inflammatory foods reference database ──────────────────────────────
export interface AntiInflammatoryFood {
  name: string
  emoji: string
  category: string
  inflammation_rating: 'Excellent' | 'Good' | 'Moderate' | 'Neutral'
  key_compounds: string[]
  omega3_mg_per_serving?: number
  tip: string
}

export const ANTI_INFLAMMATORY_FOODS: AntiInflammatoryFood[] = [
  {
    name: 'Wild Salmon',
    emoji: '🐟',
    category: 'Fish',
    inflammation_rating: 'Excellent',
    key_compounds: ['EPA', 'DHA', 'Astaxanthin'],
    omega3_mg_per_serving: 2200,
    tip: '85g serving provides ~2g EPA+DHA — target 2× per week',
  },
  {
    name: 'Sardines',
    emoji: '🐠',
    category: 'Fish',
    inflammation_rating: 'Excellent',
    key_compounds: ['EPA', 'DHA', 'Vitamin D'],
    omega3_mg_per_serving: 1900,
    tip: 'Canned sardines are economical and high in omega-3',
  },
  {
    name: 'Mackerel',
    emoji: '🐡',
    category: 'Fish',
    inflammation_rating: 'Excellent',
    key_compounds: ['EPA', 'DHA', 'CoQ10'],
    omega3_mg_per_serving: 2600,
    tip: 'One of the highest EPA/DHA sources per serving',
  },
  {
    name: 'Turmeric',
    emoji: '🟡',
    category: 'Spice',
    inflammation_rating: 'Excellent',
    key_compounds: ['Curcumin'],
    tip: 'Combine with black pepper (piperine) to increase absorption 20×',
  },
  {
    name: 'Ginger',
    emoji: '🫚',
    category: 'Spice',
    inflammation_rating: 'Excellent',
    key_compounds: ['Gingerols', 'Shogaols'],
    tip: 'Fresh or powdered — inhibits NF-κB and COX-2 pathways',
  },
  {
    name: 'Blueberries',
    emoji: '🫐',
    category: 'Berries',
    inflammation_rating: 'Excellent',
    key_compounds: ['Anthocyanins', 'Pterostilbene', 'Quercetin'],
    tip: '½ cup daily linked to lower CRP and IL-6',
  },
  {
    name: 'Tart Cherries',
    emoji: '🍒',
    category: 'Berries',
    inflammation_rating: 'Excellent',
    key_compounds: ['Anthocyanins', 'Melatonin'],
    tip: 'Particularly effective for post-exercise inflammation',
  },
  {
    name: 'Leafy Greens',
    emoji: '🥬',
    category: 'Vegetables',
    inflammation_rating: 'Excellent',
    key_compounds: ['Vitamin K', 'Quercetin', 'Magnesium'],
    tip: 'Spinach, kale, Swiss chard — aim for 2+ servings daily',
  },
  {
    name: 'Broccoli',
    emoji: '🥦',
    category: 'Vegetables',
    inflammation_rating: 'Excellent',
    key_compounds: ['Sulforaphane', 'Glucosinolates'],
    tip: 'Lightly steam to preserve sulforaphane — potent NF-κB inhibitor',
  },
  {
    name: 'Extra Virgin Olive Oil',
    emoji: '🫒',
    category: 'Fat',
    inflammation_rating: 'Excellent',
    key_compounds: ['Oleocanthal', 'Polyphenols', 'Oleic acid'],
    tip: 'Oleocanthal acts similarly to ibuprofen — use cold/low heat',
  },
  {
    name: 'Walnuts',
    emoji: '🥜',
    category: 'Nuts & Seeds',
    inflammation_rating: 'Good',
    key_compounds: ['ALA', 'Ellagic acid', 'Polyphenols'],
    omega3_mg_per_serving: 2570,
    tip: 'ALA omega-3 — partial conversion to EPA/DHA',
  },
  {
    name: 'Flaxseeds',
    emoji: '🌱',
    category: 'Nuts & Seeds',
    inflammation_rating: 'Good',
    key_compounds: ['ALA', 'Lignans', 'Fiber'],
    omega3_mg_per_serving: 2350,
    tip: 'Grind before eating for maximum ALA absorption',
  },
  {
    name: 'Chia Seeds',
    emoji: '⚫',
    category: 'Nuts & Seeds',
    inflammation_rating: 'Good',
    key_compounds: ['ALA', 'Fiber', 'Quercetin'],
    omega3_mg_per_serving: 5100,
    tip: 'Highest plant-based ALA per gram',
  },
  {
    name: 'Green Tea',
    emoji: '🍵',
    category: 'Beverages',
    inflammation_rating: 'Excellent',
    key_compounds: ['EGCG', 'Catechins', 'L-theanine'],
    tip: 'EGCG inhibits pro-inflammatory cytokines — 2-3 cups daily',
  },
  {
    name: 'Dark Chocolate',
    emoji: '🍫',
    category: 'Other',
    inflammation_rating: 'Good',
    key_compounds: ['Flavanols', 'Resveratrol'],
    tip: '70%+ cacao — 30g/day associated with lower CRP',
  },
  {
    name: 'Avocado',
    emoji: '🥑',
    category: 'Fat',
    inflammation_rating: 'Good',
    key_compounds: ['Oleic acid', 'Vitamin E', 'Lutein'],
    tip: 'Monounsaturated fats reduce IL-6 and TNF-α',
  },
  {
    name: 'Garlic',
    emoji: '🧄',
    category: 'Vegetables',
    inflammation_rating: 'Good',
    key_compounds: ['Allicin', 'Diallyl sulfide'],
    tip: 'Crush and let rest 10 min before cooking to activate allicin',
  },
  {
    name: 'Pomegranate',
    emoji: '🍎',
    category: 'Fruits',
    inflammation_rating: 'Good',
    key_compounds: ['Ellagitannins', 'Punicalagin'],
    tip: 'Punicalagin reduces CRP — unique to pomegranate',
  },
  {
    name: 'Mushrooms',
    emoji: '🍄',
    category: 'Vegetables',
    inflammation_rating: 'Good',
    key_compounds: ['Beta-glucans', 'Ergothioneine', 'Vitamin D2'],
    tip: 'Sun-dried mushrooms boost vitamin D — immune modulation',
  },
  {
    name: 'Bone Broth',
    emoji: '🍲',
    category: 'Other',
    inflammation_rating: 'Good',
    key_compounds: ['Glycine', 'Collagen peptides', 'Proline'],
    tip: 'Glycine is a potent anti-inflammatory amino acid',
  },
  {
    name: 'Fermented Foods',
    emoji: '🥛',
    category: 'Gut Health',
    inflammation_rating: 'Good',
    key_compounds: ['Probiotics', 'Short-chain fatty acids'],
    tip: 'Kimchi, kefir, yoghurt — gut microbiome modulates systemic inflammation',
  },
  {
    name: 'Beets',
    emoji: '🫐',
    category: 'Vegetables',
    inflammation_rating: 'Good',
    key_compounds: ['Betalains', 'Nitrates'],
    tip: 'Betalains inhibit COX enzyme — similar to NSAIDs',
  },
]

// ─── Inflammatory triggers ────────────────────────────────────────────────────
export interface InflammatoryTrigger {
  name: string
  emoji: string
  mechanism: string
  impact: 'High' | 'Medium' | 'Low'
  examples: string[]
}

export const INFLAMMATORY_TRIGGERS: InflammatoryTrigger[] = [
  {
    name: 'Trans Fats',
    emoji: '⚠️',
    mechanism: 'Activates NF-κB, raises LDL, lowers HDL',
    impact: 'High',
    examples: ['Partially hydrogenated oils', 'Margarine', 'Packaged pastries', 'Fried fast food'],
  },
  {
    name: 'Refined Sugar & HFCS',
    emoji: '🍬',
    mechanism: 'Triggers AGEs, insulin spikes, oxidative stress',
    impact: 'High',
    examples: ['Soda', 'Candy', 'Sweetened cereals', 'Fruit juices', 'Sports drinks'],
  },
  {
    name: 'Excess Omega-6 Oils',
    emoji: '🫙',
    mechanism: 'Competes with omega-3, converts to arachidonic acid',
    impact: 'High',
    examples: ['Corn oil', 'Soybean oil', 'Sunflower oil', 'Safflower oil'],
  },
  {
    name: 'Processed Meat',
    emoji: '🌭',
    mechanism: 'Advanced glycation end-products, nitrosamines',
    impact: 'High',
    examples: ['Hot dogs', 'Bacon', 'Deli meats', 'Sausages', 'Pepperoni'],
  },
  {
    name: 'Refined Carbohydrates',
    emoji: '🍞',
    mechanism: 'Rapid glucose spike → insulin resistance → IL-6↑',
    impact: 'Medium',
    examples: ['White bread', 'White pasta', 'White rice', 'Crackers'],
  },
  {
    name: 'Alcohol (excess)',
    emoji: '🍺',
    mechanism: 'Leaky gut, microbiome disruption, liver inflammation',
    impact: 'High',
    examples: ['More than 14 units/week', 'Binge drinking episodes'],
  },
  {
    name: 'Artificial Additives',
    emoji: '🧪',
    mechanism: 'Disrupts gut microbiome, triggers immune response',
    impact: 'Medium',
    examples: ['Emulsifiers (carrageenan)', 'Artificial sweeteners', 'Food dyes'],
  },
  {
    name: 'Chronic Sleep Deprivation',
    emoji: '😴',
    mechanism: 'Elevates IL-6, CRP, TNF-α within 1 week',
    impact: 'High',
    examples: ['Less than 6h consistently', 'Irregular sleep schedule', 'Late shift work'],
  },
  {
    name: 'Chronic Psychological Stress',
    emoji: '😰',
    mechanism: 'HPA axis dysregulation → sustained cortisol → NF-κB activation',
    impact: 'High',
    examples: ['Work burnout', 'Relationship conflict', 'Financial stress'],
  },
  {
    name: 'Sedentary Behaviour',
    emoji: '🛋️',
    mechanism: 'Adipose tissue secretes pro-inflammatory adipokines',
    impact: 'Medium',
    examples: ['<5,000 steps/day', 'Long uninterrupted sitting', 'No structured exercise'],
  },
]

// ─── Mediterranean diet adherence checklist ──────────────────────────────────
export interface MedDietItem {
  id: string
  label: string
  description: string
  category: string
}

export const MED_DIET_CHECKLIST: MedDietItem[] = [
  { id: 'olive_oil', label: 'Olive oil as main fat', description: '≥4 tablespoons of EVOO today', category: 'Fats' },
  { id: 'vegetables', label: '5+ vegetable servings', description: 'At least 2 large portions of vegetables', category: 'Vegetables' },
  { id: 'fruit', label: '3+ fruit servings', description: 'Including berries or citrus', category: 'Fruits' },
  { id: 'legumes', label: 'Legumes (weekly)', description: 'Lentils, chickpeas, or beans ≥3×/week', category: 'Protein' },
  { id: 'fish', label: 'Fatty fish this week', description: 'Salmon, sardines, mackerel ≥2×/week', category: 'Protein' },
  { id: 'whole_grains', label: 'Whole grains only', description: 'Brown rice, quinoa, oats — no refined grains', category: 'Grains' },
  { id: 'nuts', label: 'Handful of nuts', description: '30g of walnuts, almonds, or pistachios', category: 'Nuts' },
  { id: 'no_red_meat', label: 'Minimal red/processed meat', description: '≤2 servings/week, avoid processed', category: 'Protein' },
  { id: 'herbs_spices', label: 'Herbs & spices used', description: 'Including garlic, turmeric, oregano, rosemary', category: 'Flavour' },
  { id: 'no_sugar_drinks', label: 'No sugar-sweetened drinks', description: 'Water, green tea, or herbal tea only', category: 'Beverages' },
  { id: 'fermented', label: 'Fermented food', description: 'Yoghurt, kefir, or fermented vegetables', category: 'Gut Health' },
  { id: 'social_meal', label: 'Mindful eating', description: 'Eaten without screens; savoured meal', category: 'Lifestyle' },
]

/**
 * Allergy & Food Sensitivity Tracker
 *
 * References:
 * - EU Regulation 1169/2011 — 14 major food allergens mandatory labeling
 * - Gibson & Shepherd 2010 — FODMAP classification for IBS
 * - Caffarelli et al. 2010 — food allergy prevalence in children
 * - Turnbull et al. 2015 — FODMAP diet evidence review
 * - Monash University FODMAP app data (public research tier)
 */

// ─── EU 14 Major Allergens ─────────────────────────────────────────────────────

export const EU_ALLERGENS = [
  { id: 'gluten',      label: 'Gluten',              sources: ['wheat','barley','rye','oats','spelt','kamut'] },
  { id: 'crustaceans', label: 'Crustaceans',          sources: ['crab','lobster','shrimp','prawn','crayfish'] },
  { id: 'eggs',        label: 'Eggs',                 sources: ['egg','albumin','mayonnaise','meringue'] },
  { id: 'fish',        label: 'Fish',                 sources: ['cod','salmon','tuna','anchovy','bass','halibut'] },
  { id: 'peanuts',     label: 'Peanuts',              sources: ['peanut','groundnut','arachis oil'] },
  { id: 'soybeans',    label: 'Soybeans',             sources: ['soy','tofu','tempeh','miso','edamame'] },
  { id: 'milk',        label: 'Milk / Dairy',         sources: ['milk','cream','butter','cheese','whey','casein','lactose'] },
  { id: 'nuts',        label: 'Tree Nuts',            sources: ['almond','hazelnut','walnut','cashew','pecan','pistachio','macadamia','brazil nut'] },
  { id: 'celery',      label: 'Celery',               sources: ['celery','celeriac'] },
  { id: 'mustard',     label: 'Mustard',              sources: ['mustard','mustard seed','mustard leaf'] },
  { id: 'sesame',      label: 'Sesame',               sources: ['sesame','tahini','til','gingelly'] },
  { id: 'sulphites',   label: 'Sulphur Dioxide',      sources: ['sulphites','sulfites','sulphur dioxide','E220','E221','E222','E223','E224','E225','E226','E227','E228'] },
  { id: 'lupin',       label: 'Lupin',                sources: ['lupin','lupine'] },
  { id: 'molluscs',    label: 'Molluscs',             sources: ['squid','oyster','mussel','clam','scallop','snail','octopus'] },
] as const

export type AllergenId = typeof EU_ALLERGENS[number]['id']

// ─── FODMAP Categories (Monash University framework) ──────────────────────────

export type FodmapCategory = 'fructose' | 'lactose' | 'fructans' | 'galactans' | 'polyols'

export interface FodmapFood {
  name: string
  categories: FodmapCategory[]
  threshold?: string   // serving size where it becomes high-FODMAP
  notes?: string
}

export const HIGH_FODMAP_FOODS: FodmapFood[] = [
  // Fructose (excess)
  { name: 'Apple',         categories: ['fructose'], threshold: '1 medium', notes: 'Sorbitol also present' },
  { name: 'Mango',         categories: ['fructose'], threshold: '1 cup' },
  { name: 'Pear',          categories: ['fructose','polyols'], threshold: '½ medium' },
  { name: 'Honey',         categories: ['fructose'], threshold: '1 tsp' },
  { name: 'High-fructose corn syrup', categories: ['fructose'] },
  // Lactose
  { name: 'Cow milk',      categories: ['lactose'], threshold: '100ml' },
  { name: 'Soft cheese',   categories: ['lactose'], threshold: '2 tbsp' },
  { name: 'Ice cream',     categories: ['lactose'], threshold: '½ cup' },
  { name: 'Yoghurt (regular)', categories: ['lactose'], threshold: '¾ cup' },
  // Fructans
  { name: 'Wheat bread',   categories: ['fructans'], threshold: '2 slices' },
  { name: 'Onion',         categories: ['fructans'], threshold: '½ medium', notes: 'Highest FODMAP vegetable' },
  { name: 'Garlic',        categories: ['fructans'], threshold: '1 clove' },
  { name: 'Rye bread',     categories: ['fructans'], threshold: '1 slice' },
  { name: 'Artichoke',     categories: ['fructans','fructose'] },
  // Galactans (GOS)
  { name: 'Chickpeas',     categories: ['galactans'], threshold: '¼ cup canned', notes: 'Rinsing reduces FODMAP by 40%' },
  { name: 'Lentils',       categories: ['galactans'], threshold: '¼ cup canned' },
  { name: 'Kidney beans',  categories: ['galactans'], threshold: '¼ cup' },
  { name: 'Cashews',       categories: ['galactans'], threshold: '10 nuts' },
  // Polyols (sorbitol/mannitol)
  { name: 'Mushrooms',     categories: ['polyols'], threshold: '1 cup', notes: 'Mannitol' },
  { name: 'Cauliflower',   categories: ['polyols'], threshold: '½ cup', notes: 'Mannitol' },
  { name: 'Avocado',       categories: ['polyols'], threshold: '¼ avocado', notes: 'Sorbitol' },
  { name: 'Stone fruits',  categories: ['polyols'], notes: 'Peach, plum, nectarine, cherry — sorbitol' },
  { name: 'Xylitol (sweetener)', categories: ['polyols'] },
  { name: 'Sorbitol (E420)',     categories: ['polyols'] },
]

export const LOW_FODMAP_SAFE_FOODS = [
  'Banana (firm)', 'Blueberries', 'Grapes', 'Kiwi', 'Oranges', 'Strawberries',
  'Carrots', 'Cucumbers', 'Lettuce', 'Potatoes', 'Tomatoes (common)', 'Zucchini',
  'Chicken', 'Beef', 'Pork', 'Fish', 'Eggs', 'Tofu (firm)',
  'Almond milk', 'Lactose-free dairy', 'Hard cheeses (cheddar, parmesan)',
  'Oats (plain)', 'White rice', 'Quinoa', 'Corn tortillas', 'Sourdough spelt bread',
  'Walnuts', 'Macadamia', 'Peanuts (2 tbsp)',
]

// ─── Sensitivity Profile ───────────────────────────────────────────────────────

export type SensitivitySeverity = 'none' | 'mild' | 'moderate' | 'severe' | 'anaphylactic'

export interface AllergenProfile {
  allergenId: AllergenId
  severity: SensitivitySeverity
  diagnosed: boolean       // true = doctor confirmed, false = self-reported
  notes?: string
}

export interface SensitivityProfile {
  allergens: AllergenProfile[]
  fodmapCategories: FodmapCategory[]    // which FODMAP categories trigger symptoms
  otherTriggers: string[]               // free-text (e.g. "caffeine", "MSG")
  dietaryMode: 'elimination' | 'reintroduction' | 'maintenance' | 'none'
  eliminationStartDate?: string
}

// ─── Ingredient scanner ───────────────────────────────────────────────────────

export interface AllergenScanResult {
  allergenId: AllergenId
  label: string
  found: boolean
  matchedTerms: string[]
  severity?: SensitivitySeverity  // from user profile
}

export interface FodmapScanResult {
  category: FodmapCategory
  foods: string[]
  userSensitive: boolean
}

export interface IngredientScanReport {
  ingredients: string
  allergenResults: AllergenScanResult[]
  fodmapResults: FodmapScanResult[]
  riskLevel: 'safe' | 'caution' | 'danger' | 'critical'
  warnings: string[]
  safe: boolean
}

export function scanIngredients(
  ingredientsText: string,
  profile: SensitivityProfile
): IngredientScanReport {
  const lower = ingredientsText.toLowerCase()
  const words = lower.split(/[\s,;()/\[\]]+/).filter(Boolean)

  // Allergen scan
  const allergenResults: AllergenScanResult[] = EU_ALLERGENS.map(allergen => {
    const matched = allergen.sources.filter(src =>
      words.some(w => w.includes(src)) || lower.includes(src)
    )
    const profileEntry = profile.allergens.find(a => a.allergenId === allergen.id)
    return {
      allergenId: allergen.id,
      label: allergen.label,
      found: matched.length > 0,
      matchedTerms: matched,
      severity: profileEntry?.severity,
    }
  })

  // FODMAP scan — check for known FODMAP-containing words
  const fodmapResults: FodmapScanResult[] = (['fructose','lactose','fructans','galactans','polyols'] as FodmapCategory[]).map(cat => {
    const catFoods = HIGH_FODMAP_FOODS.filter(f => f.categories.includes(cat))
    const foundFoods = catFoods.filter(f =>
      lower.includes(f.name.toLowerCase().split(' ')[0])
    ).map(f => f.name)
    return {
      category: cat,
      foods: foundFoods,
      userSensitive: profile.fodmapCategories.includes(cat),
    }
  })

  // Build warnings
  const warnings: string[] = []
  let riskLevel: IngredientScanReport['riskLevel'] = 'safe'

  for (const res of allergenResults) {
    if (!res.found) continue
    const severity = res.severity ?? 'none'
    if (severity === 'anaphylactic') {
      warnings.push(`⚠️ DANGER: Contains ${res.label} — you have an anaphylactic reaction history. Do NOT consume.`)
      riskLevel = 'critical'
    } else if (severity === 'severe') {
      warnings.push(`❌ Contains ${res.label} — severe sensitivity detected.`)
      if (riskLevel !== 'critical') riskLevel = 'danger'
    } else if (severity === 'moderate' || severity === 'mild') {
      warnings.push(`⚠️ Contains ${res.label} — ${severity} sensitivity.`)
      if (riskLevel === 'safe') riskLevel = 'caution'
    }
  }

  for (const res of fodmapResults) {
    if (res.foods.length > 0 && res.userSensitive) {
      warnings.push(`🔶 High-FODMAP ingredient detected (${res.category}): ${res.foods.join(', ')}`)
      if (riskLevel === 'safe') riskLevel = 'caution'
    }
  }

  return {
    ingredients: ingredientsText,
    allergenResults,
    fodmapResults,
    riskLevel,
    warnings,
    safe: riskLevel === 'safe',
  }
}

// ─── Elimination Diet Protocol ────────────────────────────────────────────────

export type EliminationPhase = 'elimination' | 'reintroduction' | 'maintenance'

export interface ReintroductionStep {
  day: number
  food: string
  allergenId?: AllergenId
  instructions: string
  symptoms: string[]      // logged by user
  reaction: 'none' | 'mild' | 'moderate' | 'severe' | 'pending'
}

export interface EliminationProtocol {
  phase: EliminationPhase
  startDate: string
  eliminationDurationDays: number   // typically 21–28 days
  targetAllergens: AllergenId[]
  reintroductionSteps: ReintroductionStep[]
  notes: string
}

export function generateReintroductionPlan(targetAllergens: AllergenId[]): ReintroductionStep[] {
  // Standard protocol: introduce one food every 3 days, monitor for 72h
  // Based on British Dietetic Association elimination diet guidelines
  const steps: ReintroductionStep[] = []
  let day = 1
  for (const allergenId of targetAllergens) {
    const allergen = EU_ALLERGENS.find(a => a.id === allergenId)
    if (!allergen) continue
    const testFood = allergen.sources[0]
    steps.push({
      day,
      food: testFood,
      allergenId,
      instructions: `Eat a small portion of ${testFood} (${allergen.label}) at breakfast. Monitor symptoms for 72 hours before trying the next food.`,
      symptoms: [],
      reaction: 'pending',
    })
    day += 3
  }
  return steps
}

// ─── Symptom logger ───────────────────────────────────────────────────────────

export type SymptomType =
  | 'bloating' | 'gas' | 'diarrhea' | 'constipation' | 'stomach_pain'
  | 'nausea' | 'skin_rash' | 'hives' | 'itching' | 'runny_nose'
  | 'sneezing' | 'headache' | 'fatigue' | 'brain_fog' | 'throat_tightness'

export const SYMPTOM_LABELS: Record<SymptomType, string> = {
  bloating: 'Bloating', gas: 'Gas / Flatulence', diarrhea: 'Diarrhea',
  constipation: 'Constipation', stomach_pain: 'Stomach Pain', nausea: 'Nausea',
  skin_rash: 'Skin Rash', hives: 'Hives', itching: 'Itching',
  runny_nose: 'Runny Nose', sneezing: 'Sneezing', headache: 'Headache',
  fatigue: 'Fatigue', brain_fog: 'Brain Fog', throat_tightness: 'Throat Tightness ⚠️',
}

export interface SymptomEntry {
  timestamp: string
  symptoms: SymptomType[]
  severity: 1 | 2 | 3 | 4 | 5   // 1=minimal, 5=severe
  suspectedFood?: string
  notes?: string
}

export function classifySeverity(symptoms: SymptomType[]): 'mild' | 'moderate' | 'severe' | 'emergency' {
  if (symptoms.includes('throat_tightness')) return 'emergency'
  if (symptoms.includes('hives') && (symptoms.includes('nausea') || symptoms.includes('stomach_pain'))) return 'severe'
  if (symptoms.filter(s => ['bloating','gas','diarrhea','constipation','stomach_pain','nausea'].includes(s)).length >= 3) return 'moderate'
  return 'mild'
}

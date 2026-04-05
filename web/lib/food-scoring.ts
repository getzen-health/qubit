/**
 * ZenScore™ Food Scoring Algorithm
 *
 * A Yuka-inspired, research-informed health score for packaged food products.
 * Synthesizes evidence from:
 *   - NutriScore (Santé publique France) — nutritional quality
 *   - NOVA Classification (PAHO/WHO) — food processing level taxonomy
 *   - IARC Carcinogen Classifications (WHO, 2023–2024)
 *   - EFSA Additive Safety Opinions (EU, 2022–2024)
 *   - BMJ Umbrella Review on Ultra-Processed Foods (2024, ~10M participants)
 *
 * Score: 0–100
 * Grades: A+ (≥85) | A (≥70) | B (≥55) | C (≥35) | D (≥15) | F (<15)
 *
 * Four pillars (max total = 100):
 *  1. Nutrient Balance      50 pts — positive/negative nutrient density + NutriScore signal
 *  2. Additive Safety       25 pts — IARC/EFSA tiered additive risk
 *  3. Processing Integrity  15 pts — NOVA classification
 *  4. Ingredient Quality    10 pts — whole-food firsts, organic, artificial inputs
 */

// ──────────────────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────────────────

export type FoodGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'

export interface Nutriments {
  'energy-kcal_100g'?: number
  sugars_100g?: number
  'added-sugars_100g'?: number
  'saturated-fat_100g'?: number
  'trans-fat_100g'?: number
  sodium_100g?: number
  fiber_100g?: number
  proteins_100g?: number
  carbohydrates_100g?: number
  'vitamin-c_100g'?: number
  'vitamin-d_100g'?: number
  iron_100g?: number
  calcium_100g?: number
  potassium_100g?: number
  'omega-3-fat_100g'?: number
  'fruits-vegetables-nuts-estimate-from-ingredients_100g'?: number
  [key: string]: number | undefined
}

export interface FoodProduct {
  nutriments?: Nutriments
  additives_tags?: string[]
  additives_original_tags?: string[]
  labels?: string
  labels_tags?: string[]
  nova_group?: number
  nutriscore_grade?: string
  ingredients_text?: string
  ingredients_tags?: string[]
  categories_tags?: string[]
}

export interface UserProfile {
  primary_goal?: string
  health_conditions?: string[]
  dietary_preferences?: string[]
}

export interface ScorePillar {
  score: number
  max: number
  label: string
  detail: string
}

export interface ZenScoreResult {
  score: number
  grade: FoodGrade
  pillars: {
    nutrientBalance: ScorePillar
    processingIntegrity: ScorePillar
    additiveSafety: ScorePillar
    ingredientQuality: ScorePillar
  }
  components: {
    nutrientBalance: number
    processingIntegrity: number
    additiveSafety: number
    ingredientQuality: number
    nutrition: number  // legacy compat
    additives: number  // legacy compat
    organic: number    // legacy compat
  }
  flags: string[]
}

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// ──────────────────────────────────────────────────────────────────────────────
// PILLAR 1: NUTRIENT BALANCE (0–50 pts)
// NutriScore-informed model: higher base, gentler penalties for natural sugars,
// NutriScore grade as a strong signal.
// ──────────────────────────────────────────────────────────────────────────────

function calcNutrientBalance(product: FoodProduct): { score: number; detail: string } {
  const n = product.nutriments ?? {}
  // Unit conversions to mg for comparison against EU Daily Reference Values
  const fiber   = n.fiber_100g ?? 0                          // g/100g
  const protein = n.proteins_100g ?? 0                       // g/100g
  const vitC    = (n['vitamin-c_100g'] ?? 0) * 1000          // g → mg
  const vitD    = (n['vitamin-d_100g'] ?? 0) * 1_000_000     // g → µg
  const iron    = (n.iron_100g ?? 0) * 1000                  // g → mg
  const calcium = (n.calcium_100g ?? 0) * 1000               // g → mg
  const potassium = (n.potassium_100g ?? 0) * 1000           // g → mg
  const fruitsVeg = n['fruits-vegetables-nuts-estimate-from-ingredients_100g'] ?? 0

  // Positive nutrients (lower thresholds for gentler scoring)
  const posScore =
    clamp(fiber   /  5,    0, 1) * 6 +
    clamp(protein / 10,    0, 1) * 5 +
    clamp(vitC    / 60,    0, 1) * 3 +
    clamp(vitD    /  5,    0, 1) * 2 +
    clamp(iron    / 10,    0, 1) * 2 +
    clamp(calcium / 800,   0, 1) * 2 +
    clamp(potassium / 2000, 0, 1) * 2 +
    clamp(fruitsVeg / 80,  0, 1) * 3

  // Sugar penalty: differentiate added vs natural sugars
  const addedSugar = n['added-sugars_100g']
  const totalSugar = n.sugars_100g ?? 0
  let sugarPenalty: number
  if (addedSugar !== undefined) {
    sugarPenalty = clamp(addedSugar / 25, 0, 1) * 10 + clamp((totalSugar - addedSugar) / 50, 0, 1) * 3
  } else {
    sugarPenalty = clamp(totalSugar / 40, 0, 1) * 8
  }

  const satFat  = n['saturated-fat_100g'] ?? 0
  const sodium  = (n.sodium_100g ?? 0) * 1000
  const transFat = n['trans-fat_100g'] ?? 0
  const energy  = n['energy-kcal_100g'] ?? 0

  const negPenalty = sugarPenalty +
    clamp(satFat  / 15,   0, 1) * 7 +
    clamp(sodium  / 1200, 0, 1) * 6 +
    clamp(transFat /  2,  0, 1) * 5 +
    (energy > 800 ? 3 : energy > 500 ? 1.5 : 0)

  // NutriScore grade as a strong signal
  let nutriScoreBonus = 0
  switch (product.nutriscore_grade?.toLowerCase()) {
    case 'a': nutriScoreBonus = 15; break
    case 'b': nutriScoreBonus = 10; break
    case 'c': nutriScoreBonus = 0; break
    case 'd': nutriScoreBonus = -8; break
    case 'e': nutriScoreBonus = -15; break
  }

  const raw = 28 + posScore - negPenalty + nutriScoreBonus
  const displaySugar = addedSugar ?? totalSugar
  return {
    score: clamp(Math.round(raw), 0, 50),
    detail: `Fiber ${fiber.toFixed(1)}g · Protein ${protein.toFixed(1)}g · Sugar ${displaySugar.toFixed(1)}g · Sodium ${Math.round(sodium)}mg`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PILLAR 2: PROCESSING INTEGRITY (0–15 pts)
// NOVA Classification (Monteiro et al., PAHO/WHO)
// ──────────────────────────────────────────────────────────────────────────────

const NOVA_BASE_SCORE: Record<number, number> = {
  1: 15,  // Unprocessed/minimally processed
  2: 12,  // Processed culinary ingredients
  3:  7,  // Processed foods
  4:  2,  // Ultra-processed
}

// Ingredient markers strongly indicative of ultra-processing (NOVA 4)
const UPF_MARKERS = [
  'high fructose corn syrup', 'corn syrup solids', 'hydrogenated', 'interesterified',
  'modified starch', 'maltodextrin', 'artificial flavor', 'artificial colour',
  'artificial sweetener', 'sodium nitrite', 'carrageenan', 'xanthan gum',
  'polysorbate', 'carboxymethyl', 'acesulfame', 'sucralose', 'aspartame',
  'saccharin', 'protein isolate', 'textured soy protein', 'hydrolysed',
  'soy lecithin', 'mono and diglycerides', 'diacetyl tartaric',
]

function inferNovaGroup(ingredientsText?: string): number {
  if (!ingredientsText) return 4 // Conservative: unknown ingredients assumed ultra-processed
  const text = ingredientsText.toLowerCase()
  const matchCount = UPF_MARKERS.filter(m => text.includes(m)).length
  if (matchCount >= 3) return 4
  if (matchCount >= 1) return 3
  const commaCount = (text.match(/,/g) || []).length
  return commaCount <= 3 ? 1 : 2
}

function calcProcessingIntegrity(product: FoodProduct): { score: number; detail: string; novaGroup: number } {
  const novaGroup = product.nova_group ?? inferNovaGroup(product.ingredients_text)
  const base = NOVA_BASE_SCORE[novaGroup] ?? 7
  const score = clamp(base, 0, 15)

  const novaLabels: Record<number, string> = {
    1: 'Unprocessed (NOVA 1) — best',
    2: 'Culinary ingredient (NOVA 2)',
    3: 'Processed food (NOVA 3)',
    4: 'Ultra-processed (NOVA 4) — linked to ↑CVD, cancer risk',
  }

  return {
    score,
    detail: novaLabels[novaGroup] ?? `NOVA group ${novaGroup}`,
    novaGroup,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PILLAR 3: ADDITIVE SAFETY (0–25 pts)
// Tiered by IARC Monograph classifications and EFSA safety opinions (2022–2024).
// ──────────────────────────────────────────────────────────────────────────────

// Tier A: IARC Group 1/2A confirmed/probable risk, or EFSA "of concern" 2022–2024
const TIER_A: Set<string> = new Set([
  'e102',  // Tartrazine — EFSA ADI exceeded in children; linked to hyperactivity
  'e104',  // Quinoline Yellow — EFSA concern; restricted several countries
  'e110',  // Sunset Yellow FCF — EFSA concern; hyperactivity in children
  'e122',  // Carmoisine — EFSA concern
  'e123',  // Amaranth — banned in the USA
  'e124',  // Ponceau 4R — EFSA concern
  'e129',  // Allura Red AC — EFSA 2023 re-evaluation, hyperactivity link
  'e171',  // Titanium Dioxide — banned EU June 2022 (EFSA 2021: genotoxic potential)
  'e250',  // Sodium Nitrite — IARC Group 2A (processed meat, colorectal cancer)
  'e251',  // Sodium Nitrate — IARC Group 2A
  'e249',  // Potassium Nitrite — IARC Group 2A
  'e924',  // Potassium Bromate — banned EU; IARC 2B, potentially Group 1 with new data
])

// Tier B: IARC Group 2B (possible carcinogen) or EFSA precautionary watch-list
const TIER_B: Set<string> = new Set([
  'e150d', // Sulphite-ammonia caramel — WHO concern at high intake
  'e210',  // Benzoic acid — linked to ADHD; benzoate-vitamin C interaction
  'e211',  // Sodium Benzoate — benzene formation with ascorbic acid; ADHD link
  'e212',  // Potassium Benzoate
  'e213',  // Calcium Benzoate
  'e320',  // BHA (Butylated hydroxyanisole) — IARC 2B possible carcinogen
  'e321',  // BHT (Butylated hydroxytoluene) — IARC 2B; accumulates in fat tissue
  'e407',  // Carrageenan — IARC 2B; EFSA 2018 re-evaluation ongoing
  'e950',  // Acesulfame-K — EFSA 2021 re-evaluation; limited long-term data
  'e951',  // Aspartame — IARC Group 2B (July 2023); WHO: "possibly carcinogenic"
  'e954',  // Saccharin — IARC 2B (historical); removed from US list but precautionary
  'e955',  // Sucralose — EFSA 2023 re-evaluation; thermal degradation products concern
  'e961',  // Neotame — limited long-term population data
  'e385',  // EDTA (calcium disodium) — chelating agent; bioavailability concern
])

// Tier C: Synthetic additives with low individual concern but cumulative uncertainty
const TIER_C: Set<string> = new Set([
  'e220', 'e221', 'e222', 'e223', 'e224',  // Sulphites — concern for asthmatics (known allergen)
  'e450', 'e451', 'e452',                   // Phosphates — high intake linked to kidney/cardiovascular
  'e460', 'e461', 'e464', 'e466',           // Modified cellulose — low concern but synthetic
  'e631', 'e627',                            // Ribonucleotides — gout concern at high intake
  'e621',                                    // MSG — high dose concern; Tier B crossover
])

function parseAdditiveCodes(tags: string[]): string[] {
  return tags
    .map(t => {
      const match = t.replace(/^en:/, '').toLowerCase().match(/e\d+[a-z]?/)
      return match ? match[0] : ''
    })
    .filter(Boolean)
}

function calcAdditiveSafety(product: FoodProduct): { score: number; detail: string; riskAdditives: string[] } {
  const tags = product.additives_tags ?? product.additives_original_tags ?? []
  const codes = parseAdditiveCodes(tags)

  if (codes.length === 0) {
    return { score: 25, detail: 'No additives detected', riskAdditives: [] }
  }

  let penalty = 0
  const riskAdditives: string[] = []
  const seenCodes = new Set<string>()

  for (const code of codes) {
    if (seenCodes.has(code)) continue
    seenCodes.add(code)
    if (TIER_A.has(code)) {
      penalty += 10
      riskAdditives.push(`${code.toUpperCase()} (EFSA/IARC high concern)`)
    } else if (TIER_B.has(code)) {
      penalty += 6
      riskAdditives.push(`${code.toUpperCase()} (IARC 2B / EFSA watch-list)`)
    } else if (TIER_C.has(code)) {
      penalty += 2
    }
  }

  const detail = riskAdditives.length > 0
    ? riskAdditives.slice(0, 2).join(' · ')
    : `${codes.length} additive${codes.length !== 1 ? 's' : ''} — all within low-concern tier`

  return {
    score: clamp(25 - penalty, 0, 25),
    detail,
    riskAdditives,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PILLAR 4: INGREDIENT QUALITY (0–10 pts)
// Evaluates what the food is made of: organic, whole grain, refined, artificial.
// ──────────────────────────────────────────────────────────────────────────────

const WHOLE_FOOD_MARKERS = [
  'whole grain', 'whole wheat', 'whole oats', 'oat bran', 'brown rice', 'quinoa',
  'lentils', 'chickpeas', 'black beans', 'kidney beans', 'almonds', 'walnuts',
  'sunflower seeds', 'flaxseed', 'chia seeds', 'spinach', 'broccoli', 'tomato paste',
  'apple puree', 'berries', 'olive oil', 'salmon', 'tuna', 'chicken breast',
]

const REFINED_FIRST_MARKERS = [
  'enriched flour', 'bleached flour', 'wheat flour', 'white flour',
  'corn syrup', 'high fructose corn syrup', 'corn syrup solids',
  'sugar', 'refined sugar', 'palm oil', 'partially hydrogenated',
  'modified corn starch', 'modified food starch', 'white rice',
]

const ARTIFICIAL_SWEETENER_MARKERS = [
  'aspartame', 'sucralose', 'acesulfame potassium', 'acesulfame-k',
  'saccharin', 'neotame', 'advantame', 'alitame',
]

function calcIngredientQuality(product: FoodProduct): { score: number; detail: string } {
  const text = (product.ingredients_text ?? '').toLowerCase()
  const labels = [product.labels ?? '', ...(product.labels_tags ?? [])].join(' ').toLowerCase()

  if (!text) return { score: 5, detail: 'Ingredient list unavailable — default score applied' }

  const top5 = text.split(/[,;(]/).map(s => s.trim()).slice(0, 5).join(' ')

  let score = 5  // neutral baseline

  const isOrganic = labels.includes('organic') || labels.includes('en:organic') || labels.includes('bio')
  if (isOrganic) score += 3

  const isWholeGrain = labels.includes('whole grain') || labels.includes('en:whole-grain')
  if (isWholeGrain) score += 1

  const wholeFoodHits = WHOLE_FOOD_MARKERS.filter(m => top5.includes(m)).length
  if (wholeFoodHits > 0) score += 1

  const refinedHits = REFINED_FIRST_MARKERS.filter(m => top5.includes(m)).length
  if (refinedHits > 0) score -= 2

  const hasSweetener = ARTIFICIAL_SWEETENER_MARKERS.some(m => text.includes(m))
  if (hasSweetener) score -= 3

  const parts: string[] = []
  if (isOrganic)     parts.push('Certified organic')
  if (isWholeGrain)  parts.push('Whole grain certified')
  if (hasSweetener)  parts.push('Contains artificial sweeteners')
  if (refinedHits > 0) parts.push(`${refinedHits} refined input${refinedHits > 1 ? 's' : ''} in top ingredients`)
  if (wholeFoodHits > 0) parts.push(`${wholeFoodHits} whole food ingredient${wholeFoodHits > 1 ? 's' : ''}`)

  return {
    score: clamp(Math.round(score), 0, 10),
    detail: parts.length > 0 ? parts.join(' · ') : 'Standard ingredient composition',
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN SCORER
// ──────────────────────────────────────────────────────────────────────────────

export function calculateZenScore(
  product: FoodProduct,
  _userProfile?: UserProfile,
): ZenScoreResult {
  const nutrientResult    = calcNutrientBalance(product)
  const additiveResult    = calcAdditiveSafety(product)
  const processingResult  = calcProcessingIntegrity(product)
  const ingredientResult  = calcIngredientQuality(product)

  const total = clamp(
    nutrientResult.score +
    additiveResult.score +
    processingResult.score +
    ingredientResult.score,
    0, 100,
  )

  let grade: FoodGrade
  if      (total >= 85) grade = 'A+'
  else if (total >= 70) grade = 'A'
  else if (total >= 55) grade = 'B'
  else if (total >= 35) grade = 'C'
  else if (total >= 15) grade = 'D'
  else                  grade = 'F'

  return {
    score: total,
    grade,
    flags: additiveResult.riskAdditives,
    pillars: {
      nutrientBalance:     { score: nutrientResult.score,   max: 50, label: 'Nutrient Balance',    detail: nutrientResult.detail },
      processingIntegrity: { score: processingResult.score, max: 15, label: 'Processing Level',   detail: processingResult.detail },
      additiveSafety:      { score: additiveResult.score,   max: 25, label: 'Additive Safety',    detail: additiveResult.detail },
      ingredientQuality:   { score: ingredientResult.score, max: 10, label: 'Ingredient Quality', detail: ingredientResult.detail },
    },
    components: {
      nutrientBalance:     nutrientResult.score,
      processingIntegrity: processingResult.score,
      additiveSafety:      additiveResult.score,
      ingredientQuality:   ingredientResult.score,
      // Legacy field aliases for existing DB columns / API consumers
      nutrition: nutrientResult.score,
      additives: additiveResult.score,
      organic:   0,
    },
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// ADDITIVE DETAIL EXPORT (used by scanner UI for ingredient breakdown)
// ──────────────────────────────────────────────────────────────────────────────

export type AdditiveRisk = 'high' | 'moderate' | 'low' | 'safe'

export function getAdditiveDetails(tags: string[]): Array<{ code: string; risk: AdditiveRisk }> {
  const codes = parseAdditiveCodes(tags)
  return codes.map(code => ({
    code: code.toUpperCase(),
    risk: TIER_A.has(code) ? 'high'
        : TIER_B.has(code) ? 'moderate'
        : TIER_C.has(code) ? 'low'
        : 'safe',
  }))
}

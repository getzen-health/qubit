/**
 * QuarkScore™ Food Scoring Algorithm
 *
 * A research-informed, multi-pillar health score for packaged food products.
 * Synthesizes evidence from:
 *   - Food Compass 2.0 (Tufts, Nature Food 2024) — 9-domain holistic profiling
 *   - NOVA Classification (PAHO/WHO) — food processing level taxonomy
 *   - NRFa11.3 (Frontiers in Nutrition 2024) — nutrient density index with bioactives
 *   - IARC Carcinogen Classifications (WHO, 2023–2024)
 *   - EFSA Additive Safety Opinions (EU, 2022–2024)
 *   - BMJ Umbrella Review on Ultra-Processed Foods (2024, ~10M participants)
 *
 * Score: 0–100
 * Grades: A+ (≥85) | A (≥70) | B (≥55) | C (≥35) | D (≥15) | F (<15)
 *
 * Five pillars (max total = 100):
 *  1. Nutrient Balance      35 pts — positive/negative nutrient density per 100 g
 *  2. Processing Integrity  25 pts — NOVA classification + ingredient complexity
 *  3. Additive Safety       20 pts — IARC/EFSA tiered additive risk
 *  4. Ingredient Quality    15 pts — whole-food firsts, artificial inputs, organic
 *  5. Context Fit            5 pts — personalized to user health goals/conditions
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

export interface QuarkScoreResult {
  score: number
  grade: FoodGrade
  pillars: {
    nutrientBalance: ScorePillar
    processingIntegrity: ScorePillar
    additiveSafety: ScorePillar
    ingredientQuality: ScorePillar
    contextFit: ScorePillar
  }
  components: {
    nutrientBalance: number
    processingIntegrity: number
    additiveSafety: number
    ingredientQuality: number
    contextFit: number
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
// PILLAR 1: NUTRIENT BALANCE (0–35 pts)
// NRFa11.3 model (Frontiers in Nutrition 2024): weighted positive nutrients
// minus weighted negative nutrients, evaluated per 100 g of product.
// ──────────────────────────────────────────────────────────────────────────────

function calcNutrientBalance(n: Nutriments): { score: number; detail: string } {
  // Unit conversions to mg for comparison against EU Daily Reference Values
  const fiber   = n.fiber_100g ?? 0                          // g/100g
  const protein = n.proteins_100g ?? 0                       // g/100g
  const vitC    = (n['vitamin-c_100g'] ?? 0) * 1000          // g → mg
  const vitD    = (n['vitamin-d_100g'] ?? 0) * 1_000_000     // g → µg
  const iron    = (n.iron_100g ?? 0) * 1000                  // g → mg
  const calcium = (n.calcium_100g ?? 0) * 1000               // g → mg
  const potassium = (n.potassium_100g ?? 0) * 1000           // g → mg
  const fruitsVeg = n['fruits-vegetables-nuts-estimate-from-ingredients_100g'] ?? 0

  // Positive nutrient density (weighted, capped at 1× contribution)
  // Weights reflect evidence strength from NRFa11.3 and Food Compass 2.0
  const posScore =
    clamp(fiber   /  7.5,  0, 1) * 12 +  // fiber: highest weight per DRV (25g/day)
    clamp(protein / 15,    0, 1) * 10 +  // protein: second highest weight
    clamp(vitC    / 80,    0, 1) *  4 +  // vitamin C (EU DRV 80mg/day)
    clamp(vitD    /  5,    0, 1) *  3 +  // vitamin D (EU DRV 5µg/day)
    clamp(iron    / 14,    0, 1) *  3 +  // iron (EU DRV 14mg/day)
    clamp(calcium / 1200,  0, 1) *  3 +  // calcium (EU DRV 1200mg/day)
    clamp(potassium / 3500, 0, 1) * 3 +  // potassium (EU DRV 3500mg/day)
    clamp(fruitsVeg / 100, 0, 1) *  3    // % fruits/veg/nuts in product

  // Negative nutrient penalties (WHO dietary guidelines 2023)
  const sugar   = n['added-sugars_100g'] ?? n.sugars_100g ?? 0  // g/100g
  const satFat  = n['saturated-fat_100g'] ?? 0                   // g/100g
  const sodium  = (n.sodium_100g ?? 0) * 1000                    // g → mg
  const transFat = n['trans-fat_100g'] ?? 0                      // g/100g
  const energy  = n['energy-kcal_100g'] ?? 0                     // kcal/100g

  const negPenalty =
    clamp(sugar   / 50,   0, 1) * 12 +  // >50g/100g sugar → full -12
    clamp(satFat  / 20,   0, 1) *  9 +  // >20g/100g saturated fat → full -9
    clamp(sodium  / 1500, 0, 1) *  8 +  // >1500mg/100g sodium → full -8
    clamp(transFat /  3,  0, 1) *  6 +  // any trans fat → up to -6
    (energy > 900 ? 4 : energy > 600 ? 2 : 0)  // energy density penalty

  // 14 base pts + earned positive nutrient points minus penalties
  const raw = 14 + posScore - negPenalty
  return {
    score: clamp(Math.round(raw), 0, 35),
    detail: `Fiber ${fiber.toFixed(1)}g · Protein ${protein.toFixed(1)}g · Sugar ${sugar.toFixed(1)}g · Sodium ${Math.round(sodium)}mg`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PILLAR 2: PROCESSING INTEGRITY (0–25 pts)
// NOVA Classification (Monteiro et al., PAHO/WHO) combined with BMJ 2024
// umbrella review showing NOVA 4 independently raises disease risk beyond
// nutrient content alone — a key differentiator from Nutri-Score/Yuka.
// ──────────────────────────────────────────────────────────────────────────────

const NOVA_BASE_SCORE: Record<number, number> = {
  1: 25,  // Unprocessed/minimally processed (whole fruits, veg, eggs, plain meat)
  2: 20,  // Processed culinary ingredients (oils, flour, sugar, salt, butter)
  3: 12,  // Processed foods (canned goods, fermented foods, bread, smoked fish)
  4:  4,  // Ultra-processed (packaged snacks, soft drinks, reconstituted meat products)
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
  if (!ingredientsText) return 3
  const text = ingredientsText.toLowerCase()
  const matchCount = UPF_MARKERS.filter(m => text.includes(m)).length
  if (matchCount >= 3) return 4
  if (matchCount >= 1) return 3
  const commaCount = (text.match(/,/g) || []).length
  return commaCount <= 3 ? 1 : 2
}

function calcProcessingIntegrity(product: FoodProduct): { score: number; detail: string; novaGroup: number } {
  const novaGroup = product.nova_group ?? inferNovaGroup(product.ingredients_text)
  const base = NOVA_BASE_SCORE[novaGroup] ?? 12

  // Additional penalty for very complex ingredient lists within NOVA 4
  const ingredientCount = (product.ingredients_text ?? '').split(',').length
  const complexityPenalty = novaGroup === 4 ? Math.min(3, Math.floor(ingredientCount / 12)) : 0

  const novaLabels: Record<number, string> = {
    1: 'Unprocessed (NOVA 1) — best',
    2: 'Culinary ingredient (NOVA 2)',
    3: 'Processed food (NOVA 3)',
    4: 'Ultra-processed (NOVA 4) — BMJ: ↑CVD, cancer, mortality risk',
  }

  return {
    score: clamp(base - complexityPenalty, 0, 25),
    detail: novaLabels[novaGroup] ?? `NOVA group ${novaGroup}`,
    novaGroup,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PILLAR 3: ADDITIVE SAFETY (0–20 pts)
// Tiered by IARC Monograph classifications and EFSA safety opinions (2022–2024).
// Sources: IARC Vol 132 (nitrites/nitrates), EFSA 2022 (TiO2 ban), EFSA 2023
// (sucralose re-evaluation), IARC 2023 (aspartame Group 2B).
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
    return { score: 20, detail: 'No additives detected', riskAdditives: [] }
  }

  let penalty = 0
  const riskAdditives: string[] = []
  const seenCodes = new Set<string>()

  for (const code of codes) {
    if (seenCodes.has(code)) continue
    seenCodes.add(code)
    if (TIER_A.has(code)) {
      penalty += 8
      riskAdditives.push(`${code.toUpperCase()} (EFSA/IARC high concern)`)
    } else if (TIER_B.has(code)) {
      penalty += 4
      riskAdditives.push(`${code.toUpperCase()} (IARC 2B / EFSA watch-list)`)
    } else if (TIER_C.has(code)) {
      penalty += 1
    }
  }

  const detail = riskAdditives.length > 0
    ? riskAdditives.slice(0, 2).join(' · ')
    : `${codes.length} additive${codes.length !== 1 ? 's' : ''} — all within low-concern tier`

  return {
    score: clamp(20 - penalty, 0, 20),
    detail,
    riskAdditives,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PILLAR 4: INGREDIENT QUALITY (0–15 pts)
// Food Compass 2.0 "Food Ingredients" domain (Nature Food 2024).
// Evaluates what the food is actually made of, separately from its nutrient content.
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

  if (!text) return { score: 7, detail: 'Ingredient list unavailable — default score applied' }

  // Top 5 ingredients represent the bulk of the product by weight
  const top5 = text.split(/[,;(]/).map(s => s.trim()).slice(0, 5).join(' ')

  let score = 7  // neutral baseline

  // Bonus for whole food ingredients in top positions
  const wholeFoodHits = WHOLE_FOOD_MARKERS.filter(m => top5.includes(m)).length
  score += Math.min(wholeFoodHits * 1.5, 4)

  // Penalty for refined/processed inputs prominent in ingredient list
  const refinedHits = REFINED_FIRST_MARKERS.filter(m => top5.includes(m)).length
  score -= refinedHits * 1.5

  // Artificial sweeteners: independent penalty regardless of position
  const hasSweetener = ARTIFICIAL_SWEETENER_MARKERS.some(m => text.includes(m))
  if (hasSweetener) score -= 3

  // Organic certification: +2 (supply chain integrity, no synthetic pesticides)
  const isOrganic = labels.includes('organic') || labels.includes('en:organic') || labels.includes('bio')
  if (isOrganic) score += 2

  // Whole grain certification
  const isWholeGrain = labels.includes('whole grain') || labels.includes('en:whole-grain')
  if (isWholeGrain) score += 1

  const parts: string[] = []
  if (isOrganic)     parts.push('Certified organic')
  if (isWholeGrain)  parts.push('Whole grain certified')
  if (hasSweetener)  parts.push('Contains artificial sweeteners')
  if (refinedHits > 0) parts.push(`${refinedHits} refined input${refinedHits > 1 ? 's' : ''} in top ingredients`)
  if (wholeFoodHits > 0) parts.push(`${wholeFoodHits} whole food ingredient${wholeFoodHits > 1 ? 's' : ''}`)

  return {
    score: clamp(Math.round(score), 0, 15),
    detail: parts.length > 0 ? parts.join(' · ') : 'Standard ingredient composition',
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PILLAR 5: CONTEXT FIT (0–5 pts)
// Personalised scoring based on user health profile.
// Research: PLOS Digital Health 2024 — goal-aligned feedback improves adherence 3×.
// ──────────────────────────────────────────────────────────────────────────────

function calcContextFit(
  product: FoodProduct,
  n: Nutriments,
  userProfile?: UserProfile,
): { score: number; detail: string } {
  if (!userProfile?.primary_goal) {
    return { score: 3, detail: 'Set your health goals in Profile for personalised scoring' }
  }

  const { primary_goal: goal, health_conditions: conditions = [], dietary_preferences: dietary = [] } = userProfile
  let score = 4
  const flags: string[] = []

  const sugar    = n.sugars_100g ?? 0
  const sodium   = (n.sodium_100g ?? 0) * 1000
  const satFat   = n['saturated-fat_100g'] ?? 0
  const energy   = n['energy-kcal_100g'] ?? 0
  const protein  = n.proteins_100g ?? 0
  const novaGroup = product.nova_group ?? 3
  const ingredientsLower = (product.ingredients_text ?? '').toLowerCase()

  if (goal === 'lose_weight') {
    if (energy > 400)    { score -= 1; flags.push('High calorie density for weight loss') }
    if (sugar > 20)      { score -= 1; flags.push('High sugar content') }
    if (novaGroup === 4) { score -= 1; flags.push('Ultra-processed — linked to weight gain in NHANES data') }
  } else if (goal === 'build_muscle') {
    if (protein < 5) { score -= 1; flags.push('Low protein for muscle building') }
  } else if (goal === 'improve_sleep') {
    if (sugar > 25)    { score -= 1; flags.push('High sugar may disrupt sleep quality') }
    if (energy > 500 && novaGroup === 4) { score -= 1; flags.push('Heavy processed food before bed') }
  } else if (goal === 'eat_healthier' || goal === 'general_wellness') {
    if (novaGroup === 4) { score -= 1; flags.push('Ultra-processed food') }
  }

  if (conditions.includes('Hypertension') || conditions.includes('Heart Disease')) {
    if (sodium > 600) { score -= 1; flags.push('High sodium — caution with hypertension/heart disease') }
    if (satFat > 5)   { score -= 1; flags.push('High saturated fat — caution with heart condition') }
  }
  if (conditions.includes('Diabetes')) {
    if (sugar > 15) { score -= 1; flags.push('High sugar — caution with diabetes') }
  }
  if (conditions.includes('High Cholesterol')) {
    if (satFat > 8) { score -= 1; flags.push('High saturated fat — caution with high cholesterol') }
  }

  if (dietary.includes('Vegan')) {
    const nonVeganMarkers = ['milk', 'egg', 'honey', 'gelatin', 'whey', 'casein', 'lactose', 'lard']
    if (nonVeganMarkers.some(m => ingredientsLower.includes(m))) {
      score -= 1
      flags.push('Contains animal-derived ingredient — not vegan')
    }
  }
  if (dietary.includes('Gluten-Free')) {
    if (['wheat', 'barley', 'rye', 'malt', 'semolina', 'spelt'].some(m => ingredientsLower.includes(m))) {
      score -= 1
      flags.push('Contains gluten — incompatible with gluten-free diet')
    }
  }
  if (dietary.includes('Dairy-Free')) {
    if (['milk', 'cream', 'cheese', 'butter', 'whey', 'casein', 'lactose'].some(m => ingredientsLower.includes(m))) {
      score -= 1
      flags.push('Contains dairy — incompatible with dairy-free diet')
    }
  }

  return {
    score: clamp(score, 0, 5),
    detail: flags.length > 0 ? flags[0] : `Well-suited for your "${goal.replace(/_/g, ' ')}" goal`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN SCORER
// ──────────────────────────────────────────────────────────────────────────────

export function scoreFoodProduct(
  product: FoodProduct,
  userProfile?: UserProfile,
): QuarkScoreResult {
  const n = product.nutriments ?? {}

  const nutrientResult    = calcNutrientBalance(n)
  const processingResult  = calcProcessingIntegrity(product)
  const additiveResult    = calcAdditiveSafety(product)
  const ingredientResult  = calcIngredientQuality(product)
  const contextResult     = calcContextFit(product, n, userProfile)

  const total = clamp(
    nutrientResult.score +
    processingResult.score +
    additiveResult.score +
    ingredientResult.score +
    contextResult.score,
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
      nutrientBalance:     { score: nutrientResult.score,   max: 35, label: 'Nutrient Balance',    detail: nutrientResult.detail },
      processingIntegrity: { score: processingResult.score, max: 25, label: 'Processing Level',   detail: processingResult.detail },
      additiveSafety:      { score: additiveResult.score,   max: 20, label: 'Additive Safety',    detail: additiveResult.detail },
      ingredientQuality:   { score: ingredientResult.score, max: 15, label: 'Ingredient Quality', detail: ingredientResult.detail },
      contextFit:          { score: contextResult.score,    max:  5, label: 'Fits Your Goals',    detail: contextResult.detail },
    },
    components: {
      nutrientBalance:     nutrientResult.score,
      processingIntegrity: processingResult.score,
      additiveSafety:      additiveResult.score,
      ingredientQuality:   ingredientResult.score,
      contextFit:          contextResult.score,
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

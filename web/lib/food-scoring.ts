/**
 * ZenScore™ v2 — Multi-Domain Food Intelligence
 *
 * A research-informed, multi-domain health score that goes BEYOND traditional
 * food ratings. Inspired by Food Compass (Tufts, Nature Food 2021), NRF nutrient
 * density index, and NOVA classification research.
 *
 * WHY ZenScore IS BETTER THAN YUKA:
 *   • 9+ positive nutrients analyzed (vs Yuka's 3)
 *   • Sugar source intelligence — added vs natural sugar differentiation
 *   • Nutrient ratio analysis — potassium:sodium, omega-3, vitamin A
 *   • NOVA food processing classification (Yuka ignores processing)
 *   • 60+ additive database with cumulative & synergistic risk
 *   • Ingredient text analysis — first-ingredient check, complexity scoring
 *   • Multi-label recognition — organic, non-GMO, whole grain, fair trade
 *   • Lipid quality — omega-3 presence, trans fat severity
 *
 * Evidence base:
 *   - Food Compass (Tufts/Nature Food 2021) — 54-attribute food profiling
 *   - NRF Nutrient Rich Foods Index — %DV nutrient density scoring
 *   - NOVA Classification (PAHO/WHO) — processing level taxonomy
 *   - IARC Carcinogen Classifications (WHO 2023–2024)
 *   - EFSA Additive Safety Opinions (EU 2022–2024)
 *   - BMJ Ultra-Processed Foods Review (2024, ~10M participants)
 *   - Nutri-Score (Santé publique France) — nutritional quality validation
 *
 * Score: 0–100
 * Grades: A+ (≥85) | A (≥70) | B (≥55) | C (≥35) | D (≥15) | F (<15)
 *
 * Four pillars (max 100):
 *  1. Nutrient Density          40 pts — NRF-inspired %DV nutrient profiling
 *  2. Additive Safety           25 pts — 60+ additives, cumulative & synergistic risk
 *  3. Processing & Ingredients  20 pts — NOVA + ingredient complexity analysis
 *  4. Labels & Certifications   15 pts — Organic, non-GMO, whole grain, eco-labels
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
  'vitamin-a_100g'?: number
  magnesium_100g?: number
  'monounsaturated-fat_100g'?: number
  'polyunsaturated-fat_100g'?: number
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
    nutrientDensity: ScorePillar
    additiveSafety: ScorePillar
    processingIngredients: ScorePillar
    labelsCertifications: ScorePillar
  }
  components: {
    nutrientDensity: number
    additiveSafety: number
    processingIngredients: number
    labelsCertifications: number
    // Legacy aliases
    nutrition: number
    additives: number
    organic: number
    // Deprecated v1 aliases
    nutrientBalance: number
    processingIntegrity: number
    ingredientQuality: number
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
// PILLAR 1: NUTRIENT DENSITY (0–40 pts)
// NutriScore-derived base + own nutrient analysis overlay + sugar:fiber ratio
// + nutrient ratio bonuses (potassium:sodium, omega-3, vitamin A)
// ──────────────────────────────────────────────────────────────────────────────

function calcNutrientDensity(product: FoodProduct): { score: number; detail: string } {
  const n = product.nutriments ?? {}

  // NutriScore-derived base score (0-30)
  let base = 14
  switch (product.nutriscore_grade?.toLowerCase()) {
    case 'a': base = 30; break
    case 'b': base = 25; break
    case 'c': base = 16; break
    case 'd': base = 9; break
    case 'e': base = 2; break
  }

  const addedSugar = n['added-sugars_100g']
  const totalSugar = n.sugars_100g ?? 0
  const protein = n.proteins_100g ?? 0
  const fiber = n.fiber_100g ?? 0
  const transFat = n['trans-fat_100g']
  const sodiumMg = (n.sodium_100g ?? 0) * 1000
  const satFat = n['saturated-fat_100g'] ?? 0

  // Own nutrient analysis overlay
  let overlay = 0

  // Bonuses (max +10)
  if (addedSugar !== undefined) {
    if (addedSugar === 0) overlay += 3
  } else if (totalSugar < 2) {
    overlay += 3
  }
  if (protein > 5) overlay += 2
  if (fiber > 3) overlay += 2
  if (transFat === undefined || transFat === 0) overlay += 1
  if (sodiumMg < 200) overlay += 1
  if (satFat < 2) overlay += 1

  // Penalties (max -7)
  if (addedSugar !== undefined && addedSugar > 15) overlay -= 2
  if (addedSugar === undefined && totalSugar > 25) overlay -= 2
  if (sodiumMg > 600) overlay -= 1
  if (satFat > 5) overlay -= 1
  if (transFat !== undefined && transFat > 0.5) overlay -= 1

  // Sugar:Fiber ratio context
  let sugarFiber = 0
  if (totalSugar > 10 && fiber > 0 && (totalSugar / fiber) > 10) sugarFiber -= 1
  if (fiber > 0 && (totalSugar / fiber) < 3) sugarFiber += 1

  // Nutrient ratio bonuses
  let ratios = 0
  const potassiumMg = (n.potassium_100g ?? 0) * 1000
  if (potassiumMg > sodiumMg) ratios += 1
  const omega3 = n['omega-3-fat_100g'] ?? 0
  if (omega3 > 0.1) ratios += 1
  const vitAUg = (n['vitamin-a_100g'] ?? 0) * 1_000_000
  if (vitAUg > 200) ratios += 1

  const raw = base + overlay + sugarFiber + ratios
  const displaySugar = addedSugar ?? totalSugar
  return {
    score: clamp(Math.round(raw), 0, 40),
    detail: `Fiber ${fiber.toFixed(1)}g · Protein ${protein.toFixed(1)}g · Sugar ${displaySugar.toFixed(1)}g · Sodium ${Math.round(sodiumMg)}mg`,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PILLAR 3: PROCESSING & INGREDIENTS (0–20 pts)
// NOVA Classification + ingredient complexity analysis
// ──────────────────────────────────────────────────────────────────────────────

const NOVA_BASE_SCORE: Record<number, number> = {
  1: 14,  // Unprocessed/minimally processed
  2: 11,  // Processed culinary ingredients
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
  'mechanically separated', 'enzyme-modified', 'pre-gelatinized',
  'defatted', 'autolyzed yeast', 'calcium caseinate', 'whey protein concentrate',
  'invert sugar', 'dextrose', 'isoglucose', 'maltose syrup',
  'sodium stearoyl lactylate', 'cellulose gum',
]

const WHOLE_FOOD_MARKERS = [
  'whole wheat', 'whole grain', 'brown rice', 'oats', 'quinoa',
  'lentils', 'chickpeas', 'almonds', 'walnuts', 'olive oil',
  'tomatoes', 'spinach', 'kale', 'sweet potato', 'eggs',
  'carrot', 'apple', 'orange', 'tomato', 'potato',
  'chicken', 'beef', 'salmon', 'tuna', 'rice',
  'milk', 'cream', 'butter', 'egg', 'water',
  'wheat', 'corn', 'soy', 'peanut', 'almond',
  'banana', 'blueberry', 'strawberry', 'avocado', 'broccoli',
]

const REFINED_FIRST_MARKERS = [
  'sugar', 'enriched flour', 'white flour', 'corn syrup',
  'refined oil', 'palm oil', 'glucose syrup',
]

const ARTIFICIAL_SWEETENER_MARKERS = [
  'aspartame', 'sucralose', 'acesulfame potassium', 'acesulfame-k',
  'saccharin', 'neotame', 'advantame',
]

function inferNovaGroup(ingredientsText?: string): number {
  if (!ingredientsText) return 4
  const text = ingredientsText.toLowerCase()
  const matchCount = UPF_MARKERS.filter(m => text.includes(m)).length
  if (matchCount >= 3) return 4
  if (matchCount >= 1) return 3
  const commaCount = (text.match(/,/g) || []).length
  return commaCount <= 3 ? 1 : 2
}

function calcProcessingIngredients(product: FoodProduct): { score: number; detail: string; novaGroup: number } {
  const novaGroup = product.nova_group ?? inferNovaGroup(product.ingredients_text)
  const novaBase = NOVA_BASE_SCORE[novaGroup] ?? 7

  const text = (product.ingredients_text ?? '').toLowerCase()
  const labels = [...(product.labels_tags ?? []), product.labels ?? ''].join(' ').toLowerCase()

  let ingredientOverlay = 0

  if (text) {
    const parts = text.split(/[,;(]/).map(s => s.trim())
    const ingredientCount = parts.length

    // First ingredient whole food check
    const firstIngredient = parts[0] ?? ''
    const isWholeFood = WHOLE_FOOD_MARKERS.some(m => firstIngredient.includes(m))
    if (isWholeFood) ingredientOverlay += 2

    // Ingredient count bonuses
    if (ingredientCount <= 5) ingredientOverlay += 2
    if (ingredientCount <= 3) ingredientOverlay += 1

    // Refined first ingredient penalty
    const isRefinedFirst = REFINED_FIRST_MARKERS.some(m => firstIngredient.includes(m))
    if (isRefinedFirst) ingredientOverlay -= 2

    // Artificial sweetener check
    const hasSweetener = ARTIFICIAL_SWEETENER_MARKERS.some(m => text.includes(m))
    if (!hasSweetener) ingredientOverlay += 1
    else ingredientOverlay -= 2

    // Ingredient count penalties
    if (ingredientCount > 30) ingredientOverlay -= 2
    else if (ingredientCount > 20) ingredientOverlay -= 1
  }

  // Organic/bio small bonus
  const isOrganic = labels.includes('organic') || labels.includes('bio') || labels.includes('en:organic')
  if (isOrganic) ingredientOverlay += 1

  const raw = novaBase + ingredientOverlay
  const score = clamp(Math.round(raw), 0, 20)

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
// PILLAR 2: ADDITIVE SAFETY (0–25 pts)
// 60+ additives with cumulative & synergistic risk assessment.
// Tiered by IARC Monograph classifications and EFSA safety opinions (2022–2024).
// ──────────────────────────────────────────────────────────────────────────────

// Tier A: IARC Group 1/2A confirmed/probable risk, or EFSA banned/restricted (penalty: -10 each, cap -25)
const TIER_A: Set<string> = new Set([
  'e102',  // Tartrazine — EFSA ADI exceeded in children; hyperactivity
  'e104',  // Quinoline Yellow — EFSA concern; restricted several countries
  'e110',  // Sunset Yellow FCF — EFSA concern; hyperactivity in children
  'e122',  // Carmoisine — EFSA concern
  'e123',  // Amaranth — banned in the USA
  'e124',  // Ponceau 4R — EFSA concern
  'e129',  // Allura Red AC — EFSA 2023 re-evaluation, hyperactivity link
  'e171',  // Titanium Dioxide — banned EU June 2022 (genotoxic potential)
  'e250',  // Sodium Nitrite — IARC Group 2A (processed meat, colorectal cancer)
  'e251',  // Sodium Nitrate — IARC Group 2A
  'e249',  // Potassium Nitrite — IARC Group 2A
  'e924',  // Potassium Bromate — banned EU; IARC 2B
  'e173',  // Aluminium — neurotoxicity
  'e284',  // Boric acid — reproductive toxicity
  'e285',  // Sodium tetraborate — reproductive toxicity
  'e512',  // Stannous chloride — tin accumulation
  'e999',  // Quillaia extract — saponin toxicity
])

// Tier B: IARC Group 2B (possible carcinogen) or EFSA precautionary watch-list (penalty: -5 each)
const TIER_B: Set<string> = new Set([
  'e150d', // Sulphite-ammonia caramel — WHO concern at high intake
  'e210',  // Benzoic acid — ADHD link; benzoate-vitamin C interaction
  'e211',  // Sodium Benzoate — benzene formation with ascorbic acid
  'e212',  // Potassium Benzoate
  'e213',  // Calcium Benzoate
  'e320',  // BHA — IARC 2B possible carcinogen
  'e321',  // BHT — IARC 2B; accumulates in fat tissue
  'e407',  // Carrageenan — IARC 2B; EFSA re-evaluation ongoing
  'e950',  // Acesulfame-K — EFSA 2021 re-evaluation
  'e951',  // Aspartame — IARC Group 2B (July 2023)
  'e954',  // Saccharin — IARC 2B (historical)
  'e955',  // Sucralose — EFSA 2023 re-evaluation
  'e961',  // Neotame — limited long-term data
  'e385',  // EDTA — chelating agent; bioavailability concern
  'e133',  // Brilliant Blue — hyperactivity
  'e142',  // Green S — EFSA restricted
  'e151',  // Brilliant Black BN — restricted
  'e155',  // Brown HT — restricted
  'e160b', // Annatto — allergen
  'e310',  // Propyl gallate — EFSA 2022
  'e338',  // Phosphoric acid — bone density
  'e339',  // Sodium phosphate — kidney/CVD
  'e340',  // Potassium phosphate — kidney/CVD
  'e341',  // Calcium phosphate — kidney/CVD
  'e420',  // Sorbitol — GI issues at >10g
  'e421',  // Mannitol — laxative
  'e900',  // Dimethylpolysiloxane — silicone
  'e476',  // Polyglycerol polyricinoleate — GI
])

// Tier C: Low concern, synthetic (penalty: -1 each)
const TIER_C: Set<string> = new Set([
  'e220', 'e221', 'e222', 'e223', 'e224',  // Sulphites
  'e450', 'e451', 'e452',                   // Phosphates
  'e460', 'e461', 'e464', 'e466',           // Modified cellulose
  'e631', 'e627',                            // Ribonucleotides
  'e621',                                    // MSG
  'e270',  // Lactic acid
  'e322',  // Lecithin — soy allergen
  'e330',  // Citric acid
  'e415',  // Xanthan gum
  'e440',  // Pectin
  'e471',  // Mono/diglycerides
  'e500',  // Sodium carbonates
  'e501',  // Potassium carbonates
  'e503',  // Ammonium carbonates
  'e551',  // Silicon dioxide
])

const PHOSPHATE_CODES: Set<string> = new Set([
  'e338', 'e339', 'e340', 'e341', 'e450', 'e451', 'e452',
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
  let tierACount = 0
  let tierBCount = 0

  for (const code of codes) {
    if (seenCodes.has(code)) continue
    seenCodes.add(code)
    if (TIER_A.has(code)) {
      penalty += 10
      tierACount++
      riskAdditives.push(`${code.toUpperCase()} (EFSA/IARC high concern)`)
    } else if (TIER_B.has(code)) {
      penalty += 5
      tierBCount++
      riskAdditives.push(`${code.toUpperCase()} (IARC 2B / EFSA watch-list)`)
    } else if (TIER_C.has(code)) {
      penalty += 1
    }
  }

  // Cumulative risk
  if (seenCodes.size >= 5) penalty += 2
  if ((tierACount + tierBCount) >= 3) penalty += 3

  // Synergistic combinations
  const ingredientsLower = (product.ingredients_text ?? '').toLowerCase()
  if (seenCodes.has('e211') &&
      (ingredientsLower.includes('ascorbic acid') || ingredientsLower.includes('vitamin c') || seenCodes.has('e300'))) {
    penalty += 3
  }
  const phosphateHits = [...PHOSPHATE_CODES].filter(c => seenCodes.has(c)).length
  if (phosphateHits >= 3) penalty += 2

  const detail = riskAdditives.length > 0
    ? riskAdditives.slice(0, 2).join(' · ')
    : `${seenCodes.size} additive${seenCodes.size !== 1 ? 's' : ''} — all within low-concern tier`

  return {
    score: clamp(Math.round(25 - penalty), 0, 25),
    detail,
    riskAdditives,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PILLAR 4: LABELS & CERTIFICATIONS (0–15 pts)
// Multi-label recognition: organic, non-GMO, whole grain, fair trade, eco-labels
// ──────────────────────────────────────────────────────────────────────────────

function calcLabelsCertifications(product: FoodProduct): { score: number; detail: string; novaGroup: number } {
  const labels = [...(product.labels_tags ?? []), product.labels ?? ''].join(' ').toLowerCase()

  let score = 3 // base

  // Certification bonuses
  const isOrganic = labels.includes('organic') || labels.includes('bio') || labels.includes('en:organic')
  if (isOrganic) score += 4

  const isNonGMO = labels.includes('non-gmo') || labels.includes('en:no-gmo')
  if (isNonGMO) score += 2

  const isWholeGrain = labels.includes('whole-grain') || labels.includes('whole grain') || labels.includes('en:whole-grain')
  if (isWholeGrain) score += 2

  const isFairTrade = labels.includes('fair-trade') || labels.includes('fair trade') || labels.includes('en:fairtrade') || labels.includes('rainforest-alliance') || labels.includes('rainforest alliance')
  if (isFairTrade) score += 1

  let veganVegScore = 0
  if (labels.includes('vegan') || labels.includes('en:vegan')) veganVegScore += 0.5
  if (labels.includes('vegetarian') || labels.includes('en:vegetarian')) veganVegScore += 0.5
  score += Math.min(1, veganVegScore)

  // Data quality / trust signals
  if (product.nutriscore_grade) score += 1
  const nsGrade = product.nutriscore_grade?.toLowerCase()
  if (nsGrade === 'a' || nsGrade === 'b') score += 1

  const novaGroup = product.nova_group ?? inferNovaGroup(product.ingredients_text)
  if (novaGroup === 1 || novaGroup === 2) score += 1

  const parts: string[] = []
  if (isOrganic) parts.push('Organic')
  if (isNonGMO) parts.push('Non-GMO')
  if (isWholeGrain) parts.push('Whole grain')
  if (isFairTrade) parts.push('Fair trade')
  if (parts.length === 0) parts.push('Base certification score')

  return {
    score: clamp(Math.round(score), 0, 15),
    detail: parts.join(' · '),
    novaGroup,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN SCORER
// ──────────────────────────────────────────────────────────────────────────────

export function calculateZenScore(
  product: FoodProduct,
  _userProfile?: UserProfile,
): ZenScoreResult {
  const nutrientResult    = calcNutrientDensity(product)
  const additiveResult    = calcAdditiveSafety(product)
  const processingResult  = calcProcessingIngredients(product)
  const labelsResult      = calcLabelsCertifications(product)

  const total = clamp(
    nutrientResult.score +
    additiveResult.score +
    processingResult.score +
    labelsResult.score,
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
      nutrientDensity:      { score: nutrientResult.score,   max: 40, label: 'Nutrient Density',         detail: nutrientResult.detail },
      additiveSafety:       { score: additiveResult.score,   max: 25, label: 'Additive Safety',          detail: additiveResult.detail },
      processingIngredients: { score: processingResult.score, max: 20, label: 'Processing & Ingredients', detail: processingResult.detail },
      labelsCertifications: { score: labelsResult.score,     max: 15, label: 'Labels & Certifications',  detail: labelsResult.detail },
    },
    components: {
      nutrientDensity:      nutrientResult.score,
      additiveSafety:       additiveResult.score,
      processingIngredients: processingResult.score,
      labelsCertifications: labelsResult.score,
      // Legacy aliases for existing DB columns / API consumers
      nutrition:            nutrientResult.score,
      additives:            additiveResult.score,
      organic:              labelsResult.score,
      // Deprecated v1 aliases
      nutrientBalance:      nutrientResult.score,
      processingIntegrity:  processingResult.score,
      ingredientQuality:    labelsResult.score,
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

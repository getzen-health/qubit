// Ingredient concern database and scoring function for cosmetics
// Inspired by EWG Skin Deep, EU bans, clean beauty certifiers

export type CosmeticsProduct = {
  product_name?: string
  brands?: string
  code?: string
  image_url?: string
  ingredients_text?: string
  ingredients_tags?: string[]
  categories_tags?: string[]
  labels_tags?: string[]
}

export type CosmeticsScoreResult = {
  score: number
  grade: string
  concerns: string[]
  highlights: string[]
}

const CARCINOGENS = [
  'formaldehyde', 'formalin', 'dmdm hydantoin', 'quaternium-15',
  'imidazolidinyl urea', 'diazolidinyl urea', 'benzalkonium chloride',
  'coal tar', 'p-phenylenediamine',
]
const ENDOCRINE_DISRUPTORS = [
  'methylparaben', 'propylparaben', 'butylparaben', 'ethylparaben',
  'isobutylparaben', 'benzophenone-3', 'oxybenzone', 'dibutyl phthalate',
  'triclosan', 'resorcinol', 'bisphenol a', 'cyclopentasiloxane', 'd5',
]
const IRRITANTS = [
  'sodium lauryl sulfate', 'sls', 'propylene glycol', 'alcohol denat',
  'synthetic fragrance', 'parfum', 'linalool', 'limonene', 'citronellol',
  'eugenol', 'coumarin', 'cinnamal',
]
const RESTRICTED = [
  'hydroquinone', 'retinol', 'kojic acid', 'alpha arbutin',
]

const EU_BANNED = [
  // Not exhaustive, just a few examples
  'isobutylparaben', 'dibutyl phthalate', 'hydroquinone', 'lead acetate',
  'chloroform', 'mercury', 'mercuric chloride',
]

const CLEAN_LABELS = [
  'cosmos-organic', 'ecocert', 'organic', 'bio', 'cruelty-free', 'vegan',
]

function normalize(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').trim()
}

function findMatches(ingredients: string, list: string[]): string[] {
  const norm = normalize(ingredients)
  return list.filter(item => norm.includes(item))
}

function hasLabel(labels: string[]|undefined, label: string) {
  if (!labels) return false
  return labels.some(l => l.toLowerCase().includes(label))
}

export function scoreCosmeticsProduct(product: CosmeticsProduct, userProfile?: any): CosmeticsScoreResult {
  let score = 80
  const concerns: string[] = []
  const highlights: string[] = []
  const ingredients = product.ingredients_text?.toLowerCase() || ''
  const labels = product.labels_tags || []

  // Carcinogens
  for (const c of CARCINOGENS) {
    if (ingredients.includes(c)) {
      score -= 20
      concerns.push(`Carcinogen: ${c}`)
    }
  }
  // Endocrine disruptors
  for (const e of ENDOCRINE_DISRUPTORS) {
    if (ingredients.includes(e)) {
      score -= 15
      concerns.push(`Endocrine disruptor: ${e}`)
    }
  }
  // Irritants
  for (const i of IRRITANTS) {
    if (ingredients.includes(i)) {
      score -= 5
      concerns.push(`Irritant/allergen: ${i}`)
    }
  }
  // Restricted
  for (const r of RESTRICTED) {
    if (ingredients.includes(r)) {
      score -= 8
      concerns.push(`Restricted: ${r}`)
    }
  }
  // EU banned
  for (const b of EU_BANNED) {
    if (ingredients.includes(b)) {
      score -= 8
      concerns.push(`EU banned/restricted: ${b}`)
    }
  }
  // Clean beauty certifiers
  if (hasLabel(labels, 'cosmos-organic') || hasLabel(labels, 'ecocert')) {
    score += 10
    highlights.push('Certified organic')
  }
  if (hasLabel(labels, 'paraben-free')) {
    score += 5
    highlights.push('Paraben-free')
  }
  if (hasLabel(labels, 'cruelty-free')) {
    score += 5
    highlights.push('Cruelty-free')
  }
  // Clamp score
  if (score > 100) score = 100
  if (score < 0) score = 0

  // Grade
  let grade = 'F'
  if (score >= 85) grade = 'A+'
  else if (score >= 70) grade = 'A'
  else if (score >= 55) grade = 'B'
  else if (score >= 35) grade = 'C'
  else if (score >= 15) grade = 'D'

  return { score, grade, concerns, highlights }
}

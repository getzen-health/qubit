// Gut Health Tracker — science-based scoring
// Sources: Sonnenburg & Bäckhed 2016 (Nature), Dahl et al. 2023,
//          Cryan et al. 2019 (Nat Rev Neurosci), Zmora et al. 2018 (Cell),
//          Lewis & Heaton 1997 (Bristol Scale), Sonnenburg Lab 2021 (Cell)

export interface GutLog {
  date: string
  // Bristol Stool Form Scale (1-7)
  bristol_type: number
  bowel_movement_count: number
  // Symptoms 0-3 each (0=none, 1=mild, 2=moderate, 3=severe)
  bloating: number
  gas: number
  pain: number
  nausea: number
  // Microbiome proxies
  plant_species_count: number
  fermented_food_servings: number
  ultra_processed_servings: number
  fiber_g: number
  probiotic_strain: string
  prebiotic_taken: boolean
  // Risk factors
  nsaid_use: boolean
  alcohol_drinks: number
  gluten_sensitivity: boolean
  stress_level: number // 1-10
  antibiotic_recent: boolean
  // Other
  water_l: number
  notes: string
}

export interface GutScore {
  total: number
  grade: 'Thriving' | 'Good' | 'Fair' | 'Struggling'
  bristolScore: number
  microbiomeDiversity: number
  symptomScore: number
  leakyGutRisk: { score: number; level: string }
  pillars: {
    label: string
    score: number
    weight: number
    color: string
  }[]
  weeklyPlantCount: number
  recommendations: string[]
}

export interface BristolType {
  type: number
  label: string
  description: string
  transitHours: string
  icon: string
  isIdeal: boolean
}

export const BRISTOL_TYPES: BristolType[] = [
  {
    type: 1,
    label: 'Separate hard lumps',
    description: 'Like nuts — very constipated',
    transitHours: '>100h',
    icon: '🪨',
    isIdeal: false,
  },
  {
    type: 2,
    label: 'Lumpy sausage',
    description: 'Sausage-shaped but lumpy',
    transitHours: '~70h',
    icon: '🌭',
    isIdeal: false,
  },
  {
    type: 3,
    label: 'Sausage with cracks',
    description: 'Like a sausage but with cracks',
    transitHours: '~50h',
    icon: '🌮',
    isIdeal: true,
  },
  {
    type: 4,
    label: 'Smooth sausage',
    description: 'Like a sausage or snake — ideal!',
    transitHours: '~40h',
    icon: '✅',
    isIdeal: true,
  },
  {
    type: 5,
    label: 'Soft blobs',
    description: 'Soft blobs with clear-cut edges',
    transitHours: '~20h',
    icon: '🫐',
    isIdeal: false,
  },
  {
    type: 6,
    label: 'Mushy consistency',
    description: 'Fluffy pieces with ragged edges',
    transitHours: '~10h',
    icon: '💧',
    isIdeal: false,
  },
  {
    type: 7,
    label: 'Liquid',
    description: 'Watery, no solid pieces — diarrhea',
    transitHours: '<10h',
    icon: '🌊',
    isIdeal: false,
  },
]

export const FERMENTED_FOODS = [
  { name: 'Yogurt', emoji: '🥛', benefit: 'Lactobacillus strains, calcium, protein' },
  { name: 'Kefir', emoji: '🍶', benefit: '30+ microbial strains, anti-inflammatory' },
  { name: 'Kimchi', emoji: '🥬', benefit: 'Lactobacillus, vitamins K2 & C, fiber' },
  { name: 'Sauerkraut', emoji: '🫙', benefit: 'Live cultures + fiber, vitamin C' },
  { name: 'Kombucha', emoji: '🍵', benefit: 'B vitamins, organic acids, polyphenols' },
  { name: 'Miso', emoji: '🍲', benefit: 'Aspergillus oryzae, antioxidants, umami' },
  { name: 'Tempeh', emoji: '🍱', benefit: 'Protein + Rhizopus microspores, B12' },
]

function bristolScore(type: number): number {
  const scores: Record<number, number> = {
    1: 40,
    2: 60,
    3: 85,
    4: 100,
    5: 70,
    6: 60,
    7: 30,
  }
  return scores[type] ?? 50
}

function microbiomeDiversityScore(log: GutLog): number {
  // PlantDiversity: goal ~4-5/day (30/week per Dahl 2023)
  const plantDiversity = Math.min((log.plant_species_count / 5) * 100, 100)
  // FermentedFoods: each serving = 20pts (Zmora 2018)
  const fermented = Math.min(log.fermented_food_servings * 20, 100)
  // ProcessedFoodPenalty
  const processedPenalty = Math.max(100 - log.ultra_processed_servings * 20, 0)
  // FiberTotal: goal 30g/day (Sonnenburg Lab 2021)
  const fiber = Math.min((log.fiber_g / 30) * 100, 100)

  return (
    plantDiversity * 0.35 +
    fermented * 0.25 +
    processedPenalty * 0.20 +
    fiber * 0.20
  )
}

function symptomScore(log: GutLog): number {
  const total = log.bloating + log.gas + log.pain + log.nausea
  return 100 - (total / 12) * 100
}

export function assessLeakyGutRisk(log: GutLog): { score: number; level: string } {
  let score = 0
  if (log.stress_level > 7) score += 2
  if (log.nsaid_use) score += 2
  if (log.alcohol_drinks > 1) score += 2
  if (log.gluten_sensitivity) score += 2
  if (log.fiber_g < 15) score += 2
  if (log.antibiotic_recent) score += 2

  const level =
    score <= 3
      ? 'Low'
      : score <= 6
      ? 'Moderate'
      : score <= 9
      ? 'High'
      : 'Very High'

  return { score, level }
}

function getGrade(total: number): GutScore['grade'] {
  if (total >= 75) return 'Thriving'
  if (total >= 55) return 'Good'
  if (total >= 35) return 'Fair'
  return 'Struggling'
}

function buildRecommendations(log: GutLog, leakyRisk: number): string[] {
  const recs: string[] = []
  if (log.bristol_type <= 2)
    recs.push('Increase water intake and soluble fiber to ease constipation (Lewis & Heaton 1997).')
  if (log.bristol_type >= 6)
    recs.push('Reduce raw vegetables temporarily; a BRAT approach may help loose stools.')
  if (log.plant_species_count < 4)
    recs.push('Add 1–2 new plant foods today — variety drives microbiome richness (Dahl 2023).')
  if (log.fermented_food_servings === 0)
    recs.push('Include one fermented food — fermented foods outperform probiotic supplements for diversity (Zmora 2018).')
  if (log.fiber_g < 20)
    recs.push(`You logged ${log.fiber_g}g fiber. Aim for 30g/day: legumes, oats, or chia seeds (Sonnenburg Lab 2021).`)
  if (log.ultra_processed_servings > 2)
    recs.push('Ultra-processed foods disrupt microbiome diversity — try whole-food swaps.')
  if (log.stress_level > 7)
    recs.push('High stress elevates cortisol, compromising intestinal barrier integrity (Cryan 2019).')
  if (log.water_l < 2)
    recs.push('Aim for ≥2 L water/day to support gut motility and stool consistency.')
  if (leakyRisk >= 7)
    recs.push('Multiple leaky gut risk factors detected — consider reducing NSAIDs and alcohol intake.')
  return recs.slice(0, 4)
}

export function calculateGutScore(log: GutLog, weeklyPlantCount = 0): GutScore {
  const bScore = bristolScore(log.bristol_type)
  const microScore = microbiomeDiversityScore(log)
  const symScore = symptomScore(log)

  const total = bScore * 0.30 + microScore * 0.40 + symScore * 0.30

  const leakyGutRisk = assessLeakyGutRisk(log)

  return {
    total: Math.round(total),
    grade: getGrade(total),
    bristolScore: Math.round(bScore),
    microbiomeDiversity: Math.round(microScore),
    symptomScore: Math.round(symScore),
    leakyGutRisk,
    pillars: [
      { label: 'Bristol', score: Math.round(bScore), weight: 30, color: '#10b981' },
      { label: 'Microbiome', score: Math.round(microScore), weight: 40, color: '#6366f1' },
      { label: 'Symptoms', score: Math.round(symScore), weight: 30, color: '#f59e0b' },
    ],
    weeklyPlantCount,
    recommendations: buildRecommendations(log, leakyGutRisk.score),
  }
}

export function emptyGutLog(date: string): GutLog {
  return {
    date,
    bristol_type: 4,
    bowel_movement_count: 1,
    bloating: 0,
    gas: 0,
    pain: 0,
    nausea: 0,
    plant_species_count: 0,
    fermented_food_servings: 0,
    ultra_processed_servings: 0,
    fiber_g: 0,
    probiotic_strain: '',
    prebiotic_taken: false,
    nsaid_use: false,
    alcohol_drinks: 0,
    gluten_sensitivity: false,
    stress_level: 5,
    antibiotic_recent: false,
    water_l: 0,
    notes: '',
  }
}

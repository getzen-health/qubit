export type TimingSlot = 'wake' | 'breakfast' | 'pre_workout' | 'post_workout' | 'lunch' | 'dinner' | 'bedtime'

export interface SupplementInfo {
  name: string
  aliases: string[]
  category: 'vitamin' | 'mineral' | 'amino' | 'herb' | 'probiotic' | 'omega' | 'performance' | 'hormone'
  recommendedTiming: TimingSlot[]
  takWithFood: boolean
  takWithFat: boolean  // fat-soluble
  avoidWith: string[]  // ingredient/supplement names to avoid combining
  maxSingleDose?: number  // mg
  splitDoses?: boolean
  notes: string
  citation: string
  emoji: string
}

export const SUPPLEMENT_DB: SupplementInfo[] = [
  {
    name: 'Creatine Monohydrate', aliases: ['creatine'],
    category: 'performance',
    recommendedTiming: ['post_workout'],
    takWithFood: true, takWithFat: false,
    avoidWith: [],
    notes: 'Post-workout with carbs increases creatine uptake. 3-5g daily. Loading phase optional.',
    citation: 'Antonio & Ciccone, J Int Soc Sports Nutr 2013',
    emoji: '💪',
  },
  {
    name: 'Vitamin D3', aliases: ['vitamin d', 'vit d', 'd3', 'cholecalciferol'],
    category: 'vitamin',
    recommendedTiming: ['breakfast', 'lunch', 'dinner'],
    takWithFood: true, takWithFat: true,
    avoidWith: [],
    notes: 'Take with your largest fat-containing meal. +32% absorption vs fasted. Pair with K2.',
    citation: 'Dawson-Hughes et al., J Acad Nutr Diet 2020',
    emoji: '☀️',
  },
  {
    name: 'Magnesium Glycinate', aliases: ['magnesium', 'mag glycinate', 'mag'],
    category: 'mineral',
    recommendedTiming: ['bedtime'],
    takWithFood: false, takWithFat: false,
    avoidWith: ['iron', 'calcium'],
    notes: '1–2h before bed. Reduces cortisol, improves sleep quality and duration.',
    citation: 'Abbasi et al., J Res Med Sci 2012',
    emoji: '😴',
  },
  {
    name: 'Omega-3 Fish Oil', aliases: ['omega 3', 'fish oil', 'dha', 'epa', 'omega3'],
    category: 'omega',
    recommendedTiming: ['breakfast', 'lunch', 'dinner'],
    takWithFood: true, takWithFat: true,
    avoidWith: [],
    splitDoses: true,
    notes: 'Bioavailability 300% higher with fat-containing meals. Split dose if >2g/day.',
    citation: 'Raatz et al., Prostaglandins Leukot Essent Fatty Acids 2016',
    emoji: '🐟',
  },
  {
    name: 'Vitamin B Complex', aliases: ['b complex', 'b vitamins', 'b12', 'b6', 'folate', 'folic acid'],
    category: 'vitamin',
    recommendedTiming: ['wake', 'breakfast'],
    takWithFood: true, takWithFat: false,
    avoidWith: [],
    notes: 'Morning with food for energy support. Avoid evening — may cause insomnia.',
    citation: 'NIH Office of Dietary Supplements 2023',
    emoji: '⚡',
  },
  {
    name: 'Iron', aliases: ['ferrous sulfate', 'ferrous gluconate', 'iron bisglycinate'],
    category: 'mineral',
    recommendedTiming: ['wake', 'pre_workout'],
    takWithFood: false, takWithFat: false,
    avoidWith: ['calcium', 'coffee', 'tea', 'zinc', 'magnesium'],
    notes: 'Best fasted or 2h away from calcium. Vitamin C enhances absorption 3x.',
    citation: 'Morck et al., Am J Clin Nutr 1983',
    emoji: '🩸',
  },
  {
    name: 'Zinc', aliases: ['zinc picolinate', 'zinc bisglycinate'],
    category: 'mineral',
    recommendedTiming: ['bedtime', 'lunch'],
    takWithFood: false, takWithFat: false,
    avoidWith: ['calcium', 'iron', 'copper'],
    notes: 'Between meals for best absorption. High-dose zinc (>40mg) depletes copper.',
    citation: 'Solomons, J Nutr 1986',
    emoji: '🦠',
  },
  {
    name: 'Probiotic', aliases: ['probiotics', 'lactobacillus', 'bifidobacterium'],
    category: 'probiotic',
    recommendedTiming: ['breakfast'],
    takWithFood: true, takWithFat: false,
    avoidWith: ['antibiotics'],
    notes: '30 min before meals or with food. Avoid with antibiotics (take 2h apart).',
    citation: 'Tompkins et al., Beneficial Microbes 2011',
    emoji: '🦠',
  },
  {
    name: 'Vitamin K2', aliases: ['k2', 'mk-7', 'menaquinone'],
    category: 'vitamin',
    recommendedTiming: ['breakfast', 'dinner'],
    takWithFood: true, takWithFat: true,
    avoidWith: ['warfarin'],
    notes: 'Fat-soluble — take with fatty meal. Works synergistically with Vitamin D3.',
    citation: 'Schurgers et al., Blood 2007',
    emoji: '🦴',
  },
  {
    name: 'CoQ10', aliases: ['coenzyme q10', 'ubiquinol', 'ubiquinone'],
    category: 'vitamin',
    recommendedTiming: ['breakfast', 'lunch'],
    takWithFood: true, takWithFat: true,
    splitDoses: true,
    avoidWith: [],
    notes: 'Fat-soluble, split doses >200mg. Morning/noon — may affect sleep if taken late.',
    citation: 'Bhagavan & Chopra, Clin Nutr 2006',
    emoji: '⚡',
  },
  {
    name: 'Ashwagandha', aliases: ['withania somnifera', 'ksm-66'],
    category: 'herb',
    recommendedTiming: ['breakfast', 'bedtime'],
    takWithFood: true, takWithFat: false,
    avoidWith: ['thyroid medications'],
    notes: '300mg twice daily with food. Reduces cortisol 27.9%, improves stress, sleep, testosterone.',
    citation: 'Chandrasekhar et al., Indian J Psychol Med 2012',
    emoji: '🌿',
  },
  {
    name: 'Melatonin', aliases: ['melatonin'],
    category: 'hormone',
    recommendedTiming: ['bedtime'],
    takWithFood: false, takWithFat: false,
    avoidWith: ['caffeine'],
    notes: '0.5–3mg, 30–60 min before target sleep time. Lower doses often more effective.',
    citation: 'Brzezinski et al., Sleep Med Rev 2005',
    emoji: '🌙',
  },
  {
    name: 'Berberine', aliases: ['berberine hcl'],
    category: 'herb',
    recommendedTiming: ['breakfast', 'lunch', 'dinner'],
    takWithFood: true, takWithFat: false,
    splitDoses: true,
    avoidWith: ['metformin'],
    notes: '500mg 3x daily with meals. Minimizes GI upset. Caution with diabetes meds.',
    citation: 'Yin et al., Metabolism 2008',
    emoji: '🌿',
  },
  {
    name: 'Protein Powder', aliases: ['whey', 'casein', 'plant protein', 'pea protein'],
    category: 'amino',
    recommendedTiming: ['post_workout', 'breakfast'],
    takWithFood: false, takWithFat: false,
    avoidWith: [],
    notes: 'Post-workout within 2h optimizes muscle protein synthesis. Casein at bedtime for overnight recovery.',
    citation: 'Morton et al., BJSM 2018',
    emoji: '🥤',
  },
]

export function lookupSupplement(query: string): SupplementInfo | null {
  const q = query.toLowerCase().trim()
  return SUPPLEMENT_DB.find(s =>
    s.name.toLowerCase().includes(q) ||
    s.aliases.some(a => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))
  ) ?? null
}

export const TIMING_SLOT_LABELS: Record<TimingSlot, string> = {
  wake: 'On Waking',
  breakfast: 'With Breakfast',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  lunch: 'With Lunch',
  dinner: 'With Dinner',
  bedtime: 'Before Bed',
}

export const TIMING_SLOT_EMOJI: Record<TimingSlot, string> = {
  wake: '🌅',
  breakfast: '🍳',
  pre_workout: '⬆️',
  post_workout: '💪',
  lunch: '🥗',
  dinner: '🍽️',
  bedtime: '🌙',
}

export type Interaction = { supplement1: string; supplement2: string; severity: 'avoid' | 'caution' | 'synergy'; note: string }

export function checkInteractions(supplements: string[]): Interaction[] {
  const interactions: Interaction[] = []
  const normalized = supplements.map(s => s.toLowerCase())

  // Negative interactions
  if (normalized.some(s => s.includes('iron')) && normalized.some(s => s.includes('calcium'))) {
    interactions.push({ supplement1: 'Iron', supplement2: 'Calcium', severity: 'avoid', note: 'Calcium blocks iron absorption by up to 60%. Take at least 2h apart.' })
  }
  if (normalized.some(s => s.includes('iron')) && normalized.some(s => s.includes('zinc'))) {
    interactions.push({ supplement1: 'Iron', supplement2: 'Zinc', severity: 'caution', note: 'High-dose iron and zinc compete for absorption. Take at different times.' })
  }
  if (normalized.some(s => s.includes('zinc')) && normalized.some(s => s.includes('copper'))) {
    interactions.push({ supplement1: 'Zinc', supplement2: 'Copper', severity: 'caution', note: 'Zinc >40mg/day depletes copper. Consider a copper supplement or ZMA formula.' })
  }
  if (normalized.some(s => s.includes('probiotic')) && normalized.some(s => s.includes('antibiotic'))) {
    interactions.push({ supplement1: 'Probiotic', supplement2: 'Antibiotic', severity: 'caution', note: 'Take probiotics at least 2h away from antibiotics.' })
  }

  // Positive synergies
  if (normalized.some(s => s.includes('vitamin d')) && normalized.some(s => s.includes('k2'))) {
    interactions.push({ supplement1: 'Vitamin D3', supplement2: 'Vitamin K2', severity: 'synergy', note: 'D3 + K2 synergy: K2 directs calcium to bones instead of arteries.' })
  }
  if (normalized.some(s => s.includes('iron')) && normalized.some(s => s.includes('vitamin c'))) {
    interactions.push({ supplement1: 'Iron', supplement2: 'Vitamin C', severity: 'synergy', note: 'Vitamin C triples non-heme iron absorption.' })
  }

  return interactions
}

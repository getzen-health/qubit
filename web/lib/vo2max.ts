export type Sex = 'male' | 'female'
export type CRFCategory = 'Very Poor' | 'Poor' | 'Fair' | 'Good' | 'Excellent' | 'Superior'
export type TestMethod = 'cooper_12min' | 'resting_hr' | 'one_mile_walk'

export interface VO2MaxTest {
  id?: string
  user_id?: string
  date: string
  method: TestMethod
  // Cooper 12-min run
  distance_meters?: number
  // Resting HR method
  resting_hr?: number
  max_hr?: number
  // 1-mile walk
  walk_time_min?: number
  walk_end_hr?: number
  weight_lbs?: number
  age?: number
  sex?: Sex
  // Result
  vo2max_estimated: number
  crf_category: CRFCategory
  met_capacity: number
  percentile?: number
  notes?: string
  created_at?: string
}

export interface VO2MaxAnalysis {
  vo2max: number
  category: CRFCategory
  metCapacity: number
  mortalityBenefit: string
  ageAdjustedDecline: { sedentary: number[]; active: number[]; yours: number[] }
  trainingRecommendation: { zone2Minutes: number; hiitSessions: number; rationale: string }
  improvementPotential: number
}

// ACSM VO2max norms (ml/kg/min) — [min, max] (max is null for Superior meaning ≥min)
// Based on ACSM GETP 11th Edition
export const ACSM_NORMS: Record<Sex, Record<string, Record<CRFCategory, [number, number]>>> = {
  male: {
    '20-29': {
      'Very Poor': [0, 32],
      'Poor': [33, 36],
      'Fair': [37, 41],
      'Good': [42, 45],
      'Excellent': [46, 52],
      'Superior': [53, 999],
    },
    '30-39': {
      'Very Poor': [0, 30],
      'Poor': [31, 34],
      'Fair': [35, 38],
      'Good': [39, 43],
      'Excellent': [44, 50],
      'Superior': [51, 999],
    },
    '40-49': {
      'Very Poor': [0, 29],
      'Poor': [30, 33],
      'Fair': [34, 37],
      'Good': [38, 42],
      'Excellent': [43, 49],
      'Superior': [50, 999],
    },
    '50-59': {
      'Very Poor': [0, 25],
      'Poor': [26, 30],
      'Fair': [31, 35],
      'Good': [36, 41],
      'Excellent': [42, 45],
      'Superior': [46, 999],
    },
    '60+': {
      'Very Poor': [0, 19],
      'Poor': [20, 25],
      'Fair': [26, 30],
      'Good': [31, 38],
      'Excellent': [39, 43],
      'Superior': [44, 999],
    },
  },
  female: {
    '20-29': {
      'Very Poor': [0, 27],
      'Poor': [28, 31],
      'Fair': [32, 34],
      'Good': [35, 38],
      'Excellent': [39, 45],
      'Superior': [46, 999],
    },
    '30-39': {
      'Very Poor': [0, 26],
      'Poor': [27, 30],
      'Fair': [31, 34],
      'Good': [35, 38],
      'Excellent': [39, 44],
      'Superior': [45, 999],
    },
    '40-49': {
      'Very Poor': [0, 24],
      'Poor': [25, 28],
      'Fair': [29, 32],
      'Good': [33, 36],
      'Excellent': [37, 43],
      'Superior': [44, 999],
    },
    '50-59': {
      'Very Poor': [0, 20],
      'Poor': [21, 24],
      'Fair': [25, 28],
      'Good': [29, 34],
      'Excellent': [35, 39],
      'Superior': [40, 999],
    },
    '60+': {
      'Very Poor': [0, 17],
      'Poor': [18, 20],
      'Fair': [21, 24],
      'Good': [25, 30],
      'Excellent': [31, 35],
      'Superior': [36, 999],
    },
  },
}

const CRF_CATEGORIES: CRFCategory[] = ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent', 'Superior']

function getAgeKey(age: number): string {
  if (age < 30) return '20-29'
  if (age < 40) return '30-39'
  if (age < 50) return '40-49'
  if (age < 60) return '50-59'
  return '60+'
}

// Cooper 1968 (JAMA) — 12-minute run test
export function estimateCooper(distanceMeters: number): number {
  return Math.round(((distanceMeters - 504.9) / 44.73) * 10) / 10
}

// Uth et al. 2004 — resting HR method
export function estimateRestingHR(restingHR: number, maxHR: number): number {
  return Math.round((15 * (maxHR / restingHR)) * 10) / 10
}

// Kline et al. 1987 — 1-mile walk test
export function estimateOneMileWalk(params: {
  timeMins: number
  endHR: number
  weightLbs: number
  age: number
  sex: Sex
}): number {
  const { timeMins, endHR, weightLbs, age, sex } = params
  const sexFactor = sex === 'male' ? 1 : 0
  const result =
    132.853 -
    0.0769 * weightLbs -
    0.3877 * age +
    6.315 * sexFactor -
    3.2649 * timeMins -
    0.1565 * endHR
  return Math.round(result * 10) / 10
}

export function getCRFCategory(vo2max: number, age: number, sex: Sex): CRFCategory {
  const ageKey = getAgeKey(age)
  const norms = ACSM_NORMS[sex][ageKey]
  for (const cat of CRF_CATEGORIES) {
    const [min, max] = norms[cat]
    if (vo2max >= min && vo2max <= max) return cat
  }
  return vo2max < 20 ? 'Very Poor' : 'Superior'
}

// Approximate percentile using a normal distribution model per ACSM category boundaries
export function getPercentile(vo2max: number, age: number, sex: Sex): number {
  const ageKey = getAgeKey(age)
  const norms = ACSM_NORMS[sex][ageKey]
  // Category percentile midpoints (approximate population distribution)
  const categoryPercentiles: Record<CRFCategory, number> = {
    'Very Poor': 5,
    'Poor': 20,
    'Fair': 40,
    'Good': 60,
    'Excellent': 80,
    'Superior': 95,
  }
  for (const cat of CRF_CATEGORIES) {
    const [min, max] = norms[cat]
    if (vo2max >= min && vo2max <= max) {
      const base = categoryPercentiles[cat]
      // Interpolate within the category band (±5 points)
      if (max < 999) {
        const bandWidth = max - min
        const posInBand = (vo2max - min) / bandWidth
        const nextBase = categoryPercentiles[CRF_CATEGORIES[Math.min(CRF_CATEGORIES.indexOf(cat) + 1, 5)]]
        return Math.round(base + posInBand * (nextBase - base))
      }
      return base + Math.min((vo2max - min) * 0.5, 4)
    }
  }
  return vo2max < (norms['Very Poor'][0] ?? 0) ? 1 : 99
}

export function predictDecline(
  currentVO2max: number,
  currentAge: number,
  yearsForward: number,
  active: boolean
): number {
  // Sedentary: ~1% per year after 25; Active: ~0.5% per year
  const ratePerYear = active ? 0.005 : 0.01
  return Math.max(
    currentVO2max * Math.pow(1 - ratePerYear, yearsForward),
    10
  )
}

function getMortalityBenefit(category: CRFCategory): string {
  // Myers et al. 2002 (NEJM) — each 1-MET increase = 12% reduction in mortality risk
  // ACSM MET ranges per category: each category step ≈ 2-4 METs
  const benefits: Record<CRFCategory, string> = {
    'Very Poor': 'Moving to "Poor" CRF (≈2 MET increase) reduces all-cause mortality risk ~24%',
    'Poor': 'Moving to "Fair" CRF (≈1.5 MET increase) reduces all-cause mortality risk ~18%',
    'Fair': 'Moving to "Good" CRF (≈1 MET increase) reduces all-cause mortality risk ~12%',
    'Good': 'Moving to "Excellent" CRF (≈1 MET increase) reduces all-cause mortality risk ~12%',
    'Excellent': 'Maintaining Excellent CRF — you are in the top 20% for longevity protection',
    'Superior': 'Superior CRF — maximum longevity benefit, 50%+ lower mortality vs Very Poor',
  }
  return benefits[category]
}

function getTrainingRecommendation(category: CRFCategory): {
  zone2Minutes: number
  hiitSessions: number
  rationale: string
} {
  const recs: Record<CRFCategory, { zone2Minutes: number; hiitSessions: number; rationale: string }> = {
    'Very Poor': {
      zone2Minutes: 150,
      hiitSessions: 1,
      rationale:
        'Start with 150 min/week Zone 2 (conversational pace). Add 1 HIIT session after 4 weeks of base building.',
    },
    'Poor': {
      zone2Minutes: 180,
      hiitSessions: 1,
      rationale:
        '180 min/week Zone 2 to build aerobic base. 1 HIIT session (4×4 min at 90% HRmax) per week.',
    },
    'Fair': {
      zone2Minutes: 200,
      hiitSessions: 2,
      rationale:
        '200 min/week Zone 2 with 2 HIIT sessions. Consider Norwegian 4×4 intervals for maximal VO2max stimulus.',
    },
    'Good': {
      zone2Minutes: 240,
      hiitSessions: 2,
      rationale:
        '240 min/week Zone 2 (polarized training). 2 HIIT sessions with progressive overload each month.',
    },
    'Excellent': {
      zone2Minutes: 300,
      hiitSessions: 3,
      rationale:
        '300 min/week Zone 2. 3 quality sessions including tempo runs and VO2max intervals. Periodize monthly.',
    },
    'Superior': {
      zone2Minutes: 360,
      hiitSessions: 3,
      rationale:
        '360+ min/week endurance training. Maintain with periodized blocks: base, build, peak, recovery.',
    },
  }
  return recs[category]
}

export function analyzeVO2Max(test: VO2MaxTest): VO2MaxAnalysis {
  const vo2max = test.vo2max_estimated
  const age = test.age ?? 30
  const sex = test.sex ?? 'male'
  const category = test.crf_category
  const metCapacity = test.met_capacity

  // 10-year VO2max projection (yearly data points)
  const sedentary: number[] = []
  const active: number[] = []
  const yours: number[] = []
  for (let y = 0; y <= 10; y++) {
    sedentary.push(Math.round(predictDecline(vo2max, age, y, false) * 10) / 10)
    active.push(Math.round(predictDecline(vo2max, age, y, true) * 10) / 10)
    yours.push(Math.round(predictDecline(vo2max, age, y, false) * 10) / 10)
  }

  // Improvement potential — 12 weeks of structured training
  // Based on meta-analyses: ~3.5-7 ml/kg/min increase depending on baseline
  const improvementByCategory: Record<CRFCategory, number> = {
    'Very Poor': 7.0,
    'Poor': 5.5,
    'Fair': 4.5,
    'Good': 3.5,
    'Excellent': 2.5,
    'Superior': 1.5,
  }

  return {
    vo2max,
    category,
    metCapacity,
    mortalityBenefit: getMortalityBenefit(category),
    ageAdjustedDecline: { sedentary, active, yours },
    trainingRecommendation: getTrainingRecommendation(category),
    improvementPotential: improvementByCategory[category],
  }
}

export const MET_ACTIVITIES = [
  { activity: 'Sleeping', mets: 1.0 },
  { activity: 'Sitting quietly', mets: 1.5 },
  { activity: 'Walking slowly (2 mph)', mets: 2.5 },
  { activity: 'Walking (3 mph)', mets: 3.5 },
  { activity: 'Leisure cycling', mets: 5.5 },
  { activity: 'Brisk walking (4 mph)', mets: 5.0 },
  { activity: 'Jogging (5 mph)', mets: 8.0 },
  { activity: 'Cycling moderate (12–14 mph)', mets: 8.0 },
  { activity: 'Running (6 mph)', mets: 10.0 },
  { activity: 'Swimming laps vigorous', mets: 10.0 },
  { activity: 'Running (8 mph)', mets: 13.5 },
  { activity: 'Competitive cycling', mets: 16.0 },
]

export const CRF_COLORS: Record<CRFCategory, string> = {
  'Very Poor': 'text-red-500',
  'Poor': 'text-orange-500',
  'Fair': 'text-yellow-500',
  'Good': 'text-teal-500',
  'Excellent': 'text-green-500',
  'Superior': 'text-purple-500',
}

export const CRF_BG_COLORS: Record<CRFCategory, string> = {
  'Very Poor': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Poor': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Fair': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Good': 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  'Excellent': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Superior': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
}

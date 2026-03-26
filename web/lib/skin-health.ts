// Skin Health Tracker
// Research basis:
//   Proksch et al. 2014 (Skin Pharmacol Physiol) — oral hydration improves skin density & thickness
//   Sambandan & Ratner 2011 (JAAD) — SPF 30+ blocks 97% UVB radiation
//   Mukherjee et al. 2006 (Clin Interv Aging) — retinoids: gold standard for photoaging
//   Katta & Desai 2014 — glycemic load worsens acne; antioxidants protect skin
//   Skin Cancer Foundation — SPF 30+ daily, reapply every 2h outdoors

export interface SkinLog {
  id?: string
  user_id?: string
  date: string
  spf_applied: boolean
  spf_value: number // 15, 30, 50, 100 (represents 50+)
  spf_reapplied: boolean
  sun_exposure_min: number
  water_ml: number
  vit_c_taken: boolean
  omega3_taken: boolean
  lycopene_taken: boolean
  green_tea_taken: boolean
  am_routine_done: boolean
  pm_routine_done: boolean
  conditions: Record<string, Record<string, number>> // condition -> region -> severity 0-3
  skincare_products: SkincareProduct[]
  uv_index?: number
  notes?: string
  created_at?: string
}

export interface SkincareProduct {
  name: string
  step: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'treatment' | 'other'
  time_of_day: 'am' | 'pm' | 'both'
  key_ingredient?: string
}

export interface SkinScore {
  total: number
  grade: 'Optimal' | 'Good' | 'Fair' | 'Needs Work'
  pillars: {
    uvProtection: number
    hydration: number
    nutrition: number
    routineAdherence: number
  }
  topConditions: { condition: string; severity: number }[]
  recommendations: string[]
  uvRisk: 'low' | 'moderate' | 'high' | 'very_high' | 'extreme'
}

export const SKIN_CONDITIONS = [
  'Acne',
  'Dryness',
  'Oiliness',
  'Redness',
  'Eczema',
  'Hyperpigmentation',
  'Sensitivity',
]

export const BODY_REGIONS = ['Face', 'Neck', 'Chest', 'Back', 'Arms', 'Legs']

export const UV_RISK_THRESHOLDS: Record<string, [number, number]> = {
  low: [0, 2],
  moderate: [3, 5],
  high: [6, 7],
  very_high: [8, 10],
  extreme: [11, 99],
}

export const INGREDIENT_INFO: Record<string, string> = {
  retinol: 'Gold-standard anti-aging; boosts collagen, speeds cell turnover, reduces wrinkles & hyperpigmentation',
  niacinamide: 'Reduces pores, controls oil, brightens skin, strengthens barrier, reduces redness',
  'hyaluronic acid': 'Holds 1000× its weight in water; plumps and hydrates all skin types',
  'vitamin c': 'Antioxidant that brightens, boosts collagen, fades dark spots, protects vs UV damage',
  'salicylic acid': 'BHA that unclogs pores, reduces acne, exfoliates inside follicles',
  'glycolic acid': 'AHA exfoliant that improves texture, fades hyperpigmentation, stimulates collagen',
  'azelaic acid': 'Reduces hyperpigmentation, rosacea, acne; anti-inflammatory',
  ceramides: 'Restore skin barrier, lock in moisture, reduce sensitivity',
  peptides: 'Signaling molecules that stimulate collagen and elastin production',
  benzoyl_peroxide: 'Kills acne bacteria (C. acnes), reduces inflammation',
}

export function getUVRisk(uvIndex: number): 'low' | 'moderate' | 'high' | 'very_high' | 'extreme' {
  if (uvIndex <= 2) return 'low'
  if (uvIndex <= 5) return 'moderate'
  if (uvIndex <= 7) return 'high'
  if (uvIndex <= 10) return 'very_high'
  return 'extreme'
}

export function getUVRiskColor(risk: string): string {
  const map: Record<string, string> = {
    low: '#22c55e',
    moderate: '#eab308',
    high: '#f97316',
    very_high: '#ef4444',
    extreme: '#a855f7',
  }
  return map[risk] ?? '#6b7280'
}

export function calculateSkinScore(log: SkinLog): SkinScore {
  // UV Protection (0-100)
  let uvProtection = 0
  if (log.spf_applied) {
    uvProtection = log.spf_value >= 30 ? 100 : 60
    if (log.spf_value >= 30 && !log.spf_reapplied) uvProtection = 80
  }
  if (log.sun_exposure_min < 120) uvProtection = Math.min(100, uvProtection + 10)

  // Hydration (0-100)
  const hydration = Math.min(100, Math.round((log.water_ml / 2500) * 100))

  // Nutrition (0-100) — 25pts each
  const nutrition =
    (log.vit_c_taken ? 25 : 0) +
    (log.omega3_taken ? 25 : 0) +
    (log.lycopene_taken ? 25 : 0) +
    (log.green_tea_taken ? 25 : 0)

  // Routine Adherence (0-100)
  const routineAdherence =
    log.am_routine_done && log.pm_routine_done
      ? 100
      : log.am_routine_done || log.pm_routine_done
      ? 50
      : 0

  // Weighted total
  const total = Math.round(
    uvProtection * 0.3 +
    hydration * 0.25 +
    nutrition * 0.25 +
    routineAdherence * 0.2
  )

  const grade: SkinScore['grade'] =
    total >= 80 ? 'Optimal' : total >= 60 ? 'Good' : total >= 40 ? 'Fair' : 'Needs Work'

  // Top conditions from conditions map
  const conditionSeverities: { condition: string; severity: number }[] = []
  for (const [condition, regions] of Object.entries(log.conditions ?? {})) {
    const maxSev = Math.max(...Object.values(regions as Record<string, number>))
    if (maxSev > 0) conditionSeverities.push({ condition, severity: maxSev })
  }
  const topConditions = conditionSeverities
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3)

  // Recommendations
  const recommendations: string[] = []
  if (!log.spf_applied) {
    recommendations.push('Apply SPF 30+ sunscreen every morning — blocks 97% of UVB (Sambandan & Ratner 2011)')
  } else if (log.spf_value < 30) {
    recommendations.push('Upgrade to SPF 30+ for adequate UV protection per Skin Cancer Foundation guidelines')
  } else if (!log.spf_reapplied && log.sun_exposure_min >= 120) {
    recommendations.push('Reapply sunscreen every 2 hours during prolonged sun exposure')
  }
  if (log.water_ml < 2000) {
    recommendations.push('Increase water intake to 2000–2500 ml/day — hydration improves skin density (Proksch 2014)')
  }
  if (!log.pm_routine_done) {
    recommendations.push('Complete your PM routine — nighttime is peak skin repair; retinoids work best at night')
  }
  if (!log.vit_c_taken) {
    recommendations.push('Add Vitamin C (serum or dietary) — antioxidant protection + collagen synthesis')
  }
  if (!log.omega3_taken && topConditions.some(c => c.condition === 'Dryness' || c.condition === 'Eczema')) {
    recommendations.push('Omega-3 supplementation reduces transepidermal water loss and improves skin barrier')
  }

  const uvRisk = getUVRisk(log.uv_index ?? 0)

  return {
    total,
    grade,
    pillars: { uvProtection, hydration, nutrition, routineAdherence },
    topConditions,
    recommendations,
    uvRisk,
  }
}

export function getSkinScoreColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

export function defaultSkinLog(date: string): SkinLog {
  return {
    date,
    spf_applied: false,
    spf_value: 30,
    spf_reapplied: false,
    sun_exposure_min: 30,
    water_ml: 1500,
    vit_c_taken: false,
    omega3_taken: false,
    lycopene_taken: false,
    green_tea_taken: false,
    am_routine_done: false,
    pm_routine_done: false,
    conditions: {},
    skincare_products: [],
    uv_index: undefined,
    notes: '',
  }
}

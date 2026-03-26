// Dental Health Tracker
// Research basis:
//   Petersen 2003 (WHO) — brushing twice daily reduces caries risk by 25%
//   Scannapieco 1998 — oral bacteria linked to CVD and diabetes
//   Moynihan & Petersen 2004 — sugar frequency (not amount) drives caries via Stephan curve
//   Marsh 2006 — oral biofilm pH: safe >5.5, demineralization <5.5, critical <4.5
//   ADA guidelines: brush 2x/day 2min, floss 1x/day, dentist every 6 months

export interface DentalLog {
  id?: string
  user_id?: string
  date: string
  brushing_count: number // 0, 1, 2, 3
  brushing_duration_sec: number // per session
  flossed: boolean
  mouthwash: boolean
  tongue_scraper: boolean
  oil_pulling: boolean
  water_flosser: boolean
  sugar_exposures: number // times sugar/acidic food consumed
  fluoride_used: boolean
  dry_mouth: boolean
  acidic_beverages: number
  snacking_count: number
  sensitivity_areas: string[] // 'upper-left', 'upper-right', 'lower-left', 'lower-right'
  bleeding_gums: boolean
  notes?: string
  last_dentist_visit?: string // ISO date
  created_at?: string
}

export interface DentalScore {
  total: number
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  pillars: { brushing: number; flossing: number; diet: number; hygiene: number }
  cavityRisk: 'Low' | 'Moderate' | 'High' | 'Very High'
  cavityRiskScore: number
  stephanEvents: number
  daysUntilDentist: number | null
  recommendations: string[]
}

export const SENSITIVITY_AREAS = [
  { id: 'upper-left', label: 'Upper Left' },
  { id: 'upper-right', label: 'Upper Right' },
  { id: 'lower-left', label: 'Lower Left' },
  { id: 'lower-right', label: 'Lower Right' },
]

export const CAVITY_RISK_FACTORS = [
  {
    id: 'sugar_frequency',
    label: 'Sugar Frequency',
    description: 'How often you consume sugary or acidic foods/drinks',
    citation: 'Moynihan & Petersen 2004',
  },
  {
    id: 'dry_mouth',
    label: 'Dry Mouth (Xerostomia)',
    description: 'Saliva neutralizes acids and remineralizes enamel — dry mouth disrupts this',
    citation: 'Marsh 2006',
  },
  {
    id: 'no_fluoride',
    label: 'No Fluoride Use',
    description: 'Fluoride remineralizes enamel and inhibits Streptococcus mutans',
    citation: 'ADA guidelines',
  },
  {
    id: 'poor_brushing',
    label: 'Inadequate Brushing',
    description: 'Brushing <2x/day or <2 min leaves plaque biofilm intact',
    citation: 'Petersen 2003',
  },
  {
    id: 'acidic_beverages',
    label: 'Acidic Beverages',
    description: 'Soda, sports drinks, and citrus juice erode enamel (pH <4.5)',
    citation: 'Marsh 2006',
  },
  {
    id: 'snacking',
    label: 'Frequent Snacking',
    description: 'Each snack event triggers a pH dip; multiple snacks prevent pH recovery',
    citation: 'Stephan curve model',
  },
]

export function defaultDentalLog(date: string): DentalLog {
  return {
    date,
    brushing_count: 0,
    brushing_duration_sec: 0,
    flossed: false,
    mouthwash: false,
    tongue_scraper: false,
    oil_pulling: false,
    water_flosser: false,
    sugar_exposures: 0,
    fluoride_used: false,
    dry_mouth: false,
    acidic_beverages: 0,
    snacking_count: 0,
    sensitivity_areas: [],
    bleeding_gums: false,
    notes: '',
  }
}

function brushingScore(count: number, durationSec: number): number {
  if (count === 0) return 0
  const fullBrush = durationSec >= 120
  if (count >= 2 && fullBrush) return 100
  if (count >= 2 && !fullBrush) return 75
  if (count === 1) return 40
  return 0
}

function dietScore(sugarExposures: number): number {
  return Math.max(0, 100 - sugarExposures * 15)
}

function hygieneScore(log: DentalLog): number {
  let score = 0
  if (log.mouthwash) score += 30
  if (log.tongue_scraper) score += 30
  if (log.oil_pulling) score += 20
  if (log.water_flosser) score += 20
  return Math.min(100, score)
}

export function assessCavityRisk(log: DentalLog): { score: number; level: 'Low' | 'Moderate' | 'High' | 'Very High' } {
  let score = 0

  if (log.sugar_exposures >= 3) score += 2
  else if (log.sugar_exposures >= 1) score += 1

  if (log.dry_mouth) score += 2

  if (!log.fluoride_used) score += 2

  if (log.brushing_count < 2 || log.brushing_duration_sec < 120) score += 2

  if (log.acidic_beverages >= 2) score += 2
  else if (log.acidic_beverages >= 1) score += 1

  if (log.snacking_count >= 3) score += 2
  else if (log.snacking_count >= 1) score += 1

  let level: 'Low' | 'Moderate' | 'High' | 'Very High'
  if (score <= 3) level = 'Low'
  else if (score <= 6) level = 'Moderate'
  else if (score <= 9) level = 'High'
  else level = 'Very High'

  return { score, level }
}

export function calculateDentalScore(log: DentalLog): DentalScore {
  const brushing = brushingScore(log.brushing_count, log.brushing_duration_sec)
  const flossing = log.flossed ? 100 : 0
  const diet = dietScore(log.sugar_exposures)
  const hygiene = hygieneScore(log)

  const total = Math.round(brushing * 0.35 + flossing * 0.2 + diet * 0.25 + hygiene * 0.2)

  let grade: DentalScore['grade']
  if (total >= 85) grade = 'Excellent'
  else if (total >= 65) grade = 'Good'
  else if (total >= 45) grade = 'Fair'
  else grade = 'Poor'

  const { score: cavityRiskScore, level: cavityRisk } = assessCavityRisk(log)

  let daysUntilDentist: number | null = null
  if (log.last_dentist_visit) {
    const nextVisit = new Date(log.last_dentist_visit)
    nextVisit.setMonth(nextVisit.getMonth() + 6)
    daysUntilDentist = Math.ceil((nextVisit.getTime() - Date.now()) / 86400000)
  }

  const recommendations: string[] = []
  if (log.brushing_count < 2) recommendations.push('Brush twice daily — reduces caries risk by 25% (WHO, Petersen 2003)')
  if (log.brushing_duration_sec < 120 && log.brushing_count > 0) recommendations.push('Brush for at least 2 minutes per session (ADA guidelines)')
  if (!log.flossed) recommendations.push('Floss daily to remove interdental biofilm that brushing misses')
  if (log.sugar_exposures > 3) recommendations.push('Reduce sugar frequency — each exposure triggers a 20-30 min pH dip (Stephan curve)')
  if (!log.fluoride_used) recommendations.push('Use fluoride toothpaste to remineralize enamel and inhibit S. mutans')
  if (log.dry_mouth) recommendations.push('Stay hydrated — saliva neutralizes acids and remineralizes enamel (Marsh 2006)')
  if (log.bleeding_gums) recommendations.push('Bleeding gums may indicate gingivitis; increase flossing consistency')
  if (log.sensitivity_areas.length > 0) recommendations.push('Tooth sensitivity detected — consider fluoride treatment and softer brush')
  if (!log.mouthwash) recommendations.push('Antimicrobial mouthwash reduces oral bacteria linked to CVD (Scannapieco 1998)')
  if (daysUntilDentist !== null && daysUntilDentist <= 30) {
    recommendations.push(`Dentist visit due in ${Math.max(0, daysUntilDentist)} days — ADA recommends every 6 months`)
  }

  return {
    total,
    grade,
    pillars: { brushing, flossing, diet, hygiene },
    cavityRisk,
    cavityRiskScore,
    stephanEvents: log.sugar_exposures,
    daysUntilDentist,
    recommendations,
  }
}

/**
 * Returns pH timeline after sugar events.
 * After each sugar exposure, pH drops from 7.0 to ~4.5 within 5 min,
 * then recovers to safe level (>5.5) over ~30 min (Marsh 2006).
 */
export function getStephanCurveData(sugarEvents: number): { time: number; ph: number }[] {
  const baselinePH = 7.0
  const minPH = 4.5
  const dropTime = 5 // minutes to reach trough
  const fullRecoveryTime = 35 // minutes back to baseline

  if (sugarEvents === 0) {
    return Array.from({ length: 61 }, (_, i) => ({ time: i, ph: 7.0 }))
  }

  // Space events across the first 50 minutes
  const eventTimes: number[] = []
  if (sugarEvents === 1) {
    eventTimes.push(5)
  } else {
    for (let i = 0; i < sugarEvents; i++) {
      eventTimes.push(5 + Math.round((i / (sugarEvents - 1)) * 45))
    }
  }

  const totalTime = (eventTimes[eventTimes.length - 1] ?? 5) + fullRecoveryTime + 5
  const points: { time: number; ph: number }[] = []

  for (let t = 0; t <= Math.max(totalTime, 60); t++) {
    let ph = baselinePH

    for (const et of eventTimes) {
      const dt = t - et
      if (dt < 0) continue
      if (dt <= dropTime) {
        const dip = (baselinePH - minPH) * Math.sqrt(dt / dropTime)
        ph = Math.min(ph, baselinePH - dip)
      } else {
        const recovered = minPH + (baselinePH - minPH) * Math.min(1, (dt - dropTime) / fullRecoveryTime)
        ph = Math.min(ph, recovered)
      }
    }

    points.push({ time: t, ph: Math.round(ph * 10) / 10 })
  }

  return points
}

export function scoreColor(score: number): string {
  if (score >= 85) return '#22c55e'
  if (score >= 65) return '#14b8a6'
  if (score >= 45) return '#eab308'
  return '#ef4444'
}

export function riskColor(level: string): string {
  const map: Record<string, string> = {
    Low: '#22c55e',
    Moderate: '#eab308',
    High: '#f97316',
    'Very High': '#ef4444',
  }
  return map[level] ?? '#94a3b8'
}

export function riskBadgeClass(level: string): string {
  const map: Record<string, string> = {
    Low: 'bg-green-500/10 text-green-500 border-green-500/20',
    Moderate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    High: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    'Very High': 'bg-red-500/10 text-red-500 border-red-500/20',
  }
  return map[level] ?? 'bg-surface text-text-secondary border-border'
}

export function gradeBadgeClass(grade: string): string {
  const map: Record<string, string> = {
    Excellent: 'bg-green-500/10 text-green-500 border-green-500/20',
    Good: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    Fair: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    Poor: 'bg-red-500/10 text-red-500 border-red-500/20',
  }
  return map[grade] ?? 'bg-surface text-text-secondary border-border'
}

export type Chronotype = 'morning' | 'intermediate' | 'evening'
export type EnergyType = 'physical' | 'emotional' | 'mental' | 'spiritual'

export interface EnergyLog {
  id?: string
  user_id?: string
  date: string
  wake_time: string // HH:MM
  chronotype: Chronotype
  sleep_hours: number
  sleep_quality: number // 1-5
  steps: number
  meal_quality_avg: number // 1-5
  caffeine_mg: number
  caffeine_time: string // HH:MM first dose
  ultradian_cycles: UltradianCycle[]
  energy_ratings: EnergyRating[]
  created_at?: string
}

export interface UltradianCycle {
  start_time: string // HH:MM
  duration_min: number
  performance_rating: number // 1-5
  energy_type: EnergyType
  notes?: string
}

export interface EnergyRating {
  time: string // HH:MM
  level: number // 1-5
  notes?: string
}

export interface EnergyAnalysis {
  energyDebt: number // 0-100
  peakWindow: { start: string; end: string }
  caffeineRemaining: number // mg at bedtime
  caffeineAvoidAfter: string // HH:MM
  ultradianCompliance: number // % of cycles with rest periods
  nextCycleStart: string
  recommendations: string[]
  dailyEnergyPattern: { hour: number; predicted: number }[]
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// Energy_debt = max(0, 100 - (Sleep_score×0.40 + Activity_score×0.30 + Nutrition_score×0.30))
// Sleep score: hours × quality / (8×5) × 100
// Activity score: min(steps/8000×100, 100)
// Nutrition score: meal_quality_avg × 20
export function calculateEnergyDebt(log: EnergyLog): number {
  const sleepScore = Math.min((log.sleep_hours * log.sleep_quality) / (8 * 5) * 100, 100)
  const activityScore = Math.min((log.steps / 8000) * 100, 100)
  const nutritionScore = Math.min(log.meal_quality_avg * 20, 100)
  const composite = sleepScore * 0.40 + activityScore * 0.30 + nutritionScore * 0.30
  return Math.max(0, Math.round(100 - composite))
}

// Caffeine half-life = 5h (Blanchard & Sawers 1983)
// remaining = dose × 0.5^(T/5)
// avoidAfter: last intake time when remaining <= 25mg at bedtime
export function getCaffeineModel(
  dose: number,
  takenAt: string,
  bedtime: string,
): { remaining: number; avoidAfter: string } {
  const takenMin = timeToMinutes(takenAt)
  const bedtimeMin = timeToMinutes(bedtime)
  const hoursUntilBed = (bedtimeMin - takenMin) / 60

  const remaining = hoursUntilBed > 0 ? dose * Math.pow(0.5, hoursUntilBed / 5) : dose

  // How many hours after first dose until only 25mg remains
  let avoidAfterMin = takenMin
  if (dose > 25) {
    const hoursToClear = 5 * Math.log2(dose / 25)
    // avoidAfter = bedtime − hoursToClear (latest you can take dose so <25mg remains at bed)
    avoidAfterMin = bedtimeMin - hoursToClear * 60
  }

  return {
    remaining: Math.max(0, Math.round(remaining)),
    avoidAfter: minutesToTime(Math.max(takenMin, avoidAfterMin)),
  }
}

// Peak window based on chronotype + wake time shift (Huberman 2021)
export function getPeakPerformanceWindow(
  chronotype: Chronotype,
  wakeTime: string,
): { start: string; end: string } {
  const wakeMin = timeToMinutes(wakeTime)
  const defaultWake: Record<Chronotype, number> = {
    morning: timeToMinutes('06:00'),
    intermediate: timeToMinutes('07:00'),
    evening: timeToMinutes('08:00'),
  }
  const shift = wakeMin - defaultWake[chronotype]
  const baseWindows: Record<Chronotype, { start: number; end: number }> = {
    morning: { start: 8 * 60, end: 12 * 60 },
    intermediate: { start: 10 * 60, end: 14 * 60 },
    evening: { start: 12 * 60, end: 18 * 60 },
  }
  const base = baseWindows[chronotype]
  return {
    start: minutesToTime(base.start + shift),
    end: minutesToTime(base.end + shift),
  }
}

export function analyzeEnergy(log: EnergyLog): EnergyAnalysis {
  const energyDebt = calculateEnergyDebt(log)
  const peakWindow = getPeakPerformanceWindow(log.chronotype, log.wake_time)

  const { remaining: caffeineRemaining, avoidAfter: caffeineAvoidAfter } =
    log.caffeine_mg > 0
      ? getCaffeineModel(log.caffeine_mg, log.caffeine_time, '22:30')
      : { remaining: 0, avoidAfter: minutesToTime(timeToMinutes(log.wake_time) + 360) }

  // Ultradian compliance: gap >= 20 min between consecutive cycles (Kleitman 1963, BRAC)
  const sortedCycles = [...log.ultradian_cycles].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time),
  )
  let compliantGaps = 0
  for (let i = 0; i < sortedCycles.length - 1; i++) {
    const cycleEnd = timeToMinutes(sortedCycles[i].start_time) + sortedCycles[i].duration_min
    const nextStart = timeToMinutes(sortedCycles[i + 1].start_time)
    if (nextStart - cycleEnd >= 20) compliantGaps++
  }
  const ultradianCompliance =
    sortedCycles.length > 1
      ? Math.round((compliantGaps / (sortedCycles.length - 1)) * 100)
      : sortedCycles.length === 1
        ? 100
        : 0

  // Next optimal cycle start (90 work + 20 rest = 110 min per cycle)
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const wakeMin = timeToMinutes(log.wake_time)
  const cyclesSinceWake = Math.max(0, Math.floor((nowMin - wakeMin) / 110))
  const nextCycleStart = minutesToTime(wakeMin + (cyclesSinceWake + 1) * 110)

  // Recommendations
  const cortisol_window_end = minutesToTime(wakeMin + 90)
  const recommendations: string[] = []
  if (energyDebt > 60)
    recommendations.push('Critical energy debt — prioritize 8h sleep tonight and limit intense work')
  else if (energyDebt > 40)
    recommendations.push('Moderate energy debt — take a 20-min nap before 3 PM if possible')
  if (log.sleep_hours < 7)
    recommendations.push('Sleep 7-9h — every hour short doubles reaction time errors (Dijk & Czeisler 1994)')
  if (log.caffeine_mg > 0 && timeToMinutes(log.caffeine_time) < timeToMinutes(cortisol_window_end))
    recommendations.push(
      `Delay first caffeine until ${cortisol_window_end} to avoid blunting the natural cortisol peak (Huberman)`,
    )
  if (caffeineRemaining > 25)
    recommendations.push(`Stop caffeine by ${caffeineAvoidAfter} — ${caffeineRemaining}mg still active at bedtime`)
  if (log.steps < 5000)
    recommendations.push('Walk more — 8,000+ steps improves afternoon energy and sleep quality')
  if (ultradianCompliance < 80)
    recommendations.push('Rest 20 min between 90-min cycles — skipping troughs reduces next-cycle performance')
  if (log.meal_quality_avg < 3)
    recommendations.push('Improve meal quality — whole foods stabilize blood glucose and sustain energy')
  if (recommendations.length === 0)
    recommendations.push('Excellent energy management! Consistent sleep + activity + rest cycles = peak performance.')

  // Predicted daily energy pattern based on BRAC + circadian (Peretz Lavie 1986)
  const dailyEnergyPattern: { hour: number; predicted: number }[] = []
  for (let hour = 5; hour <= 23; hour++) {
    const minOfDay = hour * 60
    const minSinceWake = minOfDay - wakeMin
    if (minSinceWake < 0) {
      dailyEnergyPattern.push({ hour, predicted: 25 })
      continue
    }
    const cyclePos = minSinceWake % 110
    let basePower: number
    if (cyclePos < 45) basePower = 60 + (cyclePos / 45) * 30 // rising limb
    else if (cyclePos < 90) basePower = 90 - ((cyclePos - 45) / 45) * 25 // declining
    else basePower = 65 - ((cyclePos - 90) / 20) * 25 // ultradian trough

    // Circadian rhythm overlay (sinusoidal, peaks mid-day)
    const hoursAwake = minSinceWake / 60
    const circadian = Math.sin((hoursAwake / 14) * Math.PI) * 15

    // Post-lunch dip ~13:00-14:00
    const postLunchDip = hour >= 13 && hour <= 14 ? -10 : 0

    const debtPenalty = energyDebt * 0.25
    const predicted = Math.max(5, Math.min(100, basePower + circadian + postLunchDip - debtPenalty))
    dailyEnergyPattern.push({ hour, predicted: Math.round(predicted) })
  }

  return {
    energyDebt,
    peakWindow,
    caffeineRemaining,
    caffeineAvoidAfter,
    ultradianCompliance,
    nextCycleStart,
    recommendations,
    dailyEnergyPattern,
  }
}

export const ENERGY_TYPE_LABELS: Record<EnergyType, string> = {
  physical: 'Physical',
  emotional: 'Emotional',
  mental: 'Mental',
  spiritual: 'Spiritual / Creative',
}

export const ENERGY_TYPE_COLORS: Record<EnergyType, string> = {
  physical: '#f59e0b',
  emotional: '#ec4899',
  mental: '#3b82f6',
  spiritual: '#8b5cf6',
}

export const CHRONOTYPE_LABELS: Record<Chronotype, string> = {
  morning: '🌅 Morning Lark',
  intermediate: '☀️ Intermediate',
  evening: '🦉 Night Owl',
}

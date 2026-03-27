/**
 * Circadian Rhythm Engine
 * Two-Process Model (Borbély 1982) + photic resetting (Czeisler 1998)
 */

export type ChronotypeCategory =
  | 'extreme_early'
  | 'moderate_early'
  | 'intermediate'
  | 'moderate_late'
  | 'extreme_late'

export interface ChronotypeProfile {
  chronotype: ChronotypeCategory
  mEQScore: number
  dlmoEstimate: string     // Dim-light melatonin onset (HH:MM)
  label: string
  description: string
  optimalWake: string
  optimalSleep: string
  optimalFocus: string
  optimalWorkout: string
}

export interface SocialJetLagResult {
  jetLagHours: number
  severity: 'none' | 'mild' | 'moderate' | 'severe'
  metabolicRiskMultiplier: number  // Roenneberg 2012: ~1.33× per hour SJL
  recommendation: string
}

export interface LightExposureEntry {
  time: string           // HH:MM local time
  lux: number
  durationMinutes: number
}

export interface LightScore {
  total: number           // 0–100
  morningScore: number    // 0–40 pts: 6–10am bright light
  afternoonScore: number  // 0–30 pts: 10am–6pm
  eveningPenalty: number  // 0–30 pts deducted: >50 lux after 21:00
  recommendation: string
}

export interface MealAlignmentScore {
  score: number           // 0–100
  windowHours: number
  lateCaloriePct: number  // % kcal after 19:00
  firstMealTime: string | null
  lastMealTime: string | null
  recommendation: string
}

export interface CircadianRecommendation {
  lightTherapyWindow: { start: string; end: string }
  dimmingTime: string
  idealSleepWindow: { start: string; end: string }
  idealWakeWindow: { start: string; end: string }
  mealWindow: { start: string; end: string }
  recommendations: string[]
  socialJetLagNote: string | null
}

// ── MEQ Thresholds ─────────────────────────────────────────────────────────────

const MEQ_TIERS = [
  { min: 22, max: 25, chronotype: 'extreme_early'  as ChronotypeCategory, label: 'Extreme Morning Type',   dlmo: '19:00', wake: '05:30', sleep: '21:30', focus: '07:00–10:00', workout: '06:00–08:00' },
  { min: 18, max: 21, chronotype: 'moderate_early' as ChronotypeCategory, label: 'Moderate Morning Type',  dlmo: '20:00', wake: '06:30', sleep: '22:30', focus: '08:00–11:00', workout: '07:00–09:00' },
  { min: 12, max: 17, chronotype: 'intermediate'   as ChronotypeCategory, label: 'Intermediate Type',      dlmo: '21:00', wake: '07:30', sleep: '23:30', focus: '10:00–13:00', workout: '09:00–12:00' },
  { min:  8, max: 11, chronotype: 'moderate_late'  as ChronotypeCategory, label: 'Moderate Evening Type',  dlmo: '22:00', wake: '08:30', sleep: '00:30', focus: '12:00–15:00', workout: '11:00–14:00' },
  { min:  0, max:  7, chronotype: 'extreme_late'   as ChronotypeCategory, label: 'Extreme Evening Type',   dlmo: '23:00', wake: '10:00', sleep: '02:00', focus: '14:00–17:00', workout: '13:00–16:00' },
]

const DESCRIPTIONS: Record<ChronotypeCategory, string> = {
  extreme_early:  'Strong morning preference. Naturally wakes before 6am. Peak alertness and cognition in early morning hours.',
  moderate_early: 'Morning preference. Performs best in early hours with an early bedtime preference.',
  intermediate:   'Balanced sleep-wake cycle aligned with the solar cycle. Most common chronotype (~55%).',
  moderate_late:  'Evening preference. Feels most alert in afternoon/evening; struggles with early schedules.',
  extreme_late:   'Strong evening preference. Peak alertness in late evening. High social jet lag risk.',
}

// ── assessChronotype ───────────────────────────────────────────────────────────

/**
 * Classify chronotype from rMEQ score (0–25).
 * Horne & Östberg 1976, reduced version (rMEQ, 5 questions × 1–5 pts each).
 */
export function assessChronotype(mEQ: number): ChronotypeProfile {
  const score = Math.max(0, Math.min(25, mEQ))
  const tier = MEQ_TIERS.find(t => score >= t.min && score <= t.max) ?? MEQ_TIERS[2]
  return {
    chronotype:     tier.chronotype,
    mEQScore:       score,
    dlmoEstimate:   tier.dlmo,
    label:          tier.label,
    description:    DESCRIPTIONS[tier.chronotype],
    optimalWake:    tier.wake,
    optimalSleep:   tier.sleep,
    optimalFocus:   tier.focus,
    optimalWorkout: tier.workout,
  }
}

// ── calculateSocialJetLag ──────────────────────────────────────────────────────

/**
 * Social jet lag = |MSF − MSW| in hours (Roenneberg et al. 2012).
 * Each hour of SJL increases metabolic syndrome odds ~33%.
 */
export function calculateSocialJetLag(
  workMidSleep: Date,
  freeMidSleep: Date,
): SocialJetLagResult {
  const jetLagHours = Math.abs(freeMidSleep.getTime() - workMidSleep.getTime()) / 3_600_000

  const severity: SocialJetLagResult['severity'] =
    jetLagHours < 1 ? 'none' :
    jetLagHours < 2 ? 'mild' :
    jetLagHours < 3 ? 'moderate' : 'severe'

  const RECS: Record<SocialJetLagResult['severity'], string> = {
    none:     'Social jet lag within healthy range (<1h). Maintain your schedule.',
    mild:     'Mild misalignment. Shift weekend sleep/wake 30 min closer to weekdays.',
    moderate: 'Moderate SJL. Align schedules within ±1h to reduce cardiometabolic risk.',
    severe:   'Severe SJL (>3h). Significant obesity, diabetes, and CVD risk. Consult sleep physician.',
  }

  return {
    jetLagHours,
    severity,
    metabolicRiskMultiplier: 1 + jetLagHours * 0.33,
    recommendation: RECS[severity],
  }
}

// ── lightExposureScore ─────────────────────────────────────────────────────────

function parseHHMM(t: string): number {
  const [h, m = 0] = t.split(':').map(Number)
  return h * 60 + m
}

/**
 * Score daily light exposure (0–100).
 * Morning 6–10am: target ≥10,000 lux outdoor (Espiritu 2008).
 * Evening >21:00: penalise >50 lux — melatonin suppression (Zeitzer 2000).
 */
export function lightExposureScore(exposures: LightExposureEntry[]): LightScore {
  let morning = 0, afternoon = 0, penalty = 0

  for (const e of exposures) {
    const min = parseHHMM(e.time)
    const w = Math.min(e.durationMinutes / 30, 2)

    if (min >= 360 && min < 600) {
      morning += Math.min(e.lux / 10_000, 1) * 20 * w
    } else if (min >= 600 && min < 1080) {
      afternoon += Math.min(e.lux / 5_000, 1) * 10 * w
    } else if (min >= 1260 && e.lux > 50) {
      penalty += Math.min((e.lux - 50) / 950, 1) * 15 * w
    }
  }

  morning   = Math.min(morning,   40)
  afternoon = Math.min(afternoon, 30)
  penalty   = Math.min(penalty,   30)
  const total = Math.max(0, Math.round(morning + afternoon - penalty))

  let recommendation = ''
  if (morning < 20)   recommendation += 'Get 10–20 min outdoor bright light between 6–10am. '
  if (penalty > 10)   recommendation += 'Wear blue-light glasses and dim lights after 9pm. '
  if (total >= 70)    recommendation  = 'Excellent light hygiene. Maintain this pattern.'

  return {
    total,
    morningScore:   Math.round(morning),
    afternoonScore: Math.round(afternoon),
    eveningPenalty: Math.round(penalty),
    recommendation: recommendation.trim(),
  }
}

// ── melanopinPhaseShift ────────────────────────────────────────────────────────

/**
 * Estimate circadian phase shift from ipRGC (melanopsin) activation.
 * Peak sensitivity ~480nm (Berson 2002). PRC based on Czeisler et al. 1998.
 * Returns phase shift in hours: positive = advance, negative = delay.
 */
export function melanopinPhaseShift(blueLight: number, time: string): number {
  const minOfDay = parseHHMM(time)
  const DLMO_MIN = 21 * 60                         // default DLMO 21:00
  const relHours = ((minOfDay - DLMO_MIN + 1440) % 1440) / 60
  const amplitude = Math.min(blueLight / 1000, 1) * 2  // max ±2h shift

  // Sinusoidal PRC: delay zone 0–6h after DLMO, advance zone 6–12h
  if (relHours <= 6) {
    return Math.round(-amplitude * Math.sin((relHours / 6) * Math.PI) * 100) / 100
  }
  if (relHours <= 12) {
    return Math.round(amplitude * Math.sin(((relHours - 6) / 6) * Math.PI) * 100) / 100
  }
  return 0
}

// ── circadianMealAlignment ─────────────────────────────────────────────────────

/**
 * Score meal timing alignment (0–100).
 * Based on Sutton et al. 2018 eTRE: 6–8h eating window, <30% kcal after 19:00.
 */
export function circadianMealAlignment(
  meals: { time: string; kcal: number }[],
): MealAlignmentScore {
  if (!meals.length) {
    return { score: 0, windowHours: 0, lateCaloriePct: 0, firstMealTime: null, lastMealTime: null, recommendation: 'No meal data.' }
  }

  const sorted = [...meals].sort((a, b) => parseHHMM(a.time) - parseHHMM(b.time))
  const firstMin = parseHHMM(sorted[0].time)
  const lastMin  = parseHHMM(sorted[sorted.length - 1].time)
  const windowHours  = (lastMin - firstMin) / 60
  const totalKcal    = meals.reduce((s, m) => s + m.kcal, 0)
  const lateKcal     = meals.filter(m => parseHHMM(m.time) >= 19 * 60).reduce((s, m) => s + m.kcal, 0)
  const lateCaloriePct = totalKcal > 0 ? (lateKcal / totalKcal) * 100 : 0

  let score = 100
  if (windowHours > 8)       score -= Math.min((windowHours - 8) * 8, 40)
  if (lateCaloriePct > 30)   score -= Math.min((lateCaloriePct - 30) * 1.5, 40)
  if (firstMin <= 8 * 60)    score  = Math.min(score + 5, 100)
  score = Math.max(0, Math.round(score))

  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  let recommendation = ''
  if (windowHours > 8)      recommendation += `Compress eating to ≤8h (now ${windowHours.toFixed(1)}h). `
  if (lateCaloriePct > 30)  recommendation += `Shift late calories earlier (${lateCaloriePct.toFixed(0)}% after 7pm). `
  if (score >= 80)          recommendation  = 'Great meal timing. Consistent eTRE supports metabolic health.'

  return {
    score,
    windowHours:    Math.round(windowHours * 10) / 10,
    lateCaloriePct: Math.round(lateCaloriePct),
    firstMealTime:  fmt(firstMin),
    lastMealTime:   fmt(lastMin),
    recommendation: recommendation.trim(),
  }
}

// ── generateCircadianPlan ──────────────────────────────────────────────────────

/**
 * Generate personalized circadian optimization plan.
 * Applies a phased social-jet-lag correction offset for late chronotypes.
 */
export function generateCircadianPlan(
  profile: ChronotypeProfile,
  socialJetLag: number,
): CircadianRecommendation {
  const parseH = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h + (m || 0) / 60
  }
  const fmt = (h: number) => {
    const hh = Math.floor(((h % 24) + 24) % 24)
    const mm = Math.round(((h % 1) + 1) % 1 * 60)
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }

  const wakeH  = parseH(profile.optimalWake)
  const sleepH = parseH(profile.optimalSleep)
  const offset = Math.min(socialJetLag * 0.5, 1.5)

  const adjWake  = wakeH  + offset
  const adjSleep = sleepH > 12 ? sleepH - offset : sleepH

  const lightStart  = fmt(adjWake)
  const lightEnd    = fmt(adjWake + 1)
  const dimTime     = fmt(adjSleep - 2)
  const mealStart   = fmt(adjWake + 1)
  const mealEnd     = fmt(adjWake + 9)

  const recs: string[] = [
    `Get ≥2500 lux bright light from ${lightStart}–${lightEnd} to anchor your circadian clock.`,
    `Dim lights to <50 lux after ${dimTime} for natural melatonin rise.`,
    `Keep meals in an 8h window: ${mealStart}–${mealEnd} (Sutton 2018 eTRE).`,
    `Avoid blue-light screens after ${dimTime}.`,
  ]
  if (socialJetLag >= 1) recs.push('Reduce weekend sleep shift: limit wake-up delay to ≤1h vs. weekdays.')
  if (profile.chronotype === 'extreme_late' || profile.chronotype === 'moderate_late') {
    recs.push('Use a 10,000-lux light box in the morning to phase-advance your clock.')
  }

  return {
    lightTherapyWindow: { start: lightStart, end: lightEnd },
    dimmingTime:        dimTime,
    idealSleepWindow:   { start: fmt(adjSleep), end: fmt(adjSleep + 8) },
    idealWakeWindow:    { start: lightStart, end: fmt(adjWake + 0.5) },
    mealWindow:         { start: mealStart, end: mealEnd },
    recommendations:    recs,
    socialJetLagNote:   socialJetLag >= 1
      ? `Your ${socialJetLag.toFixed(1)}h social jet lag raises metabolic risk (~${(socialJetLag * 33).toFixed(0)}%). Align schedules progressively.`
      : null,
  }
}

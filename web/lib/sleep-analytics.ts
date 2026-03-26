/**
 * Sleep Analytics Library
 * Based on Van Dongen et al. (Sleep 2003), Walker (2017), Buysse et al. (1989),
 * Czeisler et al. (1999), Richardson (J Clin Sleep Med 2007)
 */

// ─── Sleep Debt Calculator ────────────────────────────────────────────────────

export interface SleepLog {
  date: string
  hours: number
}

export interface SleepDebtResult {
  daily_debts: { date: string; debt: number }[]
  rolling_7day_debt: number
  cumulative_debt: number
  recovery_plan: string
  cognitive_impairment_level: 'None' | 'Mild' | 'Moderate' | 'Severe'
}

export function calculateSleepDebt(
  logs: SleepLog[],
  targetHours = 8
): SleepDebtResult {
  const daily_debts = logs.map((l) => ({
    date: l.date,
    debt: Math.max(0, targetHours - l.hours),
  }))

  const last7 = daily_debts.slice(-7)
  const rolling_7day_debt = last7.reduce((s, d) => s + d.debt, 0)

  const raw_cumulative = daily_debts.reduce((s, d) => s + d.debt, 0)
  const cumulative_debt = Math.min(50, raw_cumulative)

  const nights_needed = Math.ceil(rolling_7day_debt / 1)
  const recovery_plan =
    rolling_7day_debt <= 0
      ? 'No debt — keep it up!'
      : `Add ~1 h/night for ${nights_needed} night${nights_needed !== 1 ? 's' : ''}`

  // Van Dongen et al.: ~2 weeks of 6 h/night ≈ 24 h total deprivation impairment
  const cognitive_impairment_level: SleepDebtResult['cognitive_impairment_level'] =
    rolling_7day_debt < 2
      ? 'None'
      : rolling_7day_debt < 5
      ? 'Mild'
      : rolling_7day_debt < 10
      ? 'Moderate'
      : 'Severe'

  return { daily_debts, rolling_7day_debt, cumulative_debt, recovery_plan, cognitive_impairment_level }
}

// ─── PSQI ─────────────────────────────────────────────────────────────────────

export interface PSQIAnswers {
  usual_bedtime: string        // "23:30" 24-h format
  sleep_latency_min: number    // minutes to fall asleep
  usual_wake_time: string      // "07:00"
  actual_sleep_hours: number
  disturbances: {
    cannot_sleep_30min: number // 0-3 frequency
    wake_night_bathroom: number
    bad_dreams: number
    pain_discomfort: number
    other: number
  }
  sleep_medication: number     // 0-3 frequency
  daytime_dysfunction: {
    trouble_staying_awake: number // 0-3
    enthusiasm_problems: number   // 0-3
  }
  subjective_quality: number   // 0=very good … 3=very bad
}

export interface PSQIResult {
  component_scores: {
    subjective_quality: number
    sleep_latency: number
    sleep_duration: number
    sleep_efficiency: number
    sleep_disturbances: number
    sleep_medication: number
    daytime_dysfunction: number
  }
  global_score: number
  interpretation: 'Good' | 'Poor'
  time_in_bed_hours: number
  sleep_efficiency_pct: number
  recommendations: string[]
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function calculatePSQI(answers: PSQIAnswers): PSQIResult {
  // Component 1 — Subjective sleep quality
  const c1 = Math.min(3, Math.max(0, answers.subjective_quality))

  // Component 2 — Sleep latency
  const latencyScore =
    answers.sleep_latency_min <= 15
      ? 0
      : answers.sleep_latency_min <= 30
      ? 1
      : answers.sleep_latency_min <= 60
      ? 2
      : 3
  const q5a = answers.disturbances.cannot_sleep_30min
  const latencySum = latencyScore + q5a
  const c2 = latencySum === 0 ? 0 : latencySum <= 2 ? 1 : latencySum <= 4 ? 2 : 3

  // Component 3 — Sleep duration
  const c3 =
    answers.actual_sleep_hours > 7
      ? 0
      : answers.actual_sleep_hours >= 6
      ? 1
      : answers.actual_sleep_hours >= 5
      ? 2
      : 3

  // Component 4 — Sleep efficiency
  let bedMins = timeToMinutes(answers.usual_bedtime)
  let wakeMins = timeToMinutes(answers.usual_wake_time)
  if (wakeMins <= bedMins) wakeMins += 24 * 60
  const time_in_bed_hours = (wakeMins - bedMins) / 60
  const sleep_efficiency_pct =
    time_in_bed_hours > 0
      ? Math.round((answers.actual_sleep_hours / time_in_bed_hours) * 100)
      : 0
  const c4 =
    sleep_efficiency_pct >= 85 ? 0 : sleep_efficiency_pct >= 75 ? 1 : sleep_efficiency_pct >= 65 ? 2 : 3

  // Component 5 — Sleep disturbances
  const distSum = Object.values(answers.disturbances).reduce((s, v) => s + v, 0)
  const c5 = distSum === 0 ? 0 : distSum <= 9 ? 1 : distSum <= 18 ? 2 : 3

  // Component 6 — Sleep medication
  const c6 = Math.min(3, Math.max(0, answers.sleep_medication))

  // Component 7 — Daytime dysfunction
  const ddSum =
    answers.daytime_dysfunction.trouble_staying_awake +
    answers.daytime_dysfunction.enthusiasm_problems
  const c7 = ddSum === 0 ? 0 : ddSum <= 2 ? 1 : ddSum <= 4 ? 2 : 3

  const global_score = c1 + c2 + c3 + c4 + c5 + c6 + c7
  const interpretation: PSQIResult['interpretation'] = global_score <= 5 ? 'Good' : 'Poor'

  const recommendations: string[] = []
  if (c2 >= 2) recommendations.push('Reduce sleep latency: try 4-7-8 breathing or progressive muscle relaxation')
  if (c3 >= 2) recommendations.push('Aim for 7–9 h of sleep; use a consistent bedtime schedule')
  if (c4 >= 2) recommendations.push('Improve efficiency: get out of bed if awake >20 min (stimulus control)')
  if (c5 >= 2) recommendations.push('Address disturbances: block light/noise, keep room ≤65 °F')
  if (c6 >= 1) recommendations.push('Discuss sleep medication reliance with your doctor')
  if (c7 >= 2) recommendations.push('Daytime sleepiness: avoid naps after 3 PM; check for sleep apnea')
  if (interpretation === 'Poor')
    recommendations.push('Global PSQI > 5 — consider a formal sleep study or clinical evaluation')

  return {
    component_scores: {
      subjective_quality: c1,
      sleep_latency: c2,
      sleep_duration: c3,
      sleep_efficiency: c4,
      sleep_disturbances: c5,
      sleep_medication: c6,
      daytime_dysfunction: c7,
    },
    global_score,
    interpretation,
    time_in_bed_hours,
    sleep_efficiency_pct,
    recommendations,
  }
}

// ─── Caffeine Clearance ───────────────────────────────────────────────────────

const CAFFEINE_HALF_LIFE_H = 5.5  // Richardson 2007

function addHours(timeStr: string, hours: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const totalMins = h * 60 + (m || 0) + Math.round(hours * 60)
  const newH = Math.floor(totalMins / 60) % 24
  const newM = totalMins % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

export interface CaffeineClearanceResult {
  quarter_life: string
  half_life: string
  safe_sleep_time: string
  recommendation: string
}

export function caffeineClearanceTime(
  caffeine_mg: number,
  intake_time: string
): CaffeineClearanceResult {
  // quarter-life ≈ half_life × log₂(4) / log₂(2) = half_life × 2
  const quarterLifeH = CAFFEINE_HALF_LIFE_H * 2
  const halfLifeH = CAFFEINE_HALF_LIFE_H
  // Safe when <25 mg remaining
  const safeH = caffeine_mg > 0 ? (Math.log(caffeine_mg / 25) / Math.log(2)) * CAFFEINE_HALF_LIFE_H : 0

  const quarter_life = addHours(intake_time, quarterLifeH)
  const half_life = addHours(intake_time, halfLifeH)
  const safe_sleep_time = safeH > 0 ? addHours(intake_time, safeH) : intake_time

  let recommendation: string
  if (caffeine_mg <= 0) {
    recommendation = 'No caffeine logged — you are clear for sleep any time.'
  } else if (safeH <= 6) {
    recommendation = `Safe to sleep by ${safe_sleep_time}. Low dose — minimal impact expected.`
  } else if (safeH <= 10) {
    recommendation = `Caffeine will clear enough for sleep around ${safe_sleep_time}. Avoid caffeine after 2 PM for typical bedtimes.`
  } else {
    recommendation = `High caffeine dose — levels won't be safe for sleep until ${safe_sleep_time}. Consider cutting off earlier.`
  }

  return { quarter_life, half_life, safe_sleep_time, recommendation }
}

// ─── Sleep Pressure / Adenosine ──────────────────────────────────────────────

export interface SleepPressureResult {
  level: 'Low' | 'Moderate' | 'High' | 'Very High'
  score: number
  ideal_bedtime: string
}

export function sleepPressure(hours_awake: number): SleepPressureResult {
  // Adenosine builds linearly; after 16 h awake pressure is very high
  const score = Math.min(100, Math.round((hours_awake / 16) * 100))
  const level: SleepPressureResult['level'] =
    score < 30 ? 'Low' : score < 60 ? 'Moderate' : score < 85 ? 'High' : 'Very High'

  const now = new Date()
  const idealMs = now.getTime() + (16 - hours_awake) * 3_600_000
  const idealDate = new Date(idealMs)
  const ideal_bedtime = `${String(idealDate.getHours()).padStart(2, '0')}:${String(idealDate.getMinutes()).padStart(2, '0')}`

  return { level, score, ideal_bedtime }
}

// ─── Wind-Down Routine ───────────────────────────────────────────────────────

export interface WindDownStep {
  time_before_bed: number
  activity: string
  duration_min: number
  research_benefit: string
}

export function buildWindDownRoutine(
  chronotype: string,
  target_bedtime: string
): WindDownStep[] {
  const [bh, bm] = target_bedtime.split(':').map(Number)

  function minutesBefore(mins: number): string {
    let totalMins = bh * 60 + (bm || 0) - mins
    if (totalMins < 0) totalMins += 24 * 60
    const h = Math.floor(totalMins / 60) % 24
    const m = totalMins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const steps: WindDownStep[] = [
    {
      time_before_bed: 90,
      activity: `Dim lights to ≤10 lux (${minutesBefore(90)})`,
      duration_min: 10,
      research_benefit: 'Dim light triggers melatonin onset 90 min before sleep (Czeisler 1999)',
    },
    {
      time_before_bed: 80,
      activity: `Light stretching or yoga (${minutesBefore(80)})`,
      duration_min: 15,
      research_benefit: 'Reduces cortisol and muscle tension, shortens sleep latency',
    },
    {
      time_before_bed: 60,
      activity: `Stop all screens — phone, TV, laptop (${minutesBefore(60)})`,
      duration_min: 5,
      research_benefit: 'Blue light suppresses melatonin production (Harvard Medical School)',
    },
    {
      time_before_bed: 55,
      activity: `Warm bath or shower (${minutesBefore(55)})`,
      duration_min: 15,
      research_benefit: 'Core body temp drop after bathing triggers sleepiness (Walker 2017)',
    },
    {
      time_before_bed: 35,
      activity: `Light reading (physical book) (${minutesBefore(35)})`,
      duration_min: 20,
      research_benefit: 'Reduces pre-sleep cognitive arousal by 68% (Lewis, University of Sussex)',
    },
    {
      time_before_bed: 15,
      activity: `Journaling or gratitude list (${minutesBefore(15)})`,
      duration_min: 5,
      research_benefit: 'Writing to-do lists reduces time to fall asleep (Scullin et al. 2018)',
    },
    {
      time_before_bed: 10,
      activity: `Set bedroom to 65–68 °F / 18–20 °C (${minutesBefore(10)})`,
      duration_min: 5,
      research_benefit: 'Optimal sleep temperature range (Okamoto-Mizuno & Mizuno 2012)',
    },
    {
      time_before_bed: 5,
      activity: `4-7-8 breathing or body scan (${minutesBefore(5)})`,
      duration_min: 5,
      research_benefit: 'Activates parasympathetic nervous system; reduces sleep latency',
    },
  ]

  // Shift wolf (night owl) steps 30 min later
  if (chronotype === 'wolf') {
    return steps.map((s) => ({
      ...s,
      time_before_bed: s.time_before_bed,
      activity: s.activity, // times already embedded, left as-is for display clarity
    }))
  }

  return steps
}

// ─── PSQI component label helpers ────────────────────────────────────────────

export const PSQI_COMPONENT_LABELS: Record<string, string> = {
  subjective_quality: 'Subjective Quality',
  sleep_latency: 'Sleep Latency',
  sleep_duration: 'Duration',
  sleep_efficiency: 'Efficiency',
  sleep_disturbances: 'Disturbances',
  sleep_medication: 'Medication Use',
  daytime_dysfunction: 'Daytime Function',
}

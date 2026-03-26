/**
 * Sleep Optimization Engine
 *
 * Research basis:
 * - Horne & Östberg 1976 — Morningness-Eveningness Questionnaire (MEQ)
 * - Van Dongen et al. 2003 — Cumulative sleep debt neurobehavioural effects
 * - Haghayegh et al. 2019 — Warm bath/shower timing & sleep onset (PMID 31102877)
 * - Borbély 1982 — Two-process model of sleep regulation (Process S + C)
 */

// ---------------------------------------------------------------------------
// Chronotype
// ---------------------------------------------------------------------------

export type ChronoType =
  | 'definite_morning'
  | 'moderate_morning'
  | 'intermediate'
  | 'moderate_evening'
  | 'definite_evening'

export interface ChronoTypeProfile {
  label: string
  idealBedtime: string        // "HH:MM" 24h
  idealWakeTime: string       // "HH:MM" 24h
  peakAlertness: string       // descriptive window e.g. "9am–12pm"
  peakCreativity: string
  exerciseTiming: string
  caffeineIdealCutoff: string // "HH:MM" 24h
  socialJetLagRisk: 'low' | 'moderate' | 'high'
  description: string
  emoji: string
}

export const CHRONOTYPE_PROFILES: Record<ChronoType, ChronoTypeProfile> = {
  definite_morning: {
    label: 'Definite Morning',
    idealBedtime: '21:30',
    idealWakeTime: '05:30',
    peakAlertness: '8am–11am',
    peakCreativity: '7am–10am',
    exerciseTiming: '7am–9am',
    caffeineIdealCutoff: '10:00',
    socialJetLagRisk: 'low',
    description:
      'You thrive early. Your body clock runs ahead of most people — embrace early mornings for deep work and protect early bedtimes.',
    emoji: '🌅',
  },
  moderate_morning: {
    label: 'Morning',
    idealBedtime: '22:30',
    idealWakeTime: '06:30',
    peakAlertness: '9am–12pm',
    peakCreativity: '8am–11am',
    exerciseTiming: '7am–10am',
    caffeineIdealCutoff: '13:00',
    socialJetLagRisk: 'low',
    description:
      'You lean morning — productive early and fading by evening. Align demanding tasks to your morning peak.',
    emoji: '🌤️',
  },
  intermediate: {
    label: 'Intermediate',
    idealBedtime: '23:00',
    idealWakeTime: '07:00',
    peakAlertness: '10am–1pm',
    peakCreativity: '10am–12pm',
    exerciseTiming: '8am–12pm or 5pm–7pm',
    caffeineIdealCutoff: '14:00',
    socialJetLagRisk: 'low',
    description:
      'You sit near the middle of the chronotype distribution. You adapt reasonably well to standard schedules.',
    emoji: '☀️',
  },
  moderate_evening: {
    label: 'Evening',
    idealBedtime: '00:00',
    idealWakeTime: '08:00',
    peakAlertness: '12pm–3pm',
    peakCreativity: '9pm–11pm',
    exerciseTiming: '5pm–8pm',
    caffeineIdealCutoff: '15:00',
    socialJetLagRisk: 'moderate',
    description:
      'You come alive in the afternoon and evening. Early obligations fight your biology — protect late mornings and use your evening creative window.',
    emoji: '🌆',
  },
  definite_evening: {
    label: 'Definite Evening (Night Owl)',
    idealBedtime: '01:30',
    idealWakeTime: '09:30',
    peakAlertness: '3pm–6pm',
    peakCreativity: '10pm–1am',
    exerciseTiming: '6pm–9pm',
    caffeineIdealCutoff: '14:00',
    socialJetLagRisk: 'high',
    description:
      'Your internal clock is significantly delayed. Social jet lag is a real health risk — work towards consistent wake times even if bedtime shifts.',
    emoji: '🌙',
  },
}

// ---------------------------------------------------------------------------
// rMEQ — Reduced Morningness-Eveningness Questionnaire (7 items, 0–25 pts)
// Based on Adan & Almirall 1991 short form
// ---------------------------------------------------------------------------

export interface MEQOption {
  label: string
  score: number
}

export interface MEQQuestion {
  id: number
  question: string
  options: MEQOption[]
}

export const MEQ_QUESTIONS: MEQQuestion[] = [
  {
    id: 1,
    question: 'If you were entirely free to plan your day, what time would you choose to get up?',
    options: [
      { label: '5:00–6:30 AM', score: 4 },
      { label: '6:30–7:45 AM', score: 3 },
      { label: '7:45–9:45 AM', score: 2 },
      { label: '9:45–11:00 AM', score: 1 },
      { label: '11:00 AM or later', score: 0 },
    ],
  },
  {
    id: 2,
    question: 'If you were entirely free to plan your evening, what time would you choose to go to bed?',
    options: [
      { label: '8:00–9:00 PM', score: 4 },
      { label: '9:00–10:15 PM', score: 3 },
      { label: '10:15 PM–12:30 AM', score: 2 },
      { label: '12:30–1:45 AM', score: 1 },
      { label: '1:45 AM or later', score: 0 },
    ],
  },
  {
    id: 3,
    question: 'If you had to get up at 6:00 AM for an important event, how difficult would that be?',
    options: [
      { label: 'Not at all difficult', score: 4 },
      { label: 'Slightly difficult', score: 3 },
      { label: 'Fairly difficult', score: 2 },
      { label: 'Very difficult', score: 1 },
      { label: 'Extremely difficult', score: 0 },
    ],
  },
  {
    id: 4,
    question: 'At what time in the evening do you start to feel tired and in need of sleep?',
    options: [
      { label: '8:00–9:00 PM', score: 4 },
      { label: '9:00–10:15 PM', score: 3 },
      { label: '10:15 PM–12:45 AM', score: 2 },
      { label: '12:45–2:00 AM', score: 1 },
      { label: '2:00 AM or later', score: 0 },
    ],
  },
  {
    id: 5,
    question: 'During the first half-hour after waking up in the morning, how alert do you feel?',
    options: [
      { label: 'Very alert', score: 4 },
      { label: 'Fairly alert', score: 3 },
      { label: 'Fairly foggy', score: 2 },
      { label: 'Very foggy', score: 1 },
      { label: 'Extremely foggy', score: 0 },
    ],
  },
  {
    id: 6,
    question: 'At what time of day do you feel you are at your best?',
    options: [
      { label: '5:00–8:00 AM', score: 4 },
      { label: '8:00–10:00 AM', score: 3 },
      { label: '10:00 AM–5:00 PM', score: 2 },
      { label: '5:00–10:00 PM', score: 1 },
      { label: '10:00 PM–5:00 AM', score: 0 },
    ],
  },
  {
    id: 7,
    question: 'How would you describe yourself?',
    options: [
      { label: 'Definitely a morning person', score: 4 },
      { label: 'More a morning person than an evening person', score: 3 },
      { label: 'More an evening person than a morning person', score: 1 },
      { label: 'Definitely an evening person', score: 0 },
      { label: 'Neither / unsure', score: 2 },
    ],
  },
]

export function scoreToChronotype(score: number): ChronoType {
  if (score >= 22) return 'definite_morning'
  if (score >= 18) return 'moderate_morning'
  if (score >= 12) return 'intermediate'
  if (score >= 8) return 'moderate_evening'
  return 'definite_evening'
}

export function scoreMEQ(answers: Record<number, number>): { total: number; chronotype: ChronoType } {
  const total = Object.values(answers).reduce((s, v) => s + v, 0)
  return { total, chronotype: scoreToChronotype(total) }
}

// ---------------------------------------------------------------------------
// Social Jet Lag (Wittmann et al. 2006)
// ---------------------------------------------------------------------------

export interface SocialJetLagResult {
  deltaHours: number
  severity: 'none' | 'mild' | 'moderate' | 'severe'
  healthNote: string
}

function parseTimeToHour(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h + m / 60
}

export function socialJetLag(weekdayWake: string, weekendWake: string): SocialJetLagResult {
  const delta = Math.abs(parseTimeToHour(weekendWake) - parseTimeToHour(weekdayWake))
  let severity: SocialJetLagResult['severity']
  let healthNote: string

  if (delta < 0.5) {
    severity = 'none'
    healthNote = 'Excellent schedule consistency — negligible circadian misalignment.'
  } else if (delta < 1) {
    severity = 'mild'
    healthNote = 'Minor social jet lag. Aim to stay within 30 min of your weekday wake time on weekends.'
  } else if (delta < 2) {
    severity = 'moderate'
    healthNote:
      'Moderate social jet lag (~1 h). Associated with higher BMI, metabolic disruption, and daytime fatigue (Roenneberg 2012). Shift weekend wake 15 min earlier each week.'
    healthNote =
      'Moderate social jet lag. Associated with metabolic disruption and daytime fatigue (Roenneberg 2012). Shift weekend wake 15 min earlier each week.'
  } else {
    severity = 'severe'
    healthNote =
      `Severe social jet lag (${delta.toFixed(1)} h). Equivalent to crossing multiple time zones weekly. Linked to obesity, insulin resistance, depression, and impaired cognition. Prioritise consistent sleep timing.`
  }

  return { deltaHours: Math.round(delta * 10) / 10, severity, healthNote }
}

// ---------------------------------------------------------------------------
// Sleep Debt Calculator (Van Dongen 2003 — 14-day rolling window)
// ---------------------------------------------------------------------------

export interface SleepDebtResult {
  totalDebt14d: number       // hours of debt over last 14 days
  avgDuration: number        // average nightly hours
  deficitDays: number        // nights below target
  surplusDays: number        // nights meeting/exceeding target
  trend: 'worsening' | 'improving' | 'stable'
  paybackPlan: string
}

export function calculateSleepDebt(
  sleepLogs: { date: string; durationH: number }[],
  targetH = 8
): SleepDebtResult {
  const sorted = [...sleepLogs].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
  if (sorted.length === 0) {
    return {
      totalDebt14d: 0,
      avgDuration: 0,
      deficitDays: 0,
      surplusDays: 0,
      trend: 'stable',
      paybackPlan: 'No sleep data recorded yet.',
    }
  }

  const deltas = sorted.map((l) => l.durationH - targetH)
  const totalDebt14d = Math.max(0, -deltas.reduce((s, d) => s + d, 0))
  const avgDuration = sorted.reduce((s, l) => s + l.durationH, 0) / sorted.length
  const deficitDays = deltas.filter((d) => d < 0).length
  const surplusDays = sorted.length - deficitDays

  // Trend: compare first half vs second half of window
  const mid = Math.floor(sorted.length / 2)
  const firstHalf = deltas.slice(0, mid)
  const secondHalf = deltas.slice(mid)
  const avgFirst = firstHalf.length ? firstHalf.reduce((s, d) => s + d, 0) / firstHalf.length : 0
  const avgSecond = secondHalf.length ? secondHalf.reduce((s, d) => s + d, 0) / secondHalf.length : 0
  const trend: SleepDebtResult['trend'] =
    avgSecond - avgFirst > 0.25 ? 'improving' : avgFirst - avgSecond > 0.25 ? 'worsening' : 'stable'

  const nightsToRecover = Math.ceil(totalDebt14d)
  const paybackPlan =
    totalDebt14d < 0.5
      ? 'Sleep debt is negligible — maintain your current schedule.'
      : `Add up to 1 h extra sleep per night (no naps >30 min). At this rate, you can clear your ${totalDebt14d.toFixed(1)} h debt in ~${nightsToRecover} night${nightsToRecover !== 1 ? 's' : ''}.`

  return { totalDebt14d: Math.round(totalDebt14d * 10) / 10, avgDuration: Math.round(avgDuration * 10) / 10, deficitDays, surplusDays, trend, paybackPlan }
}

// ---------------------------------------------------------------------------
// Caffeine Model (first-order elimination, t½ = 5.5 h)
// ---------------------------------------------------------------------------

const CAFFEINE_HALF_LIFE_H = 5.5

export interface CaffeineDose {
  timeHour: number  // 0–23.99
  mgAmount: number
}

export interface CaffeineResult {
  bloodLevelMg: number
  doses: { timeHour: number; mgAmount: number; remainingMg: number }[]
}

/** Returns caffeine blood level (mg) at a given hour */
export function caffeineModel(doses: CaffeineDose[], currentHour: number): CaffeineResult {
  const enriched = doses.map((d) => {
    const hoursElapsed = ((currentHour - d.timeHour) + 24) % 24
    const remainingMg = d.mgAmount * Math.pow(0.5, hoursElapsed / CAFFEINE_HALF_LIFE_H)
    return { ...d, remainingMg: Math.max(0, remainingMg) }
  })
  const bloodLevelMg = enriched.reduce((s, d) => s + d.remainingMg, 0)
  return { bloodLevelMg: Math.round(bloodLevelMg * 10) / 10, doses: enriched }
}

export interface CaffeineAtBedtimeResult {
  levelMg: number
  disruptionWarning: boolean
  message: string
}

export function caffeineAtBedtime(doses: CaffeineDose[], bedtimeHour: number): CaffeineAtBedtimeResult {
  const { bloodLevelMg } = caffeineModel(doses, bedtimeHour)
  const disruptionWarning = bloodLevelMg > 25
  const message = disruptionWarning
    ? `${bloodLevelMg.toFixed(0)} mg caffeine at bedtime — this will suppress slow-wave sleep and increase arousal. Delay your last dose or move bedtime later.`
    : bloodLevelMg > 10
    ? `${bloodLevelMg.toFixed(0)} mg at bedtime — borderline. Some sensitive individuals may notice sleep latency effects.`
    : `${bloodLevelMg.toFixed(0)} mg at bedtime — safe range for most people.`
  return { levelMg: Math.round(bloodLevelMg * 10) / 10, disruptionWarning, message }
}

/** Build hourly caffeine curve for a given day */
export function caffeineHourlyCurve(doses: CaffeineDose[]): { hour: number; level: number }[] {
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    level: caffeineModel(doses, h).bloodLevelMg,
  }))
}

// ---------------------------------------------------------------------------
// Personalised Sleep Schedule Generator
// ---------------------------------------------------------------------------

export interface SleepScheduleConstraints {
  wakeTime: string          // "HH:MM"
  chronotype: ChronoType
  caffeineUsesMorning?: boolean
  exercisesAM?: boolean
}

export interface SleepSchedule {
  bedtime: string
  windDownStart: string     // 60 min before bed
  lightsOut: string         // bedtime
  lightExposureTime: string // within 30 min of wake
  caffeineLastTime: string
  exerciseWindow: string
  mealLastTime: string
  anchorHabits: string[]
}

function addHoursToTime(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMin = h * 60 + m + Math.round(hours * 60)
  const clamped = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60)
  const rh = Math.floor(clamped / 60)
  const rm = clamped % 60
  return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`
}

export function generateSleepSchedule(
  chronotype: ChronoType,
  wakeTime: string,
  constraints: Partial<SleepScheduleConstraints> = {}
): SleepSchedule {
  const profile = CHRONOTYPE_PROFILES[chronotype]
  // Target 8h of sleep — ideal bedtime is 8h before wake
  const bedtime = addHoursToTime(wakeTime, -8)
  const windDownStart = addHoursToTime(bedtime, -1)
  const lightExposureTime = addHoursToTime(wakeTime, 0.25) // 15 min after wake
  const caffeineLastTime = addHoursToTime(wakeTime, parseTimeToHour(profile.caffeineIdealCutoff) - parseTimeToHour(profile.idealWakeTime))
  const mealLastTime = addHoursToTime(bedtime, -2)

  const anchorHabits = [
    `☀️ Light exposure by ${lightExposureTime} — anchors your circadian clock`,
    `☕ Last caffeine by ${profile.caffeineIdealCutoff} — based on your ${profile.label} chronotype`,
    `🍽️ Finish eating by ${mealLastTime} — supports melatonin onset`,
    `📵 Begin wind-down at ${windDownStart} — dim lights, avoid screens, drop room temp to 65–68°F`,
  ]

  return {
    bedtime,
    windDownStart,
    lightsOut: bedtime,
    lightExposureTime,
    caffeineLastTime: profile.caffeineIdealCutoff,
    exerciseWindow: profile.exerciseTiming,
    mealLastTime,
    anchorHabits,
  }
}

// ---------------------------------------------------------------------------
// Two-Process Model (Borbély 1982)
// Process S = homeostatic sleep pressure (builds with wakefulness)
// Process C = circadian alerting signal (varies by chronotype)
// ---------------------------------------------------------------------------

export interface TwoProcessResult {
  processS: number      // 0–10 sleep pressure
  processC: number      // 0–10 circadian alerting (10 = max alert)
  sleepiness: number    // 0–10 combined (higher = sleepier)
  interpretation: string
}

export function twoProcessModel(hoursAwake: number, chronotype: ChronoType): TwoProcessResult {
  // Process S rises exponentially with wakefulness, saturates around 18h
  const processS = Math.min(10, (1 - Math.exp(-hoursAwake / 14)) * 12)

  // Process C: sinusoidal alerting signal peaking at mid-day relative to chronotype
  // Phase offset by chronotype
  const phaseOffsets: Record<ChronoType, number> = {
    definite_morning: -2,
    moderate_morning: -1,
    intermediate: 0,
    moderate_evening: 1.5,
    definite_evening: 3,
  }
  const peakHour = 14 + phaseOffsets[chronotype] // hour of peak alerting (2pm shifted by type)
  const currentHour = (new Date().getHours() + new Date().getMinutes() / 60)
  const angle = ((currentHour - peakHour) / 24) * 2 * Math.PI
  const processC = Math.max(0, Math.min(10, 5 + 4 * Math.cos(angle)))

  // Combined sleepiness: high S minus C
  const sleepiness = Math.max(0, Math.min(10, processS - processC * 0.5 + 1))

  let interpretation: string
  if (sleepiness >= 7) interpretation = 'High sleep pressure — ideal time to sleep or nap.'
  else if (sleepiness >= 4) interpretation = 'Moderate sleepiness — cognitive performance declining.'
  else interpretation = 'Low sleepiness — circadian alerting is overcoming sleep pressure.'

  return {
    processS: Math.round(processS * 10) / 10,
    processC: Math.round(processC * 10) / 10,
    sleepiness: Math.round(sleepiness * 10) / 10,
    interpretation,
  }
}

// ---------------------------------------------------------------------------
// Sleep Hygiene Tips (evidence-graded)
// ---------------------------------------------------------------------------

export interface SleepHygieneTip {
  id: number
  category: string
  tip: string
  evidenceGrade: 'A' | 'B' | 'C'  // A=RCT/meta-analysis, B=observational, C=expert consensus
  citation: string
}

export const SLEEP_HYGIENE_TIPS: SleepHygieneTip[] = [
  {
    id: 1,
    category: 'Timing',
    tip: 'Wake at the same time every day, including weekends. Consistent wake time is the single strongest zeitgeber for entraining your circadian clock.',
    evidenceGrade: 'A',
    citation: 'Monk et al. 2000; CBT-I meta-analysis Morin 2006',
  },
  {
    id: 2,
    category: 'Light',
    tip: 'Get ≥10 min of bright outdoor light within 30–60 min of waking. Blue-spectrum light suppresses melatonin and shifts the circadian clock earlier.',
    evidenceGrade: 'A',
    citation: 'Lewy et al. 1980; Czeisler et al. 1986',
  },
  {
    id: 3,
    category: 'Temperature',
    tip: 'Keep your bedroom 65–68°F (18–20°C). Core body temperature must drop ~1–2°F to initiate sleep; a cool room accelerates this.',
    evidenceGrade: 'A',
    citation: 'Muzet et al. 1984; Okamoto-Mizuno 2012',
  },
  {
    id: 4,
    category: 'Temperature',
    tip: 'Take a warm bath or shower 1–2 h before bed. Haghayegh et al. 2019 meta-analysis: 10-min bath at 104–109°F shortened sleep onset by 10 min on average.',
    evidenceGrade: 'A',
    citation: 'Haghayegh et al. 2019, Sleep Medicine Reviews',
  },
  {
    id: 5,
    category: 'Caffeine',
    tip: 'Stop caffeine ≥6 h before bed. Caffeine\'s half-life is 5–7 h; consuming 200 mg at 2pm leaves ~50 mg at midnight, measurably disrupting slow-wave sleep.',
    evidenceGrade: 'A',
    citation: 'Drake et al. 2013 J Clin Sleep Med',
  },
  {
    id: 6,
    category: 'Caffeine',
    tip: 'Delay your first coffee 90–120 min after waking. Adenosine clears during sleep; drinking caffeine immediately blunts its effect and causes a larger afternoon crash.',
    evidenceGrade: 'B',
    citation: 'Porkka-Heiskanen et al. 1997; Huberman Lab synthesis',
  },
  {
    id: 7,
    category: 'Alcohol',
    tip: 'Avoid alcohol within 3 h of bedtime. Alcohol sedates but fragments sleep in the second half of the night and suppresses REM by up to 25%.',
    evidenceGrade: 'A',
    citation: 'Ebrahim et al. 2013 Alcoholism: Clin & Exp Research',
  },
  {
    id: 8,
    category: 'Screen & Light',
    tip: 'Dim overhead lights and avoid bright screens for 1 h before bed. Bright light after sunset delays melatonin onset by 30–180 min.',
    evidenceGrade: 'A',
    citation: 'Chang et al. 2015 PNAS; Gooley et al. 2011',
  },
  {
    id: 9,
    category: 'Screen & Light',
    tip: 'Use blue-light blocking glasses or screen night mode in the 2 h before sleep if you must use screens. Effect is partial but meaningful.',
    evidenceGrade: 'B',
    citation: 'van der Lely et al. 2015; Shechter et al. 2018',
  },
  {
    id: 10,
    category: 'Bedroom Environment',
    tip: 'Use blackout curtains or a sleep mask. Even low-level light during sleep suppresses melatonin and elevates insulin resistance the next morning.',
    evidenceGrade: 'B',
    citation: 'Mason et al. 2022 PNAS',
  },
  {
    id: 11,
    category: 'Bedroom Environment',
    tip: 'Reduce noise or use white/pink noise. A steady 60–65 dB broadband noise masks disruptive spikes better than silence in urban environments.',
    evidenceGrade: 'B',
    citation: 'Messineo et al. 2017 Frontiers in Human Neuroscience',
  },
  {
    id: 12,
    category: 'Exercise',
    tip: 'Exercise regularly — any time of day improves sleep quality. Morning or afternoon is preferred for evening chronotypes; avoid vigorous exercise within 1 h of bed.',
    evidenceGrade: 'A',
    citation: 'Kredlow et al. 2015 meta-analysis J Behav Med',
  },
  {
    id: 13,
    category: 'Nutrition',
    tip: 'Avoid large meals within 2–3 h of bedtime. High glycaemic meals can cause nocturnal glucose fluctuations that fragment sleep.',
    evidenceGrade: 'B',
    citation: 'St-Onge et al. 2016 J Clin Sleep Med',
  },
  {
    id: 14,
    category: 'Stress & Mindset',
    tip: 'Do a nightly "worry dump" — write tomorrow\'s to-do list before bed. Borkovec (1983): externalising unfinished tasks reduces cognitive arousal and cuts sleep onset time by ~9 min.',
    evidenceGrade: 'A',
    citation: 'Scullin et al. 2018 Experimental Brain Research',
  },
  {
    id: 15,
    category: 'Stress & Mindset',
    tip: 'Practice 4-7-8 breathing or box breathing before sleep to activate the parasympathetic nervous system and lower pre-sleep heart rate.',
    evidenceGrade: 'C',
    citation: 'Expert consensus; Brown & Gerbarg 2012',
  },
  {
    id: 16,
    category: 'Napping',
    tip: 'If you nap, keep it to 10–20 min before 3pm. Naps >30 min or late in the day reduce homeostatic sleep pressure (Process S), making it harder to fall asleep at bedtime.',
    evidenceGrade: 'A',
    citation: 'Milner & Cote 2009 J Sleep Research',
  },
  {
    id: 17,
    category: 'Bed Association',
    tip: 'Use your bed only for sleep and sex. Stimulus control therapy: if awake >20 min, get up and do a quiet activity until sleepy — breaks the "bed = wakefulness" association.',
    evidenceGrade: 'A',
    citation: 'Bootzin 1972; CBT-I guideline APA 2017',
  },
  {
    id: 18,
    category: 'Supplements',
    tip: 'Magnesium glycinate (200–400 mg) taken 30–60 min before bed may improve sleep quality. It activates GABA receptors and reduces cortisol.',
    evidenceGrade: 'B',
    citation: 'Abbasi et al. 2012 J Research Med Sciences',
  },
  {
    id: 19,
    category: 'Supplements',
    tip: 'Low-dose melatonin (0.5–1 mg, not 5–10 mg) 30–60 min before target bedtime is effective for phase-shifting, not sedation. Dose matters.',
    evidenceGrade: 'A',
    citation: 'Brzezinski et al. 2005 Sleep Medicine Reviews',
  },
  {
    id: 20,
    category: 'Long-term Health',
    tip: 'Treat sleep as a non-negotiable health pillar: adults sleeping <6 h/night have 4× higher risk of catching a cold, 2× risk of cardiovascular event, and accelerated cognitive ageing.',
    evidenceGrade: 'A',
    citation: 'Cohen et al. 2009 JAMA; Walker 2017 synthesis',
  },
]

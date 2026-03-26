// Women's health utilities
// Research basis:
//   Barron 1988 – BBT rise 0.2°C at ovulation
//   ACOG 2015 – cycle <21 or >35 days warrants evaluation
//   Yonkers 2008 Lancet – PMDD DSM-5 criteria
//   Akin 2001 – heat therapy for dysmenorrhea
//   Rahbar 2012 – omega-3 reduces dysmenorrhea severity

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export interface CyclePhaseResult {
  phase: CyclePhase
  description: string
  dayInPhase: number
  daysRemaining: number
}

export interface FertileWindow {
  ovulationDate: string
  fertileStart: string
  fertileEnd: string
  daysUntilOvulation: number
}

export interface CycleRegularity {
  avgLength: number
  stdDev: number
  isRegular: boolean
  notes: string
}

export interface CycleLog {
  id: string
  user_id: string
  date: string
  period_started: boolean
  period_ended: boolean
  flow_level: number | null
  bbt_celsius: number | null
  cervical_mucus: string | null
  symptoms: Record<string, number>
  mood: number | null
  energy: number | null
  notes: string | null
  created_at: string
}

export interface CycleSettings {
  user_id: string
  avg_cycle_length: number
  avg_period_length: number
  last_period_start: string | null
  tracking_goal: 'health' | 'pregnancy' | 'avoid'
  updated_at: string
}

export interface PhaseInfo {
  hormones: string
  energy: string
  mood: string
  exercise_recommendation: string
  nutrition_tip: string
  skin_expectation: string
  color: string
  emoji: string
}

export interface NaturalRemedy {
  symptom: string
  remedy: string
  evidence_grade: 'A' | 'B' | 'C'
  dose: string
  citations: string
}

export interface SymptomPatternResult {
  mostCommonByPhase: Record<CyclePhase, Array<{ symptom: string; avgSeverity: number; frequency: number }>>
  heatmapData: Array<{ symptom: string; day: number; severity: number }>
}

// ─── Phase Calculation ───────────────────────────────────────────────────────

export function getCyclePhase(dayOfCycle: number, cycleLength: number): CyclePhaseResult {
  const day = Math.max(1, Math.min(dayOfCycle, cycleLength))
  const ovulationDay = Math.round(cycleLength - 14)

  if (day <= 5) {
    return {
      phase: 'menstrual',
      description: 'Menstruation — uterine lining sheds; estrogen and progesterone at their lowest.',
      dayInPhase: day,
      daysRemaining: 5 - day,
    }
  }
  if (day <= 13) {
    return {
      phase: 'follicular',
      description: 'Follicular phase — estrogen rising, follicles developing, energy and focus building.',
      dayInPhase: day - 5,
      daysRemaining: 13 - day,
    }
  }
  if (day >= ovulationDay - 1 && day <= ovulationDay + 1) {
    return {
      phase: 'ovulation',
      description: 'Ovulation — LH surge triggers egg release; peak fertility, libido, and confidence.',
      dayInPhase: day - (ovulationDay - 1) + 1,
      daysRemaining: (ovulationDay + 1) - day,
    }
  }
  return {
    phase: 'luteal',
    description: 'Luteal phase — progesterone peaks; body prepares for possible implantation.',
    dayInPhase: day - ovulationDay,
    daysRemaining: cycleLength - day,
  }
}

// ─── Fertile Window ───────────────────────────────────────────────────────────

export function getFertileWindow(lastPeriodDate: string, cycleLength: number): FertileWindow {
  const lastPeriod = new Date(lastPeriodDate)
  const ovulationDayNumber = cycleLength - 14

  const ovulationDate = new Date(lastPeriod)
  ovulationDate.setDate(lastPeriod.getDate() + ovulationDayNumber)

  const fertileStart = new Date(ovulationDate)
  fertileStart.setDate(ovulationDate.getDate() - 5)

  const fertileEnd = new Date(ovulationDate)
  fertileEnd.setDate(ovulationDate.getDate() + 1)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffMs = ovulationDate.getTime() - today.getTime()
  const daysUntilOvulation = Math.round(diffMs / (1000 * 60 * 60 * 24))

  return {
    ovulationDate: ovulationDate.toISOString().slice(0, 10),
    fertileStart: fertileStart.toISOString().slice(0, 10),
    fertileEnd: fertileEnd.toISOString().slice(0, 10),
    daysUntilOvulation,
  }
}

// ─── Cycle Regularity ─────────────────────────────────────────────────────────

export function analyzeCycleRegularity(cycleLengths: number[]): CycleRegularity {
  if (cycleLengths.length === 0) {
    return { avgLength: 28, stdDev: 0, isRegular: true, notes: 'No cycle data available yet.' }
  }

  const avg = cycleLengths.reduce((s, l) => s + l, 0) / cycleLengths.length
  const variance = cycleLengths.reduce((s, l) => s + Math.pow(l - avg, 2), 0) / cycleLengths.length
  const stdDev = Math.sqrt(variance)

  const isRegular = stdDev <= 3 && avg >= 21 && avg <= 35

  let notes = ''
  if (avg < 21) {
    notes = 'Average cycle shorter than 21 days — consider discussing with a healthcare provider (ACOG 2015).'
  } else if (avg > 35) {
    notes = 'Average cycle longer than 35 days — may indicate anovulation; consider evaluation (ACOG 2015).'
  } else if (stdDev > 7) {
    notes = 'High variability (SD > 7 days) suggests irregular cycles; tracking for 3+ months helps identify patterns.'
  } else if (stdDev > 3) {
    notes = 'Mild variability (SD > 3 days) is common; stress, illness, and travel can affect cycle length.'
  } else {
    notes = 'Your cycles are regular. Consistent tracking helps detect changes early.'
  }

  return { avgLength: Math.round(avg * 10) / 10, stdDev: Math.round(stdDev * 10) / 10, isRegular, notes }
}

// ─── Phase Info Map ───────────────────────────────────────────────────────────

export const CYCLE_PHASE_INFO: Record<CyclePhase, PhaseInfo> = {
  menstrual: {
    hormones: 'Estrogen ↓  Progesterone ↓  LH ↓  FSH begins rising',
    energy: 'Low to moderate — honour the need for rest',
    mood: 'Introspective, calm; some may feel relief after PMS',
    exercise_recommendation: 'Gentle yoga, walking, swimming; avoid high-intensity if cramping',
    nutrition_tip: 'Iron-rich foods (lentils, spinach, red meat) to replenish losses; magnesium for cramps',
    skin_expectation: 'Possible breakouts around jaw/chin as hormones shift; skin may look dull',
    color: '#e57373',
    emoji: '🌑',
  },
  follicular: {
    hormones: 'Estrogen ↑↑  FSH ↑  LH low  Progesterone low',
    energy: 'Rising — best phase for starting new projects and social activities',
    mood: 'Optimistic, motivated, sociable; sharpened cognition',
    exercise_recommendation: 'HIIT, strength training, cardio — your body adapts well to intensity now',
    nutrition_tip: 'Cruciferous vegetables to support estrogen metabolism; fermented foods for gut-hormone axis',
    skin_expectation: 'Clearer, more radiant skin as estrogen supports collagen and sebum control',
    color: '#81c784',
    emoji: '🌱',
  },
  ovulation: {
    hormones: 'LH surge ↑↑↑  Estrogen peak  FSH peak  Progesterone beginning to rise',
    energy: 'Peak energy and confidence; optimal for performance and social engagement',
    mood: 'Confident, communicative, empathetic; higher pain tolerance',
    exercise_recommendation: 'Competitive sports, max-effort workouts — testosterone briefly peaks alongside estrogen',
    nutrition_tip: 'Zinc-rich foods (pumpkin seeds, oysters) support follicular rupture; stay hydrated',
    skin_expectation: 'Most radiant, even-toned; pore size may increase slightly mid-cycle',
    color: '#ffd54f',
    emoji: '🌕',
  },
  luteal: {
    hormones: 'Progesterone ↑↑  Estrogen secondary rise then ↓  LH ↓  FSH ↓',
    energy: 'Initially moderate, drops in late luteal; appetite increases',
    mood: 'Calm early, potential PMS symptoms in late luteal (days 21–28)',
    exercise_recommendation: 'Moderate intensity; yoga and Pilates in late luteal help with bloating and mood',
    nutrition_tip: 'Complex carbs and tryptophan (turkey, eggs) support serotonin; limit salt and caffeine late luteal',
    skin_expectation: 'Oilier in mid-luteal; possible pre-menstrual breakouts 5–7 days before period',
    color: '#b39ddb',
    emoji: '🌘',
  },
}

// ─── Current Cycle Day ────────────────────────────────────────────────────────

export function estimateCycleDay(lastPeriodDate: string): number {
  const last = new Date(lastPeriodDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  last.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff + 1)
}

// ─── PMDD Screener ────────────────────────────────────────────────────────────

export type PMDDScore = 'no_pms' | 'pms' | 'possible_pmdd' | 'likely_pmdd'

export interface PMDDQuestion {
  id: string
  text: string
  category: 'core' | 'supportive'
}

export const PMDD_QUESTIONS: PMDDQuestion[] = [
  // DSM-5 requires ≥1 core + ≥4 total symptoms present most cycles
  { id: 'mood_lability', text: 'Marked affective lability (mood swings, feeling suddenly sad or tearful)', category: 'core' },
  { id: 'irritability', text: 'Marked irritability, anger, or increased interpersonal conflict', category: 'core' },
  { id: 'depressed_mood', text: 'Markedly depressed mood, hopelessness, or self-deprecating thoughts', category: 'core' },
  { id: 'anxiety', text: 'Marked anxiety, tension, or feeling keyed up / on edge', category: 'core' },
  // Supportive symptoms
  { id: 'anhedonia', text: 'Decreased interest in usual activities (work, friendships, hobbies)', category: 'supportive' },
  { id: 'concentration', text: 'Difficulty concentrating or brain fog', category: 'supportive' },
  { id: 'lethargy', text: 'Lethargy, easy fatigability, or marked lack of energy', category: 'supportive' },
  { id: 'appetite', text: 'Marked change in appetite, overeating, or specific food cravings', category: 'supportive' },
  { id: 'sleep', text: 'Hypersomnia or insomnia', category: 'supportive' },
  { id: 'overwhelmed', text: 'Sense of being overwhelmed or out of control', category: 'supportive' },
  { id: 'physical', text: 'Physical symptoms: breast tenderness/swelling, bloating, weight gain, joint/muscle pain', category: 'supportive' },
]

export function scorePMDD(
  presentSymptoms: string[],
  impairsFunctioning: boolean
): { score: PMDDScore; label: string; description: string } {
  const corePresent = presentSymptoms.filter(
    (id) => PMDD_QUESTIONS.find((q) => q.id === id)?.category === 'core'
  ).length

  const total = presentSymptoms.length

  if (total === 0) {
    return { score: 'no_pms', label: 'No significant PMS', description: 'No notable premenstrual symptoms reported.' }
  }
  if (!impairsFunctioning || total < 4 || corePresent < 1) {
    return { score: 'pms', label: 'PMS', description: 'Premenstrual symptoms present but below PMDD threshold.' }
  }
  if (total >= 4 && corePresent >= 1 && impairsFunctioning && total < 7) {
    return {
      score: 'possible_pmdd',
      label: 'Possible PMDD',
      description: 'Symptoms suggest possible PMDD. Consider tracking for 2 prospective cycles and discussing with a provider.',
    }
  }
  return {
    score: 'likely_pmdd',
    label: 'Likely PMDD',
    description: 'Symptom profile consistent with PMDD (DSM-5). First-line treatment includes SSRIs and lifestyle changes (Yonkers 2008 Lancet).',
  }
}

// ─── Symptom Categories ───────────────────────────────────────────────────────

export const SYMPTOM_CATEGORIES = {
  physical: [
    'cramping',
    'bloating',
    'breast_tenderness',
    'headache',
    'fatigue',
    'acne',
    'back_pain',
    'nausea',
    'joint_pain',
    'hot_flashes',
  ],
  emotional: [
    'mood_swings',
    'anxiety',
    'irritability',
    'depression',
    'brain_fog',
    'low_libido',
    'tearfulness',
    'overwhelm',
  ],
  other: [
    'spotting',
    'flow_heaviness',
    'clot_size',
    'cervical_mucus_change',
    'sleep_disruption',
    'appetite_change',
  ],
} as const

export type PhysicalSymptom = (typeof SYMPTOM_CATEGORIES.physical)[number]
export type EmotionalSymptom = (typeof SYMPTOM_CATEGORIES.emotional)[number]
export type OtherSymptom = (typeof SYMPTOM_CATEGORIES.other)[number]
export type Symptom = PhysicalSymptom | EmotionalSymptom | OtherSymptom

export const SYMPTOM_LABELS: Record<string, string> = {
  cramping: 'Cramping',
  bloating: 'Bloating',
  breast_tenderness: 'Breast Tenderness',
  headache: 'Headache',
  fatigue: 'Fatigue',
  acne: 'Acne',
  back_pain: 'Back Pain',
  nausea: 'Nausea',
  joint_pain: 'Joint Pain',
  hot_flashes: 'Hot Flashes',
  mood_swings: 'Mood Swings',
  anxiety: 'Anxiety',
  irritability: 'Irritability',
  depression: 'Low Mood',
  brain_fog: 'Brain Fog',
  low_libido: 'Low Libido',
  tearfulness: 'Tearfulness',
  overwhelm: 'Overwhelm',
  spotting: 'Spotting',
  flow_heaviness: 'Flow Heaviness',
  clot_size: 'Clots',
  cervical_mucus_change: 'CM Change',
  sleep_disruption: 'Sleep Disruption',
  appetite_change: 'Appetite Change',
}

// ─── Symptom Pattern Analysis ─────────────────────────────────────────────────

export function analyzeSymptomPatterns(
  logs: CycleLog[],
  cycleLength = 28
): SymptomPatternResult {
  const phases: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'luteal']
  const byPhase: Record<CyclePhase, Record<string, number[]>> = {
    menstrual: {},
    follicular: {},
    ovulation: {},
    luteal: {},
  }

  for (const log of logs) {
    if (!log.symptoms || Object.keys(log.symptoms).length === 0) continue

    // Determine which day of cycle this log is
    // We'd need the last period start to compute this exactly;
    // approximate using the date within a 28-day window
    const logDate = new Date(log.date)
    const dayOfYear = Math.floor((logDate.getTime() - new Date(logDate.getFullYear(), 0, 0).getTime()) / 86400000)
    const approxCycleDay = (dayOfYear % cycleLength) + 1
    const { phase } = getCyclePhase(approxCycleDay, cycleLength)

    for (const [symptom, severity] of Object.entries(log.symptoms)) {
      if (!byPhase[phase][symptom]) byPhase[phase][symptom] = []
      byPhase[phase][symptom].push(severity as number)
    }
  }

  const mostCommonByPhase = {} as Record<CyclePhase, Array<{ symptom: string; avgSeverity: number; frequency: number }>>
  for (const phase of phases) {
    mostCommonByPhase[phase] = Object.entries(byPhase[phase])
      .map(([symptom, severities]) => ({
        symptom,
        avgSeverity: severities.reduce((s, v) => s + v, 0) / severities.length,
        frequency: severities.length,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
  }

  // Build heatmap: symptom × day aggregated across all logs
  const heatmapRaw: Record<string, Record<number, number[]>> = {}
  for (const log of logs) {
    if (!log.symptoms) continue
    const logDate = new Date(log.date)
    const dayOfYear = Math.floor((logDate.getTime() - new Date(logDate.getFullYear(), 0, 0).getTime()) / 86400000)
    const approxDay = (dayOfYear % cycleLength) + 1

    for (const [symptom, severity] of Object.entries(log.symptoms)) {
      if (!heatmapRaw[symptom]) heatmapRaw[symptom] = {}
      if (!heatmapRaw[symptom][approxDay]) heatmapRaw[symptom][approxDay] = []
      heatmapRaw[symptom][approxDay].push(severity as number)
    }
  }

  const heatmapData: Array<{ symptom: string; day: number; severity: number }> = []
  for (const [symptom, days] of Object.entries(heatmapRaw)) {
    for (const [day, severities] of Object.entries(days)) {
      heatmapData.push({
        symptom,
        day: Number(day),
        severity: severities.reduce((s, v) => s + v, 0) / severities.length,
      })
    }
  }

  return { mostCommonByPhase, heatmapData }
}

// ─── Natural Remedies ─────────────────────────────────────────────────────────

export const NATURAL_REMEDIES: NaturalRemedy[] = [
  {
    symptom: 'cramping',
    remedy: 'Omega-3 fatty acids (fish oil)',
    evidence_grade: 'A',
    dose: '2–3 g EPA+DHA daily starting 3 days before menstruation',
    citations: 'Rahbar M et al. Gynecol Obstet Invest 2012; RCT demonstrating reduced dysmenorrhea severity',
  },
  {
    symptom: 'cramping',
    remedy: 'Heat therapy (heating pad 38–40°C)',
    evidence_grade: 'A',
    dose: 'Applied to lower abdomen for ≥8 continuous hours during days 1–3',
    citations: 'Akin MD et al. Obstet Gynecol 2001; topical heat comparable to ibuprofen for dysmenorrhea',
  },
  {
    symptom: 'cramping',
    remedy: 'Ginger root extract',
    evidence_grade: 'B',
    dose: '250 mg capsule 4× daily for first 3 days of menstruation',
    citations: 'Ozgoli G et al. J Altern Complement Med 2009; comparable to mefenamic acid in RCT',
  },
  {
    symptom: 'mood_swings',
    remedy: 'Magnesium glycinate',
    evidence_grade: 'B',
    dose: '300–400 mg elemental magnesium daily in luteal phase',
    citations: 'Fathizadeh N et al. Iran J Nurs Midwifery Res 2010; reduced PMS mood symptoms',
  },
  {
    symptom: 'anxiety',
    remedy: 'Chasteberry (Vitex agnus-castus)',
    evidence_grade: 'B',
    dose: '20–40 mg standardised extract daily for ≥3 menstrual cycles',
    citations: 'Schellenberg R. BMJ 2001; reduced PMS scores vs placebo in double-blind RCT',
  },
  {
    symptom: 'breast_tenderness',
    remedy: 'Evening primrose oil (GLA)',
    evidence_grade: 'C',
    dose: '1–3 g GLA daily throughout cycle',
    citations: 'Gateley CA et al. Eur J Obstet Gynecol Reprod Biol 1992; limited evidence but good safety profile',
  },
  {
    symptom: 'bloating',
    remedy: 'Magnesium and reduced sodium intake',
    evidence_grade: 'B',
    dose: 'Magnesium 200–400 mg + limit sodium to <2 g/day in luteal phase',
    citations: 'Walker AF et al. J Womens Health 1998; magnesium reduced fluid retention scores',
  },
  {
    symptom: 'headache',
    remedy: 'Magnesium citrate',
    evidence_grade: 'B',
    dose: '400 mg daily throughout cycle for menstrual migraine prevention',
    citations: 'Mauskop A & Varughese J. Headache 2012; magnesium deficiency common in menstrual migraine',
  },
  {
    symptom: 'fatigue',
    remedy: 'Iron-rich diet + vitamin C co-ingestion',
    evidence_grade: 'B',
    dose: 'Iron 18 mg/day from food; pair with 75 mg vitamin C to enhance absorption',
    citations: 'Moretti D et al. Am J Clin Nutr 2006; vitamin C doubles non-heme iron absorption',
  },
  {
    symptom: 'depression',
    remedy: 'Calcium carbonate',
    evidence_grade: 'B',
    dose: '1200 mg calcium daily through the full cycle',
    citations: 'Thys-Jacobs S et al. Am J Obstet Gynecol 1998; calcium reduced overall PMS scores by 48%',
  },
]

// ─── Perimenopause Symptoms ────────────────────────────────────────────────────

export interface PerimenopauseSymptom {
  symptom: string
  straw_stage: string
  description: string
  management: string
}

export const PERIMENOPAUSE_SYMPTOMS: PerimenopauseSymptom[] = [
  {
    symptom: 'Irregular periods',
    straw_stage: 'STRAW -3b to -2',
    description: 'Cycle length variability increases ≥7 days from baseline',
    management: 'Track cycle lengths; rule out pregnancy and thyroid dysfunction',
  },
  {
    symptom: 'Hot flashes & night sweats',
    straw_stage: 'STRAW -2 to +1',
    description: 'Vasomotor symptoms; peak in late perimenopause/early postmenopause',
    management: 'MHT first-line; CBT, SSRIs as alternatives; cooling strategies at night',
  },
  {
    symptom: 'Sleep disturbances',
    straw_stage: 'STRAW -2 to +2',
    description: 'Difficulty initiating/maintaining sleep, often linked to vasomotor symptoms',
    management: 'Sleep hygiene; treat underlying vasomotor symptoms; CBT-I for insomnia',
  },
  {
    symptom: 'Mood changes',
    straw_stage: 'STRAW -3a to -1',
    description: 'Increased risk of depression; anxiety and irritability common',
    management: 'Screen for MDD; SSRIs/SNRIs; MHT addresses hormonal component',
  },
  {
    symptom: 'Genitourinary syndrome',
    straw_stage: 'STRAW +1 onward',
    description: 'Vaginal dryness, dyspareunia, urinary urgency from estrogen decline',
    management: 'Local vaginal estrogen, ospemifene; vaginal moisturisers',
  },
  {
    symptom: 'Brain fog & memory lapses',
    straw_stage: 'STRAW -3 to +1',
    description: 'Verbal memory and processing speed may temporarily decline',
    management: 'Cognitive strategies; adequate sleep and exercise; MHT may help during transition',
  },
  {
    symptom: 'Bone density decline',
    straw_stage: 'STRAW +1 onward',
    description: 'Accelerated bone loss in first 5 years post-menopause',
    management: 'DEXA scan; calcium 1200 mg + vitamin D 800–1000 IU; weight-bearing exercise; MHT',
  },
  {
    symptom: 'Weight redistribution',
    straw_stage: 'STRAW -2 onward',
    description: 'Fat shifts from gluteal to central/abdominal distribution',
    management: 'Strength training preserves muscle mass; caloric adjustments; Mediterranean diet',
  },
]

// ─── Flow Level Labels ────────────────────────────────────────────────────────

export const FLOW_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Spotting',
  2: 'Light',
  3: 'Medium',
  4: 'Heavy',
}

export const CERVICAL_MUCUS_LABELS: Record<string, string> = {
  dry: 'Dry',
  sticky: 'Sticky',
  creamy: 'Creamy',
  watery: 'Watery',
  egg_white: 'Egg-white (fertile)',
}

// Fertile quality score for cervical mucus
export const CERVICAL_MUCUS_FERTILITY: Record<string, number> = {
  dry: 0,
  sticky: 1,
  creamy: 2,
  watery: 3,
  egg_white: 4,
}

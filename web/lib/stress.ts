export type ANSState = 'thriving' | 'stressed' | 'depleted'

export interface StressLog {
  date: string
  perceived_stress: number   // 1-10
  ans_state: ANSState
  stressors: string[]        // ['work', 'relationship', 'financial', 'health', 'other']
  stressor_intensity: number // 1-10
  physical_symptoms: string[] // ['headache', 'tension', 'fatigue', 'digestive', 'sleep']
  coping_used: string[]      // ['exercise', 'breathing', 'meditation', 'social', 'nature']
}

export interface AllostaticLoad {
  score: number              // 0-100 (higher = more load)
  level: 'Low' | 'Moderate' | 'High' | 'Critical'
  contributors: { factor: string; contribution: number; improvable: boolean }[]
  trend: 'improving' | 'stable' | 'worsening'
  recommendations: string[]
}

/**
 * Allostatic load computed from:
 * resting_hr (if >80 = high load), hrv_ms (if <30ms = high load),
 * sleep_hours (if <6 = high load), perceived_stress avg,
 * mood avg (from mood logs), consecutive high-stress days
 */
export function calculateAllostaticLoad(
  stressLogs: StressLog[],
  recoveryData?: { hrv_ms?: number; resting_hr?: number; sleep_hours?: number; mood?: number }
): AllostaticLoad {
  const contributors: AllostaticLoad['contributors'] = []
  let totalScore = 0

  // HRV (weight: 25)
  if (recoveryData?.hrv_ms !== undefined) {
    const hrv = recoveryData.hrv_ms
    let contribution = 0
    if (hrv < 20) contribution = 25
    else if (hrv < 30) contribution = 20
    else if (hrv < 50) contribution = 12
    else if (hrv < 70) contribution = 5
    contributors.push({ factor: 'Heart Rate Variability', contribution, improvable: true })
    totalScore += contribution
  }

  // Resting HR (weight: 20)
  if (recoveryData?.resting_hr !== undefined) {
    const hr = recoveryData.resting_hr
    let contribution = 0
    if (hr > 90) contribution = 20
    else if (hr > 80) contribution = 14
    else if (hr > 70) contribution = 6
    contributors.push({ factor: 'Resting Heart Rate', contribution, improvable: true })
    totalScore += contribution
  }

  // Sleep (weight: 20)
  if (recoveryData?.sleep_hours !== undefined) {
    const sleep = recoveryData.sleep_hours
    let contribution = 0
    if (sleep < 5) contribution = 20
    else if (sleep < 6) contribution = 15
    else if (sleep < 7) contribution = 8
    contributors.push({ factor: 'Sleep Duration', contribution, improvable: true })
    totalScore += contribution
  }

  // Perceived stress avg last 7 days (weight: 20)
  if (stressLogs.length > 0) {
    const recent = stressLogs.slice(-7)
    const avgStress = recent.reduce((s, l) => s + l.perceived_stress, 0) / recent.length
    const contribution = Math.round((avgStress / 10) * 20)
    contributors.push({ factor: 'Perceived Stress (7-day avg)', contribution, improvable: true })
    totalScore += contribution
  }

  // Mood (weight: 10) — higher mood = lower load
  if (recoveryData?.mood !== undefined) {
    const contribution = Math.round(((10 - recoveryData.mood) / 10) * 10)
    contributors.push({ factor: 'Mood', contribution, improvable: true })
    totalScore += contribution
  }

  // Consecutive high-stress days (weight: 5)
  if (stressLogs.length > 0) {
    const sorted = [...stressLogs].sort((a, b) => b.date.localeCompare(a.date))
    let consecutive = 0
    for (const log of sorted) {
      if (log.perceived_stress >= 7) consecutive++
      else break
    }
    if (consecutive >= 3) {
      const contribution = Math.min(5, consecutive - 1)
      contributors.push({ factor: 'Consecutive High-Stress Days', contribution, improvable: false })
      totalScore += contribution
    }
  }

  const score = Math.min(100, Math.round(totalScore))

  let level: AllostaticLoad['level']
  if (score < 25) level = 'Low'
  else if (score < 50) level = 'Moderate'
  else if (score < 75) level = 'High'
  else level = 'Critical'

  // Trend: compare avg stress of first vs second half of logs
  let trend: AllostaticLoad['trend'] = 'stable'
  if (stressLogs.length >= 6) {
    const mid = Math.floor(stressLogs.length / 2)
    const firstAvg = stressLogs.slice(0, mid).reduce((s, l) => s + l.perceived_stress, 0) / mid
    const secondAvg = stressLogs.slice(mid).reduce((s, l) => s + l.perceived_stress, 0) / (stressLogs.length - mid)
    if (secondAvg < firstAvg - 0.5) trend = 'improving'
    else if (secondAvg > firstAvg + 0.5) trend = 'worsening'
  }

  const recommendations: string[] = []
  if (recoveryData?.hrv_ms !== undefined && recoveryData.hrv_ms < 30) {
    recommendations.push('Practice coherent breathing (5.5s in/out) to improve HRV')
  }
  if (recoveryData?.sleep_hours !== undefined && recoveryData.sleep_hours < 7) {
    recommendations.push('Prioritise 7–9 hours sleep — each hour below 6 raises load significantly')
  }
  if (recoveryData?.resting_hr !== undefined && recoveryData.resting_hr > 80) {
    recommendations.push('Zone 2 cardio 3×/week can lower resting heart rate within weeks')
  }
  if (stressLogs.length > 0) {
    const avgStress = stressLogs.slice(-7).reduce((s, l) => s + l.perceived_stress, 0) / Math.min(7, stressLogs.length)
    if (avgStress > 6) {
      recommendations.push('Try the physiological sigh (double inhale + 8s exhale) for instant calm')
    }
  }
  if (recommendations.length === 0) {
    recommendations.push('Your allostatic load is low — maintain your current recovery habits')
  }

  return { score, level, contributors, trend, recommendations }
}

export interface BreathingExercise {
  id: string
  name: string
  description: string
  pattern: { inhale: number; hold1: number; exhale: number; hold2: number }
  duration_min: number
  benefit: string
  research: string
}

export const BREATHING_EXERCISES: BreathingExercise[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal-ratio breathing for calm focus',
    pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    duration_min: 4,
    benefit: 'Focus, calm under pressure, cortisol reduction',
    research: 'Used by US Navy SEALs; activates parasympathetic/sympathetic balance',
  },
  {
    id: 'physiological-sigh',
    name: 'Physiological Sigh',
    description: 'Double inhale through nose + long exhale through mouth',
    pattern: { inhale: 2, hold1: 1, exhale: 8, hold2: 0 },
    duration_min: 1,
    benefit: 'Fastest known method for parasympathetic activation',
    research: 'Huberman & Balaban (Cell Reports Medicine, 2023)',
  },
  {
    id: '4-7-8',
    name: '4-7-8 Breathing',
    description: 'Extended hold and exhale for anxiety relief',
    pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
    duration_min: 3,
    benefit: 'Sleep onset, acute anxiety reduction',
    research: 'Dr. Andrew Weil (2015); amplifies vagal tone',
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    description: 'Resonance breathing at ~5.5 breaths per minute',
    pattern: { inhale: 6, hold1: 0, exhale: 6, hold2: 0 },
    duration_min: 5,
    benefit: 'Maximises HRV and ANS balance (best long-term)',
    research: 'Lehrer & Gevirtz (2020); optimal resonance frequency',
  },
  {
    id: 'pursed-lip',
    name: 'Pursed Lip Breathing',
    description: 'Inhale through nose, slow exhale through pursed lips',
    pattern: { inhale: 2, hold1: 0, exhale: 4, hold2: 0 },
    duration_min: 2,
    benefit: 'Calming, improves respiratory control',
    research: 'Benson (1975); core of the Relaxation Response',
  },
]

export const GROUNDING_TECHNIQUES: { name: string; steps: string[]; duration_min: number }[] = [
  {
    name: '5-4-3-2-1 Sensory',
    steps: [
      'Notice 5 things you can see',
      'Notice 4 things you can physically feel',
      'Notice 3 things you can hear',
      'Notice 2 things you can smell',
      'Notice 1 thing you can taste',
    ],
    duration_min: 2,
  },
  {
    name: 'Box Breathing Reset',
    steps: [
      'Inhale slowly for 4 counts',
      'Hold at the top for 4 counts',
      'Exhale slowly for 4 counts',
      'Hold at the bottom for 4 counts',
      'Repeat 4–6 cycles',
    ],
    duration_min: 2,
  },
  {
    name: 'Cold Water Face Dive',
    steps: [
      'Fill a bowl with cold water (add ice if available)',
      'Take a breath and submerge your face for 15–30 seconds',
      'This triggers the mammalian dive reflex, slowing heart rate',
      'Repeat 1–3 times as needed',
    ],
    duration_min: 2,
  },
  {
    name: 'Progressive Muscle Relaxation',
    steps: [
      'Lie or sit comfortably and close your eyes',
      'Tense feet and calves for 5 seconds, then fully release',
      'Work up: thighs → abdomen → hands → arms → shoulders → face',
      'Breathe slowly throughout — notice the contrast between tension and release',
    ],
    duration_min: 10,
  },
  {
    name: 'Safe Place Visualisation',
    steps: [
      'Close your eyes and take 3 slow breaths',
      'Vividly imagine a place where you feel completely safe',
      'Notice all sensory details: sounds, smells, temperature, light',
      'Spend 3 minutes fully inhabiting this space',
    ],
    duration_min: 3,
  },
]

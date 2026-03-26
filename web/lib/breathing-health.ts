// ─── Breathing & Respiratory Health ──────────────────────────────────────────
// Jerath et al. 2006, Zaccaro et al. 2018, Kox et al. 2014, Russo et al. 2017, Nestor 2020

export type BreathingPattern = 'nasal' | 'mouth' | 'mixed'
export type BreathingType = 'chest' | 'diaphragmatic' | 'mixed'

export interface BreathingLog {
  id?: string
  user_id?: string
  date: string
  resting_breathing_rate: number
  breathing_pattern: BreathingPattern
  breathing_type: BreathingType
  mrc_scale: number
  symptoms: string[]
  exercises_completed: BreathingSession[]
  peak_flow_measured?: number
  height_cm?: number
  age?: number
  sex?: 'male' | 'female'
  notes?: string
  created_at?: string
}

export interface BreathingSession {
  exercise_id: string
  duration_min: number
  rounds_completed: number
  hrv_before?: number
  hrv_after?: number
  stress_before: number
  stress_after: number
  notes?: string
}

export interface BreathingAnalysis {
  breathingRateZone: string
  breathingRateColor: string
  breathingRateStatus: 'optimal' | 'normal' | 'elevated' | 'high'
  predictedPeakFlow?: number
  peakFlowPct?: number
  mrcRisk: 'none' | 'low' | 'moderate' | 'high'
  avgStressReduction: number
  qualityScore: number
  recommendations: string[]
}

export interface BreathingExercise {
  id: string
  name: string
  emoji: string
  pattern: string
  phases: { label: string; duration: number; color: string }[]
  rounds: number
  totalDurationPerRound: number
  benefit: string
  bestFor: string[]
  citation: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  caution?: string
  description: string
}

export const BREATHING_EXERCISES: BreathingExercise[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    emoji: '🟦',
    pattern: '4-4-4-4',
    phases: [
      { label: 'Inhale', duration: 4, color: '#6366f1' },
      { label: 'Hold', duration: 4, color: '#8b5cf6' },
      { label: 'Exhale', duration: 4, color: '#06b6d4' },
      { label: 'Hold', duration: 4, color: '#0891b2' },
    ],
    rounds: 8,
    totalDurationPerRound: 16,
    benefit: 'Reduces cortisol, calms nervous system, improves focus',
    bestFor: ['Stress', 'Focus', 'Performance'],
    citation: 'Jerath et al. Med Hypotheses 2006',
    difficulty: 'beginner',
    description: 'Used by Navy SEALs for acute stress control. Equal phases activate balanced ANS response.',
  },
  {
    id: '4-7-8',
    name: '4-7-8 Relaxation',
    emoji: '😴',
    pattern: '4-7-8',
    phases: [
      { label: 'Inhale', duration: 4, color: '#6366f1' },
      { label: 'Hold', duration: 7, color: '#8b5cf6' },
      { label: 'Exhale', duration: 8, color: '#06b6d4' },
    ],
    rounds: 6,
    totalDurationPerRound: 19,
    benefit: 'Promotes sleep onset, activates parasympathetic system',
    bestFor: ['Sleep', 'Anxiety', 'Relaxation'],
    citation: 'Weil 2015 (4-7-8 technique)',
    difficulty: 'beginner',
    description: "Dr. Andrew Weil's relaxation technique. Extended exhale activates the vagus nerve.",
  },
  {
    id: 'resonance',
    name: 'Resonance Breathing',
    emoji: '💓',
    pattern: '5.5-5.5',
    phases: [
      { label: 'Inhale', duration: 5.5, color: '#10b981' },
      { label: 'Exhale', duration: 5.5, color: '#059669' },
    ],
    rounds: 10,
    totalDurationPerRound: 11,
    benefit: 'Maximises HRV coherence, deepest relaxation response',
    bestFor: ['HRV', 'Heart Health', 'Anxiety'],
    citation: 'Russo et al. 2017',
    difficulty: 'beginner',
    description: '5.5 breaths/min is the resonance frequency that maximises HRV amplitude. (Russo 2017)',
  },
  {
    id: 'wim-hof',
    name: 'Wim Hof Method',
    emoji: '🧊',
    pattern: '30 deep + retention',
    phases: [
      { label: 'Deep Inhale', duration: 2, color: '#f59e0b' },
      { label: 'Release', duration: 1, color: '#d97706' },
    ],
    rounds: 30,
    totalDurationPerRound: 3,
    benefit: 'Energising, alkalises blood, voluntary ANS influence',
    bestFor: ['Energy', 'Focus', 'Cold Tolerance'],
    citation: 'Kox et al. PNAS 2014',
    difficulty: 'intermediate',
    caution: 'Never practice near water or while driving. May cause dizziness.',
    description: '30 power breaths then exhale hold. Kox et al. 2014 showed voluntary immune response modulation.',
  },
  {
    id: 'diaphragmatic',
    name: 'Diaphragmatic Breathing',
    emoji: '🫁',
    pattern: '4-6 (belly)',
    phases: [
      { label: 'Belly Inhale', duration: 4, color: '#3b82f6' },
      { label: 'Exhale', duration: 6, color: '#1d4ed8' },
    ],
    rounds: 10,
    totalDurationPerRound: 10,
    benefit: 'Corrects breathing mechanics, lowers blood pressure',
    bestFor: ['Posture', 'Blood Pressure', 'COPD Support'],
    citation: 'Zaccaro et al. Front Human Neurosci 2018',
    difficulty: 'beginner',
    description: 'Slow belly breathing activates Hering-Breuer reflex (Jerath 2006). No chest movement — hand on belly should rise.',
  },
  {
    id: 'physiological-sigh',
    name: 'Physiological Sigh',
    emoji: '😮‍💨',
    pattern: 'double inhale + long exhale',
    phases: [
      { label: 'Inhale (nose)', duration: 2, color: '#ec4899' },
      { label: '2nd Inhale', duration: 1, color: '#db2777' },
      { label: 'Long Exhale', duration: 6, color: '#9333ea' },
    ],
    rounds: 5,
    totalDurationPerRound: 9,
    benefit: 'Fastest way to reduce acute stress — deflates alveoli',
    bestFor: ['Acute Stress', 'Anxiety', 'Quick Reset'],
    citation: 'Huberman Lab / Balban et al. Cell Reports Med 2023',
    difficulty: 'beginner',
    description: 'Double nasal inhale fully inflates alveoli; long exhale dumps CO₂ and triggers immediate calm. (Huberman)',
  },
]

export const MRC_DESCRIPTIONS: { scale: number; short: string; detail: string }[] = [
  { scale: 0, short: 'No breathlessness', detail: 'Only breathless with strenuous exercise' },
  { scale: 1, short: 'Hurrying/hills', detail: 'Breathless when hurrying on flat or walking up a slight hill' },
  { scale: 2, short: 'Walks slower', detail: 'Walks slower than contemporaries on flat, or stops for breath at own pace' },
  { scale: 3, short: '~100m on flat', detail: 'Stops for breath after ~100m or after a few minutes on flat' },
  { scale: 4, short: 'Housebound', detail: 'Too breathless to leave house, breathless when dressing/undressing' },
]

export const SYMPTOMS_LIST = [
  { id: 'wheeze', label: 'Wheeze', emoji: '🌬️' },
  { id: 'cough', label: 'Cough', emoji: '🤧' },
  { id: 'shortness_of_breath', label: 'Shortness of breath', emoji: '😮‍💨' },
  { id: 'chest_tightness', label: 'Chest tightness', emoji: '💢' },
  { id: 'phlegm', label: 'Phlegm', emoji: '🧪' },
]

export function predictPeakFlow(height_cm: number, age: number, sex: 'male' | 'female'): number {
  if (sex === 'male') {
    return Math.max(0, 3.79 * height_cm - 4.26 * age + 12.7)
  }
  return Math.max(0, 2.76 * height_cm - 3.92 * age + 11.0)
}

export function getBreathingRateZone(rate: number): {
  zone: string
  status: 'optimal' | 'normal' | 'elevated' | 'high'
  color: string
  description: string
} {
  if (rate < 8) {
    return {
      zone: 'Very Slow',
      status: 'optimal',
      color: '#6366f1',
      description: 'Parasympathetic dominant — deep meditative state',
    }
  }
  if (rate <= 12) {
    return {
      zone: 'Slow / Relaxed',
      status: 'optimal',
      color: '#10b981',
      description: 'Optimal for HRV — resonance zone (Russo 2017)',
    }
  }
  if (rate <= 16) {
    return {
      zone: 'Normal Resting',
      status: 'normal',
      color: '#3b82f6',
      description: 'Normal resting respiratory rate',
    }
  }
  if (rate <= 20) {
    return {
      zone: 'Slightly Elevated',
      status: 'elevated',
      color: '#f59e0b',
      description: 'Mild stress or light activity detected',
    }
  }
  if (rate <= 25) {
    return {
      zone: 'Elevated',
      status: 'elevated',
      color: '#f97316',
      description: 'Moderate stress or exertion',
    }
  }
  return {
    zone: 'High',
    status: 'high',
    color: '#ef4444',
    description: 'Anxiety, illness, or intense exercise',
  }
}

export function analyzeBreathing(log: BreathingLog): BreathingAnalysis {
  const rateInfo = getBreathingRateZone(log.resting_breathing_rate)

  let predictedPeakFlow: number | undefined
  let peakFlowPct: number | undefined
  if (log.height_cm && log.age && log.sex) {
    predictedPeakFlow = Math.round(predictPeakFlow(log.height_cm, log.age, log.sex))
    if (log.peak_flow_measured && predictedPeakFlow > 0) {
      peakFlowPct = Math.round((log.peak_flow_measured / predictedPeakFlow) * 100)
    }
  }

  const mrcRisk: BreathingAnalysis['mrcRisk'] =
    log.mrc_scale === 0 ? 'none' :
    log.mrc_scale === 1 ? 'low' :
    log.mrc_scale === 2 ? 'moderate' : 'high'

  const sessionsWithRatings = log.exercises_completed.filter(
    s => s.stress_before > 0 && s.stress_after > 0
  )
  const avgStressReduction =
    sessionsWithRatings.length > 0
      ? Math.round(
          sessionsWithRatings.reduce((sum, s) => sum + (s.stress_before - s.stress_after), 0) /
            sessionsWithRatings.length * 10
        ) / 10
      : 0

  // Quality score: 0-100
  let score = 0
  // Rate zone (40pts)
  if (rateInfo.status === 'optimal') score += 40
  else if (rateInfo.status === 'normal') score += 30
  else if (rateInfo.status === 'elevated') score += 15
  else score += 5
  // Breathing pattern (20pts)
  if (log.breathing_pattern === 'nasal') score += 20
  else if (log.breathing_pattern === 'mixed') score += 10
  // Breathing type (15pts)
  if (log.breathing_type === 'diaphragmatic') score += 15
  else if (log.breathing_type === 'mixed') score += 8
  // MRC (15pts)
  if (log.mrc_scale === 0) score += 15
  else if (log.mrc_scale === 1) score += 10
  else if (log.mrc_scale === 2) score += 5
  // Symptoms (10pts)
  if (log.symptoms.length === 0) score += 10
  else if (log.symptoms.length <= 1) score += 5

  const recommendations: string[] = []

  if (log.resting_breathing_rate > 16) {
    recommendations.push('Try resonance breathing (5.5-5.5) to slow your resting rate toward the 8-12 optimal zone.')
  }
  if (log.breathing_pattern === 'mouth') {
    recommendations.push('Nasal breathing produces nitric oxide (Nestor 2020) — try taping mouth at night to encourage nasal breathing.')
  }
  if (log.breathing_type === 'chest') {
    recommendations.push('Diaphragmatic breathing activates the Hering-Breuer reflex — practice belly breathing with a hand on your abdomen.')
  }
  if (log.mrc_scale >= 2) {
    recommendations.push('MRC scale ≥2 suggests significant breathlessness — consider evaluation by a healthcare provider.')
  }
  if (peakFlowPct !== undefined && peakFlowPct < 80) {
    recommendations.push(`Peak flow is ${peakFlowPct}% of predicted — values <80% may indicate airway restriction.`)
  }
  if (log.symptoms.includes('wheeze')) {
    recommendations.push('Wheeze at rest may indicate bronchospasm — consult your doctor if persistent.')
  }
  if (log.exercises_completed.length === 0) {
    recommendations.push('Start with 5 minutes of resonance breathing daily to improve HRV coherence.')
  }
  if (avgStressReduction > 0) {
    recommendations.push(`Breathing exercises reduced your stress by ${avgStressReduction} points on average today — great work.`)
  }

  return {
    breathingRateZone: rateInfo.zone,
    breathingRateColor: rateInfo.color,
    breathingRateStatus: rateInfo.status,
    predictedPeakFlow,
    peakFlowPct,
    mrcRisk,
    avgStressReduction,
    qualityScore: Math.min(100, score),
    recommendations,
  }
}

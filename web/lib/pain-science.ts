// Pain Science Education & Chronic Pain Management
// Based on Moseley & Butler 2017 (Explain Pain Supercharged), Engel 1977 biopsychosocial model,
// Woolf 2011 (central sensitization), Vlaeyen & Linton 2000 (fear-avoidance model)

export interface PainScienceLog {
  id?: string
  user_id?: string
  date: string
  pain_level: number // 0-10 NRS
  pain_locations: string[]
  pain_quality: string[] // burning, aching, stabbing, throbbing, tingling, shooting
  // Biopsychosocial contributors (1-10 each)
  biological_contributors: number
  psychological_contributors: number
  social_contributors: number
  // PCS-3 catastrophizing items (0-4 each)
  pcs_rumination: number // "I can't stop thinking about how much it hurts"
  pcs_magnification: number // "I wonder whether something serious may happen"
  pcs_helplessness: number // "There's nothing I can do to reduce the intensity"
  // TSK-4 kinesiophobia (1-4 each)
  tsk_q1: number
  tsk_q2: number
  tsk_q3: number
  tsk_q4: number
  // CSI-9 central sensitization symptoms (0-4 each, 9 values)
  csi_symptoms: number[]
  // Activity
  movement_today: boolean
  movement_minutes: number
  avoided_activities: string[]
  helpful_strategies: string[]
  notes?: string
  created_at?: string
}

export interface PainScienceAnalysis {
  painLevel: number
  catastrophizingScore: number // PCS-3 total 0-12
  kinesiophobiaScore: number // TSK-4 total 4-16
  centralSensitizationScore: number // CSI-9 total 0-36
  biopsychosocialBalance: { biological: number; psychological: number; social: number }
  fearAvoidanceRisk: 'Low' | 'Moderate' | 'High'
  gradedActivityPlan: { currentPhase: string; recommendation: string; nextStep: string }
  educationModuleRecommended: number // 1-5
  recommendations: string[]
}

export const PAIN_QUALITIES = [
  'Burning', 'Aching', 'Stabbing', 'Throbbing',
  'Tingling', 'Shooting', 'Pressure', 'Sharp',
]

export const PAIN_LOCATIONS = [
  'Head', 'Neck', 'Upper Back', 'Lower Back',
  'Shoulders', 'Arms', 'Hands', 'Hips', 'Knees', 'Feet',
]

export const HELPFUL_STRATEGIES = [
  'Gentle movement', 'Ice', 'Heat', 'Breathing exercises',
  'Distraction', 'Mindfulness', 'Pacing', 'Social support',
  'Sleep', 'Hot shower', 'Stretching',
]

export const TSK4_QUESTIONS = [
  "I'm afraid that I might injure myself if I exercise.",
  'If I were to try to overcome my pain, it would increase.',
  'My body is telling me I have something dangerously wrong.',
  'Pain always means I have injured my body.',
]

export const CSI9_SYMPTOMS = [
  'Sensitivity to light',
  'Sensitivity to noise',
  'Sensitivity to smells',
  'Muscle pain',
  'Fatigue',
  'Headaches',
  'Anxiety',
  'Sleep problems',
  'Difficulty concentrating',
]

export const TSK_SCALE_LABELS = ['Strongly Disagree', 'Disagree', 'Agree', 'Strongly Agree']
export const CSI_SCALE_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
export const PCS_SCALE_LABELS = ['Not at all', 'To a slight degree', 'To a moderate degree', 'To a great degree', 'All the time']

export interface EducationModule {
  id: number
  title: string
  concept: string
  explanation: string
  example: string
  citation: string
  emoji: string
}

export const PAIN_EDUCATION_MODULES: EducationModule[] = [
  {
    id: 1,
    title: 'Pain ≠ Damage',
    concept: 'Pain is a protective output of the brain — not a direct measure of tissue damage.',
    explanation:
      'Your brain continuously evaluates all available information (nerve signals, context, emotions, past experiences, expectations) and decides whether to produce pain as a warning. More danger cues → more pain. Fewer danger cues → less pain — regardless of actual tissue state. This is why the same injury can hurt vastly different amounts in different contexts.',
    example:
      'A soldier in battle may not notice a serious wound until after the fight — the brain prioritises survival over pain. Conversely, a paper cut on a fingertip can hurt intensely because your hands are precious tools. Phantom limb pain (pain in an amputated limb) proves pain can exist with zero tissue to damage.',
    citation: 'Moseley GL & Butler DS (2017). Explain Pain Supercharged. Noigroup Publications.',
    emoji: '🧩',
  },
  {
    id: 2,
    title: 'The Danger Alarm',
    concept: 'Pain is an alarm system. Chronic pain is like an alarm stuck in the ON position.',
    explanation:
      'Acute pain is protective — it tells you to protect injured tissue. But in chronic pain, the alarm becomes hypersensitive through a process called sensitization. The alarm fires at lower and lower thresholds, eventually triggering from things that are not dangerous at all: light touch, temperature, movement, or even thoughts. The alarm is malfunctioning — not the tissues.',
    example:
      'Imagine a smoke detector so sensitive it goes off when you make toast. The alarm is real and very loud, but there is no fire. Chronic pain is the same — the alarm (pain) is real, but the signal no longer accurately represents tissue danger. Understanding this can reduce suffering significantly.',
    citation: 'Moseley GL & Butler DS (2017). Explain Pain Supercharged. Noigroup Publications.',
    emoji: '🚨',
  },
  {
    id: 3,
    title: 'Central Sensitization',
    concept: 'Repeated pain signals can "wind up" your spinal cord and brain, amplifying pain beyond tissue damage.',
    explanation:
      'With repeated pain signals, neurons in the spinal cord and brain become more excitable — their firing thresholds drop. This is central sensitization. The volume on the nervous system gets turned up. You can think of it as the nervous system learning to be good at pain. This explains widespread pain, allodynia (pain from gentle touch), hyperalgesia (exaggerated pain), and fatigue/fog/mood issues that accompany many chronic pain conditions.',
    example:
      'After a minor ankle sprain that heals completely, some people develop widespread pain and sensitivity. The tissue healed, but the nervous system stayed sensitized — continuing to amplify signals. Fibromyalgia, chronic low back pain, and many headache disorders involve significant central sensitization.',
    citation: 'Woolf CJ (2011). Central sensitization: Implications for the diagnosis and treatment of pain. PNAS, 108(Suppl 2), 15080–15087.',
    emoji: '⚡',
  },
  {
    id: 4,
    title: 'Biopsychosocial Model',
    concept: 'Pain has biological, psychological, and social contributors — all three matter and interact.',
    explanation:
      'The biomedical model looks only at tissue (biology). But decades of research show that psychological factors (stress, fear, depression, beliefs about pain, catastrophizing) and social factors (work satisfaction, relationships, financial stress, social support, culture) powerfully influence pain intensity, disability, and recovery. Treating only biology while ignoring psychology and social context leads to poorer outcomes. All three domains need attention.',
    example:
      'Two people with identical MRI findings (a bulging disc) can have completely different pain levels. The one under financial stress, with poor sleep, negative pain beliefs ("my back is crumbling"), and little social support will typically suffer far more. The tissue finding is the same — the biopsychosocial context differs dramatically.',
    citation: 'Engel GL (1977). The need for a new medical model: A challenge for biomedicine. Science, 196(4286), 129–136.',
    emoji: '🔺',
  },
  {
    id: 5,
    title: 'Graded Exposure',
    concept: 'Safe, gradual movement breaks the fear-avoidance cycle. Movement is medicine — when paced and graded.',
    explanation:
      "Fear of movement (kinesiophobia) leads to avoidance, which leads to deconditioning, muscle weakness, joint stiffness — and paradoxically, more pain. Graded exposure gradually reintroduces feared movements, demonstrating to the nervous system that they are safe. The brain's threat assessment changes: 'this movement is dangerous' becomes 'this movement is OK.' Pain responses reduce as the nervous system is retrained.",
    example:
      'A person with chronic back pain who hasn\'t walked more than 10 minutes in months doesn\'t start with a 5km walk. They start with 3 minutes, then 5, then 7 — building confidence and nervous system safety incrementally. Each successful movement tells the brain: "That was safe. Reduce the threat." Over weeks, function improves dramatically.',
    citation: 'Vlaeyen JWS & Linton SJ (2000). Fear-avoidance and its consequences in chronic musculoskeletal pain: A state of the art. Pain, 85(3), 317–332.',
    emoji: '🚶',
  },
]

export function getGradedActivityPlan(painLevel: number): {
  phase: string
  recommendation: string
  nextStep: string
} {
  if (painLevel <= 3) {
    return {
      phase: 'Active Phase',
      recommendation:
        'Pain is low — this is your window for building capacity. Engage in full normal activities. You can challenge yourself slightly beyond your comfort zone while pain remains manageable.',
      nextStep:
        'Add 5–10% more duration or intensity to your usual activities. Focus on activities you have been avoiding due to fear (graded exposure).',
    }
  } else if (painLevel <= 6) {
    return {
      phase: 'Modified Activity Phase',
      recommendation:
        'Moderate pain — continue moving, but modify. Avoid movements that sharply spike pain beyond a 7/10. Gentle movement keeps the nervous system in a safer state than complete rest.',
      nextStep:
        'Use the 10-15 minute activity / 5-10 minute rest pacing model. Stay active but reduce intensity. Try walking, gentle stretching, or pool movement.',
    }
  } else {
    return {
      phase: 'Active Recovery Phase',
      recommendation:
        "High pain — prioritise active recovery. Complete immobility increases sensitization. Focus on gentle breathing exercises, mindfulness, and micro-movements that don't aggravate pain.",
      nextStep:
        'Try 3–5 minutes of diaphragmatic breathing, gentle hand/foot movements, or a very short (5-minute) walk. Do NOT completely immobilize — tiny movements signal safety to the nervous system.',
    }
  }
}

export function analyzePainScience(log: PainScienceLog): PainScienceAnalysis {
  const painLevel = log.pain_level

  // PCS-3 catastrophizing (0-12)
  const catastrophizingScore = log.pcs_rumination + log.pcs_magnification + log.pcs_helplessness

  // TSK-4 kinesiophobia (4-16)
  const kinesiophobiaScore = log.tsk_q1 + log.tsk_q2 + log.tsk_q3 + log.tsk_q4

  // CSI-9 central sensitization (0-36)
  const centralSensitizationScore = (log.csi_symptoms || []).reduce((s, v) => s + v, 0)

  const biopsychosocialBalance = {
    biological: log.biological_contributors,
    psychological: log.psychological_contributors,
    social: log.social_contributors,
  }

  // Fear-avoidance risk
  let fearAvoidanceRisk: 'Low' | 'Moderate' | 'High' = 'Low'
  if (kinesiophobiaScore >= 14 || catastrophizingScore >= 8) {
    fearAvoidanceRisk = 'High'
  } else if (kinesiophobiaScore >= 10 || catastrophizingScore >= 5) {
    fearAvoidanceRisk = 'Moderate'
  }

  const activityPlanRaw = getGradedActivityPlan(painLevel)
  const gradedActivityPlan = {
    currentPhase: activityPlanRaw.phase,
    recommendation: activityPlanRaw.recommendation,
    nextStep: activityPlanRaw.nextStep,
  }

  // Recommend education module based on highest concern
  let educationModuleRecommended = 1
  if (centralSensitizationScore >= 20) {
    educationModuleRecommended = 3
  } else if (fearAvoidanceRisk === 'High') {
    educationModuleRecommended = 5
  } else if (log.psychological_contributors >= 7) {
    educationModuleRecommended = 4
  } else if (painLevel >= 7) {
    educationModuleRecommended = 2
  }

  const recommendations: string[] = []

  if (catastrophizingScore >= 8) {
    recommendations.push(
      'High catastrophizing detected. Consider working with a pain psychologist or CBT therapist — cognitive techniques reduce catastrophizing and pain significantly.',
    )
  }
  if (kinesiophobiaScore >= 14) {
    recommendations.push(
      'High fear of movement (kinesiophobia). Graded exposure therapy under guidance of a pain physiotherapist can help retrain your nervous system to feel safe with movement.',
    )
  }
  if (centralSensitizationScore >= 30) {
    recommendations.push(
      'Central sensitization inventory suggests your nervous system may be sensitized. Pain neuroscience education and pacing strategies are highly recommended. Discuss with your healthcare provider.',
    )
  }
  if (!log.movement_today || log.movement_minutes < 10) {
    recommendations.push(
      'Even small amounts of movement (5–10 minutes of walking) can reduce sensitization signals. Try a gentle 5-minute walk today if your pain allows.',
    )
  }
  if (log.psychological_contributors >= 7) {
    recommendations.push(
      'Psychological contributors are high. Sleep, stress management, and mindfulness have strong evidence for reducing chronic pain. Consider a mind-body approach.',
    )
  }
  if (log.social_contributors >= 7) {
    recommendations.push(
      'Social factors (work, relationships, financial stress) are high contributors. Addressing these through social support or counselling can meaningfully reduce pain.',
    )
  }
  if (recommendations.length === 0) {
    recommendations.push(
      'Your pain profile looks manageable. Keep recording daily to track trends and identify patterns. Continue your movement routine and helpful strategies.',
    )
  }

  return {
    painLevel,
    catastrophizingScore,
    kinesiophobiaScore,
    centralSensitizationScore,
    biopsychosocialBalance,
    fearAvoidanceRisk,
    gradedActivityPlan,
    educationModuleRecommended,
    recommendations,
  }
}

export function getFearAvoidanceBadge(risk: 'Low' | 'Moderate' | 'High'): {
  color: string
  bg: string
  label: string
} {
  switch (risk) {
    case 'Low':
      return { color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Low Risk' }
    case 'Moderate':
      return { color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Moderate Risk' }
    case 'High':
      return { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/30', label: 'High Risk' }
  }
}

export const DEFAULT_LOG: Omit<PainScienceLog, 'date'> = {
  pain_level: 0,
  pain_locations: [],
  pain_quality: [],
  biological_contributors: 5,
  psychological_contributors: 5,
  social_contributors: 5,
  pcs_rumination: 0,
  pcs_magnification: 0,
  pcs_helplessness: 0,
  tsk_q1: 1,
  tsk_q2: 1,
  tsk_q3: 1,
  tsk_q4: 1,
  csi_symptoms: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  movement_today: false,
  movement_minutes: 0,
  avoided_activities: [],
  helpful_strategies: [],
  notes: '',
}

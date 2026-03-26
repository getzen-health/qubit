/**
 * Mental Health & Wellbeing Library
 * Research basis:
 *   PHQ-9: Kroenke K, Spitzer RL, Williams JB. JAMA Intern Med. 2001.
 *   GAD-7: Spitzer RL et al. Arch Intern Med. 2006.
 *   WHO-5: Topp CW et al. Psychother Psychosom. 2015.
 *   PERMA: Seligman MEP. Flourish. 2011.
 *   CD-RISC-10: Connor KM, Davidson JRT. Depress Anxiety. 2003.
 *
 * ⚠️  If you are in crisis, please reach out:
 *    988 Suicide & Crisis Lifeline: call or text 988
 *    Crisis Text Line: text HOME to 741741
 */

// ─── Shared Option Types ─────────────────────────────────────────────────────

export interface ScaleOption {
  label: string
  value: number
}

export interface ScreenerQuestion {
  id: string
  text: string
  options: ScaleOption[]
}

// ─── PHQ-9 (Depression Screener) ─────────────────────────────────────────────
// Kroenke K, Spitzer RL, Williams JBW. JAMA Intern Med. 2001;161(21):2848-57.
// Freely available for clinical & research use.

const FREQ_0_3: ScaleOption[] = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
]

export const PHQ9_QUESTIONS: ScreenerQuestion[] = [
  { id: 'phq1', text: 'Little interest or pleasure in doing things', options: FREQ_0_3 },
  { id: 'phq2', text: 'Feeling down, depressed, or hopeless', options: FREQ_0_3 },
  { id: 'phq3', text: 'Trouble falling or staying asleep, or sleeping too much', options: FREQ_0_3 },
  { id: 'phq4', text: 'Feeling tired or having little energy', options: FREQ_0_3 },
  { id: 'phq5', text: 'Poor appetite or overeating', options: FREQ_0_3 },
  { id: 'phq6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', options: FREQ_0_3 },
  { id: 'phq7', text: 'Trouble concentrating on things, such as reading or watching television', options: FREQ_0_3 },
  { id: 'phq8', text: 'Moving or speaking so slowly that other people have noticed, or being fidgety or restless more than usual', options: FREQ_0_3 },
  { id: 'phq9', text: 'Thoughts that you would be better off dead, or thoughts of hurting yourself in some way', options: FREQ_0_3 },
]

export interface PHQ9Interpretation {
  label: string
  color: string
  description: string
  action: string
}

export function interpretPHQ9(score: number): PHQ9Interpretation {
  if (score <= 4) return { label: 'None–Minimal', color: '#22c55e', description: 'No clinically significant depression', action: 'Continue healthy practices.' }
  if (score <= 9) return { label: 'Mild', color: '#84cc16', description: 'Mild depressive symptoms', action: 'Self-monitoring; consider lifestyle changes.' }
  if (score <= 14) return { label: 'Moderate', color: '#eab308', description: 'Moderate depression', action: 'Consider professional support.' }
  if (score <= 19) return { label: 'Moderately Severe', color: '#f97316', description: 'Moderately severe depression', action: 'Actively seek professional help.' }
  return { label: 'Severe', color: '#ef4444', description: 'Severe depression', action: 'Immediate professional support recommended.' }
}

// ─── GAD-7 (Anxiety Screener) ─────────────────────────────────────────────────
// Spitzer RL et al. Arch Intern Med. 2006;166(10):1092-7.

export const GAD7_QUESTIONS: ScreenerQuestion[] = [
  { id: 'gad1', text: 'Feeling nervous, anxious, or on edge', options: FREQ_0_3 },
  { id: 'gad2', text: 'Not being able to stop or control worrying', options: FREQ_0_3 },
  { id: 'gad3', text: 'Worrying too much about different things', options: FREQ_0_3 },
  { id: 'gad4', text: 'Trouble relaxing', options: FREQ_0_3 },
  { id: 'gad5', text: 'Being so restless that it is hard to sit still', options: FREQ_0_3 },
  { id: 'gad6', text: 'Becoming easily annoyed or irritable', options: FREQ_0_3 },
  { id: 'gad7', text: 'Feeling afraid, as if something awful might happen', options: FREQ_0_3 },
]

export interface GAD7Interpretation {
  label: string
  color: string
  description: string
}

export function interpretGAD7(score: number): GAD7Interpretation {
  if (score <= 4) return { label: 'Minimal', color: '#22c55e', description: 'Minimal anxiety symptoms' }
  if (score <= 9) return { label: 'Mild', color: '#84cc16', description: 'Mild anxiety symptoms' }
  if (score <= 14) return { label: 'Moderate', color: '#eab308', description: 'Moderate anxiety — consider professional evaluation' }
  return { label: 'Severe', color: '#ef4444', description: 'Severe anxiety — professional support recommended' }
}

// ─── WHO-5 Wellbeing Index ────────────────────────────────────────────────────
// Topp CW et al. Psychother Psychosom. 2015;84(3):167-76.
// Raw score 0-25 × 4 = 0-100.  Score <50 = depression screening recommended.

const WHO5_OPTIONS: ScaleOption[] = [
  { label: 'At no time', value: 0 },
  { label: 'Some of the time', value: 1 },
  { label: 'Less than half the time', value: 2 },
  { label: 'More than half the time', value: 3 },
  { label: 'Most of the time', value: 4 },
  { label: 'All of the time', value: 5 },
]

export const WHO5_QUESTIONS: ScreenerQuestion[] = [
  { id: 'who1', text: 'I have felt cheerful and in good spirits', options: WHO5_OPTIONS },
  { id: 'who2', text: 'I have felt calm and relaxed', options: WHO5_OPTIONS },
  { id: 'who3', text: 'I have felt active and vigorous', options: WHO5_OPTIONS },
  { id: 'who4', text: 'I woke up feeling fresh and rested', options: WHO5_OPTIONS },
  { id: 'who5', text: 'My daily life has been filled with things that interest me', options: WHO5_OPTIONS },
]

/** Returns 0-100 scaled WHO-5 score */
export function calculateWHO5(rawSum: number): number {
  return rawSum * 4 // raw max 25 → 100
}

export function interpretWHO5(scaledScore: number): { label: string; color: string; description: string } {
  if (scaledScore >= 72) return { label: 'Good', color: '#22c55e', description: 'Good wellbeing' }
  if (scaledScore >= 52) return { label: 'Moderate', color: '#84cc16', description: 'Moderate wellbeing' }
  if (scaledScore >= 29) return { label: 'Below Average', color: '#eab308', description: 'Low wellbeing — consider professional screening' }
  return { label: 'Poor', color: '#ef4444', description: 'Poor wellbeing — depression screening recommended (score <50)' }
}

// ─── PERMA Model (Seligman 2011) ──────────────────────────────────────────────
// Seligman MEP. Flourish: A Visionary New Understanding of Happiness and Well-being. 2011.

const PERMA_SCALE: ScaleOption[] = Array.from({ length: 11 }, (_, i) => ({
  label: i === 0 ? 'Not at all' : i === 5 ? 'Somewhat' : i === 10 ? 'Completely' : `${i}`,
  value: i,
}))

export const PERMA_QUESTIONS: ScreenerQuestion[] = [
  // P — Positive Emotions
  { id: 'p1', text: 'In general, how often do you feel joyful?', options: PERMA_SCALE },
  { id: 'p2', text: 'In general, how often do you feel positive?', options: PERMA_SCALE },
  { id: 'p3', text: 'How much of the time do you feel contented?', options: PERMA_SCALE },
  // E — Engagement
  { id: 'e1', text: 'How often do you become absorbed in what you are doing?', options: PERMA_SCALE },
  { id: 'e2', text: 'In general, how often do you feel engaged?', options: PERMA_SCALE },
  { id: 'e3', text: 'How often do you lose track of time while doing something you enjoy?', options: PERMA_SCALE },
  // R — Relationships
  { id: 'r1', text: 'In general, to what extent do you receive help and support from others when you need it?', options: PERMA_SCALE },
  { id: 'r2', text: 'In general, to what extent do you feel loved?', options: PERMA_SCALE },
  { id: 'r3', text: 'How satisfied are you with your personal relationships?', options: PERMA_SCALE },
  // M — Meaning
  { id: 'm1', text: 'In general, to what extent do you lead a purposeful and meaningful life?', options: PERMA_SCALE },
  { id: 'm2', text: 'In general, to what extent do you feel that what you do in your life is valuable and worthwhile?', options: PERMA_SCALE },
  { id: 'm3', text: 'To what extent do you generally feel you have a sense of direction in your life?', options: PERMA_SCALE },
  // A — Accomplishment
  { id: 'a1', text: 'How much of the time do you feel you are making progress towards your goals?', options: PERMA_SCALE },
  { id: 'a2', text: 'How often do you achieve the important goals you have set for yourself?', options: PERMA_SCALE },
  { id: 'a3', text: 'In general, how often do you feel capable and competent?', options: PERMA_SCALE },
]

export interface PERMAScores {
  P: number // Positive Emotions — mean of 3 items, 0-10
  E: number // Engagement
  R: number // Relationships
  M: number // Meaning
  A: number // Accomplishment
  overall: number // Mean of all 5 dimensions
}

export function calculatePERMA(answers: number[]): PERMAScores {
  // answers[0..2] = P, [3..5] = E, [6..8] = R, [9..11] = M, [12..14] = A
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
  const P = mean(answers.slice(0, 3))
  const E = mean(answers.slice(3, 6))
  const R = mean(answers.slice(6, 9))
  const M = mean(answers.slice(9, 12))
  const A = mean(answers.slice(12, 15))
  return { P, E, R, M, A, overall: mean([P, E, R, M, A]) }
}

// ─── CD-RISC-10 (Resilience) ──────────────────────────────────────────────────
// Connor KM, Davidson JRT. Depress Anxiety. 2003;18(2):76-82.
// Max 40; higher = more resilient.

const CDRISC_OPTIONS: ScaleOption[] = [
  { label: 'Not true at all', value: 0 },
  { label: 'Rarely true', value: 1 },
  { label: 'Sometimes true', value: 2 },
  { label: 'Often true', value: 3 },
  { label: 'True nearly all the time', value: 4 },
]

export const CDRISC10_QUESTIONS: ScreenerQuestion[] = [
  { id: 'cd1', text: 'I am able to adapt when changes occur', options: CDRISC_OPTIONS },
  { id: 'cd2', text: 'I can deal with whatever comes my way', options: CDRISC_OPTIONS },
  { id: 'cd3', text: 'I try to see the humorous side of things when I am faced with problems', options: CDRISC_OPTIONS },
  { id: 'cd4', text: 'Having to cope with stress can make me stronger', options: CDRISC_OPTIONS },
  { id: 'cd5', text: 'I tend to bounce back after illness, injury or other hardships', options: CDRISC_OPTIONS },
  { id: 'cd6', text: 'I believe I can achieve my goals, even if there are obstacles', options: CDRISC_OPTIONS },
  { id: 'cd7', text: 'Under pressure, I stay focused and think clearly', options: CDRISC_OPTIONS },
  { id: 'cd8', text: 'I am not easily discouraged by failure', options: CDRISC_OPTIONS },
  { id: 'cd9', text: 'I think of myself as a strong person when dealing with life\'s challenges', options: CDRISC_OPTIONS },
  { id: 'cd10', text: 'I am able to handle unpleasant or painful feelings like sadness, fear, and anger', options: CDRISC_OPTIONS },
]

export function interpretCDRISC10(score: number): { label: string; color: string; percentile: string } {
  if (score >= 32) return { label: 'High Resilience', color: '#22c55e', percentile: 'Top 25%' }
  if (score >= 26) return { label: 'Moderate Resilience', color: '#84cc16', percentile: '25th–50th percentile' }
  if (score >= 18) return { label: 'Low-Moderate', color: '#eab308', percentile: '50th–75th percentile' }
  return { label: 'Low Resilience', color: '#ef4444', percentile: 'Bottom 25%' }
}

// ─── Composite Wellbeing Score ────────────────────────────────────────────────

/**
 * Composite wellbeing score (0-100).
 * Weights:
 *   WHO-5 (normalized) × 0.30
 *   PERMA mean (normalized 0-100) × 0.25
 *   CD-RISC-10 (normalized 0-100) × 0.20
 *   Symptom absence × 0.25
 *     = 100 − (phq9_pct × 0.5 + gad7_pct × 0.5)
 *
 * @param who5Scaled  WHO-5 score already scaled 0-100
 * @param permaOverall  PERMA overall mean 0-10
 * @param cdriscRaw  CD-RISC-10 raw 0-40
 * @param phq9Raw  PHQ-9 raw 0-27
 * @param gad7Raw  GAD-7 raw 0-21
 */
export function calculateWellbeingComposite(
  who5Scaled: number,
  permaOverall: number,
  cdriscRaw: number,
  phq9Raw: number,
  gad7Raw: number,
): number {
  const permaNorm = (permaOverall / 10) * 100
  const cdriscNorm = (cdriscRaw / 40) * 100
  const phq9Norm = (phq9Raw / 27) * 100
  const gad7Norm = (gad7Raw / 21) * 100
  const symptomAbsence = 100 - (phq9Norm * 0.5 + gad7Norm * 0.5)

  const composite =
    who5Scaled * 0.30 +
    permaNorm * 0.25 +
    cdriscNorm * 0.20 +
    symptomAbsence * 0.25

  return Math.round(Math.max(0, Math.min(100, composite)))
}

export function interpretComposite(score: number): { label: string; color: string; emoji: string } {
  if (score >= 80) return { label: 'Flourishing', color: '#22c55e', emoji: '🌟' }
  if (score >= 65) return { label: 'Good', color: '#84cc16', emoji: '😊' }
  if (score >= 50) return { label: 'Moderate', color: '#eab308', emoji: '😐' }
  if (score >= 35) return { label: 'Struggling', color: '#f97316', emoji: '😔' }
  return { label: 'At Risk', color: '#ef4444', emoji: '🆘' }
}

// ─── Positive Psychology Interventions ───────────────────────────────────────

export type EvidenceGrade = 'A' | 'B' | 'C'
export type InterventionCategory =
  | 'Gratitude'
  | 'Mindfulness'
  | 'Strengths'
  | 'Social'
  | 'Cognitive'
  | 'Physical'
  | 'Meaning'
  | 'Savouring'

export interface PositiveIntervention {
  id: string
  name: string
  category: InterventionCategory
  duration: string
  difficultyMinutes: number
  evidenceGrade: EvidenceGrade
  effectSize?: string
  instructions: string
  citations: string[]
}

export const POSITIVE_INTERVENTIONS: PositiveIntervention[] = [
  {
    id: 'three-good-things',
    name: 'Three Good Things',
    category: 'Gratitude',
    duration: '10 min',
    difficultyMinutes: 10,
    evidenceGrade: 'A',
    effectSize: 'd = 0.46',
    instructions:
      'Each evening write down three things that went well today and why they went well. Try to be specific — even small positives count. Consistency over 1 week produces lasting mood uplift.',
    citations: ['Emmons RA, McCullough ME. J Pers Soc Psychol. 2003;84(2):377-89.', 'Seligman MEP et al. Am Psychol. 2005;60(5):410-21.'],
  },
  {
    id: 'gratitude-letter',
    name: 'Gratitude Letter & Visit',
    category: 'Gratitude',
    duration: '20–30 min',
    difficultyMinutes: 25,
    evidenceGrade: 'A',
    effectSize: 'Largest effect of any single positive intervention',
    instructions:
      'Write a heartfelt letter to someone who has positively impacted your life and whom you have never properly thanked. Deliver it in person and read it aloud — or send it if meeting isn\'t possible.',
    citations: ['Seligman MEP et al. Am Psychol. 2005;60(5):410-21.'],
  },
  {
    id: 'gratitude-journal',
    name: 'Gratitude Journal',
    category: 'Gratitude',
    duration: '5–10 min',
    difficultyMinutes: 7,
    evidenceGrade: 'A',
    effectSize: 'd = 0.31',
    instructions:
      'Write 3–5 things you are grateful for today. Vary the items; do not repeat the same ones daily. Once or twice a week is often more effective than daily.',
    citations: ['Emmons RA, McCullough ME. J Pers Soc Psychol. 2003;84(2):377-89.'],
  },
  {
    id: 'best-possible-self',
    name: 'Best Possible Self',
    category: 'Meaning',
    duration: '20 min',
    difficultyMinutes: 20,
    evidenceGrade: 'A',
    effectSize: 'd = 0.39',
    instructions:
      'Imagine your best possible self in the future — after everything has gone as well as it possibly could. Write in detail about this future version of you across life domains (relationships, career, health). Re-read and visualise for 5 minutes.',
    citations: ['King LA. J Pers Soc Psychol. 2001;81(2):376-92.', 'Sheldon KM, Lyubomirsky S. J Posit Psychol. 2006;1(2):73-82.'],
  },
  {
    id: 'acts-of-kindness',
    name: 'Acts of Kindness',
    category: 'Social',
    duration: '30 min',
    difficultyMinutes: 30,
    evidenceGrade: 'A',
    effectSize: 'd = 0.37',
    instructions:
      'Perform 5 acts of kindness in a single day once a week. Concentrate them on one day rather than spreading them out — this amplifies the effect. Acts can be small (holding a door, paying a compliment) or larger.',
    citations: ['Lyubomirsky S, Sheldon KM, Schkade D. Rev Gen Psychol. 2005;9(2):111-31.', 'Lyubomirsky S et al. J Happiness Stud. 2004;5(1):71-83.'],
  },
  {
    id: 'savouring',
    name: 'Savouring',
    category: 'Savouring',
    duration: '15 min',
    difficultyMinutes: 15,
    evidenceGrade: 'B',
    effectSize: 'd = 0.23',
    instructions:
      'Choose a positive experience (a meal, a view, music, a conversation). Slow down, engage all your senses, and mentally photograph the moment. Avoid multitasking. Afterwards write 2-3 sentences about what you savoured.',
    citations: ['Bryant FB, Veroff J. Savoring: A New Model of Positive Experience. 2007.'],
  },
  {
    id: 'strengths-spotting',
    name: 'Use Your Signature Strengths',
    category: 'Strengths',
    duration: '15–60 min',
    difficultyMinutes: 20,
    evidenceGrade: 'A',
    effectSize: 'd = 0.49',
    instructions:
      'Identify your top-5 VIA Character Strengths (viacharacter.org). Each day this week, use one top strength in a new and different way. Strengths use boosts engagement, meaning, and life satisfaction.',
    citations: ['Peterson C, Seligman MEP. Character Strengths and Virtues. 2004.', 'Seligman MEP et al. Am Psychol. 2005;60(5):410-21.'],
  },
  {
    id: 'mindful-breathing',
    name: 'Mindful Breathing (5 min)',
    category: 'Mindfulness',
    duration: '5 min',
    difficultyMinutes: 5,
    evidenceGrade: 'A',
    effectSize: 'Reduces anxiety, d = 0.55',
    instructions:
      'Sit comfortably. Focus on the sensation of your breath entering and leaving your nostrils. When your mind wanders, gently return attention to the breath without judgement. Start with 5 minutes; build to 20 minutes over time.',
    citations: ['Kabat-Zinn J. Full Catastrophe Living. 1990.', 'Hofmann SG et al. J Consult Clin Psychol. 2010;78(2):169-83.'],
  },
  {
    id: 'body-scan',
    name: 'Body Scan Meditation',
    category: 'Mindfulness',
    duration: '10–20 min',
    difficultyMinutes: 15,
    evidenceGrade: 'B',
    instructions:
      'Lie down or sit comfortably. Slowly bring attention to each body part from toes to head, noticing sensations without judgment. Great before sleep to release tension.',
    citations: ['Kabat-Zinn J. Full Catastrophe Living. 1990.'],
  },
  {
    id: 'cognitive-reframing',
    name: 'Cognitive Reframing',
    category: 'Cognitive',
    duration: '15 min',
    difficultyMinutes: 15,
    evidenceGrade: 'A',
    effectSize: 'd = 0.68 (CBT overall)',
    instructions:
      'Identify a negative automatic thought. Ask: What is the evidence for/against this thought? What would I say to a friend? What is a more balanced alternative thought? Write each step down.',
    citations: ['Beck JS. Cognitive Behavior Therapy: Basics and Beyond. 2011.', 'Butler AC et al. Clin Psychol Rev. 2006;26(1):17-31.'],
  },
  {
    id: 'social-connection',
    name: 'Schedule a Meaningful Interaction',
    category: 'Social',
    duration: '30–60 min',
    difficultyMinutes: 45,
    evidenceGrade: 'A',
    instructions:
      'Reach out and schedule one meaningful in-person or video interaction with someone you care about this week. Prioritise depth over breadth — a single high-quality conversation matters more than many superficial ones.',
    citations: ['Holt-Lunstad J, Smith TB, Layton JB. PLoS Med. 2010;7(7):e1000316.'],
  },
  {
    id: 'physical-activity',
    name: '30-Minute Brisk Walk or Exercise',
    category: 'Physical',
    duration: '30 min',
    difficultyMinutes: 30,
    evidenceGrade: 'A',
    effectSize: 'Reduces depression risk 26% (Choi 2019)',
    instructions:
      'Perform 30 minutes of moderate-intensity aerobic activity (brisk walking, cycling, swimming). Even a single session immediately elevates mood via endorphin release, BDNF upregulation, and reduced cortisol.',
    citations: ['Choi KW et al. JAMA Psychiatry. 2019;76(4):399-408.', 'Blumenthal JA et al. Arch Intern Med. 1999;159(19):2349-56.'],
  },
  {
    id: 'progressive-muscle-relaxation',
    name: 'Progressive Muscle Relaxation',
    category: 'Mindfulness',
    duration: '15 min',
    difficultyMinutes: 15,
    evidenceGrade: 'B',
    effectSize: 'd = 0.44 for anxiety',
    instructions:
      'Working from feet to face, tense each muscle group for 5 seconds then release for 30 seconds, noticing the contrast. Proven to reduce somatic anxiety and improve sleep onset.',
    citations: ['Jacobson E. Progressive Relaxation. 1938.', 'Manzoni GM et al. Eur J Cardiovasc Prev Rehabil. 2008;15(5):505-10.'],
  },
  {
    id: 'flow-activity',
    name: 'Flow Activity',
    category: 'Strengths',
    duration: '60 min',
    difficultyMinutes: 60,
    evidenceGrade: 'B',
    instructions:
      'Choose an activity where your skills match the challenge level — neither too easy (boredom) nor too hard (anxiety). Music, coding, sport, art, or a craft all work. Aim for 60 minutes of uninterrupted engagement.',
    citations: ['Csikszentmihalyi M. Flow: The Psychology of Optimal Experience. 1990.'],
  },
  {
    id: 'values-clarification',
    name: 'Values Clarification',
    category: 'Meaning',
    duration: '20 min',
    difficultyMinutes: 20,
    evidenceGrade: 'B',
    instructions:
      'List your top 10 personal values (e.g. honesty, creativity, family, adventure). Rank them. Write how your daily actions do or do not align with your top 3. Plan one small action this week to better embody your #1 value.',
    citations: ['Wilson KG, Murrell AR. Acceptance and Commitment Therapy. 2004.'],
  },
  {
    id: 'positive-reminiscing',
    name: 'Positive Reminiscing',
    category: 'Savouring',
    duration: '10 min',
    difficultyMinutes: 10,
    evidenceGrade: 'B',
    instructions:
      'Spend 10 minutes looking through photos or journals from a positive past experience. Relive the emotions deliberately. Share the memory with someone else for amplified benefit.',
    citations: ['Bryant FB, Smart CM, King SP. J Soc Clin Psychol. 2005;24(2):182-99.'],
  },
  {
    id: 'self-compassion-break',
    name: 'Self-Compassion Break',
    category: 'Mindfulness',
    duration: '5 min',
    difficultyMinutes: 5,
    evidenceGrade: 'B',
    effectSize: 'd = 0.43',
    instructions:
      'When you notice you are being self-critical, pause and say: (1) "This is a moment of suffering" — mindfulness; (2) "Suffering is part of life" — common humanity; (3) "May I be kind to myself" — self-kindness. Place a hand on your heart.',
    citations: ['Neff KD, Germer CK. J Clin Psychol. 2013;69(1):28-44.'],
  },
  {
    id: 'expressive-writing',
    name: 'Expressive Writing',
    category: 'Cognitive',
    duration: '20 min',
    difficultyMinutes: 20,
    evidenceGrade: 'A',
    effectSize: 'd = 0.36 for health outcomes',
    instructions:
      'For 4 consecutive days, write for 20 minutes about the deepest thoughts and feelings surrounding a stressful event. Write continuously, ignore spelling/grammar. Do not share it.',
    citations: ['Pennebaker JW, Beall SK. J Abnorm Psychol. 1986;95(3):274-81.', 'Smyth JM. J Consult Clin Psychol. 1998;66(1):174-84.'],
  },
  {
    id: 'counting-blessings',
    name: 'Count Your Blessings (Weekly)',
    category: 'Gratitude',
    duration: '10 min',
    difficultyMinutes: 10,
    evidenceGrade: 'A',
    effectSize: 'd = 0.28',
    instructions:
      'Once a week, list 5 things you feel grateful for from the past 7 days. Being specific is key — "My partner made me coffee this morning" beats "I am grateful for family." Focus on people, moments, and small wins.',
    citations: ['Emmons RA, McCullough ME. J Pers Soc Psychol. 2003;84(2):377-89.'],
  },
  {
    id: 'nature-exposure',
    name: 'Nature Exposure Walk',
    category: 'Physical',
    duration: '20 min',
    difficultyMinutes: 20,
    evidenceGrade: 'B',
    effectSize: 'Reduces rumination, anxiety, and cortisol',
    instructions:
      'Take a 20-minute walk in a natural environment (park, forest, riverside). Leave your phone on silent. Focus on sounds, sights, and smells. Even urban green spaces provide measurable mental health benefits.',
    citations: ['Bratman GN et al. Proc Natl Acad Sci. 2015;112(28):8567-72.', 'Nguyen PY et al. Int J Environ Res Public Health. 2021;18(9):4477.'],
  },
]

// ─── Crisis Resources ─────────────────────────────────────────────────────────

export const CRISIS_RESOURCES = {
  us: '988 Suicide & Crisis Lifeline: call or text 988',
  textLine: 'Crisis Text Line: text HOME to 741741',
  international: 'International resources: findahelpline.com',
  chat: 'Online crisis chat: 988lifeline.org/chat',
}

// ─── Emotion Wheel (Plutchik) ─────────────────────────────────────────────────

export interface EmotionNode {
  name: string
  color: string
  secondary?: Array<{
    name: string
    tertiary?: string[]
  }>
}

export const EMOTION_WHEEL: EmotionNode[] = [
  {
    name: 'Joy',
    color: '#fbbf24',
    secondary: [
      { name: 'Serenity', tertiary: ['Contentment', 'Ease', 'Calmness'] },
      { name: 'Ecstasy', tertiary: ['Elation', 'Euphoria', 'Bliss'] },
      { name: 'Love', tertiary: ['Affection', 'Tenderness', 'Fondness'] },
    ],
  },
  {
    name: 'Trust',
    color: '#34d399',
    secondary: [
      { name: 'Acceptance', tertiary: ['Tolerance', 'Inclusion', 'Openness'] },
      { name: 'Admiration', tertiary: ['Awe', 'Reverence', 'Respect'] },
    ],
  },
  {
    name: 'Fear',
    color: '#818cf8',
    secondary: [
      { name: 'Apprehension', tertiary: ['Worry', 'Unease', 'Nervousness'] },
      { name: 'Terror', tertiary: ['Panic', 'Dread', 'Horror'] },
    ],
  },
  {
    name: 'Surprise',
    color: '#38bdf8',
    secondary: [
      { name: 'Distraction', tertiary: ['Confusion', 'Perplexity'] },
      { name: 'Amazement', tertiary: ['Astonishment', 'Awe', 'Wonder'] },
    ],
  },
  {
    name: 'Sadness',
    color: '#60a5fa',
    secondary: [
      { name: 'Pensiveness', tertiary: ['Melancholy', 'Wistfulness', 'Gloom'] },
      { name: 'Grief', tertiary: ['Anguish', 'Sorrow', 'Despair'] },
    ],
  },
  {
    name: 'Disgust',
    color: '#4ade80',
    secondary: [
      { name: 'Boredom', tertiary: ['Indifference', 'Apathy'] },
      { name: 'Loathing', tertiary: ['Contempt', 'Revulsion'] },
    ],
  },
  {
    name: 'Anger',
    color: '#f87171',
    secondary: [
      { name: 'Annoyance', tertiary: ['Frustration', 'Irritability', 'Impatience'] },
      { name: 'Rage', tertiary: ['Fury', 'Wrath', 'Hostility'] },
    ],
  },
  {
    name: 'Anticipation',
    color: '#fb923c',
    secondary: [
      { name: 'Interest', tertiary: ['Curiosity', 'Fascination', 'Engagement'] },
      { name: 'Vigilance', tertiary: ['Alertness', 'Readiness', 'Focus'] },
    ],
  },
]

// Flat list of all emotion names for chip selection
export const ALL_EMOTIONS: string[] = [
  'Joy', 'Serenity', 'Contentment', 'Ease', 'Ecstasy', 'Elation', 'Euphoria', 'Love', 'Affection', 'Tenderness',
  'Trust', 'Acceptance', 'Openness', 'Admiration', 'Awe', 'Respect',
  'Fear', 'Apprehension', 'Worry', 'Nervousness', 'Terror', 'Panic', 'Dread',
  'Surprise', 'Distraction', 'Confusion', 'Amazement', 'Wonder', 'Astonishment',
  'Sadness', 'Pensiveness', 'Melancholy', 'Gloom', 'Grief', 'Anguish', 'Sorrow', 'Despair',
  'Disgust', 'Boredom', 'Apathy', 'Loathing', 'Contempt', 'Revulsion',
  'Anger', 'Annoyance', 'Frustration', 'Irritability', 'Rage', 'Fury', 'Hostility',
  'Anticipation', 'Interest', 'Curiosity', 'Fascination', 'Vigilance', 'Alertness',
  'Gratitude', 'Hope', 'Pride', 'Inspiration', 'Enthusiasm', 'Calm', 'Relaxed',
]

// ─── Mood Entry Interface ─────────────────────────────────────────────────────

export interface MoodEntry {
  date: string          // ISO date string
  valence: number       // -5 (very negative) to +5 (very positive)
  arousal: number       // -5 (very low energy) to +5 (very high energy)
  emotions: string[]    // selected from EMOTION_WHEEL
  notes?: string
}

// ─── Assessment Storage Type ──────────────────────────────────────────────────

export type AssessmentType = 'phq9' | 'gad7' | 'who5' | 'perma' | 'cdrisc' | 'composite'

export interface MentalHealthAssessment {
  id?: string
  user_id?: string
  date: string
  assessment_type: AssessmentType
  scores: Record<string, number>
  composite_score?: number
  notes?: string
  created_at?: string
}

// ─── Valence → Emoji helper ────────────────────────────────────────────────────

export function valenceToEmoji(valence: number): string {
  if (valence >= 4) return '😄'
  if (valence >= 2) return '🙂'
  if (valence >= 0) return '😐'
  if (valence >= -2) return '😕'
  return '😢'
}

export function valenceToColor(valence: number): string {
  if (valence >= 3) return '#22c55e'
  if (valence >= 1) return '#86efac'
  if (valence >= -1) return '#fbbf24'
  if (valence >= -3) return '#f97316'
  return '#ef4444'
}

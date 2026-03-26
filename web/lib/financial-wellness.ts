// Financial Wellness Tracker — wellness perceptions only, no actual financial data stored
// Based on CFPB Financial Well-Being Scale (2015), Archuleta et al. 2013, Gallo et al. 2013

export interface FinancialWellnessLog {
  id?: string
  user_id?: string
  date: string
  // CFPB adapted 5-item scale (1-5 Likert: Never=1 to Always=5)
  cfpb_q1: number // "I can enjoy life because of the way I'm managing my money." (positive)
  cfpb_q2: number // "I am securing my financial future." (positive)
  cfpb_q3: number // "Because of my money situation, I feel I will never have the things I want." (negative)
  cfpb_q4: number // "I am behind with my finances." (negative)
  cfpb_q5: number // "My finances control my life." (negative)
  // Supplemental inputs
  financial_stress: number          // 1-10
  emergency_fund_months: number     // 0, 1, 3, 6, 12
  positive_money_thoughts: number   // 1-10
  financial_worry_topics: string[]  // e.g. 'debt', 'retirement', 'job_security'
  coping_techniques_used: string[]
  notes?: string
  created_at?: string
}

export interface FinancialWellnessScore {
  total: number                         // 0-100
  grade: 'Thriving' | 'Doing OK' | 'At Risk' | 'Struggling'
  cfpbScore: number                     // 5-25
  cfpbLevel: 'Thriving' | 'Doing OK' | 'At Risk' | 'Struggling'
  pillars: {
    cfpb: number          // 0-100
    stressInverse: number // 0-100
    buffer: number        // 0-100
    mindset: number       // 0-100
  }
  topWorries: string[]
  recommendations: string[]
  copingTips: CopingTip[]
}

export interface CopingTip {
  id: string
  title: string
  description: string
  evidence: string
  actionStep: string
}

export interface FinancialCorrelation {
  metric: 'sleep' | 'stress' | 'mood'
  label: string
  coefficient: number
  significant: boolean
  direction: 'positive' | 'negative' | 'none'
}

export const CFPB_QUESTIONS = [
  {
    id: 'q1',
    text: 'I can enjoy life because of the way I\'m managing my money.',
    isPositive: true,
    hint: 'Think about how your financial management affects your day-to-day enjoyment',
  },
  {
    id: 'q2',
    text: 'I am securing my financial future.',
    isPositive: true,
    hint: 'Consider savings, retirement, or any steps toward future security',
  },
  {
    id: 'q3',
    text: 'Because of my money situation, I feel like I will never have the things I want in life.',
    isPositive: false,
    hint: 'Think about your sense of financial possibility and hope',
  },
  {
    id: 'q4',
    text: 'I am behind with my finances.',
    isPositive: false,
    hint: 'Reflect on whether you feel caught up or falling behind financially',
  },
  {
    id: 'q5',
    text: 'My finances control my life.',
    isPositive: false,
    hint: 'Consider how much financial concerns drive your decisions and emotions',
  },
] as const

export const LIKERT_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] as const

export const EMERGENCY_FUND_OPTIONS = [
  { value: 0, label: 'None', score: 0 },
  { value: 1, label: '1 month', score: 25 },
  { value: 3, label: '3 months', score: 60 },
  { value: 6, label: '6+ months', score: 100 },
  { value: 12, label: '12+ months', score: 100 },
] as const

export const WORRY_TOPICS = [
  { id: 'debt', label: 'Debt / Loans' },
  { id: 'retirement', label: 'Retirement savings' },
  { id: 'job_security', label: 'Job security' },
  { id: 'daily_expenses', label: 'Daily expenses' },
  { id: 'housing', label: 'Housing costs' },
  { id: 'healthcare', label: 'Healthcare costs' },
  { id: 'family', label: 'Family obligations' },
  { id: 'investment', label: 'Market / Investments' },
] as const

export const COPING_TECHNIQUES = [
  { id: 'budget_review', label: 'Budget review' },
  { id: 'mindfulness', label: 'Money mindfulness' },
  { id: 'journaling', label: 'Financial journaling' },
  { id: 'talk_someone', label: 'Talked to someone' },
  { id: 'small_win', label: 'Celebrated a small win' },
  { id: 'social_media_detox', label: 'Avoided financial comparison' },
  { id: 'automation', label: 'Set up automation' },
  { id: 'values_alignment', label: 'Values-based spending check' },
] as const

export const COPING_TIPS: CopingTip[] = [
  {
    id: 'budget_clarity',
    title: 'Budget Clarity',
    description:
      'Knowing your financial situation — even when numbers feel uncomfortable — reduces anxiety more than uncertainty. The brain\'s threat response is amplified by ambiguity.',
    evidence: 'Schlösser et al. 2013 — uncertainty increases amygdala activation more than known bad news',
    actionStep: 'Spend 10 minutes today listing your top 3 monthly expenses. Clarity beats avoidance.',
  },
  {
    id: 'values_spending',
    title: 'Values-Based Spending',
    description:
      'Aligning spending with your core values reduces guilt and financial anxiety. When purchases reflect what genuinely matters to you, money stress decreases significantly.',
    evidence: 'Archuleta & Grable 2011 — values alignment reduces financial anxiety and improves health markers',
    actionStep: 'Name 3 things you value most. Check if your last week\'s spending reflected them.',
  },
  {
    id: 'automation',
    title: 'Automate to Reduce Decision Fatigue',
    description:
      'Daily financial decisions drain mental energy and amplify money anxiety. Automating savings, bills, and investments removes recurring stressors from your cognitive load.',
    evidence: 'Decision fatigue research (Baumeister 2012) — each decision depletes willpower for the next',
    actionStep: 'Identify one recurring financial task you can automate this week (e.g., bill payment).',
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness Before Financial Tasks',
    description:
      'A 10-minute body scan before reviewing finances activates the prefrontal cortex and dampens the amygdala threat response, allowing clearer financial thinking.',
    evidence: 'Shapiro & Burchell 2012 — money anxiety activates same amygdala threat-response as physical danger',
    actionStep: 'Before your next budget review, do a 10-minute breathing exercise or body scan.',
  },
  {
    id: 'small_wins',
    title: 'Celebrate Small Financial Wins',
    description:
      'Recognizing progress — even small savings milestones or debt reductions — activates the reward system and builds intrinsic motivation to continue healthy financial behaviors.',
    evidence: 'Archuleta et al. 2013 (J Financial Therapy) — progress recognition improves financial self-efficacy',
    actionStep: 'Identify one financial win from this month, no matter how small, and acknowledge it.',
  },
  {
    id: 'social_comparison',
    title: 'Reduce Financial Social Comparison',
    description:
      'Social media exposure to others\' financial lifestyles triggers comparison and financial shame, increasing anxiety. Reducing this exposure measurably lowers financial stress.',
    evidence: 'Gallo et al. 2013 — perceived financial hardship (including social comparison) increases health risk',
    actionStep: 'Unfollow or mute 3 accounts that trigger financial comparison or lifestyle envy.',
  },
]

export const MINDSET_PROMPTS = [
  'What is one financial choice you\'ve made recently that you feel good about?',
  'If money were not a concern for a day, what would you do differently?',
  'What does "financial security" mean to you personally — not to anyone else?',
  'Name one belief about money you inherited from your upbringing. Is it still serving you?',
  'What small financial goal, if achieved, would bring you genuine peace of mind?',
  'When you feel financial anxiety, what does your body feel? Where do you hold it?',
  'What would you tell a close friend who had the exact same financial situation as you?',
] as const

/** Score the CFPB 5-item adapted scale. Returns 5-25. */
export function scoreCFPB(log: Pick<FinancialWellnessLog, 'cfpb_q1' | 'cfpb_q2' | 'cfpb_q3' | 'cfpb_q4' | 'cfpb_q5'>): number {
  const pos1 = Math.min(5, Math.max(1, log.cfpb_q1))
  const pos2 = Math.min(5, Math.max(1, log.cfpb_q2))
  const neg3 = 6 - Math.min(5, Math.max(1, log.cfpb_q3)) // reverse scored
  const neg4 = 6 - Math.min(5, Math.max(1, log.cfpb_q4)) // reverse scored
  const neg5 = 6 - Math.min(5, Math.max(1, log.cfpb_q5)) // reverse scored
  return pos1 + pos2 + neg3 + neg4 + neg5
}

export function cfpbLevel(score: number): FinancialWellnessScore['cfpbLevel'] {
  if (score >= 20) return 'Thriving'
  if (score >= 15) return 'Doing OK'
  if (score >= 10) return 'At Risk'
  return 'Struggling'
}

function bufferScore(months: number): number {
  if (months >= 6) return 100
  if (months >= 3) return 60
  if (months >= 1) return 25
  return 0
}

/** Main composite score: 0-100.
 * CFPB normalized (40%) + Stress inverse (30%) + Buffer (20%) + Mindset (10%)
 */
export function calculateFinancialWellness(log: FinancialWellnessLog): FinancialWellnessScore {
  const cfpbRaw = scoreCFPB(log)
  const cfpbNorm = ((cfpbRaw - 5) / 20) * 100
  const stressInverse = 100 - (Math.min(10, Math.max(1, log.financial_stress)) * 10)
  const buffer = bufferScore(log.emergency_fund_months)
  const mindset = Math.min(10, Math.max(1, log.positive_money_thoughts)) * 10

  const total = Math.round(cfpbNorm * 0.4 + stressInverse * 0.3 + buffer * 0.2 + mindset * 0.1)

  const grade: FinancialWellnessScore['grade'] =
    total >= 75 ? 'Thriving' :
    total >= 55 ? 'Doing OK' :
    total >= 35 ? 'At Risk' :
    'Struggling'

  const recommendations = buildRecommendations(log, cfpbRaw, total)
  const level = cfpbLevel(cfpbRaw)
  const relevantTips = COPING_TIPS.filter((t) => !log.coping_techniques_used.includes(t.id)).slice(0, 3)

  return {
    total,
    grade,
    cfpbScore: cfpbRaw,
    cfpbLevel: level,
    pillars: { cfpb: Math.round(cfpbNorm), stressInverse, buffer, mindset },
    topWorries: log.financial_worry_topics,
    recommendations,
    copingTips: relevantTips,
  }
}

function buildRecommendations(log: FinancialWellnessLog, cfpbScore: number, total: number): string[] {
  const recs: string[] = []

  if (log.emergency_fund_months < 3) {
    recs.push('Building even 1 month of emergency savings significantly reduces financial anxiety and health stress markers.')
  }
  if (log.financial_stress >= 7) {
    recs.push('High financial stress correlates with elevated cortisol, poor sleep, and immune suppression. Addressing root causes protects your physical health.')
  }
  if (cfpbScore < 12) {
    recs.push('Your CFPB score suggests financial insecurity is impacting your wellbeing. Consider speaking with a non-profit financial counselor — evidence shows this reduces anxiety even without income change.')
  }
  if (log.positive_money_thoughts < 4) {
    recs.push('Low money mindset scores often reflect cognitive distortions. CBT-based financial therapy techniques can reframe beliefs without changing circumstances.')
  }
  if (log.financial_worry_topics.includes('debt')) {
    recs.push('Debt-related worry is among the strongest predictors of financial stress-related insomnia. A debt payoff visualization can reduce perceived burden.')
  }
  if (log.financial_worry_topics.includes('retirement')) {
    recs.push('Retirement anxiety is often amplified by comparison. Focusing on personal progress (not benchmarks) reduces anxiety significantly.')
  }
  if (total >= 75) {
    recs.push('You\'re in a strong financial wellness position. Maintaining your current habits and periodically reviewing your values alignment will sustain this.')
  }

  return recs.slice(0, 4)
}

/** Pearson correlation coefficient between two numeric arrays. */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 3) return 0
  const xs = x.slice(0, n)
  const ys = y.slice(0, n)
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, dx2 = 0, dy2 = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    dx2 += (xs[i] - mx) ** 2
    dy2 += (ys[i] - my) ** 2
  }
  const denom = Math.sqrt(dx2 * dy2)
  return denom === 0 ? 0 : num / denom
}

export function getTodayPrompt(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return MINDSET_PROMPTS[dayOfYear % MINDSET_PROMPTS.length]
}

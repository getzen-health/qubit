/**
 * Social Health Library — UCLA-3 Loneliness Screener & Social Vitality Score
 *
 * Research basis:
 * - UCLA Loneliness Scale v3 (Russell, 1996) — 3-item validated screener
 * - Holt-Lunstad et al. 2015 — loneliness = mortality risk of 15 cigs/day
 * - Cacioppo & Hawkley 2010 — social isolation → HPA dysregulation
 * - Yang et al. 2016 — social isolation increases mortality risk 29% (n=3.4M)
 */

export interface SocialLog {
  id?: string
  user_id?: string
  date: string
  ucla3_q1: number // 1–4 (Never → Always)
  ucla3_q2: number // 1–4
  ucla3_q3: number // 1–4
  in_person_interactions: number
  digital_interactions: number
  shared_meals: number
  meaningful_convos: number
  group_activities: number
  connection_depth: number // 1–5 avg quality rating
  volunteering_minutes: number
  notes?: string
  created_at?: string
}

export interface SocialScore {
  total: number
  grade: 'Thriving' | 'Connected' | 'Moderate' | 'Isolated'
  ucla3Score: number
  lonelinessRisk: 'low' | 'moderate' | 'high'
  pillars: {
    connectionQuality: number
    socialFrequency: number
    lonelinessInverse: number
  }
  recommendations: string[]
}

export const UCLA3_QUESTIONS = [
  { id: 'q1', text: 'How often do you feel that you lack companionship?' },
  { id: 'q2', text: 'How often do you feel left out?' },
  { id: 'q3', text: 'How often do you feel isolated from others?' },
] as const

export const UCLA3_OPTIONS = ['Never', 'Rarely', 'Sometimes', 'Always'] as const

/** Social Vitality Score = (connection_quality × 0.35) + (social_frequency × 0.30) + (loneliness_inverse × 0.35) */
export function calculateSocialScore(log: SocialLog): SocialScore {
  const ucla3Score = log.ucla3_q1 + log.ucla3_q2 + log.ucla3_q3 // 3–12

  // Pillar 1: Connection quality — avg depth rating (1–5) × 20
  const connectionQuality = Math.min(100, Math.max(0, log.connection_depth * 20))

  // Pillar 2: Social frequency — in-person weighted, digital counts half
  let rawFreq = 0
  if (log.in_person_interactions >= 3) rawFreq = 100
  else if (log.in_person_interactions === 2) rawFreq = 50
  else if (log.in_person_interactions === 1) rawFreq = 20
  // Digital interactions contribute half value (capped at 30 pts)
  rawFreq += Math.min(30, log.digital_interactions * 10 * 0.5)
  const socialFrequency = Math.min(100, rawFreq)

  // Pillar 3: Loneliness inverse — 100 − ((ucla3 − 3) / 9 × 100)
  const lonelinessInverse = Math.max(0, Math.min(100, 100 - ((ucla3Score - 3) / 9) * 100))

  const total = connectionQuality * 0.35 + socialFrequency * 0.30 + lonelinessInverse * 0.35

  let grade: SocialScore['grade']
  if (total >= 75) grade = 'Thriving'
  else if (total >= 50) grade = 'Connected'
  else if (total >= 30) grade = 'Moderate'
  else grade = 'Isolated'

  let lonelinessRisk: SocialScore['lonelinessRisk']
  if (ucla3Score >= 9) lonelinessRisk = 'high'
  else if (ucla3Score >= 6) lonelinessRisk = 'moderate'
  else lonelinessRisk = 'low'

  const recommendations: string[] = []
  if (lonelinessRisk !== 'low') {
    recommendations.push('Try a group fitness class, hiking club, or local meetup (MeetUp.com)')
    recommendations.push('Volunteer locally — even 1 hour/week reduces loneliness by 30% (Rotary, foodbank)')
    recommendations.push('Join a club aligned with a hobby — regular contact builds belonging over time')
  }
  if (log.in_person_interactions < 2) {
    recommendations.push('Aim for ≥ 2 in-person interactions today — face-to-face contact releases oxytocin')
  }
  if (log.connection_depth < 3) {
    recommendations.push('Schedule one meaningful conversation — ask open-ended questions, not small talk')
  }
  if (log.shared_meals === 0) {
    recommendations.push('Share a meal — communal eating is among the strongest predictors of social wellbeing')
  }
  if (log.volunteering_minutes === 0 && total < 50) {
    recommendations.push('Helping others activates reward circuits and reduces self-focused loneliness')
  }

  return {
    total: Math.round(total),
    grade,
    ucla3Score,
    lonelinessRisk,
    pillars: {
      connectionQuality: Math.round(connectionQuality),
      socialFrequency: Math.round(socialFrequency),
      lonelinessInverse: Math.round(lonelinessInverse),
    },
    recommendations: recommendations.slice(0, 4),
  }
}

export const GRADE_COLORS: Record<SocialScore['grade'], string> = {
  Thriving: '#10b981',
  Connected: '#6366f1',
  Moderate: '#f59e0b',
  Isolated: '#ef4444',
}

export const RISK_CONFIG = {
  low: { label: 'Low Risk', color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  moderate: { label: 'At Risk', color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/30' },
  high: { label: 'High Risk', color: 'text-rose-600', bg: 'bg-rose-500/10 border-rose-500/30' },
} as const

export function emptyLog(date: string): SocialLog {
  return {
    date,
    ucla3_q1: 1,
    ucla3_q2: 1,
    ucla3_q3: 1,
    in_person_interactions: 0,
    digital_interactions: 0,
    shared_meals: 0,
    meaningful_convos: 0,
    group_activities: 0,
    connection_depth: 3,
    volunteering_minutes: 0,
    notes: '',
  }
}

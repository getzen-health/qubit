export type MeditationType =
  | 'breath'
  | 'body_scan'
  | 'loving_kindness'
  | 'open_awareness'
  | 'mantra'
  | 'walking'
  | 'visualization'
  | 'other'

export interface MeditationSession {
  id?: string
  user_id?: string
  date: string
  type: MeditationType
  duration_min: number
  quality_rating: number   // 1-5
  distractions: number     // count of times mind wandered
  mood_before: number      // 1-10
  mood_after: number       // 1-10
  stress_before: number    // 1-10
  stress_after: number     // 1-10
  insight?: string
  mbsr_week?: number       // 1-8 if following MBSR curriculum
  created_at?: string
}

export interface MindfulnessAnalysis {
  totalMinutesAllTime: number
  weeklyMinutes: number
  currentStreak: number
  longestStreak: number
  avgMoodShift: number
  avgStressReduction: number
  attentionScore: number   // 0-100 composite
  favoriteType: MeditationType
  mbsrProgress?: { currentWeek: number; completedSessions: number }
  recommendations: string[]
  milestones: MindfulnessMilestone[]
}

export interface MindfulnessMilestone {
  minutes: number
  label: string
  achieved: boolean
  description: string
}

export const MEDITATION_TYPES: {
  id: MeditationType
  label: string
  description: string
  tradition: string
  beginner: boolean
  icon: string
}[] = [
  {
    id: 'breath',
    label: 'Breath Focus',
    description: 'Single-pointed attention on breath; return when the mind wanders',
    tradition: 'Theravāda / MBSR',
    beginner: true,
    icon: '🌬️',
  },
  {
    id: 'body_scan',
    label: 'Body Scan',
    description: 'Systematic attention moving through body sensations head-to-toe',
    tradition: 'MBSR Core',
    beginner: true,
    icon: '🧘',
  },
  {
    id: 'loving_kindness',
    label: 'Loving-Kindness',
    description: 'Cultivate compassion and goodwill toward self and all beings',
    tradition: 'Metta / Theravāda',
    beginner: false,
    icon: '💛',
  },
  {
    id: 'open_awareness',
    label: 'Open Awareness',
    description: 'Non-judgmental awareness of all experience without a single focus',
    tradition: 'Zen / Tibetan',
    beginner: false,
    icon: '🌌',
  },
  {
    id: 'mantra',
    label: 'Mantra / TM',
    description: 'Silently repeat a word or phrase to anchor and settle the mind',
    tradition: 'Vedic / TM',
    beginner: true,
    icon: '🔔',
  },
  {
    id: 'walking',
    label: 'Walking Meditation',
    description: 'Mindful awareness of each step — sensation, rhythm, presence',
    tradition: 'Vipassanā',
    beginner: true,
    icon: '🚶',
  },
  {
    id: 'visualization',
    label: 'Visualization',
    description: 'Guided imagery for deep relaxation, healing, or goal rehearsal',
    tradition: 'Tibetan / Modern',
    beginner: true,
    icon: '🌅',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Any other mindfulness or contemplative practice',
    tradition: 'Various',
    beginner: true,
    icon: '✨',
  },
]

export const MBSR_CURRICULUM: {
  week: number
  theme: string
  practice: string
  duration_min: number
}[] = [
  { week: 1, theme: 'Awareness & Autopilot', practice: 'Body Scan 45 min + raisin exercise', duration_min: 45 },
  { week: 2, theme: 'Perception & Responding', practice: 'Body Scan daily + mindful eating', duration_min: 45 },
  { week: 3, theme: 'Mindful Movement', practice: 'Yoga 45 min + sitting meditation 15 min', duration_min: 45 },
  { week: 4, theme: 'Stress Reactivity', practice: 'Sitting meditation 45 min — thoughts & feelings', duration_min: 45 },
  { week: 5, theme: 'Responding vs Reacting', practice: 'Sitting meditation + difficult emotion exploration', duration_min: 45 },
  { week: 6, theme: 'Mindful Communication', practice: 'Mountain / lake meditation 45 min', duration_min: 45 },
  { week: 7, theme: 'Self-Care & Compassion', practice: 'Any practice 45 min — your own choice', duration_min: 45 },
  { week: 8, theme: 'Lifetime Practice', practice: 'Integrate — choose your daily practice going forward', duration_min: 30 },
]

export const MINDFULNESS_MILESTONES: { minutes: number; label: string; description: string }[] = [
  { minutes: 60,   label: 'First Hour',          description: "You've completed your first hour of meditation" },
  { minutes: 300,  label: 'Steady Practice',      description: '5 hours — a habit is forming in your brain' },
  { minutes: 600,  label: 'Regular Meditator',    description: '10 hours — neurological benefits begin (Zeidan 2010)' },
  { minutes: 1200, label: 'Dedicated Practitioner', description: '20 hours — structural gray-matter changes possible (Hölzel 2011)' },
  { minutes: 3000, label: 'Advanced Practitioner', description: '50 hours — sustained transformation of attention networks' },
]

// 10 brief 1-3 min informal practices for non-meditators or busy days
export const DAILY_MINDFULNESS_MOMENTS: {
  id: number
  title: string
  duration_min: number
  instruction: string
}[] = [
  { id: 1,  title: 'Three Breaths',       duration_min: 1, instruction: 'Pause wherever you are. Take three full, slow breaths — feel each one completely.' },
  { id: 2,  title: 'Five Senses Check-in', duration_min: 2, instruction: 'Notice 1 thing you can see, hear, smell, taste, and touch right now.' },
  { id: 3,  title: 'Hands Awareness',     duration_min: 1, instruction: 'Look at your hands for 60 seconds. Notice texture, warmth, tingling, stillness.' },
  { id: 4,  title: 'Body Scan Micro',     duration_min: 2, instruction: 'Quickly scan from head to toes. Where is tension? Soften those places on the exhale.' },
  { id: 5,  title: 'Sound Bathing',       duration_min: 2, instruction: 'Close eyes. For 2 minutes just listen — near sounds, far sounds, silence between them.' },
  { id: 6,  title: 'Mindful Sip',         duration_min: 1, instruction: 'Make a drink. Hold the cup with both hands. Sip slowly, noticing warmth, taste, aroma.' },
  { id: 7,  title: 'Sky Gazing',          duration_min: 2, instruction: 'Look at the sky or ceiling for 2 minutes. Let thoughts pass like clouds.' },
  { id: 8,  title: 'Gratitude Pause',     duration_min: 2, instruction: 'Think of three small things that went well today. Feel gratitude in your body.' },
  { id: 9,  title: 'Breath Counting',     duration_min: 3, instruction: 'Count each exhale from 1 to 10, then start again. If you lose count, begin at 1.' },
  { id: 10, title: 'Walking Awareness',   duration_min: 3, instruction: 'Walk 20 steps very slowly. Feel each foot lift, move, and land. Stay with sensation.' },
]

/** Attention quality score 0–100 for a single session */
export function calculateAttentionScore(session: MeditationSession): number {
  const durationScore  = Math.min(session.duration_min / 20, 2) * 40 / 2  // up to 40 pts (max at 40 min)
  const distractScore  = Math.max(0, 10 - session.distractions) / 10 * 30  // up to 30 pts
  const qualityScore   = (session.quality_rating / 5) * 30                  // up to 30 pts
  return Math.round(Math.min(100, durationScore + distractScore + qualityScore))
}

/** Days of consecutive meditation ending today (or yesterday) */
export function getCurrentStreak(sessions: MeditationSession[]): number {
  if (!sessions.length) return 0
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse()
  const today    = new Date().toISOString().slice(0, 10)
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10) })()
  if (dates[0] !== today && dates[0] !== yesterday) return 0
  let streak = 0
  let expected = dates[0]
  for (const d of dates) {
    if (d === expected) {
      streak++
      const prev = new Date(expected)
      prev.setDate(prev.getDate() - 1)
      expected = prev.toISOString().slice(0, 10)
    } else {
      break
    }
  }
  return streak
}

function getLongestStreak(sessions: MeditationSession[]): number {
  if (!sessions.length) return 0
  const dates = [...new Set(sessions.map(s => s.date))].sort()
  let longest = 1, current = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    prev.setDate(prev.getDate() + 1)
    if (prev.toISOString().slice(0, 10) === dates[i]) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }
  return longest
}

export function analyzeMindfulness(sessions: MeditationSession[]): MindfulnessAnalysis {
  const totalMinutesAllTime = sessions.reduce((s, e) => s + e.duration_min, 0)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weeklyMinutes = sessions
    .filter(s => new Date(s.date) >= weekAgo)
    .reduce((s, e) => s + e.duration_min, 0)

  const currentStreak = getCurrentStreak(sessions)
  const longestStreak = getLongestStreak(sessions)

  // Mood / stress shifts
  const withMood = sessions.filter(s => s.mood_before != null && s.mood_after != null)
  const avgMoodShift = withMood.length
    ? withMood.reduce((s, e) => s + (e.mood_after - e.mood_before), 0) / withMood.length
    : 0

  const withStress = sessions.filter(s => s.stress_before != null && s.stress_after != null)
  const avgStressReduction = withStress.length
    ? withStress.reduce((s, e) => s + (e.stress_before - e.stress_after), 0) / withStress.length
    : 0

  // Attention score = avg of last 10 sessions
  const last10 = sessions.slice(0, 10)
  const attentionScore = last10.length
    ? Math.round(last10.reduce((s, e) => s + calculateAttentionScore(e), 0) / last10.length)
    : 0

  // Favorite type
  const typeCounts: Partial<Record<MeditationType, number>> = {}
  for (const s of sessions) typeCounts[s.type] = (typeCounts[s.type] || 0) + 1
  const favoriteType = (Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as MeditationType) ?? 'breath'

  // MBSR progress: sessions that have mbsr_week set
  const mbsrSessions = sessions.filter(s => s.mbsr_week != null)
  const mbsrProgress = mbsrSessions.length
    ? {
        currentWeek: Math.max(...mbsrSessions.map(s => s.mbsr_week!)),
        completedSessions: mbsrSessions.length,
      }
    : undefined

  // Milestones
  const milestones: MindfulnessMilestone[] = MINDFULNESS_MILESTONES.map(m => ({
    ...m,
    achieved: totalMinutesAllTime >= m.minutes,
  }))

  // Recommendations
  const recommendations: string[] = []
  if (currentStreak === 0) recommendations.push('Start a streak — even 5 minutes today rewires attention circuits.')
  if (weeklyMinutes < 70)   recommendations.push('Aim for 10 min/day (70 min/week) to build a durable habit.')
  if (avgStressReduction < 1 && sessions.length >= 5)
    recommendations.push('Try Body Scan before stressful events — meta-analyses show strongest stress relief.')
  if (!mbsrProgress && totalMinutesAllTime >= 60)
    recommendations.push('Ready for MBSR? 8 weeks of structured practice yields measurable brain changes.')
  if (attentionScore < 50 && sessions.length >= 3)
    recommendations.push('Shorter, more focused sessions (10-15 min) may improve attention quality score.')
  if (attentionScore >= 80) recommendations.push('Excellent focus! Explore Open Awareness meditation to expand your practice.')
  if (recommendations.length === 0) recommendations.push('Keep going — consistency matters more than duration.')

  return {
    totalMinutesAllTime,
    weeklyMinutes,
    currentStreak,
    longestStreak,
    avgMoodShift,
    avgStressReduction,
    attentionScore,
    favoriteType,
    mbsrProgress,
    recommendations,
    milestones,
  }
}

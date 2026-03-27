/**
 * Community Health Challenges
 *
 * Research basis:
 * - Christakis & Fowler 2007 — social network effects on obesity (N Engl J Med)
 * - Consolvo et al. 2006 — UbiComp: social accountability improves step counts by 26%
 * - Kerr et al. 2012 — group-based step challenges vs individual: 39% more active
 * - Muntaner-Mas et al. 2019 — leaderboard gamification and physical activity
 */

export type ChallengeCategory =
  | 'steps' | 'sleep' | 'nutrition' | 'hydration' | 'mindfulness'
  | 'strength' | 'running' | 'cycling' | 'body_battery' | 'streak'

export type ChallengeStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled'
export type ChallengeScope = 'public' | 'friends' | 'private'

export interface ChallengeMetric {
  type: ChallengeCategory
  unit: string                  // 'steps', 'hours', 'litres', 'minutes', etc.
  aggregation: 'sum' | 'avg' | 'max' | 'count_days_above_threshold'
  threshold?: number            // for count_days_above_threshold
  target: number                // what participants aim for over the challenge period
}

export interface Challenge {
  id: string
  title: string
  description: string
  category: ChallengeCategory
  scope: ChallengeScope
  metric: ChallengeMetric
  startDate: string             // ISO date
  endDate: string               // ISO date
  durationDays: number
  maxParticipants?: number
  createdBy: string             // user_id
  status: ChallengeStatus
  badge?: string                // emoji badge awarded on completion
  tags: string[]
}

export interface ChallengeParticipant {
  userId: string
  displayName: string
  avatarUrl?: string
  joinedAt: string
  currentValue: number          // cumulative progress
  percentComplete: number       // 0–100
  rank: number
  streak: number                // consecutive days with logged data
  lastUpdated: string
}

export interface Leaderboard {
  challengeId: string
  updatedAt: string
  participants: ChallengeParticipant[]
  totalParticipants: number
  userRank?: number             // viewer's own rank
  userPercentile?: number       // top X%
}

// ─── Challenge Templates ───────────────────────────────────────────────────────
// Pre-built challenges based on evidence-based health targets

export const CHALLENGE_TEMPLATES: Omit<Challenge, 'id' | 'createdBy' | 'status' | 'startDate' | 'endDate'>[] = [
  {
    title: '10,000 Steps Streak',
    description: 'Hit 10,000 steps every day for 30 days. Research shows this level reduces all-cause mortality risk by 15% (Paluch et al. 2021).',
    category: 'steps',
    scope: 'public',
    durationDays: 30,
    badge: '👟',
    tags: ['walking', 'cardio', 'daily'],
    metric: { type: 'steps', unit: 'steps/day', aggregation: 'count_days_above_threshold', threshold: 10000, target: 30 },
  },
  {
    title: '8-Hour Sleep Sprint',
    description: 'Sleep 7.5h+ for 14 consecutive nights. Matthew Walker\'s research shows 2 weeks of 8h sleep improves reaction time by 40%.',
    category: 'sleep',
    scope: 'public',
    durationDays: 14,
    badge: '😴',
    tags: ['sleep', 'recovery'],
    metric: { type: 'sleep', unit: 'hours/night', aggregation: 'count_days_above_threshold', threshold: 7.5, target: 14 },
  },
  {
    title: 'Hydration Month',
    description: 'Drink 2L+ every day for 30 days. Optimal hydration improves cognitive performance by 14% and reduces fatigue.',
    category: 'hydration',
    scope: 'public',
    durationDays: 30,
    badge: '💧',
    tags: ['hydration', 'nutrition'],
    metric: { type: 'hydration', unit: 'litres/day', aggregation: 'count_days_above_threshold', threshold: 2.0, target: 30 },
  },
  {
    title: '5K Every Day',
    description: 'Run or walk 5km every day for 7 days. The "5K a day" challenge improves aerobic base and builds the habit loop.',
    category: 'running',
    scope: 'public',
    durationDays: 7,
    badge: '🏃',
    tags: ['running', 'cardio'],
    metric: { type: 'running', unit: 'km/day', aggregation: 'count_days_above_threshold', threshold: 5, target: 7 },
  },
  {
    title: 'Mindful Minutes',
    description: '10+ minutes of mindfulness every day for 21 days. Meta-analysis (Khoury et al. 2015) shows significant reduction in anxiety and depression.',
    category: 'mindfulness',
    scope: 'public',
    durationDays: 21,
    badge: '🧘',
    tags: ['mental health', 'mindfulness'],
    metric: { type: 'mindfulness', unit: 'min/day', aggregation: 'count_days_above_threshold', threshold: 10, target: 21 },
  },
  {
    title: 'Body Battery Boost',
    description: 'Maintain a Body Battery score ≥70 for 14 days. This requires optimising sleep, training balance, and recovery simultaneously.',
    category: 'body_battery',
    scope: 'public',
    durationDays: 14,
    badge: '⚡',
    tags: ['readiness', 'recovery', 'advanced'],
    metric: { type: 'body_battery', unit: 'score/day', aggregation: 'count_days_above_threshold', threshold: 70, target: 14 },
  },
  {
    title: 'Monthly Step Record',
    description: 'Who can log the most total steps in a month? Cumulative steps leaderboard.',
    category: 'steps',
    scope: 'public',
    durationDays: 30,
    badge: '🏆',
    tags: ['walking', 'competitive'],
    metric: { type: 'steps', unit: 'total steps', aggregation: 'sum', target: 300000 },
  },
]

// ─── Progress & Scoring ────────────────────────────────────────────────────────

export function computeProgress(
  currentValue: number,
  target: number
): { percent: number; label: string; color: string } {
  const percent = Math.min(100, Math.round((currentValue / target) * 100))
  const color = percent >= 100 ? 'text-emerald-400'
              : percent >= 75 ? 'text-green-400'
              : percent >= 50 ? 'text-yellow-400'
              : percent >= 25 ? 'text-orange-400'
              : 'text-red-400'
  const label = percent >= 100 ? 'Complete! 🎉'
              : percent >= 75 ? `${percent}% — Almost there!`
              : percent >= 50 ? `${percent}% — Halfway!`
              : `${percent}%`
  return { percent, label, color }
}

export function computeStreak(dailyCompletions: boolean[]): number {
  // Count consecutive true values from the end (most recent)
  let streak = 0
  for (let i = dailyCompletions.length - 1; i >= 0; i--) {
    if (dailyCompletions[i]) streak++
    else break
  }
  return streak
}

export function getRankBadge(rank: number, total: number): { label: string; emoji: string } {
  if (rank === 1) return { label: '1st Place', emoji: '🥇' }
  if (rank === 2) return { label: '2nd Place', emoji: '🥈' }
  if (rank === 3) return { label: '3rd Place', emoji: '🥉' }
  const percentile = Math.round((1 - rank / total) * 100)
  if (percentile >= 90) return { label: `Top 10%`, emoji: '🔥' }
  if (percentile >= 75) return { label: `Top 25%`, emoji: '⭐' }
  return { label: `#${rank} of ${total}`, emoji: '👤' }
}

// ─── Social accountability nudges ────────────────────────────────────────────

export function generateNudge(
  participant: ChallengeParticipant,
  challenge: Challenge,
  daysLeft: number
): string {
  const { percentComplete, rank, streak } = participant

  if (streak === 0) return `You haven't logged ${challenge.category} today. Log it to keep your streak alive! ⚡`
  if (percentComplete >= 100) return `Challenge complete! 🎉 You finished ${challenge.title}. Claim your ${challenge.badge ?? '🏅'} badge.`
  if (rank === 1) return `You're leading the challenge! 🥇 Keep it up — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} to go.`
  if (daysLeft <= 3 && percentComplete < 80) return `Only ${daysLeft} days left and you're at ${percentComplete}%. One big push can make the difference!`
  if (streak >= 7) return `${streak}-day streak! 🔥 You're building a powerful habit.`
  return `${percentComplete}% complete — rank #${rank}. ${daysLeft} days left.`
}

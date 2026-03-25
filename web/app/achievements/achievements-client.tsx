'use client'

import type { Achievement, Category, Rarity } from './page'

const RARITY_LABEL: Record<Rarity, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  legendary: 'Legendary',
}

const RARITY_COLOR: Record<Rarity, string> = {
  bronze:    'text-orange-400',
  silver:    'text-slate-300',
  gold:      'text-yellow-400',
  legendary: 'text-purple-400',
}

const RARITY_RING: Record<Rarity, string> = {
  bronze:    'ring-orange-500/40 bg-orange-500/10',
  silver:    'ring-slate-400/40 bg-slate-400/10',
  gold:      'ring-yellow-500/40 bg-yellow-500/10',
  legendary: 'ring-purple-500/40 bg-purple-500/20',
}

const RARITY_PROGRESS: Record<Rarity, string> = {
  bronze:    'bg-orange-500',
  silver:    'bg-slate-400',
  gold:      'bg-yellow-500',
  legendary: 'bg-purple-500',
}

const CATEGORY_LABELS: Record<Category, string> = {
  steps: 'Steps',
  workouts: 'Workouts',
  sleep: 'Sleep',
  hrv: 'HRV',
  activity: 'Activity',
  streaks: 'Streaks',
  data: 'Data & Sync',
}

const CATEGORY_EMOJI: Record<Category, string> = {
  steps: '🚶',
  workouts: '🏋️',
  sleep: '😴',
  hrv: '💗',
  activity: '🔥',
  streaks: '⚡',
  data: '🔗',
}

const ALL_CATEGORIES: Category[] = ['steps', 'workouts', 'sleep', 'hrv', 'activity', 'streaks', 'data']

interface Props {
  achievements: Achievement[]
  earnedCount: number
}

export function AchievementsClient({ achievements, earnedCount }: Props) {
  const totalCount = achievements.length

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Overall Progress</h2>
          <span className="text-sm font-bold text-text-primary">{earnedCount} / {totalCount}</span>
        </div>
        <div className="h-3 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 transition-all"
            style={{ width: `${(earnedCount / totalCount) * 100}%` }}
          />
        </div>
        {/* Rarity breakdown */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {(['bronze', 'silver', 'gold', 'legendary'] as Rarity[]).map((r) => {
            const total = achievements.filter((a) => a.rarity === r).length
            const earned = achievements.filter((a) => a.rarity === r && a.earned).length
            return (
              <div key={r} className="text-center">
                <p className={`text-sm font-bold ${RARITY_COLOR[r]}`}>{earned}/{total}</p>
                <p className="text-xs text-text-secondary capitalize">{r}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Categories */}
      {ALL_CATEGORIES.map((cat) => {
        const catAchievements = achievements.filter((a) => a.category === cat)
        if (catAchievements.length === 0) return null
        const catEarned = catAchievements.filter((a) => a.earned).length

        return (
          <section key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <span>{CATEGORY_EMOJI[cat]}</span>
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                {CATEGORY_LABELS[cat]}
              </h2>
              <span className="text-xs text-text-secondary opacity-50">
                {catEarned}/{catAchievements.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {catAchievements.map((a) => (
                <AchievementCard key={a.id} achievement={a} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  const locked = !a.earned

  return (
    <div
      className={`
        relative bg-surface rounded-xl border border-border p-4 flex items-start gap-3
        transition-all
        ${locked ? 'opacity-45' : ''}
      `}
    >
      {/* Icon */}
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0
        ring-1 ${RARITY_RING[a.rarity]}
        ${locked ? 'grayscale' : ''}
      `}>
        {locked ? '🔒' : a.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${locked ? 'text-text-secondary' : 'text-text-primary'}`}>
            {a.title}
          </p>
          <span className={`text-xs font-medium shrink-0 ${RARITY_COLOR[a.rarity]}`}>
            {RARITY_LABEL[a.rarity]}
          </span>
        </div>
        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{a.description}</p>

        {/* Progress */}
        {!a.earned && a.progress > 0 && (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${RARITY_PROGRESS[a.rarity]}`}
                style={{ width: `${a.progress * 100}%` }}
              />
            </div>
            <p className="text-xs text-text-secondary opacity-60">{a.progressLabel}</p>
          </div>
        )}

        {a.earned && (
          <p className="text-xs text-text-secondary opacity-50 mt-1.5">{a.progressLabel}</p>
        )}
      </div>

      {/* Earned check */}
      {a.earned && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  )
}

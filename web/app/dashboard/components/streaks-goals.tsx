'use client'

interface Streak {
  name: string
  current: number
  best: number
  icon: string
  color: string
}

interface Goal {
  name: string
  current: number
  target: number
  unit: string
  icon: string
}

export function StreaksCard({ streaks }: { streaks: Streak[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Streaks</h3>

      <div className="grid grid-cols-2 gap-4">
        {streaks.map((streak) => (
          <div
            key={streak.name}
            className="relative p-4 rounded-xl overflow-hidden"
            style={{ backgroundColor: `${streak.color}15` }}
          >
            <div className="absolute -right-4 -top-4 text-6xl opacity-20">{streak.icon}</div>
            <div className="relative">
              <div className="text-3xl font-bold" style={{ color: streak.color }}>
                {streak.current}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{streak.name}</div>
              <div className="text-xs text-gray-400 mt-1">Best: {streak.best} days</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GoalsProgress({ goals }: { goals: Goal[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Goals</h3>
        <span className="text-sm text-gray-500">
          {goals.filter(g => g.current >= g.target).length}/{goals.length} completed
        </span>
      </div>

      <div className="space-y-6">
        {goals.map((goal) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100)
          const isComplete = goal.current >= goal.target

          return (
            <div key={goal.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{goal.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{goal.name}</div>
                    <div className="text-xs text-gray-400">
                      {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                    </div>
                  </div>
                </div>
                {isComplete && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Done!</span>
                  </div>
                )}
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isComplete
                      ? 'bg-gradient-to-r from-green-400 to-green-500'
                      : 'bg-gradient-to-r from-purple-400 to-purple-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AchievementBadges({ badges }: { badges: { name: string; icon: string; earned: boolean; description: string }[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h3>

      <div className="grid grid-cols-4 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.name}
            className={`relative p-4 rounded-xl text-center transition-all hover:scale-105 ${
              badge.earned
                ? 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30'
                : 'bg-gray-100 dark:bg-gray-700 opacity-50'
            }`}
            title={badge.description}
          >
            <div className="text-3xl mb-2">{badge.icon}</div>
            <div className={`text-xs font-medium ${badge.earned ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
              {badge.name}
            </div>
            {badge.earned && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function WeeklyChallenge({ challenge }: { challenge: { name: string; description: string; progress: number; reward: string; daysLeft: number } }) {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-orange-200 uppercase tracking-wide">Weekly Challenge</div>
          <h3 className="text-xl font-bold mt-1">{challenge.name}</h3>
          <p className="text-sm text-orange-100 mt-1">{challenge.description}</p>
        </div>
        <div className="text-4xl">🏆</div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-2">
          <span>{challenge.progress}% complete</span>
          <span>{challenge.daysLeft} days left</span>
        </div>
        <div className="h-3 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${challenge.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-orange-200">Reward:</span>
        <span className="font-medium">{challenge.reward}</span>
      </div>
    </div>
  )
}

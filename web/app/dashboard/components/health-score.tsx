'use client'

interface HealthScoreProps {
  score: number
  label: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
}

function HealthScoreComponent({ score, label, trend, trendValue }: HealthScoreProps) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getScoreColor = (score: number) => {
    if (score >= 80) return { stroke: '#22C55E', bg: 'from-green-500/20 to-green-500/5' }
    if (score >= 60) return { stroke: '#EAB308', bg: 'from-yellow-500/20 to-yellow-500/5' }
    if (score >= 40) return { stroke: '#F97316', bg: 'from-orange-500/20 to-orange-500/5' }
    return { stroke: '#EF4444', bg: 'from-red-500/20 to-red-500/5' }
  }

  const colors = getScoreColor(score)

  return (
    <div className={`relative p-6 rounded-2xl bg-gradient-to-br ${colors.bg} border border-white/10`}>
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="56"
              cy="56"
              r="45"
              stroke={colors.stroke}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{score}</span>
            <span className="text-xs text-gray-500">/ 100</span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{label}</h3>
          {trend && trendValue !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {trend === 'up' && (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {trend === 'stable' && (
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              )}
              <span className={`text-sm ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                {trendValue > 0 ? '+' : ''}{trendValue}% from last week
              </span>
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {score >= 80 && 'Excellent! Keep up the great work.'}
            {score >= 60 && score < 80 && 'Good progress. Room for improvement.'}
            {score >= 40 && score < 60 && 'Fair. Try to be more active.'}
            {score < 40 && 'Needs attention. Start with small goals.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function HealthScoreGridComponent({ scores }: { scores: { label: string; score: number; icon: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {scores.map((item) => (
        <div
          key={item.label}
          className="relative p-4 rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden group hover:scale-105 transition-transform"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full" />
          <div className="text-2xl mb-2">{item.icon}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.score}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
          <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
              style={{ width: `${item.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export const HealthScore = React.memo(HealthScoreComponent)
export const HealthScoreGrid = React.memo(HealthScoreGridComponent)

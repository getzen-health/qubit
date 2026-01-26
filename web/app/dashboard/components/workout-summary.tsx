'use client'

interface Workout {
  id: string
  type: string
  date: string
  duration: number
  calories: number
  distance?: number
  avgHeartRate?: number
  icon: string
}

export function RecentWorkouts({ workouts }: { workouts: Workout[] }) {
  if (workouts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Workouts</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🏋️</div>
          <p className="text-gray-500">No workouts recorded yet</p>
          <p className="text-sm text-gray-400 mt-1">Start exercising to see your workouts here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Workouts</h3>
        <a href="/workouts" className="text-sm text-purple-500 hover:text-purple-600">View all</a>
      </div>

      <div className="space-y-3">
        {workouts.map((workout) => (
          <div
            key={workout.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
              {workout.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white">{workout.type}</div>
              <div className="text-sm text-gray-500">{workout.date}</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900 dark:text-white">{workout.duration} min</div>
              <div className="text-sm text-gray-500">{workout.calories} kcal</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WorkoutStats({ stats }: { stats: { thisWeek: number; lastWeek: number; totalMinutes: number; totalCalories: number } }) {
  const change = stats.lastWeek > 0 ? ((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100 : 0

  return (
    <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-green-100">Workouts This Week</h3>
          <div className="text-4xl font-bold mt-2">{stats.thisWeek}</div>
          <div className={`text-sm mt-1 ${change >= 0 ? 'text-green-200' : 'text-red-200'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(0)}% vs last week
          </div>
        </div>
        <div className="p-3 bg-white/20 rounded-xl text-2xl">🏆</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/20">
        <div>
          <div className="text-2xl font-bold">{stats.totalMinutes}</div>
          <div className="text-sm text-green-200">Total minutes</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{stats.totalCalories.toLocaleString()}</div>
          <div className="text-sm text-green-200">Calories burned</div>
        </div>
      </div>
    </div>
  )
}

export function WorkoutDistribution({ data }: { data: { type: string; count: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Workout Types</h3>

      {/* Stacked bar */}
      <div className="h-8 rounded-full overflow-hidden flex">
        {data.map((item, i) => (
          <div
            key={item.type}
            className="h-full transition-all hover:opacity-80"
            style={{
              width: `${(item.count / total) * 100}%`,
              backgroundColor: item.color,
            }}
            title={`${item.type}: ${item.count}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{item.type}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white ml-auto">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

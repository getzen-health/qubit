'use client'

interface DaySummary {
  date: string
  steps: number
  sleep_duration_minutes?: number | null
  active_calories?: number | null
  avg_hrv?: number | null
  recovery_score?: number | null
}

interface WaterLog {
  date: string
  total_ml: number
}

interface StreaksClientProps {
  summaries: DaySummary[]
  workoutDays: string[]
  mindfulnessDays: string[]
  waterLogs: WaterLog[]
  stepGoal: number
  sleepGoalMinutes: number
  calGoal: number
  waterGoalMl: number
}

function computeStreak(dates: string[], isGoalMet: (date: string) => boolean): { current: number; best: number } {
  // dates should be sorted newest-first from query
  // Avoid re-sorting to reduce O(n log n) complexity
  const sorted = dates.length > 0 && dates[0] > dates[dates.length - 1] 
    ? dates 
    : [...dates].sort((a, b) => b.localeCompare(a))
  
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  let current = 0
  let best = 0
  let streak = 0
  let prev: string | null = null
  let countingCurrent = true

  // Limit to last 365 days max to avoid O(n²) on huge datasets
  const maxDays = Math.min(sorted.length, 365)
  for (let i = 0; i < maxDays; i++) {
    const date = sorted[i]
    // Skip dates beyond today
    if (date > today) continue
    
    if (isGoalMet(date)) {
      if (prev === null) {
        streak = 1
      } else {
        const diff = (new Date(prev).getTime() - new Date(date).getTime()) / 86400000
        if (Math.abs(diff - 1) < 0.5) {
          streak++
        } else {
          if (countingCurrent) { current = streak; countingCurrent = false }
          streak = 1
        }
      }
      best = Math.max(best, streak)
      prev = date
    } else {
      if (countingCurrent && prev !== null) { current = streak; countingCurrent = false }
      streak = 0
      prev = null
    }
  }

  // If streak is still running, verify it includes today or yesterday
  if (countingCurrent && sorted.length > 0) {
    const mostRecent = sorted[0]
    if (mostRecent === today || mostRecent === yesterday) {
      current = streak
    } else {
      current = 0
    }
  }

  return { current, best }
}

interface StreakCardProps {
  icon: string
  label: string
  current: number
  best: number
  unit?: string
  color: string
  met: boolean
}

function StreakCard({ icon, label, current, best, unit = 'days', color, met }: StreakCardProps) {
  return (
    <div className={`bg-surface rounded-xl border p-4 ${met ? 'border-green-500/30' : 'border-border'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        {met && <span className="ml-auto text-xs text-green-400 font-medium">✓ Today</span>}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-3xl font-bold ${color}`}>{current}</p>
          <p className="text-xs text-text-secondary">{unit} current</p>
        </div>
        {best > 0 && (
          <div className="text-right">
            <p className="text-lg font-semibold text-text-secondary">{best}</p>
            <p className="text-xs text-text-secondary">best</p>
          </div>
        )}
      </div>
      {/* Mini streak bar — last 14 days */}
    </div>
  )
}

function MiniHeatmap({ dates, goalMet, label }: { dates: string[]; goalMet: (d: string) => boolean; label: string }) {
  const days = []
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    days.push(d)
  }
  return (
    <div>
      <p className="text-xs text-text-secondary mb-1.5">{label} — last 28 days</p>
      <div className="flex gap-1 flex-wrap">
        {days.map((d) => {
          const has = dates.includes(d) && goalMet(d)
          const isToday = d === new Date().toISOString().slice(0, 10)
          return (
            <div
              key={d}
              title={d}
              className={`w-7 h-7 rounded-md ${has ? 'bg-green-500' : 'bg-surface-secondary'} ${isToday ? 'ring-1 ring-white/30' : ''}`}
            />
          )
        })}
      </div>
    </div>
  )
}

export function StreaksClient({
  summaries,
  workoutDays,
  mindfulnessDays,
  waterLogs,
  stepGoal,
  sleepGoalMinutes,
  calGoal,
  waterGoalMl,
}: StreaksClientProps) {
  const summaryByDate = Object.fromEntries(summaries.map((s) => [s.date, s]))
  const waterByDate = Object.fromEntries(waterLogs.map((w) => [w.date, w.total_ml]))
  const today = new Date().toISOString().slice(0, 10)

  const summaryDates = summaries.map((s) => s.date)
  const workoutDaySet = new Set(workoutDays)
  const mindfulnessDaySet = new Set(mindfulnessDays)

  const steps = computeStreak(summaryDates, (d) => (summaryByDate[d]?.steps ?? 0) >= stepGoal)
  const sleep = computeStreak(summaryDates, (d) => (summaryByDate[d]?.sleep_duration_minutes ?? 0) >= sleepGoalMinutes)
  const activity = computeStreak(summaryDates, (d) => (summaryByDate[d]?.active_calories ?? 0) >= calGoal)
  const workout = computeStreak(Array.from(workoutDaySet), (d) => workoutDaySet.has(d))
  const mindful = computeStreak(Array.from(mindfulnessDaySet), (d) => mindfulnessDaySet.has(d))
  const water = computeStreak(waterLogs.map((w) => w.date), (d) => (waterByDate[d] ?? 0) >= waterGoalMl)

  const todaySummary = summaryByDate[today]
  const stepsMetToday = (todaySummary?.steps ?? 0) >= stepGoal
  const sleepMetToday = (todaySummary?.sleep_duration_minutes ?? 0) >= sleepGoalMinutes
  const calMetToday = (todaySummary?.active_calories ?? 0) >= calGoal
  const workoutToday = workoutDaySet.has(today)
  const mindfulToday = mindfulnessDaySet.has(today)
  const waterToday = (waterByDate[today] ?? 0) >= waterGoalMl

  // Longest total streak across all categories
  const longestOverall = Math.max(steps.best, sleep.best, activity.best, workout.best, mindful.best, water.best)

  return (
    <div className="space-y-6">
      {/* Summary hero */}
      <div className="bg-surface rounded-xl border border-border p-5 text-center">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Best Streak Ever</p>
        <p className="text-5xl font-bold text-text-primary">{longestOverall}</p>
        <p className="text-sm text-text-secondary mt-1">days</p>
      </div>

      {/* Streak cards */}
      <div className="grid grid-cols-2 gap-3">
        <StreakCard icon="🚶" label="Steps" current={steps.current} best={steps.best} color="text-green-400" met={stepsMetToday} />
        <StreakCard icon="🌙" label="Sleep" current={sleep.current} best={sleep.best} color="text-blue-400" met={sleepMetToday} />
        <StreakCard icon="🔥" label="Active Cal" current={activity.current} best={activity.best} color="text-orange-400" met={calMetToday} />
        <StreakCard icon="💪" label="Workouts" current={workout.current} best={workout.best} color="text-violet-400" met={workoutToday} />
        {mindful.best > 0 && (
          <StreakCard icon="🧘" label="Mindfulness" current={mindful.current} best={mindful.best} color="text-purple-400" met={mindfulToday} />
        )}
        {water.best > 0 && (
          <StreakCard icon="💧" label="Hydration" current={water.current} best={water.best} color="text-cyan-400" met={waterToday} />
        )}
      </div>

      {/* Heatmaps */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-5">
        <h2 className="text-sm font-medium text-text-secondary">Last 28 Days</h2>
        <MiniHeatmap
          dates={summaryDates}
          goalMet={(d) => (summaryByDate[d]?.steps ?? 0) >= stepGoal}
          label="Steps goal"
        />
        <MiniHeatmap
          dates={summaryDates}
          goalMet={(d) => (summaryByDate[d]?.sleep_duration_minutes ?? 0) >= sleepGoalMinutes}
          label="Sleep goal"
        />
        <MiniHeatmap
          dates={Array.from(workoutDaySet)}
          goalMet={() => true}
          label="Workout days"
        />
        {water.best > 0 && (
          <MiniHeatmap
            dates={waterLogs.map((w) => w.date)}
            goalMet={(d) => (waterByDate[d] ?? 0) >= waterGoalMl}
            label="Hydration goal"
          />
        )}
      </div>

      {/* Today's goals checklist */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Today&apos;s Goals</h2>
        <div className="space-y-2">
          {[
            { label: `Steps ≥ ${stepGoal.toLocaleString()}`, met: stepsMetToday, value: `${(todaySummary?.steps ?? 0).toLocaleString()} / ${stepGoal.toLocaleString()}` },
            { label: `Sleep ≥ ${Math.floor(sleepGoalMinutes / 60)}h`, met: sleepMetToday, value: `${Math.floor((todaySummary?.sleep_duration_minutes ?? 0) / 60)}h ${(todaySummary?.sleep_duration_minutes ?? 0) % 60}m` },
            { label: `Active Cal ≥ ${calGoal}`, met: calMetToday, value: `${Math.round(todaySummary?.active_calories ?? 0)} cal` },
            { label: 'Workout', met: workoutToday, value: workoutToday ? 'Logged' : 'None yet' },
            ...(water.best > 0 ? [{ label: `Hydration ≥ ${waterGoalMl >= 1000 ? (waterGoalMl / 1000).toFixed(1) + 'L' : waterGoalMl + 'ml'}`, met: waterToday, value: (waterByDate[today] ?? 0) >= 1000 ? `${((waterByDate[today] ?? 0) / 1000).toFixed(1)}L` : `${waterByDate[today] ?? 0}ml` }] : []),
          ].map(({ label, met, value }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-lg ${met ? 'text-green-400' : 'text-text-secondary opacity-30'}`}>{met ? '✓' : '○'}</span>
                <span className={`text-sm ${met ? 'text-text-primary' : 'text-text-secondary'}`}>{label}</span>
              </div>
              <span className="text-xs text-text-secondary">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

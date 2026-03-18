'use client'

interface DayRings {
  date: string
  moveCalories: number
  moveGoal: number
  exerciseMinutes: number
  exerciseGoal: number
  standHours: number | null
  standGoal: number
}

interface RingsClientProps {
  days: DayRings[]
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDayOfWeek(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
}

// Ring SVG — similar to Apple Watch style
function Ring({
  pct,
  color,
  size = 36,
  strokeWidth = 5,
}: {
  pct: number
  color: string
  size?: number
  strokeWidth?: number
}) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const filled = Math.min(pct, 1) * circumference
  const cx = size / 2
  const cy = size / 2

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}22`} strokeWidth={strokeWidth} />
      {/* Progress */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

// Stacked rings (Apple Watch style)
function ActivityRingStack({ day }: { day: DayRings }) {
  const movePct = day.moveGoal > 0 ? day.moveCalories / day.moveGoal : 0
  const exPct = day.exerciseMinutes / day.exerciseGoal
  const standPct = day.standHours !== null ? day.standHours / day.standGoal : 0

  const outerSize = 56
  const mid = outerSize * 0.72
  const inner = outerSize * 0.44
  const sw = 6

  return (
    <div className="relative" style={{ width: outerSize, height: outerSize }}>
      <div className="absolute inset-0">
        <Ring pct={movePct} color="#ff3b30" size={outerSize} strokeWidth={sw} />
      </div>
      <div className="absolute" style={{ top: (outerSize - mid) / 2, left: (outerSize - mid) / 2 }}>
        <Ring pct={exPct} color="#30d158" size={mid} strokeWidth={sw} />
      </div>
      {day.standHours !== null && (
        <div className="absolute" style={{ top: (outerSize - inner) / 2, left: (outerSize - inner) / 2 }}>
          <Ring pct={standPct} color="#0a84ff" size={inner} strokeWidth={sw} />
        </div>
      )}
    </div>
  )
}

export function RingsClient({ days }: RingsClientProps) {
  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🫁</span>
        <h2 className="text-lg font-semibold text-text-primary">No activity data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import Apple Watch activity ring data.
        </p>
      </div>
    )
  }

  const recent7 = [...days].reverse().slice(0, 7)
  const today = days[days.length - 1]

  const moveGoalDays = days.filter((d) => d.moveCalories >= d.moveGoal).length
  const exGoalDays = days.filter((d) => d.exerciseMinutes >= d.exerciseGoal).length
  const standGoalDays = days.filter((d) => d.standHours !== null && d.standHours >= d.standGoal).length
  const hasStand = days.some((d) => d.standHours !== null)

  const avgMove = Math.round(days.reduce((s, d) => s + d.moveCalories, 0) / days.length)
  const avgEx = Math.round(days.reduce((s, d) => s + d.exerciseMinutes, 0) / days.length)

  return (
    <div className="space-y-6">
      {/* Today's rings */}
      <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-6">
        <ActivityRingStack day={today} />
        <div className="space-y-2 flex-1">
          <h2 className="text-sm font-semibold text-text-secondary">Today</h2>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff3b30] shrink-0" />
              <span className="text-sm text-text-primary">
                {Math.round(today.moveCalories)} / {today.moveGoal} cal
              </span>
              {today.moveCalories >= today.moveGoal && <span className="text-xs text-[#ff3b30]">✓</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#30d158] shrink-0" />
              <span className="text-sm text-text-primary">
                {today.exerciseMinutes} / {today.exerciseGoal} min
              </span>
              {today.exerciseMinutes >= today.exerciseGoal && <span className="text-xs text-[#30d158]">✓</span>}
            </div>
            {today.standHours !== null && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0a84ff] shrink-0" />
                <span className="text-sm text-text-primary">
                  {today.standHours} / {today.standGoal} hr
                </span>
                {today.standHours >= today.standGoal && <span className="text-xs text-[#0a84ff]">✓</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 30-day streak summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-[#ff3b30]">{moveGoalDays}/{days.length}</p>
          <p className="text-xs text-text-secondary mt-0.5">Move Goal Days</p>
          <p className="text-xs text-text-secondary opacity-60 mt-0.5">avg {avgMove} cal</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-[#30d158]">{exGoalDays}/{days.length}</p>
          <p className="text-xs text-text-secondary mt-0.5">Exercise Goal Days</p>
          <p className="text-xs text-text-secondary opacity-60 mt-0.5">avg {avgEx} min</p>
        </div>
        {hasStand && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-[#0a84ff]">{standGoalDays}/{days.filter((d) => d.standHours !== null).length}</p>
            <p className="text-xs text-text-secondary mt-0.5">Stand Goal Days</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">12 hr goal</p>
          </div>
        )}
      </div>

      {/* 7-day grid */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-4">Last 7 Days</h2>
        <div className="grid grid-cols-7 gap-2">
          {recent7.reverse().map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-2">
              <p className="text-xs text-text-secondary">{fmtDayOfWeek(day.date)}</p>
              <ActivityRingStack day={day} />
              <p className="text-xs text-text-secondary">{fmtDate(day.date).split(' ')[1]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid of all 30 days */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-4">30-Day History</h2>
        <div className="flex flex-wrap gap-2">
          {days.map((day) => {
            const movePct = day.moveGoal > 0 ? Math.min(day.moveCalories / day.moveGoal, 1) : 0
            const exPct = Math.min(day.exerciseMinutes / day.exerciseGoal, 1)
            const allComplete = movePct >= 1 && exPct >= 1 && (day.standHours === null || day.standHours >= day.standGoal)
            return (
              <div key={day.date} className="flex flex-col items-center gap-0.5" title={fmtDate(day.date)}>
                <ActivityRingStack day={day} />
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-text-secondary">
          <span><span className="inline-block w-2 h-2 rounded-full bg-[#ff3b30] mr-1" />Move</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-[#30d158] mr-1" />Exercise</span>
          {hasStand && <span><span className="inline-block w-2 h-2 rounded-full bg-[#0a84ff] mr-1" />Stand</span>}
        </div>
      </div>
    </div>
  )
}

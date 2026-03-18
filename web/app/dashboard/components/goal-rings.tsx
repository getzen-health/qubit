'use client'

interface RingProps {
  value: number
  goal: number
  label: string
  displayValue: string
  unit: string
  color: string
  trackColor: string
  size?: number
}

function Ring({ value, goal, label, displayValue, unit, color, trackColor, size = 90 }: RingProps) {
  const strokeWidth = 9
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0
  const offset = circumference * (1 - progress)
  const center = size / 2

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ gap: 1 }}
        >
          <span className="text-sm font-bold text-text-primary leading-none">{displayValue}</span>
          <span className="text-[10px] text-text-secondary leading-none">{unit}</span>
        </div>
      </div>
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  )
}

interface GoalRingsProps {
  steps: number
  stepGoal: number
  calories: number
  calGoal: number
  sleepMinutes: number
  sleepGoalMinutes: number
}

export function GoalRings({
  steps,
  stepGoal,
  calories,
  calGoal,
  sleepMinutes,
  sleepGoalMinutes,
}: GoalRingsProps) {
  const stepPct = stepGoal > 0 ? Math.round((steps / stepGoal) * 100) : 0
  const calPct = calGoal > 0 ? Math.round((calories / calGoal) * 100) : 0
  const sleepHours = sleepMinutes / 60
  const sleepGoalHours = sleepGoalMinutes / 60

  return (
    <div className="mb-6 bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Today&apos;s Goals
        </p>
        <p className="text-xs text-text-secondary">
          {[
            stepPct >= 100 ? '✓ Steps' : null,
            calPct >= 100 ? '✓ Calories' : null,
            sleepGoalMinutes > 0 && sleepMinutes >= sleepGoalMinutes ? '✓ Sleep' : null,
          ]
            .filter(Boolean)
            .join(' · ') || null}
        </p>
      </div>
      <div className="flex justify-around items-start">
        <Ring
          value={steps}
          goal={stepGoal}
          label="Steps"
          displayValue={steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : steps.toLocaleString()}
          unit={`/ ${stepGoal >= 1000 ? `${(stepGoal / 1000).toFixed(0)}k` : stepGoal}`}
          color="hsl(var(--color-activity))"
          trackColor="hsl(142 76% 36% / 0.15)"
        />
        <Ring
          value={calories}
          goal={calGoal}
          label="Calories"
          displayValue={calories.toLocaleString()}
          unit={`/ ${calGoal} cal`}
          color="hsl(var(--color-strain))"
          trackColor="hsl(24 95% 53% / 0.15)"
        />
        <Ring
          value={sleepHours}
          goal={sleepGoalHours}
          label="Sleep"
          displayValue={`${Math.floor(sleepHours)}h ${Math.round((sleepHours % 1) * 60)}m`}
          unit={`/ ${sleepGoalHours}h goal`}
          color="hsl(var(--color-sleep))"
          trackColor="hsl(221 83% 53% / 0.15)"
        />
      </div>
    </div>
  )
}

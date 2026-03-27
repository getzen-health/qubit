// Health Goals Library — SMART + WOOP framework
// Locke & Latham 2002: specific+challenging goals increase performance in 90% of studies
// Oettingen 2012: WOOP (Wish, Outcome, Obstacle, Plan) — implementation intentions double achievement rate

export type GoalCategory =
  | 'weight_loss'
  | 'muscle_gain'
  | 'cardio_fitness'
  | 'flexibility'
  | 'nutrition'
  | 'sleep'
  | 'mental_health'
  | 'stress_reduction'
  | 'habits'
  | 'hydration'
  | 'custom'

export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned'

export interface HealthGoal {
  id?: string
  user_id?: string
  title: string
  category: GoalCategory
  // SMART
  specific: string
  metric: string
  target_value: number
  current_value: number
  unit: string
  start_date: string
  target_date: string
  // WOOP
  wish: string
  outcome: string
  obstacle: string
  plan: string // if-then statement
  // Status
  status: GoalStatus
  motivation_level: number // 1–10
  created_at?: string
  updated_at?: string
}

export interface GoalCheckin {
  id?: string
  user_id?: string
  goal_id: string
  date: string
  current_value: number
  progress_rating: number // 1–5
  obstacle_encountered?: string
  plan_executed: boolean
  motivation_level: number // 1–10
  notes?: string
  created_at?: string
}

export interface GoalAnalysis {
  progressPct: number
  daysRemaining: number
  onTrack: boolean
  projectedCompletion?: string
  avgMotivation: number
  checkInStreak: number
  recommendations: string[]
}

export const GOAL_CATEGORY_CONFIG: Record<
  GoalCategory,
  { label: string; icon: string; color: string; gradient: string; examples: string[] }
> = {
  weight_loss: {
    label: 'Weight Loss',
    icon: '⚖️',
    color: '#ec4899',
    gradient: 'from-pink-500/20 to-rose-500/10',
    examples: ['Lose 5 kg by summer', 'Reach 75 kg body weight', 'Drop 2 clothing sizes'],
  },
  muscle_gain: {
    label: 'Muscle Gain',
    icon: '💪',
    color: '#f97316',
    gradient: 'from-orange-500/20 to-amber-500/10',
    examples: ['Gain 3 kg of lean mass', 'Bench press my body weight', 'Increase squat by 20 kg'],
  },
  cardio_fitness: {
    label: 'Cardio Fitness',
    icon: '🏃',
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-green-500/10',
    examples: ['Run a 5K in under 25 min', 'Complete a half marathon', 'Cycle 100 km'],
  },
  flexibility: {
    label: 'Flexibility',
    icon: '🧘',
    color: '#8b5cf6',
    gradient: 'from-violet-500/20 to-purple-500/10',
    examples: ['Touch toes in 30 days', 'Hold splits for 10 sec', 'Full back-bend'],
  },
  nutrition: {
    label: 'Nutrition',
    icon: '🥗',
    color: '#84cc16',
    gradient: 'from-lime-500/20 to-green-500/10',
    examples: ['Eat 150g protein daily', 'Meal prep 5 days/week', 'Cut sugar for 30 days'],
  },
  sleep: {
    label: 'Sleep',
    icon: '😴',
    color: '#6366f1',
    gradient: 'from-indigo-500/20 to-blue-500/10',
    examples: ['Sleep 8h every night', 'Consistent bedtime by 10pm', 'Improve sleep score to 85'],
  },
  mental_health: {
    label: 'Mental Health',
    icon: '🧠',
    color: '#a855f7',
    gradient: 'from-purple-500/20 to-fuchsia-500/10',
    examples: ['Meditate 10 min daily', 'Journal 3× per week', 'Reduce anxiety with CBT'],
  },
  stress_reduction: {
    label: 'Stress Reduction',
    icon: '🌿',
    color: '#14b8a6',
    gradient: 'from-teal-500/20 to-cyan-500/10',
    examples: ['Daily breathing exercises', 'HRV baseline above 50ms', 'Work-life boundary routine'],
  },
  habits: {
    label: 'Habits',
    icon: '✅',
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-yellow-500/10',
    examples: ['Cold shower streak 21 days', 'No phone first hour awake', 'Walk after every meal'],
  },
  hydration: {
    label: 'Hydration',
    icon: '💧',
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-sky-500/10',
    examples: ['Drink 2.5 L daily', 'Electrolytes post-workout', 'No soda for 60 days'],
  },
  custom: {
    label: 'Custom',
    icon: '🎯',
    color: '#64748b',
    gradient: 'from-slate-500/20 to-gray-500/10',
    examples: ['Any personal health goal', 'Rehabilitation milestone', 'Performance benchmark'],
  },
}

export function getProgressPct(goal: HealthGoal): number {
  if (goal.target_value === 0) return 0
  const pct = (goal.current_value / goal.target_value) * 100
  return Math.min(100, Math.max(0, pct))
}

export function isOnTrack(goal: HealthGoal): boolean {
  const today = new Date()
  const start = new Date(goal.start_date)
  const end = new Date(goal.target_date)
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / 86400000)
  const elapsedDays = Math.max(0, (today.getTime() - start.getTime()) / 86400000)
  const expectedPct = (elapsedDays / totalDays) * 100
  return getProgressPct(goal) >= expectedPct * 0.85 // 15% tolerance
}

export function analyzeGoal(goal: HealthGoal, checkins: GoalCheckin[]): GoalAnalysis {
  const today = new Date()
  const end = new Date(goal.target_date)
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000))
  const progressPct = getProgressPct(goal)
  const onTrack = isOnTrack(goal)

  // Average motivation from checkins + goal baseline
  const motivationValues = [goal.motivation_level, ...checkins.map((c) => c.motivation_level)]
  const avgMotivation =
    motivationValues.length > 0
      ? motivationValues.reduce((a, b) => a + b, 0) / motivationValues.length
      : goal.motivation_level

  // Check-in streak: consecutive days with checkins ending today
  const checkinDates = new Set(checkins.map((c) => c.date))
  let checkInStreak = 0
  const d = new Date(today)
  while (true) {
    const dateStr = d.toISOString().slice(0, 10)
    if (checkinDates.has(dateStr)) {
      checkInStreak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }

  // Projected completion date based on current velocity
  let projectedCompletion: string | undefined
  if (checkins.length >= 2 && goal.target_value > 0) {
    const sorted = [...checkins].sort((a, b) => a.date.localeCompare(b.date))
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const daysDiff = Math.max(
      1,
      (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000
    )
    const valueDiff = last.current_value - first.current_value
    if (valueDiff > 0) {
      const dailyRate = valueDiff / daysDiff
      const remaining = goal.target_value - last.current_value
      const daysNeeded = remaining / dailyRate
      const projected = new Date()
      projected.setDate(projected.getDate() + daysNeeded)
      projectedCompletion = projected.toISOString().slice(0, 10)
    }
  }

  const recommendations: string[] = []
  if (!onTrack) {
    recommendations.push('You are slightly behind pace — consider smaller daily actions.')
  }
  if (avgMotivation < 5) {
    recommendations.push('Motivation is low. Revisit your WOOP obstacle and if-then plan.')
  }
  if (checkInStreak === 0) {
    recommendations.push("No recent check-ins detected. Log today's progress to stay accountable.")
  }
  if (daysRemaining < 7 && progressPct < 80) {
    recommendations.push('Deadline approaching! Focus on your highest-leverage actions this week.')
  }
  if (progressPct >= 100) {
    recommendations.push('🎉 Goal achieved! Consider setting a new stretch target.')
  }

  return {
    progressPct,
    daysRemaining,
    onTrack,
    projectedCompletion,
    avgMotivation,
    checkInStreak,
    recommendations,
  }
}

export const MOTIVATIONAL_QUOTES = [
  { quote: 'A goal without a plan is just a wish.', author: 'Antoine de Saint-Exupéry' },
  { quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { quote: 'Setting goals is the first step in turning the invisible into the visible.', author: 'Tony Robbins' },
  { quote: 'People with goals succeed because they know where they are going.', author: 'Earl Nightingale' },
  { quote: 'What you get by achieving your goals is not as important as what you become.', author: 'Zig Ziglar' },
  { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { quote: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { quote: 'Hard choices, easy life. Easy choices, hard life.', author: 'Jerzy Gregorek' },
  { quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { quote: 'Motivation is what gets you started. Habit is what keeps you going.', author: 'Jim Ryun' },
  { quote: 'Mental contrasting: imagine the wish, the best outcome, then the obstacle.', author: 'Gabriele Oettingen' },
  { quote: 'Specific, challenging goals lead to higher performance than vague "do your best" goals.', author: 'Locke & Latham, 2002' },
]

export function getDailyQuote(): { quote: string; author: string } {
  const dayIndex = Math.floor(Date.now() / 86400000) % MOTIVATIONAL_QUOTES.length
  return MOTIVATIONAL_QUOTES[dayIndex]
}

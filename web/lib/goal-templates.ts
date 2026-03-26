export interface GoalTemplate {
  id: string
  title: string
  description: string
  metric_type?: string
  target_value?: number
  unit: string
  goal_type: 'target' | 'daily' | 'weekly' | 'streak'
  emoji: string
  color: string
  why_placeholder: string
  category: 'fitness' | 'nutrition' | 'sleep' | 'mindset' | 'body'
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  { id: 'steps-10k', title: 'Walk 10,000 Steps Daily', description: 'Hit 10K steps every day for optimal cardiovascular health', metric_type: 'steps', target_value: 10000, unit: 'steps', goal_type: 'daily', emoji: '👟', color: '#10b981', why_placeholder: 'When I finish lunch, I will take a 15-min walk', category: 'fitness' },
  { id: 'sleep-8h', title: 'Sleep 8 Hours Nightly', description: 'Consistent 8h sleep for recovery and cognition', metric_type: 'sleep_duration_minutes', target_value: 480, unit: 'min', goal_type: 'daily', emoji: '😴', color: '#6366f1', why_placeholder: 'When it is 10pm, I will put down my phone and start my sleep routine', category: 'sleep' },
  { id: 'water-2.5l', title: 'Drink 2.5L Water Daily', description: 'Stay hydrated for energy and metabolism', metric_type: 'water_ml', target_value: 2500, unit: 'ml', goal_type: 'daily', emoji: '💧', color: '#3b82f6', why_placeholder: 'When I wake up, I will drink 500ml before coffee', category: 'nutrition' },
  { id: 'exercise-4x', title: 'Exercise 4x Per Week', description: 'Build consistent movement habits', goal_type: 'weekly', target_value: 4, unit: 'sessions', emoji: '🏋️', color: '#f59e0b', why_placeholder: 'When my alarm goes off Mon/Wed/Fri/Sat, I will go to the gym', category: 'fitness' },
  { id: 'weight-loss-5kg', title: 'Lose 5kg', description: 'Gradual sustainable weight loss', metric_type: 'weight', unit: 'kg', goal_type: 'target', emoji: '⚖️', color: '#ec4899', why_placeholder: 'When I feel hungry, I will drink water and wait 10 minutes', category: 'body' },
  { id: 'meditate-10min', title: 'Meditate 10 Min Daily', description: 'Daily mindfulness for stress reduction', goal_type: 'streak', target_value: 10, unit: 'min', emoji: '🧘', color: '#8b5cf6', why_placeholder: 'When I sit down with my morning coffee, I will meditate for 10 minutes', category: 'mindset' },
  { id: 'no-alcohol-30d', title: '30-Day Alcohol Break', description: 'Rest your liver and reset your baseline', goal_type: 'streak', target_value: 30, unit: 'days', emoji: '🚫🍷', color: '#14b8a6', why_placeholder: 'When I feel like drinking, I will make sparkling water with lemon instead', category: 'nutrition' },
  { id: 'protein-150g', title: 'Hit Protein Target Daily', description: '1.6g/kg/day for muscle maintenance and satiety', goal_type: 'daily', unit: 'g', emoji: '🥩', color: '#f97316', why_placeholder: 'When I meal prep on Sunday, I will portion out high-protein foods', category: 'nutrition' },
  { id: 'cold-shower-21d', title: '21-Day Cold Shower Streak', description: 'Build cold tolerance and mental resilience', goal_type: 'streak', target_value: 21, unit: 'days', emoji: '🧊', color: '#0ea5e9', why_placeholder: 'When I finish my morning shower, I will switch to cold for 60 seconds', category: 'mindset' },
]

export function getMilestones(goal: { target_value?: number | null; goal_type: string }) {
  const target = goal.target_value ?? 100
  return [
    { pct: 25, label: '25%', emoji: '🌱' },
    { pct: 50, label: 'Halfway!', emoji: '⚡' },
    { pct: 75, label: '75%', emoji: '🔥' },
    { pct: 100, label: 'Completed!', emoji: '🏆' },
  ].map(m => ({ ...m, value: Math.round(target * m.pct / 100) }))
}

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const TRAINING_PLANS = [
  {
    id: '5k-beginner',
    name: 'Couch to 5K',
    weeks: 8,
    daysPerWeek: 3,
    description: 'Build from walking to running 5K without stopping',
    level: 'Beginner',
    category: 'Running'
  },
  {
    id: '10k-intermediate',
    name: '10K Intermediate',
    weeks: 10,
    daysPerWeek: 4,
    description: 'Build your 10K race fitness with structured speed work',
    level: 'Intermediate',
    category: 'Running'
  },
  {
    id: 'strength-beginner',
    name: 'Strength Foundation',
    weeks: 6,
    daysPerWeek: 3,
    description: 'Build a solid strength base with compound movements',
    level: 'Beginner',
    category: 'Strength'
  },
  {
    id: 'hiit-advanced',
    name: 'HIIT Performance',
    weeks: 4,
    daysPerWeek: 4,
    description: 'High-intensity intervals for maximum calorie burn and fitness',
    level: 'Advanced',
    category: 'HIIT'
  }
]

export default async function TrainingPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main role="main" aria-label="Training Plans" id="main-content">
      <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">Training Plans</h1>
      <p className="text-muted-foreground mb-8">Structured workout programs to help you reach your goals.</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {TRAINING_PLANS.map(plan => (
          <div key={plan.id} className="rounded-xl border border-border p-5 space-y-3 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-lg">{plan.name}</p>
                <p className="text-sm text-muted-foreground">{plan.category} · {plan.level}</p>
              </div>
              <span className="text-xs bg-muted px-2 py-1 rounded-full">{plan.weeks}w</span>
            </div>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>⏱ {plan.weeks} weeks</span>
              <span>📅 {plan.daysPerWeek} days/week</span>
            </div>
            <button className="w-full text-sm bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
              Start Plan
            </button>
          </div>
        ))}
      </div>
    </div>
    </main>
  )
}

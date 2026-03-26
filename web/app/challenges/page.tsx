import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const SAMPLE_CHALLENGES = [
  { title: '10K Steps Daily', description: 'Walk 10,000 steps every day for a week', metric: 'steps', target: 70000, participants: 142, daysLeft: 5 },
  { title: 'Sleep 7+ Hours', description: 'Get at least 7 hours of sleep for 7 consecutive nights', metric: 'sleep', target: 49, participants: 89, daysLeft: 3 },
  { title: 'Workout Streak', description: 'Complete 5 workouts this week', metric: 'workouts', target: 5, participants: 67, daysLeft: 7 },
]

export default async function ChallengesPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main role="main" aria-label="Community Challenges" id="main-content">
      <div className="container mx-auto py-8">
      <Breadcrumbs items={[{label:'Dashboard',href:'/dashboard'},{label:'Challenges'}]} />
      <h1 className="text-2xl font-bold mb-2">Community Challenges</h1>
      <p className="text-muted-foreground mb-8">Compete with the community and stay motivated.</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_CHALLENGES.map((c, i) => (
          <div key={i} className="rounded-xl border border-border p-5 space-y-3">
            <div>
              <p className="font-semibold">{c.title}</p>
              <p className="text-sm text-muted-foreground">{c.description}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>👥 {c.participants} joined</span>
              <span>⏱ {c.daysLeft}d left</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full">
              <div className="h-full bg-primary rounded-full" style={{ width: '35%' }} />
            </div>
            <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Join Challenge
            </button>
          </div>
        ))}
      </div>
    </div>
    </main>
  )
}

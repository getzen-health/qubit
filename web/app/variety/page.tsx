import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const VarietyClient = dynamic(() => import('./variety-client').then(m => ({ default: m.VarietyClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Workout Variety' }

export default async function VarietyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const { data: workouts } = await supabase
    .from('workout_records')
    .select('workout_type, start_time, duration_minutes, active_calories')
    .eq('user_id', user.id)
    .gte('start_time', startIso)
    .gt('duration_minutes', 0)
    .order('start_time', { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Workout Variety</h1>
            <p className="text-sm text-text-secondary">Last 90 days · {workouts?.length ?? 0} sessions</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <VarietyClient workouts={workouts ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}

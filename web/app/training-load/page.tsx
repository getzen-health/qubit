import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TrainingLoadClient } from './training-load-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Training Load' }

export default async function TrainingLoadPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Query 180 days of workouts for training load curves
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 180)

  const { data: workouts } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, active_calories, workout_type, avg_heart_rate')
    .eq('user_id', user.id)
    .gte('start_time', startDate.toISOString())
    .gt('duration_minutes', 5)
    .order('start_time', { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Training Load</h1>
            <p className="text-sm text-text-secondary">Fitness · Fatigue · Form</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <TrainingLoadClient workouts={workouts ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}

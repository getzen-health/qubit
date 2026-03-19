import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Building2, BarChart2 } from 'lucide-react'
import { StepsClient } from './steps-client'
import { BottomNav } from '@/components/bottom-nav'

export default async function StepsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [{ data: summaries }, { data: profile }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, distance_meters, active_minutes')
      .eq('user_id', user.id)
      .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
      .order('date', { ascending: true }),
    supabase
      .from('users')
      .select('step_goal')
      .eq('id', user.id)
      .single(),
  ])

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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Activity</h1>
            <p className="text-sm text-text-secondary">Last 90 days</p>
          </div>
          <Link
            href="/steps/patterns"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Step patterns"
            title="Step Patterns"
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
          <Link
            href="/floors"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Floors climbed"
            title="Floors Climbed"
          >
            <Building2 className="w-5 h-5" />
          </Link>
          <Link
            href="/year"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            Year
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <StepsClient summaries={summaries ?? []} dbStepGoal={profile?.step_goal ?? null} />
      </main>
      <BottomNav />
    </div>
  )
}

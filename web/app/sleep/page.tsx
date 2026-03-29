import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Thermometer, Clock, TrendingDown, TrendingUp, Layers, Percent, Moon, Zap, Star, BarChart2 } from 'lucide-react'
import dynamic from 'next/dynamic'
const SleepPageClient = dynamic(() => import('./sleep-client').then(m => ({ default: m.SleepPageClient })))
import { SleepInsightCard } from '@/components/sleep-insight-card'
import { BottomNav } from '@/components/bottom-nav'
import { SleepForm } from './sleep-form'

export default async function SleepPage() {
  // Add link to sleep hygiene

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [{ data: records }, { data: profile }, { data: breathingRecords }] = await Promise.all([
    supabase
      .from('sleep_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', thirtyDaysAgo.toISOString())
      .order('start_time', { ascending: false }),
    supabase
      .from('users')
      .select('sleep_goal_minutes')
      .eq('id', user.id)
      .single(),
    supabase
      .from('health_records')
      .select('start_time, value')
      .eq('user_id', user.id)
      .eq('type', 'sleep_breathing_disturbances')
      .gte('start_time', thirtyDaysAgo.toISOString())
      .order('start_time', { ascending: false }),
  ])

  const sleepGoalHours = profile?.sleep_goal_minutes ? profile.sleep_goal_minutes / 60 : 8

  // Index breathing by night (start date)
  const breathingByDate = new Map<string, number>()
  for (const r of breathingRecords ?? []) {
    const day = r.start_time.slice(0, 10)
    // value 1 = elevated; keep elevated if any reading that night is elevated
    if (!breathingByDate.has(day) || r.value === 1) {
      breathingByDate.set(day, r.value)
    }
  }
  const elevatedNights = Array.from(breathingByDate.values()).filter((v) => v === 1).length

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
          <Link
            href="/sleep/hygiene"
            className="ml-2 px-3 py-1 rounded-xl bg-surface-secondary text-text-secondary text-xs font-semibold hover:bg-primary/10 border border-border transition-colors"
            aria-label="Sleep Hygiene"
            title="Sleep Hygiene"
          >
            😴 Sleep Hygiene
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Sleep</h1>
            <p className="text-sm text-text-secondary">Last 30 nights</p>
          </div>
          <Link
            href="/sleep/patterns"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Sleep patterns"
            title="Sleep Patterns"
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
          <Link
            href="/sleep/trends"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Sleep trends"
            title="Sleep Trends"
          >
            <TrendingUp className="w-5 h-5" />
          </Link>
          <Link
            href="/sleep/efficiency"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Sleep efficiency"
            title="Sleep Efficiency"
          >
            <Percent className="w-5 h-5" />
          </Link>
          <Link
            href="/sleep/stages"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Sleep stages"
            title="Sleep Stages"
          >
            <Layers className="w-5 h-5" />
          </Link>
          <Link
            href="/sleep/debt"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Sleep debt"
            title="Sleep Debt"
          >
            <TrendingDown className="w-5 h-5" />
          </Link>
          <Link
            href="/sleep/schedule"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Sleep schedule"
            title="Sleep Schedule"
          >
            <Clock className="w-5 h-5" />
          </Link>
          <Link
            href="/sleep/chronotype"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Sleep chronotype"
            title="Chronotype"
          >
            <Moon className="w-5 h-5" />
          </Link>
          <Link
            href="/temperature"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Wrist temperature"
            title="Wrist Temperature"
          >
            <Thermometer className="w-5 h-5" />
          </Link>
          <Link
            href="/sleep/impact"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Sleep impact"
            title="Sleep Impact"
          >
            <Zap className="w-5 h-5" />
          </Link>
          <Link
            href="/sleep/score"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Sleep quality score"
            title="Sleep Quality Score"
          >
            <Star className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
  <div className="max-w-2xl mx-auto mb-8">
    <SleepForm />
    {/* AI-powered sleep insight card */}
    <SleepInsightCard />
  </div>
        <SleepPageClient
          records={records ?? []}
          sleepGoalHours={sleepGoalHours}
          elevatedBreathingNights={elevatedNights}
          breathingByDate={Object.fromEntries(breathingByDate)}
        />
      </main>
      <BottomNav />
    </div>
  )
}

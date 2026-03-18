import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SyncStatusClient } from './sync-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Sync Status' }

export default async function SyncStatusPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [
    { data: devices },
    { data: summaries },
    { data: workouts },
    { data: sleepRecords },
    { data: healthRecordCounts },
  ] = await Promise.all([
    supabase
      .from('user_devices')
      .select('device_name, device_type, last_sync_at, created_at')
      .eq('user_id', user.id)
      .order('last_sync_at', { ascending: false }),
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, sleep_duration_minutes, resting_heart_rate, avg_hrv')
      .eq('user_id', user.id)
      .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
      .order('date', { ascending: true }),
    supabase
      .from('workout_records')
      .select('start_time, workout_type')
      .eq('user_id', user.id)
      .gte('start_time', ninetyDaysAgo.toISOString())
      .order('start_time', { ascending: false }),
    supabase
      .from('sleep_records')
      .select('start_time')
      .eq('user_id', user.id)
      .gte('start_time', ninetyDaysAgo.toISOString())
      .order('start_time', { ascending: false })
      .limit(1),
    supabase
      .from('health_records')
      .select('type, start_time')
      .eq('user_id', user.id)
      .gte('start_time', ninetyDaysAgo.toISOString())
      .order('start_time', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to settings"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Sync Status</h1>
            <p className="text-sm text-text-secondary">Data coverage & health metrics</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <SyncStatusClient
          devices={devices ?? []}
          summaries={summaries ?? []}
          workouts={workouts ?? []}
          latestSleep={sleepRecords?.[0] ?? null}
          healthRecords={healthRecordCounts ?? []}
        />
      </main>
      <BottomNav />
    </div>
  )
}

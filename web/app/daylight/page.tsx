import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DaylightClient } from './daylight-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Time in Daylight' }

export default async function DaylightPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: records } = await supabase
    .from('health_records')
    .select('start_time, value')
    .eq('user_id', user.id)
    .eq('type', 'time_in_daylight')
    .gte('start_time', thirtyDaysAgo.toISOString())
    .order('start_time', { ascending: true })

  // Aggregate to one reading per day (sum — multiple readings can occur per day)
  const byDay = new Map<string, number>()
  for (const r of records ?? []) {
    const day = r.start_time.slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + r.value)
  }
  const readings = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value: Math.round(value) }))

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
            <h1 className="text-xl font-bold text-text-primary">Time in Daylight</h1>
            <p className="text-sm text-text-secondary">Last 30 days</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <DaylightClient readings={readings} />
      </main>
      <BottomNav />
    </div>
  )
}

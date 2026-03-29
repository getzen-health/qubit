import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const RespiratoryClient = dynamic(() => import('./respiratory-client').then(m => ({ default: m.RespiratoryClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Respiratory Rate' }

export default async function RespiratoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [{ data: records }, { data: sleep }] = await Promise.all([
    supabase
      .from('health_records')
      .select('value, start_time')
      .eq('user_id', user.id)
      .eq('type', 'respiratory_rate')
      .gte('start_time', ninetyDaysAgo.toISOString())
      .gt('value', 4)
      .lt('value', 40)
      .order('start_time', { ascending: true }),
    supabase
      .from('daily_summaries')
      .select('date, sleep_duration_minutes, avg_hrv, resting_heart_rate')
      .eq('user_id', user.id)
      .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
      .order('date', { ascending: true }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/vitals"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to vitals"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Respiratory Rate</h1>
            <p className="text-sm text-text-secondary">Breaths per minute · Last 90 days</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RespiratoryClient records={records ?? []} summaries={sleep ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}

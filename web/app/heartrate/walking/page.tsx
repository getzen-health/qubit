import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { WalkingHeartRateClient } from './walking-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Walking Heart Rate' }

export default async function WalkingHeartRatePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, avg_heart_rate, steps')
    .eq('user_id', user.id)
    .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
    .gt('steps', 3000)
    .gt('avg_heart_rate', 0)
    .order('date', { ascending: true })

  const rows = (summaries ?? []).filter(
    (s) => s.avg_heart_rate && s.avg_heart_rate > 0 && s.steps && s.steps > 3000
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/heartrate"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to heart rate"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Walking Heart Rate</h1>
            <p className="text-sm text-text-secondary">
              {rows.length > 0 ? `${rows.length} active days · last 90 days` : 'Last 90 days'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <WalkingHeartRateClient rows={rows} />
      </main>
      <BottomNav />
    </div>
  )
}

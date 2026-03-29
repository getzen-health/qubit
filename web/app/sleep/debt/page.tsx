import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const DebtClient = dynamic(() => import('./debt-client').then(m => ({ default: m.DebtClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Sleep Debt' }

export default async function SleepDebtPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [{ data: records }, { data: profile }] = await Promise.all([
    supabase
      .from('sleep_records')
      .select('start_time, end_time, duration_minutes')
      .eq('user_id', user.id)
      .gte('start_time', ninetyDaysAgo.toISOString())
      .gt('duration_minutes', 60)
      .order('start_time', { ascending: true }),
    supabase
      .from('users')
      .select('sleep_goal_minutes')
      .eq('id', user.id)
      .single(),
  ])

  const goalMinutes = profile?.sleep_goal_minutes ?? 480

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/sleep"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to sleep"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Sleep Debt</h1>
            <p className="text-sm text-text-secondary">Last 90 days · goal {Math.round(goalMinutes / 60 * 10) / 10}h/night</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <DebtClient records={records ?? []} goalMinutes={goalMinutes} />
      </main>
      <BottomNav />
    </div>
  )
}

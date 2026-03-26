import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { WomensHealthClient } from './womens-health-client'

export const metadata = { title: "Women's Health | KQuarks" }

export default async function WomensHealthPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [logsResult, settingsResult] = await Promise.all([
    supabase
      .from('cycle_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', sixMonthsAgo.toISOString().slice(0, 10))
      .order('date', { ascending: false }),
    supabase
      .from('cycle_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const logs = logsResult.data ?? []
  const settings = settingsResult.data ?? {
    user_id: user.id,
    avg_cycle_length: 28,
    avg_period_length: 5,
    last_period_start: null,
    tracking_goal: 'health' as const,
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Women&apos;s Health</h1>
            <p className="text-sm text-text-secondary">Cycle tracking, fertility & hormonal health</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-28">
        <WomensHealthClient initialLogs={logs} initialSettings={settings} />
      </main>
      <BottomNav />
    </div>
  )
}

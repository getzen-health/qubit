import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const StagesClient = dynamic(() => import('./stages-client').then(m => ({ default: m.StagesClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Sleep Stages' }

export default async function SleepStagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const { data: records } = await supabase
    .from('sleep_records')
    .select('start_time, end_time, duration_minutes, rem_minutes, deep_minutes, core_minutes, awake_minutes')
    .eq('user_id', user.id)
    .gte('start_time', sixtyDaysAgo.toISOString())
    .gt('duration_minutes', 90)   // filter out naps
    .not('rem_minutes', 'is', null)
    .order('start_time', { ascending: true })

  // Filter nights with stage data
  const nights = (records ?? []).filter(
    (r) => (r.rem_minutes ?? 0) + (r.deep_minutes ?? 0) + (r.core_minutes ?? 0) > 0
  )

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
            <h1 className="text-xl font-bold text-text-primary">Sleep Stages</h1>
            <p className="text-sm text-text-secondary">
              {nights.length > 0 ? `${nights.length} nights analyzed` : 'Stage breakdown · 60 days'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <StagesClient nights={nights} />
      </main>
      <BottomNav />
    </div>
  )
}

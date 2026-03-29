import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const LongevityClient = dynamic(() => import('./longevity-client').then(m => ({ default: m.LongevityClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata: Metadata = {
  title: 'Longevity Protocol',
  description: 'Hallmarks of Aging tracker, Blueprint compliance, and epigenetic age estimation.',
}

export default async function LongevityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const since = ninetyDaysAgo.toISOString().slice(0, 10)

  const [{ data: checkins }, { data: vo2Records }] = await Promise.all([
    supabase
      .from('longevity_checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: false }),
    supabase
      .from('health_records')
      .select('start_time, value')
      .eq('user_id', user.id)
      .eq('type', 'vo2_max')
      .gte('start_time', ninetyDaysAgo.toISOString())
      .order('start_time', { ascending: false })
      .limit(1),
  ])

  const latestVO2 = vo2Records && vo2Records.length > 0 ? vo2Records[0].value : null

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
            <h1 className="text-xl font-bold text-text-primary">Longevity Protocol</h1>
            <p className="text-sm text-text-secondary">Hallmarks of Aging · Blueprint Tracker</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <LongevityClient checkins={checkins ?? []} latestVO2={latestVO2} />
      </main>
      <BottomNav />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VO2MaxClient } from './vo2max-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'VO₂ Max' }

export default async function VO2MaxPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: records } = await supabase
    .from('health_records')
    .select('start_time, value')
    .eq('user_id', user.id)
    .eq('type', 'vo2_max')
    .gte('start_time', ninetyDaysAgo.toISOString())
    .order('start_time', { ascending: true })

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
            <h1 className="text-xl font-bold text-text-primary">VO₂ Max</h1>
            <p className="text-sm text-text-secondary">Cardiorespiratory fitness</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <VO2MaxClient records={(records ?? []).map((r) => ({ time: r.start_time, value: r.value }))} />
      </main>
      <BottomNav />
    </div>
  )
}

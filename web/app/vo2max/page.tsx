import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2 } from 'lucide-react'
import { VO2MaxClient } from './vo2max-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'VO₂ Max Trends' }

export default async function VO2MaxPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: records } = await supabase
    .from('health_records')
    .select('start_time, value')
    .eq('user_id', user.id)
    .eq('type', 'vo2_max')
    .gt('value', 10)
    .lte('value', 80)
    .gte('start_time', oneYearAgo.toISOString())
    .order('start_time', { ascending: true })

  const readings = (records ?? []).map((r) => ({
    time: r.start_time as string,
    value: r.value as number,
  }))

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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">VO₂ Max Trends</h1>
            <p className="text-sm text-text-secondary">Cardiorespiratory fitness</p>
          </div>
          <Link
            href="/vo2max/patterns"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="VO₂ Max patterns"
            title="VO₂ Max Patterns"
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <VO2MaxClient readings={readings} />
      </main>
      <BottomNav />
    </div>
  )
}

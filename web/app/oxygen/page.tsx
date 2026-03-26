import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { OxygenClient } from './oxygen-client'
import { BottomNav } from '@/components/bottom-nav'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export const metadata = { title: 'Blood Oxygen' }

export default async function OxygenPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: records } = await supabase
    .from('health_records')
    .select('value, start_time')
    .eq('user_id', user.id)
    .eq('type', 'oxygen_saturation')
    .gte('start_time', ninetyDaysAgo.toISOString())
    .gt('value', 50)
    .lt('value', 101)
    .order('start_time', { ascending: true })

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
            <h1 className="text-xl font-bold text-text-primary">Blood Oxygen (SpO₂)</h1>
            <p className="text-sm text-text-secondary">Last 90 days · Apple Watch background readings</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <OxygenClient records={records ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}

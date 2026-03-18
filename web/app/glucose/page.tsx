import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { GlucoseClient } from './glucose-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Blood Glucose' }

export default async function GlucosePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startIso = thirtyDaysAgo.toISOString()

  const { data: records } = await supabase
    .from('health_records')
    .select('value, start_time')
    .eq('user_id', user.id)
    .eq('type', 'blood_glucose')
    .gte('start_time', startIso)
    .gt('value', 0)
    .order('start_time', { ascending: true })

  const readings = (records ?? [])
    .filter((r) => r.value > 30 && r.value < 600) // sanity filter (mg/dL)
    .map((r) => ({
      timestamp: r.start_time,
      mgdl: Math.round(r.value),
      mmol: +(r.value / 18.0).toFixed(1),
      hour: new Date(r.start_time).getHours(),
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
          <div>
            <h1 className="text-xl font-bold text-text-primary">Blood Glucose</h1>
            <p className="text-sm text-text-secondary">Last 30 days · {readings.length} readings</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <GlucoseClient readings={readings} />
      </main>
      <BottomNav />
    </div>
  )
}

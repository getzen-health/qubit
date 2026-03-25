import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { AnomalyCard } from './anomaly-card'

export const metadata = {
  title: 'Anomaly Alerts',
}

export interface Anomaly {
  id: string
  detected_at: string
  metric: string
  value: number
  avg_value: number
  deviation: number
  severity: 'low' | 'medium' | 'high'
  claude_explanation: string | null
}

export default async function AnomaliesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: anomalies } = await supabase
    .from('anomalies')
    .select('id, detected_at, metric, value, avg_value, deviation, severity, claude_explanation')
    .eq('user_id', user.id)
    .is('dismissed_at', null)
    .gte('detected_at', thirtyDaysAgo.toISOString())
    .order('detected_at', { ascending: false })

  const items = (anomalies ?? []) as Anomaly[]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary leading-tight">Anomaly Alerts</h1>
            <p className="text-[10px] text-text-tertiary leading-tight">
              {items.length > 0 ? `${items.length} active alert${items.length === 1 ? '' : 's'}` : 'Last 30 days'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">All clear</h2>
              <p className="text-sm text-text-secondary mt-1 max-w-xs">
                No anomalies detected in the last 30 days. Your metrics are looking consistent.
              </p>
            </div>
          </div>
        ) : (
          items.map((anomaly) => (
            <AnomalyCard key={anomaly.id} anomaly={anomaly} />
          ))
        )}
      </main>

      <BottomNav />
    </div>
  )
}

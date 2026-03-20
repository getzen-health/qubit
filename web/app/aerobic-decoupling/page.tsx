import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AerobicDecouplingClient } from './aerobic-decoupling-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Aerobic Decoupling' }

export default async function AerobicDecouplingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: runs } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_heart_rate, max_heart_rate')
    .eq('user_id', user.id)
    .ilike('workout_type', '%run%')
    .gte('duration_minutes', 30)
    .order('start_time', { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Aerobic Decoupling</h1>
            <p className="text-sm text-text-secondary">
              {(runs ?? []).length} long runs analysed
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <AerobicDecouplingClient runs={runs ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}

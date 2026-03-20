import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { OpenWaterClient } from './open-water-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Open Water Swimming' }

export default async function OpenWaterPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since = new Date()
  since.setMonth(since.getMonth() - 12)

  // distance > 200m to separate open water from short pool sessions
  const { data: sessions } = await supabase
    .from('workout_records')
    .select(
      'id, start_time, duration_minutes, distance_meters, active_calories, avg_heart_rate'
    )
    .eq('user_id', user.id)
    .eq('workout_type', 'Swimming')
    .gt('distance_meters', 200)
    .gt('duration_minutes', 0)
    .gte('start_time', since.toISOString())
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
            <h1 className="text-xl font-bold text-text-primary">Open Water Swimming</h1>
            <p className="text-sm text-text-secondary">
              {(sessions ?? []).length} sessions · last 12 months
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <OpenWaterClient sessions={sessions ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const VolleyballClient = dynamic(() => import('./volleyball-client').then(m => ({ default: m.VolleyballClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Volleyball Analytics' }

export default async function VolleyballPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 90-day window
  const since = new Date()
  since.setDate(since.getDate() - 90)

  const { data: sessions } = await supabase
    .from('workout_records')
    .select('id, start_time, workout_type, duration_minutes, active_calories, avg_heart_rate, max_heart_rate')
    .eq('user_id', user.id)
    .ilike('workout_type', '%volleyball%')
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
            <h1 className="text-xl font-bold text-text-primary">Volleyball Analytics</h1>
            <p className="text-sm text-text-secondary">
              {(sessions ?? []).length > 0
                ? `${(sessions ?? []).length} sessions · last 90 days`
                : 'Last 90 days'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <VolleyballClient sessions={sessions ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}

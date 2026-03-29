import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const YogaClient = dynamic(() => import('./yoga-client').then(m => ({ default: m.YogaClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Yoga & Mind-Body Analytics' }

export default async function YogaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const { data: sessions } = await supabase
    .from('workout_records')
    .select('id, start_time, workout_type, duration_minutes, active_calories, avg_heart_rate')
    .eq('user_id', user.id)
    .gte('start_time', startIso)
    .gt('duration_minutes', 0)
    .or(
      'workout_type.ilike.%yoga%,workout_type.ilike.%pilates%,workout_type.ilike.%mind%,workout_type.ilike.%tai%'
    )
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
            <h1 className="text-xl font-bold text-text-primary">Yoga & Mind-Body</h1>
            <p className="text-sm text-text-secondary">Last 90 days</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <YogaClient sessions={sessions ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}

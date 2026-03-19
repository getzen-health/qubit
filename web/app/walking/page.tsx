import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { WalkingClient } from './walking-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Walking Analytics' }

export default async function WalkingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: walks } = await supabase
    .from('workout_records')
    .select('id, start_time, workout_type, duration_minutes, distance_meters, active_calories, avg_heart_rate')
    .eq('user_id', user.id)
    .ilike('workout_type', '%walk%')
    .gt('duration_minutes', 0)
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
            <h1 className="text-xl font-bold text-text-primary">Walking Analytics</h1>
            <p className="text-sm text-text-secondary">{(walks ?? []).length} sessions</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <WalkingClient walks={walks ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}

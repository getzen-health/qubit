import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const RockClimbingClient = dynamic(() => import('./rock-climbing-client').then(m => ({ default: m.RockClimbingClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Rock Climbing Analytics' }

// Realistic mock data — 18 sessions spread over ~90 days
const MOCK_SESSIONS = [
  { id: '1',  start_time: '2025-12-20T09:30:00Z', duration_minutes: 75,  active_calories: 492,  avg_heart_rate: 131, max_heart_rate: 158 },
  { id: '2',  start_time: '2025-12-24T10:00:00Z', duration_minutes: 90,  active_calories: 621,  avg_heart_rate: 136, max_heart_rate: 165 },
  { id: '3',  start_time: '2025-12-28T11:15:00Z', duration_minutes: 60,  active_calories: 408,  avg_heart_rate: 128, max_heart_rate: 155 },
  { id: '4',  start_time: '2026-01-03T09:00:00Z', duration_minutes: 105, active_calories: 735,  avg_heart_rate: 141, max_heart_rate: 168 },
  { id: '5',  start_time: '2026-01-07T10:30:00Z', duration_minutes: 90,  active_calories: 612,  avg_heart_rate: 138, max_heart_rate: 163 },
  { id: '6',  start_time: '2026-01-11T11:00:00Z', duration_minutes: 120, active_calories: 852,  avg_heart_rate: 143, max_heart_rate: 170 },
  { id: '7',  start_time: '2026-01-15T09:45:00Z', duration_minutes: 75,  active_calories: 510,  avg_heart_rate: 134, max_heart_rate: 160 },
  { id: '8',  start_time: '2026-01-21T10:00:00Z', duration_minutes: 90,  active_calories: 630,  avg_heart_rate: 139, max_heart_rate: 166 },
  { id: '9',  start_time: '2026-01-25T09:30:00Z', duration_minutes: 150, active_calories: 1080, avg_heart_rate: 145, max_heart_rate: 172 },
  { id: '10', start_time: '2026-01-29T11:00:00Z', duration_minutes: 60,  active_calories: 420,  avg_heart_rate: 130, max_heart_rate: 157 },
  { id: '11', start_time: '2026-02-04T10:00:00Z', duration_minutes: 90,  active_calories: 648,  avg_heart_rate: 140, max_heart_rate: 164 },
  { id: '12', start_time: '2026-02-08T09:15:00Z', duration_minutes: 120, active_calories: 864,  avg_heart_rate: 144, max_heart_rate: 169 },
  { id: '13', start_time: '2026-02-12T10:30:00Z', duration_minutes: 75,  active_calories: 525,  avg_heart_rate: 135, max_heart_rate: 161 },
  { id: '14', start_time: '2026-02-18T09:00:00Z', duration_minutes: 45,  active_calories: 306,  avg_heart_rate: 125, max_heart_rate: 149 },
  { id: '15', start_time: '2026-02-22T10:00:00Z', duration_minutes: 105, active_calories: 756,  avg_heart_rate: 142, max_heart_rate: 167 },
  { id: '16', start_time: '2026-02-26T11:15:00Z', duration_minutes: 90,  active_calories: 639,  avg_heart_rate: 137, max_heart_rate: 163 },
  { id: '17', start_time: '2026-03-04T10:00:00Z', duration_minutes: 120, active_calories: 876,  avg_heart_rate: 146, max_heart_rate: 171 },
  { id: '18', start_time: '2026-03-11T09:30:00Z', duration_minutes: 90,  active_calories: 648,  avg_heart_rate: 140, max_heart_rate: 165 },
]

export default async function RockClimbingPage() {
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
    .select('id, start_time, duration_minutes, active_calories, avg_heart_rate, max_heart_rate')
    .eq('user_id', user.id)
    .ilike('workout_type', '%climb%')
    .gt('duration_minutes', 0)
    .gte('start_time', since.toISOString())
    .order('start_time', { ascending: true })

  const data = (sessions && sessions.length > 0) ? sessions : MOCK_SESSIONS

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
            <h1 className="text-xl font-bold text-text-primary">Rock Climbing</h1>
            <p className="text-sm text-text-secondary">
              {data.length} sessions · last 90 days
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RockClimbingClient sessions={data} />
      </main>
      <BottomNav />
    </div>
  )
}

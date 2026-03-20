import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FunctionalStrengthClient } from './functional-strength-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Functional Strength Analytics' }

interface FunctionalStrengthSession {
  id: string
  start_time: string
  duration_minutes: number
  active_calories: number
  avg_heart_rate: number
  max_heart_rate: number
}

const MOCK_SESSIONS: FunctionalStrengthSession[] = [
  { id: '1',  start_time: '2025-12-20T07:15:00Z', duration_minutes: 48, active_calories: 412, avg_heart_rate: 138, max_heart_rate: 171 },
  { id: '2',  start_time: '2025-12-23T06:50:00Z', duration_minutes: 52, active_calories: 445, avg_heart_rate: 145, max_heart_rate: 176 },
  { id: '3',  start_time: '2025-12-27T07:05:00Z', duration_minutes: 45, active_calories: 389, avg_heart_rate: 136, max_heart_rate: 168 },
  { id: '4',  start_time: '2025-12-30T06:45:00Z', duration_minutes: 55, active_calories: 472, avg_heart_rate: 148, max_heart_rate: 178 },
  { id: '5',  start_time: '2026-01-03T07:20:00Z', duration_minutes: 50, active_calories: 430, avg_heart_rate: 141, max_heart_rate: 173 },
  { id: '6',  start_time: '2026-01-07T06:55:00Z', duration_minutes: 42, active_calories: 364, avg_heart_rate: 135, max_heart_rate: 165 },
  { id: '7',  start_time: '2026-01-10T07:10:00Z', duration_minutes: 58, active_calories: 498, avg_heart_rate: 150, max_heart_rate: 177 },
  { id: '8',  start_time: '2026-01-14T06:40:00Z', duration_minutes: 46, active_calories: 396, avg_heart_rate: 139, max_heart_rate: 170 },
  { id: '9',  start_time: '2026-01-17T07:00:00Z', duration_minutes: 53, active_calories: 458, avg_heart_rate: 144, max_heart_rate: 174 },
  { id: '10', start_time: '2026-01-21T06:50:00Z', duration_minutes: 49, active_calories: 421, avg_heart_rate: 142, max_heart_rate: 172 },
  { id: '11', start_time: '2026-01-24T07:15:00Z', duration_minutes: 56, active_calories: 481, avg_heart_rate: 147, max_heart_rate: 176 },
  { id: '12', start_time: '2026-01-28T06:45:00Z', duration_minutes: 44, active_calories: 378, avg_heart_rate: 134, max_heart_rate: 166 },
  { id: '13', start_time: '2026-01-31T07:05:00Z', duration_minutes: 51, active_calories: 440, avg_heart_rate: 143, max_heart_rate: 173 },
  { id: '14', start_time: '2026-02-04T06:55:00Z', duration_minutes: 57, active_calories: 490, avg_heart_rate: 149, max_heart_rate: 177 },
  { id: '15', start_time: '2026-02-07T07:20:00Z', duration_minutes: 47, active_calories: 404, avg_heart_rate: 140, max_heart_rate: 169 },
  { id: '16', start_time: '2026-02-11T06:50:00Z', duration_minutes: 54, active_calories: 465, avg_heart_rate: 146, max_heart_rate: 175 },
  { id: '17', start_time: '2026-02-14T07:00:00Z', duration_minutes: 43, active_calories: 371, avg_heart_rate: 133, max_heart_rate: 164 },
  { id: '18', start_time: '2026-02-18T06:40:00Z', duration_minutes: 60, active_calories: 516, avg_heart_rate: 152, max_heart_rate: 178 },
  { id: '19', start_time: '2026-02-21T07:10:00Z', duration_minutes: 50, active_calories: 432, avg_heart_rate: 141, max_heart_rate: 172 },
  { id: '20', start_time: '2026-02-25T06:55:00Z', duration_minutes: 48, active_calories: 415, avg_heart_rate: 139, max_heart_rate: 170 },
  { id: '21', start_time: '2026-02-28T07:15:00Z', duration_minutes: 55, active_calories: 474, avg_heart_rate: 148, max_heart_rate: 176 },
  { id: '22', start_time: '2026-03-04T06:45:00Z', duration_minutes: 46, active_calories: 397, avg_heart_rate: 136, max_heart_rate: 167 },
  { id: '23', start_time: '2026-03-11T07:00:00Z', duration_minutes: 52, active_calories: 449, avg_heart_rate: 145, max_heart_rate: 174 },
  { id: '24', start_time: '2026-03-15T06:50:00Z', duration_minutes: 59, active_calories: 508, avg_heart_rate: 151, max_heart_rate: 178 },
]

export default async function FunctionalStrengthPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
            <h1 className="text-xl font-bold text-text-primary">Functional Strength Analytics</h1>
            <p className="text-sm text-text-secondary">
              {MOCK_SESSIONS.length} sessions · last 90 days
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <FunctionalStrengthClient sessions={MOCK_SESSIONS} />
      </main>
      <BottomNav />
    </div>
  )
}

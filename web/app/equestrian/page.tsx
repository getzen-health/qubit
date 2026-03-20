import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EquestrianClient } from './equestrian-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Equestrian Analytics' }

// Realistic mock data — 28 sessions over the last 6 months
const MOCK_SESSIONS = [
  // Sep 2025
  { id: 'm01', start_time: '2025-09-06T09:15:00Z', duration_minutes: 75,  active_calories: 382, avg_heart_rate: 112 },
  { id: 'm02', start_time: '2025-09-14T08:45:00Z', duration_minutes: 90,  active_calories: 468, avg_heart_rate: 116 },
  { id: 'm03', start_time: '2025-09-21T09:00:00Z', duration_minutes: 105, active_calories: 551, avg_heart_rate: 121 },
  { id: 'm04', start_time: '2025-09-28T10:00:00Z', duration_minutes: 120, active_calories: 634, avg_heart_rate: 124 },

  // Oct 2025
  { id: 'm05', start_time: '2025-10-04T09:30:00Z', duration_minutes: 90,  active_calories: 471, avg_heart_rate: 118 },
  { id: 'm06', start_time: '2025-10-12T08:00:00Z', duration_minutes: 150, active_calories: 795, avg_heart_rate: 128 },
  { id: 'm07', start_time: '2025-10-18T09:15:00Z', duration_minutes: 120, active_calories: 627, avg_heart_rate: 122 },
  { id: 'm08', start_time: '2025-10-25T10:30:00Z', duration_minutes: 60,  active_calories: 306, avg_heart_rate: 109 },
  { id: 'm09', start_time: '2025-10-31T09:00:00Z', duration_minutes: 90,  active_calories: 463, avg_heart_rate: 117 },

  // Nov 2025
  { id: 'm10', start_time: '2025-11-02T10:00:00Z', duration_minutes: 120, active_calories: 628, avg_heart_rate: 123 },
  { id: 'm11', start_time: '2025-11-08T09:00:00Z', duration_minutes: 90,  active_calories: 474, avg_heart_rate: 119 },
  { id: 'm12', start_time: '2025-11-15T08:30:00Z', duration_minutes: 60,  active_calories: 312, avg_heart_rate: 110 },
  { id: 'm13', start_time: '2025-11-22T09:45:00Z', duration_minutes: 180, active_calories: 952, avg_heart_rate: 131 },
  { id: 'm14', start_time: '2025-11-29T10:00:00Z', duration_minutes: 75,  active_calories: 391, avg_heart_rate: 114 },

  // Dec 2025
  { id: 'm15', start_time: '2025-12-06T09:15:00Z', duration_minutes: 90,  active_calories: 469, avg_heart_rate: 116 },
  { id: 'm16', start_time: '2025-12-13T08:00:00Z', duration_minutes: 120, active_calories: 635, avg_heart_rate: 125 },
  { id: 'm17', start_time: '2025-12-21T10:30:00Z', duration_minutes: 90,  active_calories: 477, avg_heart_rate: 118 },
  { id: 'm18', start_time: '2025-12-28T09:00:00Z', duration_minutes: 60,  active_calories: 310, avg_heart_rate: 111 },

  // Jan 2026
  { id: 'm19', start_time: '2026-01-04T10:00:00Z', duration_minutes: 120, active_calories: 629, avg_heart_rate: 122 },
  { id: 'm20', start_time: '2026-01-11T09:30:00Z', duration_minutes: 90,  active_calories: 472, avg_heart_rate: 117 },
  { id: 'm21', start_time: '2026-01-18T08:45:00Z', duration_minutes: 150, active_calories: 792, avg_heart_rate: 129 },
  { id: 'm22', start_time: '2026-01-25T09:00:00Z', duration_minutes: 75,  active_calories: 389, avg_heart_rate: 113 },

  // Feb 2026
  { id: 'm23', start_time: '2026-02-01T10:15:00Z', duration_minutes: 120, active_calories: 636, avg_heart_rate: 124 },
  { id: 'm24', start_time: '2026-02-08T09:00:00Z', duration_minutes: 90,  active_calories: 475, avg_heart_rate: 119 },
  { id: 'm25', start_time: '2026-02-15T08:30:00Z', duration_minutes: 60,  active_calories: 309, avg_heart_rate: 108 },
  { id: 'm26', start_time: '2026-02-22T09:45:00Z', duration_minutes: 180, active_calories: 958, avg_heart_rate: 133 },
  { id: 'm27', start_time: '2026-03-01T10:00:00Z', duration_minutes: 120, active_calories: 631, avg_heart_rate: 126 },
  { id: 'm28', start_time: '2026-03-08T09:15:00Z', duration_minutes: 90,  active_calories: 468, avg_heart_rate: 118 },
]

export default async function EquestrianPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sessions = MOCK_SESSIONS

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
            <h1 className="text-xl font-bold text-text-primary">Equestrian Analytics</h1>
            <p className="text-sm text-text-secondary">
              {sessions.length} sessions · last 6 months
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <EquestrianClient sessions={sessions} />
      </main>
      <BottomNav />
    </div>
  )
}

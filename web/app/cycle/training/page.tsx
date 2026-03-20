import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CycleTrainingClient } from './cycle-training-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Cycle-Synced Training' }

// ── Mock data ──────────────────────────────────────────────────────────────
const mockData = {
  currentDay: 8,
  cycleLength: 28,
  currentPhase: 'follicular' as const,
  phaseHRData: [
    { phase: 'Menstrual', avgHR: 131, days: '1–5' },
    { phase: 'Follicular', avgHR: 142, days: '6–13' },
    { phase: 'Ovulation', avgHR: 148, days: '12–16' },
    { phase: 'Luteal', avgHR: 139, days: '17–28' },
  ],
  recentWorkouts: [
    { date: '2026-03-18', type: 'Run', phase: 'follicular', hr: 144, duration: 42 },
    { date: '2026-03-16', type: 'Strength', phase: 'follicular', hr: 138, duration: 55 },
    { date: '2026-03-14', type: 'Cycling', phase: 'follicular', hr: 146, duration: 60 },
    { date: '2026-03-11', type: 'HIIT', phase: 'menstrual', hr: 133, duration: 30 },
    { date: '2026-03-09', type: 'Yoga', phase: 'menstrual', hr: 98, duration: 45 },
    { date: '2026-03-07', type: 'Walk', phase: 'menstrual', hr: 112, duration: 35 },
    { date: '2026-03-04', type: 'Strength', phase: 'luteal', hr: 141, duration: 50 },
    { date: '2026-03-02', type: 'Run', phase: 'luteal', hr: 137, duration: 38 },
  ],
}

export default async function CycleTrainingPage() {
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
            href="/cycle"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to cycle tracking"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Cycle-Synced Training 🌸</h1>
            <p className="text-sm text-text-secondary">
              Day {mockData.currentDay} of {mockData.cycleLength} — Follicular Phase
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <CycleTrainingClient data={mockData} />
      </main>
      <BottomNav />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PolarizationClient } from './polarization-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Training Polarization' }

// ─── Mock data (no real data source for polarization analysis) ────────────────

const MOCK_SUMMARY = {
  score: 72,
  totalSessions: 156,
  easyPct: 76,
  moderatePct: 11,
  hardPct: 13,
}

const MOCK_WEEKLY_TREND = [
  { week: 'Dec 19', easyPct: 68 },
  { week: 'Dec 26', easyPct: 72 },
  { week: 'Jan 2',  easyPct: 65 },
  { week: 'Jan 9',  easyPct: 70 },
  { week: 'Jan 16', easyPct: 74 },
  { week: 'Jan 23', easyPct: 79 },
  { week: 'Jan 30', easyPct: 81 },
  { week: 'Feb 6',  easyPct: 76 },
  { week: 'Feb 13', easyPct: 83 },
  { week: 'Feb 20', easyPct: 78 },
  { week: 'Feb 27', easyPct: 75 },
  { week: 'Mar 6',  easyPct: 80 },
  { week: 'Mar 13', easyPct: 77 },
]

const MOCK_SPORT_BREAKDOWN = [
  { sport: 'Running',  easy: 82, moderate: 8,  hard: 10, sessions: 64 },
  { sport: 'Cycling',  easy: 78, moderate: 9,  hard: 13, sessions: 41 },
  { sport: 'HIIT',     easy: 22, moderate: 18, hard: 60, sessions: 19 },
  { sport: 'Strength', easy: 91, moderate: 6,  hard: 3,  sessions: 22 },
  { sport: 'Swimming', easy: 74, moderate: 14, hard: 12, sessions: 10 },
]

export default async function PolarizationPage() {
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
            <h1 className="text-xl font-bold text-text-primary">Training Polarization</h1>
            <p className="text-sm text-text-secondary">
              {MOCK_SUMMARY.totalSessions} sessions analyzed · Seiler 80/20 model
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <PolarizationClient
          summary={MOCK_SUMMARY}
          weeklyTrend={MOCK_WEEKLY_TREND}
          sportBreakdown={MOCK_SPORT_BREAKDOWN}
        />
      </main>
      <BottomNav />
    </div>
  )
}

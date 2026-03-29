import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const PolarizationClient = dynamic(() => import('./polarization-client').then(m => ({ default: m.PolarizationClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Training Polarization' }

// Fallback mock data shown when user has no workout history with HR data
const FALLBACK_SUMMARY = { score: 72, totalSessions: 0, easyPct: 76, moderatePct: 11, hardPct: 13 }
const FALLBACK_WEEKLY: { week: string; easyPct: number }[] = []
const FALLBACK_SPORTS: { sport: string; easy: number; moderate: number; hard: number; sessions: number }[] = []

export default async function PolarizationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch real polarization data from the API
  const since = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString()
  const { data: profile } = await supabase.from('users').select('age').eq('id', user.id).single()
  const { data: workouts } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, avg_heart_rate, max_heart_rate, workout_type')
    .eq('user_id', user.id)
    .not('avg_heart_rate', 'is', null)
    .gte('start_time', since)
    .order('start_time', { ascending: true })

  const sessions = workouts ?? []
  const observedMax = sessions.reduce((m, s) => Math.max(m, (s.max_heart_rate as number) ?? 0), 0)
  const ageBasedMax = profile?.age ? 220 - profile.age : 0
  const hrmax = observedMax > 100 ? observedMax : ageBasedMax > 0 ? ageBasedMax : 185
  const lt1 = hrmax * 0.77
  const lt2 = hrmax * 0.87

  function classify(hr: number | null): 'easy' | 'moderate' | 'hard' {
    if (!hr) return 'easy'
    if (hr < lt1) return 'easy'
    if (hr < lt2) return 'moderate'
    return 'hard'
  }

  const total = sessions.length
  let easy = 0, moderate = 0, hard = 0
  for (const s of sessions) {
    const zone = classify(s.avg_heart_rate as number | null)
    if (zone === 'easy') easy++
    else if (zone === 'moderate') moderate++
    else hard++
  }
  const easyPct = total > 0 ? Math.round((easy / total) * 100) : 0
  const moderatePct = total > 0 ? Math.round((moderate / total) * 100) : 0
  const hardPct = total > 0 ? 100 - easyPct - moderatePct : 0
  const score = total > 0
    ? Math.max(0, Math.round(100 - Math.abs(easyPct - 80) * 0.8 - Math.abs(hardPct - 20) * 0.8 - moderatePct * 0.6))
    : FALLBACK_SUMMARY.score

  // Weekly trend
  const weeks: Record<string, { easy: number; total: number }> = {}
  for (const s of sessions) {
    const d = new Date(s.start_time as string)
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const wk = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!weeks[wk]) weeks[wk] = { easy: 0, total: 0 }
    weeks[wk].total++
    if (classify(s.avg_heart_rate as number | null) === 'easy') weeks[wk].easy++
  }
  const weeklyTrend = Object.entries(weeks).map(([week, { easy: e, total: t }]) => ({
    week,
    easyPct: t > 0 ? Math.round((e / t) * 100) : 0,
  }))

  // Sport breakdown
  const sports: Record<string, { easy: number; moderate: number; hard: number; sessions: number }> = {}
  for (const s of sessions) {
    const type = (s.workout_type as string)
      ? (s.workout_type as string).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()).slice(0, 12)
      : 'Other'
    if (!sports[type]) sports[type] = { easy: 0, moderate: 0, hard: 0, sessions: 0 }
    sports[type].sessions++
    const zone = classify(s.avg_heart_rate as number | null)
    sports[type][zone]++
  }
  const sportBreakdown = Object.entries(sports)
    .sort((a, b) => b[1].sessions - a[1].sessions)
    .slice(0, 6)
    .map(([sport, d]) => ({
      sport,
      easy: d.sessions > 0 ? Math.round((d.easy / d.sessions) * 100) : 0,
      moderate: d.sessions > 0 ? Math.round((d.moderate / d.sessions) * 100) : 0,
      hard: d.sessions > 0 ? Math.round((d.hard / d.sessions) * 100) : 0,
      sessions: d.sessions,
    }))

  const summary = { score, totalSessions: total, easyPct, moderatePct, hardPct }

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
              {total > 0 ? `${total} sessions analyzed` : 'No HR data yet'} · Seiler 80/20 model
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <PolarizationClient
          summary={total > 0 ? summary : FALLBACK_SUMMARY}
          weeklyTrend={weeklyTrend.length > 0 ? weeklyTrend : FALLBACK_WEEKLY}
          sportBreakdown={sportBreakdown.length > 0 ? sportBreakdown : FALLBACK_SPORTS}
        />
      </main>
      <BottomNav />
    </div>
  )
}

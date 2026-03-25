'use client'

import Link from 'next/link'
import { ArrowLeft, FlaskConical } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  Dot,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Grade = 'Excellent' | 'Good' | 'Fair' | 'Poor'

interface SportAvg {
  sport: string
  avgScore: number
  sessions: number
  grade: Grade
}

interface TrendPoint {
  day: number
  date: string
  score: number
  sport: string
  grade: Grade
}

interface TopSession {
  date: string
  sport: string
  duration: string
  score: number
  grade: Grade
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getGrade(score: number): Grade {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Poor'
}

function gradeColor(grade: Grade): string {
  switch (grade) {
    case 'Excellent': return '#22c55e'
    case 'Good':      return '#2dd4bf'
    case 'Fair':      return '#f97316'
    case 'Poor':      return '#ef4444'
  }
}

function scoreColor(score: number): string {
  return gradeColor(getGrade(score))
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

// 30 sessions over the last 30 days. Spread across 8 sport types.
const SPORT_SESSIONS: { sport: string; duration: string; score: number }[] = [
  // Running — moderate recovery, some variability
  { sport: 'Running',  duration: '45 min', score: 72 },
  { sport: 'Running',  duration: '38 min', score: 68 },
  { sport: 'Running',  duration: '62 min', score: 65 },
  { sport: 'Running',  duration: '50 min', score: 71 },
  // Cycling — good recovery
  { sport: 'Cycling',  duration: '55 min', score: 79 },
  { sport: 'Cycling',  duration: '90 min', score: 76 },
  { sport: 'Cycling',  duration: '40 min', score: 81 },
  // HIIT — lowest recovery scores
  { sport: 'HIIT',     duration: '30 min', score: 57 },
  { sport: 'HIIT',     duration: '25 min', score: 55 },
  { sport: 'HIIT',     duration: '35 min', score: 60 },
  // Strength — moderate-to-fair
  { sport: 'Strength', duration: '50 min', score: 66 },
  { sport: 'Strength', duration: '60 min', score: 63 },
  { sport: 'Strength', duration: '45 min', score: 69 },
  // Yoga — highest recovery (low stress on body)
  { sport: 'Yoga',     duration: '60 min', score: 91 },
  { sport: 'Yoga',     duration: '45 min', score: 89 },
  { sport: 'Yoga',     duration: '75 min', score: 92 },
  // Swimming — excellent
  { sport: 'Swimming', duration: '45 min', score: 86 },
  { sport: 'Swimming', duration: '35 min', score: 83 },
  { sport: 'Swimming', duration: '50 min', score: 88 },
  // Walking — good/excellent
  { sport: 'Walking',  duration: '30 min', score: 87 },
  { sport: 'Walking',  duration: '40 min', score: 84 },
  { sport: 'Walking',  duration: '25 min', score: 85 },
  // Hiking — good
  { sport: 'Hiking',   duration: '80 min', score: 78 },
  { sport: 'Hiking',   duration: '110 min', score: 74 },
  { sport: 'Hiking',   duration: '95 min', score: 77 },
  // Extra variety for trend line
  { sport: 'Running',  duration: '42 min', score: 70 },
  { sport: 'Yoga',     duration: '60 min', score: 90 },
  { sport: 'HIIT',     duration: '28 min', score: 58 },
  { sport: 'Cycling',  duration: '70 min', score: 80 },
  { sport: 'Strength', duration: '55 min', score: 67 },
]

// Attach dates: each session is one of the last 30 days (newest = today)
const today = new Date('2026-03-20')

const TREND_DATA: TrendPoint[] = SPORT_SESSIONS.map((s, i) => {
  const d = new Date(today)
  d.setDate(today.getDate() - (29 - i))
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return {
    day: i + 1,
    date: dateStr,
    score: s.score,
    sport: s.sport,
    grade: getGrade(s.score),
  }
})

// Aggregate per sport
const sportMap: Record<string, { total: number; count: number }> = {}
SPORT_SESSIONS.forEach((s) => {
  if (!sportMap[s.sport]) sportMap[s.sport] = { total: 0, count: 0 }
  sportMap[s.sport].total += s.score
  sportMap[s.sport].count++
})

const SPORT_AVGS: SportAvg[] = Object.entries(sportMap)
  .map(([sport, { total, count }]) => {
    const avgScore = Math.round(total / count)
    return { sport, avgScore, sessions: count, grade: getGrade(avgScore) }
  })
  .sort((a, b) => b.avgScore - a.avgScore)

// Top 8 sessions sorted by score
const TOP_SESSIONS: TopSession[] = SPORT_SESSIONS.map((s, i) => {
  const d = new Date(today)
  d.setDate(today.getDate() - (29 - i))
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sport: s.sport,
    duration: s.duration,
    score: s.score,
    grade: getGrade(s.score),
  }
})
  .sort((a, b) => b.score - a.score)
  .slice(0, 8)

// ─── Summary stats ──────────────────────────────────────────────────────────────

const avgRecoveryScore = Math.round(
  SPORT_SESSIONS.reduce((s, r) => s + r.score, 0) / SPORT_SESSIONS.length
)
const bestSport = SPORT_AVGS[0]
const sessionsAnalysed = SPORT_SESSIONS.length

// ─── Tooltip styles ─────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Custom Dot for Line Chart ──────────────────────────────────────────────────

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: TrendPoint
}

function RecoveryDot(props: CustomDotProps) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null || !payload) return null
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={4}
      fill={gradeColor(payload.grade)}
      stroke="none"
    />
  )
}

// ─── Grade Badge ────────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: Grade }) {
  const colorMap: Record<Grade, string> = {
    Excellent: 'bg-green-500/20 text-green-400',
    Good:      'bg-teal-400/20 text-teal-400',
    Fair:      'bg-orange-500/20 text-orange-400',
    Poor:      'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[grade]}`}>
      {grade}
    </span>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function WorkoutRecoveryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Workout Recovery Optimizer</h1>
            <p className="text-sm text-text-secondary">Next-morning HRV &amp; RHR recovery score by sport</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: scoreColor(avgRecoveryScore) }}
            >
              {avgRecoveryScore}
            </p>
            <p className="text-xs text-text-secondary mt-1">Avg Recovery Score</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-green-400 truncate">{bestSport.sport}</p>
            <p className="text-xs text-text-secondary mt-1">Best Sport ({bestSport.avgScore})</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-3xl font-bold text-text-primary tabular-nums">{sessionsAnalysed}</p>
            <p className="text-xs text-text-secondary mt-1">Sessions Analysed</p>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            Excellent ≥85
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-400 inline-block" />
            Good 70–84
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
            Fair 50–69
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            Poor &lt;50
          </span>
        </div>

        {/* ── Recovery by Sport — Horizontal Bar Chart ── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Recovery by Sport</h2>
          <ResponsiveContainer width="100%" height={SPORT_AVGS.length * 44}>
            <BarChart
              data={SPORT_AVGS}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 4, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                tickCount={6}
              />
              <YAxis
                dataKey="sport"
                type="category"
                tick={{ fontSize: 12, fill: 'var(--color-text-primary)' }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                formatter={(value: number, _name: string, entry: { payload?: SportAvg }) => [
                  `${value} — ${entry.payload?.grade} (${entry.payload?.sessions} sessions)`,
                  'Avg Recovery Score',
                ]}
              />
              <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                {SPORT_AVGS.map((entry, i) => (
                  <Cell key={i} fill={gradeColor(entry.grade)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Recovery Score Trend — Line Chart ── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Recovery Score Trend — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TREND_DATA} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                domain={[40, 100]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                tickCount={7}
              />
              <ReferenceLine y={85} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.4} />
              <ReferenceLine y={70} stroke="#2dd4bf" strokeDasharray="4 4" strokeOpacity={0.4} />
              <ReferenceLine y={50} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.4} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, _name: string, entry: { payload?: TrendPoint }) => [
                  `${value} — ${entry.payload?.grade}`,
                  entry.payload?.sport,
                ]}
                labelFormatter={(label: string) => label}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1.5}
                dot={<RecoveryDot />}
                activeDot={{ r: 6, fill: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Top Recovery Sessions Table ── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Top Recovery Sessions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-text-secondary">Sport</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">Duration</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">Score</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TOP_SESSIONS.map((s, i) => (
                  <tr key={i} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                      {s.date}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-text-primary font-medium">
                      {s.sport}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-secondary tabular-nums">
                      {s.duration}
                    </td>
                    <td
                      className="px-3 py-2.5 text-right text-xs font-bold tabular-nums"
                      style={{ color: gradeColor(s.grade) }}
                    >
                      {s.score}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <GradeBadge grade={s.grade} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Science Callout ── */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-400 shrink-0" />
            <h3 className="text-sm font-semibold text-blue-300">The Science</h3>
          </div>
          <p className="text-xs text-blue-200/80 leading-relaxed">
            Buchheit (2014, <em>Sports Medicine</em>) showed that next-morning HRV is the most
            sensitive marker of recovery status, outperforming subjective wellness questionnaires
            and resting HR alone. Plews et al. (2013, <em>International Journal of Sports
            Physiology and Performance</em>) demonstrated that a composite of morning HRV &times;
            RHR tracked over 7-day rolling windows predicts training adaptation quality and can
            guide day-to-day load decisions. Recovery scores here are computed from the
            next-morning HRV &amp; RHR composite measured the morning after each session.
          </p>
        </div>

      </main>

      <BottomNav />
    </div>
  )
}

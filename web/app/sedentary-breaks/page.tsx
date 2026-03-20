'use client'

import Link from 'next/link'
import { ArrowLeft, Clock, Zap, AlertTriangle, BookOpen } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'

// ─── Mock data generation ──────────────────────────────────────────────────────

function seedRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const rand = seedRand(20260320)

/** 30-day longest sedentary streak data (minutes) */
const STREAK_DATA: { date: string; streak: number; breaks: number }[] = Array.from(
  { length: 30 },
  (_, i) => {
    const d = new Date('2026-02-19')
    d.setDate(d.getDate() + i)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    // Realistic variation: mostly 60–160 min, some good days, some bad days
    const base = 90 + Math.round((rand() - 0.4) * 100)
    const streak = Math.max(20, Math.min(210, base))
    const breaks = streak > 120 ? Math.floor(rand() * 2) + 1 : Math.floor(rand() * 3) + 2
    return { date: label, streak, breaks }
  }
)

/** Hour-of-day sedentary pattern — avg steps per 15-min interval by hour */
const HOURLY_PATTERN: { hour: string; avgSteps: number; sedentary: boolean }[] = [
  { hour: '12a', avgSteps: 4, sedentary: true },
  { hour: '1a', avgSteps: 2, sedentary: true },
  { hour: '2a', avgSteps: 3, sedentary: true },
  { hour: '3a', avgSteps: 2, sedentary: true },
  { hour: '4a', avgSteps: 4, sedentary: true },
  { hour: '5a', avgSteps: 6, sedentary: true },
  { hour: '6a', avgSteps: 45, sedentary: false },
  { hour: '7a', avgSteps: 110, sedentary: false },
  { hour: '8a', avgSteps: 78, sedentary: false },
  { hour: '9a', avgSteps: 38, sedentary: true },
  { hour: '10a', avgSteps: 22, sedentary: true },
  { hour: '11a', avgSteps: 35, sedentary: true },
  { hour: '12p', avgSteps: 130, sedentary: false },
  { hour: '1p', avgSteps: 95, sedentary: false },
  { hour: '2p', avgSteps: 18, sedentary: true },
  { hour: '3p', avgSteps: 14, sedentary: true },
  { hour: '4p', avgSteps: 20, sedentary: true },
  { hour: '5p', avgSteps: 88, sedentary: false },
  { hour: '6p', avgSteps: 145, sedentary: false },
  { hour: '7p', avgSteps: 62, sedentary: false },
  { hour: '8p', avgSteps: 28, sedentary: true },
  { hour: '9p', avgSteps: 22, sedentary: true },
  { hour: '10p', avgSteps: 15, sedentary: true },
  { hour: '11p', avgSteps: 8, sedentary: true },
]

// ─── Derived summary stats ─────────────────────────────────────────────────────

const avgStreak = Math.round(STREAK_DATA.reduce((s, d) => s + d.streak, 0) / STREAK_DATA.length)
const longestStreak = Math.max(...STREAK_DATA.map((d) => d.streak))
const avgBreaks = +(STREAK_DATA.reduce((s, d) => s + d.breaks, 0) / STREAK_DATA.length).toFixed(1)
const highRiskDays = STREAK_DATA.filter((d) => d.streak > 120).length
const highRiskPct = Math.round((highRiskDays / STREAK_DATA.length) * 100)

// ─── Color helpers ─────────────────────────────────────────────────────────────

function streakColor(min: number): string {
  if (min < 60) return '#22c55e'
  if (min <= 120) return '#f97316'
  return '#ef4444'
}

function streakLabel(min: number): string {
  if (min < 60) return 'Good'
  if (min <= 120) return 'Elevated'
  return 'High risk'
}

// ─── Tooltip components ────────────────────────────────────────────────────────

interface StreakTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { date: string; streak: number; breaks: number } }>
}

function StreakTooltip({ active, payload }: StreakTooltipProps) {
  if (!active || !payload?.length) return null
  const { date, streak, breaks } = payload[0].payload
  const color = streakColor(streak)
  return (
    <div
      className="rounded-xl border border-border bg-surface shadow-lg px-3 py-2.5 text-sm min-w-[160px]"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
    >
      <p className="font-semibold text-text-primary mb-1.5">{date}</p>
      <p className="text-text-secondary tabular-nums">
        Longest streak:{' '}
        <span className="font-semibold" style={{ color }}>
          {streak} min
        </span>
      </p>
      <p className="text-text-secondary tabular-nums">
        Status:{' '}
        <span className="font-medium" style={{ color }}>
          {streakLabel(streak)}
        </span>
      </p>
      <p className="text-text-secondary tabular-nums">
        Breaks taken:{' '}
        <span className="font-medium text-text-primary">{breaks}</span>
      </p>
    </div>
  )
}

interface HourlyTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { hour: string; avgSteps: number; sedentary: boolean } }>
}

function HourlyTooltip({ active, payload }: HourlyTooltipProps) {
  if (!active || !payload?.length) return null
  const { hour, avgSteps, sedentary } = payload[0].payload
  return (
    <div
      className="rounded-xl border border-border bg-surface shadow-lg px-3 py-2.5 text-sm min-w-[150px]"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
    >
      <p className="font-semibold text-text-primary mb-1">{hour}</p>
      <p className="text-text-secondary tabular-nums">
        Avg steps/15 min:{' '}
        <span className="font-semibold text-text-primary">{avgSteps}</span>
      </p>
      <p className="mt-1">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            sedentary
              ? 'bg-red-500/15 text-red-400'
              : 'bg-green-500/15 text-green-400'
          }`}
        >
          {sedentary ? 'Typically sedentary' : 'Active'}
        </span>
      </p>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accentColor: string
  good?: boolean
}

function StatCard({ icon, label, value, sub, accentColor, good }: StatCardProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</span>
        <span style={{ color: accentColor }}>{icon}</span>
      </div>
      <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: accentColor }}>
        {value}
      </p>
      <p
        className={`text-xs leading-snug ${
          good === undefined ? 'text-text-secondary' : good ? 'text-green-500' : 'text-red-400'
        }`}
      >
        {sub}
      </p>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SedentaryBreaksPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to Explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text-primary">Sedentary Breaks</h1>
            <p className="text-sm text-text-secondary truncate">
              Sitting streak · 30-day analysis
            </p>
          </div>
          <Clock className="w-5 h-5 text-text-secondary shrink-0" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-28">

        {/* ── Threshold explanation banner ──────────────────────────────────── */}
        <div className="bg-surface-secondary rounded-2xl border border-border px-4 py-3 flex gap-3 items-start">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong className="text-text-primary">Sedentary interval:</strong> any 15-minute window with{' '}
            fewer than 100 steps. A streak is the consecutive run of such intervals; it resets when a
            window exceeds the threshold.
          </p>
        </div>

        {/* ── Summary stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Avg streak"
            value={`${avgStreak}m`}
            sub={avgStreak < 60 ? 'Below target — great work' : avgStreak <= 120 ? 'Above 60-min target' : 'Exceeds 2-hour threshold'}
            accentColor={streakColor(avgStreak)}
            good={avgStreak < 60}
          />
          <StatCard
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Longest streak"
            value={`${longestStreak}m`}
            sub={`30-day peak · ${streakLabel(longestStreak)}`}
            accentColor={streakColor(longestStreak)}
            good={longestStreak < 60}
          />
          <StatCard
            icon={<Zap className="w-4 h-4" />}
            label="Avg breaks / day"
            value={String(avgBreaks)}
            sub="Times a >30-min streak was interrupted"
            accentColor="#60a5fa"
          />
          <StatCard
            icon={<AlertTriangle className="w-4 h-4" />}
            label="High-risk days"
            value={`${highRiskPct}%`}
            sub={`${highRiskDays} of 30 days had streaks >120 min`}
            accentColor={highRiskPct > 40 ? '#ef4444' : highRiskPct > 20 ? '#f97316' : '#22c55e'}
            good={highRiskPct <= 20}
          />
        </div>

        {/* ── 30-day streak bar chart ───────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-0.5">
            Longest Sedentary Streak — Last 30 Days
          </h2>
          <p className="text-xs text-text-secondary mb-4">
            Each bar = daily longest uninterrupted sitting period
          </p>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />
              &lt; 60 min — Good
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" />
              60–120 min — Elevated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
              &gt; 120 min — High risk
            </span>
          </div>

          <ResponsiveContainer width="100%" height={190}>
            <BarChart
              data={STREAK_DATA}
              margin={{ top: 6, right: 4, left: -14, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #6b7280)' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #6b7280)' }}
                tickLine={false}
                axisLine={false}
                domain={[0, 220]}
                tickFormatter={(v: number) => `${v}m`}
              />
              {/* Target reference line at 60 min */}
              <ReferenceLine
                y={60}
                stroke="#f97316"
                strokeDasharray="5 3"
                strokeOpacity={0.7}
                label={{
                  value: 'Target 60m',
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: '#f97316',
                  fontWeight: 600,
                }}
              />
              <Tooltip
                content={<StreakTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="streak" radius={[3, 3, 0, 0]} maxBarSize={18}>
                {STREAK_DATA.map((entry, i) => (
                  <Cell key={i} fill={streakColor(entry.streak)} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Hour-of-day sedentary pattern ─────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-0.5">
            Hour-of-Day Sedentary Pattern
          </h2>
          <p className="text-xs text-text-secondary mb-1">
            Average steps per 15-min interval by hour ·{' '}
            <span className="text-red-400 font-medium">red = typically sedentary</span>{' '}
            (&lt;100 steps)
          </p>

          <div className="flex items-center gap-3 mb-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block opacity-75" />
              Sedentary (&lt;100 steps)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" />
              Active (≥100 steps)
            </span>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={HOURLY_PATTERN}
              margin={{ top: 6, right: 4, left: -14, bottom: 0 }}
              barCategoryGap="15%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 8.5, fill: 'var(--color-text-secondary, #6b7280)' }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #6b7280)' }}
                tickLine={false}
                axisLine={false}
                domain={[0, 180]}
                tickFormatter={(v: number) => `${v}`}
              />
              {/* Threshold line at 100 steps */}
              <ReferenceLine
                y={100}
                stroke="#60a5fa"
                strokeDasharray="4 3"
                strokeOpacity={0.5}
                label={{
                  value: '100 steps',
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: '#60a5fa',
                }}
              />
              <Tooltip
                content={<HourlyTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="avgSteps" radius={[3, 3, 0, 0]} maxBarSize={14}>
                {HOURLY_PATTERN.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.sedentary ? '#ef4444' : '#38bdf8'}
                    fillOpacity={entry.sedentary ? 0.65 : 0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Worst hours call-out */}
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-text-secondary mb-2 font-medium">Most sedentary windows</p>
            <div className="flex flex-wrap gap-1.5">
              {HOURLY_PATTERN.filter((h) => h.sedentary && h.hour.includes('a') && parseInt(h.hour) >= 9)
                .concat(HOURLY_PATTERN.filter((h) => h.sedentary && h.hour.includes('p') && parseInt(h.hour) >= 2 && parseInt(h.hour) <= 4))
                .map((h) => (
                  <span
                    key={h.hour}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    {h.hour}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* ── Action tips ───────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Break Strategies
          </h2>
          <ul className="space-y-2.5">
            {[
              {
                tip: 'Set a timer for every 30 minutes of desk work — even a 2-minute stand or walk resets the metabolic clock.',
                highlight: 'Every 30 min',
              },
              {
                tip: 'Walking meetings, standing desks, and stairwell breaks are the highest-leverage office interventions.',
                highlight: 'Move at work',
              },
              {
                tip: 'Post-meal 3-minute walks reduce blood glucose response by ~24% (Dunstan et al., 2012).',
                highlight: 'Post-meal walks',
              },
              {
                tip: 'Aim for your longest streak to be under 60 minutes — this alone dramatically reduces all-cause mortality risk.',
                highlight: 'Target < 60 min',
              },
            ].map(({ tip, highlight }) => (
              <li key={highlight} className="flex gap-3 items-start text-xs text-text-secondary leading-relaxed">
                <span className="shrink-0 mt-0.5 text-amber-400 font-bold">—</span>
                <span>
                  <strong className="text-text-primary">{highlight}: </strong>
                  {tip}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Science card ──────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-text-secondary" />
            The Science
          </h2>

          <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
            <p>
              <strong className="text-text-primary">Why sitting duration matters independently:</strong>{' '}
              A landmark meta-analysis of 47 studies (Biswas et al., 2015,{' '}
              <em>Annals of Internal Medicine</em>) found that sedentary time ≥ 11 hours per day
              increased all-cause mortality risk by 40%, even after accounting for leisure-time physical
              activity. Exercise does not fully "cancel out" prolonged sitting.
            </p>
            <p>
              <strong className="text-text-primary">Breaking sitting improves metabolic health:</strong>{' '}
              Dunstan et al. (2012, <em>Diabetes Care</em>) showed that interrupting sitting every
              30 minutes with 3-minute light-intensity walks reduced postprandial blood glucose by 24%
              in adults with type 2 diabetes. Even light-intensity breaks confer measurable benefit.
            </p>
            <p>
              <strong className="text-text-primary">WHO 2020 Physical Activity Guidelines</strong>{' '}
              recommend interrupting prolonged sedentary time frequently throughout the day as part of
              24-hour movement behaviour, complementary to — not replaced by — structured exercise.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {[
              {
                range: '< 60 min',
                label: 'Optimal',
                color: '#22c55e',
                bg: 'bg-green-500/10',
                border: 'border-green-500/20',
                text: 'text-green-400',
                desc: 'Metabolic and cardiovascular risk is minimised. Maintain this pattern.',
              },
              {
                range: '60–120 min',
                label: 'Elevated risk',
                color: '#f97316',
                bg: 'bg-orange-500/10',
                border: 'border-orange-500/20',
                text: 'text-orange-400',
                desc: 'Meaningful risk increase. Add scheduled break reminders to your workflow.',
              },
              {
                range: '> 120 min',
                label: 'High risk',
                color: '#ef4444',
                bg: 'bg-red-500/10',
                border: 'border-red-500/20',
                text: 'text-red-400',
                desc: 'Significantly elevated all-cause mortality and metabolic disease risk.',
              },
            ].map((tier) => (
              <div
                key={tier.range}
                className={`rounded-xl p-3 border ${tier.bg} ${tier.border} flex gap-3 items-start`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: tier.color }}
                />
                <div>
                  <p className={`text-xs font-semibold ${tier.text} mb-0.5`}>
                    {tier.range} — {tier.label}
                  </p>
                  <p className="text-xs text-text-secondary leading-snug">{tier.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 pt-4 border-t border-border text-xs text-text-tertiary leading-relaxed">
            Sedentary intervals are inferred from Apple Health step data using 15-minute resolution.
            Accuracy depends on iPhone/Apple Watch wear compliance. Data shown are mock values for
            demonstration. Consult a physician for personalised health guidance.
          </p>
        </div>

        {/* Back link (bottom) */}
        <div className="pt-2">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </Link>
        </div>

      </main>
    </div>
  )
}

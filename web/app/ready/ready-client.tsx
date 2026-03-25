'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Dot,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReadinessZone = 'optimal' | 'good' | 'moderate' | 'low'

export interface DailyScore {
  date: string
  score: number
  zone: ReadinessZone
  hrv: number
  rhr: number
  sleep: number
}

export interface ReadinessData {
  todayScore: number
  todayHrv: number
  todayRhr: number
  todaySleep: number
  todayHrvScore: number
  todayRhrScore: number
  todaySleepScore: number
  hrvBaseline: number
  rhrBaseline: number
  daily: DailyScore[]
}

// ─── Zone constants ───────────────────────────────────────────────────────────

const ZONE_CONFIG: Record<ReadinessZone, { color: string; label: string; textClass: string; bgClass: string }> = {
  optimal:  { color: '#4ade80', label: 'Optimal',  textClass: 'text-green-400',  bgClass: 'bg-green-500/10'  },
  good:     { color: '#facc15', label: 'Good',     textClass: 'text-yellow-400', bgClass: 'bg-yellow-500/10' },
  moderate: { color: '#fb923c', label: 'Moderate', textClass: 'text-orange-400', bgClass: 'bg-orange-500/10' },
  low:      { color: '#f87171', label: 'Low',      textClass: 'text-red-400',    bgClass: 'bg-red-500/10'    },
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Training guidance items ──────────────────────────────────────────────────

interface GuidanceItem {
  icon: string
  label: string
  detail: string
  zone: ReadinessZone
  allowed: boolean
}

function getGuidanceItems(zone: ReadinessZone): GuidanceItem[] {
  const items: GuidanceItem[] = [
    {
      icon: zone === 'optimal' ? '✅' : '❌',
      label: 'HIIT / Intervals',
      detail: zone === 'optimal' ? 'Green light — go for it' : 'Save for a higher-readiness day',
      zone,
      allowed: zone === 'optimal',
    },
    {
      icon: zone === 'optimal' || zone === 'good' ? '✅' : '❌',
      label: 'Strength training',
      detail:
        zone === 'optimal' || zone === 'good'
          ? 'Good to train hard'
          : 'Stick to light movements',
      zone,
      allowed: zone === 'optimal' || zone === 'good',
    },
    {
      icon: zone !== 'low' ? '✅' : '⚠️',
      label: 'Steady-state cardio',
      detail: zone === 'low' ? 'Only very easy effort' : 'Moderate pace — manageable',
      zone,
      allowed: zone !== 'low',
    },
    {
      icon: '✅',
      label: 'Yoga / Mobility',
      detail: 'Always appropriate — supports recovery',
      zone,
      allowed: true,
    },
  ]
  return items
}

// ─── Recommendation text ──────────────────────────────────────────────────────

function getRecommendation(zone: ReadinessZone): string {
  if (zone === 'optimal')
    return "Your body is primed for peak performance. Push hard — intervals, heavy lifts, or a race-pace effort are all on the table today."
  if (zone === 'good')
    return "Solid readiness. A quality training session is appropriate; aim for a sustainable, moderate-to-high effort."
  if (zone === 'moderate')
    return "Some fatigue signals detected. Keep intensity low — movement is beneficial, but avoid high-stress efforts."
  return "Your body needs recovery. Prioritize sleep and nutrition; gentle movement only if you feel up to it."
}

// ─── Custom dot (colored by zone) ────────────────────────────────────────────

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: DailyScore
}

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null
  const color = ZONE_CONFIG[payload.zone].color
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={color}
      stroke="var(--color-surface, #1a1a1a)"
      strokeWidth={1.5}
    />
  )
}

// ─── Circular gauge ───────────────────────────────────────────────────────────

function CircularGauge({ score, color }: { score: number; color: string }) {
  const r = 52
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - score / 100)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={120} height={120} className="-rotate-90">
        {/* Track */}
        <circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={12}
        />
        {/* Progress arc */}
        <circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Center label (rotate back to normal) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <span className="text-4xl font-black leading-none" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] text-text-secondary font-medium mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ─── Mini progress bar ────────────────────────────────────────────────────────

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function ReadyClient({ data }: { data: ReadinessData }) {
  const {
    todayScore,
    todayHrv,
    todayRhr,
    todaySleep,
    todayHrvScore,
    todayRhrScore,
    todaySleepScore,
    hrvBaseline,
    rhrBaseline,
    daily,
  } = data

  // ── Check-in cross-reference ─────────────────────────────────────────────
  // Fetch today's subjective check-in and apply a -10 penalty if energy is
  // low (≤2) or stress is high (≥4). Subjective wellness questionnaires
  // predict overtraining more accurately than HRV alone (Saw et al., 2016).
  const [checkinPenalty, setCheckinPenalty] = useState(0)
  const [checkinNote, setCheckinNote] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCheckin() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().slice(0, 10)
      const { data: todayCheckin } = await supabase
        .from('daily_checkins')
        .select('energy_level, mood, stress_level')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (!todayCheckin) return

      const lowEnergy = todayCheckin.energy_level <= 2
      const highStress = todayCheckin.stress_level >= 4

      if (lowEnergy || highStress) {
        setCheckinPenalty(10)
        const reasons: string[] = []
        if (lowEnergy)  reasons.push('low subjective energy')
        if (highStress) reasons.push('high stress')
        setCheckinNote(
          `Score adjusted −10 due to ${reasons.join(' and ')} reported in today's check-in. ` +
          `Subjective wellness is a strong predictor of overtraining (Saw et al., Sports Med 2016).`
        )
      }
    }
    fetchCheckin()
  }, [])

  const adjustedScore = Math.max(0, todayScore - checkinPenalty)

  // Determine today's zone
  let todayZone: ReadinessZone
  if (adjustedScore >= 80)      todayZone = 'optimal'
  else if (adjustedScore >= 60) todayZone = 'good'
  else if (adjustedScore >= 40) todayZone = 'moderate'
  else                          todayZone = 'low'

  const { color: mainColor, label: zoneLabel, textClass: zoneText } = ZONE_CONFIG[todayZone]
  const guidanceItems = getGuidanceItems(todayZone)
  const recommendation = getRecommendation(todayZone)

  const hrvDelta = todayHrv - hrvBaseline
  const rhrDelta = todayRhr - rhrBaseline

  return (
    <div className="space-y-6">

      {/* ── Today's readiness card ────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: `${mainColor}0d`, borderColor: `${mainColor}33` }}
      >
        {/* Top row: gauge + text */}
        <div className="flex items-center gap-5 mb-4">
          <CircularGauge score={adjustedScore} color={mainColor} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">
                Readiness Score
              </p>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${zoneText}`}
                style={{
                  background: `${mainColor}22`,
                  border: `1px solid ${mainColor}44`,
                }}
              >
                {zoneLabel}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{recommendation}</p>
          </div>
        </div>

        {/* Stat chips */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-violet-400">{todayHrv} ms</p>
            <p className="text-xs text-text-secondary mt-0.5">HRV</p>
            <p className="text-[10px] text-text-secondary opacity-50">
              {hrvDelta >= 0 ? '+' : ''}{hrvDelta} vs avg
            </p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-sky-400">{todayRhr} bpm</p>
            <p className="text-xs text-text-secondary mt-0.5">Resting HR</p>
            <p className="text-[10px] text-text-secondary opacity-50">
              {rhrDelta >= 0 ? '+' : ''}{rhrDelta} vs avg
            </p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-indigo-400">{todaySleep}h</p>
            <p className="text-xs text-text-secondary mt-0.5">Sleep</p>
            <p className="text-[10px] text-text-secondary opacity-50">last night</p>
          </div>
        </div>
      </div>

      {/* ── Check-in adjustment note ──────────────────────────────────────── */}
      {checkinNote && (
        <div className="flex gap-2 items-start text-xs text-text-secondary bg-surface-secondary rounded-xl p-3 border border-border">
          <span className="text-yellow-400">●</span>
          <span>{checkinNote}</span>
        </div>
      )}

      {/* ── Training guidance grid ────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Training Guidance</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {guidanceItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border p-3"
              style={{
                background: item.allowed ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)',
                borderColor: item.allowed ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base leading-none">{item.icon}</span>
                <p className="text-xs font-semibold text-text-primary">{item.label}</p>
              </div>
              <p className="text-[11px] text-text-secondary leading-snug">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 30-day trend chart ────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">30-Day Trend</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Dots colored by zone — green: optimal · yellow: good · orange: moderate · red: low
        </p>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="readyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={mainColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={mainColor} stopOpacity={0.0}  />
              </linearGradient>
            </defs>
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
              domain={[20, 100]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [`${val}`, 'Readiness']}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            {/* Optimal threshold */}
            <ReferenceLine
              y={80}
              stroke="#4ade80"
              strokeDasharray="5 3"
              strokeOpacity={0.45}
              label={{ value: 'Optimal (80)', fill: '#4ade80', fontSize: 9, position: 'insideTopRight' }}
            />
            {/* Low threshold */}
            <ReferenceLine
              y={40}
              stroke="#f87171"
              strokeDasharray="5 3"
              strokeOpacity={0.45}
              label={{ value: 'Low (40)', fill: '#f87171', fontSize: 9, position: 'insideBottomRight' }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke={`${mainColor}55`}
              strokeWidth={2}
              fill="url(#readyGrad)"
              dot={<CustomDot />}
              activeDot={{ r: 5, fill: mainColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Score component breakdown ─────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">Score Breakdown</h3>

        {/* HRV component */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <span className="text-sm font-medium text-text-primary">HRV</span>
              <span className="text-xs text-text-secondary ml-2 opacity-70">40% weight</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary tabular-nums">{todayHrv} ms</span>
              <span className="text-sm font-bold tabular-nums text-violet-400">{todayHrvScore}</span>
            </div>
          </div>
          <MiniBar value={todayHrvScore} color="#a78bfa" />
          <p className="text-[11px] text-text-secondary mt-1 opacity-60">
            30-day avg: {hrvBaseline} ms · today: {todayHrv} ms ({hrvDelta >= 0 ? '+' : ''}{hrvDelta} ms)
          </p>
        </div>

        {/* RHR component */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <span className="text-sm font-medium text-text-primary">Resting HR</span>
              <span className="text-xs text-text-secondary ml-2 opacity-70">25% weight</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary tabular-nums">{todayRhr} bpm</span>
              <span className="text-sm font-bold tabular-nums text-sky-400">{todayRhrScore}</span>
            </div>
          </div>
          <MiniBar value={todayRhrScore} color="#38bdf8" />
          <p className="text-[11px] text-text-secondary mt-1 opacity-60">
            30-day avg: {rhrBaseline} bpm · today: {todayRhr} bpm ({rhrDelta >= 0 ? '+' : ''}{rhrDelta} bpm)
          </p>
        </div>

        {/* Sleep component */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <span className="text-sm font-medium text-text-primary">Sleep</span>
              <span className="text-xs text-text-secondary ml-2 opacity-70">35% weight</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary tabular-nums">{todaySleep}h</span>
              <span className="text-sm font-bold tabular-nums text-indigo-400">{todaySleepScore}</span>
            </div>
          </div>
          <MiniBar value={todaySleepScore} color="#818cf8" />
          <p className="text-[11px] text-text-secondary mt-1 opacity-60">
            Target: 8h · today: {todaySleep}h · sub-score scales to 9h ceiling
          </p>
        </div>
      </div>

      {/* ── Zone reference ────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-text-primary">Readiness Zones</h3>
          <p className="text-xs text-text-secondary mt-0.5 opacity-70">Score ranges and what they mean</p>
        </div>
        <div className="divide-y divide-border">
          {(
            [
              { range: '80 – 100', zone: 'optimal' as ReadinessZone, tip: 'Peak performance window — push hard' },
              { range: '60 – 79',  zone: 'good'     as ReadinessZone, tip: 'Quality training day — moderate effort' },
              { range: '40 – 59',  zone: 'moderate' as ReadinessZone, tip: 'Fatigue detected — keep intensity low' },
              { range: '0 – 39',   zone: 'low'      as ReadinessZone, tip: 'Recovery needed — rest or light movement' },
            ] as const
          ).map(({ range, zone, tip }) => {
            const cfg = ZONE_CONFIG[zone]
            return (
              <div
                key={range}
                className={`flex items-center justify-between px-4 py-3 ${cfg.bgClass}`}
              >
                <div>
                  <p className={`text-sm font-semibold tabular-nums ${cfg.textClass}`}>{range}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{tip}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.textClass}`}
                  style={{ background: `${cfg.color}22`, border: `1px solid ${cfg.color}44` }}
                >
                  {cfg.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── How it's calculated ───────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(129,140,248,0.07)', borderColor: 'rgba(129,140,248,0.25)' }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-none mt-0.5">🧮</span>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-indigo-400 mb-1">How Readiness is Calculated</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Your score blends three physiological signals — each normalized to a 0–100 sub-score —
                then combined with fixed weights:
              </p>
            </div>
            <div className="space-y-2">
              {[
                { label: 'HRV (40%)',        detail: 'Heart rate variability vs your 30-day average. Higher HRV = better autonomic recovery.',  color: '#a78bfa' },
                { label: 'Sleep (35%)',       detail: 'Last night\'s total sleep hours scaled against a 9-hour ceiling target.',                   color: '#818cf8' },
                { label: 'Resting HR (25%)',  detail: 'Lower resting HR relative to your baseline signals less cardiovascular stress.',           color: '#38bdf8' },
              ].map(({ label, detail, color }) => (
                <div key={label} className="flex gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-none" style={{ background: color }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color }}>{label}</p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed opacity-80">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-secondary opacity-50 pt-1">
              This is a guide, not a rigid rule. If you feel strong but the score says rest, trust your
              body — and vice versa. Individual variation always matters.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

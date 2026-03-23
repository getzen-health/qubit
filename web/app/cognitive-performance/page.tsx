'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, Brain, Moon, Activity, Dumbbell, TrendingUp, Minus } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

// ─── Design tokens ───────────────────────────────────────────────────────────

const CYAN    = '#22d3ee'
const AMBER   = '#fbbf24'
const GREEN   = '#4ade80'
const RED     = '#f87171'

// ─── Mock data ───────────────────────────────────────────────────────────────

// Today: good recovery day
const TODAY_SCORE = 88
const TODAY_SLEEP_SCORE = 92   // 7.4 h
const TODAY_HRV_SCORE   = 85   // HRV 72 ms vs 7d avg 64 ms (+12.5%)
const TODAY_LOAD_SCORE  = 87   // TSB form: +6 (fresh)

// 30-day history — realistic mix of sleep-deprived and good recovery days
const HISTORY: { date: string; score: number; sleep: number; hrv: number; load: number }[] = [
  // Feb 19 – Mar 19 (30 days, oldest → newest)
  { date: 'Feb 19', score: 74, sleep: 72, hrv: 78, load: 72 },
  { date: 'Feb 20', score: 81, sleep: 85, hrv: 80, load: 78 },
  { date: 'Feb 21', score: 44, sleep: 30, hrv: 52, load: 50 }, // sleep-deprived (5h)
  { date: 'Feb 22', score: 38, sleep: 22, hrv: 44, load: 48 }, // severe sleep dep (4.5h)
  { date: 'Feb 23', score: 62, sleep: 70, hrv: 58, load: 58 }, // recovery starting
  { date: 'Feb 24', score: 78, sleep: 80, hrv: 75, load: 79 },
  { date: 'Feb 25', score: 83, sleep: 87, hrv: 82, load: 80 },
  { date: 'Feb 26', score: 91, sleep: 95, hrv: 90, load: 88 }, // peak day
  { date: 'Feb 27', score: 72, sleep: 65, hrv: 78, load: 73 },
  { date: 'Feb 28', score: 68, sleep: 60, hrv: 71, load: 73 },
  { date: 'Mar 01', score: 55, sleep: 42, hrv: 60, load: 63 }, // poor sleep (6h)
  { date: 'Mar 02', score: 48, sleep: 28, hrv: 55, load: 61 }, // terrible sleep (5h)
  { date: 'Mar 03', score: 43, sleep: 20, hrv: 50, load: 59 }, // worst stretch
  { date: 'Mar 04', score: 67, sleep: 75, hrv: 64, load: 62 }, // bouncing back
  { date: 'Mar 05', score: 76, sleep: 78, hrv: 74, load: 76 },
  { date: 'Mar 06', score: 82, sleep: 84, hrv: 82, load: 80 },
  { date: 'Mar 07', score: 89, sleep: 93, hrv: 87, load: 87 }, // top day
  { date: 'Mar 08', score: 77, sleep: 75, hrv: 80, load: 76 },
  { date: 'Mar 09', score: 70, sleep: 68, hrv: 72, load: 70 },
  { date: 'Mar 10', score: 63, sleep: 55, hrv: 67, load: 67 }, // moderate dip
  { date: 'Mar 11', score: 57, sleep: 48, hrv: 60, load: 63 }, // tired
  { date: 'Mar 12', score: 74, sleep: 78, hrv: 72, load: 72 },
  { date: 'Mar 13', score: 80, sleep: 82, hrv: 79, load: 79 },
  { date: 'Mar 14', score: 85, sleep: 88, hrv: 84, load: 83 },
  { date: 'Mar 15', score: 78, sleep: 79, hrv: 77, load: 78 },
  { date: 'Mar 16', score: 71, sleep: 68, hrv: 74, load: 71 },
  { date: 'Mar 17', score: 66, sleep: 58, hrv: 70, load: 70 },
  { date: 'Mar 18', score: 79, sleep: 82, hrv: 78, load: 77 },
  { date: 'Mar 19', score: 84, sleep: 86, hrv: 83, load: 83 },
  { date: 'Mar 20', score: TODAY_SCORE, sleep: TODAY_SLEEP_SCORE, hrv: TODAY_HRV_SCORE, load: TODAY_LOAD_SCORE },
]

// Best 5 days
const BEST_DAYS = [...HISTORY]
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)

// ─── Score classification ─────────────────────────────────────────────────────

type CogLevel = 'Peak' | 'High' | 'Moderate' | 'Impaired'

function classifyScore(score: number): CogLevel {
  if (score > 85) return 'Peak'
  if (score >= 70) return 'High'
  if (score >= 50) return 'Moderate'
  return 'Impaired'
}

const LEVEL_CONFIG: Record<CogLevel, {
  color: string
  bg: string
  border: string
  text: string
  advice: string
  emoji: string
}> = {
  Peak:     { color: CYAN,  bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30',   text: 'text-cyan-300',  advice: 'Excellent day for decisions, creativity & complex problem-solving.',       emoji: '⚡' },
  High:     { color: GREEN, bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400', advice: 'Good cognitive function — suited for most analytical and strategic work.',  emoji: '✓'  },
  Moderate: { color: AMBER, bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400', advice: 'Moderate capacity. Avoid high-stakes decisions; rely on checklists.',         emoji: '↕'  },
  Impaired: { color: RED,   bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',   advice: 'Sleep debt is degrading executive function. Rest before critical work.',     emoji: '⚠' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreAreaColor(score: number): string {
  if (score > 85) return CYAN
  if (score >= 70) return GREEN
  if (score >= 50) return AMBER
  return RED
}

function tooltipBg() {
  return {
    background: '#0f172a',
    border: '1px solid rgba(34,211,238,0.2)',
    borderRadius: 10,
    fontSize: 12,
    padding: '8px 12px',
  }
}

// ─── Radial score arc (pure SVG) ──────────────────────────────────────────────

function ScoreArc({ score }: { score: number }) {
  const R = 80
  const cx = 100
  const cy = 100
  const sweep = 220 // degrees of arc
  const startAngle = (180 + (360 - sweep) / 2) * (Math.PI / 180)
  const fraction = score / 100

  function polarToXY(angleDeg: number, r: number) {
    const rad = (angleDeg - 90) * (Math.PI / 180)
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  function arcPath(startDeg: number, endDeg: number, r: number) {
    const s = polarToXY(startDeg, r)
    const e = polarToXY(endDeg, r)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const startDeg = -90 + (360 - sweep) / 2
  const endDeg   = startDeg + sweep
  const fillEnd  = startDeg + sweep * fraction

  const level = classifyScore(score)
  const color = LEVEL_CONFIG[level].color

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 18px rgba(34,211,238,0.18))' }}>
      {/* Track */}
      <path
        d={arcPath(startDeg, endDeg, R)}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={12}
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={arcPath(startDeg, fillEnd, R)}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
      {/* Tick marks */}
      {[0, 25, 50, 70, 85, 100].map((v) => {
        const deg = startDeg + sweep * (v / 100)
        const inner = polarToXY(deg, R - 8)
        const outer = polarToXY(deg, R + 8)
        const isThreshold = v === 50 || v === 70 || v === 85
        return (
          <line
            key={v}
            x1={inner.x} y1={inner.y}
            x2={outer.x} y2={outer.y}
            stroke={isThreshold ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}
            strokeWidth={isThreshold ? 1.5 : 1}
          />
        )
      })}
    </svg>
  )
}

// ─── Component bar ────────────────────────────────────────────────────────────

function ComponentBar({
  label,
  score,
  detail,
  weight,
  icon,
  color,
}: {
  label: string
  score: number
  detail: string
  weight: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color }}>{icon}</span>
          <span className="text-sm font-semibold text-slate-200">{label}</span>
          <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 bg-slate-800/80 rounded-full border border-slate-700/60">
            {weight}
          </span>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
      </div>
      <div className="relative h-2.5 rounded-full overflow-hidden bg-slate-800/80">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: color,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">{detail}</p>
    </div>
  )
}

// ─── Custom area chart tooltip ────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; dataKey: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const score = payload[0]?.value ?? 0
  const level = classifyScore(score)
  const cfg = LEVEL_CONFIG[level]
  return (
    <div style={tooltipBg()} className="shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="font-bold text-base tabular-nums" style={{ color: cfg.color }}>
        {score}
      </p>
      <p className={`text-xs mt-0.5 ${cfg.text}`}>{level}</p>
    </div>
  )
}

// ─── Best days table ──────────────────────────────────────────────────────────

function BestDaysTable() {
  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Top 5 Days — Last 30</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800/80">
            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 uppercase tracking-wider">Score</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 uppercase tracking-wider">Level</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {BEST_DAYS.map((day, i) => {
            const level = classifyScore(day.score)
            const cfg = LEVEL_CONFIG[level]
            return (
              <tr key={day.date} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-slate-300 text-sm">
                  <span className="text-slate-500 tabular-nums text-xs mr-2.5">#{i + 1}</span>
                  {day.date}
                </td>
                <td className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: cfg.color }}>
                  {day.score}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                    {level}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CognitivePerformancePage() {
  const todayLevel = classifyScore(TODAY_SCORE)
  const cfg = LEVEL_CONFIG[todayLevel]

  // HRV trend indicator
  const hrvDelta = +12.5  // % above 7d avg
  const loadTSB  = +6     // TSB form value

  // Average score
  const avgScore = Math.round(HISTORY.reduce((s, d) => s + d.score, 0) / HISTORY.length)

  // Count days per level
  const levelCounts = HISTORY.reduce(
    (acc, d) => {
      const l = classifyScore(d.score)
      acc[l] = (acc[l] ?? 0) + 1
      return acc
    },
    {} as Record<CogLevel, number>
  )

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #020817 0%, #0c1a2e 40%, #050d18 100%)',
        fontFamily: 'ui-monospace, "SF Mono", "Fira Code", monospace',
      }}
    >
      {/* Ambient grid lines for depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.028) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(2,8,23,0.85)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(34,211,238,0.12)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Explore
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
              Cognitive Performance
            </span>
          </div>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* ── Hero Score Card ──────────────────────────────────────────────── */}
        <div
          className={`rounded-2xl border p-6 ${cfg.bg} ${cfg.border}`}
          style={{ boxShadow: `0 0 40px ${cfg.color}18, 0 4px 24px rgba(0,0,0,0.5)` }}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-1">
                Today · Mar 20
              </p>
              <p className="text-xs text-slate-400">Daily Brain Readiness Score</p>
            </div>
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.text}`}
            >
              <span>{cfg.emoji}</span>
              {todayLevel}
            </span>
          </div>

          <div className="flex items-center gap-6 mt-4">
            {/* Radial arc */}
            <div className="relative shrink-0 w-32 h-32">
              <ScoreArc score={TODAY_SCORE} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-4xl font-black tabular-nums leading-none"
                  style={{ color: cfg.color, textShadow: `0 0 24px ${cfg.color}66` }}
                >
                  {TODAY_SCORE}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 tracking-wider">/ 100</span>
              </div>
            </div>

            {/* Advice + level scale */}
            <div className="flex-1 space-y-3 min-w-0">
              <p className="text-sm text-slate-200 leading-relaxed font-sans" style={{ fontFamily: 'system-ui, sans-serif' }}>
                {cfg.advice}
              </p>
              {/* Level scale */}
              <div className="space-y-1">
                {(['Peak', 'High', 'Moderate', 'Impaired'] as CogLevel[]).map((l) => {
                  const active = l === todayLevel
                  const lCfg = LEVEL_CONFIG[l]
                  return (
                    <div key={l} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: active ? lCfg.color : 'rgba(255,255,255,0.1)', boxShadow: active ? `0 0 6px ${lCfg.color}` : 'none' }}
                      />
                      <span
                        className={`text-[11px] font-medium ${active ? lCfg.text : 'text-slate-600'}`}
                      >
                        {l}
                        {l === 'Peak' && ' > 85'}
                        {l === 'High' && ' 70–85'}
                        {l === 'Moderate' && ' 50–70'}
                        {l === 'Impaired' && ' < 50'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4" style={{ borderTop: 'rgba(255,255,255,0.07) 1px solid' }}>
            <div className="text-center">
              <p className="text-lg font-black tabular-nums text-cyan-300">7.4h</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Sleep</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black tabular-nums text-cyan-300">72 ms</p>
              <p className="text-[10px] text-slate-500 mt-0.5">HRV Today</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black tabular-nums text-cyan-300">+6 TSB</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Form (fresh)</p>
            </div>
          </div>
        </div>

        {/* ── Component Breakdown ──────────────────────────────────────────── */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 p-5 space-y-6">
          <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
            Score Components
          </h2>

          <ComponentBar
            label="Sleep Quality"
            score={TODAY_SLEEP_SCORE}
            weight="40%"
            detail="7.4 h vs 8 h target — 92.5% of ideal. Killgore 2010: prefrontal cortex function degrades dose-dependently with sleep loss."
            icon={<Moon className="w-4 h-4" />}
            color={CYAN}
          />

          <div className="h-px bg-slate-800/60" />

          <ComponentBar
            label="HRV Baseline"
            score={TODAY_HRV_SCORE}
            weight="30%"
            detail={`Today 72 ms vs 7d avg 64 ms (${hrvDelta > 0 ? '+' : ''}${hrvDelta}%). Boksem 2006: reduced HRV predicts sustained attention failures and cognitive errors.`}
            icon={<Activity className="w-4 h-4" />}
            color={GREEN}
          />

          <div className="h-px bg-slate-800/60" />

          <ComponentBar
            label="Training Load (TSB Form)"
            score={TODAY_LOAD_SCORE}
            weight="30%"
            detail={`TSB form +${loadTSB}: positive score means nervous system is fresh, not fatigued. Higher TSB = lower cognitive overhead from physical recovery.`}
            icon={<Dumbbell className="w-4 h-4" />}
            color={AMBER}
          />
        </div>

        {/* ── 30-Day Area Chart ────────────────────────────────────────────── */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
              30-Day Cognitive Score
            </h2>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span>Avg <span className="text-slate-300 font-bold">{avgScore}</span></span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={HISTORY} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="cogGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={CYAN} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={CYAN} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              {/* Level threshold lines */}
              <ReferenceLine y={85} stroke={CYAN}  strokeDasharray="3 3" strokeOpacity={0.35} label={{ value: 'Peak', position: 'right', fontSize: 9, fill: CYAN }}  />
              <ReferenceLine y={70} stroke={GREEN} strokeDasharray="3 3" strokeOpacity={0.35} label={{ value: 'High', position: 'right', fontSize: 9, fill: GREEN }} />
              <ReferenceLine y={50} stroke={AMBER} strokeDasharray="3 3" strokeOpacity={0.35} label={{ value: 'Mod',  position: 'right', fontSize: 9, fill: AMBER }} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 70, 85, 100]}
                tick={{ fontSize: 9, fill: '#475569' }}
                width={28}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke={CYAN}
                strokeWidth={2}
                fill="url(#cogGrad)"
                dot={false}
                activeDot={{ r: 4, fill: CYAN, stroke: '#020817', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Level legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-slate-500">
            {([['Peak', CYAN, '>85'], ['High', GREEN, '70–85'], ['Moderate', AMBER, '50–70'], ['Impaired', RED, '<50']] as const).map(([l, c, r]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
                {l} ({r})
              </span>
            ))}
          </div>
        </div>

        {/* ── 30-Day Distribution ──────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {(['Peak', 'High', 'Moderate', 'Impaired'] as CogLevel[]).map((l) => {
            const lCfg = LEVEL_CONFIG[l]
            const count = levelCounts[l] ?? 0
            const pct = Math.round((count / HISTORY.length) * 100)
            return (
              <div
                key={l}
                className={`rounded-xl border p-3 text-center ${lCfg.bg} ${lCfg.border}`}
              >
                <p className="text-xl font-black tabular-nums" style={{ color: lCfg.color }}>{count}</p>
                <p className={`text-[10px] font-semibold mt-0.5 ${lCfg.text}`}>{l}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{pct}% of days</p>
              </div>
            )
          })}
        </div>

        {/* ── HRV & Sleep Trend Signals ────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {/* HRV vs baseline */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-xs font-semibold text-slate-300">HRV vs Baseline</span>
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums text-green-400">+12.5%</p>
              <p className="text-[10px] text-slate-500">above 7-day rolling avg</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-green-400 font-medium">
              <TrendingUp className="w-3 h-3" />
              Autonomic recovery strong
            </div>
          </div>

          {/* Sleep debt */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300">Sleep Debt</span>
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums text-cyan-400">−0.6h</p>
              <p className="text-[10px] text-slate-500">vs 8h target · 7d avg</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-medium">
              <Minus className="w-3 h-3" />
              Minimal debt accumulation
            </div>
          </div>
        </div>

        {/* ── Best 5 Days Table ────────────────────────────────────────────── */}
        <BestDaysTable />

        {/* ── Science Card ─────────────────────────────────────────────────── */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
              Scientific Basis
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                ref: 'Killgore 2010 — Neurosci Biobehav Rev',
                note: 'Sleep deprivation impairs prefrontal cortex function in a dose-dependent, cumulative manner. Executive decisions, working memory, and creative thinking are the first faculties compromised — even when subjects do not feel sleepy.',
              },
              {
                ref: 'Harrison & Horne 2000 — Occup Environ Med',
                note: '17 hours of continuous wakefulness produces cognitive impairment equivalent to a 0.05% blood alcohol content — the legal driving limit in many jurisdictions. Longer wakefulness approaches 0.10% BAC impairment.',
              },
              {
                ref: 'Czeisler 2011 — Science',
                note: 'Chronic restriction to 6 h/night for two weeks accumulates a cognitive deficit indistinguishable from total sleep deprivation, yet subjects report feeling only "slightly sleepy" — illustrating a dangerous lack of interoceptive awareness of impairment.',
              },
              {
                ref: 'Boksem et al. 2006 — Brain Res Rev',
                note: 'Reduced heart rate variability (HRV) predicts sustained attention failures and cognitive errors. HRV reflects the autonomic nervous system\'s capacity to modulate arousal, making it a proxy for top-down cognitive control readiness.',
              },
            ].map((item) => (
              <div key={item.ref} className="space-y-1">
                <p className="text-[11px] font-bold text-slate-300">{item.ref}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  {item.note}
                </p>
              </div>
            ))}
          </div>

          {/* Score formula */}
          <div
            className="rounded-xl p-3 mt-2"
            style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.12)' }}
          >
            <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1.5">Score Formula</p>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
              Score = Sleep (40%) + HRV (30%) + Training Load (30%)
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Sleep component: (actual hours ÷ 8) × 100, capped at 100. HRV: today vs 7-day rolling baseline — above baseline scores above 75. Training load: TSB form proxy from ATL/CTL model (positive TSB = fresher nervous system).
            </p>
          </div>

          <p className="text-[10px] text-slate-600 leading-relaxed border-t border-slate-800 pt-3" style={{ fontFamily: 'system-ui, sans-serif' }}>
            This score is informational and not a medical assessment. It is intended to support self-awareness around optimal cognitive timing, not to replace professional medical or psychological advice.
          </p>
        </div>

      </main>
    </div>
  )
}

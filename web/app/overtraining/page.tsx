'use client'

import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Activity, Moon, TrendingDown, TrendingUp, BookOpen, ChevronRight } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

// ─── Static demo data ──────────────────────────────────────────────────────

const RISK_SCORE = 4
const MAX_SCORE = 12

// 7-week trend (oldest → newest)
const weeklyTrend = [
  { week: 'Wk 1', score: 1, label: 'Week 1' },
  { week: 'Wk 2', score: 2, label: 'Week 2' },
  { week: 'Wk 3', score: 1, label: 'Week 3' },
  { week: 'Wk 4', score: 3, label: 'Week 4' },
  { week: 'Wk 5', score: 3, label: 'Week 5' },
  { week: 'Wk 6', score: 3, label: 'Week 6' },
  { week: 'Wk 7', score: 4, label: 'Week 7 (now)', current: true },
]

// ─── Shared styles ─────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Risk level helpers ────────────────────────────────────────────────────

type RiskLevel = 'ok' | 'monitor' | 'reduce' | 'rest'

function getRiskLevel(score: number): RiskLevel {
  if (score <= 2) return 'ok'
  if (score <= 4) return 'monitor'
  if (score <= 7) return 'reduce'
  return 'rest'
}

const RISK_CONFIGS: Record<RiskLevel, { label: string; color: string; bg: string; border: string; text: string }> = {
  ok:      { label: 'OK',             color: '#22c55e', bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400' },
  monitor: { label: 'Monitor Closely', color: '#eab308', bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400' },
  reduce:  { label: 'Reduce Load',     color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  rest:    { label: 'Rest Now',        color: '#ef4444', bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400' },
}

function zoneColor(score: number): string {
  const level = getRiskLevel(score)
  return RISK_CONFIGS[level].color
}

// ─── Signal dot renderer ────────────────────────────────────────────────────

function SignalDots({ filled, total }: { filled: number; total: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${i < filled ? 'bg-amber-400' : 'bg-surface-secondary border border-border'}`}
        />
      ))}
    </div>
  )
}

// ─── Risk gauge progress bar ────────────────────────────────────────────────

function RiskGauge({ score, max }: { score: number; max: number }) {
  const pct = (score / max) * 100

  return (
    <div className="space-y-2">
      <div className="relative h-3 rounded-full overflow-hidden bg-surface-secondary">
        {/* Zone bands */}
        <div className="absolute inset-0 flex">
          <div className="h-full bg-green-500/30"  style={{ width: `${(3 / max) * 100}%` }} />
          <div className="h-full bg-amber-500/30"  style={{ width: `${(2 / max) * 100}%` }} />
          <div className="h-full bg-orange-500/30" style={{ width: `${(3 / max) * 100}%` }} />
          <div className="h-full bg-red-500/30"    style={{ width: `${(4 / max) * 100}%` }} />
        </div>
        {/* Fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: zoneColor(score) }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md -ml-1.5"
          style={{ left: `${pct}%`, backgroundColor: zoneColor(score) }}
        />
      </div>

      {/* Threshold labels */}
      <div className="relative flex text-[10px] text-text-secondary">
        <span className="absolute" style={{ left: `${(0 / max) * 100}%` }}>0</span>
        <span
          className="absolute -translate-x-1/2 text-green-400 font-medium"
          style={{ left: `${(1.5 / max) * 100}%` }}
        >
          OK
        </span>
        <span
          className="absolute -translate-x-1/2 border-l border-border pl-1"
          style={{ left: `${(3 / max) * 100}%` }}
        >
          3
        </span>
        <span
          className="absolute -translate-x-1/2 text-amber-400 font-medium"
          style={{ left: `${(3.5 / max) * 100}%` }}
        >
          Monitor
        </span>
        <span
          className="absolute -translate-x-1/2 border-l border-border pl-1"
          style={{ left: `${(5 / max) * 100}%` }}
        >
          5
        </span>
        <span
          className="absolute -translate-x-1/2 text-orange-400 font-medium"
          style={{ left: `${(6 / max) * 100}%` }}
        >
          Reduce
        </span>
        <span
          className="absolute -translate-x-1/2 border-l border-border pl-1"
          style={{ left: `${(8 / max) * 100}%` }}
        >
          8
        </span>
        <span
          className="absolute -translate-x-1/2 text-red-400 font-medium"
          style={{ left: `${(10 / max) * 100}%` }}
        >
          Rest
        </span>
        <span className="absolute right-0">{max}</span>
      </div>
    </div>
  )
}

// ─── Custom tooltip for trend chart ────────────────────────────────────────

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const score = payload[0].value
  const level = getRiskLevel(score)
  const cfg = RISK_CONFIGS[level]
  return (
    <div style={tooltipStyle} className="px-3 py-2 shadow-xl">
      <p className="text-text-secondary text-xs mb-1">{label}</p>
      <p className="font-semibold text-sm">
        Score: <span style={{ color: cfg.color }}>{score}/12</span>
      </p>
      <p className={`text-xs mt-0.5 ${cfg.text}`}>{cfg.label}</p>
    </div>
  )
}

// ─── Dot renderer for trend line ────────────────────────────────────────────

function TrendDot(props: { cx?: number; cy?: number; payload?: { score: number; current?: boolean } }) {
  const { cx, cy, payload } = props
  if (cx === undefined || cy === undefined || !payload) return null
  const color = zoneColor(payload.score)
  const r = payload.current ? 7 : 5
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={color}
      stroke={payload.current ? 'white' : color}
      strokeWidth={payload.current ? 2 : 0}
    />
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function OvertrainingPage() {
  const riskLevel = getRiskLevel(RISK_SCORE)
  const riskCfg = RISK_CONFIGS[riskLevel]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/training-load"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Overtraining Warning</h1>
            <p className="text-sm text-text-secondary">
              Early detection of overtraining syndrome using 4 biomarkers
            </p>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">

        {/* ── Risk Gauge Card ──────────────────────────────────────────────── */}
        <div className={`rounded-2xl border p-5 ${riskCfg.bg} ${riskCfg.border}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                OTS Risk Score
              </p>
              <div className="flex items-end gap-2">
                <span className="text-6xl font-black tabular-nums" style={{ color: riskCfg.color }}>
                  {RISK_SCORE}
                </span>
                <span className="text-2xl font-light text-text-secondary mb-2">/ {MAX_SCORE}</span>
              </div>
            </div>
            <span
              className={`mt-1 px-3 py-1.5 rounded-full text-sm font-semibold border ${riskCfg.bg} ${riskCfg.border} ${riskCfg.text}`}
            >
              {riskCfg.label}
            </span>
          </div>

          <RiskGauge score={RISK_SCORE} max={MAX_SCORE} />

          <p className="text-xs text-text-secondary mt-4 leading-relaxed">
            Composite score from HRV trend, resting heart rate, acute:chronic workload ratio, and
            sleep duration. Updated weekly.
          </p>
        </div>

        {/* ── Signal Grid ──────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Biomarker Signals
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {/* HRV Trend */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-text-primary">HRV Trend</span>
                </div>
                <SignalDots filled={1} total={3} />
              </div>
              <div>
                <p className="text-xl font-bold text-text-primary tabular-nums">52 ms</p>
                <p className="text-xs text-text-secondary">7d avg</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">30d baseline: 58 ms</span>
                <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
                  <TrendingDown className="w-3.5 h-3.5" />
                  −10% below baseline
                </span>
              </div>
              <div className="h-px bg-border" />
              <p className="text-xs text-text-secondary leading-relaxed">
                HRV suppression &gt;8% for &gt;5 days is an early OTS indicator (Plews 2013).
              </p>
            </div>

            {/* Resting HR */}
            <div className="bg-surface rounded-2xl border border-amber-500/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-semibold text-text-primary">Resting HR</span>
                </div>
                <SignalDots filled={2} total={3} />
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400 tabular-nums">52 bpm</p>
                <p className="text-xs text-text-secondary">current</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Baseline: 49 bpm</span>
                <span className="flex items-center gap-1 text-xs font-medium text-orange-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +3 bpm elevated
                </span>
              </div>
              <div className="h-px bg-border" />
              <p className="text-xs text-text-secondary leading-relaxed">
                Resting HR rising &gt;5 bpm above baseline for several consecutive days may signal
                accumulated fatigue.
              </p>
            </div>

            {/* ACWR */}
            <div className="bg-surface rounded-2xl border border-amber-500/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-text-primary">ACWR</span>
                </div>
                <SignalDots filled={1} total={3} />
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400 tabular-nums">1.42</p>
                <p className="text-xs text-text-secondary">acute : chronic workload ratio</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Safe zone: 0.8 – 1.3</span>
                <span className="text-xs font-medium text-amber-400">Caution zone</span>
              </div>
              <div className="h-px bg-border" />
              <p className="text-xs text-text-secondary leading-relaxed">
                ACWR &gt;1.3 increases injury and overtraining risk substantially (Gabbett 2016).
                Ratios &gt;1.5 are high-risk.
              </p>
            </div>

            {/* Sleep Duration */}
            <div className="bg-surface rounded-2xl border border-green-500/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-text-primary">Sleep Duration</span>
                </div>
                <SignalDots filled={0} total={3} />
              </div>
              <div>
                <p className="text-xl font-bold text-green-400 tabular-nums">7.1 h</p>
                <p className="text-xs text-text-secondary">7d avg</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">30d avg: 7.6 h</span>
                <span className="text-xs font-medium text-green-400">Maintained</span>
              </div>
              <div className="h-px bg-border" />
              <p className="text-xs text-text-secondary leading-relaxed">
                Sleep &lt;7 h impairs recovery and amplifies HPA axis dysregulation. Currently
                adequate, monitor for downward drift.
              </p>
            </div>

          </div>
        </div>

        {/* ── 7-Week Trend Chart ────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            7-Week OTS Risk Trend
          </h2>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyTrend} margin={{ top: 12, right: 16, left: -8, bottom: 4 }}>
              {/* Zone bands */}
              <ReferenceArea y1={0}  y2={2}  fill="#22c55e" fillOpacity={0.07} />
              <ReferenceArea y1={2}  y2={4}  fill="#eab308" fillOpacity={0.10} />
              <ReferenceArea y1={4}  y2={7}  fill="#f97316" fillOpacity={0.10} />
              <ReferenceArea y1={7}  y2={12} fill="#ef4444" fillOpacity={0.10} />

              {/* Zone threshold lines */}
              <ReferenceLine
                y={3}
                stroke="#eab308"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{ value: 'Monitor', position: 'right', fontSize: 9, fill: '#eab308' }}
              />
              <ReferenceLine
                y={5}
                stroke="#f97316"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{ value: 'Reduce', position: 'right', fontSize: 9, fill: '#f97316' }}
              />
              <ReferenceLine
                y={8}
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{ value: 'Rest', position: 'right', fontSize: 9, fill: '#ef4444' }}
              />

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 12]}
                ticks={[0, 2, 4, 6, 8, 10, 12]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={24}
              />
              <Tooltip content={<TrendTooltip />} />

              <Line
                type="monotone"
                dataKey="score"
                stroke="#eab308"
                strokeWidth={2.5}
                dot={<TrendDot />}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />OK (0–2)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Monitor (3–4)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />Reduce (5–7)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Rest (8+)
            </span>
          </div>
        </div>

        {/* ── Recommendations ──────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-amber-500/25 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <h2 className="text-sm font-semibold text-amber-300">
              Recommendations — Monitor Closely
            </h2>
          </div>

          <div className="space-y-2.5">
            {[
              {
                icon: '1',
                title: 'Add an easy day this week',
                detail:
                  'Replace one moderate or hard session with a 30–40 min easy-effort activity (walk, light swim, Zone 1 ride). ACWR is elevated and HRV is trending down.',
              },
              {
                icon: '2',
                title: 'Prioritise 8 h sleep tonight',
                detail:
                  'Sleep is the primary adaptation window. Targeting 8+ h for the next 5 nights will support HPA axis regulation and HRV recovery.',
              },
              {
                icon: '3',
                title: 'Wait 3–5 days before intensifying',
                detail:
                  'Do not add new speed sessions, race efforts, or volume increases until both HRV returns to within 5% of baseline and resting HR normalises.',
              },
            ].map((rec) => (
              <div
                key={rec.icon}
                className="flex gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                  {rec.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{rec.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{rec.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── OTS Signal Score Key ─────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            How the Score is Built
          </h2>
          <div className="space-y-2">
            {[
              { signal: 'HRV Trend', weight: '0–3 pts', desc: '0 = within 5% of baseline  |  1 = 5–10% below  |  2 = 10–20% below  |  3 = >20% below' },
              { signal: 'Resting HR', weight: '0–3 pts', desc: '0 = baseline ±1 bpm  |  1 = +2–3 bpm  |  2 = +4–5 bpm  |  3 = >5 bpm above baseline' },
              { signal: 'ACWR', weight: '0–3 pts', desc: '0 = 0.8–1.3 (optimal)  |  1 = 1.3–1.5 (caution)  |  2 = 1.5–2.0 (high)  |  3 = >2.0 or <0.5' },
              { signal: 'Sleep Duration', weight: '0–3 pts', desc: '0 = ≥7.5 h  |  1 = 7.0–7.5 h  |  2 = 6.0–7.0 h  |  3 = <6 h' },
            ].map((row) => (
              <div key={row.signal} className="grid grid-cols-[1fr_auto] gap-2">
                <div>
                  <p className="text-xs font-medium text-text-primary">{row.signal}</p>
                  <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">{row.desc}</p>
                </div>
                <span className="text-xs font-semibold text-amber-400 whitespace-nowrap self-start mt-0.5">
                  {row.weight}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-secondary mt-3 leading-relaxed border-t border-border pt-3">
            Total: 0–12. Scores reflect relative burden in each domain — a single signal at 3 pts
            still warrants attention even if the composite is low.
          </p>
        </div>

        {/* ── Science Panel ────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-text-secondary" />
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Scientific Basis
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                ref: 'Meeusen et al. 2013 — European Consensus',
                note:
                  'Established the OTS classification: functional overreaching (FOR, days–weeks to recover), non-functional overreaching (NFOR, weeks–months), and overtraining syndrome (OTS, months+). Early detection of the FOR→NFOR transition is the goal of this tool.',
              },
              {
                ref: 'Plews et al. 2013 — HRV as Early Warning',
                note:
                  'Daily HRV monitoring using a 7-day rolling average compared against a 30-day baseline detects sympathetic–parasympathetic imbalance before subjective fatigue becomes apparent. A >8% rolling suppression is a clinically meaningful flag.',
              },
              {
                ref: 'Gabbett 2016 — ACWR & Injury Risk',
                note:
                  'The acute:chronic workload ratio (7-day load ÷ 28-day chronic load) identifies the "danger zone" above 1.5. Staying within 0.8–1.3 ("sweet spot") minimises both undertraining and injury/OTS risk.',
              },
              {
                ref: 'Functional vs Non-Functional Overreaching',
                note:
                  'FOR is a normal part of progressive overload — performance dips but recovers within days with rest. NFOR involves persistent HRV suppression, mood disturbance, and performance decrements lasting weeks. OTS is the severe endpoint requiring months of recovery and often clinical intervention.',
              },
            ].map((item) => (
              <div key={item.ref} className="space-y-1">
                <p className="text-xs font-semibold text-text-primary">{item.ref}</p>
                <p className="text-[11px] text-text-secondary leading-relaxed">{item.note}</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-text-secondary border-t border-border pt-3 leading-relaxed">
            This tool provides informational estimates only and is not a medical diagnosis. Consult a
            sports medicine physician or certified coach if you suspect overtraining syndrome.
          </p>
        </div>

      </main>
    </div>
  )
}

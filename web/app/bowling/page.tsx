'use client'

import Link from 'next/link'
import { ArrowLeft, Target, Activity, Shield, Brain, Trophy, Zap, Info } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'

// ─── Accent color ──────────────────────────────────────────────────────────────
const BLUE = '#3b82f6'
const BLUE_LIGHT = '#60a5fa'
const BLUE_DARK = '#1d4ed8'
const SLATE = '#64748b'

// ─── Tooltip style ─────────────────────────────────────────────────────────────
const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  fontSize: 12,
  color: '#f1f5f9',
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const sessionTypeData = [
  { type: 'League', count: 38, color: BLUE },
  { type: 'Practice', count: 24, color: '#818cf8' },
  { type: 'Open Bowling', count: 17, color: '#6ee7b7' },
  { type: 'Short (<40 min)', count: 9, color: SLATE },
]

const weeklyCaloriesData = [
  { week: 'Jan 20', calories: 312, sessions: 2 },
  { week: 'Jan 27', calories: 478, sessions: 3 },
  { week: 'Feb 3', calories: 391, sessions: 2 },
  { week: 'Feb 10', calories: 544, sessions: 3 },
  { week: 'Feb 17', calories: 427, sessions: 2 },
  { week: 'Feb 24', calories: 601, sessions: 4 },
  { week: 'Mar 3', calories: 489, sessions: 3 },
  { week: 'Mar 10', calories: 523, sessions: 3 },
]

const scoreTrendData = [
  { week: 'Jan W1', avg: 158, clean: 62, spare: 71 },
  { week: 'Jan W2', avg: 163, clean: 65, spare: 74 },
  { week: 'Jan W3', avg: 161, clean: 63, spare: 73 },
  { week: 'Jan W4', avg: 168, clean: 68, spare: 77 },
  { week: 'Feb W1', avg: 171, clean: 70, spare: 78 },
  { week: 'Feb W2', avg: 174, clean: 72, spare: 80 },
  { week: 'Feb W3', avg: 169, clean: 69, spare: 76 },
  { week: 'Feb W4', avg: 178, clean: 74, spare: 82 },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatPill({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 text-center">
      <p className="text-2xl font-bold tabular-nums" style={{ color: color ?? BLUE_LIGHT }}>
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function SectionCard({
  title,
  icon,
  children,
  accent,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  accent?: string
}) {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div
        className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-700"
        style={{ borderLeftColor: accent ?? BLUE, borderLeftWidth: 3 }}
      >
        <span style={{ color: accent ?? BLUE }}>{icon}</span>
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function ResearchRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-700/60 last:border-0">
      <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
      <div>
        <span className="text-xs font-medium text-slate-200">{label} </span>
        <span className="text-xs text-slate-400">{detail}</span>
      </div>
    </div>
  )
}

function MetricBar({
  label,
  value,
  max,
  unit,
  color,
}: {
  label: string
  value: number
  max: number
  unit: string
  color?: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-slate-200">
          {value}
          {unit}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color ?? BLUE }}
        />
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BowlingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-100">Bowling Analysis</h1>
            <p className="text-xs text-slate-400 truncate">
              Biomechanics · oil pattern science · score metrics
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🎳</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Hero summary stats ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill value="88" label="Sessions (YTD)" color={BLUE_LIGHT} />
          <StatPill value="171" label="Avg Score" color="#a78bfa" />
          <StatPill value="80%" label="Spare Conv." color="#34d399" />
          <StatPill value="6.2" label="Strikes / Game" color="#fbbf24" />
        </div>

        {/* ── Session Type Breakdown ── */}
        <SectionCard title="Session Type Breakdown" icon={<Target className="w-4 h-4" />}>
          <p className="text-xs text-slate-400 mb-4">
            Sessions classified by duration: League ≥120 min · Practice ≥70 min · Open ≥40 min ·
            Short &lt;40 min
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Donut chart */}
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sessionTypeData}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="none"
                >
                  {sessionTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [`${v} sessions`, name]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend / detail */}
            <div className="space-y-3">
              {sessionTypeData.map((d) => {
                const total = sessionTypeData.reduce((s, x) => s + x.count, 0)
                const pct = Math.round((d.count / total) * 100)
                return (
                  <div key={d.type} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-xs text-slate-300 flex-1">{d.type}</span>
                    <span className="text-xs font-semibold tabular-nums text-slate-200">
                      {d.count}
                    </span>
                    <span className="text-xs text-slate-500 w-9 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </SectionCard>

        {/* ── Weekly Calories ── */}
        <SectionCard title="Weekly Active Calories — Last 8 Weeks" icon={<Zap className="w-4 h-4" />} accent="#f59e0b">
          <p className="text-xs text-slate-400 mb-4">
            Estimated active calories burned per week from bowling sessions. Heavier ball and
            higher rev rate correlate with elevated caloric output.
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyCaloriesData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                width={32}
                domain={[0, 700]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) =>
                  name === 'calories' ? [`${v} kcal`, 'Active Calories'] : [v, 'Sessions']
                }
                labelFormatter={(label: string) => `Week of ${label}`}
              />
              <Bar dataKey="calories" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>Avg 470 kcal/week</span>
            <span>Peak 601 kcal (Feb 24)</span>
            <span>~2.8 sessions/week</span>
          </div>
        </SectionCard>

        {/* ── Score Metrics ── */}
        <SectionCard title="Score Metrics Trend" icon={<Trophy className="w-4 h-4" />} accent="#a78bfa">
          <p className="text-xs text-slate-400 mb-4">
            8-week rolling averages for game score, clean game percentage, and spare conversion.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreTrendData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                width={30}
                domain={[50, 220]}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                name="Avg Score"
              />
              <Line
                type="monotone"
                dataKey="spare"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
                name="Spare Conv. %"
              />
              <Line
                type="monotone"
                dataKey="clean"
                stroke={BLUE_LIGHT}
                strokeWidth={2}
                dot={false}
                name="Clean Game %"
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 12, color: '#94a3b8' }}
                iconType="plainline"
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-purple-400">178</p>
              <p className="text-xs text-slate-400">Best Avg (Feb W4)</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">82%</p>
              <p className="text-xs text-slate-400">Best Spare Conv.</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-400">74%</p>
              <p className="text-xs text-slate-400">Best Clean Game</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-amber-400">+20</p>
              <p className="text-xs text-slate-400">Score Gain (8 wk)</p>
            </div>
          </div>
        </SectionCard>

        {/* ── Two-column: Biomechanics + Oil Pattern Science ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Delivery Biomechanics */}
          <SectionCard title="Delivery Biomechanics" icon={<Activity className="w-4 h-4" />}>
            <div className="space-y-0.5">
              <ResearchRow
                label="Wrist velocity at release:"
                detail="700–900°/s optimal window (Stuelcken 2005). Values below 700°/s reduce rev rate; above 900°/s increase injury risk to ECU tendon."
              />
              <ResearchRow
                label="Arm swing pendulum arc:"
                detail="2.1–2.4 m arc length produces maximum energy transfer with minimal timing variance (Stuelcken 2005)."
              />
              <ResearchRow
                label="Rev rate & entry angle:"
                detail="200–500 RPM spans recreational to elite. Higher rev rate widens the entry angle to the pocket by 2–4° per 100 RPM increment (Lam 2013)."
              />
              <ResearchRow
                label="Approach speed:"
                detail="4.5–5.5 km/h at the foul line associated with highest repeat-delivery consistency (Stuelcken 2015). Speeds outside this window correlate with footwork timing errors."
              />
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Estimated Delivery Profile
              </p>
              <MetricBar label="Wrist velocity" value={820} max={1000} unit="°/s" color={BLUE} />
              <MetricBar label="Arm swing arc" value={2.2} max={3.0} unit=" m" color="#818cf8" />
              <MetricBar label="Rev rate" value={310} max={500} unit=" RPM" color="#6ee7b7" />
              <MetricBar label="Approach speed" value={4.9} max={6.5} unit=" km/h" color="#f59e0b" />
            </div>
          </SectionCard>

          {/* Oil Pattern Science */}
          <SectionCard
            title="Oil Pattern Science"
            icon={<Info className="w-4 h-4" />}
            accent="#6ee7b7"
          >
            <div className="space-y-0.5">
              <ResearchRow
                label="Spare conversion as predictor:"
                detail="Spare conversion rate explains ~60% of score variance — more than any other single metric (Dorsel & Rotunda 2001). A 10% improvement in spare percentage yields ~18 pin average gain."
              />
              <ResearchRow
                label="Breakpoint difference:"
                detail="THS (house shot) vs PBA sport patterns differ by 3–4 boards at the breakpoint, meaning sport patterns require a 2–4° tighter entry window for consistent pocket hits."
              />
              <ResearchRow
                label="Friction zones:"
                detail="Buffer zone (boards 1–5), track zone (6–15), oil zone (16–25), and dry zone (26–39). Entry angle must match friction transition to maintain trajectory."
              />
              <ResearchRow
                label="Pattern length & ball motion:"
                detail="Shorter patterns (≤37 ft) amplify ball friction sooner; longer patterns (≥44 ft) reward straighter lines and higher ball speed to avoid over-reaction."
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: 'THS Breakpoint', value: 'Board 7–9' },
                { label: 'Sport Breakpoint', value: 'Board 10–13' },
                { label: 'Entry Angle THS', value: '4–6°' },
                { label: 'Entry Angle Sport', value: '2–4°' },
              ].map((item) => (
                <div key={item.label} className="bg-slate-700/50 rounded-lg p-2.5">
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="text-sm font-semibold text-emerald-400">{item.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ── Two-column: Injury Prevention + Mental Game ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Injury Prevention */}
          <SectionCard title="Injury Prevention" icon={<Shield className="w-4 h-4" />} accent="#f87171">
            <div className="space-y-0.5">
              <ResearchRow
                label="Medial epicondylitis prevalence:"
                detail="30–45% in bowlers exceeding 70 games/week (Piasecki 2018). Wrist flexor eccentric overload during forward swing is primary mechanism."
              />
              <ResearchRow
                label="Knee valgus loading:"
                detail="Slide knee experiences 2–3× body weight valgus force at the foul line (Jeong 2020). Proper knee tracking and quadriceps strength reduces MCL stress."
              />
              <ResearchRow
                label="Thumb blister index:"
                detail="Skin hydration + tape pre-care before each session reduces thumb blister incidence. Recommended: pumice exfoliation + skin-tac adhesive spray before play."
              />
              <ResearchRow
                label="Rotator cuff protocol:"
                detail="Eccentric loading protocol (3×15 reps external rotation at 60% 1RM) 3×/week prevents rotator cuff overuse in high-volume bowlers."
              />
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Risk Thresholds
              </p>
              {[
                { label: 'Games / week', value: 42, threshold: 70, unit: '', color: '#34d399' },
                { label: 'Consecutive days', value: 3, threshold: 5, unit: '', color: '#34d399' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{item.label}</span>
                    <span style={{ color: item.color }} className="font-semibold tabular-nums">
                      {item.value} / {item.threshold} risk threshold
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (item.value / item.threshold) * 100)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Mental Game */}
          <SectionCard title="Mental Game" icon={<Brain className="w-4 h-4" />} accent="#f59e0b">
            <div className="space-y-0.5">
              <ResearchRow
                label="Self-efficacy & spare shooting:"
                detail="Self-efficacy in spare conversion mediates total score — bowlers who believe they will make a spare convert 12–18% more often (Dorsel 2001)."
              />
              <ResearchRow
                label="Pre-shot routine:"
                detail="Consistent pre-shot routines reduce delivery variance by 15–20% across a full game (Dorsel 2001). Routine should include: target lock, breathing reset, tempo walk."
              />
              <ResearchRow
                label="Pressure performance:"
                detail="10th-frame performance drops an average of 8–11 pins vs first-frame average in recreational bowlers. Deliberate practice under simulated pressure narrows this gap."
              />
              <ResearchRow
                label="Focus cue strategy:"
                detail="Arrow-board targeting (7 m from foul line) outperforms pin-targeting by reducing fixation noise. Most elite bowlers use the second arrow (7-board) as primary cue."
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              {[
                { label: 'Pre-shot routine consistency', value: 87, color: '#f59e0b' },
                { label: 'Spare self-efficacy score', value: 76, color: '#a78bfa' },
                { label: 'Pressure frame performance', value: 63, color: '#f87171' },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-semibold tabular-nums" style={{ color: item.color }}>
                      {item.value}/100
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.value}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ── Best Practices Footer ── */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div
            className="px-5 py-4 border-b border-slate-700"
            style={{ borderLeftColor: BLUE, borderLeftWidth: 3 }}
          >
            <h2 className="text-sm font-semibold text-slate-100">Best Practices Checklist</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pre-session fundamentals that compound into score gains over a season
            </p>
          </div>
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Approach & Timing */}
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
                Approach Timing
              </p>
              <ul className="space-y-2">
                {[
                  'Use a 4- or 5-step approach — 5-step gives extra timing buffer',
                  'First step mirrors ball pushaway; synchronize, do not lead with the ball',
                  'Penultimate step (2nd-to-last) should be the longest — builds momentum',
                  'Slide foot lands at the same board every delivery (±1 board tolerance)',
                  'Target a consistent release point 6–12 inches past foul line',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-blue-400 mt-0.5 shrink-0">·</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Equipment Fit */}
            <div>
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
                Equipment Fit
              </p>
              <ul className="space-y-2">
                {[
                  'Ball weight: 10% of body weight up to 16 lb maximum',
                  'Core asymmetry vs symmetric: asymmetric cores increase flare potential by 2–4 inches',
                  'Surface roughness: 500-grit prep for heavy oil, 4000 for dry-medium conditions',
                  'Layout pin-to-PAP distance: 3–5 inches for moderate length-and-snap motion',
                  'Check ball balance (top/side weight) after every resurface',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-purple-400 mt-0.5 shrink-0">·</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Thumb Hole Sizing */}
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                Thumb Hole Sizing
              </p>
              <ul className="space-y-2">
                {[
                  'Thumb should rotate freely but not wobble — 1/32" is the ideal clearance',
                  'Beveling the leading edge of the thumb hole prevents blistering and snagging',
                  'Fit thumb with dominant hand warm; hand swells 2–3% during play',
                  'Bevel angle of 45° on exit side reduces shear force at release',
                  'Re-measure fit every 3 months — skin callus buildup changes effective diameter',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 mt-0.5 shrink-0">·</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Citations */}
          <div className="px-5 pb-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-medium text-slate-400">References: </span>
              Stuelcken et al. (2005) — biomechanical analysis of elite ten-pin bowlers.
              Lam et al. (2013) — rev rate and entry angle relationships.
              Stuelcken et al. (2015) — approach speed consistency in high-performance bowling.
              Dorsel &amp; Rotunda (2001) — spare conversion as primary score predictor.
              Piasecki et al. (2018) — medial epicondylitis prevalence in competitive bowlers.
              Jeong et al. (2020) — knee valgus loading during the bowling slide.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}

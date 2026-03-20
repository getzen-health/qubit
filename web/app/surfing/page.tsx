'use client'

import Link from 'next/link'
import { ArrowLeft, Waves, BookOpen, Activity, AlertTriangle, Shield, Dumbbell } from 'lucide-react'
import {
  BarChart,
  Bar,
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

// ─── Design tokens — ocean / cyan palette ─────────────────────────────────────

const CYAN      = '#06b6d4'   // cyan-500 — primary accent
const TEAL      = '#14b8a6'   // teal-500 — secondary
const OCEAN     = '#0284c7'   // sky-600  — deep blue
const FOAM      = '#67e8f9'   // cyan-300 — light highlight
const DEEP      = '#0e7490'   // cyan-700 — dark accent

// ─── Mock data ────────────────────────────────────────────────────────────────

const SESSION_TYPES = [
  { name: 'Big Session (3h+)',      value: 9,  fill: CYAN  },
  { name: 'Full Session (1.5–3h)', value: 22, fill: TEAL  },
  { name: 'Dawn Patrol (45–90m)',  value: 31, fill: OCEAN },
  { name: 'Quick Surf (<45m)',     value: 14, fill: FOAM  },
]

const WEEKLY_CALORIES = [
  { week: 'Jan 20', kcal: 1840 },
  { week: 'Jan 27', kcal: 2310 },
  { week: 'Feb 3',  kcal: 1650 },
  { week: 'Feb 10', kcal: 2780 },
  { week: 'Feb 17', kcal: 2140 },
  { week: 'Feb 24', kcal: 3050 },
  { week: 'Mar 3',  kcal: 2490 },
  { week: 'Mar 10', kcal: 2820 },
]

const SESSION_HISTORY = [
  { date: 'Fri, Mar 14', type: 'Dawn Patrol',        duration: '1h 05m', kcal: 520,  hr: 148 },
  { date: 'Wed, Mar 12', type: 'Full Session',        duration: '2h 20m', kcal: 930,  hr: 155 },
  { date: 'Sun, Mar 9',  type: 'Big Session',         duration: '3h 45m', kcal: 1480, hr: 161 },
  { date: 'Sat, Mar 8',  type: 'Quick Surf',          duration: '38m',    kcal: 310,  hr: 142 },
  { date: 'Thu, Mar 6',  type: 'Full Session',        duration: '1h 55m', kcal: 760,  hr: 153 },
]

const SESSION_TYPE_COLORS: Record<string, string> = {
  'Dawn Patrol':  CYAN,
  'Full Session': TEAL,
  'Big Session':  OCEAN,
  'Quick Surf':   FOAM,
}

// ─── Tooltip styles ───────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'rgba(8,40,60,0.95)',
  border: `1px solid ${CYAN}40`,
  borderRadius: 8,
  fontSize: 12,
  color: '#e2e8f0',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SurfingPage() {
  const totalSessions = SESSION_TYPES.reduce((s, t) => s + t.value, 0)

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #020c18 0%, #041422 50%, #020b16 100%)',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* Ambient ocean glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 75% 45% at 65% 10%, ${CYAN}08 0%, transparent 65%),
            radial-gradient(ellipse 55% 35% at 15% 80%, ${TEAL}06 0%, transparent 60%)
          `,
        }}
      />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(2,12,24,0.88)',
          backdropFilter: 'blur(16px)',
          borderColor: `${CYAN}20`,
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#64748b' }}
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
              Surfing Analysis
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Paddle mechanics &amp; surf fitness science
            </p>
          </div>
          <Waves className="w-5 h-5" style={{ color: CYAN }} />
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-6"
          style={{
            background: `linear-gradient(135deg, ${CYAN}10 0%, ${OCEAN}18 100%)`,
            borderColor: `${CYAN}30`,
            boxShadow: `0 0 60px ${CYAN}10, 0 4px 24px rgba(0,0,0,0.5)`,
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${CYAN}20`, border: `1px solid ${CYAN}40` }}
            >
              <Waves className="w-5 h-5" style={{ color: CYAN }} />
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1"
                style={{ color: `${CYAN}99` }}
              >
                Sport Physiology
              </p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                Paddle mechanics · wave fitness science
              </p>
            </div>
          </div>

          <h2
            className="text-lg font-bold leading-snug mb-3"
            style={{ color: FOAM, textShadow: `0 0 24px ${CYAN}50` }}
          >
            Surfing is a multi-modal sport — elite surfers paddle at 38–42 strokes/min, hit VO₂max at 70–75% capacity, and absorb 1.8–2.5× bodyweight force on every duck-dive.
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
            Beneath the wave-riding spectacle lies a demanding triathlon of aerobic endurance,
            explosive power, and technical biomechanics. Understanding the science of surfing
            unlocks smarter training, faster pop-ups, and fewer injuries.
          </p>
        </div>

        {/* ── Session Type Breakdown ───────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5"
          style={{
            background: `linear-gradient(135deg, ${CYAN}0a 0%, #041422 100%)`,
            borderColor: `${CYAN}28`,
          }}
        >
          <h2
            className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-4"
            style={{ color: `${CYAN}cc` }}
          >
            Session Type Breakdown
          </h2>

          {/* Donut chart */}
          <div className="flex justify-center mb-2">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={SESSION_TYPES}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {SESSION_TYPES.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [v, 'Sessions']}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-2.5 mt-2">
            {SESSION_TYPES.map((t) => (
              <div key={t.name} className="flex items-center gap-3">
                <span className="text-[11px] w-40 shrink-0" style={{ color: '#94a3b8' }}>
                  {t.name}
                </span>
                <div
                  className="flex-1 rounded-full h-2 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((t.value / totalSessions) * 100)}%`,
                      background: t.fill,
                      boxShadow: `0 0 6px ${t.fill}55`,
                    }}
                  />
                </div>
                <span
                  className="text-[11px] font-bold tabular-nums w-8 text-right shrink-0"
                  style={{ color: t.fill }}
                >
                  {t.value}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] mt-4" style={{ color: '#334155' }}>
            Mock data · {totalSessions} total sessions
          </p>
        </div>

        {/* ── Weekly Calories ──────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5"
          style={{
            background: `${TEAL}08`,
            borderColor: `${TEAL}28`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: `${TEAL}cc` }}
            >
              Weekly Calories Burned
            </h2>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border tabular-nums"
              style={{ color: TEAL, borderColor: `${TEAL}44`, background: `${TEAL}12` }}
            >
              8 weeks
            </span>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={WEEKLY_CALORIES}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={36}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#475569' }}
                width={36}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toLocaleString()} kcal`, 'Calories']}
                labelFormatter={(label: string) => `Week of ${label}`}
              />
              <Bar dataKey="kcal" radius={[4, 4, 0, 0]}>
                {WEEKLY_CALORIES.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.kcal >= 2500 ? CYAN : TEAL}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: CYAN }} />
              <span className="text-[10px]" style={{ color: '#475569' }}>&ge;2,500 kcal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: TEAL }} />
              <span className="text-[10px]" style={{ color: '#475569' }}>&lt;2,500 kcal</span>
            </div>
          </div>
        </div>

        {/* ── Paddle Mechanics ────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: `${CYAN}08`,
            borderColor: `${CYAN}30`,
          }}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: CYAN }} />
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: `${CYAN}cc` }}
            >
              Paddle Mechanics
            </h2>
          </div>

          {/* Time breakdown */}
          <div
            className="rounded-xl border p-4"
            style={{ background: `${CYAN}0d`, borderColor: `${CYAN}28` }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: CYAN }}
            >
              Farley et al. 2012 · Session Time Distribution
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'Paddling', pct: 54, color: CYAN },
                { label: 'Waiting',  pct: 35, color: TEAL },
                { label: 'Riding',   pct:  8, color: FOAM },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg p-3 text-center"
                  style={{ background: `${item.color}12`, border: `1px solid ${item.color}28` }}
                >
                  <p className="text-xl font-black tabular-nums" style={{ color: item.color }}>
                    {item.pct}%
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>{item.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: '#94a3b8' }}>
              The majority of a surf session is paddling — making paddle fitness the single
              greatest determinant of wave count and session quality.
            </p>
          </div>

          {/* Shoulder mechanics */}
          <div
            className="rounded-xl border p-4"
            style={{ background: `${TEAL}0a`, borderColor: `${TEAL}28` }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: TEAL }}
            >
              Lowdon et al. 1994 · Shoulder Mechanics
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div
                className="rounded-lg p-2.5 text-center"
                style={{ background: `${TEAL}12`, border: `1px solid ${TEAL}25` }}
              >
                <p className="text-lg font-black" style={{ color: TEAL }}>85%</p>
                <p className="text-[10px]" style={{ color: '#64748b' }}>Paddle force from shoulder internal rotation</p>
              </div>
              <div
                className="rounded-lg p-2.5 text-center"
                style={{ background: `${CYAN}0d`, border: `1px solid ${CYAN}25` }}
              >
                <p className="text-lg font-black" style={{ color: CYAN }}>38–42</p>
                <p className="text-[10px]" style={{ color: '#64748b' }}>Strokes/min — competitive paddle cadence</p>
              </div>
            </div>
          </div>

          {/* VO2max */}
          <div
            className="rounded-xl border p-4"
            style={{ background: `${OCEAN}0a`, borderColor: `${OCEAN}28` }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: '#38bdf8' }}
            >
              Mendez-Villanueva et al. 2006 · Aerobic Demand
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: '#94a3b8' }}>
              Elite surfers possess a VO₂max of{' '}
              <strong style={{ color: FOAM }}>42–56 mL/kg/min</strong>, and sustain
              70–75% of maximal oxygen uptake during competitive paddle-outs — equivalent
              to moderate-intensity continuous running.
            </p>
          </div>

          {/* Duck-dive force */}
          <div
            className="rounded-xl border p-4"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: '#94a3b8' }}
            >
              Katz 2013 · Duck-Dive Force
            </p>
            <div className="flex items-center gap-4">
              <div className="text-center shrink-0">
                <p className="text-2xl font-black" style={{ color: CYAN }}>1.8–2.5×</p>
                <p className="text-[10px]" style={{ color: '#64748b' }}>BW horizontal force</p>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: '#94a3b8' }}>
                Each duck-dive generates 1.8–2.5 times bodyweight in horizontal force through the
                upper body — accumulating to a significant total load over a paddle-out through
                heavy surf.
              </p>
            </div>
          </div>
        </div>

        {/* ── Pop-Up Biomechanics ──────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: `${TEAL}08`,
            borderColor: `${TEAL}30`,
          }}
        >
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4" style={{ color: TEAL }} />
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: `${TEAL}cc` }}
            >
              Pop-Up Biomechanics
            </h2>
          </div>

          <div
            className="rounded-xl border p-4"
            style={{ background: `${TEAL}0d`, borderColor: `${TEAL}28` }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: TEAL }}
            >
              Dascombe et al. 2011 · Pop-Up Timing
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div
                className="rounded-lg p-3 text-center"
                style={{ background: `${TEAL}12`, border: `1px solid ${TEAL}28` }}
              >
                <p className="text-xl font-black tabular-nums" style={{ color: FOAM }}>
                  &lt;0.4s
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>Experienced surfers</p>
              </div>
              <div
                className="rounded-lg p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-xl font-black tabular-nums" style={{ color: '#94a3b8' }}>
                  0.8–1.2s
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>Beginners</p>
              </div>
            </div>
            <div
              className="rounded-lg p-3"
              style={{ background: 'rgba(255,255,255,0.03)', color: '#94a3b8' }}
            >
              <p className="text-[11px] leading-relaxed">
                Hip extension power of{' '}
                <strong style={{ color: FOAM }}>8–12 W/kg</strong> drives the explosive
                standing motion. Every 0.1 s reduction in pop-up time translates to an
                earlier standing position on faster, steeper sections of the wave.
              </p>
            </div>
          </div>

          {/* Stance */}
          <div
            className="rounded-xl border p-4"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: '#94a3b8' }}
            >
              Stance &amp; Wave Zone
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { label: 'Regular', desc: 'Left foot forward — more common in population', color: CYAN },
                { label: 'Goofy',   desc: 'Right foot forward — approximately 25% of surfers', color: TEAL },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg p-3"
                  style={{ background: `${s.color}0d`, border: `1px solid ${s.color}25` }}
                >
                  <p className="text-xs font-bold mb-1" style={{ color: s.color }}>{s.label}</p>
                  <p className="text-[10px] leading-relaxed" style={{ color: '#64748b' }}>{s.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: '#94a3b8' }}>
              <strong style={{ color: FOAM }}>Hutt et al. 2001:</strong> experienced surfers
              spend 35% more time in the optimal take-off zone compared to novices, demonstrating
              superior wave reading and positioning skills.
            </p>
          </div>
        </div>

        {/* ── Injury Prevention ───────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: 'rgba(239,68,68,0.06)',
            borderColor: 'rgba(239,68,68,0.25)',
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: '#f87171' }} />
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: '#f87171cc' }}
            >
              Injury Prevention
            </h2>
          </div>

          {/* Injury distribution */}
          <div
            className="rounded-xl border p-4"
            style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.2)' }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: '#f87171' }}
            >
              Nathanson et al. 2002 · Injury Causes
            </p>
            <div className="space-y-2">
              {[
                { cause: 'Board impact',       pct: 55, color: '#f87171' },
                { cause: 'Fin lacerations',    pct: 25, color: '#fb923c' },
                { cause: 'Other / environment', pct: 20, color: '#64748b' },
              ].map((item) => (
                <div key={item.cause} className="flex items-center gap-3">
                  <span className="text-[11px] w-36 shrink-0" style={{ color: '#94a3b8' }}>
                    {item.cause}
                  </span>
                  <div
                    className="flex-1 rounded-full h-2 overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.pct}%`, background: item.color }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-bold tabular-nums w-8 text-right shrink-0"
                    style={{ color: item.color }}
                  >
                    {item.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overuse injuries */}
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                title: 'Rotator Cuff Tendinopathy',
                detail:
                  'Repetitive paddling — particularly the internal rotation phase (85% of paddle force) — progressively loads the rotator cuff. Asymmetric volume without adequate strengthening is the primary risk factor.',
                color: '#fb923c',
              },
              {
                title: 'Lumbar Hyperextension',
                detail:
                  'McGill 2007: sustained prone paddle position places the lumbar spine in continuous hyperextension. This compressive load pattern is implicated in the high prevalence of low back pain among regular surfers.',
                color: '#f87171',
              },
              {
                title: "Surfer's Ear (Exostosis)",
                detail:
                  "Van Buren et al. 2016: 73% of cold-water surfers develop exostosis after years of exposure. Silicone ear plugs reduce risk by more than 90% — the single most cost-effective injury prevention intervention in the sport.",
                color: CYAN,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border p-3"
                style={{
                  background: `${item.color}09`,
                  borderColor: `${item.color}25`,
                }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: item.color }}>
                  {item.title}
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: '#64748b' }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Surf Fitness Science ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: `${OCEAN}08`,
            borderColor: `${OCEAN}30`,
          }}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: '#38bdf8' }} />
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: '#38bdf8cc' }}
            >
              Surf Fitness Science
            </h2>
          </div>

          {/* MET / calorie / HR */}
          <div
            className="rounded-xl border p-4"
            style={{ background: `${OCEAN}0d`, borderColor: `${OCEAN}28` }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: '#38bdf8' }}
            >
              Metabolic &amp; Cardiovascular Profile
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: 'MET range',        value: '6–10 METs',      color: CYAN },
                { label: 'Caloric cost',     value: '400–650 kcal/h', color: TEAL },
                { label: 'Mean HR',          value: '140–165 bpm',    color: '#38bdf8' },
                { label: 'Peak HR',          value: '170–185 bpm',    color: FOAM },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg p-3"
                  style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}25` }}
                >
                  <p className="text-sm font-black" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-training */}
          <div
            className="rounded-xl border p-4 space-y-2"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: '#94a3b8' }}
            >
              Recommended Cross-Training
            </p>
            {[
              'Cable rows &amp; face pulls — replicate paddle mechanics with progressive load',
              'Pull-ups &amp; lat pull-downs — develop the lats that dominate paddle pull-phase',
              'Plyometric jumps &amp; hip hinge patterns — build pop-up explosive power',
              '48 h shoulder rest after big sessions — rotator cuff tendon recovery window',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="w-1 h-1 rounded-full shrink-0 mt-2"
                  style={{ background: CYAN }}
                />
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: '#64748b' }}
                  dangerouslySetInnerHTML={{ __html: tip }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Session History ──────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: `${CYAN}20`,
          }}
        >
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: `${CYAN}18` }}
          >
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: `${CYAN}cc` }}
            >
              Recent Sessions
            </h2>
            <span className="text-[10px]" style={{ color: '#334155' }}>
              Mock data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${CYAN}14` }}>
                  {['Date', 'Type', 'Duration', 'Calories', 'HR'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide ${
                        i === 0 ? 'text-left' : 'text-right'
                      }`}
                      style={{ color: '#475569' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SESSION_HISTORY.map((s, i) => {
                  const color = SESSION_TYPE_COLORS[s.type] ?? CYAN
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: i < SESSION_HISTORY.length - 1 ? `1px solid ${CYAN}10` : undefined,
                      }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-2.5 text-[11px] whitespace-nowrap" style={{ color: '#64748b' }}>
                        {s.date}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            color,
                            background: `${color}18`,
                            border: `1px solid ${color}35`,
                          }}
                        >
                          {s.type}
                        </span>
                      </td>
                      <td
                        className="px-4 py-2.5 text-right text-[11px] font-medium tabular-nums"
                        style={{ color: '#e2e8f0' }}
                      >
                        {s.duration}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right text-[11px] tabular-nums"
                        style={{ color: '#94a3b8' }}
                      >
                        {s.kcal} kcal
                      </td>
                      <td
                        className="px-4 py-2.5 text-right text-[11px] tabular-nums"
                        style={{ color: '#94a3b8' }}
                      >
                        {s.hr} bpm
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Science footer ────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: '#475569' }} />
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: '#475569' }}
            >
              Key References
            </h2>
          </div>

          <div className="space-y-3 divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {[
              {
                ref: 'Farley et al. 2012 — J Strength Cond Res',
                note: 'Quantified session time distribution: 54% paddling, 35% waiting, 8% wave riding — establishing paddle fitness as the primary performance determinant.',
              },
              {
                ref: 'Lowdon et al. 1994 — Aust J Sci Med Sport',
                note: 'Identified shoulder internal rotation as generating 85% of paddle force, at a competitive cadence of 38–42 strokes/min.',
              },
              {
                ref: 'Mendez-Villanueva et al. 2006 — J Sci Med Sport',
                note: 'Documented elite surfer VO₂max of 42–56 mL/kg/min and 70–75% VO₂max utilisation during sustained paddling efforts.',
              },
              {
                ref: 'Katz 2013',
                note: 'Measured 1.8–2.5× bodyweight horizontal force generation during duck-dive manoeuvres, highlighting upper body loading in paddle-outs.',
              },
              {
                ref: 'Dascombe et al. 2011 — J Sports Sci',
                note: 'Quantified pop-up times: <0.4 s (experienced) vs 0.8–1.2 s (beginners), with hip extension power 8–12 W/kg as the explosive driver.',
              },
              {
                ref: 'Hutt et al. 2001 — J Sports Sci',
                note: 'Demonstrated 35% greater time in optimal take-off zone for experienced surfers, confirming positional intelligence as a skill differentiator.',
              },
              {
                ref: 'Nathanson et al. 2002 — Wilderness Environ Med',
                note: 'Epidemiological survey: board impact accounts for 55% of surfing injuries; fin lacerations 25%. Equipment proximity is the principal injury vector.',
              },
              {
                ref: 'McGill 2007 — Low Back Disorders',
                note: 'Biomechanical analysis of lumbar hyperextension risk from sustained prone paddle position and implications for disc and facet joint loading.',
              },
              {
                ref: 'Van Buren et al. 2016 — Otolaryngol Head Neck Surg',
                note: "73% of cold-water surfers develop exostosis; silicone ear plug use reduces incidence by >90% — the sport's most effective preventive intervention.",
              },
            ].map((item, i) => (
              <div key={i} className={`space-y-1 ${i > 0 ? 'pt-3' : ''}`}>
                <p className="text-[11px] font-bold" style={{ color: '#64748b' }}>{item.ref}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: '#334155' }}>{item.note}</p>
              </div>
            ))}
          </div>

          <p
            className="text-[10px] leading-relaxed"
            style={{
              color: '#1e293b',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '0.75rem',
            }}
          >
            This page provides educational sport science content and mock data for demonstration.
            It does not constitute medical or coaching advice.
          </p>
        </div>

      </main>
    </div>
  )
}

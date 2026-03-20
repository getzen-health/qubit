'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, Dumbbell, Zap, Activity, TrendingUp, ChevronRight } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Design tokens ────────────────────────────────────────────────────────────

const ST_BLUE   = '#3b82f6'   // slow-twitch (aerobic, Type I)
const FT_RED    = '#ef4444'   // fast-twitch (power, Type II)
const VIOLET    = '#a78bfa'   // accent / category label
const AMBER     = '#f59e0b'

// ─── Mock data — recreational runner + HIIT 3x/week ──────────────────────────

// Estimated 62% slow-twitch / 38% fast-twitch → Mixed Endurance-Leaning
const ESTIMATED_ST_PCT = 62
const ESTIMATED_FT_PCT = 38

type FiberCategory =
  | 'Endurance Dominant'
  | 'Mixed Endurance-Leaning'
  | 'Balanced'
  | 'Mixed Power-Leaning'
  | 'Power Dominant'

const CATEGORY: FiberCategory = 'Mixed Endurance-Leaning'

interface CategoryConfig {
  label: FiberCategory
  stRange: string
  color: string
  bg: string
  border: string
  text: string
  icon: string
  desc: string
  sports: string[]
  implications: string[]
}

const CATEGORY_CONFIG: Record<FiberCategory, CategoryConfig> = {
  'Endurance Dominant': {
    label: 'Endurance Dominant',
    stRange: '>70% ST',
    color: ST_BLUE,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: '🏃',
    desc: 'Your training profile strongly mirrors elite endurance athletes. Exceptional oxidative capacity and fatigue resistance suit long-duration efforts.',
    sports: ['Marathon', 'Ultra-marathon', 'Ironman Triathlon', 'Long-distance cycling', 'Open-water swimming'],
    implications: [
      'Prioritise high-volume Zone 2 work — your mitochondrial density responds well.',
      'Allow extra recovery between high-intensity sessions; Type I fibres take longer to up-regulate glycolytic enzymes.',
      'Negative-split racing strategy leverages your superior aerobic sustainability.',
      'Strength work in the 15–25 rep range targets Type IIa fibres without disrupting endurance adaptations.',
    ],
  },
  'Mixed Endurance-Leaning': {
    label: 'Mixed Endurance-Leaning',
    stRange: '55–70% ST',
    color: VIOLET,
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-300',
    icon: '⚡',
    desc: 'Versatile profile with a clear aerobic lean. You excel at sustained moderate-high intensities and respond well to both endurance and mixed training stimuli.',
    sports: ['Half marathon', 'Olympic triathlon', 'Criterium cycling', '10K racing', 'Cross-country skiing'],
    implications: [
      'An 80/20 polarised model (easy long efforts + short hard sessions) suits your hybrid fibre composition.',
      'Include 1–2 tempo runs per week at lactate threshold to sharpen the FT IIa component.',
      'HIIT intervals of 4–8 min at 90–95% HRmax recruit your FT fibres while preserving aerobic base.',
      'Weight training at moderate loads (8–12 reps) triggers hypertrophy without compromising aerobic economy.',
    ],
  },
  'Balanced': {
    label: 'Balanced',
    stRange: '45–55% ST',
    color: AMBER,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: '⚖️',
    desc: 'Genetically and adaptively balanced — you can train effectively for both endurance and power. Your versatility is a genuine competitive advantage.',
    sports: ['Soccer', 'Basketball', 'CrossFit', 'Rowing (2000m)', 'Sprint triathlon'],
    implications: [
      'Periodise: base phases build aerobic foundation; competition phases shift to power and speed.',
      'Equal emphasis on Zone 2 aerobic work and high-force strength training maximises both fibre types.',
      'Explosive plyometric work primes FT recruitment pathways without over-taxing recovery.',
      'Mixed-interval sessions (e.g., 30/30 s) efficiently stress the entire fibre-type spectrum.',
    ],
  },
  'Mixed Power-Leaning': {
    label: 'Mixed Power-Leaning',
    stRange: '30–45% ST',
    color: '#fb923c',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    icon: '💥',
    desc: 'Your profile favours powerful, high-intensity output. You excel in shorter, explosive events and respond rapidly to anaerobic training loads.',
    sports: ['800m–1500m running', 'Criterium cycling', 'Basketball', 'Volleyball', 'Combat sports'],
    implications: [
      'Short-interval training (30 s–2 min at max effort) preferentially recruits and develops your dominant FT fibres.',
      'Maintain aerobic base with 2–3 easy sessions weekly to support FT IIa oxidative capacity.',
      'Heavy compound lifts (3–6 reps) develop maximum strength in your Type II population.',
      'Include contrast training (heavy lift immediately followed by explosive movement) for peak power output.',
    ],
  },
  'Power Dominant': {
    label: 'Power Dominant',
    stRange: '<30% ST',
    color: FT_RED,
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: '🚀',
    desc: 'Elite power profile. Your fast-twitch dominance supports exceptional force production and explosive speed — hallmarks of sprinters and weightlifters.',
    sports: ['100–400m sprints', 'Olympic weightlifting', 'Powerlifting', 'Shot put / throwing', 'Short-course swimming'],
    implications: [
      'Max-effort sprints and loaded jumps are your primary adaptation stimulus — short, near-100% intensity.',
      'Keep aerobic work to 2 sessions/week; excessive endurance volume can shift fibre phenotype toward Type I.',
      'Neural drive training (sub-maximal loads at maximal velocity) enhances rate-of-force development.',
      'Longer rest periods (3–5 min) between power sets preserve ATP-PCr systems for maximal quality.',
    ],
  },
}

// Intensity distribution pie data (recreational runner + HIIT)
const INTENSITY_DATA = [
  { name: 'Light (Z1–Z2)', value: 52, color: ST_BLUE },
  { name: 'Moderate (Z3)', value: 28, color: '#818cf8' },
  { name: 'Vigorous (Z4)', value: 14, color: VIOLET },
  { name: 'Maximal (Z5+)', value: 6,  color: FT_RED },
]

// Evidence factors (each mapped to a 0–100 score contributing to fiber estimation)
interface EvidenceFactor {
  label: string
  value: string
  detail: string
  score: number  // 0=pure FT, 100=pure ST
  color: string
  icon: React.ReactNode
}

const EVIDENCE_FACTORS: EvidenceFactor[] = [
  {
    label: 'Workout Duration',
    value: 'Avg 48 min',
    detail: 'Longer sessions (>45 min) preferentially recruit and develop slow-twitch oxidative fibres. Your average session length sits solidly in the endurance range.',
    score: 68,
    color: ST_BLUE,
    icon: <Activity className="w-4 h-4" />,
  },
  {
    label: 'Intensity Mix',
    value: '52% easy · 20% hard',
    detail: 'Your training follows a mild polarised model. The majority of efforts are below threshold, signalling endurance adaptation, with regular high-intensity bouts maintaining fast-twitch recruitment.',
    score: 62,
    color: VIOLET,
    icon: <Zap className="w-4 h-4" />,
  },
  {
    label: 'Sport Mix',
    value: 'Running 68% · HIIT 22%',
    detail: 'Running dominates your log — an endurance-biased sport. Regular HIIT sessions provide the high-force stimulus that prevents slow-twitch over-specification.',
    score: 65,
    color: VIOLET,
    icon: <Dumbbell className="w-4 h-4" />,
  },
  {
    label: 'Recovery Pattern',
    value: '2.1 rest days/wk',
    detail: 'Moderate recovery frequency. Fast-twitch fibres require longer structural recovery than slow-twitch; your pattern supports a mixed profile rather than a pure endurance one.',
    score: 58,
    color: AMBER,
    icon: <TrendingUp className="w-4 h-4" />,
  },
]

// ─── Custom tooltip for pie chart ────────────────────────────────────────────

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { name: string; value: number; payload: { color: string } }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div
      style={{
        background: '#0d1526',
        border: `1px solid ${d.payload.color}44`,
        borderRadius: 10,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <p style={{ color: d.payload.color, fontWeight: 700 }}>{d.name}</p>
      <p className="text-slate-300 font-bold tabular-nums">{d.value}%</p>
    </div>
  )
}

// ─── ST/FT Spectrum bar ───────────────────────────────────────────────────────

function SpectrumBar({ stPct }: { stPct: number }) {
  const ftPct = 100 - stPct

  return (
    <div className="space-y-3">
      {/* Labels row */}
      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
        <span style={{ color: ST_BLUE }}>Slow-Twitch (Type I)</span>
        <span style={{ color: FT_RED }}>Fast-Twitch (Type II)</span>
      </div>

      {/* Gradient bar */}
      <div className="relative h-7 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {/* Gradient fill */}
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${stPct}%`,
            background: `linear-gradient(90deg, ${ST_BLUE} 0%, ${VIOLET} 70%, #c084fc 100%)`,
            boxShadow: `inset -4px 0 12px rgba(0,0,0,0.3)`,
          }}
        />
        <div
          className="absolute inset-y-0 right-0"
          style={{
            width: `${ftPct}%`,
            background: `linear-gradient(90deg, #fb923c 0%, ${FT_RED} 100%)`,
            boxShadow: `inset 4px 0 12px rgba(0,0,0,0.3)`,
          }}
        />

        {/* Divider needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/90 z-10"
          style={{ left: `${stPct}%`, transform: 'translateX(-50%)', boxShadow: '0 0 8px rgba(255,255,255,0.6)' }}
        />

        {/* ST percentage label */}
        <div
          className="absolute inset-y-0 flex items-center"
          style={{ left: `${Math.min(stPct - 3, 90)}%`, transform: 'translateX(-100%)' }}
        >
          <span className="text-xs font-black tabular-nums text-white/90 pr-2">{stPct}%</span>
        </div>

        {/* FT percentage label */}
        <div
          className="absolute inset-y-0 flex items-center"
          style={{ left: `${stPct + 2}%` }}
        >
          <span className="text-xs font-black tabular-nums text-white/90 pl-2">{ftPct}%</span>
        </div>
      </div>

      {/* Category markers */}
      <div className="relative h-4">
        {/* Tick marks at category boundaries */}
        {[30, 45, 55, 70].map((pct) => (
          <div
            key={pct}
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-px h-2 bg-slate-600" />
            <span className="text-[9px] text-slate-600 mt-0.5 tabular-nums">{pct}</span>
          </div>
        ))}
        {/* Pointer at current estimate */}
        <div
          className="absolute top-0"
          style={{ left: `${stPct}%`, transform: 'translateX(-50%)' }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ background: VIOLET, boxShadow: `0 0 10px ${VIOLET}` }}
          />
        </div>
      </div>

      {/* Category labels below */}
      <div className="grid grid-cols-5 gap-0 text-center">
        {(
          [
            { label: 'Power\nDominant',    color: FT_RED,    key: 'Power Dominant'         },
            { label: 'Mixed\nPower',       color: '#fb923c', key: 'Mixed Power-Leaning'     },
            { label: 'Balanced',           color: AMBER,     key: 'Balanced'                },
            { label: 'Mixed\nEndurance',   color: VIOLET,    key: 'Mixed Endurance-Leaning' },
            { label: 'Endurance\nDominant',color: ST_BLUE,   key: 'Endurance Dominant'      },
          ]
        ).map(({ label, color, key }, i) => (
          <div
            key={i}
            className="text-[9px] leading-tight font-semibold px-0.5"
            style={{ color: CATEGORY === key ? color : '#334155' }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Evidence factor bar ──────────────────────────────────────────────────────

function FactorBar({ factor }: { factor: EvidenceFactor }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: factor.color }}>{factor.icon}</span>
          <span className="text-sm font-semibold text-slate-200">{factor.label}</span>
        </div>
        <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full border"
          style={{ color: factor.color, borderColor: `${factor.color}44`, background: `${factor.color}12` }}
        >
          {factor.value}
        </span>
      </div>
      {/* Bar: left=FT, right=ST */}
      <div className="relative h-2 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${factor.score}%`,
            background: factor.color,
            boxShadow: `0 0 6px ${factor.color}55`,
          }}
        />
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {factor.detail}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const metadata = { title: 'Muscle Fiber Type Estimator' }

export default function FiberTypePage() {
  const cfg = CATEGORY_CONFIG[CATEGORY]

  const avgFactorScore = Math.round(
    EVIDENCE_FACTORS.reduce((s, f) => s + f.score, 0) / EVIDENCE_FACTORS.length
  )

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(155deg, #020817 0%, #0a1628 45%, #040b14 100%)',
        fontFamily: 'ui-monospace, "SF Mono", "Fira Code", monospace',
      }}
    >
      {/* Ambient background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(167,139,250,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(167,139,250,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '52px 52px',
        }}
      />

      {/* Ambient radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 70% 20%, rgba(59,130,246,0.06) 0%, transparent 70%),
                       radial-gradient(ellipse 50% 35% at 25% 75%, rgba(239,68,68,0.05) 0%, transparent 65%)`,
        }}
      />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(2,8,23,0.88)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(167,139,250,0.12)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-400 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Explore
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
              Fiber Type Estimator
            </span>
          </div>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* ── Hero Profile Card ──────────────────────────────────────────────── */}
        <div
          className={`rounded-2xl border p-6 ${cfg.bg} ${cfg.border}`}
          style={{ boxShadow: `0 0 50px ${cfg.color}14, 0 4px 24px rgba(0,0,0,0.5)` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-1">
                Estimated Profile · 90-day data
              </p>
              <p className="text-xs text-slate-400">Based on workout intensity, duration &amp; sport mix</p>
            </div>
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.text}`}
            >
              <span className="text-sm">{cfg.icon}</span>
              {cfg.stRange}
            </span>
          </div>

          {/* Category label */}
          <div className="mb-5">
            <h1
              className="text-2xl font-black tracking-tight leading-none"
              style={{ color: cfg.color, textShadow: `0 0 28px ${cfg.color}55` }}
            >
              {CATEGORY}
            </h1>
            <p
              className="text-sm text-slate-300 mt-2 leading-relaxed"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {cfg.desc}
            </p>
          </div>

          {/* ST / FT Spectrum */}
          <SpectrumBar stPct={ESTIMATED_ST_PCT} />

          {/* Stat row */}
          <div
            className="grid grid-cols-3 gap-3 mt-5 pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-center">
              <p className="text-xl font-black tabular-nums" style={{ color: ST_BLUE }}>
                {ESTIMATED_ST_PCT}%
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Slow-Twitch</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tabular-nums" style={{ color: FT_RED }}>
                {ESTIMATED_FT_PCT}%
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Fast-Twitch</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black tabular-nums" style={{ color: cfg.color }}>
                {avgFactorScore}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">ST Index (0–100)</p>
            </div>
          </div>
        </div>

        {/* ── Evidence Factors ──────────────────────────────────────────────── */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 p-5 space-y-5">
          <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
            Evidence Factors
          </h2>
          <p className="text-[11px] text-slate-500 -mt-2" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Bar position: left = fast-twitch tendency · right = slow-twitch tendency
          </p>
          <div className="space-y-5 divide-y divide-slate-800/50">
            {EVIDENCE_FACTORS.map((f, i) => (
              <div key={i} className={i > 0 ? 'pt-5' : ''}>
                <FactorBar factor={f} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Intensity Distribution Donut ──────────────────────────────────── */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 p-5">
          <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4">
            Workout Intensity Distribution
          </h2>

          <div className="flex items-center gap-4">
            <div className="shrink-0 w-44 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={INTENSITY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {INTENSITY_DATA.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-2.5">
              {INTENSITY_DATA.map((d) => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: d.color, boxShadow: `0 0 5px ${d.color}88` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-300 truncate">{d.name}</span>
                      <span
                        className="text-[11px] font-black tabular-nums ml-2 shrink-0"
                        style={{ color: d.color }}
                      >
                        {d.value}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${d.value}%`, background: d.color, boxShadow: `0 0 4px ${d.color}55` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <p
                className="text-[10px] text-slate-600 leading-relaxed pt-1"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Tesch &amp; Karlsson 1985: efforts &gt;80% max preferentially recruit fast-twitch fibres.
              </p>
            </div>
          </div>
        </div>

        {/* ── Training Implications ─────────────────────────────────────────── */}
        <div
          className={`rounded-2xl border p-5 space-y-4 ${cfg.bg} ${cfg.border}`}
          style={{ boxShadow: `0 0 30px ${cfg.color}0d` }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: cfg.color }} />
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">
              Training Implications
            </h2>
            <span className={`text-[10px] font-bold ml-auto ${cfg.text}`}>{CATEGORY}</span>
          </div>

          <ul className="space-y-3">
            {cfg.implications.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: cfg.color }} />
                <p
                  className="text-[12px] text-slate-300 leading-relaxed"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {point}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Best-Suited Sports ────────────────────────────────────────────── */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 p-5 space-y-3">
          <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
            Best-Suited Sports
          </h2>
          <div className="flex flex-wrap gap-2">
            {cfg.sports.map((sport) => (
              <span
                key={sport}
                className="px-3 py-1.5 rounded-full border text-xs font-semibold"
                style={{
                  color: cfg.color,
                  borderColor: `${cfg.color}44`,
                  background: `${cfg.color}10`,
                }}
              >
                {sport}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-600 pt-1 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Gollnick et al. 1973: fibre type composition directly influences training adaptation and sport suitability, though significant adaptation is possible through targeted training.
          </p>
        </div>

        {/* ── All 5 Categories Reference ────────────────────────────────────── */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800/80">
            <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
              Fibre Type Categories
            </h2>
          </div>
          <div className="divide-y divide-slate-800/60">
            {(Object.values(CATEGORY_CONFIG) as CategoryConfig[]).map((cat) => {
              const isActive = cat.label === CATEGORY
              return (
                <div
                  key={cat.label}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive ? cat.bg : 'hover:bg-slate-800/20'}`}
                >
                  <span className="text-base shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold leading-tight"
                      style={{ color: isActive ? cat.color : '#64748b' }}
                    >
                      {cat.label}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{cat.stRange}</p>
                  </div>
                  {isActive && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
                      style={{ color: cat.color, borderColor: `${cat.color}44`, background: `${cat.color}14` }}
                    >
                      You
                    </span>
                  )}
                  <div
                    className="w-16 h-1.5 rounded-full shrink-0 overflow-hidden bg-slate-800/80"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: isActive ? `${ESTIMATED_ST_PCT}%` : '50%',
                        background: cat.color,
                        opacity: isActive ? 1 : 0.3,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Genetic vs Adaptive Note ──────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-4"
          style={{
            background: 'rgba(167,139,250,0.05)',
            borderColor: 'rgba(167,139,250,0.2)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}
            >
              <span className="text-sm">🧬</span>
            </div>
            <div>
              <p className="text-xs font-bold text-violet-300 mb-1">Genetics vs. Training (~45 / 55)</p>
              <p
                className="text-[11px] text-slate-400 leading-relaxed"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Timmons et al. 2010 estimated ~45% of fibre type composition is heritable — the rest reflects
                chronic training adaptations. This estimate is derived from your workout data and reflects
                your <em>current adapted state</em>, not a fixed genetic ceiling. Targeted training can shift the
                phenotype meaningfully over 12–24 months.
              </p>
            </div>
          </div>
        </div>

        {/* ── Science Card ──────────────────────────────────────────────────── */}
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
                ref: 'Costill et al. 1976 — J Appl Physiol',
                note: 'Muscle biopsy analysis of elite athletes revealed that marathon runners averaged ~73% slow-twitch (Type I) fibres, while elite sprinters averaged only ~24% ST. Type I fibres are fatigue-resistant, highly oxidative, and suited to prolonged aerobic effort; Type II fibres generate rapid, powerful contractions.',
              },
              {
                ref: 'Gollnick et al. 1973 — J Appl Physiol',
                note: 'Fibre type composition directly influences training adaptation efficiency and sport suitability. Athletes with higher ST proportions adapt more readily to endurance training; those with higher FT proportions show superior gains in power and sprint performance.',
              },
              {
                ref: 'Tesch & Karlsson 1985 — Acta Physiol Scand',
                note: 'Efforts exceeding 80% of maximal capacity preferentially recruit fast-twitch motor units. The intensity mix in your training log serves as an indirect proxy for the relative activation history of each fibre type, from which approximate proportions can be estimated.',
              },
              {
                ref: 'Timmons et al. 2010 — J Appl Physiol',
                note: 'Genome-wide analysis estimated ~45% of variance in fibre type distribution is attributable to heritable genetic factors. The remaining ~55% reflects chronic exercise adaptation, supporting the utility of training-derived fibre type estimation as a meaningful, modifiable metric.',
              },
            ].map((item) => (
              <div key={item.ref} className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-300">{item.ref}</p>
                <p
                  className="text-[11px] text-slate-500 leading-relaxed"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {item.note}
                </p>
              </div>
            ))}
          </div>

          {/* Methodology box */}
          <div
            className="rounded-xl p-3 mt-2"
            style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.14)' }}
          >
            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1.5">
              Estimation Methodology
            </p>
            <p
              className="text-[11px] text-slate-400 leading-relaxed"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              This estimate uses four evidence signals: (1) average workout duration weighted toward
              ST at &gt;45 min, (2) intensity distribution using Tesch &amp; Karlsson&apos;s &gt;80% HRmax threshold for
              FT recruitment, (3) sport type weighted for aerobic vs. anaerobic demand, and (4) recovery
              frequency as a proxy for fibre-type recovery kinetics. Each signal contributes equally to a
              weighted ST index (0–100), which maps onto the five fibre-type categories.
            </p>
          </div>

          <p
            className="text-[10px] text-slate-600 leading-relaxed border-t border-slate-800 pt-3"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            Definitive fibre type measurement requires invasive muscle biopsy. This tool provides an
            evidence-based estimate from wearable data for training guidance only, not medical diagnosis.
          </p>
        </div>

      </main>
    </div>
  )
}

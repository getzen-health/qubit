// Injury Prevention Science — server component
// Evidence-based guide covering ACWR, tissue adaptation, overuse injuries, and return to sport.

import Link from 'next/link'
import { ArrowLeft, ShieldCheck, FlaskConical, AlertTriangle, Bone, HeartPulse, RotateCcw } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    label: 'ACWR Sweet Spot',
    value: '0.8–1.3',
    sub: 'optimal training zone (Gabbett 2016)',
    accent: '#f97316',
  },
  {
    label: 'Training Error Contribution',
    value: '60–70%',
    sub: 'of all overuse injuries',
    accent: '#ef4444',
  },
  {
    label: 'Injury Reduction',
    value: '30–50%',
    sub: 'with structured prevention programs',
    accent: '#22c55e',
  },
]

// ─── ACWR Risk Curve Data ─────────────────────────────────────────────────────
// Points along the ACWR curve from 0.4 to 2.0, representing relative injury risk
// Based on Gabbett 2016 / Malone 2017 findings

const ACWR_CURVE = [
  { ratio: 0.4, risk: 1.8, label: '0.4' },
  { ratio: 0.5, risk: 1.5, label: '0.5' },
  { ratio: 0.6, risk: 1.2, label: '0.6' },
  { ratio: 0.7, risk: 1.0, label: '0.7' },
  { ratio: 0.8, risk: 0.7, label: '0.8' },
  { ratio: 0.9, risk: 0.5, label: '0.9' },
  { ratio: 1.0, risk: 0.45, label: '1.0' },
  { ratio: 1.1, risk: 0.5, label: '1.1' },
  { ratio: 1.2, risk: 0.6, label: '1.2' },
  { ratio: 1.3, risk: 0.75, label: '1.3' },
  { ratio: 1.4, risk: 1.1, label: '1.4' },
  { ratio: 1.5, risk: 1.6, label: '1.5' },
  { ratio: 1.6, risk: 2.4, label: '1.6' },
  { ratio: 1.7, risk: 3.5, label: '1.7' },
  { ratio: 1.8, risk: 4.8, label: '1.8' },
  { ratio: 1.9, risk: 5.8, label: '1.9' },
  { ratio: 2.0, risk: 6.5, label: '2.0' },
]

// Chart dimensions (SVG-based, server renderable)
const CHART_W = 600
const CHART_H = 220
const CHART_PAD = { top: 16, right: 20, bottom: 36, left: 44 }
const PLOT_W = CHART_W - CHART_PAD.left - CHART_PAD.right
const PLOT_H = CHART_H - CHART_PAD.top - CHART_PAD.bottom

const MAX_RISK = 7.0
const MIN_RATIO = 0.4
const MAX_RATIO = 2.0
const RATIO_RANGE = MAX_RATIO - MIN_RATIO

function ratioToX(ratio: number) {
  return CHART_PAD.left + ((ratio - MIN_RATIO) / RATIO_RANGE) * PLOT_W
}

function riskToY(risk: number) {
  return CHART_PAD.top + PLOT_H - (risk / MAX_RISK) * PLOT_H
}

// Build SVG polyline points string
const linePoints = ACWR_CURVE.map((p) => `${ratioToX(p.ratio)},${riskToY(p.risk)}`).join(' ')

// Build SVG filled area path (close down to baseline)
const areaPath = [
  `M ${ratioToX(ACWR_CURVE[0].ratio)},${riskToY(0)}`,
  ...ACWR_CURVE.map((p) => `L ${ratioToX(p.ratio)},${riskToY(p.risk)}`),
  `L ${ratioToX(ACWR_CURVE[ACWR_CURVE.length - 1].ratio)},${riskToY(0)}`,
  'Z',
].join(' ')

// Y-axis ticks
const Y_TICKS = [0, 1, 2, 3, 4, 5, 6, 7]

// X-axis ticks
const X_TICKS = [0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0]

// Sweet spot zone boundaries in SVG coords
const sweetLeft = ratioToX(0.8)
const sweetRight = ratioToX(1.3)

// ─── Tissue Adaptation Timeline ───────────────────────────────────────────────

const TISSUES = [
  {
    name: 'Muscle',
    shortName: 'Muscle',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.15)',
    border: 'rgba(249,115,22,0.4)',
    phases: [
      { label: 'Acute soreness', duration: '24–72h', widthPct: 8 },
      { label: 'Functional adaptation', duration: '1–3 wk', widthPct: 25 },
      { label: 'Morphological change', duration: '4–8 wk', widthPct: 35 },
      { label: 'Full hypertrophy', duration: '3–6 mo', widthPct: 32 },
    ],
    summary: 'Responds fastest — days to weeks',
  },
  {
    name: 'Tendon',
    shortName: 'Tendon',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
    border: 'rgba(59,130,246,0.4)',
    phases: [
      { label: 'Collagen synthesis peak', duration: '24–72h', widthPct: 8 },
      { label: 'Remodeling begins', duration: '6–12 wk', widthPct: 35 },
      { label: 'Structural strengthening', duration: '3–6 mo', widthPct: 32 },
      { label: 'Full adaptation', duration: '6–12 mo', widthPct: 25 },
    ],
    summary: 'Half-life 50–100 days — lags muscle by weeks',
  },
  {
    name: 'Ligament',
    shortName: 'Ligament',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.15)',
    border: 'rgba(168,85,247,0.4)',
    phases: [
      { label: 'Inflammatory phase', duration: '1–4 wk', widthPct: 12 },
      { label: 'Proliferative repair', duration: '4–12 wk', widthPct: 25 },
      { label: 'Remodeling', duration: '3–12 mo', widthPct: 38 },
      { label: 'Maturation', duration: '1–2 yr', widthPct: 25 },
    ],
    summary: 'Very slow — 1–2 years to full tensile strength',
  },
  {
    name: 'Bone',
    shortName: 'Bone',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
    border: 'rgba(34,197,94,0.4)',
    phases: [
      { label: 'Stress response', duration: '1–4 wk', widthPct: 10 },
      { label: 'Woven bone formation', duration: '4–8 wk', widthPct: 22 },
      { label: 'Lamellar remodeling', duration: '3–6 mo', widthPct: 35 },
      { label: 'Full mineralization', duration: '6–24 mo', widthPct: 33 },
    ],
    summary: 'Impact activities produce BMD 1.5–3× greater than non-impact',
  },
]

// ─── Science Cards Data ───────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'acwr',
    title: 'Acute:Chronic Workload Ratio (ACWR)',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.08)',
    accentBorder: 'rgba(249,115,22,0.25)',
    accentPill: 'rgba(249,115,22,0.15)',
    Icon: 'activity' as const,
    findings: [
      {
        citation: 'Gabbett 2016 — Br J Sports Med',
        points: [
          'ACWR = acute load (past 7 days) ÷ chronic load (4-week rolling average)',
          '0.8–1.3 = sweet spot; >1.5 = injury risk 2–6× baseline',
          'Spike >15% weekly volume = strong injury predictor',
        ],
      },
      {
        citation: 'Hulin 2016 — Br J Sports Med',
        points: [
          'Traditional 10% rule not empirically validated',
          'Risk highest at >15% spike combined with low chronic load',
          'Trained athletes can tolerate larger spikes than untrained — fitness is protective',
        ],
      },
      {
        citation: 'Malone 2017',
        points: [
          'High chronic workload reduces injury risk at any ACWR level',
          'Consistent year-round training prevents deconditioning which raises subsequent injury risk',
        ],
      },
      {
        citation: 'Soligard 2016',
        points: [
          'GPS + RPE monitoring provides most accurate load picture',
          'Well-managed ACWR programs reduce time-loss injuries by 35%',
        ],
      },
    ],
  },
  {
    id: 'tissue',
    title: 'Tissue Adaptation & Remodeling',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    accentPill: 'rgba(59,130,246,0.15)',
    Icon: 'bone' as const,
    findings: [
      {
        citation: 'Magnusson 2010 — Nat Rev Rheumatol',
        points: [
          'Tendons adapt slower than muscle — weeks to months vs days',
          'Collagen synthesis peaks 24–72h after loading; half-life 50–100 days',
          'Muscle-tendon mismatch in aggressive strength programs = most common overuse mechanism',
        ],
      },
      {
        citation: 'Cook 2009 — Br J Sports Med',
        points: [
          'Tendinopathy continuum: reactive → disrepair → degenerative',
          'Reactive stage is reversible; degeneration is permanent but manageable',
          'Compressive loads worsen all stages',
        ],
      },
      {
        citation: 'McBain 2012',
        points: [
          'Hamstring strains = 12–16% of all sports injuries',
          'Nordic hamstring exercise reduces recurrence by 51%',
          'Asymmetry >10% predicts strain risk',
        ],
      },
      {
        citation: 'Frost 2003 — Wolff\'s Law',
        points: [
          'Bone remodels above the minimum effective strain threshold',
          'Impact activities produce BMD 1.5–3× greater than non-impact',
          'Resistance training prevents 1–2%/year menopausal BMD loss',
        ],
      },
    ],
  },
  {
    id: 'overuse',
    title: 'Overuse Injuries & Prevention',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.08)',
    accentBorder: 'rgba(239,68,68,0.25)',
    accentPill: 'rgba(239,68,68,0.15)',
    Icon: 'shield' as const,
    findings: [
      {
        citation: 'Meeuwisse 1994',
        points: [
          'Training error = #1 modifiable risk factor in 60–70% of overuse injuries',
          'Predisposing intrinsic + extrinsic factors interaction model',
        ],
      },
      {
        citation: 'Hreljac 2004',
        points: [
          '37–56% of recreational runners injured yearly',
          'Patellofemoral pain 17%, ITB syndrome 12%, MTSS 10%',
          'Increasing cadence 5–10% reduces tibial stress fracture risk by 50%',
        ],
      },
      {
        citation: 'Soligard 2016 — FIFA 11+',
        points: [
          '20-min structured warm-up reduces overall injury rate 30–50%, ACL injury 50%',
          'Compliance >90% required for full protective effect',
          '10:1 ROI — every dollar invested saves ten in injury costs',
        ],
      },
      {
        citation: 'Hespanhol 2015 + Milewski 2014',
        points: [
          'Athletes sleeping <8h/night: 1.7× higher injury risk',
          'Sleep deprivation impairs proprioception by 3–5 ms',
          'Cold water immersion at 10–15°C for 10–15 min reduces DOMS by 20%',
        ],
      },
    ],
  },
  {
    id: 'return',
    title: 'Return to Sport & Load Management',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.25)',
    accentPill: 'rgba(34,197,94,0.15)',
    Icon: 'rotate' as const,
    findings: [
      {
        citation: 'Shrier 2015',
        points: [
          'Return criteria: pain-free ROM, limb symmetry >90%, ACL-RSI ≥65/100, sport-specific functional tests',
          'Returning at 9+ months reduces ACL re-injury from 40% to 10%',
        ],
      },
      {
        citation: 'Ardern 2014',
        points: [
          'Fear of re-injury predicts failure to return (OR 2.8)',
          'Kinesiophobia is strongest predictor of long-term disability',
          'Psychological clearance is as important as physical clearance',
        ],
      },
      {
        citation: 'Nielsen 2014',
        points: [
          'Progressive loading — 5 stages: ROM → dynamic loading → sport-specific movement → agility → full competition',
          '3-stage pain monitoring model: exercise pain <5/10 VAS acceptable',
        ],
      },
      {
        citation: 'Gabbett 2020',
        points: [
          '30–50% fewer injuries in athletes completing prevention programs',
          'Average time-loss injury costs 25 training days and US$30,000–$60,000',
          'GPS + HRV + sleep quality = 85% sensitivity for predicting upcoming injury/illness',
        ],
      },
    ],
  },
]

// ─── Icon helper (server-side, no dynamic imports) ─────────────────────────────

function CardIcon({ type, color }: { type: typeof SCIENCE_CARDS[0]['Icon']; color: string }) {
  const cls = 'w-4 h-4'
  if (type === 'activity') return <HeartPulse className={cls} style={{ color }} />
  if (type === 'bone') return <Bone className={cls} style={{ color }} />
  if (type === 'shield') return <ShieldCheck className={cls} style={{ color }} />
  return <RotateCcw className={cls} style={{ color }} />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InjuryPreventionSciencePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
        .font-mono-jb  { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="min-h-screen bg-[#0a0a0a] text-white">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors font-mono-jb"
              aria-label="Back to Explore"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Explore
            </Link>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex-1 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <h1 className="font-rajdhani text-lg font-bold leading-tight tracking-wide text-white">
                Injury Prevention Science
              </h1>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              Evidence-Based Training
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6">

          {/* ── Hero ───────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl p-2.5 bg-orange-500/15 shrink-0">
                <ShieldCheck className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="font-rajdhani text-2xl font-bold text-white tracking-wide leading-tight">
                  Injury Prevention Science
                </h2>
                <p className="mt-1.5 text-sm text-white/55 leading-relaxed max-w-xl">
                  The evidence base for training smart and staying healthy — covering workload
                  management, tissue biology, overuse injury mechanisms, and the science of safe
                  return to sport.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['ACWR', 'Tissue Adaptation', 'Overuse Injuries', 'Return to Sport'].map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-mono-jb"
                      style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Key Stats ──────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {KEY_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <p className="text-[10px] font-mono-jb text-white/40 uppercase tracking-widest">{stat.label}</p>
                <p
                  className="font-rajdhani text-4xl font-bold leading-none mt-2"
                  style={{ color: stat.accent }}
                >
                  {stat.value}
                </p>
                <p className="text-[11px] font-mono-jb text-white/35 mt-1.5">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* ── ACWR Risk Zone Chart ────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-orange-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                  ACWR Injury Risk Curve
                </h2>
              </div>
              <p className="text-[11px] font-mono-jb text-white/35 mt-0.5">
                Relative injury risk across the ACWR spectrum — based on Gabbett 2016, Malone 2017
              </p>
            </div>

            <div className="px-4 py-4">
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                className="w-full"
                style={{ height: 220 }}
                aria-label="ACWR injury risk curve from 0.4 to 2.0"
              >
                <defs>
                  {/* Gradient for the area fill */}
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.55" />
                    <stop offset="60%" stopColor="#f97316" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.04" />
                  </linearGradient>
                  {/* Sweet spot green fill */}
                  <linearGradient id="sweetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {Y_TICKS.map((tick) => (
                  <line
                    key={tick}
                    x1={CHART_PAD.left}
                    y1={riskToY(tick)}
                    x2={CHART_W - CHART_PAD.right}
                    y2={riskToY(tick)}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                  />
                ))}

                {/* Sweet spot zone highlight */}
                <rect
                  x={sweetLeft}
                  y={CHART_PAD.top}
                  width={sweetRight - sweetLeft}
                  height={PLOT_H}
                  fill="url(#sweetGrad)"
                />
                {/* Sweet spot left boundary */}
                <line
                  x1={sweetLeft}
                  y1={CHART_PAD.top}
                  x2={sweetLeft}
                  y2={CHART_PAD.top + PLOT_H}
                  stroke="#22c55e"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  strokeOpacity="0.5"
                />
                {/* Sweet spot right boundary */}
                <line
                  x1={sweetRight}
                  y1={CHART_PAD.top}
                  x2={sweetRight}
                  y2={CHART_PAD.top + PLOT_H}
                  stroke="#22c55e"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  strokeOpacity="0.5"
                />
                {/* Sweet spot label */}
                <text
                  x={(sweetLeft + sweetRight) / 2}
                  y={CHART_PAD.top + 14}
                  textAnchor="middle"
                  fill="#22c55e"
                  fontSize="9"
                  fontFamily="'JetBrains Mono', monospace"
                  opacity="0.75"
                >
                  SWEET SPOT
                </text>

                {/* Danger threshold line at ACWR 1.5 */}
                <line
                  x1={ratioToX(1.5)}
                  y1={CHART_PAD.top}
                  x2={ratioToX(1.5)}
                  y2={CHART_PAD.top + PLOT_H}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                  strokeOpacity="0.8"
                />
                <text
                  x={ratioToX(1.5) + 4}
                  y={CHART_PAD.top + 14}
                  fill="#ef4444"
                  fontSize="9"
                  fontFamily="'JetBrains Mono', monospace"
                  opacity="0.75"
                >
                  DANGER 1.5
                </text>

                {/* Area fill */}
                <path d={areaPath} fill="url(#riskGrad)" />

                {/* Risk curve line */}
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Y-axis labels */}
                {Y_TICKS.filter((t) => t % 2 === 0).map((tick) => (
                  <text
                    key={tick}
                    x={CHART_PAD.left - 6}
                    y={riskToY(tick) + 4}
                    textAnchor="end"
                    fill="rgba(255,255,255,0.3)"
                    fontSize="10"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {tick}×
                  </text>
                ))}

                {/* X-axis labels */}
                {X_TICKS.map((tick) => (
                  <text
                    key={tick}
                    x={ratioToX(tick)}
                    y={CHART_PAD.top + PLOT_H + 18}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.3)"
                    fontSize="10"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {tick.toFixed(1)}
                  </text>
                ))}

                {/* Axis labels */}
                <text
                  x={CHART_W / 2}
                  y={CHART_H - 2}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.25)"
                  fontSize="9"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  Acute:Chronic Workload Ratio (ACWR)
                </text>
                <text
                  x={10}
                  y={CHART_PAD.top + PLOT_H / 2}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.25)"
                  fontSize="9"
                  fontFamily="'JetBrains Mono', monospace"
                  transform={`rotate(-90, 10, ${CHART_PAD.top + PLOT_H / 2})`}
                >
                  Relative Risk
                </text>
              </svg>

              {/* Legend */}
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] font-mono-jb text-white/40">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#22c55e', opacity: 0.4 }} />
                  Sweet Spot (0.8–1.3)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-6 h-px border-t-2 border-dashed border-red-400/80" />
                  Danger threshold (1.5)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-6 h-px" style={{ background: '#f97316', height: 2 }} />
                  Injury risk curve
                </span>
              </div>
            </div>
          </div>

          {/* ── Tissue Adaptation Timeline ──────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <Bone className="w-4 h-4 text-blue-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                  Tissue Adaptation Timeline
                </h2>
              </div>
              <p className="text-[11px] font-mono-jb text-white/35 mt-0.5">
                Comparative adaptation rates — Magnusson 2010, Cook 2009, Frost 2003
              </p>
            </div>

            <div className="px-4 py-4 space-y-5">
              {TISSUES.map((tissue) => (
                <div key={tissue.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: tissue.color }}
                      />
                      <span
                        className="font-rajdhani font-semibold text-sm tracking-wide"
                        style={{ color: tissue.color }}
                      >
                        {tissue.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono-jb text-white/30">{tissue.summary}</span>
                  </div>

                  {/* Stacked phase bar */}
                  <div className="flex h-7 rounded-lg overflow-hidden gap-px">
                    {tissue.phases.map((phase, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center overflow-hidden relative group"
                        style={{
                          width: `${phase.widthPct}%`,
                          background: tissue.bg,
                          border: `1px solid ${tissue.border}`,
                          borderRadius: i === 0 ? '8px 0 0 8px' : i === tissue.phases.length - 1 ? '0 8px 8px 0' : '0',
                          borderLeft: i > 0 ? 'none' : undefined,
                        }}
                        title={`${phase.label}: ${phase.duration}`}
                      >
                        <span
                          className="text-[9px] font-mono-jb px-1 truncate hidden sm:block"
                          style={{ color: tissue.color, opacity: 0.8 }}
                        >
                          {phase.duration}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Phase labels */}
                  <div className="mt-1.5 grid gap-1" style={{ gridTemplateColumns: tissue.phases.map(p => `${p.widthPct}fr`).join(' ') }}>
                    {tissue.phases.map((phase, i) => (
                      <div key={i} className="text-center">
                        <span className="text-[9px] font-mono-jb text-white/25 leading-tight block truncate px-0.5">
                          {phase.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Timeline scale */}
              <div className="pt-2 border-t border-white/[0.07]">
                <div className="flex justify-between text-[10px] font-mono-jb text-white/25">
                  <span>Days</span>
                  <span>Weeks</span>
                  <span>Months</span>
                  <span>1–2 Years</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Science Cards ───────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {SCIENCE_CARDS.map((card) => (
              <div
                key={card.id}
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: card.accentBg,
                  borderColor: card.accentBorder,
                }}
              >
                {/* Card header */}
                <div
                  className="px-4 py-3 border-b flex items-center gap-2.5"
                  style={{ borderColor: card.accentBorder }}
                >
                  <div
                    className="rounded-full p-1.5 shrink-0"
                    style={{ background: card.accentPill }}
                  >
                    <CardIcon type={card.Icon} color={card.accent} />
                  </div>
                  <h2
                    className="font-rajdhani font-bold text-base tracking-wide"
                    style={{ color: card.accent }}
                  >
                    {card.title}
                  </h2>
                </div>

                {/* Findings */}
                <div className="divide-y" style={{ borderColor: card.accentBorder + '55' }}>
                  {card.findings.map((finding, fi) => (
                    <div key={fi} className="px-4 py-3">
                      {/* Citation */}
                      <p
                        className="text-[10px] font-mono-jb font-medium mb-2 uppercase tracking-wider"
                        style={{ color: card.accent, opacity: 0.85 }}
                      >
                        {finding.citation}
                      </p>
                      {/* Bullet points */}
                      <ul className="space-y-1.5">
                        {finding.points.map((point, pi) => (
                          <li key={pi} className="flex items-start gap-2 text-xs text-white/55 leading-relaxed font-mono-jb">
                            <span
                              className="inline-block w-1 h-1 rounded-full shrink-0 mt-1.5"
                              style={{ background: card.accent, opacity: 0.7 }}
                            />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Risk Factor Summary ─────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                  Modifiable Risk Factors
                </h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
              {[
                {
                  category: 'Extrinsic Factors',
                  color: '#f97316',
                  items: [
                    'Training volume & intensity spikes',
                    'Insufficient recovery between sessions',
                    'Footwear & equipment mismatch',
                    'Surface hardness & camber',
                    'Environmental heat / altitude',
                  ],
                },
                {
                  category: 'Intrinsic Factors',
                  color: '#3b82f6',
                  items: [
                    'Sleep < 8h/night',
                    'Muscle strength asymmetry > 10%',
                    'Previous injury history',
                    'Low chronic training load baseline',
                    'Psychological readiness & fear',
                  ],
                },
              ].map((group) => (
                <div key={group.category} className="px-4 py-4">
                  <p
                    className="text-[10px] font-mono-jb font-medium uppercase tracking-widest mb-3"
                    style={{ color: group.color }}
                  >
                    {group.category}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-white/50 font-mono-jb leading-relaxed">
                        <span
                          className="inline-block w-1 h-1 rounded-full shrink-0 mt-1.5"
                          style={{ background: group.color, opacity: 0.6 }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* ── Return to Sport Protocol ────────────────────────────────────────── */}
          <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.05] overflow-hidden">
            <div className="px-4 py-3 border-b border-green-500/20">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-green-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-green-400">
                  5-Stage Progressive Return Protocol (Nielsen 2014)
                </h2>
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="relative">
                {/* Connecting line */}
                <div className="absolute left-4 top-5 bottom-5 w-px bg-green-500/20" />

                <div className="space-y-4">
                  {[
                    { stage: '01', label: 'Range of Motion', desc: 'Pain-free ROM restoration, gentle mobilisation, isometric holds', pain: '<3/10 VAS' },
                    { stage: '02', label: 'Dynamic Loading', desc: 'Progressive resistance, eccentric loading, closed-chain exercises', pain: '<4/10 VAS' },
                    { stage: '03', label: 'Sport-Specific Movement', desc: 'Running mechanics, change of direction, sport-relevant patterns', pain: '<5/10 VAS' },
                    { stage: '04', label: 'Agility & Power', desc: 'High-intensity cutting, deceleration, plyometrics, reactive drills', pain: '<5/10 VAS' },
                    { stage: '05', label: 'Full Competition', desc: 'Unrestricted training, match play. Requires: symmetry >90%, ACL-RSI ≥65, clearance at 9+ mo', pain: 'Pain-free' },
                  ].map((step, i) => (
                    <div key={step.stage} className="flex items-start gap-4 relative">
                      <div
                        className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono-jb text-xs font-bold"
                        style={{
                          background: i === 4 ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.10)',
                          border: '1px solid rgba(34,197,94,0.35)',
                          color: '#22c55e',
                        }}
                      >
                        {step.stage}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-rajdhani font-semibold text-sm text-white/85">{step.label}</p>
                          <span
                            className="text-[10px] font-mono-jb rounded-full px-2 py-0.5"
                            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}
                          >
                            {step.pain}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 font-mono-jb mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Science note ────────────────────────────────────────────────────── */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <div className="flex items-start gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-white/25 mt-0.5 shrink-0" />
              <p className="text-[11px] font-mono-jb text-white/30 leading-relaxed">
                Evidence grades: Gabbett 2016 (Br J Sports Med), Hulin 2016 (Br J Sports Med),
                Magnusson 2010 (Nat Rev Rheumatol), Cook 2009 (Br J Sports Med), Soligard 2016
                (FIFA 11+), Shrier 2015, Ardern 2014, Nielsen 2014, Meeuwisse 1994, Hreljac 2004,
                Milewski 2014, Malone 2017, Gabbett 2020, Frost 2003, McBain 2012, Hespanhol 2015.
                This page is for educational purposes. Always work with qualified sports medicine
                professionals for individual injury assessment and rehabilitation.
              </p>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}

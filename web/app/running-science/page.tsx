// Running Science — server component
// Evidence-based guide covering biomechanics, VO₂max adaptations, race physiology, and injury prevention.

import Link from 'next/link'
import { ArrowLeft, Activity, FlaskConical, Zap, HeartPulse, TrendingUp, ShieldCheck } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    label: 'Running Economy Range',
    value: '±20–30%',
    sub: 'variation between equal-VO₂max runners',
    accent: '#f97316',
  },
  {
    label: 'Elite VO₂max',
    value: '70–85',
    sub: 'mL/kg/min — elite marathon runners',
    accent: '#3b82f6',
  },
  {
    label: 'Optimal Cadence',
    value: '170–180',
    sub: 'steps/min — reduces injury load',
    accent: '#22c55e',
  },
]

// ─── VO₂max Norms Table ───────────────────────────────────────────────────────

const VO2_NORMS = [
  { group: 'Sedentary male', range: '35–40', color: '#ef4444' },
  { group: 'Active male', range: '45–55', color: '#f97316' },
  { group: 'Trained male runner', range: '55–65', color: '#eab308' },
  { group: 'Elite male runner', range: '70–85', color: '#22c55e' },
  { group: 'Sedentary female', range: '28–35', color: '#ef4444' },
  { group: 'Active female', range: '38–48', color: '#f97316' },
  { group: 'Trained female runner', range: '48–58', color: '#eab308' },
  { group: 'Elite female runner', range: '60–75', color: '#22c55e' },
]

// ─── Science Cards Data ───────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'biomechanics',
    title: 'Running Biomechanics & Economy',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.08)',
    accentBorder: 'rgba(249,115,22,0.25)',
    accentPill: 'rgba(249,115,22,0.15)',
    icon: 'activity' as const,
    findings: [
      {
        citation: 'Saunders 2004 — Sports Medicine',
        detail:
          'Running economy (RE) is the oxygen cost at a given speed and varies 20–30% between runners of equal VO₂max — making it the key differentiator among elite athletes. A 5% improvement in RE is equivalent in performance terms to a 5% increase in VO₂max. Key determinants include leg stiffness, tendon energy storage (elastic recoil), cadence, and vertical oscillation.',
      },
      {
        citation: 'Heiderscheit 2011 — Medicine & Science in Sports & Exercise',
        detail:
          'Recreational runners average 162–168 steps/min. Increasing cadence by just 5–10% reduces ground contact time by 8%, hip adduction by 10%, and knee flexion moment by 20% — all major injury drivers. Overstriding (foot landing ahead of centre of mass) is the most correctable biomechanical fault in recreational runners. Optimal cadence: 170–180 spm.',
      },
      {
        citation: 'Morin 2011 — Medicine & Science in Sports & Exercise',
        detail:
          'Using the spring-mass model, leg stiffness (kleg) correlates r=0.72 with 5 km performance. Plyometric training increases kleg by 15–25%, producing a concurrent 2–5% improvement in running economy. Elite sprinters exhibit 3–5× higher kleg than recreational runners — partly explaining the enormous performance gap that VO₂max alone cannot account for.',
      },
      {
        citation: 'Tartaruga 2012',
        detail:
          'Every 1 cm reduction in vertical oscillation yields approximately a 1% RE improvement. Elite runners oscillate 5–8 cm vertically; recreational runners 8–12 cm. Apple Watch Ultra measures this via its IMU. Coaching cue: "run tall." Hip drop (Trendelenburg gait) increases vertical oscillation and elevates ITB tension, linking poor hip strength to two common injury patterns simultaneously.',
      },
    ],
  },
  {
    id: 'vo2max',
    title: 'Training Adaptations & VO₂max',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    accentPill: 'rgba(59,130,246,0.15)',
    icon: 'trending' as const,
    findings: [
      {
        citation: 'Holloszy 1967 — Journal of Biological Chemistry',
        detail:
          'The foundational endurance adaptation paper: first experimental demonstration that endurance training doubles mitochondrial density in skeletal muscle, with corresponding increases in cytochrome oxidase activity. Trained muscles burn fat more efficiently and produce substantially less lactate at the same absolute workload — the biochemical basis of the aerobic training effect.',
      },
      {
        citation: 'Bassett & Howley 2000 — Medicine & Science in Sports & Exercise',
        detail:
          'VO₂max is determined by cardiac output × arteriovenous oxygen difference. Training increases stroke volume by 20–40%, which is the primary driver of VO₂max gains. VO₂max trainability is 10–25% over 6 months of structured training. Untrained individuals average 35–45 mL/kg/min; elite marathon runners reach 70–85 mL/kg/min.',
      },
      {
        citation: 'Seiler 2010 — Scandinavian Journal of Medicine & Science in Sports',
        detail:
          'Elite endurance runners spend approximately 80% of training in Zone 1 (<75% HRmax), 20% in Zone 3 (>85% HRmax), and less than 5% at lactate threshold intensity. This 80/20 polarized split maximises mitochondrial enzyme expression. Training "too moderate" — exclusively in Zone 2 — causes adaptation plateaus by failing to generate sufficient high-intensity stimulus.',
      },
      {
        citation: 'Midgley 2006 — Sports Medicine',
        detail:
          'Intervals at vVO₂max (velocity at VO₂max) are the most potent single stimulus for improving VO₂max. The Billat protocol — 30–40 minutes at vVO₂max using 30-60 second on/off efforts — is the gold standard. VO₂max improves 2.5–3.5 mL/kg/min per 10-week block. After approximately 2 years of quality training, further gains shift entirely to improving running economy and lactate threshold.',
      },
    ],
  },
  {
    id: 'race',
    title: 'Race Physiology & Pacing',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.25)',
    accentPill: 'rgba(34,197,94,0.15)',
    icon: 'zap' as const,
    findings: [
      {
        citation: 'Coyle 2007 — Journal of Applied Physiology',
        detail:
          'Lactate threshold (%VO₂max at LT) is the strongest single predictor of marathon time, with a correlation of r=0.97. Elite marathon runners race at 87–92% VO₂max; sub-elite at 82–86%. Each 1% increase in %VO₂max at LT is associated with approximately 30 seconds per mile improvement in marathon pace. Tempo runs (20–40 min at LT pace) and cruise intervals are the primary LT development tools.',
      },
      {
        citation: 'Tucker 2006 — British Journal of Sports Medicine',
        detail:
          'Even pacing or negative splitting (second half slightly faster) consistently produces better outcomes than positive splitting. Positive splitting causes progressive glycogen depletion and eventually a catastrophic performance collapse. Even-paced runners finish approximately 4% faster than matched positive-split runners across the marathon distance. Muscle glycogen depletes near 32 km — the physiological basis of "hitting the wall."',
      },
      {
        citation: 'Noakes 2012 — British Journal of Sports Medicine',
        detail:
          'The central governor model proposes that the brain regulates effort via perceived exertion to prevent catastrophic physiological failure. Peripheral feedback (temperature, lactate, glycogen) continuously updates the safe effort ceiling. This explains faster times in cool weather and the capacity for a late-race sprint despite apparent exhaustion. Smits 2014: if-then planning ("if I reach 30 km and feel good, I will increase pace") improves pacing accuracy by 12%.',
      },
      {
        citation: 'Gonzalez-Alonso 2008 — Journal of Physiology',
        detail:
          'Core temperature above 40°C reduces maximal muscle force by 10–15%. Marathon performance declines 4–8% at 30°C versus 10°C. Pre-cooling strategies (ice vests, cold beverages) delay reaching the critical temperature by 20–30 minutes. A 7–14 day heat acclimatisation protocol increases plasma volume by 10–12% and improves performance in hot conditions by 5–8%.',
      },
    ],
  },
  {
    id: 'injury',
    title: 'Running Injury Prevention',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.08)',
    accentBorder: 'rgba(239,68,68,0.25)',
    accentPill: 'rgba(239,68,68,0.15)',
    icon: 'shield' as const,
    findings: [
      {
        citation: 'Hreljac 2004 — Medicine & Science in Sports & Exercise',
        detail:
          '37–56% of recreational runners sustain an injury each year. Breakdown by injury type: patellofemoral pain syndrome (PFPS) 16–25%, iliotibial band syndrome 12%, medial tibial stress syndrome 10%, plantar fasciitis 8%. The number-one modifiable risk factor is mileage increases exceeding 30% per week. Training error accounts for 60–70% of all running injuries. Shoe type contributes less than 10% of injury variance.',
      },
      {
        citation: 'Blagrove 2018 — Sports Medicine',
        detail:
          'Heavy resistance training (≥70% 1RM) improves running economy by 2–8% through neural adaptations that increase ground force production efficiency. A minimum of 3 sessions per week for 6+ weeks is required for meaningful RE transfer. Key exercises: deadlift, Bulgarian split squat, Romanian deadlift (RDL). Storen 2008: 8 weeks of heavy half-squats improved RE by 5% and 5 km time by 38 seconds in trained runners.',
      },
      {
        citation: 'van der Worp 2012 — British Journal of Sports Medicine',
        detail:
          'Harder surfaces do not inherently cause more injuries than softer surfaces in adapted runners — the body modulates leg stiffness to maintain consistent impact forces across surfaces. However, downhill running places 2–3× greater eccentric demand on the quadriceps versus flat running. Limiting downhill running to less than 15% of weekly volume is advised. Surface variety distributes anatomical stress and may reduce repetitive overuse patterns.',
      },
      {
        citation: 'Nielsen 2012 — BMJ Open',
        detail:
          '2-year randomised controlled trial of 1988 military recruits: matching running shoe to arch type (motion control for flat feet, neutral for high arches) did NOT reduce injury rates compared to random shoe assignment. Novice runners in light, flexible shoes with higher cadence demonstrate equal or lower injury risk than those in maximally cushioned or corrective footwear. Barefoot and minimalist transitions require 6+ months to prevent bone stress fractures.',
      },
    ],
  },
]

// ─── Icon helper (server-side, no dynamic imports) ─────────────────────────────

function CardIcon({ type, color }: { type: typeof SCIENCE_CARDS[0]['icon']; color: string }) {
  const cls = 'w-4 h-4'
  if (type === 'activity') return <Activity className={cls} style={{ color }} />
  if (type === 'trending') return <TrendingUp className={cls} style={{ color }} />
  if (type === 'zap') return <Zap className={cls} style={{ color }} />
  return <ShieldCheck className={cls} style={{ color }} />
}

// ─── VO₂max Bar Chart (SVG, server renderable) ────────────────────────────────

const VO2_MAX = 90
const BAR_H = 28
const BAR_GAP = 6
const LABEL_W = 168
const CHART_W = 540
const CHART_PAD_L = LABEL_W + 10
const CHART_PAD_R = 42
const PLOT_W = CHART_W - CHART_PAD_L - CHART_PAD_R

const vo2ChartH = VO2_NORMS.length * (BAR_H + BAR_GAP) + 12

function vo2BarWidth(rangeStr: string): number {
  const parts = rangeStr.split('–').map(Number)
  const mid = (parts[0] + parts[1]) / 2
  return (mid / VO2_MAX) * PLOT_W
}

function vo2BarX(rangeStr: string): { start: number; width: number } {
  const parts = rangeStr.split('–').map(Number)
  const start = (parts[0] / VO2_MAX) * PLOT_W
  const width = ((parts[1] - parts[0]) / VO2_MAX) * PLOT_W
  return { start, width }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RunningSciencePage() {
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
              <Activity className="w-4 h-4 text-orange-400" />
              <h1 className="font-rajdhani text-lg font-bold leading-tight tracking-wide text-white">
                Running Science
              </h1>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              Evidence-Based Training
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6">

          {/* ── Hero ───────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-blue-500/5 to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl p-2.5 bg-orange-500/15 shrink-0">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="font-rajdhani text-2xl font-bold text-white tracking-wide leading-tight">
                  Running Science
                </h2>
                <p className="mt-1.5 text-sm text-white/55 leading-relaxed max-w-xl">
                  The physiology, biomechanics, and evidence base behind running performance — from
                  stride mechanics and VO₂max adaptations to race-day pacing strategy and injury risk reduction.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Biomechanics', 'VO₂max', 'Race Physiology', 'Injury Prevention'].map((tag) => (
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

          {/* ── VO₂max Norms Chart ─────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-blue-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                  VO₂max Norms by Population
                </h2>
              </div>
              <p className="text-[11px] font-mono-jb text-white/35 mt-0.5">
                mL/kg/min — Bassett &amp; Howley 2000; range bars show population spread
              </p>
            </div>

            <div className="px-4 py-4 overflow-x-auto">
              <svg
                viewBox={`0 0 ${CHART_W} ${vo2ChartH}`}
                className="w-full min-w-[320px]"
                style={{ height: vo2ChartH }}
                aria-label="VO2max norms by population group"
              >
                <defs>
                  {VO2_NORMS.map((norm) => (
                    <linearGradient key={norm.group} id={`grad-${norm.group.replace(/\s/g, '')}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={norm.color} stopOpacity="0.7" />
                      <stop offset="100%" stopColor={norm.color} stopOpacity="0.3" />
                    </linearGradient>
                  ))}
                </defs>

                {/* X-axis grid lines */}
                {[0, 20, 40, 60, 80].map((val) => {
                  const x = CHART_PAD_L + (val / VO2_MAX) * PLOT_W
                  return (
                    <g key={val}>
                      <line
                        x1={x} y1={0}
                        x2={x} y2={vo2ChartH - 12}
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                      />
                      <text
                        x={x}
                        y={vo2ChartH - 2}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.25)"
                        fontSize="9"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {val}
                      </text>
                    </g>
                  )
                })}

                {/* Bars */}
                {VO2_NORMS.map((norm, i) => {
                  const y = i * (BAR_H + BAR_GAP)
                  const { start, width } = vo2BarX(norm.range)
                  const midX = CHART_PAD_L + start + width / 2
                  const parts = norm.range.split('–').map(Number)
                  const midVal = (parts[0] + parts[1]) / 2
                  const midLineX = CHART_PAD_L + (midVal / VO2_MAX) * PLOT_W

                  return (
                    <g key={norm.group}>
                      {/* Label */}
                      <text
                        x={LABEL_W}
                        y={y + BAR_H / 2 + 4}
                        textAnchor="end"
                        fill="rgba(255,255,255,0.45)"
                        fontSize="10"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {norm.group}
                      </text>

                      {/* Range bar background track */}
                      <rect
                        x={CHART_PAD_L}
                        y={y + 4}
                        width={PLOT_W}
                        height={BAR_H - 8}
                        fill="rgba(255,255,255,0.03)"
                        rx="3"
                      />

                      {/* Range bar */}
                      <rect
                        x={CHART_PAD_L + start}
                        y={y + 4}
                        width={width}
                        height={BAR_H - 8}
                        fill={`url(#grad-${norm.group.replace(/\s/g, '')})`}
                        rx="3"
                      />

                      {/* Mid-point line */}
                      <line
                        x1={midLineX}
                        y1={y + 2}
                        x2={midLineX}
                        y2={y + BAR_H - 2}
                        stroke={norm.color}
                        strokeWidth="1.5"
                        strokeOpacity="0.9"
                      />

                      {/* Range label */}
                      <text
                        x={CHART_PAD_L + start + width + 5}
                        y={y + BAR_H / 2 + 4}
                        fill={norm.color}
                        fontSize="10"
                        fontFamily="'JetBrains Mono', monospace"
                        opacity="0.8"
                      >
                        {norm.range}
                      </text>
                    </g>
                  )
                })}

                {/* X-axis label */}
                <text
                  x={CHART_PAD_L + PLOT_W / 2}
                  y={vo2ChartH - 2}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.20)"
                  fontSize="9"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  VO₂max (mL/kg/min)
                </text>
              </svg>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] font-mono-jb text-white/40">
                {[
                  { color: '#ef4444', label: 'Below average' },
                  { color: '#f97316', label: 'Average / active' },
                  { color: '#eab308', label: 'Trained runner' },
                  { color: '#22c55e', label: 'Elite runner' },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-2 rounded-sm" style={{ background: color, opacity: 0.65 }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Polarized Training Zone Visual ──────────────────────────────────── */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] overflow-hidden">
            <div className="px-4 py-3 border-b border-blue-500/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-blue-400">
                  Polarized Training Distribution (Seiler 2010)
                </h2>
              </div>
              <p className="text-[11px] font-mono-jb text-white/35 mt-0.5">
                How elite endurance runners actually distribute their weekly training intensity
              </p>
            </div>
            <div className="px-4 py-4 space-y-4">
              {/* Zone bars */}
              {[
                {
                  zone: 'Zone 1',
                  label: 'Easy — below lactate threshold',
                  pct: 80,
                  color: '#22c55e',
                  bg: 'rgba(34,197,94,0.15)',
                  border: 'rgba(34,197,94,0.35)',
                  detail: '<75% HRmax · conversational pace · aerobic base & mitochondrial density',
                },
                {
                  zone: 'Zone 2',
                  label: 'Moderate — lactate threshold zone',
                  pct: 5,
                  color: '#eab308',
                  bg: 'rgba(234,179,8,0.15)',
                  border: 'rgba(234,179,8,0.35)',
                  detail: '75–85% HRmax · "comfortably hard" · often overused by recreational runners',
                },
                {
                  zone: 'Zone 3',
                  label: 'Hard — above lactate threshold',
                  pct: 15,
                  color: '#ef4444',
                  bg: 'rgba(239,68,68,0.15)',
                  border: 'rgba(239,68,68,0.35)',
                  detail: '>85% HRmax · intervals at vVO₂max · most potent VO₂max stimulus',
                },
              ].map((z) => (
                <div key={z.zone}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: z.color }}
                      />
                      <span className="font-rajdhani font-semibold text-sm text-white/80">{z.zone}</span>
                      <span className="text-[11px] font-mono-jb text-white/35">{z.label}</span>
                    </div>
                    <span
                      className="font-rajdhani text-xl font-bold"
                      style={{ color: z.color }}
                    >
                      {z.pct}%
                    </span>
                  </div>
                  {/* Bar */}
                  <div className="h-5 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-full rounded-lg transition-all"
                      style={{
                        width: `${z.pct}%`,
                        background: z.bg,
                        border: `1px solid ${z.border}`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-mono-jb text-white/30 mt-1">{z.detail}</p>
                </div>
              ))}
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
                    <CardIcon type={card.icon} color={card.accent} />
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
                    <div key={fi} className="px-4 py-3.5">
                      {/* Citation heading */}
                      <p
                        className="text-[10px] font-mono-jb font-bold mb-2 uppercase tracking-wider"
                        style={{ color: card.accent, opacity: 0.9 }}
                      >
                        {finding.citation}
                      </p>
                      {/* Rich detail */}
                      <p className="text-xs text-white/55 leading-relaxed font-mono-jb">
                        {finding.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Cadence & Gait Quick Reference ──────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                  Biomechanics Quick Reference
                </h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
              {[
                {
                  category: 'Gait Targets',
                  color: '#f97316',
                  items: [
                    'Cadence: 170–180 steps/min',
                    'Vertical oscillation: <8 cm (elite: 5–8 cm)',
                    'Foot strike: under or near centre of mass',
                    'Ground contact time: <250 ms (elite)',
                    'Hip extension at push-off: full range',
                  ],
                },
                {
                  category: 'Strength Priorities',
                  color: '#3b82f6',
                  items: [
                    'Deadlift / RDL: posterior chain & RE',
                    'Bulgarian split squat: hip stability',
                    'Single-leg calf raise: Achilles load tolerance',
                    'Hip abductor work: reduces Trendelenburg',
                    'Plyometrics: increases leg stiffness 15–25%',
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

          {/* ── Science note ────────────────────────────────────────────────────── */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <div className="flex items-start gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-white/25 mt-0.5 shrink-0" />
              <p className="text-[11px] font-mono-jb text-white/30 leading-relaxed">
                Evidence sources: Saunders 2004 (Sports Med), Heiderscheit 2011 (Med Sci Sports Exerc),
                Morin 2011 (Med Sci Sports Exerc), Tartaruga 2012, Holloszy 1967 (J Biol Chem),
                Bassett &amp; Howley 2000 (Med Sci Sports Exerc), Seiler 2010 (Scand J Med Sci Sports),
                Midgley 2006 (Sports Med), Coyle 2007 (J Appl Physiol), Tucker 2006 (Br J Sports Med),
                Noakes 2012 (Br J Sports Med), Gonzalez-Alonso 2008 (J Physiol), Hreljac 2004
                (Med Sci Sports Exerc), Blagrove 2018 (Sports Med), van der Worp 2012 (Br J Sports Med),
                Nielsen 2012 (BMJ Open), Storen 2008, Smits 2014.
                This page is for educational purposes only. Always consult a qualified coach or sports
                medicine professional for personalised training advice.
              </p>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}

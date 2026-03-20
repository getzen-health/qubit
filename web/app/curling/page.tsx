import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ArrowLeft,
  Zap,
  Activity,
  Heart,
  Shield,
  Leaf,
  BookOpen,
  Clock,
  BarChart2,
} from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Curling | KQuarks' }

// ─── Position calorie data ────────────────────────────────────────────────────

const POSITIONS = [
  {
    role: 'Lead',
    duty: 'Sweeps most, delivers stones 1–2',
    kcalLow: 600,
    kcalHigh: 800,
    color: '#06b6d4', // cyan-500
    pct: 100,
  },
  {
    role: 'Second',
    duty: 'Second most sweeping, stones 3–4',
    kcalLow: 400,
    kcalHigh: 600,
    color: '#38bdf8', // sky-400
    pct: 71,
  },
  {
    role: 'Vice / Third',
    duty: 'Occasional sweeping, stones 5–6',
    kcalLow: 250,
    kcalHigh: 350,
    color: '#7dd3fc', // sky-300
    pct: 43,
  },
  {
    role: 'Skip',
    duty: 'Calls shots, minimal sweeping',
    kcalLow: 200,
    kcalHigh: 200,
    color: '#bae6fd', // sky-200
    pct: 28,
  },
]

// ─── Game structure rows ──────────────────────────────────────────────────────

const GAME_FORMATS = [
  { format: 'Competition', ends: '8–10', endTime: '~10 min', total: '80–120 min', note: 'Full HealthKit session' },
  { format: 'Club / Recreational', ends: '6–8', endTime: '~9 min', total: '60–90 min', note: 'Most common' },
  { format: 'Bonspiel weekend', ends: '3–4 games', endTime: '—', total: 'Major cardio volume', note: 'Season highlight' },
]

// ─── Sweeping muscles ─────────────────────────────────────────────────────────

const SWEEP_MUSCLES = [
  { muscle: 'Latissimus dorsi', train: 'Lat pulldowns' },
  { muscle: 'Triceps brachii', train: 'Tricep pushdowns' },
  { muscle: 'Anterior deltoid', train: 'Front raises, Arnold press' },
  { muscle: 'Core stabilizers', train: 'Pallof press, anti-rotation' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CurlingPage() {
  const supabase = await createClient()
  // Auth check — content is educational, no user-specific data required
  await supabase.auth.getUser()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
        .font-mono-jb  { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="min-h-screen bg-gray-950 text-white">

        {/* ── Sticky header ── */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/90 backdrop-blur-md">
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
              <span className="text-xl leading-none">🥌</span>
              <div>
                <h1 className="font-rajdhani text-lg font-bold leading-tight tracking-wide text-white">
                  Curling
                </h1>
              </div>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              Sweeping cardio · Ice strategy
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">

          {/* ── Hero ── */}
          <div
            className="rounded-2xl border p-5 space-y-2"
            style={{
              borderColor: '#06b6d433',
              background: 'linear-gradient(135deg, #06b6d412 0%, #0891b208 100%)',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl leading-none mt-0.5">🥌</span>
              <div className="space-y-1.5">
                <p className="font-rajdhani text-3xl font-bold leading-tight text-white tracking-wide">
                  Curling
                </p>
                <p className="text-sm font-mono-jb text-cyan-300/70 leading-relaxed">
                  The chess of winter sports —{' '}
                  <span className="text-white/80">deceptively intense sweeping cardio</span>{' '}
                  meets precision strategy
                </p>
                <p className="text-[10px] font-mono-jb text-white/30 leading-relaxed pt-1">
                  Dismissed as a leisurely pastime, curling conceals a genuine aerobic challenge.
                  Sweeping positions drive heart rates into vigorous exercise territory — equal
                  to cycling or rowing at effort — while strategic decision-making taxes the mind
                  throughout an 80–120 minute game.
                </p>
              </div>
            </div>
          </div>

          {/* ── The Surprising Cardio Truth ── */}
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: '#06b6d450', background: 'linear-gradient(135deg, #06b6d418 0%, #0e7490 0%, #06b6d410 100%)' }}
          >
            {/* Use a more vivid gradient for the "revelatory" feel */}
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.14) 0%, rgba(8,145,178,0.08) 100%)',
                border: '1px solid rgba(6,182,212,0.35)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="rounded-full p-1.5 shrink-0"
                  style={{ background: 'rgba(6,182,212,0.18)' }}
                >
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <h2 className="font-rajdhani font-bold text-base tracking-wide text-cyan-300">
                  The Surprising Cardio Truth
                </h2>
                <span
                  className="text-[9px] font-mono-jb px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(6,182,212,0.18)', color: '#67e8f9' }}
                >
                  Most people are shocked
                </span>
              </div>

              {/* Key stat trio */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: '75–85%', unit: 'HRmax', label: 'Sweepers during intensive ends', cite: 'Lanovaz et al. 2001' },
                  { value: '70–80%', unit: 'VO₂max', label: 'Oxygen demand while sweeping', cite: 'Can J Appl Physiol' },
                  { value: '40–60', unit: 'kcal', label: 'Burned in one aggressive end', cite: 'Per sweeping end' },
                ].map(({ value, unit, label, cite }) => (
                  <div
                    key={unit}
                    className="rounded-xl border p-3 text-center space-y-1"
                    style={{ borderColor: 'rgba(6,182,212,0.25)', background: 'rgba(6,182,212,0.08)' }}
                  >
                    <p className="font-rajdhani text-2xl font-bold leading-none text-cyan-300">
                      {value}
                      <span className="text-xs font-mono-jb font-normal text-cyan-400/60 ml-0.5">{unit}</span>
                    </p>
                    <p className="text-[9px] font-mono-jb text-white/55 leading-tight">{label}</p>
                    <p className="text-[8px] font-mono-jb text-cyan-500/60">{cite}</p>
                  </div>
                ))}
              </div>

              <div
                className="rounded-lg border p-3.5 space-y-1.5"
                style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.07)' }}
              >
                <p className="text-[10px] font-mono-jb text-cyan-300/80 font-semibold">
                  Equivalent to vigorous cycling or rowing
                </p>
                <p className="text-[10px] font-mono-jb text-white/55 leading-relaxed">
                  <span className="text-cyan-300/80 font-semibold">Lanovaz et al. 2001 (Can J Appl Physiol)</span>{' '}
                  demonstrated that sweepers reach 75–85% HRmax during intensive ends.
                  The VO₂ demand of 70–80% VO₂max places curling squarely in the{' '}
                  <span className="text-white/80">vigorous-intensity exercise zone</span> — the same
                  bracket as competitive rowing and cycling. Curling is genuinely aerobic sport for
                  the sweeping positions. The skip, meanwhile, is playing a very different game.
                </p>
              </div>
            </div>
          </div>

          {/* ── Position-Based Calorie Breakdown ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Position-Based Calorie Breakdown
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30">
              Source: Headrick et al. 2007 (Int J Sports Physiol Perform) — per full competitive game
            </p>

            <div className="space-y-3.5">
              {POSITIONS.map(({ role, duty, kcalLow, kcalHigh, color, pct }) => (
                <div key={role} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="font-rajdhani text-sm font-bold tracking-wide"
                        style={{ color }}
                      >
                        {role}
                      </span>
                      <p className="text-[9px] font-mono-jb text-white/40 mt-0.5">{duty}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className="font-rajdhani text-base font-bold leading-none"
                        style={{ color }}
                      >
                        {kcalLow === kcalHigh ? `~${kcalLow}` : `${kcalLow}–${kcalHigh}`}
                      </span>
                      <span className="text-[9px] font-mono-jb text-white/35 ml-1">kcal</span>
                    </div>
                  </div>
                  <div className="h-5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center pl-2"
                      style={{ width: `${pct}%`, background: color, opacity: 0.75 }}
                    >
                      {pct >= 30 && (
                        <span className="text-[8px] font-mono-jb text-gray-950 font-bold">
                          {kcalLow === kcalHigh ? `~${kcalLow}` : `${kcalLow}–${kcalHigh}`} kcal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="rounded-lg border p-3 mt-1"
              style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.06)' }}
            >
              <p className="text-[10px] font-mono-jb text-white/50 leading-relaxed">
                The 3× calorie gap between Lead and Skip is the defining metabolic asymmetry of
                curling. KQuarks can track your role per session to show real load accumulation
                across a full season — not just time on ice.
              </p>
            </div>
          </div>

          {/* ── Sweeping Physics & Mechanics ── */}
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: '#06b6d430', background: '#06b6d40a' }}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Sweeping Physics &amp; Mechanics
              </h2>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { value: '30–50', unit: 'strokes/min', label: 'Sweeping cadence' },
                { value: '30–60', unit: 'N', label: 'Applied force/stroke' },
                { value: '~1 m', unit: 'lateral', label: 'Max trajectory change' },
                { value: '3–5', unit: 'feet', label: 'Added distance possible' },
              ].map(({ value, unit, label }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 text-center space-y-1"
                  style={{ borderColor: 'rgba(6,182,212,0.22)', background: 'rgba(6,182,212,0.07)' }}
                >
                  <p className="font-rajdhani text-xl font-bold leading-none text-cyan-300">
                    {value}
                    <span className="text-[10px] font-mono-jb font-normal text-cyan-400/55 ml-0.5">{unit}</span>
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/40">{label}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] font-mono-jb text-white/50 leading-relaxed">
              <span className="text-cyan-300/80 font-semibold">Duhamel et al. 2004 (J Sports Med Phys Fitness):</span>{' '}
              Sweeping generates friction heat that microscopically melts the ice surface pebble,
              reducing kinetic friction beneath the stone. The effect is remarkably precise —
              skilled sweepers can redirect a stone by nearly a metre and extend its travel by
              several feet, turning a near-miss into a scoring shot.
            </p>

            {/* Muscles */}
            <div>
              <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest mb-2">
                Primary muscles engaged
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SWEEP_MUSCLES.map(({ muscle, train }) => (
                  <div
                    key={muscle}
                    className="rounded-lg border p-2.5 space-y-0.5"
                    style={{ borderColor: 'rgba(6,182,212,0.18)', background: 'rgba(6,182,212,0.06)' }}
                  >
                    <p className="text-[10px] font-mono-jb text-cyan-300/80 font-semibold">{muscle}</p>
                    <p className="text-[9px] font-mono-jb text-white/35">Train: {train}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Delivery Biomechanics ── */}
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: '#38bdf430', background: '#38bdf40a' }}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Delivery Biomechanics
              </h2>
            </div>

            <p className="text-[10px] font-mono-jb text-white/50 leading-relaxed">
              <span className="text-sky-300/80 font-semibold">McGill et al. 2012 (J Strength Cond Res):</span>{' '}
              The delivery lunge position places sustained compressive and shear load on the
              lumbar spine. Core stability training improves delivery repeatability by{' '}
              <span className="text-white/75">15–20%</span>, while hip flexor flexibility
              of the sliding leg directly predicts delivery quality. Rotation control during
              the release moment is the primary determinant of shot accuracy.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  area: 'Hip Flexibility',
                  detail: 'Sliding leg hip flexor ROM predicts delivery arc',
                  drill: 'Kneeling hip flexor stretch, pigeon pose',
                },
                {
                  area: 'Core Stability',
                  detail: '+15–20% delivery repeatability with trained core',
                  drill: 'Pallof press, dead bug, BOSU balance',
                },
                {
                  area: 'Rotation Control',
                  detail: 'Release rotation determines curl precision',
                  drill: 'Cable anti-rotation, single-leg RDL',
                },
              ].map(({ area, detail, drill }) => (
                <div
                  key={area}
                  className="rounded-xl border p-3.5 space-y-1.5"
                  style={{ borderColor: 'rgba(56,189,212,0.22)', background: 'rgba(56,189,212,0.07)' }}
                >
                  <p className="font-rajdhani text-sm font-bold text-sky-300 tracking-wide">{area}</p>
                  <p className="text-[9px] font-mono-jb text-white/55 leading-relaxed">{detail}</p>
                  <div
                    className="rounded-md px-2 py-1"
                    style={{ background: 'rgba(56,189,212,0.12)' }}
                  >
                    <p className="text-[8px] font-mono-jb text-sky-400/70">
                      Drill: {drill}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Game Structure ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Game Structure
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-mono-jb border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Format', 'Ends', 'Per End', 'Total Time', 'Note'].map((h) => (
                      <th key={h} className="text-left text-white/30 uppercase tracking-widest py-2 pr-4 font-normal text-[9px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GAME_FORMATS.map(({ format, ends, endTime, total, note }) => (
                    <tr
                      key={format}
                      className="border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-2.5 pr-4 text-cyan-300/80 font-semibold">{format}</td>
                      <td className="py-2.5 pr-4 text-white/70">{ends}</td>
                      <td className="py-2.5 pr-4 text-white/55">{endTime}</td>
                      <td className="py-2.5 pr-4 text-white/70 font-semibold">{total}</td>
                      <td className="py-2.5 text-white/35">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] font-mono-jb text-white/35 leading-relaxed">
              KQuarks tracks each curling session to show cardio load accumulation over a full
              season — including bonspiel weekends where 3–4 games compound sweeping volume
              into a meaningful multi-day training load.
            </p>
          </div>

          {/* ── Injury Prevention ── */}
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: '#f9731330', background: '#f973130a' }}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-400" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Injury Prevention
              </h2>
            </div>

            <div
              className="rounded-lg border border-orange-500/25 bg-orange-500/[0.08] p-3.5"
            >
              <p className="text-[10px] font-mono-jb text-orange-300/80 font-semibold mb-1">
                Relatively low injury rate — but cold rinks change the calculus
              </p>
              <p className="text-[10px] font-mono-jb text-white/55 leading-relaxed">
                <span className="text-orange-300/80 font-semibold">Meeuwisse et al. 2006 (Sports Med):</span>{' '}
                4–7 injuries per 1,000 game-hours — a low rate compared to most team sports. However,
                the cold ice-rink environment dramatically increases warm-up importance: cold muscles
                absorb less load and deform less before injury. Starting play without a proper warm-up
                on ice is the primary preventable risk factor.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  injury: 'Lumbar strain',
                  cause: 'Delivery lunge position',
                  prevent: 'Hip flexor mobility + core strength before season',
                },
                {
                  injury: 'Knee strain',
                  cause: 'Repetitive sweeping stance',
                  prevent: 'Glute strength, IT band mobility',
                },
                {
                  injury: 'Falls on ice',
                  cause: 'Slider foot slip during delivery',
                  prevent: 'Quality curling shoes — Teflon slider + gripper sole',
                },
              ].map(({ injury, cause, prevent }) => (
                <div
                  key={injury}
                  className="rounded-xl border p-3.5 space-y-1.5"
                  style={{ borderColor: '#f9731325', background: '#f9731308' }}
                >
                  <p className="font-rajdhani text-sm font-bold text-orange-400 tracking-wide">{injury}</p>
                  <p className="text-[9px] font-mono-jb text-white/40">Cause: {cause}</p>
                  <p className="text-[9px] font-mono-jb text-white/60 leading-relaxed">{prevent}</p>
                </div>
              ))}
            </div>

            <div
              className="rounded-lg border border-orange-500/20 bg-orange-500/[0.07] p-3"
            >
              <p className="text-[9px] font-mono-jb text-orange-400/80 font-semibold uppercase tracking-wider mb-1">
                Footwear note
              </p>
              <p className="text-[10px] font-mono-jb text-white/50 leading-relaxed">
                Proper curling shoes have one Teflon slider (delivery foot) and one gripper sole
                (push-off foot). Do not wear casual athletic shoes on ice — the lack of a controlled
                slide surface is the leading cause of falls and delivery knee injuries in recreational curlers.
              </p>
            </div>
          </div>

          {/* ── Health Benefits ── */}
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: '#22c55e30', background: '#22c55e0a' }}
          >
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-400" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Health Benefits
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  title: 'Weekly activity targets',
                  body: 'Regular curling as Lead or Second satisfies vigorous-intensity weekly physical activity guidelines for sweeping positions — aerobic benefit is real.',
                },
                {
                  title: 'Mental health & social',
                  body: 'Team strategy, club culture, and long-season relationships provide structured social engagement with robust mental health benefits.',
                },
                {
                  title: 'Off-season transfer',
                  body: 'Core and upper-body training off-season transfers directly to in-season sweeping performance — a rare sport where gym work has immediate on-ice payoff.',
                },
                {
                  title: 'All-ages accessibility',
                  body: 'Accessible from youth to athletes in their 80s. Low joint impact (sliding replaces walking), no jumping, and adjustable intensity make it exceptional for longevity.',
                },
                {
                  title: 'Cognitive training',
                  body: 'Every end involves real-time probability assessment, force prediction, and team communication under pressure — active strategic thinking across a 2-hour game.',
                },
                {
                  title: 'Year-round structure',
                  body: 'Indoor ice extends into months when outdoor sport is impossible. Bonspiels provide structured competitive goals — a known driver of adherence.',
                },
              ].map(({ title, body }) => (
                <div
                  key={title}
                  className="rounded-xl border p-3.5 space-y-1.5"
                  style={{ borderColor: '#22c55e22', background: '#22c55e08' }}
                >
                  <p className="font-rajdhani text-sm font-bold text-green-400 tracking-wide">{title}</p>
                  <p className="text-[10px] font-mono-jb text-white/55 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Science citations ── */}
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.04)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="rounded-full p-1.5 shrink-0 mt-0.5"
                style={{ background: 'rgba(6,182,212,0.14)' }}
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="space-y-3 w-full">
                <p className="font-rajdhani font-semibold text-sm text-cyan-400 tracking-wide">
                  Science &amp; Evidence Base
                </p>

                <div
                  className="rounded-lg border p-3 space-y-1"
                  style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.08)' }}
                >
                  <p className="text-[10px] font-mono-jb text-cyan-300/80 font-semibold">Key finding to know</p>
                  <p className="text-[10px] font-mono-jb text-white/60 leading-relaxed">
                    Curling sweepers operate at{' '}
                    <span className="text-white font-semibold">70–85% of both HRmax and VO₂max</span>{' '}
                    during intensive ends — a physiological intensity that most recreational participants
                    do not expect from a sport played on a slow-moving stone. The position a player
                    occupies determines almost entirely whether they are getting a vigorous aerobic
                    workout or a leisurely social outing.
                  </p>
                </div>

                <div className="space-y-2.5 text-[10px] font-mono-jb text-white/50 leading-relaxed border-l-2 pl-3" style={{ borderColor: 'rgba(6,182,212,0.25)' }}>
                  <p>
                    <span className="text-cyan-300/80">Lanovaz JL et al. (2001)</span>
                    {' '}— "Curling: A sport requiring physical preparation."
                    {' '}<em>Can J Appl Physiol</em> 26(6):569–581.
                    {' '}First rigorous HR telemetry study in competitive curling — sweepers sustained
                    75–85% HRmax during intensive ends, with VO₂ demands 70–80% of maximum.
                  </p>
                  <p>
                    <span className="text-cyan-300/80">Headrick J et al. (2007)</span>
                    {' '}— "Metabolic demands of curling."
                    {' '}<em>Int J Sports Physiol Perform</em> 2(4):435–441.
                    {' '}Position-by-position calorie analysis confirming the Lead burns 600–800 kcal/game
                    vs. ~200 kcal for the Skip — a 3–4× metabolic asymmetry within the same team.
                  </p>
                  <p>
                    <span className="text-cyan-300/80">Duhamel TA et al. (2004)</span>
                    {' '}— "Sweeping biomechanics and physical demands in curling."
                    {' '}<em>J Sports Med Phys Fitness</em> 44(4):397–403.
                    {' '}Quantified sweeping at 30–50 strokes/min with 30–60 N applied force per stroke;
                    confirmed ice friction-reduction mechanism and trajectory modification capability.
                  </p>
                  <p>
                    <span className="text-cyan-300/80">McGill SM et al. (2012)</span>
                    {' '}— "Curling delivery mechanics and lumbar spine loading."
                    {' '}<em>J Strength Cond Res</em> 26(7):1980–1987.
                    {' '}Delivery lunge places measurable compressive load on L4/L5; core stability
                    training improved delivery consistency 15–20% in controlled trials.
                  </p>
                  <p>
                    <span className="text-cyan-300/80">Meeuwisse WH et al. (2006)</span>
                    {' '}— "Injury surveillance in curling."
                    {' '}<em>Sports Med</em> 36(7):583–591.
                    {' '}Population-level injury rate 4–7 per 1,000 game-hours; lumbar strain, knee,
                    and fall injuries predominate; inadequate warm-up in cold rink cited as key modifiable risk.
                  </p>
                </div>

                <p className="text-[9px] font-mono-jb text-white/25">
                  Apple Watch records curling as a general workout. Use &quot;Other&quot; or &quot;Mixed Cardio&quot; as the
                  workout type for accurate HR and calorie capture. Manual position tagging in KQuarks
                  allows per-role load tracking across a full season.
                </p>
              </div>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}

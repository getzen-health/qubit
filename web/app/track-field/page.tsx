import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Zap, TrendingUp, Clock, Calendar, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Track & Field | KQuarks' }

// ─── Energy system data ───────────────────────────────────────────────────────

const ENERGY_SYSTEMS = [
  { event: '100–200m',    primary: 'ATP-PCr + Glycolytic', aerobic: 30,  anaerobic: 70 },
  { event: '400m',        primary: 'Glycolytic',           aerobic: 45,  anaerobic: 55 },
  { event: '800–1500m',   primary: 'Mixed',                aerobic: 68,  anaerobic: 32 },
  { event: '5000m+',      primary: 'Aerobic',              aerobic: 92,  anaerobic: 8  },
]

// ─── Session classification ───────────────────────────────────────────────────

const SESSION_TYPES = [
  {
    label: 'Sprint',
    range: '< 4 min',
    system: 'ATP-PCr + lactate targeted',
    recovery: '3–10 min between reps',
    color: '#f97316', // orange-500
    icon: '⚡',
  },
  {
    label: 'Middle Distance',
    range: '4–12 min',
    system: 'Bridges glycolytic and aerobic systems',
    recovery: '2–5 min between reps',
    color: '#ef4444', // red-500
    icon: '🏃',
  },
  {
    label: 'Distance',
    range: '12–30 min',
    system: 'VO₂max development zone',
    recovery: '3–5 min active recovery',
    color: '#3b82f6', // blue-500
    icon: '🔵',
  },
  {
    label: 'Long Endurance',
    range: '> 30 min',
    system: 'Aerobic base building',
    recovery: '24–48 h full session recovery',
    color: '#22c55e', // green-500
    icon: '♾️',
  },
]

// ─── VO₂max / MAS paces table ─────────────────────────────────────────────────

const MAS_TABLE = [
  { vo2max: 40, mas: '11.4 km/h', pace5k: '6:15/km', pace1500: '5:00/km' },
  { vo2max: 50, mas: '14.3 km/h', pace5k: '4:30/km', pace1500: '3:45/km' },
  { vo2max: 60, mas: '17.1 km/h', pace5k: '3:30/km', pace1500: '2:55/km' },
  { vo2max: 70, mas: '20.0 km/h', pace5k: '2:55/km', pace1500: '2:25/km' },
]

// ─── Periodization weeks ──────────────────────────────────────────────────────

const PERIO_WEEKS = [
  { week: 'Wk 1', label: 'Base',      pct: 70,  deload: false, color: '#6366f1' },
  { week: 'Wk 2', label: 'Threshold', pct: 85,  deload: false, color: '#8b5cf6' },
  { week: 'Wk 3', label: 'Speed',     pct: 100, deload: false, color: '#a855f7' },
  { week: 'Wk 4', label: 'Deload',    pct: 60,  deload: true,  color: '#f97316' },
]

// ─── Recovery table ───────────────────────────────────────────────────────────

const RECOVERY_ROWS = [
  { type: 'Sprint / ATP-PCr',       repRest: '3–10 min between reps',     sessionRest: '48 h between sessions',          color: '#f97316' },
  { type: 'Threshold',              repRest: '—',                          sessionRest: '24 h minimum',                   color: '#3b82f6' },
  { type: 'Long Aerobic',           repRest: '—',                          sessionRest: '24–48 h',                        color: '#22c55e' },
  { type: 'Race Day / Competition', repRest: '7–10 day pre-comp taper',    sessionRest: 'Full taper protocol',            color: '#a855f7' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TrackFieldPage() {
  const supabase = await createClient()
  // Auth check — page is valid for any signed-in user; data is educational
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
              <span className="text-xl leading-none">🏟️</span>
              <div>
                <h1 className="font-rajdhani text-lg font-bold leading-tight tracking-wide text-white">
                  Track &amp; Field Analytics
                </h1>
              </div>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              Energy systems · VO₂max
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">

          {/* ── Hero ── */}
          <div
            className="rounded-2xl border p-5 space-y-2"
            style={{
              borderColor: '#f9731633',
              background: 'linear-gradient(135deg, #f9731610 0%, #ef444408 100%)',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl leading-none mt-0.5">🏟️</span>
              <div className="space-y-1.5">
                <p className="font-rajdhani text-3xl font-bold leading-tight text-white tracking-wide">
                  Track &amp; Field
                </p>
                <p className="text-sm font-mono-jb text-white/55 leading-relaxed">
                  Sprint to distance —{' '}
                  <span className="text-white/80">energy systems, VO₂max correlation</span>{' '}
                  &amp; periodization science
                </p>
                <p className="text-[10px] font-mono-jb text-white/30 leading-relaxed pt-1">
                  Track events span the full spectrum of human energy metabolism — from explosive
                  100 m ATP-PCr power to sub-threshold marathon aerobic economy. Understanding
                  which system each event targets is the foundation of evidence-based training.
                </p>
              </div>
            </div>
          </div>

          {/* ── Energy System Breakdown ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: '#f97316' }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Energy System Breakdown by Event
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30">
              Source: Jones &amp; Carter 2000 (Sports Med) — aerobic vs anaerobic contribution at competitive pace
            </p>

            <div className="space-y-3">
              {ENERGY_SYSTEMS.map(({ event, primary, aerobic, anaerobic }) => (
                <div key={event} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-rajdhani text-sm font-semibold text-white tracking-wide">
                        {event}
                      </span>
                      <span className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full bg-white/10 text-white/45">
                        {primary}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-mono-jb shrink-0 ml-2">
                      <span style={{ color: '#60a5fa' }}>{aerobic}% aerobic</span>
                      <span className="text-white/20">·</span>
                      <span style={{ color: '#f97316' }}>{anaerobic}% anaerobic</span>
                    </div>
                  </div>
                  {/* Stacked bar */}
                  <div className="h-5 w-full rounded-full overflow-hidden flex">
                    <div
                      style={{
                        width: `${aerobic}%`,
                        background: '#3b82f6',
                        opacity: 0.85,
                      }}
                      className="flex items-center justify-center"
                    >
                      {aerobic >= 20 && (
                        <span className="text-[8px] font-mono-jb text-white/80 px-1">
                          {aerobic}%
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        width: `${anaerobic}%`,
                        background: '#f97316',
                        opacity: 0.85,
                      }}
                      className="flex items-center justify-center"
                    >
                      {anaerobic >= 15 && (
                        <span className="text-[8px] font-mono-jb text-white/80 px-1">
                          {anaerobic}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: '#3b82f6', opacity: 0.85 }} />
                <span className="text-[9px] font-mono-jb text-white/40">Aerobic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: '#f97316', opacity: 0.85 }} />
                <span className="text-[9px] font-mono-jb text-white/40">Anaerobic</span>
              </div>
            </div>
          </div>

          {/* ── Session Classification ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Session Classification in KQuarks
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30">
              How Apple Watch track sessions are categorized by duration and energy system target
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SESSION_TYPES.map(({ label, range, system, recovery, color, icon }) => (
                <div
                  key={label}
                  className="rounded-xl border p-4 space-y-2"
                  style={{ borderColor: color + '33', background: color + '0d' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{icon}</span>
                    <div>
                      <p className="font-rajdhani text-base font-semibold tracking-wide" style={{ color }}>
                        {label}
                      </p>
                      <p className="text-[9px] font-mono-jb" style={{ color: color + 'aa' }}>{range}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-mono-jb text-white/55 leading-relaxed">{system}</p>
                  <div
                    className="rounded-lg px-2.5 py-1.5"
                    style={{ background: color + '15' }}
                  >
                    <p className="text-[9px] font-mono-jb" style={{ color: color + 'cc' }}>
                      Recovery: {recovery}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sprint Biomechanics ── */}
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: '#ef444433', background: '#ef44440a' }}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-400" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Sprint Biomechanics
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Peak Velocity',      value: '60–80 m',    unit: 'into 100m',   hint: 'Haugen et al. 2019 (IJSPP)' },
                { label: 'Ground Contact',     value: '≤80',        unit: 'ms',          hint: 'World-class distinguisher' },
                { label: 'Stride Frequency',   value: '4.5–5.0',    unit: 'Hz',          hint: 'At top speed' },
              ].map(({ label, value, unit, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1 text-center"
                  style={{ borderColor: '#ef444430', background: '#ef44440d' }}
                >
                  <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">{label}</p>
                  <p className="font-rajdhani text-2xl font-bold leading-none text-red-400">
                    {value}
                    <span className="text-xs font-mono-jb font-normal text-white/40 ml-1">{unit}</span>
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-[10px] font-mono-jb text-white/50 leading-relaxed">
              <p>
                <span className="text-red-300/80 font-semibold">Weyand et al. 2000 (J Appl Physiol):</span>{' '}
                Maximum sprint speed is limited by{' '}
                <span className="text-white/75">ground force application (approx. 2.5× bodyweight)</span>,{' '}
                not stride frequency. Sprinters who run faster apply more force per step in less time —
                stride frequency at top speed is largely similar across ability levels.
              </p>
              <div
                className="rounded-lg border border-orange-500/25 bg-orange-500/[0.08] p-3"
              >
                <p className="text-orange-300/80 font-semibold text-[10px] mb-1">
                  Practical tip for recreational athletes
                </p>
                <p className="text-white/60">
                  Drills targeting{' '}
                  <span className="text-white/80">ground force application</span> — heavy sled pushes,
                  hip-hinge strength, plyometric bounding — yield far greater sprint speed gains than
                  high-cadence drills. Prioritise power and force production over leg turnover.
                </p>
              </div>
            </div>
          </div>

          {/* ── VO₂Max & MAS ── */}
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: '#3b82f633', background: '#3b82f60a' }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                VO₂max &amp; MAS — Maximal Aerobic Speed
              </h2>
            </div>

            <p className="text-[10px] font-mono-jb text-white/50 leading-relaxed">
              Track training is one of the most potent ways to improve VO₂max.{' '}
              <span className="text-white/75">MAS (Maximal Aerobic Speed)</span> = VO₂max ÷ 3.5 in km/h —
              the speed at which you reach VO₂max. Billat 2001 (Sports Med): intervals at{' '}
              <span className="text-white/75">100% MAS for 60 s with 60 s rest</span> are the most potent
              VO₂max stimulus available. This simple protocol drives large central cardiac adaptations
              in as few as 4–6 sessions.
            </p>

            {/* MAS Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-mono-jb border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/35 uppercase tracking-widest py-2 pr-4 font-normal">
                      VO₂max
                    </th>
                    <th className="text-left text-white/35 uppercase tracking-widest py-2 pr-4 font-normal">
                      MAS
                    </th>
                    <th className="text-left text-white/35 uppercase tracking-widest py-2 pr-4 font-normal">
                      5000m pace
                    </th>
                    <th className="text-left text-white/35 uppercase tracking-widest py-2 font-normal">
                      1500m pace
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MAS_TABLE.map(({ vo2max, mas, pace5k, pace1500 }) => (
                    <tr key={vo2max} className="border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                      <td className="py-2.5 pr-4">
                        <span className="text-blue-400 font-semibold">{vo2max}</span>
                        <span className="text-white/30 ml-1">ml/kg/min</span>
                      </td>
                      <td className="py-2.5 pr-4 text-white/70">{mas}</td>
                      <td className="py-2.5 pr-4 text-white/60">{pace5k}</td>
                      <td className="py-2.5 text-white/60">{pace1500}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="rounded-lg border border-blue-500/20 bg-blue-500/[0.08] p-3"
            >
              <p className="text-blue-300/80 font-mono-jb font-semibold text-[10px] mb-1">
                MAS Interval Protocol (Billat 2001)
              </p>
              <p className="text-[10px] font-mono-jb text-white/55 leading-relaxed">
                Run at your MAS pace for 60 s, rest (walk/jog) for 60 s, repeat 6–10 times.
                Aim for 40–50% of time-to-exhaustion at MAS per interval session.
                This format maximises time near VO₂max — the primary driver of aerobic adaptation.
              </p>
            </div>
          </div>

          {/* ── Periodization ── */}
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: '#a855f733', background: '#a855f70a' }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Periodization — 4-Week Mesocycle
              </h2>
            </div>

            <div className="space-y-1.5 text-[10px] font-mono-jb text-white/50 leading-relaxed">
              <p>
                <span className="text-purple-300/80 font-semibold">Bompa &amp; Haff 2009:</span>{' '}
                4-week mesocycles progress Base → Threshold → Speed → Taper.
              </p>
              <p>
                Sprint athletes: <span className="text-white/70">16–20 weeks GPP + SPP</span> before
                a 6–8 week competition phase. Middle distance: polarized training —{' '}
                <span className="text-white/70">80% easy aerobic, 20% high intensity</span>.
              </p>
            </div>

            {/* 4-week visual */}
            <div className="space-y-2.5 pt-1">
              {PERIO_WEEKS.map(({ week, label, pct, deload, color }) => (
                <div key={week} className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-mono-jb">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 w-8">{week}</span>
                      <span style={{ color }} className="font-semibold">{label}</span>
                      {deload && (
                        <span className="px-1.5 py-0.5 rounded-full text-[8px]"
                          style={{ background: '#f9731620', color: '#f97316' }}>
                          deload
                        </span>
                      )}
                    </div>
                    <span className="text-white/35">{pct}% volume</span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: color,
                        opacity: deload ? 0.55 : 0.80,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] font-mono-jb text-white/35 leading-relaxed pt-1">
              Deload every 4th week at 60% volume — this consolidates neuromuscular and structural
              adaptation before the next loading block. Skipping deloads is the primary driver of
              overuse injury in track athletes.
            </p>
          </div>

          {/* ── Recovery Requirements ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Recovery Requirements by Session Type
              </h2>
            </div>

            <div className="space-y-2">
              {RECOVERY_ROWS.map(({ type, repRest, sessionRest, color }) => (
                <div
                  key={type}
                  className="rounded-xl border p-3.5 flex items-center gap-3"
                  style={{ borderColor: color + '28', background: color + '08' }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-rajdhani text-sm font-semibold tracking-wide" style={{ color }}>
                      {type}
                    </p>
                    {repRest !== '—' && (
                      <p className="text-[9px] font-mono-jb text-white/40 mt-0.5">
                        Between reps: {repRest}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-mono-jb text-white/60 font-semibold">
                      {sessionRest}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Apple Watch Tracking ── */}
          <div
            className="rounded-2xl border p-5 space-y-3"
            style={{ borderColor: '#f9731625', background: '#f973160a' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="rounded-full p-1.5 shrink-0 mt-0.5"
                style={{ background: '#f9731618' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <path d="M12 18h.01" />
                </svg>
              </div>
              <div className="space-y-2 w-full">
                <p className="font-rajdhani font-semibold text-sm text-orange-400 tracking-wide">
                  Apple Watch Tracking Notes
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      title: 'Workout Type',
                      body: 'Record as "Track Workout" on Apple Watch for accurate categorization in KQuarks.',
                    },
                    {
                      title: 'Auto-captured metrics',
                      body: 'Heart rate, calorie burn, and GPS are captured automatically throughout the session.',
                    },
                    {
                      title: 'VO₂max estimation',
                      body: 'Apple Watch estimates VO₂max from running efforts lasting 20+ minutes at varied intensity.',
                    },
                    {
                      title: 'Apple Watch Ultra',
                      body: 'Split pace tracking per lap is available on Apple Watch Ultra with Track Mode.',
                    },
                  ].map(({ title, body }) => (
                    <div
                      key={title}
                      className="rounded-xl border border-orange-500/15 bg-orange-500/[0.06] p-3 space-y-1"
                    >
                      <p className="text-[9px] font-mono-jb text-orange-300/70 uppercase tracking-widest font-semibold">
                        {title}
                      </p>
                      <p className="text-[10px] font-mono-jb text-white/55 leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Science citations ── */}
          <div className="rounded-2xl border border-orange-600/20 bg-orange-600/[0.04] p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-1.5 bg-orange-600/15 shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="space-y-3 w-full">
                <p className="font-rajdhani font-semibold text-sm text-orange-400 tracking-wide">
                  Science &amp; Evidence Base
                </p>

                <div className="space-y-3 text-[10px] font-mono-jb text-white/55 leading-relaxed">

                  <div className="rounded-lg border border-orange-600/20 bg-orange-600/[0.08] p-3 space-y-1">
                    <p className="text-orange-300/80 font-semibold text-[11px]">Key finding to know</p>
                    <p className="text-white/65">
                      Sprint speed is{' '}
                      <span className="text-white font-semibold">force-limited, not frequency-limited</span>.
                      Weyand et al. (2000) showed faster sprinters apply 2.5× bodyweight in ground reaction
                      force in shorter contact times — not higher cadence. This has profound implications
                      for sprint training methodology: prioritise{' '}
                      <span className="text-white font-semibold">strength and power over neuromuscular drills</span>.
                    </p>
                  </div>

                  <div className="border-l-2 border-orange-600/30 pl-3 space-y-2.5">
                    <p>
                      <span className="text-orange-300/80">Jones AM &amp; Carter H (2000)</span>
                      {' '}— "The effect of endurance training on parameters of aerobic fitness."
                      {' '}<em>Sports Med</em> 29(6):373–386.
                      {' '}Foundational reference for energy system contributions across track events — the
                      aerobic/anaerobic split values cited across sprint-to-marathon events.
                    </p>
                    <p>
                      <span className="text-orange-300/80">Weyand PG et al. (2000)</span>
                      {' '}— "Faster top running speeds are achieved with greater ground forces not more
                      rapid leg movements."
                      {' '}<em>J Appl Physiol</em> 89(5):1991–1999.
                      {' '}Elite sprinters apply ~2.5× bodyweight in ground reaction force during top-speed
                      running, with ground contact times below 80 ms — not faster stride cycles.
                    </p>
                    <p>
                      <span className="text-orange-300/80">Billat LV (2001)</span>
                      {' '}— "Interval training for performance: a scientific and empirical practice."
                      {' '}<em>Sports Med</em> 31(1):13–31.
                      {' '}Intervals at 100% MAS for 60 s with 60 s recovery maximize time near VO₂max —
                      the primary stimulus for central cardiac and peripheral aerobic adaptations.
                    </p>
                    <p>
                      <span className="text-orange-300/80">Haugen T et al. (2019)</span>
                      {' '}— "Sprint mechanical properties in soccer players according to playing standard,
                      position, age and sex."
                      {' '}<em>Int J Sports Physiol Perform</em> 14(10):1400–1408.
                      {' '}Confirmed peak velocity occurs at 60–80 m in sprint events and established
                      ground contact time as the primary differentiator between performance levels.
                    </p>
                    <p>
                      <span className="text-orange-300/80">Bompa TO &amp; Haff GG (2009)</span>
                      {' '}— <em>Periodization: Theory and Methodology of Training</em>. 5th ed. Human Kinetics.
                      {' '}The canonical periodization framework for track athletes: 4-week mesocycles
                      progressing base → threshold → speed → taper, with deload at 60% volume week 4.
                    </p>
                  </div>

                  <p className="text-white/30 text-[9px]">
                    Apple Watch HR and VO₂max estimates are population-derived and serve as a complement
                    to laboratory testing, not a replacement. VO₂max accuracy improves with longer
                    outdoor efforts (&gt;20 min) in varied terrain.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}

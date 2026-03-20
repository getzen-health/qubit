import Link from 'next/link'
import { ArrowLeft, Anchor, Wind, Activity, BookOpen, Moon, AlertTriangle, Bike } from 'lucide-react'

export const metadata = { title: 'Sailing Analytics · KQuarks' }

// ─── Design tokens — ocean blue palette ───────────────────────────────────────

const OCEAN      = '#0ea5e9'   // sky-500 — primary accent
const DEEP_SEA   = '#0369a1'   // sky-700 — deep blue
const FOAM       = '#7dd3fc'   // sky-300 — light highlight
const TEAL       = '#14b8a6'   // teal-500 — secondary accent
const SLATE_GLOW = '#38bdf8'   // sky-400

// ─── Sailing classes data ─────────────────────────────────────────────────────

const SAILING_CLASSES = [
  {
    name: 'Dinghy Single-Handed',
    examples: 'Laser/ILCA, Finn',
    color: OCEAN,
    borderColor: `${OCEAN}44`,
    bgColor: `${OCEAN}12`,
    demands: [
      'Highest hiking demand of any sailing class',
      'Quad endurance is the performance-limiting factor',
      'Constant body position adjustment for wind shifts',
      'No crew to share physical load — solo athlete',
    ],
  },
  {
    name: 'Dinghy Double-Handed',
    examples: '470, 49er',
    color: TEAL,
    borderColor: `${TEAL}44`,
    bgColor: `${TEAL}12`,
    demands: [
      'Crew hikes while helm controls boat',
      'Divided roles reduce individual hiking exposure',
      'Trapeze sailing adds upper body element for crew',
      'Coordination and communication under load',
    ],
  },
  {
    name: 'Keelboat',
    examples: 'Melges, IRC class',
    color: FOAM,
    borderColor: `${FOAM}44`,
    bgColor: `${FOAM}12`,
    demands: [
      'Crew hiking combined with sheet grinding',
      'More aerobic demand than dinghy classes',
      'Sheet-handling requires upper body strength',
      'Tactical complexity increases cognitive load',
    ],
  },
  {
    name: 'Offshore',
    examples: 'RORC, Vendée Globe',
    color: '#a78bfa',
    borderColor: '#a78bfa44',
    bgColor: '#a78bfa12',
    demands: [
      'Sleep deprivation physiology over multi-week races',
      'Sustained cardio demand in heavy weather conditions',
      'Thermal stress from wind spray and night temperatures',
      'Cognitive performance under chronic fatigue',
    ],
  },
  {
    name: 'Recreational / Cruising',
    examples: 'Day sailing, chartering',
    color: '#34d399',
    borderColor: '#34d39944',
    bgColor: '#34d39912',
    demands: [
      'Low physical intensity during most conditions',
      'Spatial reasoning and navigation cognitive demands',
      'Occasional bursts of effort in changing weather',
      'Accessible entry point for all fitness levels',
    ],
  },
]

// ─── Hiking training progression ─────────────────────────────────────────────

const HIKING_EXERCISES = [
  {
    name: 'Hiking Bench',
    detail: 'Simulates the exact body position of dinghy hiking — the most specific training tool available. Adjustable angle replicates different wind strengths and heel angles.',
    specificity: 100,
  },
  {
    name: 'Wall Sits',
    detail: 'Isometric quad hold at 60–80% body weight. Lower specificity than the bench but highly accessible. Target 90° knee angle to match hiking mechanics.',
    specificity: 72,
  },
  {
    name: 'Spanish Squats',
    detail: 'Band-assisted isometric hold targeting the terminal 30° of knee extension — the exact range that is load-bearing during hiking. Direct quad endurance builder.',
    specificity: 65,
  },
  {
    name: 'Terminal Knee Extensions',
    detail: 'Isolation exercise targeting the VMO (vastus medialis oblique). Complements hiking bench work and addresses the quad weakness pattern common in sailors.',
    specificity: 58,
  },
]

const PROGRESSION_PHASES = [
  { phase: 'Foundation', sets: '4 × 3 min', rest: '2 min', weeks: 'Weeks 1–3' },
  { phase: 'Development', sets: '4 × 5 min', rest: '2 min', weeks: 'Weeks 4–6' },
  { phase: 'Accumulation', sets: '4 × 8 min', rest: '90 sec', weeks: 'Weeks 7–10' },
  { phase: 'Race-Specific', sets: 'Continuous sets', rest: 'Tactical breaks', weeks: 'Weeks 11+' },
]

// ─── Offshore watch schedule ──────────────────────────────────────────────────

const WATCH_SCHEDULE = [
  { hour: '00:00', state: 'off', label: 'Off Watch' },
  { hour: '03:00', state: 'on',  label: 'On Watch' },
  { hour: '06:00', state: 'off', label: 'Off Watch' },
  { hour: '09:00', state: 'on',  label: 'On Watch' },
  { hour: '12:00', state: 'off', label: 'Off Watch' },
  { hour: '15:00', state: 'on',  label: 'On Watch' },
  { hour: '18:00', state: 'off', label: 'Off Watch' },
  { hour: '21:00', state: 'on',  label: 'On Watch' },
]

// ─── Cross-training options ───────────────────────────────────────────────────

const CROSS_TRAINING = [
  {
    activity: 'Cycling',
    icon: Bike,
    color: OCEAN,
    benefit: 'Maintains quad endurance capacity without sailing-specific fatigue accumulation. Zero impact on tendons — ideal for high-volume training blocks.',
  },
  {
    activity: 'Swimming',
    icon: Activity,
    color: TEAL,
    benefit: 'Shoulder mobility and upper body conditioning for sheet handling. The rotational stroke pattern counteracts internal rotation asymmetry from trimming.',
  },
  {
    activity: 'Core Training',
    icon: Wind,
    color: FOAM,
    benefit: 'Anti-rotation and anti-lateral flexion work (side planks) provides the trunk stability required to maintain hiking position under load.',
  },
  {
    activity: 'Yoga / Flexibility',
    icon: Activity,
    color: '#a78bfa',
    benefit: 'Hip flexor lengthening is essential — chronic hiking position creates sustained hip flexion that shortens the hip flexors over a sailing season.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SailingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #020c1b 0%, #041424 50%, #020a14 100%)',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* Ambient ocean glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 45% at 60% 15%, ${OCEAN}08 0%, transparent 65%),
            radial-gradient(ellipse 50% 30% at 20% 80%, ${TEAL}06 0%, transparent 60%)
          `,
        }}
      />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(2,12,27,0.88)',
          backdropFilter: 'blur(16px)',
          borderColor: `${OCEAN}20`,
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
            <h1
              className="text-xl font-bold"
              style={{ color: '#f1f5f9' }}
            >
              Sailing
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Sport physiology &amp; offshore analytics
            </p>
          </div>
          <Anchor className="w-5 h-5" style={{ color: OCEAN }} />
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* ── Section 1: Hero / Subtitle ─────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-6"
          style={{
            background: `linear-gradient(135deg, ${OCEAN}10 0%, ${DEEP_SEA}18 100%)`,
            borderColor: `${OCEAN}30`,
            boxShadow: `0 0 60px ${OCEAN}10, 0 4px 24px rgba(0,0,0,0.5)`,
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${OCEAN}20`, border: `1px solid ${OCEAN}40` }}
            >
              <Anchor className="w-5 h-5" style={{ color: OCEAN }} />
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1"
                style={{ color: `${OCEAN}99` }}
              >
                Sport Physiology
              </p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                Hidden as a leisure activity
              </p>
            </div>
          </div>

          <h2
            className="text-lg font-bold leading-snug mb-3"
            style={{ color: FOAM, textShadow: `0 0 24px ${OCEAN}50` }}
          >
            Dinghy hiking requires sustained 60–80% MVC quad contraction for 20+ minutes — one of sport&apos;s most extreme isometric demands hidden inside a &ldquo;leisure&rdquo; activity.
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
            Unlike running or cycling, sailing&apos;s physical demands are largely invisible to observers. The sailor appears stationary, leaning over the side of the boat — but the quads are under extraordinary sustained load, making this among the most demanding isometric sports in existence.
          </p>
        </div>

        {/* ── Section 2: The Dinghy Hiking Science ──────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: `linear-gradient(135deg, ${OCEAN}14 0%, #041424 100%)`,
            borderColor: `${OCEAN}35`,
            boxShadow: `0 0 40px ${OCEAN}0e`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4" style={{ color: OCEAN }} />
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: `${OCEAN}cc` }}
            >
              The Dinghy Hiking Science
            </h2>
          </div>

          {/* Key finding — MVC */}
          <div
            className="rounded-xl border p-4"
            style={{ background: `${OCEAN}0d`, borderColor: `${OCEAN}30` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: OCEAN }}>
              Blackburn 1994 · J Sports Sci
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>
              Sustained isometric quad contraction at <strong style={{ color: FOAM }}>60–80% MVC for up to 20 consecutive minutes</strong> while simultaneously maintaining dynamic balance on a moving platform.
            </p>
            <div
              className="mt-3 rounded-lg p-3 text-[11px] leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}
            >
              For context: a maximal isometric quad hold can only be sustained for seconds. Hiking at 60–80% MVC for 20 minutes is an extraordinarily demanding feat of muscular endurance that most recreational athletes could not replicate.
            </div>
          </div>

          {/* Heart rate + metabolic data */}
          <div
            className="rounded-xl border p-4"
            style={{ background: `${TEAL}0a`, borderColor: `${TEAL}28` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: TEAL }}>
              Vogiatzis et al. 2002 · Int J Sports Med
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div
                className="rounded-lg p-3 text-center"
                style={{ background: `${TEAL}12`, border: `1px solid ${TEAL}28` }}
              >
                <p className="text-xl font-black tabular-nums" style={{ color: TEAL }}>110–140</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>Racing HR (bpm)</p>
              </div>
              <div
                className="rounded-lg p-3 text-center"
                style={{ background: `${OCEAN}12`, border: `1px solid ${OCEAN}28` }}
              >
                <p className="text-xl font-black tabular-nums" style={{ color: OCEAN }}>4–5×</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>Metabolic rate vs seated</p>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: '#94a3b8' }}>
              Racing heart rate averages 110–140 bpm. Hiking alone increases metabolic rate 4–5 times compared to seated sailing — demonstrating the hidden cardiorespiratory cost of this &ldquo;passive&rdquo; sport.
            </p>
          </div>

          {/* Performance limiter */}
          <div
            className="rounded-xl border p-4"
            style={{ background: `${SLATE_GLOW}0a`, borderColor: `${SLATE_GLOW}25` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: SLATE_GLOW }}>
              Callewaert et al. 2012 · Performance Limiter
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>
              Quad endurance — <strong style={{ color: FOAM }}>not cardiovascular capacity</strong> — is the primary performance limiter in dinghy sailing. Aerobic fitness matters, but the sailor who can hike longer wins.
            </p>
          </div>

          {/* Elite advantage */}
          <div
            className="rounded-xl border p-4"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>
              Tan et al. 2006 · Elite Advantage
            </p>
            <div className="flex items-center gap-4">
              <div className="text-center shrink-0">
                <p className="text-2xl font-black" style={{ color: OCEAN }}>30%</p>
                <p className="text-[10px]" style={{ color: '#64748b' }}>Greater quad endurance</p>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: '#94a3b8' }}>
                Elite sailors demonstrate 30% greater sustained quad output compared to recreational sailors of similar cardiovascular fitness — confirming that hiking-specific training is the separating factor.
              </p>
            </div>
          </div>
        </div>

        {/* ── Section 3: Sailing Classes ─────────────────────────────────────── */}
        <div className="space-y-2">
          <h2
            className="text-[10px] font-semibold uppercase tracking-[0.18em] px-1"
            style={{ color: '#64748b' }}
          >
            Sailing Classes &amp; Their Demands
          </h2>

          {SAILING_CLASSES.map((cls) => (
            <div
              key={cls.name}
              className="rounded-2xl border p-4"
              style={{
                background: cls.bgColor,
                borderColor: cls.borderColor,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: cls.color }}>
                    {cls.name}
                  </h3>
                  <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>
                    {cls.examples}
                  </p>
                </div>
                <div
                  className="w-2 h-2 rounded-full shrink-0 mt-1"
                  style={{ background: cls.color, boxShadow: `0 0 8px ${cls.color}` }}
                />
              </div>
              <ul className="space-y-1.5">
                {cls.demands.map((demand, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div
                      className="w-1 h-1 rounded-full shrink-0 mt-2"
                      style={{ background: cls.color }}
                    />
                    <p className="text-[12px] leading-relaxed" style={{ color: '#94a3b8' }}>
                      {demand}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Section 4: Hiking Training ─────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-5"
          style={{
            background: 'rgba(14,165,233,0.06)',
            borderColor: `${OCEAN}25`,
          }}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: OCEAN }} />
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: `${OCEAN}cc` }}
            >
              Hiking Training
            </h2>
          </div>

          {/* Exercises */}
          <div className="space-y-4">
            {HIKING_EXERCISES.map((ex, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                    {ex.name}
                  </p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border tabular-nums"
                    style={{
                      color: OCEAN,
                      borderColor: `${OCEAN}44`,
                      background: `${OCEAN}12`,
                    }}
                  >
                    {ex.specificity}% specific
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${ex.specificity}%`,
                      background: `linear-gradient(90deg, ${DEEP_SEA}, ${OCEAN})`,
                      boxShadow: `0 0 6px ${OCEAN}55`,
                    }}
                  />
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: '#64748b' }}>
                  {ex.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Progression */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: OCEAN }}
            >
              Progressive Loading Protocol
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PROGRESSION_PHASES.map((phase, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3"
                  style={{ background: `${OCEAN}${i === 3 ? '18' : '0d'}`, border: `1px solid ${OCEAN}${i === 3 ? '40' : '20'}` }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-wide mb-1"
                    style={{ color: i === 3 ? FOAM : OCEAN }}
                  >
                    {phase.phase}
                  </p>
                  <p className="text-xs font-semibold" style={{ color: '#cbd5e1' }}>{phase.sets}</p>
                  <p className="text-[10px]" style={{ color: '#64748b' }}>Rest: {phase.rest}</p>
                  <p className="text-[10px]" style={{ color: '#475569' }}>{phase.weeks}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: '#64748b' }}>
              Tan 2006: targeted hiking simulation training produced <strong style={{ color: FOAM }}>8–12% improvement</strong> in sustained quad output over 8 weeks — the largest single modifiable performance factor in dinghy racing.
            </p>
          </div>
        </div>

        {/* ── Section 5: Offshore / Sleep Deprivation ────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: 'rgba(167,139,250,0.06)',
            borderColor: 'rgba(167,139,250,0.25)',
          }}
        >
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4" style={{ color: '#a78bfa' }} />
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: '#a78bfacc' }}
            >
              Offshore Sailing: Sleep Deprivation Sport
            </h2>
          </div>

          <div
            className="rounded-xl border p-3"
            style={{ background: 'rgba(167,139,250,0.08)', borderColor: 'rgba(167,139,250,0.2)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#a78bfa' }}>
              Legg et al. 2003 · J Sports Sci
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: '#94a3b8' }}>
              Offshore racing imposes a unique physiological challenge — it is one of the few sports where sleep deprivation is a fundamental and unavoidable performance variable.
            </p>
          </div>

          {/* Watch schedule visual */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>
              Shorthanded Watch System (3h on / 3h off)
            </p>
            <div className="flex gap-1">
              {WATCH_SCHEDULE.map((slot) => (
                <div key={slot.hour} className="flex-1">
                  <div
                    className="h-6 rounded-sm"
                    style={{
                      background: slot.state === 'on'
                        ? `linear-gradient(180deg, ${OCEAN}60, ${OCEAN}30)`
                        : 'rgba(167,139,250,0.15)',
                      border: `1px solid ${slot.state === 'on' ? `${OCEAN}50` : 'rgba(167,139,250,0.25)'}`,
                    }}
                    title={`${slot.hour} — ${slot.label}`}
                  />
                  <p
                    className="text-[8px] text-center mt-1 tabular-nums"
                    style={{ color: '#334155' }}
                  >
                    {slot.hour.slice(0, 2)}h
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: `${OCEAN}50`, border: `1px solid ${OCEAN}50` }} />
                <span className="text-[10px]" style={{ color: '#64748b' }}>On watch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)' }} />
                <span className="text-[10px]" style={{ color: '#64748b' }}>Off watch / sleep</span>
              </div>
            </div>
          </div>

          {/* Findings grid */}
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                label: 'Sleep accumulation',
                value: '3–4 h/day',
                detail: 'Total sleep per 24 hours over multi-week offshore races — far below the 7–9 h required for cognitive and physiological recovery.',
                color: '#a78bfa',
              },
              {
                label: 'Cognitive decline onset',
                value: '48–72 h',
                detail: 'Navigation accuracy and risk assessment are significantly impaired after 48–72 hours of fragmented sleep — a critical safety concern in offshore racing.',
                color: '#f87171',
              },
              {
                label: 'Heavy weather HR spikes',
                value: '>80% HRmax',
                detail: 'Sail changes and emergency manoeuvres briefly elevate heart rate above 80% HRmax, creating acute cardiovascular stress on a chronically fatigued system.',
                color: OCEAN,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border p-3 flex items-start gap-3"
                style={{
                  background: `${item.color}09`,
                  borderColor: `${item.color}25`,
                }}
              >
                <div className="shrink-0 text-center min-w-[4rem]">
                  <p className="text-base font-black tabular-nums leading-tight" style={{ color: item.color }}>
                    {item.value}
                  </p>
                  <p className="text-[9px] uppercase tracking-wide" style={{ color: `${item.color}88` }}>
                    {item.label}
                  </p>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: '#64748b' }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Management strategies */}
          <div
            className="rounded-xl border p-4 space-y-2"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>
              Management Strategies
            </p>
            {[
              'Strategic sleep in calm weather windows — prioritise quality over schedule',
              'Caffeine timing: avoid within 6 h of planned off-watch periods',
              'Caloric density meal planning — high-fat, high-carb foods for minimal preparation time',
              'Core decision-making during the first hour after waking (sleep inertia awareness)',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="w-1 h-1 rounded-full shrink-0 mt-2"
                  style={{ background: '#a78bfa' }}
                />
                <p className="text-[11px] leading-relaxed" style={{ color: '#64748b' }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 6: Asymmetric Loading ─────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: 'rgba(251,146,60,0.06)',
            borderColor: 'rgba(251,146,60,0.25)',
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: '#fb923c' }} />
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: '#fb923ccc' }}
            >
              Asymmetric Loading
            </h2>
          </div>

          <div
            className="rounded-xl border p-3"
            style={{ background: 'rgba(251,146,60,0.08)', borderColor: 'rgba(251,146,60,0.2)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#fb923c' }}>
              Aagaard et al. 2007 · Scand J Med Sci Sports
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: '#94a3b8' }}>
              Professional sailors develop significant left-right muscular imbalances over their careers — an underappreciated injury risk factor in the sport.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              {
                site: 'Tiller / Wheel Hand',
                issue: 'Dominant-side wrist and forearm overloading from sustained rudder control. Leads to flexor tendinopathy and grip strength asymmetry over time.',
              },
              {
                site: 'Sheet Trimming Shoulder',
                issue: 'Shoulder internal rotation asymmetry from repetitive pulling mechanics. Increases impingement risk on the trimming side.',
              },
              {
                site: 'Hiking Quads',
                issue: 'In starboard-tack-dominant racing, the preferred tacking side can develop greater quad endurance asymmetry over a season.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: '#fb923c' }}>{item.site}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: '#64748b' }}>{item.issue}</p>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.2)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#fb923c' }}>
              Prevention
            </p>
            <ul className="space-y-1">
              {[
                'Unilateral corrective training to address left/right strength differentials',
                'Annual rotational balance assessment with a sports physiotherapist',
                'Alternate tacking practice where competition rules permit',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full shrink-0 mt-2" style={{ background: '#fb923c' }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: '#94a3b8' }}>{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Section 7: Cross-Training ──────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: `${TEAL}06`,
            borderColor: `${TEAL}25`,
          }}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: TEAL }} />
            <h2
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: `${TEAL}cc` }}
            >
              Cross-Training for Sailing
            </h2>
          </div>

          <div className="space-y-3">
            {CROSS_TRAINING.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={i}
                  className="rounded-xl border p-4 flex items-start gap-3"
                  style={{
                    background: `${item.color}0a`,
                    borderColor: `${item.color}25`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: item.color }}>
                      {item.activity}
                    </p>
                    <p className="text-[11px] leading-relaxed" style={{ color: '#64748b' }}>
                      {item.benefit}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Section 8: Session History Placeholder ─────────────────────────── */}
        <div
          className="rounded-2xl border p-6 text-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.08)',
            borderStyle: 'dashed',
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `${OCEAN}15`, border: `1px solid ${OCEAN}30` }}
          >
            <Anchor className="w-6 h-6" style={{ color: OCEAN }} />
          </div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>
            Session History
          </h3>
          <p className="text-[12px] leading-relaxed max-w-xs mx-auto" style={{ color: '#475569' }}>
            Connect Apple Health to see your sailing sessions, weekly load, and race vs training ratio.
          </p>
          <div
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-xs font-semibold border"
            style={{
              color: OCEAN,
              borderColor: `${OCEAN}40`,
              background: `${OCEAN}12`,
            }}
          >
            <Wind className="w-3.5 h-3.5" />
            Sync Health Data
          </div>
        </div>

        {/* ── Science footer ─────────────────────────────────────────────────── */}
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
                ref: 'Blackburn 1994 — J Sports Sci',
                note: 'Quantified isometric quad contraction demands of dinghy hiking at 60–80% MVC for up to 20 consecutive minutes.',
              },
              {
                ref: 'Vogiatzis et al. 2002 — Int J Sports Med',
                note: 'Established racing heart rate (110–140 bpm) and the 4–5× metabolic rate increase attributable to hiking vs seated sailing.',
              },
              {
                ref: 'Callewaert et al. 2012',
                note: 'Demonstrated that quad endurance, rather than cardiovascular capacity, is the primary performance limiter in competitive dinghy sailing.',
              },
              {
                ref: 'Tan et al. 2006',
                note: 'Showed 30% greater sustained quad output in elite vs recreational sailors, and 8–12% improvement from targeted hiking simulation training.',
              },
              {
                ref: 'Legg et al. 2003 — J Sports Sci',
                note: 'Documented sleep deprivation patterns in offshore racing: 3–4 h total sleep per day and significant cognitive decline after 48–72 h.',
              },
              {
                ref: 'Aagaard et al. 2007 — Scand J Med Sci Sports',
                note: 'Identified significant left-right muscular imbalances in professional sailors from asymmetric loading patterns inherent to the sport.',
              },
            ].map((item, i) => (
              <div key={i} className={`space-y-1 ${i > 0 ? 'pt-3' : ''}`}>
                <p className="text-[11px] font-bold" style={{ color: '#64748b' }}>{item.ref}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: '#334155' }}>{item.note}</p>
              </div>
            ))}
          </div>

          <p
            className="text-[10px] leading-relaxed pt-2"
            style={{
              color: '#1e293b',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '0.75rem',
            }}
          >
            This page provides educational sport science content. It does not constitute medical or coaching advice.
          </p>
        </div>

      </main>
    </div>
  )
}

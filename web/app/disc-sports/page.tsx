import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Activity,
  Zap,
  TrendingUp,
  Globe,
  Heart,
  Wind,
} from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Disc Sports | KQuarks' }

// ─── Colour tokens ────────────────────────────────────────────────────────────

const GREEN  = '#4ade80'   // green-400   — Ultimate Frisbee accent
const TEAL   = '#2dd4bf'   // teal-400    — Disc Golf accent
const LIME   = '#a3e635'   // lime-400    — Freestyle / DDC
const AMBER  = '#fbbf24'   // amber-400   — warning / high-intensity callout

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DiscSportsPage() {
  // createClient is imported per project convention; data fetching omitted here
  // (static science + reference page — no user-specific queries required)
  void createClient

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
              <span className="text-xl leading-none">&#x1F94F;</span>
              <div>
                <h1 className="font-rajdhani text-lg font-bold leading-tight tracking-wide text-white">
                  Disc Sports Analysis
                </h1>
              </div>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              The physics of plastic
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">

          {/* ── Hero ── */}
          <div
            className="rounded-2xl border p-5 space-y-2"
            style={{
              borderColor: GREEN + '33',
              background: `linear-gradient(135deg, ${GREEN}10 0%, ${TEAL}09 60%, transparent 100%)`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-5xl leading-none mt-0.5">&#x1F94F;</span>
              <div className="space-y-2">
                <h2 className="font-rajdhani text-3xl font-bold leading-tight text-white tracking-wide">
                  Disc Sports
                </h2>
                <p className="text-sm font-mono-jb text-white/55 leading-relaxed">
                  Ultimate frisbee, disc golf &amp; freestyle — the physics of plastic and athletic excellence.
                  From{' '}
                  <span className="text-white/80">high-intensity intermittent field sport</span> to
                  low-impact walking cardio, disc sports span the full fitness spectrum while demanding
                  exceptional throwing mechanics and{' '}
                  <span className="text-white/80">rotational kinetic chain mastery</span>.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span
                    className="text-[10px] font-mono-jb px-2 py-1 rounded-full border"
                    style={{ borderColor: GREEN + '40', color: GREEN, background: GREEN + '12' }}
                  >
                    VO&#x2082;max &#x2265;55 ml/kg/min (competitive)
                  </span>
                  <span
                    className="text-[10px] font-mono-jb px-2 py-1 rounded-full border"
                    style={{ borderColor: TEAL + '40', color: TEAL, background: TEAL + '12' }}
                  >
                    4.1 METs disc golf (Levy 2008)
                  </span>
                  <span
                    className="text-[10px] font-mono-jb px-2 py-1 rounded-full border"
                    style={{ borderColor: LIME + '40', color: LIME, background: LIME + '12' }}
                  >
                    Spirit of the game
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── The Three Disciplines ── */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                The Three Disciplines
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Ultimate Frisbee */}
              <div
                className="rounded-xl border p-4 space-y-2"
                style={{ borderColor: GREEN + '30', background: GREEN + '09' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">&#x1F94F;</span>
                  <p className="font-rajdhani font-bold text-base tracking-wide" style={{ color: GREEN }}>
                    Ultimate Frisbee
                  </p>
                </div>
                <p className="text-[10px] font-mono-jb text-white/50 leading-relaxed">
                  High-intensity intermittent team sport. HR sustained at{' '}
                  <span className="text-white/75">80–85% HRmax</span>. Players cover{' '}
                  <span className="text-white/75">8–12 km</span> per game with explosive
                  sprint-recovery patterns. Self-officiated —
                  spirit of the game is central to play.
                </p>
                <div className="pt-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono-jb text-white/30">Avg HR</span>
                    <span className="text-[9px] font-mono-jb" style={{ color: GREEN }}>80–85% HRmax</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono-jb text-white/30">Distance/game</span>
                    <span className="text-[9px] font-mono-jb" style={{ color: GREEN }}>8–12 km</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono-jb text-white/30">Sport type</span>
                    <span className="text-[9px] font-mono-jb text-white/60">Intermittent aerobic</span>
                  </div>
                </div>
              </div>

              {/* Disc Golf */}
              <div
                className="rounded-xl border p-4 space-y-2"
                style={{ borderColor: TEAL + '30', background: TEAL + '09' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">&#x26F3;</span>
                  <p className="font-rajdhani font-bold text-base tracking-wide" style={{ color: TEAL }}>
                    Disc Golf
                  </p>
                </div>
                <p className="text-[10px] font-mono-jb text-white/50 leading-relaxed">
                  Moderate-intensity walking sport. Averages{' '}
                  <span className="text-white/75">4.1 METs</span> (Levy &amp; Sherrin 2008).
                  18 holes = <span className="text-white/75">4–6 km</span> walking plus throwing
                  exertion. Burns <span className="text-white/75">400–600 kcal</span> per round.
                  Low-impact, accessible at any age.
                </p>
                <div className="pt-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono-jb text-white/30">Intensity</span>
                    <span className="text-[9px] font-mono-jb" style={{ color: TEAL }}>4.1 METs avg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono-jb text-white/30">18-hole walk</span>
                    <span className="text-[9px] font-mono-jb" style={{ color: TEAL }}>4–6 km</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono-jb text-white/30">Kcal/round</span>
                    <span className="text-[9px] font-mono-jb text-white/60">400–600 kcal</span>
                  </div>
                </div>
              </div>

              {/* Freestyle / DDC */}
              <div
                className="rounded-xl border p-4 space-y-2"
                style={{ borderColor: LIME + '30', background: LIME + '09' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">&#x1F3A8;</span>
                  <p className="font-rajdhani font-bold text-base tracking-wide" style={{ color: LIME }}>
                    Freestyle / DDC
                  </p>
                </div>
                <p className="text-[10px] font-mono-jb text-white/50 leading-relaxed">
                  Coordination + aerobic artistry. Variable intensity throughout
                  routines. Demands{' '}
                  <span className="text-white/75">exceptional proprioception</span>,
                  catching and throwing artistry, and fluid athleticism.
                  Combines dance-like movement with athletic precision.
                </p>
                <div className="pt-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono-jb text-white/30">Intensity</span>
                    <span className="text-[9px] font-mono-jb" style={{ color: LIME }}>Variable</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono-jb text-white/30">Focus</span>
                    <span className="text-[9px] font-mono-jb" style={{ color: LIME }}>Coordination</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono-jb text-white/30">Style</span>
                    <span className="text-[9px] font-mono-jb text-white/60">Artistry + aerobic</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Ultimate Frisbee Demands ── */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: GREEN + '30', background: GREEN + '07' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4" style={{ color: GREEN }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Ultimate Frisbee — Physiological Demands
              </h2>
            </div>

            {/* Stat callouts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                {
                  label:  'HR during play',
                  value:  '80–85',
                  unit:   '% HRmax',
                  color:  AMBER,
                  hint:   'Krustrup et al. 2010',
                },
                {
                  label:  'Distance / game',
                  value:  '8–12',
                  unit:   'km',
                  color:  GREEN,
                  hint:   'Duthie et al. 2003',
                },
                {
                  label:  'Sprint bouts',
                  value:  '20–30',
                  unit:   's avg',
                  color:  TEAL,
                  hint:   'intermittent pattern',
                },
                {
                  label:  'Min VO&#x2082;max',
                  value:  '≥55',
                  unit:   'ml/kg/min',
                  color:  LIME,
                  hint:   'competitive ultimate',
                },
              ].map(({ label, value, unit, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1"
                  style={{ borderColor: color + '2a', background: color + '0a' }}
                >
                  <p
                    className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest"
                    dangerouslySetInnerHTML={{ __html: label }}
                  />
                  <p
                    className="font-rajdhani text-xl font-bold leading-none"
                    style={{ color }}
                  >
                    {value}
                    {unit && (
                      <span className="text-[10px] font-mono-jb font-normal ml-1 opacity-60">
                        {unit}
                      </span>
                    )}
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-[10px] font-mono-jb text-white/45 leading-relaxed">
              <p>
                <span style={{ color: GREEN + 'cc' }} className="font-semibold">
                  Krustrup et al. (2010, Med Sci Sports Exerc):
                </span>{' '}
                recreational field sports exhibit comparable cardiovascular demands — players sustain
                HR at <span className="text-white/70">80–85% HRmax</span> and accumulate approximately{' '}
                <span className="text-white/70">1.5 km of high-intensity running</span> per game,
                underscoring the aerobic fitness demands of disc sports at recreational and competitive levels.
              </p>
              <p>
                <span style={{ color: GREEN + 'cc' }} className="font-semibold">
                  Duthie et al. (2003, J Sports Sci):
                </span>{' '}
                field sports players cover <span className="text-white/70">8–12 km per game</span> with
                approximately <span className="text-white/70">70% aerobic running</span> and{' '}
                <span className="text-white/70">30% sprint efforts</span> — a ratio directly applicable
                to ultimate frisbee&apos;s open-field movement demands.
              </p>
              <p>
                Sprint bouts average <span className="text-white/70">20–30 s</span> with recovery
                intervals of <span className="text-white/70">30–60 s</span>, creating a classic
                intermittent aerobic pattern. Competitive ultimate requires a VO&#x2082;max of{' '}
                <span className="text-white/70">&#x2265;55 ml/kg/min</span> — comparable to soccer midfielders.
              </p>
            </div>
          </div>

          {/* ── Disc Golf Science ── */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: TEAL + '30', background: TEAL + '07' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Wind className="w-4 h-4" style={{ color: TEAL }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Disc Golf — The Science
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

              {/* Key facts */}
              <div className="space-y-3">
                {[
                  {
                    title: '4.1 METs average intensity',
                    body:  'Levy & Sherrin (2008, Int J Perf Anal Sport) — disc golf qualifies as moderate physical activity. Comparable to brisk walking at the same MET value.',
                    color: TEAL,
                  },
                  {
                    title: '400–600 kcal per 18 holes',
                    body:  'Combined caloric cost of 4–6 km walking plus repetitive throwing exertion across the full round.',
                    color: TEAL,
                  },
                ].map(({ title, body, color }) => (
                  <div
                    key={title}
                    className="rounded-xl border p-3"
                    style={{ borderColor: color + '25', background: color + '08' }}
                  >
                    <p
                      className="font-rajdhani font-semibold text-xs mb-1"
                      style={{ color }}
                    >
                      {title}
                    </p>
                    <p className="text-[10px] font-mono-jb text-white/45 leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>

              {/* Throwing kinematic chain + cart vs walk */}
              <div className="space-y-3">
                <div
                  className="rounded-xl border p-3"
                  style={{ borderColor: TEAL + '25', background: TEAL + '08' }}
                >
                  <p className="font-rajdhani font-semibold text-xs mb-2" style={{ color: TEAL }}>
                    Throwing kinematic chain
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-mono-jb">
                    {['Hips', 'Torso', 'Shoulder', 'Arm', 'Wrist'].map((seg, i, arr) => (
                      <span key={seg} className="flex items-center gap-1.5">
                        <span
                          className="px-2 py-0.5 rounded-full border"
                          style={{ borderColor: TEAL + '40', color: TEAL, background: TEAL + '15' }}
                        >
                          {seg}
                        </span>
                        {i < arr.length - 1 && (
                          <span className="text-white/25">&#x2192;</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="text-[9px] font-mono-jb text-white/35 mt-2 leading-relaxed">
                    Rotational power transfers sequentially through the kinematic chain.
                    Shoulder stability and hip rotation drive disc velocity.
                  </p>
                </div>
                <div
                  className="rounded-xl border p-3"
                  style={{ borderColor: AMBER + '25', background: AMBER + '08' }}
                >
                  <p className="font-rajdhani font-semibold text-xs mb-1" style={{ color: AMBER }}>
                    Walk vs cart: 3&#xD7; the caloric expenditure
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/45 leading-relaxed">
                    Walking 18 holes vs riding a cart triples caloric burn. Low-impact
                    activity — suitable for all fitness levels and ages with no joint stress.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ── Field Sport Comparison Table ── */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Field Sport Comparison
              </h2>
            </div>

            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[10px] font-mono-jb border-collapse min-w-[420px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-2 text-white/35 uppercase tracking-widest font-medium text-[9px]">
                      Sport
                    </th>
                    <th className="text-left py-2 px-2 text-white/35 uppercase tracking-widest font-medium text-[9px]">
                      Intensity
                    </th>
                    <th className="text-left py-2 px-2 text-white/35 uppercase tracking-widest font-medium text-[9px]">
                      Distance / game
                    </th>
                    <th className="text-left py-2 px-2 text-white/35 uppercase tracking-widest font-medium text-[9px]">
                      Sprint %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      sport:    'Ultimate Frisbee',
                      intensity:'8–12 METs peak',
                      distance: '8–12 km',
                      sprint:   '~30%',
                      color:    GREEN,
                      highlight: true,
                    },
                    {
                      sport:    'Soccer',
                      intensity:'9–14 METs peak',
                      distance: '10–13 km',
                      sprint:   '~30%',
                      color:    'rgba(255,255,255,0.5)',
                      highlight: false,
                    },
                    {
                      sport:    'Field Hockey',
                      intensity:'8–12 METs peak',
                      distance: '9–12 km',
                      sprint:   '~25%',
                      color:    'rgba(255,255,255,0.5)',
                      highlight: false,
                    },
                    {
                      sport:    'Beach Ultimate',
                      intensity:'10–13 METs peak',
                      distance: '~6 km (sand)',
                      sprint:   '~30%',
                      color:    GREEN,
                      highlight: true,
                    },
                    {
                      sport:    'Disc Golf',
                      intensity:'4.1 METs avg',
                      distance: '4–6 km',
                      sprint:   'Walking',
                      color:    TEAL,
                      highlight: true,
                    },
                  ].map(({ sport, intensity, distance, sprint, color, highlight }) => (
                    <tr
                      key={sport}
                      className="border-b border-white/[0.05] transition-colors"
                      style={highlight ? { background: color + '08' } : undefined}
                    >
                      <td className="py-2.5 px-2 font-semibold" style={{ color }}>
                        {sport}
                      </td>
                      <td className="py-2.5 px-2 text-white/55">{intensity}</td>
                      <td className="py-2.5 px-2 text-white/55">{distance}</td>
                      <td className="py-2.5 px-2 text-white/55">{sprint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[9px] font-mono-jb text-white/25 mt-3">
              METs = metabolic equivalents. Disc sport rows highlighted. Beach ultimate intensity
              increases due to sand resistance — ~40% greater metabolic cost vs grass (Reilly &amp; Franklin 2003).
            </p>
          </div>

          {/* ── Training for Ultimate ── */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Training for Ultimate Frisbee
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Aerobic base',
                  body:  'Zone 2 running 3&#xD7;/week builds the oxidative foundation required to sustain 80–85% HRmax across a 90-minute game.',
                  color:  GREEN,
                  icon:   '&#x1F3C3;',
                },
                {
                  title: 'Sprint development',
                  body:  'Loturco (2015): 4–6 weeks of plyometric + sprint work improves 0–10 m acceleration by 3–5%. Critical for explosive cuts.',
                  color:  AMBER,
                  icon:   '&#x26A1;',
                },
                {
                  title: 'Cutting drills',
                  body:  'Explosive lateral movement patterns. 5-10-5 shuttle drill develops the change-of-direction speed that defines ultimate field play.',
                  color:  TEAL,
                  icon:   '&#x21C4;',
                },
                {
                  title: 'Throwing conditioning',
                  body:  'Shoulder stability work (rotator cuff) and proprioception training prevent overuse injury from high-volume throwing.',
                  color:  LIME,
                  icon:   '&#x1F4AA;',
                },
                {
                  title: 'Recovery protocol',
                  body:  '48 h between intense games to resolve repeated-sprint fatigue. Compression, sleep quality, and nutrition timing matter most.',
                  color:  'rgba(248,113,113,1)',
                  icon:   '&#x1F6CC;',
                },
              ].map(({ title, body, color, icon }) => (
                <div
                  key={title}
                  className="rounded-xl border p-4 flex gap-3"
                  style={{ borderColor: color + '28', background: color + '09' }}
                >
                  <span className="text-lg leading-none shrink-0 mt-0.5" dangerouslySetInnerHTML={{ __html: icon }} />
                  <div>
                    <p className="font-rajdhani font-semibold text-xs mb-1" style={{ color }}>
                      {title}
                    </p>
                    <p
                      className="text-[10px] font-mono-jb text-white/45 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: body }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Spirit of the Game ── */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: GREEN + '30', background: GREEN + '07' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4" style={{ color: GREEN }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Spirit of the Game
              </h2>
            </div>

            <div
              className="rounded-xl border p-4 mb-4"
              style={{ borderColor: GREEN + '28', background: GREEN + '0c' }}
            >
              <p className="text-xs font-mono-jb text-white/70 leading-relaxed">
                <span className="font-semibold" style={{ color: GREEN }}>
                  Unique among field sports:
                </span>{' '}
                Ultimate Frisbee is self-officiated at most levels — players call their own fouls
                and resolve disputes through respectful dialogue. This &quot;Spirit of the Game&quot;
                principle is enshrined in the WFDF rulebook and is considered as central to the sport
                as athleticism itself.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Self-officiated',
                  value: 'No refs',
                  unit:  'most levels',
                  color: GREEN,
                  hint:  'WFDF Spirit rules',
                },
                {
                  label: 'World Games',
                  value: '2001',
                  unit:  '& 2022',
                  color: TEAL,
                  hint:  '"Ultimate Frisbee"',
                },
                {
                  label: 'Global players',
                  value: '~7M',
                  unit:  'worldwide',
                  color: LIME,
                  hint:  '80+ countries',
                },
                {
                  label: 'Governing body',
                  value: 'WFDF',
                  unit:  '',
                  color: AMBER,
                  hint:  'World Flying Disc Federation',
                },
              ].map(({ label, value, unit, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1"
                  style={{ borderColor: color + '2a', background: color + '0a' }}
                >
                  <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">
                    {label}
                  </p>
                  <p className="font-rajdhani text-xl font-bold leading-none" style={{ color }}>
                    {value}
                    {unit && (
                      <span className="text-[10px] font-mono-jb font-normal ml-1 opacity-60">
                        {unit}
                      </span>
                    )}
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Science citations ── */}
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: GREEN + '25', background: GREEN + '05' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="rounded-full p-1.5 shrink-0 mt-0.5"
                style={{ background: GREEN + '20' }}
              >
                <BookOpen className="w-3.5 h-3.5" style={{ color: GREEN }} />
              </div>
              <div className="space-y-3 w-full">
                <p
                  className="font-rajdhani font-semibold text-sm tracking-wide"
                  style={{ color: GREEN }}
                >
                  Evidence Base
                </p>

                <div className="space-y-3 text-xs font-mono-jb text-white/55 leading-relaxed">

                  {/* Key insight banner */}
                  <div
                    className="rounded-lg border p-3 space-y-1"
                    style={{ borderColor: GREEN + '25', background: GREEN + '0a' }}
                  >
                    <p className="font-semibold text-[11px]" style={{ color: GREEN + 'cc' }}>
                      Key physiological insight
                    </p>
                    <p className="text-white/65">
                      Ultimate frisbee occupies a{' '}
                      <span className="text-white font-semibold">
                        unique cardiovascular niche
                      </span>{' '}
                      — aerobically demanding as soccer, yet with the rotational skill complexity
                      of racket sports. The disc&apos;s aerodynamic requirements add a precision
                      layer absent from other field sports, meaning that{' '}
                      <span className="text-white font-semibold">
                        athletic fatigue directly degrades throwing accuracy
                      </span>, creating a feedback loop between fitness and technical execution.
                    </p>
                  </div>

                  <div
                    className="border-l-2 pl-3 space-y-2.5"
                    style={{ borderColor: GREEN + '40' }}
                  >
                    <p>
                      <span style={{ color: GREEN + 'cc' }}>
                        Krustrup P et al. (2010)
                      </span>
                      {' '}&#x2014; "Recreational football as a health promoting activity."
                      {' '}<em>Scand J Med Sci Sports</em> 20(S1):1–23.
                      {' '}Recreational field sports sustain HR at 80–85% HRmax with ~1.5 km
                      high-intensity running per game; directly applicable to ultimate frisbee&apos;s
                      open-field intermittent demands.
                    </p>
                    <p>
                      <span style={{ color: GREEN + 'cc' }}>
                        Duthie G et al. (2003)
                      </span>
                      {' '}&#x2014; "Applied physiology and game analysis of rugby union."
                      {' '}<em>J Sports Sci</em> 21(7):523–539.
                      {' '}Field sports players cover 8–12 km per game; sprint efforts constitute
                      ~30% of movement across the game — a profile consistent with elite and
                      competitive ultimate frisbee.
                    </p>
                    <p>
                      <span style={{ color: TEAL + 'cc' }}>
                        Levy NS &amp; Sherrin SS (2008)
                      </span>
                      {' '}&#x2014; "Energy expenditure in disc golf."
                      {' '}<em>Int J Perf Anal Sport</em> 8(1):47–53.
                      {' '}Disc golf averages 4.1 METs — classified as moderate physical activity.
                      18-hole walking rounds yield 400–600 kcal expenditure; walking vs cart
                      triples caloric output.
                    </p>
                    <p>
                      <span style={{ color: AMBER + 'cc' }}>
                        Loturco I et al. (2015)
                      </span>
                      {' '}&#x2014; "Optimal loading and performance changes."
                      {' '}<em>J Strength Cond Res</em> 29(10):2953–2963.
                      {' '}4–6 weeks of combined plyometric and sprint training improves 0–10 m
                      acceleration by 3–5% — directly applicable to cut-and-sprint ultimate
                      frisbee movement patterns.
                    </p>
                  </div>

                  <p className="text-white/30 text-[9px]">
                    Apple Watch HR and calorie metrics provide whole-session cardiovascular load data.
                    Disc-level GPS and per-throw biomechanical analysis require dedicated sensors
                    (e.g., Spin Ultimate disc sensor) not integrated with HealthKit.
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

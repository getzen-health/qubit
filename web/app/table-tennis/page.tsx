import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Table Tennis | KQuarks' }

export default async function TableTennisPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Table Tennis</h1>
            <p className="text-sm text-gray-400">Reaction time, spin physics &amp; intermittent aerobic intensity</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Hero */}
        <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl font-black text-white tracking-tight">Table Tennis</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-semibold">
                PRECISION
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              The sport of microseconds — elite players process incoming ball trajectory, spin type, and
              landing position in under 300 ms while executing a biomechanically precise return. A deceptively
              demanding mix of anaerobic bursts, sustained intermittent aerobic load, and extraordinary
              perceptual-motor skill.
            </p>
          </div>
        </div>

        {/* Section 2 — Session Types */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Session Classification
          </h2>
          <div className="space-y-2">
            {[
              {
                label: 'Competitive Match',
                duration: '≥50 min',
                desc: 'Tournament or league play. Full aerobic demand, high intensity, maximal tactical decision-making load.',
                color: 'cyan',
              },
              {
                label: 'Rallying Practice',
                duration: '30–50 min',
                desc: 'Sustained rally exchanges with a partner. Builds aerobic base, consistency, and stroke automation.',
                color: 'teal',
              },
              {
                label: 'Technical Drills',
                duration: '15–30 min',
                desc: 'Isolated stroke mechanics — topspin loop, block, counter-drive. Multi-ball feeding common.',
                color: 'green',
              },
              {
                label: 'Serve Practice',
                duration: '<15 min',
                desc: 'Focused serve-only session. Spin variation and placement are the primary training targets.',
                color: 'gray',
              },
            ].map(({ label, duration, desc, color }) => {
              const accent =
                color === 'cyan'
                  ? 'border-cyan-500/30 bg-cyan-500/5'
                  : color === 'teal'
                    ? 'border-teal-500/30 bg-teal-500/5'
                    : color === 'green'
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-gray-700 bg-gray-800/40'
              const textAccent =
                color === 'cyan'
                  ? 'text-cyan-400'
                  : color === 'teal'
                    ? 'text-teal-400'
                    : color === 'green'
                      ? 'text-green-400'
                      : 'text-gray-400'
              return (
                <div
                  key={label}
                  className={`rounded-2xl border p-4 flex items-start gap-4 ${accent}`}
                >
                  <div className="shrink-0 text-right min-w-[64px]">
                    <span className={`text-sm font-bold ${textAccent}`}>{duration}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 3 — Intensity Profile */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Intensity Profile
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-3xl font-black text-cyan-400">45–65<span className="text-lg font-bold">%</span></span>
              <span className="text-sm font-semibold text-white">Average VO₂max</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                Sustained aerobic intensity across a competitive match
              </span>
              <span className="text-xs text-gray-600 mt-auto pt-2">Zagatto 2010</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-3xl font-black text-teal-400">85<span className="text-xl">%</span></span>
              <span className="text-sm font-semibold text-white">Rally burst VO₂max</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                Peak aerobic demand during explosive point exchanges
              </span>
              <span className="text-xs text-gray-600 mt-auto pt-2">Zagatto 2010</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-3xl font-black text-cyan-400">70–80<span className="text-lg font-bold">%</span></span>
              <span className="text-sm font-semibold text-white">HRmax in match</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                Sustained heart rate across match duration
              </span>
              <span className="text-xs text-gray-600 mt-auto pt-2">Muller 2015</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-3xl font-black text-teal-400">1:3–5</span>
              <span className="text-sm font-semibold text-white">Work:rest ratio</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                Rally 3–4 s · Between-point recovery 5–10 s
              </span>
              <span className="text-xs text-gray-600 mt-auto pt-2">Muller 2015</span>
            </div>
          </div>
        </div>

        {/* Section 4 — Physics of Table Tennis */}
        <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-teal-500/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-bold text-white">The Physics of Table Tennis</h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
                Biomechanics
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-4 space-y-1">
                <p className="text-2xl font-black text-cyan-400">60–110 <span className="text-base font-semibold">km/h</span></p>
                <p className="text-sm font-semibold text-white">Ball velocity</p>
                <p className="text-xs text-gray-400 leading-snug">Measured off the paddle on a full topspin loop drive</p>
              </div>
              <div className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-4 space-y-1">
                <p className="text-2xl font-black text-teal-400">100–150 <span className="text-base font-semibold">rev/s</span></p>
                <p className="text-sm font-semibold text-white">Spin rate — topspin loop</p>
                <p className="text-xs text-gray-400 leading-snug">Up to 9,000 RPM on elite topspin strokes</p>
              </div>
              <div className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-4 space-y-1">
                <p className="text-2xl font-black text-cyan-400">2–3 <span className="text-base font-semibold">mm</span></p>
                <p className="text-sm font-semibold text-white">Ball deformation</p>
                <p className="text-xs text-gray-400 leading-snug">Elastic compression on paddle contact; restores within ~1 ms</p>
              </div>
              <div className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-4 space-y-1">
                <p className="text-2xl font-black text-teal-400">Magnus</p>
                <p className="text-sm font-semibold text-white">Curve trajectory</p>
                <p className="text-xs text-gray-400 leading-snug">Topspin creates Magnus effect downward curve — forces ball to dip sharply onto the table</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Source: Phomsoupha &amp; Laffaye (2015) <em>Sports Medicine</em>
            </p>
          </div>
        </div>

        {/* Section 5 — Reaction Time Science */}
        <div className="bg-gray-900 border border-teal-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Reaction Time Science</h2>
            <span className="px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-medium">
              Key differentiator
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 text-center space-y-1">
              <p className="text-3xl font-black text-teal-400">250–300 <span className="text-sm font-bold">ms</span></p>
              <p className="text-sm font-semibold text-white">Elite choice reaction time</p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-4 text-center space-y-1">
              <p className="text-3xl font-black text-gray-400">350–400 <span className="text-sm font-bold">ms</span></p>
              <p className="text-sm font-semibold text-white">Untrained reaction time</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Elite table tennis players demonstrate <span className="font-semibold text-teal-300">25% faster neural processing</span> than
                untrained individuals — one of the largest sport-specific reaction time advantages measured across all sports.
                (Yuza et al. 1992, <em>J Physiol Anthropol</em>)
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                At 60 km/h, the ball travels <span className="font-semibold text-teal-300">4–5 metres in 300 ms</span> — meaning
                the entire flight time from opponent's paddle to the player's side equals one human reaction cycle.
                Players cannot simply react; they must predict trajectory before the ball crosses the net.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                This forces anticipation from stroke mechanics — reading opponent's racket angle, contact
                point, and body position up to 500 ms before the ball arrives. Expert perception, not raw
                reflex, is the primary differentiator.
              </p>
            </div>
          </div>

          <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
            <p className="text-xs font-semibold text-teal-400 mb-1">Training implication</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Perceptual training (video occlusion drills, variable-bounce multi-ball) is as important as
              physical conditioning. Elite programmes devote 20–30% of practice time to anticipation and
              decision-making under speed.
            </p>
          </div>
        </div>

        {/* Section 6 — Movement Demands */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Movement Demands</h2>
            <span className="px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-medium">
              Faber et al. 2015
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Players cover <span className="font-semibold text-green-300">5–8 km per match hour</span>, largely composed
                of small, explosive lateral adjustments rather than continuous running.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="font-semibold text-green-300">80–90% of all movements are lateral</span>, covering less
                than 2 metres per burst — placing exceptional demand on hip stabilisers and rapid
                weight-transfer mechanics.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Significant <span className="font-semibold text-green-300">asymmetric loading</span>: the dominant forehand
                side generates higher ground reaction forces, while the backhand side relies more on
                crossover footwork — creating measurable bilateral strength and flexibility asymmetries
                in experienced players.
              </p>
            </div>
          </div>
          <div className="pt-1">
            <p className="text-xs font-semibold text-green-400 mb-2">Key movement patterns</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Lateral shuffle',
                'Cross-step',
                'Forehand pivot',
                'Backhand lunge',
                'Split-step',
                'Recovery step',
              ].map((pattern) => (
                <span
                  key={pattern}
                  className="px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-medium"
                >
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 7 — Serve Science */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Serve Science</h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
              Drianovski &amp; Otcheva 2002
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="font-semibold text-cyan-300">Over 60% of all points</span> involve a decisive serve or
                receive interaction — making serve the single most tactically influential stroke in the game.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Spin variation is the primary differentiator between amateur and advanced players:
                elite servers deploy topspin, backspin, sidespin, and no-spin serves with near-identical
                motion — forcing the receiver to interpret subtle racket angle and contact clues.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Short serves that bounce twice on the opponent's side severely limit attack options —
                a tactical weapon that removes the opponent's ability to generate speed on return.
              </p>
            </div>
          </div>
          <div className="pt-1">
            <p className="text-xs font-semibold text-cyan-400 mb-2">Spin types</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Topspin',
                'Backspin',
                'Left sidespin',
                'Right sidespin',
                'No-spin (ghost)',
                'Heavy float',
              ].map((spin) => (
                <span
                  key={spin}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium"
                >
                  {spin}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 8 — Training Recommendations */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Training Recommendations</h2>
          <div className="space-y-3">
            {[
              {
                title: 'Aerobic base — 3×/week',
                detail: 'Running or cycling at Zone 2 intensity. Builds the between-point recovery capacity that determines late-match performance when cumulative fatigue elevates HR.',
                color: 'teal',
              },
              {
                title: 'Multi-ball drilling',
                detail: 'Coach-fed rapid-fire ball sequences automate stroke mechanics through high repetition at variable speed and spin. Target 200–500 strokes per session.',
                color: 'cyan',
              },
              {
                title: 'Reaction training',
                detail: 'Light boards, variable-bounce tables, and video occlusion drills train anticipatory perception. Shown to reduce choice reaction time by 15–20 ms over 6 weeks.',
                color: 'teal',
              },
              {
                title: 'Serve practice — minimum 100 serves/session',
                detail: 'Deliberate practice with spin variation (all four types) per session. Focus on disguise: identical pre-contact motion, variable spin output.',
                color: 'cyan',
              },
              {
                title: 'Lateral agility and hip stability',
                detail: 'Band-resisted lateral walks, single-leg Romanian deadlifts, and crossover drills address the dominant asymmetric loading pattern documented by Faber et al. 2015.',
                color: 'teal',
              },
            ].map(({ title, detail, color }) => {
              const dot = color === 'cyan' ? 'bg-cyan-400' : 'bg-teal-400'
              return (
                <div key={title} className="flex gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0 mt-2`} />
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{detail}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="overflow-x-auto -mx-2 pt-2">
            <table className="w-full text-sm min-w-[460px]">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 px-2">
                    Component
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 px-2">
                    Priority
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 px-2">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {[
                  { component: 'Perceptual anticipation', priority: 'Critical', method: 'Video occlusion drills', color: 'text-cyan-400' },
                  { component: 'Serve/receive skill', priority: 'Critical', method: '100+ serves/session, spin mix', color: 'text-cyan-400' },
                  { component: 'Aerobic base', priority: 'High', method: 'Zone 2 run/cycle 3×/week', color: 'text-teal-400' },
                  { component: 'Lateral agility', priority: 'High', method: 'Footwork shadow drills', color: 'text-teal-400' },
                  { component: 'Wrist/forearm strength', priority: 'Moderate', method: 'Pronation resistance work', color: 'text-green-400' },
                  { component: 'Hip stability', priority: 'Moderate', method: 'Band work, single-leg RDL', color: 'text-green-400' },
                ].map(({ component, priority, method, color }) => (
                  <tr key={component}>
                    <td className="py-3 px-2 text-gray-200 font-medium">{component}</td>
                    <td className={`py-3 px-2 font-semibold text-sm ${color}`}>{priority}</td>
                    <td className="py-3 px-2 text-gray-400 text-xs">{method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 9 — Session History Placeholder */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 mx-auto flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-400/40" />
          </div>
          <p className="text-sm font-semibold text-white">No session data yet</p>
          <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
            Connect Apple Health to see your table tennis history, intensity trends, and session
            breakdown — including average heart rate, active calories, and duration per session type.
          </p>
        </div>

        {/* Source note */}
        <p className="text-xs text-gray-600 text-center leading-relaxed px-4">
          Sources: Zagatto et al. (2010) · Muller (2015) · Phomsoupha &amp; Laffaye (2015) <em>Sports Med</em> ·
          Yuza et al. (1992) <em>J Physiol Anthropol</em> · Faber et al. (2015) ·
          Drianovski &amp; Otcheva (2002). Statistics reflect competitive-level play.
        </p>

      </main>
      <BottomNav />
    </div>
  )
}

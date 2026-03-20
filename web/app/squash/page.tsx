import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Squash | KQuarks' }

export default async function SquashPage() {
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
            <h1 className="text-xl font-bold text-white">Squash</h1>
            <p className="text-sm text-gray-400">
              Forbes&#39; world&#39;s healthiest sport — 85–95% HRmax, 18 direction changes per minute
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Hero */}
        <div className="bg-gray-900 border border-red-500/40 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/15 via-orange-500/8 to-transparent pointer-events-none" />
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl font-black text-white tracking-tight">Squash</span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/25 border border-red-500/50 text-red-400 text-xs font-bold tracking-wide">
                WORLD&#39;S HEALTHIEST
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Named the world&#39;s healthiest sport by <em>Forbes</em> — and the physiology backs it up.
              Near-continuous play at 85–95% HRmax, a work:rest ratio of 1:0.7 that obliterates tennis&#39;s
              1:3–1:5, and 18 direction changes per minute inside a court barely larger than a parking space.
              Squash is the most aerobically intense racquet sport ever measured.
            </p>
          </div>
        </div>

        {/* Section 1 — Squash vs Other Racquet Sports */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Squash vs Other Racquet Sports
          </h2>
          <div className="bg-gray-900 border border-red-500/25 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[540px]">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                      Sport
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                      Avg HR
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                      Work:Rest
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                      Lactate
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-4">
                      Dir. Changes/min
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  <tr className="bg-red-500/8">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-red-400">Squash</span>
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold">
                          #1
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-red-300 font-semibold">165–175 bpm</td>
                    <td className="py-3.5 px-4 text-red-300 font-semibold">1:0.7</td>
                    <td className="py-3.5 px-4 text-red-300 font-semibold">6–10 mmol/L</td>
                    <td className="py-3.5 px-4 text-red-300 font-semibold">18</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 text-gray-200 font-medium">Badminton</td>
                    <td className="py-3.5 px-4 text-gray-300">155–165 bpm</td>
                    <td className="py-3.5 px-4 text-gray-300">1:1</td>
                    <td className="py-3.5 px-4 text-gray-300">4–7 mmol/L</td>
                    <td className="py-3.5 px-4 text-gray-300">12–15</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 text-gray-200 font-medium">Tennis</td>
                    <td className="py-3.5 px-4 text-gray-300">130–150 bpm</td>
                    <td className="py-3.5 px-4 text-gray-300">1:3–1:5</td>
                    <td className="py-3.5 px-4 text-gray-300">2–4 mmol/L</td>
                    <td className="py-3.5 px-4 text-gray-300">6–8</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 text-gray-200 font-medium">Table Tennis</td>
                    <td className="py-3.5 px-4 text-gray-300">140–155 bpm</td>
                    <td className="py-3.5 px-4 text-gray-300">1:3</td>
                    <td className="py-3.5 px-4 text-gray-300">3–5 mmol/L</td>
                    <td className="py-3.5 px-4 text-gray-300">5–8</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-gray-800 bg-gray-900/50">
              <p className="text-xs text-gray-600">Sources: Todd 1998 · Dube 1993</p>
            </div>
          </div>
        </div>

        {/* Section 2 — What Makes Squash So Intense */}
        <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-red-500/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-bold text-white">What Makes Squash So Intense</h2>
              <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium">
                Physics + Structure
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-gray-800/70 border border-red-500/20 p-4 space-y-1">
                <p className="text-2xl font-black text-red-400">9.75 <span className="text-base font-semibold">× 6.4 m</span></p>
                <p className="text-sm font-semibold text-white">Court dimensions</p>
                <p className="text-xs text-gray-400 leading-snug">
                  Barely larger than a parking space — every shot demands immediate repositioning
                </p>
              </div>
              <div className="rounded-xl bg-gray-800/70 border border-orange-500/20 p-4 space-y-1">
                <p className="text-2xl font-black text-orange-400">170 <span className="text-base font-semibold">km/h</span></p>
                <p className="text-sm font-semibold text-white">Ball speed</p>
                <p className="text-xs text-gray-400 leading-snug">
                  Court-length travel in under 0.2 s — prediction, not reaction, is required
                </p>
              </div>
              <div className="rounded-xl bg-gray-800/70 border border-red-500/20 p-4 space-y-1">
                <p className="text-2xl font-black text-red-400">1:0.7</p>
                <p className="text-sm font-semibold text-white">Work:rest ratio</p>
                <p className="text-xs text-gray-400 leading-snug">
                  Near-continuous play vs tennis&#39;s 1:3–1:5 — the most brutal ratio of any racquet sport
                  (Dube 1993)
                </p>
              </div>
              <div className="rounded-xl bg-gray-800/70 border border-orange-500/20 p-4 space-y-1">
                <p className="text-2xl font-black text-orange-400">85–95<span className="text-base font-bold">%</span></p>
                <p className="text-sm font-semibold text-white">HRmax sustained</p>
                <p className="text-xs text-gray-400 leading-snug">
                  For the majority of match duration — the equivalent of a sustained tempo run with sprint
                  intervals (Todd 1998)
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-4 space-y-2">
              <div className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="font-semibold text-white">Rally structure:</span> average 10–15 s of
                  explosive multi-directional play, followed by only 7–12 s between points — no meaningful
                  aerobic recovery before the next effort begins.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-2" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  Enclosed court walls mean the ball stays live — there are no serve delays, ball retrieval
                  pauses, or changeover breaks to lower heart rate between rallies.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 — Physiological Profile */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Physiological Profile
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-3xl font-black text-red-400">165–175</span>
              <span className="text-sm font-semibold text-white">bpm avg match HR</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                Highest sustained match heart rate of any racquet sport
              </span>
              <span className="text-xs text-gray-600 mt-auto pt-2">Veltmeijer et al. 2014, IJSPP</span>
            </div>
            <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-3xl font-black text-orange-400">6–10</span>
              <span className="text-sm font-semibold text-white">mmol/L lactate</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                Highest blood lactate of any racquet sport — deep into anaerobic territory
              </span>
              <span className="text-xs text-gray-600 mt-auto pt-2">Wilkinson et al. 2009, JSCR</span>
            </div>
            <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-3xl font-black text-red-400">55–70</span>
              <span className="text-sm font-semibold text-white">ml/kg/min VO₂max (elite)</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                Competitive amateur requires 45–55 ml/kg/min minimum
              </span>
              <span className="text-xs text-gray-600 mt-auto pt-2">Todd 1998</span>
            </div>
            <div className="bg-gray-900 border border-orange-500/20 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-3xl font-black text-orange-400">700–1100</span>
              <span className="text-sm font-semibold text-white">kcal/hour</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                Among the highest calorie expenditure rates of any sport
              </span>
              <span className="text-xs text-gray-600 mt-auto pt-2">Dube 1993</span>
            </div>
          </div>
        </div>

        {/* Section 4 — Movement Analysis */}
        <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Movement Analysis</h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-medium">
              Agility
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-center space-y-1">
              <p className="text-2xl font-black text-blue-400">2.5–4 <span className="text-sm font-bold">km</span></p>
              <p className="text-xs text-gray-300 font-semibold">Per 40-minute match</p>
              <p className="text-xs text-gray-500">Hughes &amp; Knight 1995</p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-center space-y-1">
              <p className="text-2xl font-black text-blue-400">18</p>
              <p className="text-xs text-gray-300 font-semibold">Direction changes/min</p>
              <p className="text-xs text-gray-500">Novas 2003 — among highest of any sport</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="font-semibold text-blue-300">T-position discipline:</span> players must return
                to the centre of the court (the T) after every shot — a combined tactical and physical
                requirement that increases total distance covered by 30–40% compared to reactive movement alone.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="font-semibold text-blue-300">Ball trajectory prediction:</span> at 170 km/h
                the ball reaches the front wall in under 0.2 s — players must begin moving before the ball
                arrives, reading the opponent&#39;s racket angle and body position to anticipate placement.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="font-semibold text-blue-300">Dominant movement pattern:</span> explosive
                lunge into the corner followed by rapid deceleration and reacceleration back to the T —
                generating extreme eccentric knee load on every single shot. Over a 40-minute match this
                represents hundreds of high-load deceleration events.
              </p>
            </div>
          </div>
          <div className="pt-1">
            <p className="text-xs font-semibold text-blue-400 mb-2">Movement types</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Forward lunge',
                'Diagonal lunge',
                'Lateral split-step',
                'T-position sprint',
                'Backward chase',
                'Drop-step lunge',
              ].map((pattern) => (
                <span
                  key={pattern}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium"
                >
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5 — Ghosting */}
        <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-bl from-red-600/10 via-transparent to-orange-500/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-bold text-white">Ghosting</h2>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold">
                SIGNATURE SQUASH TRAINING
              </span>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="font-semibold text-red-300">Ghosting</span> is solo movement through all
                  six corners of the court without a ball — the highest-fidelity conditioning drill in
                  squash. It replicates the exact lunge-decelerate-recover-to-T pattern of match play at
                  controllable, programmable intensity.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-2" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  Used by professionals worldwide to build aerobic base while simultaneously sharpening
                  court coverage patterns — both physical and neural adaptations occur simultaneously.
                  Unlike court sprints, ghosting reinforces match-specific footwork mechanics.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  Ghosting can be performed anywhere court lines can be marked — no ball, no partner, no
                  racket required. One of the few elite sport conditioning methods that scales from beginners
                  to world champions with only tempo as the variable.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
                <p className="text-lg font-black text-red-400">3×</p>
                <p className="text-xs text-gray-300 font-semibold">Sets</p>
              </div>
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-center">
                <p className="text-lg font-black text-orange-400">5 min</p>
                <p className="text-xs text-gray-300 font-semibold">Per set</p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
                <p className="text-lg font-black text-red-400">6</p>
                <p className="text-xs text-gray-300 font-semibold">Court corners</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              3× 5-min ghosting sets = match-intensity conditioning with zero equipment required
            </p>
          </div>
        </div>

        {/* Section 6 — Training Principles */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Training Principles</h2>
          <div className="space-y-3">
            {[
              {
                title: 'Aerobic base — 2× interval sessions per week',
                detail:
                  'Intervals at 90%+ HRmax to build lactate tolerance. Squash demands sustained 6–10 mmol/L lactate — far above typical recreational sport. Without a large aerobic base, performance degrades rapidly in the third game.',
                dot: 'bg-red-400',
              },
              {
                title: 'Ghosting — 3× 5-min sets through court corners',
                detail:
                  'Match-intensity conditioning that simultaneously trains footwork mechanics and aerobic capacity. Progressively increase tempo across sets. Rest 90–120 s between sets.',
                dot: 'bg-orange-400',
              },
              {
                title: 'Eccentric lower body — squats and Nordic curls',
                detail:
                  'The lunge-decelerate-recover pattern generates extreme eccentric knee load on every shot across hundreds of repetitions per match. Eccentric quad and hamstring strength is the primary injury prevention priority.',
                dot: 'bg-red-400',
              },
              {
                title: 'Shoulder and wrist — rotator cuff + wrist-snap work',
                detail:
                  'Squash requires a pronounced wrist-snap at contact for shot variation and power. Rotator cuff strengthening (particularly external rotators) protects against the high internal rotation forces in the swing.',
                dot: 'bg-orange-400',
              },
            ].map(({ title, detail, dot }) => (
              <div key={title} className="flex gap-3">
                <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0 mt-2`} />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{detail}</p>
                </div>
              </div>
            ))}
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
                  {
                    component: 'Lactate tolerance',
                    priority: 'Critical',
                    method: '2× HIIT at 90%+ HRmax/week',
                    color: 'text-red-400',
                  },
                  {
                    component: 'Court movement / ghosting',
                    priority: 'Critical',
                    method: '3× 5-min sets, 3×/week',
                    color: 'text-red-400',
                  },
                  {
                    component: 'Eccentric quad strength',
                    priority: 'High',
                    method: 'Nordic curls, Bulgarian split squats',
                    color: 'text-orange-400',
                  },
                  {
                    component: 'Aerobic base',
                    priority: 'High',
                    method: 'Zone 2 run/cycle 2×/week',
                    color: 'text-orange-400',
                  },
                  {
                    component: 'Rotator cuff / wrist',
                    priority: 'Moderate',
                    method: 'External rotation work, wrist snap drills',
                    color: 'text-yellow-400',
                  },
                  {
                    component: 'Ankle stability',
                    priority: 'Moderate',
                    method: 'Single-leg balance, proprioception',
                    color: 'text-yellow-400',
                  },
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

        {/* Section 7 — Session History Placeholder */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-red-500/30 border border-red-400/40" />
          </div>
          <p className="text-sm font-semibold text-white">No session data yet</p>
          <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
            Connect Apple Health to see your squash sessions, match intensity, and weekly load trends —
            including average heart rate, active calories, duration, and heart rate zone breakdown per session.
          </p>
        </div>

        {/* Source note */}
        <p className="text-xs text-gray-600 text-center leading-relaxed px-4">
          Sources: Todd (1998) · Dube (1993) · Veltmeijer et al. (2014) <em>IJSPP</em> ·
          Wilkinson et al. (2009) <em>JSCR</em> · Hughes &amp; Knight (1995) · Novas (2003).
          Statistics reflect competitive-level play.
        </p>

      </main>
      <BottomNav />
    </div>
  )
}

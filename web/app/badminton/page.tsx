import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Badminton | KQuarks' }

export default async function BadmintonPage() {
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
            <h1 className="text-xl font-bold text-white">Badminton</h1>
            <p className="text-sm text-gray-400">Speed, agility &amp; elite cardio</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Hero */}
        <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl font-black text-white tracking-tight">Badminton</span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold">
                ELITE
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              The world's fastest racquet sport — 493 km/h shuttles, 1300+ direction changes per match.
              Explosive power meets sustained aerobic intensity in one of the most demanding sports on the planet.
            </p>
          </div>
        </div>

        {/* Speed & Demands Hero Stats */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Speed &amp; Physical Demands
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-3xl font-black text-red-400">493</span>
              <span className="text-sm font-semibold text-white">km/h</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                Shuttle speed record — men's jump smash
              </span>
              <span className="text-xs text-gray-600 mt-auto pt-2">Phomsoupha 2015</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-3xl font-black text-orange-400">1300<span className="text-xl">–</span>2000</span>
              <span className="text-sm font-semibold text-white">direction changes</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                Per elite match — the most of any racquet sport
              </span>
              <span className="text-xs text-gray-600 mt-auto pt-2">Gawin 2015</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-3xl font-black text-red-400">85–90<span className="text-lg font-bold">%</span></span>
              <span className="text-sm font-semibold text-white">HRmax</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                Average match heart rate — sustained aerobic zone
              </span>
              <span className="text-xs text-gray-600 mt-auto pt-2">Liddle 1996</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-1">
              <span className="text-3xl font-black text-orange-400">5–11</span>
              <span className="text-sm font-semibold text-white">seconds</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                Typical rally duration — classic HIIT work interval
              </span>
              <span className="text-xs text-gray-600 mt-auto pt-2">Phomsoupha 2015</span>
            </div>
          </div>
        </div>

        {/* Why Badminton is Elite Cardio */}
        <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Why Badminton is Elite Cardio</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                The short rally / short rest format (work:rest ratio 1:1.5–2) is physiologically
                identical to high-intensity interval training (HIIT), driving both aerobic and anaerobic
                adaptations simultaneously.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Liddle et al. 1996 (<em>J Sports Sci</em>): blood lactate reaches 5–7 mmol/L during
                intense rallies — well above the lactate threshold, confirming substantial anaerobic
                contribution.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                85–90% HRmax sustained across match duration places players in the aerobic training zone
                for the entire session — equivalent to a tempo run combined with sprint intervals.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Doubles play features even faster rallies and more explosive first-step demands, elevating
                the anaerobic component further.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Regular badminton training significantly improves both VO₂max and lactate threshold —
                making it one of the most efficient all-round fitness activities available.
              </p>
            </div>
          </div>
        </div>

        {/* Movement Demands */}
        <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Movement Demands</h2>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-medium">
              Agility
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Faude et al. 2007 (<em>Int J Sports Med</em>): 60% of match time is spent in lateral
                movement — more than any other directional demand, placing exceptional load on hip
                abductors and adductors.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                The lunge is the most metabolically costly movement pattern in badminton — combining
                peak knee extensor force with rapid deceleration and acceleration.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Split-step timing is critical: a well-timed split-step (landing just as the opponent
                strikes) reduces first-step reaction time by ~30–40 ms — decisive at elite level.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Phomsoupha &amp; Laffaye 2015: a focused 6-week agility training program improves shuttle
                run time by 5–8%, with the largest gains in lateral change-of-direction speed.
              </p>
            </div>
          </div>
          <div className="pt-1">
            <p className="text-xs font-semibold text-orange-400 mb-2">Key movement patterns</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Forward lunge',
                'Lateral lunge',
                'Backward lunge',
                'Split-step',
                'Crossover step',
                'Chasse step',
              ].map((pattern) => (
                <span
                  key={pattern}
                  className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-medium"
                >
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Smash Biomechanics */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Smash Biomechanics</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Phomsoupha &amp; Laffaye 2015 (<em>Sports Med</em>): wrist pronation (supination →
                pronation at contact) generates 60–80% of total smash power — the single most important
                mechanical contributor.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Shoulder external → internal rotation contributes 20–30% of racquet head speed,
                making shoulder internal rotator strength a key training target.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                The kinematic chain flows sequentially: leg drive → hip rotation → torso rotation →
                shoulder → forearm → wrist snap. Breaking the chain at any point reduces velocity and
                increases injury risk.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                The jump smash adds body weight transfer through the hitting arm, increasing shuttle
                velocity 15–20% compared to a standing smash executed with identical technique.
              </p>
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-semibold text-white">Training recommendations</p>
            <p className="text-xs text-gray-400">Wrist flexion/extension resistance work · Forearm pronation drills · Shoulder internal rotator strengthening · Medicine ball rotational throws</p>
          </div>
        </div>

        {/* Session Types */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Session Classification — KQuarks
          </h2>
          <div className="space-y-2">
            {[
              {
                label: 'Tournament / Match',
                duration: '80+ min',
                desc: 'Competitive play, league fixtures, or tournament matches. Maximum physiological demand.',
                color: 'red',
              },
              {
                label: 'Game Play',
                duration: '40–80 min',
                desc: 'Social or competitive game sessions. Mixed intensity across rallies.',
                color: 'orange',
              },
              {
                label: 'Technical Drilling',
                duration: '20–40 min',
                desc: 'Stroke production, footwork patterns, multi-shuttle feeding drills.',
                color: 'yellow',
              },
              {
                label: 'Footwork / Shadow',
                duration: '<20 min',
                desc: 'Footwork patterns without a shuttle — pure movement quality training.',
                color: 'gray',
              },
            ].map(({ label, duration, desc, color }) => {
              const accent =
                color === 'red'
                  ? 'border-red-500/30 bg-red-500/5'
                  : color === 'orange'
                    ? 'border-orange-500/30 bg-orange-500/5'
                    : color === 'yellow'
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-gray-700 bg-gray-800/40'
              const textAccent =
                color === 'red'
                  ? 'text-red-400'
                  : color === 'orange'
                    ? 'text-orange-400'
                    : color === 'yellow'
                      ? 'text-yellow-400'
                      : 'text-gray-400'
              return (
                <div
                  key={label}
                  className={`rounded-2xl border p-4 flex items-start gap-4 ${accent}`}
                >
                  <div className="shrink-0 text-right min-w-[60px]">
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

        {/* Training Priorities Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Training Priorities</h2>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 px-2">
                    Fitness Component
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 px-2">
                    Importance
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 px-2">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {[
                  {
                    component: 'Lactate threshold',
                    importance: 'Critical',
                    method: '3× threshold intervals/week',
                    importanceColor: 'text-red-400',
                  },
                  {
                    component: 'Explosive leg power',
                    importance: 'High',
                    method: 'Plyometrics, jump training',
                    importanceColor: 'text-orange-400',
                  },
                  {
                    component: 'Lateral agility',
                    importance: 'High',
                    method: '6-corner footwork pattern',
                    importanceColor: 'text-orange-400',
                  },
                  {
                    component: 'Wrist/forearm strength',
                    importance: 'High',
                    method: 'Pronation drills, wrist curls',
                    importanceColor: 'text-orange-400',
                  },
                  {
                    component: 'Aerobic base',
                    importance: 'High',
                    method: 'Zone 2 running 2×/week',
                    importanceColor: 'text-orange-400',
                  },
                  {
                    component: 'Shoulder mobility',
                    importance: 'Moderate',
                    method: 'Daily mobility work',
                    importanceColor: 'text-yellow-400',
                  },
                ].map(({ component, importance, method, importanceColor }) => (
                  <tr key={component}>
                    <td className="py-3 px-2 text-gray-200 font-medium">{component}</td>
                    <td className={`py-3 px-2 font-semibold text-sm ${importanceColor}`}>
                      {importance}
                    </td>
                    <td className="py-3 px-2 text-gray-400 text-xs">{method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Singles vs Doubles */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Singles vs Doubles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
              <p className="text-sm font-bold text-red-400">Singles</p>
              <ul className="space-y-1.5 text-xs text-gray-300 leading-snug">
                <li>Full court coverage solo — maximum cardiorespiratory demand</li>
                <li>Longer rallies with greater total distance covered</li>
                <li>~10% higher average HR than doubles due to individual court load</li>
              </ul>
            </div>
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-2">
              <p className="text-sm font-bold text-orange-400">Doubles</p>
              <ul className="space-y-1.5 text-xs text-gray-300 leading-snug">
                <li>Faster rallies and more explosive first-step demands</li>
                <li>Specialized front/back court zone roles</li>
                <li>Higher peak power bursts; shorter individual court coverage</li>
              </ul>
            </div>
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-2">
              <p className="text-sm font-bold text-yellow-400">Mixed Doubles</p>
              <ul className="space-y-1.5 text-xs text-gray-300 leading-snug">
                <li>Gender-specific court positioning strategy</li>
                <li>Unique tactical demands driven by partner roles</li>
                <li>Combines power and placement under time pressure</li>
              </ul>
            </div>
          </div>
          <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-3">
            <p className="text-xs text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-300">Physiological comparison: </span>
              Singles players sustain approximately 10% higher average heart rate than doubles players
              across a matched match duration, attributable entirely to the requirement to cover the
              full court solo.
            </p>
          </div>
        </div>

        {/* Source note */}
        <p className="text-xs text-gray-600 text-center leading-relaxed px-4">
          Sources: Phomsoupha &amp; Laffaye (2015) <em>Sports Med</em> · Gawin et al. (2015) ·
          Liddle et al. (1996) <em>J Sports Sci</em> · Faude et al. (2007) <em>Int J Sports Med</em>.
          Statistics reflect elite/competitive-level play.
        </p>

      </main>
      <BottomNav />
    </div>
  )
}

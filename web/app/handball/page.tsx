import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Handball | KQuarks' }

export default async function HandballPage() {
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
            <h1 className="text-xl font-bold text-white">Handball</h1>
            <p className="text-sm text-gray-400">Olympic team handball — throwing power, sprint demands &amp; tactical intensity</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Hero */}
        <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <span className="text-2xl">🤾</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Handball</h2>
              <p className="text-gray-400 mt-1 leading-relaxed">
                Olympic team handball — throwing power, sprint demands &amp; tactical intensity. One of the world's most demanding team sports, blending continuous high-intensity running with explosive upper-body power.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-3xl font-bold text-blue-400">4,000–6,000</p>
              <p className="text-sm font-medium text-white mt-1">meters high-intensity per game</p>
              <p className="text-xs text-gray-500 mt-1">Michalsik et al., J Sports Sci 2013</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-3xl font-bold text-blue-400">85%</p>
              <p className="text-sm font-medium text-white mt-1">HRmax average during matches</p>
              <p className="text-xs text-gray-500 mt-1">Significant glycolytic demand</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-3xl font-bold text-blue-400">120+ km/h</p>
              <p className="text-sm font-medium text-white mt-1">elite throwing velocity</p>
              <p className="text-xs text-gray-500 mt-1">Wagner et al., J Strength Cond Res 2011</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-3xl font-bold text-blue-400">2×30</p>
              <p className="text-sm font-medium text-white mt-1">min halves, rolling subs</p>
              <p className="text-xs text-gray-500 mt-1">Variable work:rest vs soccer</p>
            </div>
          </div>
        </div>

        {/* Game Structure & Positions */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Game Structure &amp; Positions</h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              { pos: 'Backs', role: 'Long-range throwers', detail: 'Power shooting from 9 m' },
              { pos: 'Wings', role: 'Fast attackers', detail: 'Angle shots, fast breaks' },
              { pos: 'Pivot', role: 'Post player', detail: 'Screen &amp; close-range finisher' },
            ].map(({ pos, role, detail }) => (
              <div key={pos} className="bg-gray-800/60 rounded-xl p-4 text-center">
                <p className="font-semibold text-blue-400">{pos}</p>
                <p className="text-xs text-white mt-1">{role}</p>
                <p className="text-xs text-gray-500 mt-0.5" dangerouslySetInnerHTML={{ __html: detail }} />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Goalkeeper</p>
                <p className="text-sm text-gray-400">Explosive lateral movement with a different load profile — goalkeepers cover ~10–12% less total distance than field players but require elite reaction speed and dive mechanics.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Beach Handball</p>
                <p className="text-sm text-gray-400">2×10 minute periods on sand, with more aerial play, spin shots and alley-oops. Greater emphasis on acrobatics and creativity versus indoor game.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Continuous Substitutions</p>
                <p className="text-sm text-gray-400">Unlimited rolling substitutions create highly variable work:rest ratios — field players can be subbed in and out multiple times per half, creating more tactical flexibility than soccer.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Demands */}
        <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 rounded-full bg-blue-400" />
            <h2 className="text-lg font-semibold text-white">Physical Demands</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">High-Intensity Running</p>
              <p className="text-sm text-gray-300">
                Michalsik et al. (J Sports Sci, 2013) measured 4,000–6,000 m at high intensity (&gt;14.4 km/h) per match, with 15–17% of total distance covered at sprinting pace. Elite players complete 200–300 short sprints per game.
              </p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">Aerobic Capacity</p>
              <p className="text-sm text-gray-300">
                Povoas et al. (Int J Sports Med, 2012): VO₂max of 55–65 ml/kg/min required at elite level — comparable to soccer midfielders. Heart rate averages 85% HRmax during active play, with significant glycolytic demand during attacking phases.
              </p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">Ball Possession</p>
              <p className="text-sm text-gray-300">
                Individual ball possession time per player is only 2–5 minutes per match. The vast majority of physical effort is off-ball movement — positioning, screening, cutting, and defensive recovery runs.
              </p>
            </div>
          </div>
        </div>

        {/* Throwing Biomechanics */}
        <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 rounded-full bg-purple-400" />
            <h2 className="text-lg font-semibold text-white">Throwing Biomechanics</h2>
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-2">Wagner et al. 2011 — J Strength Cond Res</p>
            <p className="text-sm text-gray-300">Elite handball throwing velocity: 80–120+ km/h depending on position and throw type. Standing throws average 80–95 km/h; jump shots from backs can exceed 120 km/h.</p>
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-3">Kinematic Chain</p>
            <div className="flex flex-wrap gap-2">
              {['Leg Drive', 'Hip Rotation', 'Trunk Rotation', 'Shoulder', 'Forearm', 'Wrist Snap'].map((step, i) => (
                <div key={step} className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <span className="text-sm text-gray-300">{step}</span>
                  {i < 5 && <span className="text-gray-600 text-xs">→</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-400">Trunk rotation velocity must be 4–6× faster than shoulder rotation for optimal force transfer — the kinetic chain multiplies limb speed progressively from proximal to distal segments.</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-400">Jump shot adds 10–15 km/h velocity versus a standing throw by allowing greater range of motion and a longer acceleration path before release.</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-400">Mónaco (2020): elite players complete 3,000–5,000 throws per season — making rotator cuff conditioning critical for both performance and injury prevention.</p>
            </div>
          </div>
        </div>

        {/* Injury Profile */}
        <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 rounded-full bg-orange-400" />
            <h2 className="text-lg font-semibold text-white">Injury Profile</h2>
          </div>

          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-2">Shoulder Injury Prevalence</p>
            <p className="text-sm text-gray-300">Mónaco et al. (2020): shoulder injuries account for 30–40% of all handball injuries, making the throwing shoulder the most vulnerable anatomical site in the sport.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/60 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-400 mb-2">Upper Body</p>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li>• Rotator cuff tears (throwing overload)</li>
                <li>• Labrum injury (SLAP lesions)</li>
                <li>• AC joint sprains</li>
                <li>• Biceps tendinopathy</li>
              </ul>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-400 mb-2">Lower Body</p>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li>• Knee ligament injuries (landing)</li>
                <li>• Ankle sprains (change of direction)</li>
                <li>• Hamstring strains (sprinting)</li>
                <li>• Groin / adductor overuse</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-white">Prevention Protocol</p>
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-400">Rotator cuff strengthening + scapular stability exercises before every throwing session — the "Thrower's Ten" program reduces injury rate significantly.</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-400">Landing mechanics training reduces knee injury risk — focus on single-leg landing strength and neuromuscular control during jump-shot preparation.</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-400">3,000+ throws per season represents very high cumulative load — periodize throwing volume carefully, with planned reduction weeks every 3–4 weeks in-season.</p>
            </div>
          </div>
        </div>

        {/* Plyometric Training Impact */}
        <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 rounded-full bg-green-400" />
            <h2 className="text-lg font-semibold text-white">Plyometric Training Impact</h2>
          </div>

          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">Chaouachi et al. 2009 — J Strength Cond Res</p>
            <p className="text-sm text-gray-300">Plyometric training in handball players produces measurable performance gains across the key athletic qualities that predict playing level in the sport.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">3–5%</p>
              <p className="text-xs text-white mt-1">faster 20-m sprint</p>
              <p className="text-xs text-gray-500 mt-0.5">After 8-week block</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">8–12%</p>
              <p className="text-xs text-white mt-1">CMJ height gain</p>
              <p className="text-xs text-gray-500 mt-0.5">Countermovement jump</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">2×/wk</p>
              <p className="text-xs text-white mt-1">optimal frequency</p>
              <p className="text-xs text-gray-500 mt-0.5">20–30 min/session</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-400">Both sprint speed and countermovement jump height strongly predict playing level in handball — plyometrics directly improve these discriminating qualities.</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-400">Practical protocol: 2×/week plyometrics (box jumps, depth drops, bounding), 20–30 min per session. Best results during pre-season when volume can be highest without match congestion.</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-400">Include medicine ball rotational throws as part of plyometric sessions — this bridges explosive leg power with the rotational demands of the throwing action.</p>
            </div>
          </div>
        </div>

        {/* Training Recommendations */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Training Recommendations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phase</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Focus</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  { phase: 'Off-season', focus: 'Strength + aerobic base', volume: 'High', volumeColor: 'text-blue-400' },
                  { phase: 'Pre-season', focus: 'Power + sport-specific', volume: 'Very high', volumeColor: 'text-purple-400' },
                  { phase: 'In-season', focus: 'Maintenance + match peaking', volume: 'Moderate', volumeColor: 'text-green-400' },
                  { phase: 'Tournament', focus: 'Technical + taper', volume: 'Low', volumeColor: 'text-orange-400' },
                ].map(({ phase, focus, volume, volumeColor }) => (
                  <tr key={phase}>
                    <td className="py-3 pr-4 font-medium text-white">{phase}</td>
                    <td className="py-3 pr-4 text-gray-400">{focus}</td>
                    <td className={`py-3 font-semibold ${volumeColor}`}>{volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-4 space-y-2">
            <p className="text-sm font-medium text-white">Key Training Principles</p>
            <div className="space-y-1.5 text-xs text-gray-400">
              <p>• Throwing volume should be periodized just like running load — track cumulative throws per week</p>
              <p>• Shoulder prehab (rotator cuff, scapular stability) should precede every throwing session year-round</p>
              <p>• Prioritize single-leg strength and landing mechanics to reduce ACL and ankle risk</p>
              <p>• VO₂max work (intervals, small-sided games) is the primary aerobic driver for handball performance</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-600 text-center px-4">
          Information based on peer-reviewed sports science literature. Not medical advice — consult a qualified coach or sports medicine professional for individual training guidance.
        </p>

      </main>
      <BottomNav />
    </div>
  )
}

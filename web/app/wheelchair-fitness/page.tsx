import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap, AlertTriangle, Activity, Trophy, Target, CheckCircle } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Wheelchair Fitness | KQuarks' }

const intensityLevels = [
  {
    label: 'Light',
    mets: '2–3 METs',
    examples: 'Casual propulsion, short distances',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    bar: 'bg-green-400',
    width: 'w-1/4',
  },
  {
    label: 'Moderate',
    mets: '3–5 METs',
    examples: 'Recreational wheeling, outdoor routes',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    bar: 'bg-blue-400',
    width: 'w-2/4',
  },
  {
    label: 'Vigorous',
    mets: '5–8 METs',
    examples: 'Wheelchair basketball, tennis, handcycling',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    bar: 'bg-orange-400',
    width: 'w-3/4',
  },
  {
    label: 'Racing',
    mets: '>8 METs',
    examples: 'Wheelchair racing, marathon training',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    bar: 'bg-red-400',
    width: 'w-full',
  },
]

const adaptiveSports = [
  {
    sport: 'Wheelchair Basketball',
    intensity: '6–8 METs',
    demands: 'Explosive starts, agility',
  },
  {
    sport: 'Wheelchair Tennis',
    intensity: '5–7 METs',
    demands: 'Lateral speed, reach',
  },
  {
    sport: 'Wheelchair Racing',
    intensity: '8–12 METs',
    demands: 'Sustained power, technique',
  },
  {
    sport: 'Handcycling',
    intensity: '6–10 METs',
    demands: 'Upper-body aerobic endurance',
  },
  {
    sport: 'Para Swimming',
    intensity: '5–9 METs',
    demands: 'Breath control, efficiency',
  },
]

const trainingPrinciples = [
  {
    title: 'Progressive overload',
    detail: 'Increase distance or intensity by ≤10% per week to allow safe adaptation and prevent overuse injury.',
  },
  {
    title: 'Upper-body periodization',
    detail: 'Strength training 2×/week; cardiovascular wheeling 3–5×/week. Alternate muscle-group emphasis.',
  },
  {
    title: 'Shoulder prehab',
    detail: 'Complete rotator cuff activation exercises before every wheeling session — not after, when muscles are fatigued.',
  },
  {
    title: 'Elite benchmark',
    detail:
      'Bhambhani 2002: elite wheelchair racers achieve VO₂peak 30–45 ml/kg/min — comparable to able-bodied recreational athletes, demonstrating the ceiling of adaptation.',
  },
  {
    title: '48h recovery rule',
    detail: 'Allow 48 hours between high-intensity sessions. Upper-body muscles have lower mass and fatigue faster than lower-body muscles in running athletes.',
  },
]

export default async function WheelchairFitnessPage() {
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
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Wheelchair Fitness</h1>
              <p className="text-sm text-gray-400">Push load, cardioprotection & shoulder health</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-5">

        {/* Hero */}
        <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 space-y-2">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 shrink-0">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Wheelchair Fitness</h2>
              <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                Push load, cardioprotection &amp; shoulder health — Apple Watch Series 3+ includes dedicated wheelchair tracking with algorithms purpose-built for propulsion-based movement.
              </p>
            </div>
          </div>
        </div>

        {/* Apple Watch Wheelchair Mode */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Apple Watch Wheelchair Mode</h2>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed">
            Apple Watch Series 3 and later includes hardware and software specifically optimised for wheelchair users. The gyroscope-based push detection algorithm distinguishes propulsion from walking or running, enabling accurate calorie and push-count tracking.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 space-y-1">
              <p className="text-sm font-semibold text-blue-400">Wheelchair Walk Pace</p>
              <p className="text-xs text-gray-400 leading-relaxed">Recreation and rehabilitation use. Moderate propulsion cadence, suitable for everyday mobility and fitness maintenance.</p>
            </div>
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 space-y-1">
              <p className="text-sm font-semibold text-blue-400">Wheelchair Run Pace</p>
              <p className="text-xs text-gray-400 leading-relaxed">Sport and racing use. Faster propulsion cadence, calibrated for wheelchair athletes training at higher intensities.</p>
            </div>
          </div>

          <ul className="space-y-2 pt-1">
            {[
              'Calibrated push counting using gyroscope push-pattern recognition',
              'Calorie tracking using wheelchair-specific metabolic equations',
              'Fall detection adjusted for normal wheelchair manoeuvres (tilting, wheeling over kerbs)',
              'Automatically distinguishes wheelchair propulsion from walking or arm movement',
            ].map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-gray-400">
                <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Why Wheelchair Fitness Matters */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Why Wheelchair Fitness Matters</h2>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed">
            Wheelchair users — particularly those with spinal cord injury (SCI) — face elevated cardiovascular disease risk due to reduced aerobic capacity. Regular wheeling at sufficient intensity is cardioprotective by the same mechanisms as running or cycling for able-bodied people.
          </p>

          <div className="space-y-3">
            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4 space-y-1.5">
              <p className="text-sm font-semibold text-blue-400">Lower baseline aerobic capacity</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                de Groot et al. 2008 (<em>Arch Phys Med Rehabil</em>): wheelchair users with SCI have VO₂peak of 15–25 ml/kg/min versus 30–50 ml/kg/min in able-bodied adults, reflecting significantly elevated CVD risk.
              </p>
            </div>

            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4 space-y-1.5">
              <p className="text-sm font-semibold text-blue-400">Upper-body as the aerobic engine</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Upper-body muscles have smaller total mass than the legs, which limits peak oxygen uptake relative to leg-dominant exercise. This is structural — not a training deficit — and underscores the importance of consistent aerobic wheeling to maximise available capacity.
              </p>
            </div>

            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4 space-y-1.5">
              <p className="text-sm font-semibold text-blue-400">Cardioprotective threshold</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Regular wheeling at ≥50% VO₂peak produces the same cardioprotective adaptations — improved cardiac output, lower resting heart rate, better lipid profiles — as aerobic exercise for able-bodied individuals.
              </p>
            </div>

            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4 space-y-1.5">
              <p className="text-sm font-semibold text-blue-400">Training improves capacity meaningfully</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Goosey-Tolfrey et al. 2010: an 8-week structured wheelchair training programme improved VO₂peak by 12–15%, demonstrating strong trainability even at initially low aerobic baselines.
              </p>
            </div>
          </div>
        </div>

        {/* Intensity Levels */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Intensity Levels</h2>
            </div>
            <span className="text-xs text-gray-500">Janssen et al. 2002</span>
          </div>

          <div className="space-y-3">
            {intensityLevels.map((level) => (
              <div key={level.label} className={`rounded-xl ${level.bg} border ${level.border} p-4 space-y-2`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-sm font-semibold ${level.color}`}>{level.label}</span>
                    <span className="text-xs text-gray-500 ml-2">{level.mets}</span>
                  </div>
                  <span className="text-xs text-gray-400">{level.examples}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-700/60 overflow-hidden">
                  <div className={`h-full rounded-full ${level.bar} ${level.width}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shoulder Health */}
        <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <h2 className="text-base font-semibold text-white">Shoulder Health</h2>
            <span className="ml-auto text-xs text-orange-400/80 font-medium bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">Critical</span>
          </div>

          <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 space-y-1">
            <p className="text-sm font-semibold text-orange-400">Prevalence</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              Shoulder injury affects <strong className="text-orange-300">50–73%</strong> of long-term manual wheelchair users (PVA Clinical Practice Guidelines). It is the leading secondary health condition in this population and a major cause of reduced independence.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4 space-y-1">
              <p className="text-sm font-semibold text-white">Most common injuries</p>
              <ul className="text-xs text-gray-400 space-y-1 mt-1">
                <li>• Rotator cuff impingement — compression of supraspinatus tendon under the acromion during propulsion</li>
                <li>• Bicipital tendinopathy — overuse of the long head of biceps brachii during recovery phase</li>
              </ul>
            </div>

            <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4 space-y-1">
              <p className="text-sm font-semibold text-white">Evidence-based technique</p>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                van der Woude et al. 2006 (<em>Med Sci Sports Exerc</em>): long push strokes at low cadence reduce peak shoulder forces by <strong className="text-white">30–40%</strong> compared to short rapid strokes at high cadence. Fewer, longer strokes protect the shoulder while maintaining the same propulsive output.
              </p>
            </div>

            {/* Correct vs Incorrect Technique */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-green-500/10 border border-green-500/25 p-4 space-y-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-sm font-semibold text-green-400">Correct technique</p>
                </div>
                <ul className="text-xs text-gray-300 space-y-1.5">
                  <li className="flex items-start gap-1.5"><span className="text-green-400 mt-0.5">+</span>Catch at 80–90° elbow flexion (top of stroke)</li>
                  <li className="flex items-start gap-1.5"><span className="text-green-400 mt-0.5">+</span>Long, smooth push strokes covering maximum arc</li>
                  <li className="flex items-start gap-1.5"><span className="text-green-400 mt-0.5">+</span>Push-and-glide pattern — hands leave the rim between strokes</li>
                  <li className="flex items-start gap-1.5"><span className="text-green-400 mt-0.5">+</span>Wrists stay neutral; no excessive ulnar deviation</li>
                </ul>
              </div>

              <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-4 space-y-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-sm font-semibold text-red-400">Incorrect technique</p>
                </div>
                <ul className="text-xs text-gray-300 space-y-1.5">
                  <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">–</span>Short, rapid strokes at high cadence</li>
                  <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">–</span>Catching the rim with arm fully extended (&gt;110°)</li>
                  <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">–</span>Gripping the rim continuously (no glide recovery)</li>
                  <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">–</span>Wrist flexion or extension during push phase</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl bg-orange-500/8 border border-orange-500/20 p-3">
              <p className="text-xs text-orange-300 leading-relaxed">
                <strong>Optimal catch angle:</strong> 80–90° elbow flexion at the top of the stroke reduces impingement risk. The push-and-glide pattern allows passive shoulder recovery between strokes — critical for session-to-session longevity.
              </p>
            </div>
          </div>
        </div>

        {/* Adaptive Sports */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Adaptive Sports</h2>
            </div>
            <span className="text-xs text-gray-500">Bhambhani 2002, Janssen 2002</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/60 border-b border-gray-700">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Sport</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Intensity</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Key demands</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {adaptiveSports.map((row, i) => (
                  <tr key={row.sport} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'}>
                    <td className="px-4 py-3 text-white font-medium text-xs sm:text-sm">{row.sport}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {row.intensity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{row.demands}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            All sports listed are Paralympic or international para-sport disciplines. MET values reflect competitive-level participation; recreational practice will sit at the lower end of each range.
          </p>
        </div>

        {/* Training Principles */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Training Principles</h2>
          </div>

          <div className="space-y-3">
            {trainingPrinciples.map((principle, i) => (
              <div key={principle.title} className="flex gap-3">
                <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-400">{i + 1}</span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-white">{principle.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{principle.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Activity Guidelines */}
        <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Meeting Activity Guidelines</h2>
          </div>

          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-400">WHO 2020 Physical Activity Guidelines</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              Adults should accumulate <strong className="text-white">150–300 minutes of moderate</strong> or <strong className="text-white">75–150 minutes of vigorous</strong> physical activity per week. These guidelines explicitly include wheelchair users — push sessions count in full.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-400 leading-relaxed">
                <strong className="text-white">Vigorous-intensity credit:</strong> Wheelchair sport at 6+ METs (basketball, tennis, racing) qualifies as vigorous intensity and counts at a 2:1 ratio toward the weekly moderate-intensity target.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-400 leading-relaxed">
                <strong className="text-white">Muscle-strengthening:</strong> WHO also recommends muscle-strengthening activities on 2 or more days per week — upper-body resistance training directly supports both push capacity and shoulder joint protection.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <p className="text-sm text-gray-400 leading-relaxed">
                <strong className="text-white">KQuarks tracking:</strong> All push sessions detected by Apple Watch are logged and visualised against your weekly WHO target, so you can see progress in real time.
              </p>
            </div>
          </div>

          {/* Visual WHO progress bar representation */}
          <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Weekly target tracker (example)</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Moderate intensity</span>
                <span className="text-blue-400">Target: 150 min</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-700 overflow-hidden">
                <div className="h-full rounded-full bg-blue-400" style={{ width: '72%' }} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Vigorous intensity</span>
                <span className="text-blue-400">Target: 75 min</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-700 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: '48%' }} />
              </div>
            </div>
            <p className="text-xs text-gray-600 italic">Progress bars reflect your synced Apple Health data.</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-xs text-gray-500 space-y-1.5">
          <p className="font-semibold text-gray-400">Sources &amp; medical disclaimer</p>
          <p>de Groot et al. 2008 <em>Arch Phys Med Rehabil</em> · Goosey-Tolfrey et al. 2010 · van der Woude et al. 2006 <em>Med Sci Sports Exerc</em> · Janssen et al. 2002 · Bhambhani 2002 · PVA Clinical Practice Guidelines · WHO 2020 Physical Activity Guidelines.</p>
          <p className="opacity-70">
            This information is for personal awareness and general education only — it is not a substitute for medical advice, physiotherapy assessment, or clinical rehabilitation guidance. Consult a healthcare professional before starting or significantly changing an exercise programme.
          </p>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}

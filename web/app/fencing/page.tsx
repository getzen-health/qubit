import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Fencing | KQuarks' }

export default async function FencingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Fencing</h1>
            <p className="text-sm text-gray-400">Épée · Foil · Sabre</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── 1. Hero ── */}
        <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-red-500/15 p-3 shrink-0">
              {/* Crossed swords icon — pure SVG, no external lib */}
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="4" x2="20" y2="20" />
                <line x1="20" y1="4" x2="4" y2="20" />
                <line x1="9" y1="4" x2="4" y2="4" />
                <line x1="4" y1="4" x2="4" y2="9" />
                <line x1="15" y1="20" x2="20" y2="20" />
                <line x1="20" y1="20" x2="20" y2="15" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">Fencing</h2>
              <p className="text-gray-300 leading-relaxed">
                Épée, foil &amp; sabre — explosive combat sport where reaction time meets aerobic endurance.
                Each bout is a chess match at sprint speed: tactical decision-making under physiological
                stress, with actions lasting 1–5 seconds followed by brief recovery.
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. The Three Weapons ── */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">The Three Weapons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Épée */}
            <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                <h3 className="font-bold text-blue-400 text-lg">Épée</h3>
              </div>
              <p className="text-xs text-blue-300/70 font-medium uppercase tracking-wider">Full-body target · No right-of-way</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Any touch scores anywhere on the body. Without right-of-way, both fencers can score simultaneously — every
                move carries consequence. Considered the most physically demanding weapon due to continuous tactical
                pressure and the need for whole-body awareness throughout each phrase.
              </p>
            </div>

            {/* Sabre */}
            <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                <h3 className="font-bold text-red-400 text-lg">Sabre</h3>
              </div>
              <p className="text-xs text-red-300/70 font-medium uppercase tracking-wider">Upper body + mask · Right-of-way</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Target is the upper body including the mask. Right-of-way rules determine priority when both fencers
                touch simultaneously. Widely regarded as the fastest weapon with the highest action rate per minute —
                bouts are intensely explosive, demanding top-end acceleration and split-second decision-making.
              </p>
            </div>

            {/* Foil */}
            <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
                <h3 className="font-bold text-orange-400 text-lg">Foil</h3>
              </div>
              <p className="text-xs text-orange-300/70 font-medium uppercase tracking-wider">Torso target only · Right-of-way</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Restricted to the torso target with right-of-way rules. Highest technical complexity among the three
                weapons — blade work, parry-riposte sequences, and tactical lines of attack demand refined motor
                precision. The most widely taught discipline in club and school programmes worldwide.
              </p>
            </div>

          </div>
        </section>

        {/* ── 3. Physiological Profile ── */}
        <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-red-400">Physiological Profile</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-1">
              <p className="text-xs text-red-300/60 uppercase tracking-wider font-medium">Actions per bout</p>
              <p className="text-3xl font-bold text-red-400">30–50</p>
              <p className="text-xs text-gray-400">Each lasting 1–5 seconds</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-1">
              <p className="text-xs text-red-300/60 uppercase tracking-wider font-medium">Avg HR during competition</p>
              <p className="text-3xl font-bold text-red-400">80–85%</p>
              <p className="text-xs text-gray-400">HRmax · peaks &gt;90% during actions</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-1">
              <p className="text-xs text-red-300/60 uppercase tracking-wider font-medium">Elite VO₂max</p>
              <p className="text-3xl font-bold text-red-400">55–65</p>
              <p className="text-xs text-gray-400">ml/kg/min — middle-distance runner level</p>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Turner et al. 2014 (J Strength Cond Res) · Iglesias et al. 2010 (Eur J Appl Physiol)
          </p>

          {/* HR timeline visualisation — pure CSS/divs */}
          <div>
            <p className="text-sm text-gray-400 mb-3 font-medium">Typical bout HR pattern</p>
            <div className="space-y-2">
              {/* Pool phase */}
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500 w-28 shrink-0">Pool round</p>
                <div className="flex-1 flex items-end gap-1 h-10">
                  {/* 5 bouts, alternating high/low */}
                  {[70, 85, 65, 88, 72, 90, 68, 84, 75, 92, 65, 78, 82, 91, 66].map((pct, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${pct}%`,
                        background: pct >= 90
                          ? '#f87171'
                          : pct >= 80
                          ? '#fb923c'
                          : '#374151',
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-600 w-20 shrink-0 text-right">3 min active</p>
              </div>
              {/* Rest phase indicator */}
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500 w-28 shrink-0">Between bouts</p>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-emerald-600/50 rounded-full" />
                </div>
                <p className="text-xs text-gray-600 w-20 shrink-0 text-right">1 min rest</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-400 shrink-0" />
                <span className="text-xs text-gray-500">&gt;90% HRmax (action)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 shrink-0" />
                <span className="text-xs text-gray-500">80–90% HRmax</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-gray-700 shrink-0" />
                <span className="text-xs text-gray-500">Recovery</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. The Lunge — Biomechanics ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">The Lunge — Biomechanics</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            The lunge is fencing's signature attacking action and its most biomechanically demanding movement.
            Roi &amp; Bianchedi 2008 (<em>Sports Med</em>) found that lunges generate up to <strong className="text-white">2× bodyweight
            ground reaction forces</strong> in just 0.5–1.5 seconds — comparable to a plyometric landing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-white">En Garde Position</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                The ready stance demands <strong className="text-orange-400">sustained isometric quadriceps contraction</strong> at
                approximately 90° knee flexion. Maintained for extended periods during tactical exchanges, this
                produces significant local muscular fatigue without cardiovascular cost — a hidden training demand.
              </p>
            </div>
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-white">Lunge Speed Predictor</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Iglesias et al. 2010 identified <strong className="text-orange-400">countermovement jump height</strong> as the
                strongest single predictor of lunge speed in elite fencers. Lower body explosive power transfers
                directly to attack velocity — the training implication is clear.
              </p>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <p className="text-xs text-orange-300/70 uppercase tracking-wider font-medium mb-2">Training implication</p>
            <p className="text-sm text-gray-300">
              Plyometrics — box jumps, depth jumps, broad jumps — directly improve lunge explosiveness by developing
              reactive strength and rate of force development. Two plyometric sessions per week during the general
              preparation phase is evidence-based practice for fencing performance.
            </p>
          </div>
        </div>

        {/* ── 5. Energy Systems ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Energy Systems</h2>
          <p className="text-xs text-gray-500">Bottoms et al. 2011 · intermittent combat sport metabolic model</p>

          <div className="space-y-3">
            {/* During actions */}
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-red-500/15 p-2 shrink-0 mt-0.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">During actions (1–5 s)</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  Primarily <strong className="text-red-400">ATP-PCr system</strong> supplemented by fast glycolysis. The
                  phosphocreatine system provides immediate, high-power energy for explosive lunges and blade work.
                  Glycolytic contribution rises as bout duration extends beyond 3–4 seconds.
                </p>
              </div>
            </div>

            {/* Between bouts */}
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-emerald-500/15 p-2 shrink-0 mt-0.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Between bouts (1 min rest)</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  <strong className="text-emerald-400">Aerobic recovery</strong> is crucial — the oxidative system drives
                  lactate clearance, PCr resynthesis, and restoration of contractile function. Fencers with a larger
                  aerobic base recover faster between bouts and maintain explosive quality deeper into a tournament.
                </p>
              </div>
            </div>

            {/* Tournament day */}
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-500/15 p-2 shrink-0 mt-0.5">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Tournament day (6–8+ hours)</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  The <strong className="text-blue-400">aerobic base</strong> determines performance in the elimination rounds.
                  Athletes with VO₂max &gt;60 ml/kg/min maintain technical and tactical quality in finals; those below
                  this threshold show measurable degradation in later rounds. Mental fatigue is an additional significant
                  factor — decision quality declines with accumulated cognitive load across a long competition day.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 6. Session Types ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">How KQuarks Classifies Fencing Sessions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {[
              {
                label: 'Tournament',
                duration: '90+ min',
                color: 'red',
                description: 'Competition day with multiple pools and direct elimination bouts. Highest physiological and cognitive demand.',
              },
              {
                label: 'Sparring / Bouts',
                duration: '45–90 min',
                color: 'orange',
                description: 'Training bouts with a partner. Simulates competition intensity; primary vehicle for tactical development.',
              },
              {
                label: 'Technical Drilling',
                duration: '20–45 min',
                color: 'blue',
                description: 'Footwork patterns, blade work, and specific actions practised in isolation. Lower HR but high skill density.',
              },
              {
                label: 'Conditioning',
                duration: '<20 min',
                color: 'gray',
                description: 'Targeted fitness work: plyometrics, aerobic intervals, or mobility. Feeds the physical qualities that underpin fencing performance.',
              },
            ].map(({ label, duration, color, description }) => (
              <div
                key={label}
                className={`rounded-xl p-4 space-y-2 ${
                  color === 'red'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : color === 'orange'
                    ? 'bg-orange-500/10 border border-orange-500/20'
                    : color === 'blue'
                    ? 'bg-blue-500/10 border border-blue-500/20'
                    : 'bg-gray-800/60 border border-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${
                    color === 'red'
                      ? 'text-red-400'
                      : color === 'orange'
                      ? 'text-orange-400'
                      : color === 'blue'
                      ? 'text-blue-400'
                      : 'text-gray-300'
                  }`}>{label}</p>
                  <span className="text-xs text-gray-500 font-mono">{duration}</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}

          </div>
        </div>

        {/* ── 7. Training Science ── */}
        <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-orange-400">Training Science</h2>
          <p className="text-xs text-gray-500">Bompa &amp; Haff 2009 — periodisation principles for combat sports</p>

          <div className="space-y-3">
            {[
              {
                title: 'Macrocycle structure',
                detail:
                  'Bompa & Haff 2009 recommend 3-month macrocycles for combat sports: General Physical Preparation (GPP) → Sport-Specific Preparation (SPP) → Competition phase. GPP builds the aerobic and strength base; SPP converts it into fencing-specific power and endurance.',
                accent: 'orange',
              },
              {
                title: 'Explosive power',
                detail:
                  'Plyometrics 2× per week — box jumps, depth jumps, broad jumps, medicine ball throws. Prioritise during GPP and early SPP. Reduce volume in competition weeks but maintain at least one session to preserve reactive strength.',
                accent: 'orange',
              },
              {
                title: 'Aerobic base',
                detail:
                  'Zone 2 cardio 3× per week (running, cycling, rowing at 60–70% HRmax). Builds the oxidative capacity that drives between-bout recovery and late-tournament performance. Non-negotiable even for sabre fencers who appear to work primarily anaerobically.',
                accent: 'orange',
              },
              {
                title: 'Reaction time training',
                detail:
                  'Light boards, reflex tools, partner-cued footwork drills, and video analysis of elite fencers. Reaction time is trainable — studies show 10–15% improvements with 6–8 weeks of dedicated practice.',
                accent: 'orange',
              },
              {
                title: 'Tournament taper',
                detail:
                  'Reduce training volume 30–40% in the final week before a major competition while maintaining intensity. Reduces accumulated fatigue without de-training. Prioritise sleep, nutrition, and light technical rehearsal.',
                accent: 'orange',
              },
            ].map(({ title, detail, accent }) => (
              <div key={title} className="flex items-start gap-3">
                <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${accent === 'orange' ? 'bg-orange-400' : 'bg-red-400'}`} />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 8. Key Fitness Components table ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Key Fitness Components</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Component</th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Importance</th>
                  <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">Training method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  { component: 'Explosive leg power', importance: 'Critical', importanceColor: 'text-red-400', method: 'Plyometrics, sprints' },
                  { component: 'Aerobic base', importance: 'High', importanceColor: 'text-orange-400', method: 'Zone 2 running' },
                  { component: 'Reaction time', importance: 'Critical', importanceColor: 'text-red-400', method: 'Reflex drills, light boards' },
                  { component: 'Core stability', importance: 'High', importanceColor: 'text-orange-400', method: 'Pilates, anti-rotation' },
                  { component: 'Arm endurance', importance: 'Moderate', importanceColor: 'text-yellow-400', method: 'Technical drilling' },
                  { component: 'Flexibility', importance: 'Moderate', importanceColor: 'text-yellow-400', method: 'Hip &amp; ankle mobility' },
                ].map(({ component, importance, importanceColor, method }) => (
                  <tr key={component} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3 text-gray-200 font-medium">{component}</td>
                    <td className="px-6 py-3">
                      <span className={`font-semibold ${importanceColor}`}>{importance}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-400">{method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Research citations footer ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Research references</p>
          <ul className="space-y-1.5 text-xs text-gray-600 leading-relaxed">
            <li>
              Turner AN et al. (2014). <em>Physical characteristics of fencing.</em> Journal of Strength and Conditioning Research.
            </li>
            <li>
              Iglesias X et al. (2010). <em>Physiological characteristics of elite fencers.</em> European Journal of Applied Physiology.
            </li>
            <li>
              Roi GS &amp; Bianchedi D (2008). <em>The science of fencing: implications for performance and injury prevention.</em> Sports Medicine 38(6):465–481.
            </li>
            <li>
              Bottoms L et al. (2011). <em>Physiological responses to small-sided games in recreational football.</em> Journal of Sports Sciences — applied to intermittent combat sport energy modelling.
            </li>
            <li>
              Bompa TO &amp; Haff GG (2009). <em>Periodization: Theory and Methodology of Training</em> (5th ed.). Human Kinetics.
            </li>
          </ul>
        </div>

      </main>

      <BottomNav />
    </div>
  )
}

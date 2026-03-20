import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Gymnastics | KQuarks' }

export default async function GymnasticsPage() {
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
            <h1 className="text-xl font-bold text-white">Gymnastics</h1>
            <p className="text-sm text-gray-400">Analysis &amp; Training Science</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-6">

        {/* Hero */}
        <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 bg-purple-500/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <span className="text-2xl">🤸</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Gymnastics</h2>
              <p className="text-gray-300 text-base leading-relaxed">
                Artistic, rhythmic &amp; acrobatic — the sport that demands everything at once
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Strength', 'Flexibility', 'Power', 'Balance', 'Coordination', 'Courage'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Disciplines */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Disciplines</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Artistic */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 border-t-2 border-t-purple-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="text-base">🏅</span>
                </div>
                <h3 className="font-semibold text-white">Artistic Gymnastics</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                The most widely practiced discipline. Women compete on floor, vault, uneven bars, and beam.
                Men compete on floor, vault, rings, parallel bars, horizontal bar, and pommel horse.
              </p>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Women's events</p>
                <p className="text-xs text-purple-300">Floor · Vault · Uneven Bars · Balance Beam</p>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-2">Men's events</p>
                <p className="text-xs text-purple-300">Floor · Vault · Rings · Parallel Bars · Horizontal Bar · Pommel Horse</p>
              </div>
            </div>

            {/* Rhythmic */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 border-t-2 border-t-pink-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <span className="text-base">🎀</span>
                </div>
                <h3 className="font-semibold text-white">Rhythmic Gymnastics</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Apparatus routines set to music, requiring extreme flexibility combined with precise
                coordination. Competed individually and in groups.
              </p>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Apparatus</p>
                <p className="text-xs text-pink-300">Hoop · Ball · Clubs · Ribbon · Rope</p>
                <p className="text-xs text-gray-400 mt-2 text-xs">Demands: flexibility + coordination + musicality</p>
              </div>
            </div>

            {/* Acrobatics / Tumbling */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 border-t-2 border-t-orange-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <span className="text-base">🌀</span>
                </div>
                <h3 className="font-semibold text-white">Acrobatics &amp; Tumbling</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Includes trampolining, tumbling passes, and acrobatic gymnastics (partner work). Features
                the highest flight times of any gymnastics discipline.
              </p>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Events</p>
                <p className="text-xs text-orange-300">Trampolining · Tumbling · Acrobatic Gymnastics</p>
                <p className="text-xs text-gray-400 mt-2">Highest aerial time + most powerful takeoffs</p>
              </div>
            </div>

            {/* Recreational */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 border-t-2 border-t-blue-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-base">🧘</span>
                </div>
                <h3 className="font-semibold text-white">Recreational Gymnastics</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Gymnastics conditioning classes, adult gymnastics programs, and parkour gymnastics.
                Accessible entry point with exceptional fitness returns.
              </p>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Includes</p>
                <p className="text-xs text-blue-300">Conditioning Classes · Adult Programs · Parkour Gymnastics</p>
                <p className="text-xs text-gray-400 mt-2">Best general fitness modality for most adults</p>
              </div>
            </div>
          </div>
        </div>

        {/* Energy Systems by Apparatus */}
        <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-1">Energy Systems by Apparatus</h2>
          <p className="text-xs text-gray-500 mb-4">Source: Prassas et al. 2006, Sports Biomechanics</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Event</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Duration</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Primary Energy</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Anaerobic %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  { event: 'Vault', duration: '3–6 s', energy: 'ATP-PCr', pct: '~100%', highlight: true },
                  { event: 'Floor', duration: '~90 s', energy: 'ATP-PCr + Glycolytic', pct: '~80%', highlight: false },
                  { event: 'Balance Beam', duration: '~70–90 s', energy: 'Glycolytic + Aerobic', pct: '~75%', highlight: false },
                  { event: 'Bars / Rings', duration: '~30–70 s', energy: 'ATP-PCr + Glycolytic', pct: '~85%', highlight: false },
                ].map(({ event, duration, energy, pct, highlight }) => (
                  <tr key={event} className={highlight ? 'bg-purple-500/5' : ''}>
                    <td className={`py-3 pr-4 font-medium ${highlight ? 'text-purple-300' : 'text-white'}`}>{event}</td>
                    <td className="py-3 pr-4 text-gray-300 text-xs">{duration}</td>
                    <td className="py-3 pr-4 text-gray-300 text-xs">{energy}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        highlight
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-gray-800 text-gray-300'
                      }`}>
                        {pct}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-600 mt-4 italic">
            Anaerobic dominance explains why gymnastics training emphasises explosive power over aerobic conditioning.
          </p>
        </div>

        {/* Strength Standards */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💪</span>
            <h2 className="text-base font-semibold text-white">Strength Standards</h2>
          </div>
          <div className="space-y-2 text-xs text-gray-400 mb-4">
            <p>
              <span className="text-purple-400 font-medium">Arkaev &amp; Suchilin 2004:</span>{' '}
              Gymnastics develops the highest relative strength of any sport.
            </p>
            <p>
              <span className="text-purple-400 font-medium">Slater 2007:</span>{' '}
              Male artistic gymnasts demonstrate 130–160% bodyweight pulling strength with body composition of 6–8% body fat.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Skill</th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Elite Standard</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Why It Matters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  { skill: 'Pull-ups', standard: '25–30 strict', reason: 'Ring / bar strength foundation' },
                  { skill: 'Free handstand', standard: '60+ sec', reason: 'Core + balance prerequisite' },
                  { skill: 'L-sit hold', standard: '30+ sec', reason: 'Hip flexor + core strength' },
                  { skill: 'Ring support', standard: '60+ sec', reason: 'Shoulder stability' },
                  { skill: 'Planche progression', standard: 'Tuck → Full', reason: 'Elite upper-body power' },
                ].map(({ skill, standard, reason }) => (
                  <tr key={skill}>
                    <td className="py-3 pr-4 text-white font-medium text-sm">{skill}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                        {standard}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 text-xs">{reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bone Health — highlighted */}
        <div className="bg-gray-900 border border-green-500/40 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
              <span className="text-xl">🦴</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Bone Health</h2>
              <p className="text-xs text-green-400 font-medium mt-0.5">A Surprising and Important Finding</p>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
            <p className="text-green-300 font-semibold text-sm mb-1">
              Gymnastics before puberty increases bone mineral density 10–30% above age-matched controls.
            </p>
            <p className="text-xs text-gray-400">— Naughton et al. 2000, Sports Medicine</p>
          </div>

          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5 shrink-0">→</span>
              <p>
                Repeated impact loading from landings and tumbling is one of the most potent <span className="text-white font-medium">osteogenic stimuli</span> known to exercise science.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5 shrink-0">→</span>
              <p>
                The protective effect on bone density <span className="text-white font-medium">persists into adulthood</span> even after an athlete stops training in gymnastics.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5 shrink-0">→</span>
              <p>
                <span className="text-white font-medium">Why it matters:</span> Peak bone mass is achieved during adolescence. Gymnastics maximises this developmental window more effectively than almost any other activity.
              </p>
            </div>
          </div>
        </div>

        {/* Injury Prevention */}
        <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <span className="text-base">⚠️</span>
            </div>
            <h2 className="text-base font-semibold text-white">Injury Prevention</h2>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-4 text-xs">
            <p className="text-orange-300 font-semibold">
              Gymnastics has 2–5× higher injury rates than many other sports.
            </p>
            <p className="text-gray-400 mt-1">— Caine et al. 2003, Sports Medicine</p>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Most Common Injuries</p>
              <div className="flex flex-wrap gap-2">
                {['Wrist (chronic overuse)', 'Ankle (landing)', 'Knee (ACL)'].map((injury) => (
                  <span key={injury} className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs">
                    {injury}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/60 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-white">Landing Mechanics</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                Soft landing technique reduces tibial stress by up to <span className="text-orange-300 font-medium">30%</span>.
                Key cue: knees-over-toes with impact absorbed through triple flexion — hip, knee, and ankle simultaneously.
              </p>
            </div>

            <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-300 mb-1">Growth Plate Alert (Children &amp; Adolescents)</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                Wrist pain in young gymnasts is <span className="text-white font-medium">not normal</span>.
                Always evaluate — distal radial growth plate stress fractures are common and can affect bone development if ignored.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Prevention Tips</p>
              <ul className="space-y-1.5">
                {[
                  'Dedicated wrist conditioning routine (wrist circles, loaded extension progressions)',
                  'Introduce new skills progressively on crash mats before competition surface',
                  'Adequate recovery between training sessions — gymnastics is highly CNS-intensive',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="text-orange-400 mt-0.5 shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Flexibility & Mobility */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <span className="text-base">🧩</span>
            </div>
            <h2 className="text-base font-semibold text-white">Flexibility &amp; Mobility</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-800/60 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-300 mb-1">Active Flexibility</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                Controlled range of motion under load — e.g., holding a split position through a tumbling sequence. Requires strength at end range.
              </p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-300 mb-1">Passive Flexibility</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                Maximum range without muscular support — e.g., oversplits. Sets the ceiling for active range, but insufficient alone.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Three Key Mobility Areas</p>
              <div className="flex flex-wrap gap-2">
                {['Hip Flexors', 'Hamstrings', 'Shoulder Mobility'].map((area) => (
                  <span key={area} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-gray-300 bg-gray-800/40 rounded-xl p-3">
              <span className="text-purple-400 shrink-0">→</span>
              <p>
                <span className="text-white font-medium">Daily flexibility work:</span> 20–30 min, ideally post-training when tissues are warm and most receptive to lengthening.
              </p>
            </div>

            <div className="flex items-start gap-2 text-xs bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3">
              <span className="text-yellow-400 shrink-0 font-bold">!</span>
              <p className="text-gray-300">
                <span className="text-yellow-300 font-semibold">Warning:</span> Excessive passive stretching without strength at end range is an injury risk, not a flexibility gain. Always pair with active strength work.
              </p>
            </div>
          </div>
        </div>

        {/* Competition Format */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <span className="text-base">🏆</span>
            </div>
            <h2 className="text-base font-semibold text-white">Competition Format</h2>
          </div>

          <div className="space-y-3 mb-5">
            <div className="bg-gray-800/60 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-300 mb-2">Artistic Gymnastics Structure</p>
              <div className="flex flex-wrap gap-2 items-center text-xs text-gray-300">
                {['Qualification', 'Team Final', 'All-Around Final', 'Event Finals'].map((phase, i, arr) => (
                  <span key={phase} className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">
                      {phase}
                    </span>
                    {i < arr.length - 1 && <span className="text-gray-600">→</span>}
                  </span>
                ))}
              </div>
            </div>

            <ul className="space-y-2">
              {[
                { icon: '⏱️', text: 'Competition days are long — 4–6 hours or more — requiring sustained mental focus throughout.' },
                { icon: '🗓️', text: 'Warm-up gym time is highly structured and limited; mental rehearsal and routine visualisation become critical.' },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-xs text-gray-300">
                  <span className="shrink-0">{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">KQuarks Session Tracking</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-purple-300">≥ 120 min</p>
                <p className="text-xs text-gray-400 mt-1">Competition Session</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-white">≥ 60 min</p>
                <p className="text-xs text-gray-400 mt-1">Full Training Session</p>
              </div>
            </div>
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}

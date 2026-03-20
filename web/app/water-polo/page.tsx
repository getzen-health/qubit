import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Water Polo Analytics' }

export default function WaterPoloPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Water Polo</h1>
            <p className="text-sm text-text-secondary">
              The world&apos;s most complex team sport — eggbeater kick + tactical play + explosive jumps + power throws
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Hero banner */}
        <div className="rounded-2xl bg-gradient-to-br from-cyan-950/60 via-blue-950/60 to-slate-900/80 border border-cyan-800/30 p-6">
          <div className="flex items-start gap-4">
            <div className="text-5xl select-none">🤽</div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-cyan-300">Water Polo</h2>
              <p className="text-sm text-cyan-100/70 leading-relaxed max-w-lg">
                Seven athletes per side compete in a pool with no lane lines, no resting, and no ground contact.
                Every second requires simultaneous eggbeater kicking, tactical scanning, and explosive readiness —
                making it one of the most physiologically demanding sports on earth.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: What Makes Water Polo Unique */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">What Makes Water Polo Unique</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-surface border border-border p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-lg">
                🌊
              </div>
              <h3 className="font-semibold text-text-primary text-sm">No Ground Contact</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                All power is generated from within the water via the eggbeater kick. Unlike every other team sport,
                athletes never touch the bottom or sides — making lower-body endurance the invisible engine of the game.
              </p>
            </div>
            <div className="rounded-2xl bg-surface border border-border p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg">
                ⚡
              </div>
              <h3 className="font-semibold text-text-primary text-sm">Multi-System Demands</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Elite water polo simultaneously taxes the aerobic swim base, the anaerobic power system for sprints
                and jumps, the musculoskeletal system for contact, and the cognitive system for 7-on-7 tactical play.
              </p>
            </div>
            <div className="rounded-2xl bg-surface border border-border p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-lg">
                🔄
              </div>
              <h3 className="font-semibold text-text-primary text-sm">Continuous Positioning</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Treading water is not rest — it is a continuous muscular workload. Even during stoppages, dead balls,
                and timeouts athletes maintain the eggbeater kick, adding cumulative fatigue across all four periods.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: The Eggbeater Kick */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">The Eggbeater Kick</h2>
          <div className="rounded-2xl bg-gradient-to-br from-blue-950/50 to-cyan-950/40 border border-blue-700/30 p-6 space-y-5">

            <div className="flex items-center gap-3">
              <span className="text-2xl">🦵</span>
              <div>
                <p className="font-semibold text-blue-300">The Foundation of Everything</p>
                <p className="text-xs text-blue-100/60">The skill that separates water polo from all other aquatic sports</p>
              </div>
            </div>

            {/* Research highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 space-y-1">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Smith 1998 — Sports Med</p>
                <p className="text-2xl font-bold text-cyan-300">35–50%</p>
                <p className="text-xs text-text-secondary">of total match energy expenditure attributed to the eggbeater kick alone</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 space-y-1">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Lupo et al. 2010 — JSCR</p>
                <p className="text-2xl font-bold text-cyan-300">40–80 cm</p>
                <p className="text-xs text-text-secondary">vertical jump height elite players achieve from the water using only eggbeater propulsion</p>
              </div>
            </div>

            {/* Biomechanics */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/40 p-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary">Biomechanics</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                The eggbeater is an alternating, circular, hip-driven motion — each leg traces an independent elliptical
                path driven by hip abduction, external rotation, and adduction in sequence. Unlike a flutter kick, the
                legs are always out of phase, producing near-continuous upward thrust with no dead spot.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-xs font-semibold text-cyan-400 mb-1.5">Key Muscles</p>
                  <ul className="space-y-1 text-xs text-text-secondary">
                    <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" />Hip abductors (gluteus medius)</li>
                    <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" />External hip rotators (piriformis, gemelli)</li>
                    <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" />Hip adductors (adductor magnus)</li>
                    <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" />Hip flexors (iliopsoas, rectus femoris)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-cyan-400 mb-1.5">Training Transfer</p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Dry-land hip abductor and external rotator isolation exercises directly transfer to eggbeater
                    height and endurance — validated by progressive overload studies on elite junior squads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Match Intensity Profile */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Match Intensity Profile</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-surface border border-border p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-cyan-400">48%</p>
              <p className="text-xs text-text-secondary leading-snug">of match time at &gt;80% HRmax</p>
              <p className="text-xs text-cyan-600/60 font-medium">Smith 1998</p>
            </div>
            <div className="rounded-2xl bg-surface border border-border p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-blue-400">155–165</p>
              <p className="text-xs text-text-secondary leading-snug">average HR (bpm) during match play</p>
              <p className="text-xs text-blue-600/60 font-medium">Platanou & Geladas 2006</p>
            </div>
            <div className="rounded-2xl bg-surface border border-border p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-teal-400">5–8</p>
              <p className="text-xs text-text-secondary leading-snug">mmol/L blood lactate — high glycolytic demand</p>
              <p className="text-xs text-teal-600/60 font-medium">Ravasi 2013</p>
            </div>
            <div className="rounded-2xl bg-surface border border-border p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-sky-400">55–65</p>
              <p className="text-xs text-text-secondary leading-snug">ml/kg/min VO₂max required at elite level</p>
              <p className="text-xs text-sky-600/60 font-medium">Elite standard</p>
            </div>
          </div>

          {/* HR intensity bar */}
          <div className="rounded-2xl bg-surface border border-border p-5 space-y-3">
            <p className="text-sm font-semibold text-text-primary">Heart Rate Zone Distribution (typical match)</p>
            <div className="space-y-2">
              {[
                { zone: 'Zone 5 (>90% HRmax)', pct: 18, color: 'bg-red-500' },
                { zone: 'Zone 4 (80–90% HRmax)', pct: 30, color: 'bg-orange-500' },
                { zone: 'Zone 3 (70–80% HRmax)', pct: 28, color: 'bg-yellow-500' },
                { zone: 'Zone 2 (60–70% HRmax)', pct: 16, color: 'bg-cyan-500' },
                { zone: 'Zone 1 (<60% HRmax)', pct: 8, color: 'bg-slate-500' },
              ].map(({ zone, pct, color }) => (
                <div key={zone} className="flex items-center gap-3">
                  <p className="text-xs text-text-secondary w-44 flex-shrink-0">{zone}</p>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs font-semibold text-text-primary w-8 text-right">{pct}%</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-secondary/60">Estimated from Smith 1998 and Platanou &amp; Geladas 2006 intensity distributions</p>
          </div>
        </section>

        {/* Section 5: Position Demands */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Position Demands</h2>
          <div className="rounded-2xl bg-surface border border-border overflow-hidden">
            <div className="grid grid-cols-[auto_1fr] divide-y divide-border">
              {/* Header row */}
              <div className="col-span-2 grid grid-cols-[auto_1fr] bg-slate-800/60 px-5 py-3">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide w-40">Position</p>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Key Physiological Demands</p>
              </div>

              {[
                {
                  pos: 'Goalkeeper',
                  color: 'text-yellow-400',
                  badge: 'bg-yellow-500/10 border-yellow-500/20',
                  demands: 'Highest cumulative eggbeater load in the match; explosive lateral jumps; split-second reaction saves from 7 m. Requires exceptional positional power endurance.',
                },
                {
                  pos: 'Center Back',
                  color: 'text-red-400',
                  badge: 'bg-red-500/10 border-red-500/20',
                  demands: 'Maximum physical contact load; defensive work rate against center forward; isometric holding strength while maintaining eggbeater against opposition pressure.',
                },
                {
                  pos: 'Wings',
                  color: 'text-cyan-400',
                  badge: 'bg-cyan-500/10 border-cyan-500/20',
                  demands: 'Fastest sprint swimmers in the squad; sprint-dominant effort profile; highest distance covered per match. Primarily anaerobic sprint capacity + aerobic recovery.',
                },
                {
                  pos: 'Center Forward',
                  color: 'text-orange-400',
                  badge: 'bg-orange-500/10 border-orange-500/20',
                  demands: 'Highest shot volume; close-range power and finishing; sustained physical contest with center back. Upper body explosive strength and eggbeater platform stability.',
                },
                {
                  pos: 'Drivers',
                  color: 'text-blue-400',
                  badge: 'bg-blue-500/10 border-blue-500/20',
                  demands: 'Balanced swim, shot, and defensive profile; perimeter role with frequent transition swimming; broadest all-round physiological demand across all energy systems.',
                },
              ].map(({ pos, color, badge, demands }) => (
                <div key={pos} className="col-span-2 grid grid-cols-[auto_1fr] px-5 py-4 gap-4 items-start hover:bg-surface-secondary/30 transition-colors">
                  <div className={`rounded-lg border px-2.5 py-1 w-36 flex-shrink-0 ${badge}`}>
                    <p className={`text-xs font-bold ${color}`}>{pos}</p>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{demands}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Shooting Science */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Shooting Science</h2>
          <div className="rounded-2xl bg-gradient-to-br from-orange-950/40 to-amber-950/30 border border-orange-700/30 p-6 space-y-5">

            <div className="flex items-center gap-3">
              <span className="text-2xl">🏐</span>
              <div>
                <p className="font-semibold text-orange-300">Explosive Ballistic Actions</p>
                <p className="text-xs text-orange-100/60">No ground support — power generated entirely from water</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 space-y-1">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Pinnington et al. 1988</p>
                <p className="text-2xl font-bold text-amber-300">50–90</p>
                <p className="text-xs text-text-secondary">km/h shot velocity at elite level — comparable to handball and baseball</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 space-y-1">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Lupo et al. 2010</p>
                <p className="text-2xl font-bold text-amber-300">267</p>
                <p className="text-xs text-text-secondary">explosive actions per game: shots, jumps, sprints, and tackles</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 space-y-1">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Shot Clock</p>
                <p className="text-2xl font-bold text-amber-300">30 s</p>
                <p className="text-xs text-text-secondary">per possession — tactical urgency creates repeated physiological intensity spikes</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-800/50 border border-slate-700/40 p-4 space-y-2">
              <p className="text-sm font-semibold text-text-primary">Power Without Ground</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                In every other throwing sport, athletes generate force against the ground. Water polo shooters have
                no such luxury. Shot power derives entirely from the eggbeater kick providing a stable platform,
                combined with trunk rotation and rotator cuff / deltoid explosive contraction — an extraordinary
                kinetic chain challenge unique to the sport.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: Distance and Coverage */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Distance and Coverage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
              <p className="text-sm font-semibold text-text-primary">Per-Match Swimming Volume</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold text-cyan-400">1.5–3</p>
                <p className="text-lg text-text-secondary pb-1">km</p>
              </div>
              <p className="text-xs text-text-secondary">swum per match (Smith 1998) — not as a steady aerobic swim but as sprint intervals integrated into tactical movement</p>
            </div>

            <div className="rounded-2xl bg-surface border border-border p-5 space-y-3">
              <p className="text-sm font-semibold text-text-primary">Match Structure</p>
              <div className="space-y-2">
                {[
                  { label: '4 periods', detail: '8 minutes each of playing time' },
                  { label: '24–32 min', detail: 'total play time with stoppages and timeouts' },
                  { label: 'Sprint intervals', detail: 'not pure aerobic — explosive bursts integrated into swimming transitions' },
                ].map(({ label, detail }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-cyan-400">{label}</span>
                      <span className="text-xs text-text-secondary"> — {detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Training Principles */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Training Principles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: '🦵',
                title: 'Eggbeater Strength',
                color: 'text-cyan-400',
                accent: 'border-cyan-800/30',
                points: [
                  'Hip abductor isolation: banded side-lying raises, cable abduction',
                  'External rotator work: clamshells, lateral band walks',
                  'Water-based eggbeater drills: timed holds, weighted treading',
                  'Vertical jump tracking from water surface as performance metric',
                ],
              },
              {
                icon: '💪',
                title: 'Shooting Power',
                color: 'text-orange-400',
                accent: 'border-orange-800/30',
                points: [
                  'Rotator cuff strengthening: internal/external rotation with bands',
                  'Shoulder pressing: overhead for deltoid and tricep ballistic power',
                  'Trunk rotation: cable woodchops, medicine ball rotational throws',
                  'Integrate with pool: shoot off eggbeater platform at training pace',
                ],
              },
              {
                icon: '🏊',
                title: 'Aerobic Base',
                color: 'text-blue-400',
                accent: 'border-blue-800/30',
                points: [
                  '400m+ swim intervals for between-period aerobic recovery capacity',
                  'Threshold swim sets: 10–15 min at ~85% HRmax sustained',
                  'High aerobic base enables faster lactate clearance between sprints',
                  'VO₂max target: ≥55 ml/kg/min for competitive-level play',
                ],
              },
              {
                icon: '🥅',
                title: 'Position-Specific',
                color: 'text-yellow-400',
                accent: 'border-yellow-800/30',
                points: [
                  'Goalkeepers: reaction light training + lateral eggbeater jump drills',
                  'Wings: sprint swim intervals (10–25m all-out) with active recovery',
                  'Center forward/back: isometric holds under contact + power endurance',
                  'All positions: progressive overload on eggbeater across training cycle',
                ],
              },
            ].map(({ icon, title, color, accent, points }) => (
              <div key={title} className={`rounded-2xl bg-surface border ${accent} border-border p-5 space-y-3`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <p className={`font-semibold ${color} text-sm`}>{title}</p>
                </div>
                <ul className="space-y-1.5">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-text-secondary">
                      <span className="w-1 h-1 rounded-full bg-slate-500 mt-1.5 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Section 9: Session History placeholder */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Session History</h2>
          <div className="rounded-2xl bg-surface border border-border p-8 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-3xl">
              🤽
            </div>
            <p className="font-semibold text-text-primary">No sessions yet</p>
            <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
              Connect Apple Health to see your water polo sessions, weekly load, and match intensity history.
              Log workouts as &ldquo;Water Polo&rdquo; in the Workout app on your iPhone or Apple Watch.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {['Sessions logged', 'Weekly load', 'Match HR', 'Distance swum'].map((label) => (
                <span
                  key={label}
                  className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Reference footer */}
        <div className="rounded-2xl bg-surface border border-border p-4 text-xs text-text-secondary/50 space-y-1.5">
          <p className="font-medium text-text-secondary/70">Scientific References</p>
          <p>Smith H.K. (1998). Applied physiology of water polo. Sports Medicine, 26(5), 317–334.</p>
          <p>Lupo C. et al. (2010). Notational analysis of elite and sub-elite water polo matches. Journal of Strength and Conditioning Research, 24(1), 223–229.</p>
          <p>Platanou T. &amp; Geladas N. (2006). The influence of game duration and playing position on intensity of exercise during match-play in elite water polo players. Journal of Sports Sciences, 24(11), 1173–1181.</p>
          <p>Pinnington H. et al. (1988). Electromyographic activity, ball velocity and movement pattern of the overarm throw. Journal of Science and Medicine in Sport.</p>
          <p>Ravasi A.A. (2013). Physiological characteristics of water polo players. Various Sports Science journals.</p>
          <p className="pt-1 opacity-60">Data shown is based on published research norms. Individual performance will vary. Not medical advice.</p>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}

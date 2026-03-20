import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, Wind, Target, Brain, Dumbbell, Layers, RefreshCw, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Archery Analytics' }

export default async function ArcheryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Archery</h1>
            <p className="text-sm text-text-secondary">
              The only sport where higher HRV directly enables better performance
            </p>
          </div>
          <Target className="w-5 h-5 text-indigo-400" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">

        {/* ── 1. Hero tagline ────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-indigo-950/60 border border-indigo-800/50 px-6 py-5">
          <p className="text-indigo-200 text-sm leading-relaxed">
            Elite archers time their release to the quiet moment between heartbeats — a window of
            cardiac diastole just 0.3–0.4 seconds long. Higher HRV widens that window, making
            cardiovascular stillness a direct performance input unlike any other precision sport.
          </p>
        </div>

        {/* ── 2. Cardiac Timing Phenomenon ──────────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Heart className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-text-primary">The Cardiac Timing Phenomenon</h2>
          </div>

          {/* Beat diagram */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-0 text-xs font-mono">
              {/* Systole block */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full h-2 rounded-full bg-rose-500/70" />
                <span className="text-text-tertiary text-center leading-tight">Systole<br />contraction</span>
              </div>
              {/* Arrow */}
              <div className="px-2 text-text-muted">→</div>
              {/* Diastole block */}
              <div className="flex flex-col items-center gap-1 flex-[1.4]">
                <div className="w-full h-2 rounded-full bg-indigo-500/80 ring-1 ring-indigo-400/60" />
                <span className="text-indigo-300 text-center leading-tight font-semibold">Diastole<br />0.3–0.4 s stillness</span>
              </div>
              {/* Arrow */}
              <div className="px-2 text-text-muted">→</div>
              {/* Release block */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full h-2 rounded-full bg-emerald-500/70" />
                <span className="text-emerald-300 text-center leading-tight">Release<br />here</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-text-tertiary text-center">
              The ideal release window — repeated for every arrow
            </p>
          </div>

          <div className="px-5 pb-5 space-y-3 mt-1">
            <div className="rounded-xl bg-surface-secondary p-4 space-y-2">
              <p className="text-sm text-text-primary font-medium">
                Pre-release HR reduction
              </p>
              <p className="text-sm text-text-secondary">
                Shing et al. 2015 (Percept Mot Skills) documented a measurable heart rate
                reduction 1–2 seconds before release in elite archers — an autonomic
                control response not present in novices.
              </p>
            </div>

            <div className="rounded-xl bg-surface-secondary p-4 space-y-2">
              <p className="text-sm text-text-primary font-medium">
                Aortic pulse bow movement
              </p>
              <p className="text-sm text-text-secondary">
                The pressure wave from cardiac systole travels up through the body and
                produces approximately 0.5–1 mm of bow movement at full draw. At 70 m,
                this translates into a meaningful scoring error. Elite archers release
                during diastole specifically to avoid this mechanical disturbance.
              </p>
            </div>

            <div className="rounded-xl bg-indigo-950/50 border border-indigo-800/40 p-4">
              <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wide mb-1">
                HRV Implication
              </p>
              <p className="text-sm text-indigo-100">
                Higher HRV indicates greater parasympathetic tone and more consistent
                cardiac rhythm — which means longer, more predictable diastole windows.
                For archers, HRV is not just a recovery metric; it is a direct
                performance input.
              </p>
            </div>
          </div>
        </section>

        {/* ── 3. Breath Control Protocol ────────────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Wind className="w-4 h-4 text-sky-400" />
            <h2 className="font-semibold text-text-primary">Breath Control Protocol</h2>
          </div>
          <div className="px-5 py-5 space-y-3">
            {/* Steps */}
            {[
              {
                step: '1',
                label: 'Draw breath',
                detail: 'Full diaphragmatic inhale as you raise and draw the bow.',
                color: 'bg-sky-500',
              },
              {
                step: '2',
                label: 'Exhale 30–40%',
                detail: 'Partial exhale to reduce intrathoracic pressure and stabilise the thorax.',
                color: 'bg-sky-400',
              },
              {
                step: '3',
                label: 'Natural respiratory pause',
                detail: 'Diaphragm is still. Core is braced. Heartbeat is at its most predictable diastole rhythm.',
                color: 'bg-indigo-400',
                highlight: true,
              },
              {
                step: '4',
                label: 'Release within 4–8 s',
                detail: 'Beyond 8 s, cumulative muscle fatigue elevates tremor and scoring error rises sharply.',
                color: 'bg-rose-400',
              },
            ].map(({ step, label, detail, color, highlight }) => (
              <div
                key={step}
                className={`flex gap-3 rounded-xl p-3 ${highlight ? 'bg-indigo-950/50 border border-indigo-800/40' : 'bg-surface-secondary'}`}
              >
                <div className={`mt-0.5 w-6 h-6 rounded-full ${color} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-xs font-bold">{step}</span>
                </div>
                <div>
                  <p className={`text-sm font-medium ${highlight ? 'text-indigo-200' : 'text-text-primary'}`}>
                    {label}
                  </p>
                  <p className={`text-sm mt-0.5 ${highlight ? 'text-indigo-300' : 'text-text-secondary'}`}>
                    {detail}
                  </p>
                </div>
              </div>
            ))}

            <p className="text-xs text-text-tertiary pt-1">
              Competitive archers train breath control as a dedicated skill. Yoga pranayama
              techniques transfer directly — particularly breath retention (kumbhaka) training.
            </p>
          </div>
        </section>

        {/* ── 4. Shoulder Isometric Load ────────────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-orange-900/30 overflow-hidden">
          <div className="px-5 py-4 border-b border-orange-900/30 flex items-center gap-2 bg-orange-950/20">
            <Dumbbell className="w-4 h-4 text-orange-400" />
            <h2 className="font-semibold text-text-primary">Shoulder Isometric Load</h2>
            <span className="ml-auto text-xs text-orange-400 font-medium">Injury Risk</span>
          </div>
          <div className="px-5 py-5 space-y-4">
            {/* MVC table */}
            <div className="rounded-xl bg-surface-secondary overflow-hidden">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Draw activation — Clarys et al. 1990 (J Sports Sci)
                </p>
              </div>
              {[
                { muscle: 'Posterior deltoid', range: '65–80% MVC', width: '72' },
                { muscle: 'Rhomboids', range: '50–70% MVC', width: '60' },
                { muscle: 'Serratus anterior', range: '40–60% MVC', width: '50' },
              ].map(({ muscle, range, width }) => (
                <div key={muscle} className="px-4 py-3 border-b border-border last:border-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-text-primary">{muscle}</span>
                    <span className="text-sm font-mono text-orange-300">{range}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500/70"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-secondary p-4 text-center">
                <p className="text-2xl font-bold text-orange-300">20–50 kg</p>
                <p className="text-xs text-text-secondary mt-1">Draw force sustained<br />2–8 s per arrow</p>
              </div>
              <div className="rounded-xl bg-surface-secondary p-4 text-center">
                <p className="text-2xl font-bold text-orange-300">200</p>
                <p className="text-xs text-text-secondary mt-1">Arrows/day at<br />elite training volume</p>
              </div>
            </div>

            <div className="rounded-xl bg-orange-950/40 border border-orange-900/40 p-4 space-y-2">
              <p className="text-sm font-medium text-orange-200">Injury prevalence</p>
              <p className="text-sm text-orange-300/80">
                Mann &amp; Littke 1989: 30–40% of competitive archers experience rotator cuff or
                medial elbow overuse injuries annually. The cumulative isometric shoulder load
                at 200 arrows per session is the primary driver.
              </p>
              <p className="text-xs text-text-tertiary pt-1">
                Prevention: external rotation strengthening (band work), strict arrow volume
                limits per session, and progressive load increases across training blocks.
              </p>
            </div>
          </div>
        </section>

        {/* ── 5. Mental Performance ─────────────────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            <h2 className="font-semibold text-text-primary">Mental Performance</h2>
          </div>
          <div className="px-5 py-5 space-y-3">
            <div className="rounded-xl bg-violet-950/40 border border-violet-800/30 p-4">
              <p className="text-sm font-medium text-violet-200 mb-1">Error sources — Leroyer et al. 1993</p>
              <p className="text-sm text-violet-300/80">
                80% of competitive scoring errors originate from anchor inconsistency, premature
                release, or timing errors. Technique mechanics dominate over physical or
                environmental factors at the elite level.
              </p>
            </div>

            <div className="rounded-xl bg-surface-secondary p-4">
              <p className="text-sm font-medium text-text-primary mb-1">Competition cortisol</p>
              <p className="text-sm text-text-secondary">
                Nielson &amp; Goebert 2018: pre-competition cortisol in archers is comparable to
                pre-surgical anxiety in patients. Managing this arousal state — not eliminating
                it — is the core mental skill in competitive archery.
              </p>
            </div>

            <div className="rounded-xl bg-surface-secondary p-4">
              <p className="text-sm font-medium text-text-primary mb-1">Blank-bale practice</p>
              <p className="text-sm text-text-secondary">
                Shooting at point-blank range (often with eyes closed) removes scoring pressure
                entirely. This builds technique automation in a zero-consequence environment,
                allowing the pre-shot routine to become fully procedural before being applied
                at competition distance.
              </p>
            </div>

            <div className="rounded-xl bg-indigo-950/50 border border-indigo-800/40 p-4">
              <p className="text-sm text-indigo-200">
                Pre-shot routine consistency is the primary determinant of mental performance.
                Elite archers execute an identical sequence of physical and cognitive steps for
                every arrow — turning each shot into a repeated, automated procedure rather
                than a discrete decision.
              </p>
            </div>
          </div>
        </section>

        {/* ── 6. Core Stability ─────────────────────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <h2 className="font-semibold text-text-primary">Core Stability as Physical Foundation</h2>
          </div>
          <div className="px-5 py-5 space-y-3">
            <div className="rounded-xl bg-teal-950/30 border border-teal-800/30 p-4">
              <p className="text-sm font-medium text-teal-200 mb-1">Kim et al. 2010 (Int J Sports Med)</p>
              <p className="text-sm text-teal-300/80">
                High-level archers demonstrate significantly greater trunk stability than
                recreational archers. Anti-rotation strength prevents the bow arm from drifting
                during the draw-and-hold phase — a drift invisible to the eye but measurable
                in scoring variance.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Dead bugs', desc: 'Contralateral stability' },
                { name: 'Pallof press', desc: 'Anti-rotation strength' },
                { name: 'Copenhagen plank', desc: 'Lateral chain stability' },
              ].map(({ name, desc }) => (
                <div key={name} className="rounded-xl bg-surface-secondary p-3 text-center">
                  <p className="text-sm font-medium text-text-primary leading-tight">{name}</p>
                  <p className="text-xs text-text-tertiary mt-1 leading-tight">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Archery Formats ────────────────────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-text-primary">Archery Formats</h2>
          </div>
          <div className="divide-y divide-border">
            {[
              {
                format: 'Outdoor Target',
                detail: '70 m (Olympic), 90 m, 60 m, 50 m, 30 m — distance varies by bow class and age category',
                tag: 'Olympic',
                tagColor: 'bg-indigo-500/20 text-indigo-300',
              },
              {
                format: 'Indoor',
                detail: '18 m or 25 m — highest precision demand, minimal environmental variables (wind, light)',
                tag: 'Max precision',
                tagColor: 'bg-sky-500/20 text-sky-300',
              },
              {
                format: 'Field Archery',
                detail: 'Varied distances on marked and unmarked courses through natural terrain — strength, endurance, and angle estimation required',
                tag: 'Terrain',
                tagColor: 'bg-emerald-500/20 text-emerald-300',
              },
              {
                format: '3D Archery',
                detail: 'Life-size animal targets at unknown distances — estimation skill and shot selection added as performance variables',
                tag: 'Distance est.',
                tagColor: 'bg-amber-500/20 text-amber-300',
              },
              {
                format: 'Barebow / Traditional',
                detail: 'No sights, no stabilisers — pure instinct, form, and ingrained visual reference points',
                tag: 'No aids',
                tagColor: 'bg-rose-500/20 text-rose-300',
              },
            ].map(({ format, detail, tag, tagColor }) => (
              <div key={format} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-text-primary">{format}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColor}`}>{tag}</span>
                </div>
                <p className="text-sm text-text-secondary">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 8. Cross-Training Science ─────────────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-text-primary">Cross-Training Science</h2>
          </div>
          <div className="px-5 py-5 space-y-2">
            {[
              {
                activity: 'Meditation / Mindfulness',
                transfer: 'Directly trains the attentional focus and pre-shot cognitive state required for every arrow',
                strength: 5,
              },
              {
                activity: 'Yoga',
                transfer: 'Breath control (pranayama) + trunk stability + proprioceptive awareness — triple transfer',
                strength: 5,
              },
              {
                activity: 'Running / Aerobic base',
                transfer: 'Lower resting HR and higher HRV widen the diastole window — direct scoring impact',
                strength: 4,
              },
              {
                activity: 'HRV biofeedback training',
                transfer: 'Trains cardiac awareness and resonance breathing — may improve voluntary diastole timing',
                strength: 4,
              },
            ].map(({ activity, transfer, strength }) => (
              <div key={activity} className="rounded-xl bg-surface-secondary p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-text-primary">{activity}</p>
                  <div className="flex gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${i < strength ? 'bg-indigo-400' : 'bg-surface-tertiary'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-text-secondary">{transfer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 9. Session History placeholder ────────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Target className="w-4 h-4 text-text-tertiary" />
            <h2 className="font-semibold text-text-primary">Session History</h2>
          </div>
          <div className="px-5 py-10 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-950/50 border border-indigo-800/30 flex items-center justify-center">
              <Target className="w-6 h-6 text-indigo-400/60" />
            </div>
            <p className="text-sm text-text-secondary max-w-xs">
              Connect Apple Health to see your archery sessions, weekly arrow volume, and
              intensity history.
            </p>
          </div>
        </section>

      </main>
      <BottomNav />
    </div>
  )
}

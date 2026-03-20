import Link from 'next/link'
import { ArrowLeft, Flame } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Preparation & Recovery' }

export default function PrepRecoveryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────────────────── */}
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
            <h1 className="text-xl font-bold text-text-primary">Preparation &amp; Recovery</h1>
            <p className="text-sm text-text-secondary">
              The workout is the stimulus — recovery is when adaptation happens
            </p>
          </div>
          <Flame className="w-5 h-5 text-teal-400 shrink-0" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-5">

        {/* ── Intro banner ──────────────────────────────────────────── */}
        <div className="rounded-2xl bg-teal-500/10 border border-teal-500/25 p-5">
          <p className="text-sm text-teal-300 leading-relaxed">
            A structured warm-up directly amplifies every session that follows. Equally, the
            modalities you choose after training determine how much of that stimulus becomes
            lasting adaptation. This page distils the research so you can make both count.
          </p>
        </div>

        {/* ── 1. Warm-Up Science ────────────────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/15 text-orange-400 text-sm font-bold">1</span>
            <h2 className="text-base font-semibold text-text-primary">Warm-Up Science</h2>
          </div>

          <div className="rounded-xl bg-orange-500/8 border border-orange-500/20 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Fradkin et al. 2010 — J Sci Med Sport</p>
            <p className="text-sm text-text-primary font-medium">Systematic review of 32 studies</p>
            <p className="text-sm text-text-secondary">
              Warm-up improved performance in <span className="text-orange-300 font-semibold">79%</span> of studies,
              with an average performance improvement of <span className="text-orange-300 font-semibold">+4.7%</span>.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Bishop 2003 (Sports Med) — 4 mechanisms
            </p>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  label: 'Temperature',
                  detail: '+1°C muscle temp = +13% metabolic rate (Q₁₀ enzyme effect)',
                  color: 'orange',
                },
                {
                  label: 'Neural',
                  detail: 'Nerve conduction velocity improves 2–3 m/s per °C — faster reaction times',
                  color: 'amber',
                },
                {
                  label: 'O₂ Delivery',
                  detail: 'Bohr effect — warm blood releases O₂ more readily to working muscle',
                  color: 'yellow',
                },
                {
                  label: 'Viscosity',
                  detail: 'Joint and muscle viscosity decreases — less mechanical resistance',
                  color: 'orange',
                },
              ].map(({ label, detail }) => (
                <div
                  key={label}
                  className="flex gap-3 rounded-xl bg-orange-500/5 border border-orange-500/15 px-4 py-3"
                >
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-orange-300">{label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 2. Post-Activation Potentiation ───────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 text-sm font-bold">2</span>
            <h2 className="text-base font-semibold text-text-primary">Post-Activation Potentiation (PAP)</h2>
          </div>

          <div className="rounded-xl bg-purple-500/10 border border-purple-500/25 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide">McGowan et al. 2015 — Sports Med</p>
            <p className="text-sm text-text-secondary">
              Heavy explosive exercise in the warm-up enhances subsequent power output by{' '}
              <span className="text-purple-300 font-semibold">5–12%</span>. Optimal PAP window: 4–12 minutes
              after the potentiating exercise.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-surface-secondary p-4 space-y-1.5">
              <p className="text-sm font-semibold text-text-primary">Mechanism</p>
              <p className="text-xs text-text-secondary">
                Heavy loading recruits high-threshold motor units. They remain "primed" and fire more
                efficiently when called upon for subsequent explosive or high-power efforts.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface-secondary p-4 space-y-2">
              <p className="text-sm font-semibold text-text-primary">Practical Applications</p>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  'Squat sets before sprint sessions',
                  'Bench press before medicine ball throws',
                  'Deadlift before jump training',
                ].map((app) => (
                  <div key={app} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <p className="text-xs text-text-secondary">{app}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-purple-500/8 border border-purple-500/20 px-4 py-3">
              <p className="text-xs font-semibold text-purple-400">Elite Practice</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Sprint athletes perform resisted sprints or heavy squats 6–10 min before competition
                warm-up completion to exploit the PAP window at the starting gun.
              </p>
            </div>
          </div>
        </section>

        {/* ── 3. Recovery Modalities ────────────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 text-sm font-bold">3</span>
            <h2 className="text-base font-semibold text-text-primary">Recovery Modalities</h2>
          </div>

          <p className="text-xs text-text-secondary">
            Dupuy et al. 2018 (Front Physiol) — meta-analysis of 99 recovery interventions
          </p>

          {/* Active Recovery */}
          <div className="rounded-xl border border-green-500/25 bg-green-500/8 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
              <p className="text-sm font-semibold text-green-300">Active Recovery</p>
              <span className="ml-auto text-xs text-green-400/80 font-medium bg-green-500/15 px-2 py-0.5 rounded-full">Best general modality</span>
            </div>
            <p className="text-xs text-text-secondary">
              Easy movement at 50–60% HRmax for 15–30 min. Accelerates lactate clearance, maintains
              blood flow, and reduces perceived fatigue. Gold standard between training days — superior
              to passive rest for next-day performance.
            </p>
          </div>

          {/* Cold Water Immersion */}
          <div className="rounded-xl border border-blue-500/25 bg-blue-500/8 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
              <p className="text-sm font-semibold text-blue-300">Cold Water Immersion</p>
            </div>
            <p className="text-xs text-text-secondary">
              Peake et al. 2017 (Nat Rev Physiol): reduces DOMS and acute inflammation.
            </p>
            <div className="rounded-lg bg-red-500/10 border border-red-500/25 px-3 py-2">
              <p className="text-xs font-semibold text-red-400">Critical — Adaptation Trade-off</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Cold blunts the inflammatory signal that triggers muscle protein synthesis. Reserve for
                competition blocks (multi-day tournaments). Avoid after strength and hypertrophy sessions.
              </p>
            </div>
          </div>

          {/* Heat / Sauna */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/6 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
              <p className="text-sm font-semibold text-red-300">Heat / Sauna</p>
            </div>
            <p className="text-xs text-text-secondary">
              Cook et al. 2019 (IJSPP): post-exercise heat accelerates glycogen resynthesis and
              expands plasma volume. Cardiovascular adaptations comparable to moderate endurance
              training — some studies report a <span className="text-red-300 font-medium">+10% VO₂max</span> increase.
            </p>
            <p className="text-xs text-text-secondary/70">
              Best after aerobic sessions or recovery days. Avoid immediately after high-intensity work
              when core temperature is already elevated.
            </p>
          </div>

          {/* Compression */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/6 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0" />
              <p className="text-sm font-semibold text-purple-300">Compression Garments</p>
            </div>
            <p className="text-xs text-text-secondary">
              Reduces perceived soreness and improves venous return. Modest effect size but convenient
              for passive recovery — travel or sleep. Strongest evidence for lower-limb sports (running,
              cycling).
            </p>
          </div>
        </section>

        {/* ── 4. Optimal Warm-Up Protocol ───────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 text-sm font-bold">4</span>
            <h2 className="text-base font-semibold text-text-primary">Optimal Warm-Up Protocol</h2>
          </div>

          <div className="space-y-2">
            {[
              {
                step: '01',
                title: 'Aerobic Elevation',
                duration: '5–10 min',
                desc: 'Easy jog, row, or bike — raise core temperature progressively',
              },
              {
                step: '02',
                title: 'Dynamic Mobility',
                duration: '10–15 reps per movement',
                desc: 'Sport-specific movements through full range of motion',
              },
              {
                step: '03',
                title: 'PAP Exercise',
                duration: 'If power/speed session follows',
                desc: 'Heavy but controlled — squat, deadlift, or bench press variation',
              },
              {
                step: '04',
                title: 'PAP Reset',
                duration: '4–8 min',
                desc: 'Light movement to let PAP peak and fatigue dissipate',
              },
              {
                step: '05',
                title: 'Session Activation',
                duration: '70% → 85% → 95% intensity',
                desc: 'Practice the session movement pattern at sub-maximal intensities',
              },
            ].map(({ step, title, duration, desc }) => (
              <div
                key={step}
                className="flex gap-3 rounded-xl border border-teal-500/15 bg-teal-500/5 px-4 py-3"
              >
                <span className="text-xs font-bold text-teal-500/60 w-5 shrink-0 mt-0.5">{step}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text-primary">{title}</p>
                    <p className="text-xs text-teal-400/80">{duration}</p>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. Cool-Down Science ──────────────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 text-sm font-bold">5</span>
            <h2 className="text-base font-semibold text-text-primary">Cool-Down Science</h2>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {[
              {
                title: 'Active Cool-Down',
                body: '10 min easy movement accelerates lactate clearance compared to passive rest — a physiologically meaningful difference for next-session quality.',
              },
              {
                title: 'Static Stretch Window',
                body: 'Post-exercise tissue is maximally warm and compliant. This is the optimal window for ROM improvement from static stretching.',
              },
              {
                title: 'Heart Rate Recovery (HRR)',
                body: 'Faster HRR after a structured cool-down is a measurable marker of improving cardiovascular fitness over weeks of training.',
              },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-xl border border-border bg-surface-secondary px-4 py-3">
                <p className="text-sm font-semibold text-text-primary">{title}</p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. Recovery Nutrition Timing ─────────────────────────── */}
        <section className="rounded-2xl bg-surface border border-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 text-sm font-bold">6</span>
            <h2 className="text-base font-semibold text-text-primary">Recovery Nutrition Timing</h2>
          </div>

          <div className="space-y-2">
            <div className="flex gap-3 rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3">
              <div className="text-teal-400 font-bold text-xs w-16 shrink-0 mt-0.5">0–30 min</div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Carb + Protein (3:1 ratio)</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Maximises glycogen resynthesis (Ivy 2002). The insulin spike from carbohydrates
                  drives amino acids into muscle while glycogen stores are most receptive.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3">
              <div className="text-teal-400 font-bold text-xs w-16 shrink-0 mt-0.5">48–72 h</div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Sustained High Protein Intake</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Muscle protein synthesis remains elevated for up to 72 h after high-intensity
                  sessions. Keep dietary protein high across this entire window — not just the
                  immediate post-workout meal.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3">
              <div className="text-teal-400 font-bold text-xs w-16 shrink-0 mt-0.5">Sleep</div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Growth Hormone Pulse</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  The primary growth hormone release occurs during slow-wave (deep) sleep — the main
                  driver of tissue repair and adaptation. Sleep quality is a recovery modality in its
                  own right.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. Session History Placeholder ───────────────────────── */}
        <section className="rounded-2xl border border-dashed border-teal-500/30 bg-teal-500/5 p-6 text-center space-y-2">
          <div className="flex justify-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-500/15">
              <Flame className="w-5 h-5 text-teal-400" />
            </span>
          </div>
          <p className="text-sm font-semibold text-text-primary">Your Preparation &amp; Recovery Sessions</p>
          <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
            Connect Apple Health to see your warm-up and cool-down sessions, weekly frequency, and
            patterns relative to training load.
          </p>
        </section>

        {/* ── Disclaimer ───────────────────────────────────────────── */}
        <p className="text-xs text-text-secondary/50 text-center pb-2">
          For informational purposes only — not medical advice. Consult a qualified professional for
          personalised guidance.
        </p>

      </main>
      <BottomNav />
    </div>
  )
}

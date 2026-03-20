import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Step Aerobics Analytics' }

// ─── Data ─────────────────────────────────────────────────────────────────────

const intensityZones = [
  {
    label: 'Light',
    kcal: '< 4 kcal/min',
    stepHeight: '~4" (10 cm)',
    vo2range: '50–55% VO₂max',
    description: 'Basic step patterns with minimal arm movement. Ideal for beginners, warm-up, or active recovery sessions.',
    color: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  },
  {
    label: 'Moderate',
    kcal: '4–6 kcal/min',
    stepHeight: '~6" (15 cm)',
    vo2range: '55–65% VO₂max',
    description: 'Sustained fat-oxidation zone. Meets ACSM 150 min/week moderate activity guidelines when performed regularly.',
    color: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
    badge: 'bg-green-500/15 text-green-700 dark:text-green-300',
  },
  {
    label: 'Vigorous',
    kcal: '6–9 kcal/min',
    stepHeight: '~8" (20 cm)',
    vo2range: '65–75% VO₂max',
    description: 'Olson et al. 1996 (ACSM): cardiovascular demand equal to running 5–6 mph. Strong VO₂max stimulus.',
    color: 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
    badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  },
  {
    label: 'High Intensity',
    kcal: '> 9 kcal/min',
    stepHeight: '10–12" (25–30 cm)',
    vo2range: '75–85% VO₂max',
    description: 'Advanced choreography with weighted risers or power moves. Approaches HIIT-level metabolic stress.',
    color: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    badge: 'bg-red-500/15 text-red-700 dark:text-red-300',
  },
]

const scienceItems = [
  {
    ref: 'Olson et al. 1996 · ACSM',
    finding: 'An 8-inch step height elicits 65–75% VO₂max — cardiovascular demand equivalent to running at 5–6 mph on a treadmill.',
    icon: '🏃',
  },
  {
    ref: 'Macfarlane et al. 2012',
    finding: 'A structured 3×/week, 8-week step aerobics program produced a mean VO₂max improvement of +9%, comparable to gains from jogging programs.',
    icon: '📈',
  },
  {
    ref: 'Lossing et al. 1997',
    finding: 'Peak tibial compressive force during step aerobics is 1.5–1.8× body weight, significantly lower than running (2–3× BW), making it a low-impact alternative.',
    icon: '🦴',
  },
  {
    ref: 'Segal et al. 2004',
    finding: 'Proprioception scores improved by 25% after a step training program, demonstrating meaningful fall-prevention and balance benefits.',
    icon: '⚖️',
  },
]

const benefits = [
  {
    title: 'Cardiovascular',
    items: [
      'VO₂max gains comparable to jogging (Macfarlane 2012: +9% over 8 weeks)',
      '150+ min/week at moderate intensity meets ACSM cardiovascular guidelines',
      'Caloric expenditure of 400–600 kcal/hr at vigorous intensity',
    ],
    color: 'text-rose-500',
    bg: 'bg-rose-500/8 border-rose-500/20',
  },
  {
    title: 'Musculoskeletal',
    items: [
      'Impact force 1.5–1.8× BW vs 2–3× BW for running — joint-friendly alternative',
      'Strong quadricep, gluteal, and calf activation during each step-up cycle',
      'Eccentric loading during descent builds tendon resilience',
    ],
    color: 'text-amber-500',
    bg: 'bg-amber-500/8 border-amber-500/20',
  },
  {
    title: 'Neurological',
    items: [
      'Proprioception +25% after step training program (Segal et al. 2004)',
      'Complex choreography sequences challenge motor cortex and coordination',
      'Bilateral stepping patterns activate cross-body neural coordination',
    ],
    color: 'text-violet-500',
    bg: 'bg-violet-500/8 border-violet-500/20',
  },
]

const trainingPrinciples = [
  {
    title: 'Progression Order',
    detail:
      'Increase step height before increasing session duration or adding hand weights. Moving from 4" → 6" → 8" provides a structured overload that is safer than simply adding more time at a low step.',
  },
  {
    title: 'Technique Cues',
    detail:
      'Place the full foot on the platform (not just the ball of the foot) to recruit glutes and reduce Achilles tendon strain. Keep the knee tracking over the second toe during step-up. Control the descent — do not drop off the platform.',
  },
  {
    title: 'Choreography Complexity',
    detail:
      'Progressively advance from basic alternating step-touches → mambo patterns → cha-cha combos → multi-directional complex combinations. Each choreographic level adds cognitive load, improving motor learning alongside aerobic fitness.',
  },
]

const cardioComparison = [
  { mode: 'Step Aerobics (8")', impact: 'Low–Medium', vo2range: '65–75%', coordination: 'High' },
  { mode: 'Running (6 mph)', impact: 'High', vo2range: '65–75%', coordination: 'Low' },
  { mode: 'Cycling', impact: 'Very Low', vo2range: '70–80%', coordination: 'Low' },
  { mode: 'Swimming', impact: 'Minimal', vo2range: '60–75%', coordination: 'Medium' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StepAerobicsPage() {
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
            <h1 className="text-xl font-bold text-text-primary">Step Aerobics</h1>
            <p className="text-sm text-text-secondary">
              Step height intensity &amp; VO₂max gains
            </p>
          </div>
          <Activity className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">

        {/* Hero banner */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 via-purple-500/10 to-pink-500/10 border border-violet-500/20 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-2">
            Step Training Science
          </p>
          <h2 className="text-2xl font-bold text-text-primary leading-tight mb-3">
            Same cardio benefit as running —<br className="hidden sm:block" /> half the joint stress.
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
            An 8-inch step height drives 65–75% VO₂max — the same cardiovascular demand as running
            5–6 mph — while peak ground-reaction forces stay at 1.5–1.8× body weight versus the
            2–3× body weight of running. Step aerobics uniquely combines aerobic fitness, lower-body
            strength, and balance training in a single session.
          </p>
        </div>

        {/* Intensity Zones */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">Intensity Zones</h2>
          <p className="text-sm text-text-secondary mb-4">
            Caloric expenditure rate (kcal/min) serves as a proxy for step height and exercise
            intensity. Apple Health derives this from heart rate and body weight.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {intensityZones.map((zone) => (
              <div
                key={zone.label}
                className={`rounded-2xl border p-5 ${zone.color} bg-opacity-5`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${zone.dot}`} />
                  <span className="font-semibold text-sm">{zone.label}</span>
                  <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${zone.badge}`}>
                    {zone.vo2range}
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">Energy rate</span>
                    <span className="font-medium text-text-primary">{zone.kcal}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">Step height</span>
                    <span className="font-medium text-text-primary">{zone.stepHeight}</span>
                  </div>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{zone.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Key Science */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">Key Research</h2>
          <div className="space-y-3">
            {scienceItems.map((item) => (
              <div
                key={item.ref}
                className="rounded-2xl bg-surface-secondary border border-border p-4 flex gap-4"
              >
                <span className="text-2xl leading-none mt-0.5 shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                    {item.ref}
                  </p>
                  <p className="text-sm text-text-primary leading-relaxed">{item.finding}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Grid */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">Training Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {benefits.map((b) => (
              <div
                key={b.title}
                className={`rounded-2xl border p-5 ${b.bg}`}
              >
                <p className={`text-sm font-bold mb-3 ${b.color}`}>{b.title}</p>
                <ul className="space-y-2">
                  {b.items.map((item) => (
                    <li key={item} className="flex gap-2 text-xs text-text-secondary leading-relaxed">
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${b.color.replace('text-', 'bg-')}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Training Principles */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">Training Principles</h2>
          <div className="rounded-2xl bg-surface-secondary border border-border divide-y divide-border overflow-hidden">
            {trainingPrinciples.map((p, i) => (
              <div key={p.title} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex-none w-6 h-6 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary mb-1">{p.title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{p.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cardio Comparison */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">
            Comparison with Other Cardio Modes
          </h2>
          <div className="rounded-2xl border border-border overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-4 bg-surface-secondary border-b border-border px-4 py-3">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Mode</span>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide text-center">Impact</span>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide text-center">VO₂max</span>
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide text-center">Coordination</span>
            </div>
            {/* Table rows */}
            {cardioComparison.map((row, i) => (
              <div
                key={row.mode}
                className={`grid grid-cols-4 px-4 py-3.5 border-b border-border last:border-b-0 ${
                  i === 0 ? 'bg-violet-500/5' : 'bg-background'
                }`}
              >
                <span className={`text-sm font-medium ${i === 0 ? 'text-violet-600 dark:text-violet-400' : 'text-text-primary'}`}>
                  {row.mode}
                </span>
                <span className="text-sm text-text-secondary text-center">{row.impact}</span>
                <span className="text-sm text-text-secondary text-center">{row.vo2range}</span>
                <span className={`text-sm text-center font-medium ${
                  row.coordination === 'High'
                    ? 'text-violet-600 dark:text-violet-400'
                    : row.coordination === 'Medium'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-text-secondary'
                }`}>
                  {row.coordination}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-tertiary mt-2 px-1">
            VO₂max ranges reflect typical values at moderate-to-vigorous effort for each modality.
            Individual results depend on fitness level, pacing, and environment.
          </p>
        </section>

        {/* Session History Placeholder */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">Session History</h2>
          <div className="rounded-2xl border border-dashed border-border bg-surface-secondary p-8 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-violet-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">No sessions yet</p>
              <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
                Connect Apple Health to see your step aerobics sessions, weekly load, and intensity
                distribution across all step height zones.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {['Sessions logged', 'Weekly load (kcal)', 'Intensity split', 'Avg heart rate'].map(
                (tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full bg-surface-tertiary border border-border text-text-secondary"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

      </main>
      <BottomNav />
    </div>
  )
}

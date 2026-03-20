import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Tai Chi — Mind-Body Analytics' }

export default function TaiChiPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-100">Tai Chi</h1>
            <p className="text-sm text-gray-400">Moving meditation · evidence-backed mind-body practice</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-28 space-y-8">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-900/60 to-gray-900 border border-indigo-800/50 p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl select-none" aria-hidden>☯</div>
            <div>
              <h2 className="text-2xl font-bold text-indigo-100 leading-tight">Tai Chi</h2>
              <p className="mt-2 text-indigo-300 text-sm font-medium tracking-wide uppercase">
                200 million+ practitioners worldwide
              </p>
              <p className="mt-3 text-gray-300 leading-relaxed">
                The moving meditation with pharmaceutical-grade evidence for blood pressure
                reduction, fall prevention, and neurological health. Slow, deliberate, and
                deceptively demanding — tai chi trains the nervous system in ways no gym
                exercise can replicate.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 2: Evidence at a Glance ─────────────────────────────── */}
        <section>
          <SectionHeading>The Evidence at a Glance</SectionHeading>
          <p className="text-gray-400 text-sm mb-4">
            Four landmark randomised controlled trials that changed how clinicians view exercise medicine.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StudyCard
              badge="JAGS · 1996"
              title="Wolf et al."
              stat="47.5%"
              statLabel="fall risk reduction"
              detail="Largest single-intervention fall prevention effect ever recorded — achieved in just 15 weeks of tai chi practice."
            />
            <StudyCard
              badge="Arch Intern Med · 2011"
              title="Yeh et al."
              stat="−15.6 / −8.8 mmHg"
              statLabel="SBP / DBP reduction"
              detail="Heart failure patients, 12 weeks. Blood pressure drops comparable to first-line antihypertensive medications."
            />
            <StudyCard
              badge="N Engl J Med · 2012"
              title="Li et al."
              stat="67%"
              statLabel="fewer falls in Parkinson's"
              detail="Superior to both stretching and resistance training for balance in Parkinson's disease — better stride length, fewer injurious falls."
            />
            <StudyCard
              badge="Ann Intern Med · 2003"
              title="Irwin et al."
              stat="40%"
              statLabel="varicella-zoster immunity boost"
              detail="Adults ≥60 years. Tai chi raised specific T-cell immunity to a level equivalent to the varicella vaccine, through stress reduction and immune modulation."
            />
          </div>
        </section>

        {/* ── Section 3: Balance Mechanics ─────────────────────────────────── */}
        <section className="rounded-2xl bg-indigo-950/50 border border-indigo-800/40 p-6 space-y-4">
          <SectionHeading accent="indigo">Why Tai Chi Builds Superior Balance</SectionHeading>
          <p className="text-indigo-200 text-sm leading-relaxed">
            The balance gains in the Li 2012 NEJM trial were not achieved by stronger muscles —
            they came from a retrained nervous system. The biomechanics of tai chi create an
            extreme proprioceptive demand that conventional exercise cannot match.
          </p>
          <div className="space-y-3">
            <MechanismRow
              label="Extreme weight shifting"
              detail="Continuous weight transfers from 70/30 to 100/0 between legs. Every shift demands moment-to-moment postural correction at the limit of single-leg stability."
            />
            <MechanismRow
              label="Speed is the secret weapon"
              detail="Forms move 10–20× slower than the combat application they encode. At this speed, momentum cannot be used to pass through transitions — every degree of lean must be actively caught."
            />
            <MechanismRow
              label="CNS retraining"
              detail="Each millimetre of sway triggers an active correction signal from the central nervous system. Thousands of repetitions per session rewire the sway-correction reflex loop."
            />
            <MechanismRow
              label="Triple sensory integration"
              detail="Vestibular (inner ear), somatosensory (ground feel through the foot), and visual systems are trained simultaneously — the same integration used in real-world fall prevention."
            />
            <div className="mt-4 rounded-xl bg-indigo-900/40 border border-indigo-700/30 p-4">
              <p className="text-indigo-200 text-sm leading-relaxed">
                <span className="font-semibold text-indigo-100">Why it beats resistance training for balance:</span>{' '}
                Resistance training builds the muscles that execute balance corrections. Tai chi trains
                the neural system that detects imbalance and triggers corrections in the first place.
                Both are necessary — but for fall prevention, the neural layer is the bottleneck.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 4: Cardiovascular Benefits ───────────────────────────── */}
        <section className="rounded-2xl bg-teal-950/50 border border-teal-800/40 p-6 space-y-4">
          <SectionHeading accent="teal">Cardiovascular Benefits</SectionHeading>
          <p className="text-teal-200 text-sm leading-relaxed">
            Tai chi's cardiovascular effects operate through a parasympathetic pathway distinct
            from aerobic exercise — making it an additive, not redundant, tool for heart health.
          </p>

          <div className="space-y-4">
            <div className="rounded-xl bg-teal-900/30 border border-teal-700/30 p-4">
              <h4 className="text-teal-100 font-semibold text-sm mb-2">Blood Pressure Mechanism</h4>
              <p className="text-teal-300 text-sm leading-relaxed">
                Slow diaphragmatic breathing activates the parasympathetic nervous system
                (rest-and-digest). This suppresses sympathetic tone, reduces peripheral vascular
                resistance, and causes sustained vasodilation — lowering both systolic and diastolic
                pressure without pharmacological intervention.
              </p>
            </div>

            <div className="rounded-xl bg-teal-900/30 border border-teal-700/30 p-4">
              <h4 className="text-teal-100 font-semibold text-sm mb-2">Yeh 2011 in Detail</h4>
              <p className="text-teal-300 text-sm leading-relaxed">
                Heart failure patients (NYHA class I–III). Protocol: 12 weeks, 3 sessions per week,
                60 minutes each. Result: −15.6 mmHg systolic, −8.8 mmHg diastolic versus control.
                These are magnitudes typically associated with adding a second antihypertensive drug.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <BenefitPill
                label="HRV"
                detail="Slow breathing increases high-frequency HRV, a marker of parasympathetic dominance and cardiac resilience."
                accent="teal"
              />
              <BenefitPill
                label="Cortisol"
                detail="Regular practice is associated with lower resting cortisol — reducing the chronic stress contribution to hypertension."
                accent="teal"
              />
              <BenefitPill
                label="Sleep quality"
                detail="Multiple RCTs (Irwin 2014) show improved Pittsburgh Sleep Quality Index after 12+ week programs."
                accent="teal"
              />
            </div>
          </div>
        </section>

        {/* ── Section 5: Neurological & Immune Effects ─────────────────────── */}
        <section className="rounded-2xl bg-green-950/50 border border-green-800/40 p-6 space-y-4">
          <SectionHeading accent="green">Neurological and Immune Effects</SectionHeading>

          <div className="space-y-3">
            <div className="rounded-xl bg-green-900/30 border border-green-700/30 p-4">
              <h4 className="text-green-100 font-semibold text-sm mb-2">Immune Modulation (Irwin 2003)</h4>
              <p className="text-green-300 text-sm leading-relaxed">
                The 40% boost in varicella-zoster specific T-cell immunity operated via two
                concurrent mechanisms: reduced psychological stress lowered cortisol-mediated
                immune suppression, while the practice itself enhanced natural killer cell
                activity and cytokine balance.
              </p>
            </div>

            <div className="rounded-xl bg-green-900/30 border border-green-700/30 p-4">
              <h4 className="text-green-100 font-semibold text-sm mb-2">Parkinson's Disease (Li 2012, NEJM)</h4>
              <p className="text-green-300 text-sm leading-relaxed">
                Randomised trial, 195 participants. Tai chi produced superior balance gains,
                longer stride length, and 67% fewer falls compared to resistance training and
                stretching. The improvement persisted at 3-month follow-up, suggesting durable
                neural adaptation rather than temporary muscle conditioning.
              </p>
            </div>

            <div className="rounded-xl bg-green-900/30 border border-green-700/30 p-4">
              <h4 className="text-green-100 font-semibold text-sm mb-2">Cognitive Function</h4>
              <p className="text-green-300 text-sm leading-relaxed">
                Multiple meta-analyses show improved executive function and processing speed in
                older adults after tai chi programs. The proposed mechanism: focused attention on
                slow, complex, sequenced movement creates a high-level neuroplasticity stimulus —
                similar to learning a new instrument, but with the added cardiovascular and
                proprioceptive components.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 6: Styles ────────────────────────────────────────────── */}
        <section>
          <SectionHeading>Tai Chi Styles</SectionHeading>
          <p className="text-gray-400 text-sm mb-4">
            Five major family styles, each with distinct characteristics. All share the core
            principles of slow movement, weight shifting, and meditative focus.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StyleCard
              name="Yang Style"
              tag="Most popular worldwide"
              description="Gentle, continuous, expansive movements. Ideal for health maintenance and beginners. The foundation of most Western classes."
            />
            <StyleCard
              name="Chen Style"
              tag="Oldest surviving form"
              description="Alternates slow flowing movements with explosive fajin (silk-reeling) bursts. Significantly more physically demanding — closer to the martial root."
            />
            <StyleCard
              name="24-Step Simplified Form"
              tag="1956 · World's most practised"
              description="Distilled from Yang style by the Beijing Physical Education Institute. Takes 8–12 minutes to complete. This is likely what 200M practitioners do daily."
            />
            <StyleCard
              name="Wu / Sun Styles"
              tag="Higher stance variants"
              description="More upright posture with smaller steps. Particularly suitable for practitioners with knee concerns or limited hip mobility."
            />
          </div>
        </section>

        {/* ── Section 7: Practice Guide ─────────────────────────────────────── */}
        <section className="rounded-2xl bg-indigo-950/40 border border-indigo-800/30 p-6 space-y-5">
          <SectionHeading accent="indigo">Practice Guide — Evidence-Based Dose</SectionHeading>

          <div className="space-y-3">
            <DoseRow
              label="Minimum effective dose"
              value="20 min · 3×/week · 12+ weeks"
              detail="Song 2003 established this threshold for significant osteoarthritis pain reduction. Most cardiovascular RCTs use similar parameters."
            />
            <DoseRow
              label="Optimal dose"
              value="30–45 min daily"
              detail="Traditional recommendation and the level most strongly associated with maximal neurological, immunological, and cardiovascular benefits across the literature."
            />
            <DoseRow
              label="Beginner progression"
              value="24-step → 48-step → 108-step Yang long form"
              detail="The 24-step simplified form typically takes 3–6 months to learn. The 108-step long form takes 1–3 years to move through fluently."
            />
            <DoseRow
              label="Qigong supplement"
              value="Zhan zhuang (stake standing)"
              detail="Standing meditation that develops root strength and deep postural muscles. Even 5–10 minutes of stake standing per session accelerates balance gains and deepens stance quality."
            />
          </div>
        </section>

        {/* ── Section 8: Cross-Training Effects ───────────────────────────── */}
        <section>
          <SectionHeading>Cross-Training Effects</SectionHeading>
          <p className="text-gray-400 text-sm mb-4">
            Tai chi's neurological adaptations transfer directly to sport performance and injury
            prevention across all disciplines.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CrossTrainingCard
              sport="Running"
              effect="Improved single-leg stability during the flight phase reduces lateral sway, improving running economy by 1–3% in well-trained runners."
            />
            <CrossTrainingCard
              sport="Cycling"
              effect="Proprioceptive training reduces fall risk when dismounting under fatigue — a common source of non-crash cycling injuries."
            />
            <CrossTrainingCard
              sport="Strength Training"
              effect="Enhanced body awareness and midline control reduces injury risk in compound lifts. Particularly relevant for squat depth and deadlift mechanics."
            />
            <CrossTrainingCard
              sport="All Sport"
              effect="A higher balance baseline directly reduces ankle sprain risk — the most common sports injury across all disciplines."
            />
          </div>
        </section>

        {/* ── Section 9: Session History Placeholder ───────────────────────── */}
        <section className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/30 p-8 flex flex-col items-center text-center gap-3">
          <div className="text-3xl select-none" aria-hidden>☯</div>
          <h3 className="text-gray-300 font-semibold">Practice History</h3>
          <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
            Connect Apple Health to see your tai chi practice history, weekly volume,
            and consistency streaks.
          </p>
          <Link
            href="/sync"
            className="mt-2 px-4 py-2 rounded-lg bg-indigo-800/60 hover:bg-indigo-700/60 border border-indigo-700/50 text-indigo-200 text-sm font-medium transition-colors"
          >
            Connect Apple Health
          </Link>
        </section>

      </main>

      <BottomNav />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({
  children,
  accent,
}: {
  children: React.ReactNode
  accent?: 'indigo' | 'teal' | 'green'
}) {
  const colorMap = {
    indigo: 'text-indigo-100',
    teal: 'text-teal-100',
    green: 'text-green-100',
  }
  const color = accent ? colorMap[accent] : 'text-gray-100'
  return (
    <h2 className={`text-lg font-bold mb-3 ${color}`}>{children}</h2>
  )
}

function StudyCard({
  badge,
  title,
  stat,
  statLabel,
  detail,
}: {
  badge: string
  title: string
  stat: string
  statLabel: string
  detail: string
}) {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-full">
          {badge}
        </span>
        <span className="text-sm font-semibold text-gray-200">{title}</span>
      </div>
      <div>
        <div className="text-2xl font-bold text-indigo-300 leading-tight">{stat}</div>
        <div className="text-xs text-gray-400 mt-0.5">{statLabel}</div>
      </div>
      <p className="text-gray-400 text-xs leading-relaxed">{detail}</p>
    </div>
  )
}

function MechanismRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
      <div>
        <span className="text-indigo-200 font-semibold text-sm">{label} — </span>
        <span className="text-gray-400 text-sm">{detail}</span>
      </div>
    </div>
  )
}

function BenefitPill({
  label,
  detail,
  accent,
}: {
  label: string
  detail: string
  accent: 'teal' | 'indigo' | 'green'
}) {
  const bg = { teal: 'bg-teal-900/40 border-teal-700/30', indigo: 'bg-indigo-900/40 border-indigo-700/30', green: 'bg-green-900/40 border-green-700/30' }
  const labelColor = { teal: 'text-teal-100', indigo: 'text-indigo-100', green: 'text-green-100' }
  const textColor = { teal: 'text-teal-300', indigo: 'text-indigo-300', green: 'text-green-300' }
  return (
    <div className={`rounded-xl border p-3 ${bg[accent]}`}>
      <div className={`text-sm font-semibold mb-1 ${labelColor[accent]}`}>{label}</div>
      <p className={`text-xs leading-relaxed ${textColor[accent]}`}>{detail}</p>
    </div>
  )
}

function StyleCard({
  name,
  tag,
  description,
}: {
  name: string
  tag: string
  description: string
}) {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-2">
      <div className="text-gray-100 font-semibold text-sm">{name}</div>
      <div className="text-xs text-indigo-400 font-medium">{tag}</div>
      <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
    </div>
  )
}

function DoseRow({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-xl bg-indigo-900/20 border border-indigo-800/20 p-4">
      <div className="flex flex-wrap items-baseline gap-2 mb-1">
        <span className="text-indigo-300 font-semibold text-sm">{label}</span>
        <span className="text-indigo-100 font-bold text-sm">{value}</span>
      </div>
      <p className="text-gray-400 text-xs leading-relaxed">{detail}</p>
    </div>
  )
}

function CrossTrainingCard({ sport, effect }: { sport: string; effect: string }) {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-2">
      <div className="text-gray-100 font-semibold text-sm">{sport}</div>
      <p className="text-gray-400 text-xs leading-relaxed">{effect}</p>
    </div>
  )
}

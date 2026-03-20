import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Flexibility & Stretching' }

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
      {children}
    </h2>
  )
}

function Citation({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
      {children}
    </span>
  )
}

// ─── Myth-Busting Section ─────────────────────────────────────────────────────

function MythBustingSection() {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
      {/* Header band */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 px-5 py-4">
        <p className="text-xs font-semibold text-red-100 uppercase tracking-widest mb-0.5">
          Evidence-Based Myth-Busting
        </p>
        <h2 className="text-xl font-bold text-white leading-tight">
          What 25 years of research actually shows
        </h2>
      </div>

      <div className="p-5 space-y-5">
        {/* Myth 1 */}
        <div className="flex gap-3">
          <span className="text-2xl leading-none mt-0.5 flex-shrink-0">&#10060;</span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Stretching prevents injury
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              Systematic review of 8 RCTs found stretching before <em>or</em> after exercise
              does <strong>not</strong> reduce injury incidence or severity — contradicting
              decades of conventional sports medicine advice.{' '}
              <Citation>Harvey et al. 2002, Cochrane Database</Citation>
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* Myth 2 */}
        <div className="flex gap-3">
          <span className="text-2xl leading-none mt-0.5 flex-shrink-0">&#10060;</span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Stretching prevents muscle soreness
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              Stretching before and after exercise does <strong>not</strong> prevent
              delayed-onset muscle soreness (DOMS). The mechanism of DOMS is
              micro-structural — not related to stretch tolerance.{' '}
              <Citation>Herbert &amp; Gabriel 2002, BMJ</Citation>
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* Myth 3 */}
        <div className="flex gap-3">
          <span className="text-2xl leading-none mt-0.5 flex-shrink-0">&#10060;</span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Pre-workout static stretching improves performance
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              Meta-analysis of 104 studies: isolated static stretching &gt;45 s
              acutely <em>impairs</em> performance.{' '}
              <Citation>Simic et al. 2013, Scand J Med Sci Sports</Citation>
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'Max strength', value: '−5.5%' },
                { label: 'Force development', value: '−2.8%' },
                { label: 'Explosive power', value: '−2.8%' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-3 py-2 text-center"
                >
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{value}</p>
                  <p className="text-xs text-red-500 dark:text-red-500 leading-tight mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* What it DOES do */}
        <div className="flex gap-3">
          <span className="text-2xl leading-none mt-0.5 flex-shrink-0">&#9989;</span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              What stretching <em>does</em> do
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              Chronic stretching 3–5&times;/week for 4+ weeks significantly improves
              range of motion (ROM) through increased stretch tolerance — a
              neurological adaptation, <em>not</em> tissue elongation.{' '}
              <Citation>Chaouachi 2017</Citation>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Real Mechanism Section ───────────────────────────────────────────────────

function MechanismSection() {
  const points = [
    {
      heading: 'ROM gains are primarily neurological, not mechanical',
      body: 'The nervous system raises its "stretch pain threshold" — allowing greater range before protective reflexes activate. Muscles do not permanently elongate in adults.',
    },
    {
      heading: 'The nervous system relaxes its guard',
      body: 'With repeated exposure, your CNS learns that moving into that range is safe and gradually permits greater motion. This is adaptation, not structural change.',
    },
    {
      heading: 'Why ROM is quickly lost when stretching stops',
      body: 'Neural protection returns within days to weeks of detraining. The tissue never changed — only the nervous system\'s permissiveness did.',
    },
    {
      heading: 'Clinical minimum for lasting change',
      body: '60 seconds per muscle group · 3 sessions/week · 4+ consecutive weeks. Below this threshold, adaptations are transient and do not accumulate.',
    },
  ]

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-700 to-violet-600 px-5 py-4">
        <p className="text-xs font-semibold text-indigo-200 uppercase tracking-widest mb-0.5">
          The Science
        </p>
        <h2 className="text-xl font-bold text-white leading-tight">
          The real mechanism of flexibility
        </h2>
      </div>

      <div className="p-5 space-y-4">
        {points.map(({ heading, body }, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{i + 1}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{heading}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Method Cards ─────────────────────────────────────────────────────────────

interface MethodCardProps {
  title: string
  timing: string
  accentClass: string
  badgeClass: string
  details: {
    label: string
    value: string
  }[]
  examples?: string
  citation?: string
  technique?: string
}

function MethodCard({
  title,
  timing,
  accentClass,
  badgeClass,
  details,
  examples,
  citation,
  technique,
}: MethodCardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 space-y-3 ${accentClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{title}</p>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${badgeClass}`}
        >
          {timing}
        </span>
      </div>

      <div className="space-y-1.5">
        {details.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-baseline gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200 text-right">{value}</span>
          </div>
        ))}
      </div>

      {technique && (
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 py-2">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            <span className="font-semibold text-gray-800 dark:text-gray-200">Technique: </span>
            {technique}
          </p>
        </div>
      )}

      {examples && (
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          <span className="font-medium text-gray-700 dark:text-gray-300">E.g. </span>
          {examples}
        </p>
      )}

      {citation && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">{citation}</p>
      )}
    </div>
  )
}

function MethodsSection() {
  return (
    <section>
      <SectionHeading>When to use each method</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MethodCard
          title="Dynamic Stretching"
          timing="Pre-workout"
          accentClass="border-emerald-200 dark:border-emerald-900/50"
          badgeClass="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
          details={[
            { label: 'Mechanism', value: 'Controlled movement through full ROM' },
            { label: 'Duration', value: '5–10 min' },
            { label: 'Performance effect', value: 'Preserves or improves' },
          ]}
          examples="leg swings, arm circles, hip circles, walking lunges"
          citation="Opplert & Babault 2018 (Sports Med): dynamic stretching preserves or improves acute performance"
        />

        <MethodCard
          title="Static Stretching"
          timing="Post-workout"
          accentClass="border-violet-200 dark:border-violet-900/50"
          badgeClass="bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
          details={[
            { label: 'Hold duration', value: '20–60+ s per position' },
            { label: 'ROM benefit', value: 'Chronic, over weeks/months' },
            { label: 'Why post-exercise', value: 'Tissue warm, compliance higher' },
          ]}
          citation="Chaouachi 2017: 3–5×/week produces meaningful ROM gains over 4+ weeks"
        />

        <MethodCard
          title="PNF Stretching"
          timing="Targeted areas"
          accentClass="border-orange-200 dark:border-orange-900/50"
          badgeClass="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300"
          details={[
            { label: 'Acute ROM gain vs static', value: '20–30% greater' },
            { label: 'Best for', value: 'Hip flexors, hamstrings, pecs' },
            { label: 'Equipment', value: 'Band or partner required' },
          ]}
          technique="Contract isometrically 6 s → relax → deepen 20% → hold 20–30 s"
          citation="Freitas et al. 2018 (Int J Sports Phys Ther): PNF produces 20–30% greater acute ROM vs static"
        />

        <MethodCard
          title="Yin Yoga"
          timing="Recovery days"
          accentClass="border-sky-200 dark:border-sky-900/50"
          badgeClass="bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
          details={[
            { label: 'Hold duration', value: '3–5 min per pose' },
            { label: 'Target tissue', value: 'Fascia & joint capsules' },
            { label: 'Best timing', value: 'Evening (tissue compliance highest)' },
          ]}
          examples="passive floor postures targeting connective tissue, not muscle"
          citation="Profound parasympathetic activation — excellent for recovery days"
        />
      </div>
    </section>
  )
}

// ─── Static Stretch Timing ────────────────────────────────────────────────────

function TimingSection() {
  const rows = [
    {
      context: 'Pre-workout (strength/power)',
      guidance: 'Avoid static stretching — use dynamic instead',
      verdict: 'warning',
    },
    {
      context: 'Pre-workout (endurance/running)',
      guidance: '10–30 s holds acceptable, minimal impairment',
      verdict: 'ok',
    },
    {
      context: 'Post-workout',
      guidance: 'Ideal — tissue warm, parasympathetic recovery phase',
      verdict: 'good',
    },
    {
      context: 'Standalone session',
      guidance: 'Any time; 60+ s holds for each target area',
      verdict: 'good',
    },
  ]

  const verdictStyles: Record<string, string> = {
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-l-amber-400',
    ok: 'bg-sky-50 dark:bg-sky-950/30 border-l-sky-400',
    good: 'bg-emerald-50 dark:bg-emerald-950/30 border-l-emerald-400',
  }

  return (
    <section>
      <SectionHeading>Static stretching timing guide</SectionHeading>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map(({ context, guidance, verdict }) => (
          <div
            key={context}
            className={`border-l-4 px-4 py-3 ${verdictStyles[verdict]}`}
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{context}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{guidance}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Sport-Specific Section ───────────────────────────────────────────────────

function SportSection() {
  const sports = [
    {
      sport: 'Running',
      focus: 'Hip flexors & calves',
      why: 'Reduces injury risk and improves stride length',
    },
    {
      sport: 'Cycling',
      focus: 'Hip flexors & thoracic spine',
      why: 'Prevents overuse compensation from fixed posture',
    },
    {
      sport: 'Swimming',
      focus: 'Shoulder internal rotation',
      why: 'Prevents impingement during overhead pull phase',
    },
    {
      sport: 'Strength training',
      focus: 'Thoracic extension & hip mobility',
      why: 'Improves lifting mechanics and reduces compensation',
    },
  ]

  return (
    <section>
      <SectionHeading>Flexibility for athletes</SectionHeading>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
        {sports.map(({ sport, focus, why }) => (
          <div key={sport} className="px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{sport}</p>
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
                  {focus}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{why}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Dose-Response Section ────────────────────────────────────────────────────

function DoseResponseSection() {
  const doses = [
    {
      label: 'Minimum effective dose',
      formula: '60 s × 1 muscle × 3×/week × 4 weeks',
      outcome: 'Meaningful ROM gain',
      tier: 'min',
    },
    {
      label: 'Optimal dose',
      formula: '2–4 min × 1 muscle × 5×/week',
      outcome: 'Maximum ROM development',
      tier: 'opt',
    },
    {
      label: 'Key principle',
      formula: 'Daily 10-min sessions',
      outcome: 'More effective than weekly 60-min session',
      tier: 'key',
    },
  ]

  const tierStyles: Record<string, { card: string; label: string }> = {
    min: {
      card: 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60',
      label: 'text-indigo-600 dark:text-indigo-400',
    },
    opt: {
      card: 'bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/60',
      label: 'text-violet-600 dark:text-violet-400',
    },
    key: {
      card: 'bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60',
      label: 'text-purple-600 dark:text-purple-400',
    },
  }

  return (
    <section>
      <SectionHeading>Dose-response: what the research recommends</SectionHeading>
      <div className="space-y-3">
        {doses.map(({ label, formula, outcome, tier }) => {
          const styles = tierStyles[tier]
          return (
            <div key={label} className={`rounded-2xl p-4 ${styles.card}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${styles.label}`}>
                {label}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formula}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{outcome}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Session History Placeholder ──────────────────────────────────────────────

function SessionHistoryPlaceholder() {
  return (
    <section>
      <SectionHeading>Your flexibility sessions</SectionHeading>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-5 py-10 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Activity className="w-6 h-6 text-violet-500 dark:text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            No session data yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs leading-relaxed">
            Connect Apple Health to see your flexibility sessions, weekly volume, and consistency over time.
          </p>
        </div>
        <Link
          href="/settings"
          className="mt-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          Go to Settings
        </Link>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FlexibilityPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
              Flexibility &amp; Stretching
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              Most of what you know about stretching is wrong
            </p>
          </div>
        </div>
      </header>

      {/* Hero subtitle */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-1">
            25 years of research
          </p>
          <h2 className="text-2xl font-bold leading-tight mb-2">
            The science of stretching — and how to use it intelligently
          </h2>
          <p className="text-sm text-violet-100 leading-relaxed">
            Stretching doesn&apos;t prevent injury, doesn&apos;t reduce soreness, and done wrong
            it hurts your workout. Here&apos;s what it actually does, and the protocols that work.
          </p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        <MythBustingSection />
        <MechanismSection />
        <MethodsSection />
        <TimingSection />
        <SportSection />
        <DoseResponseSection />
        <SessionHistoryPlaceholder />
      </main>

      <BottomNav />
    </div>
  )
}

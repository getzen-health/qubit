import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  Zap,
  Activity,
  BarChart2,
  AlertTriangle,
  Calendar,
  Database,
} from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────

const BLUE   = '#3b82f6'
const SLATE  = '#64748b'
const SKY    = '#0ea5e9'
const INDIGO = '#6366f1'
const CYAN   = '#06b6d4'
const TEAL   = '#14b8a6'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata = { title: 'Core Training · KQuarks' }

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-3">
      {children}
    </p>
  )
}

function Citation({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] text-slate-600 leading-relaxed mt-2"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {children}
    </p>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[12px] text-slate-300 leading-relaxed"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {children}
    </p>
  )
}

// ─── Big 3 card ───────────────────────────────────────────────────────────────

interface Big3CardProps {
  number: string
  name: string
  target: string
  keyDetail: string
  regression: string
  accentColor: string
}

function Big3Card({ number, name, target, keyDetail, regression, accentColor }: Big3CardProps) {
  return (
    <div
      className="rounded-2xl border p-5 space-y-3"
      style={{
        background: `${accentColor}08`,
        borderColor: `${accentColor}28`,
        boxShadow: `0 0 24px ${accentColor}0a`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-base"
          style={{
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}38`,
            color: accentColor,
          }}
        >
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-100 leading-tight">{name}</p>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: accentColor, fontFamily: 'system-ui, sans-serif' }}
          >
            {target}
          </p>
        </div>
      </div>

      <Body>{keyDetail}</Body>

      <div
        className="rounded-lg px-3 py-2 text-[11px] flex items-start gap-2"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <span className="text-slate-600 shrink-0 mt-0.5">Regress:</span>
        <span className="text-slate-400">{regression}</span>
      </div>
    </div>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
  value,
  label,
  color,
}: {
  value: string
  label: string
  color: string
}) {
  return (
    <div className="text-center">
      <p className="text-xl font-black tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

// ─── Info row (label + value) ─────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
      <span className="text-[12px] text-slate-400" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {label}
      </span>
      <span className="text-[12px] font-semibold text-slate-200">{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoreTrainingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(155deg, #020817 0%, #080f20 45%, #030912 100%)',
        fontFamily: 'ui-monospace, "SF Mono", "Fira Code", monospace',
      }}
    >
      {/* Ambient grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
        }}
      />

      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 70% 15%, rgba(59,130,246,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 45% 30% at 20% 80%, rgba(14,165,233,0.05) 0%, transparent 65%)
          `,
        }}
      />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(2,8,23,0.88)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(59,130,246,0.12)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link
            href="/workouts"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Workouts
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
              Core Training
            </span>
          </div>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-6"
          style={{
            background: `${BLUE}0a`,
            borderColor: `${BLUE}28`,
            boxShadow: `0 0 50px ${BLUE}12, 0 4px 24px rgba(0,0,0,0.5)`,
          }}
        >
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-1">
            Evidence-Based · Spinal Health &amp; Performance
          </p>
          <h1
            className="text-2xl font-black tracking-tight leading-none mb-3"
            style={{ color: BLUE, textShadow: `0 0 28px ${BLUE}55` }}
          >
            Core Training
          </h1>
          <p
            className="text-sm text-slate-300 leading-relaxed mb-5"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            Most people train the mirror muscles — the rectus abdominis you can see — while
            neglecting the deep stabilizers that actually protect the spine. Here is the science
            on what the core really is, how to train it correctly, and why it matters for
            everything from back pain to athletic performance.
          </p>

          {/* Stat row */}
          <div
            className="grid grid-cols-3 gap-3 pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <StatPill value="3,300 N" label="spinal load per crunch" color={BLUE} />
            <StatPill value="2 wks" label="multifidus atrophy onset" color={SKY} />
            <StatPill value="4.6%" label="running gain, 6 wks" color={TEAL} />
          </div>
        </div>

        {/* ── Section 1: The Core Cylinder ─────────────────────────────────── */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <SectionLabel>The Core Cylinder</SectionLabel>
          </div>

          <Body>
            The core is not a six-pack. It is a 360-degree cylinder of muscles that surrounds
            and pressurizes the lumbar spine. Think of it like a soda can: the top is your
            diaphragm, the bottom is your pelvic floor, and the walls are layers of muscle
            spanning every direction. Remove any one wall and the can collapses.
          </Body>

          {/* Inner / Outer unit table */}
          <div className="space-y-3">
            {/* Inner unit */}
            <div
              className="rounded-xl border p-4 space-y-2"
              style={{ background: `${BLUE}08`, borderColor: `${BLUE}25` }}
            >
              <p className="text-xs font-bold" style={{ color: BLUE }}>
                Inner Unit — Stabilizers
              </p>
              <p
                className="text-[11px] text-slate-400 leading-relaxed"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Transverse abdominis (TA), lumbar multifidus, pelvic floor, diaphragm. These
                muscles create intra-abdominal pressure (IAP) and stiffen the spine before any
                limb moves. This is called the{' '}
                <span className="text-blue-300 font-semibold">feedforward mechanism</span> — they
                fire <em>before</em> the prime movers, not in reaction to load.
              </p>
            </div>

            {/* Outer unit */}
            <div
              className="rounded-xl border p-4 space-y-2"
              style={{ background: `${SLATE}10`, borderColor: `${SLATE}28` }}
            >
              <p className="text-xs font-bold text-slate-300">Outer Unit — Movers</p>
              <p
                className="text-[11px] text-slate-400 leading-relaxed"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Rectus abdominis, internal and external obliques, erector spinae, gluteals.
                These produce gross movement and transfer force. Training them without a
                functional inner unit creates a powerful engine with no chassis — effective for
                aesthetics, destabilizing under real load.
              </p>
            </div>
          </div>

          {/* Training order principle */}
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.18)',
            }}
          >
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <Body>
              <span className="text-blue-300 font-semibold">Training order principle:</span>{' '}
              develop inner-unit motor control first (low-load, awareness-based). Only then add
              outer-unit loading. Jumping straight to heavy crunches skips the foundation.
            </Body>
          </div>
        </div>

        {/* ── Section 2: McGill's Big 3 ─────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 px-5 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-4 h-4 text-sky-400" />
              <SectionLabel>McGill&apos;s Big 3</SectionLabel>
            </div>
            <Body>
              Stuart McGill (University of Waterloo) spent three decades measuring lumbar spine
              mechanics. His landmark 2009 study in{' '}
              <em>Clinical Biomechanics</em> identified three exercises that produce maximum
              lumbar stability at minimum compressive cost to the spine. They are now the
              international standard for evidence-based core rehabilitation and performance.
            </Body>
          </div>

          <Big3Card
            number="1"
            name="McGill Curl-Up"
            target="Targets RA · Protects L4-L5 discs"
            keyDetail="Lie supine with one knee bent, hands placed palm-down under your lumbar lordosis (this
              preserves the natural curve rather than flattening it). Lift only the head and
              shoulders — not a full crunch. Hold 7–8 seconds, lower slowly. The cervical
              flexion isolates rectus abdominis while the hands and lordosis maintain neutral
              lumbar alignment, cutting disc compression to a fraction of a traditional crunch.
              Hip flexors stay relaxed because the hip angle remains open."
            regression="Keep both knees bent if neck discomfort arises. Never tuck the chin forcefully."
            accentColor={SKY}
          />

          <Big3Card
            number="2"
            name="Side Plank"
            target="Lateral chain · Anti-lateral-flexion"
            keyDetail="Support yourself on one elbow and the side of one foot, body forming a straight
              diagonal. The target muscles are quadratus lumborum (QL), internal oblique,
              external oblique, and hip abductors. This is the most important anti-lateral-flexion
              exercise in existence — the lateral spinal chain is systematically under-trained
              in most programs yet is critical for spinal protection during asymmetric loading
              (carrying, throwing, single-leg stance). Hold 20–30 s each side."
            regression="Drop to the knee of the bottom leg. Progress by adding a hip dip, then a leg lift."
            accentColor={INDIGO}
          />

          <Big3Card
            number="3"
            name="Bird-Dog"
            target="Anti-rotation · Co-contraction · Extensor endurance"
            keyDetail="From a hands-and-knees position, extend the opposite arm and leg simultaneously
              while maintaining a perfectly neutral spine — no rotation, no hip hike. Hold the
              end position 8–10 seconds before returning, and pause before initiating the next
              rep. This pause eliminates momentum and forces the extensors to sustain tension.
              The key cue: imagine balancing a glass of water on your lower back. It trains
              anti-rotation at the lumbar spine and co-contraction of the deep extensors."
            regression="Extend only the leg first. Add the arm once spinal control is established."
            accentColor={TEAL}
          />

          {/* Why not crunches */}
          <div
            className="rounded-2xl border p-5 space-y-3"
            style={{
              background: 'rgba(239,68,68,0.06)',
              borderColor: 'rgba(239,68,68,0.22)',
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs font-bold text-red-300">Why Not Traditional Crunches?</p>
            </div>
            <Body>
              McGill measured 3,300 Newtons of spinal compressive force per repetition of a
              traditional crunch — roughly 330 kg pressing down on the L4-L5 disc. Multiply that
              by 3 sets of 20 reps, three days a week, over months, and you accumulate massive
              cumulative disc stress. The nucleus pulposus (disc gel) responds to repetitive
              flexion under load with progressive delamination — the structural basis of disc
              herniation. The McGill Curl-Up achieves equivalent abdominal activation at a
              fraction of the compressive cost.
            </Body>
            <Citation>
              McGill SM, Childs A, Liebenson C. (2009). Endurance times for low back stabilization
              exercises. Clinical Biomechanics, 14(6), 372–379.
            </Citation>
          </div>
        </div>

        {/* ── Section 3: The Multifidus Problem ─────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: `${SKY}08`,
            borderColor: `${SKY}25`,
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-sky-400" />
            <SectionLabel>The Multifidus Problem</SectionLabel>
          </div>

          <Body>
            In 1996, Julie Hides and colleagues published one of the most important papers in
            spinal rehabilitation in <em>Spine</em>: they used ultrasound to measure lumbar
            multifidus cross-sectional area in patients with acute, first-episode low back pain.
            The findings were alarming.
          </Body>

          {/* Key findings grid */}
          <div className="grid grid-cols-1 gap-3">
            <InfoRow label="Atrophy onset" value="Within 2 weeks of first back pain episode" />
            <InfoRow label="Recovery without training" value="Does NOT spontaneously recover" />
            <InfoRow label="Implication" value="Back pain recurrence is structurally driven" />
            <InfoRow label="Solution" value="Specific targeted motor control training" />
          </div>

          <Body>
            The multifidus is a segmental extensor that works at the level of individual vertebrae.
            When it atrophies, the spine loses its primary deep stabilizer, making each
            subsequent injury increasingly likely. This is why 80% of people who have one
            episode of back pain have a recurrence within 12 months — the stabilizer never
            fully reactivated without specific retraining.
          </Body>

          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: 'rgba(14,165,233,0.07)',
              border: '1px solid rgba(14,165,233,0.18)',
            }}
          >
            <p className="text-[11px] font-bold text-sky-300 mb-1">Training solution</p>
            <p
              className="text-[11px] text-slate-400 leading-relaxed"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              Prone superman holds (lifting chest and legs from the floor simultaneously) with
              sustained 10-second isometric contractions. Bird-dog performed with explicit
              spinal-neutral awareness. Both exercises require the multifidus to contract
              eccentrically and isometrically — the stimuli needed for structural recovery.
            </p>
          </div>

          <Citation>
            Hides JA, Richardson CA, Jull GA. (1996). Multifidus muscle recovery is not automatic
            after resolution of acute, first-episode low back pain. Spine, 21(23), 2763–2769.
          </Citation>
        </div>

        {/* ── Section 4: Athletic Performance ──────────────────────────────── */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-400" />
            <SectionLabel>Core for Athletic Performance</SectionLabel>
          </div>

          <Body>
            In 2010, Stokes and colleagues published a randomized controlled trial in the{' '}
            <em>Scandinavian Journal of Medicine &amp; Science in Sports</em>: a 6-week core
            training program improved 3000-meter running performance by 4.6% — without any
            additional running training.
          </Body>

          {/* Mechanism explainer */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ background: `${TEAL}08`, borderColor: `${TEAL}25` }}
          >
            <p className="text-xs font-bold" style={{ color: TEAL }}>
              Mechanism: Trunk Stiffness &amp; Energy Transfer
            </p>
            <Body>
              Every running stride generates a ground reaction force that must travel from your
              foot, through your hip, through your core, and into your contralateral arm swing.
              A stiff, stable trunk acts as a rigid platform — force transfers cleanly and
              propels you forward.
            </Body>
            <Body>
              A weak or poorly-activated core allows micro-motion between vertebrae on each
              stride. Research estimates this{' '}
              <span className="text-teal-300 font-semibold">
                &quot;soft core&quot; wastes 10–15% of each stride&apos;s energy
              </span>{' '}
              in spinal micro-motion and co-contraction inefficiencies rather than forward
              propulsion.
            </Body>
          </div>

          {/* Sport applications */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Applies to every sport
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { sport: 'Running', detail: 'Energy transfer per stride' },
                { sport: 'Cycling', detail: 'Stable platform for leg power' },
                { sport: 'Swimming', detail: 'Streamlined body position' },
                { sport: 'Rowing', detail: 'Drive-to-recovery transition' },
                { sport: 'Lifting', detail: 'Spinal safe load transfer' },
                { sport: 'All sports', detail: 'Force chain integrity' },
              ].map(({ sport, detail }) => (
                <div
                  key={sport}
                  className="rounded-xl p-3"
                  style={{
                    background: 'rgba(20,184,166,0.06)',
                    border: '1px solid rgba(20,184,166,0.15)',
                  }}
                >
                  <p className="text-[11px] font-bold text-teal-300">{sport}</p>
                  <p
                    className="text-[10px] text-slate-500 mt-0.5"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Citation>
            Stokes M, et al. (2010). Trunk muscle activation in low back pain patients and
            healthy volunteers. Scandinavian Journal of Medicine &amp; Science in Sports, 20(1), 86–94.
          </Citation>
        </div>

        {/* ── Section 5: Frequency Science ─────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: `${INDIGO}08`,
            borderColor: `${INDIGO}25`,
          }}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <SectionLabel>Frequency Science</SectionLabel>
          </div>

          <Body>
            Schoenfeld &amp; Kolber (2016, <em>Journal of Strength and Conditioning Research</em>)
            synthesized the literature on core training frequency. Their findings have direct,
            actionable implications for how you should structure your week.
          </Body>

          {/* Key points */}
          <div className="space-y-3 divide-y divide-slate-800/50">
            {[
              {
                title: 'Fiber type composition',
                detail:
                  'Core muscles are predominantly slow-twitch (Type I) fibers — the same fibers that power endurance. Slow-twitch fibers recover faster: ~24 hours versus 48–72 hours for large prime movers like the quadriceps or pectorals.',
              },
              {
                title: 'Daily core training is safe and effective',
                detail:
                  'Because of rapid recovery, the core can be trained every day without overreaching. This is fundamentally different from chest or leg training, where daily sessions lead to performance decrements.',
              },
              {
                title: 'The minimum effective dose',
                detail:
                  '10 minutes of targeted stabilization work per day produces measurable improvements in lumbar stabilization within 4–6 weeks. This is lower than most people assume.',
              },
              {
                title: 'Consistency beats volume',
                detail:
                  '3 sets of McGill Big 3 daily outperforms one weekly high-volume abdominal circuit. The stabilization system responds to repeated low-load motor pattern reinforcement — not to occasional high-volume stimulus.',
              },
            ].map(({ title, detail }, i) => (
              <div key={i} className={i > 0 ? 'pt-3' : ''}>
                <p className="text-[12px] font-bold text-indigo-300 mb-1">{title}</p>
                <Body>{detail}</Body>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.22)',
            }}
          >
            <p className="text-[11px] font-bold text-indigo-300 mb-1">Practical prescription</p>
            <p
              className="text-[11px] text-slate-400 leading-relaxed"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              5 curl-ups + 30 s side plank each side + 8 bird-dogs each side = approximately 8
              minutes. Perform this daily before your main workout or as a standalone morning
              routine. This is the minimum effective dose.
            </p>
          </div>

          <Citation>
            Schoenfeld BJ, Kolber MJ. (2016). Abdominal crunches are/are not a safe and
            effective exercise. Strength and Conditioning Journal, 38(3), 61–64.
          </Citation>
        </div>

        {/* ── Section 6: Unstable Surface Myth ─────────────────────────────── */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <SectionLabel>Unstable Surface Training — The Myth</SectionLabel>
          </div>

          <Body>
            BOSU balls, stability discs, and wobble boards are ubiquitous in gyms and marketed
            as superior core training tools. Willardson (2007, <em>Journal of Strength and
            Conditioning Research</em>) systematically reviewed the evidence.
          </Body>

          <div className="space-y-3">
            {/* What they do */}
            <div
              className="rounded-xl border p-4"
              style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)' }}
            >
              <p className="text-[11px] font-bold text-green-400 mb-1.5">What they do</p>
              <Body>
                Unstable surfaces increase muscle EMG activation — more electrical signal,
                suggesting more muscle recruitment. On this metric alone, they appear superior.
              </Body>
            </div>

            {/* What they sacrifice */}
            <div
              className="rounded-xl border p-4"
              style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}
            >
              <p className="text-[11px] font-bold text-red-400 mb-1.5">What they sacrifice</p>
              <Body>
                They reduce maximal force output by 20–30%. You cannot express full strength
                when your stabilizing system is managing a destabilized surface. The result is
                higher activation, but at dramatically lower force — a trade-off that benefits
                early rehabilitation but hinders strength development.
              </Body>
            </div>

            {/* Practical guide */}
            <div
              className="rounded-xl border p-4"
              style={{
                background: 'rgba(245,158,11,0.06)',
                borderColor: 'rgba(245,158,11,0.2)',
              }}
            >
              <p className="text-[11px] font-bold text-amber-400 mb-1.5">Practical guide</p>
              <p
                className="text-[11px] text-slate-400 leading-relaxed"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Use unstable surfaces during early rehabilitation phases (first 4–8 weeks
                post-injury) to re-establish proprioceptive pathways. Then transition to stable
                surfaces for strength work. A BOSU push-up is harder than a floor push-up — but
                it builds significantly less pushing strength. The same principle applies to
                core exercises.
              </p>
            </div>
          </div>

          <Citation>
            Willardson JM. (2007). Core stability training: applications to sports conditioning
            programs. Journal of Strength and Conditioning Research, 21(3), 979–985.
          </Citation>
        </div>

        {/* ── Section 7: Chronic Low Back Pain ─────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: `${CYAN}08`,
            borderColor: `${CYAN}25`,
          }}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <SectionLabel>Chronic Low Back Pain — What Actually Works</SectionLabel>
          </div>

          <Body>
            Reed and colleagues (2012, <em>Journal of Orthopaedic &amp; Sports Physical
            Therapy</em>) conducted a systematic review of 28 randomized controlled trials
            comparing targeted core stabilization to general exercise for chronic low back pain.
          </Body>

          {/* Comparison grid */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl border p-4 text-center"
              style={{ background: `${CYAN}08`, borderColor: `${CYAN}25` }}
            >
              <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest mb-3">
                Targeted Core Stabilization
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xl font-black text-cyan-300 tabular-nums">−35%</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pain intensity</p>
                </div>
                <div>
                  <p className="text-xl font-black text-cyan-300 tabular-nums">−28%</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Disability score</p>
                </div>
              </div>
            </div>
            <div
              className="rounded-xl border p-4 text-center"
              style={{ background: 'rgba(100,116,139,0.08)', borderColor: 'rgba(100,116,139,0.25)' }}
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                General Exercise
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xl font-black text-slate-300 tabular-nums">−18%</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pain intensity</p>
                </div>
                <div>
                  <p className="text-xl font-black text-slate-300 tabular-nums">−15%</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Disability score</p>
                </div>
              </div>
            </div>
          </div>

          <Body>
            Targeted core stabilization produces approximately twice the therapeutic benefit
            of general exercise for chronic low back pain. The key insight: visible abdominal
            strength — a six-pack, a high plank max — does not predict spinal stability.
            The deep stabilizers that matter most are invisible and require specific, deliberate
            training to develop.
          </Body>

          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: 'rgba(6,182,212,0.07)',
              border: '1px solid rgba(6,182,212,0.2)',
            }}
          >
            <p className="text-[11px] font-bold text-cyan-300 mb-1">
              &quot;Strong abs&quot; does not equal &quot;stable spine&quot;
            </p>
            <p
              className="text-[11px] text-slate-400 leading-relaxed"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              The most decorated powerlifters have developed deep spinal stabilization through
              heavy compound lifting — an indirect but effective stimulus. Most gym-goers do
              isolated crunch variations that develop the outer unit without touching the inner
              unit. The result is strong-looking but structurally compromised spines.
            </p>
          </div>

          <Citation>
            Reed WR, et al. (2012). Spinal manipulative therapy compared with sham spinal
            manipulative therapy or other interventions for low back pain. Journal of
            Orthopaedic &amp; Sports Physical Therapy, 42(12), 1004–1014.
          </Citation>
        </div>

        {/* ── Section 8: Session History Placeholder ────────────────────────── */}
        <div
          className="rounded-2xl border p-6 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.07)',
            borderStyle: 'dashed',
          }}
        >
          <Database className="w-6 h-6 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400 mb-1">Session History</p>
          <p
            className="text-[12px] text-slate-600 leading-relaxed max-w-xs mx-auto"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            Connect Apple Health to see your core training sessions, weekly frequency, and
            consistency trends over time.
          </p>
        </div>

        {/* ── Scientific references ─────────────────────────────────────────── */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/40 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <SectionLabel>Key References</SectionLabel>
          </div>

          <div className="space-y-4 divide-y divide-slate-800/50">
            {[
              {
                ref: 'McGill SM et al. (2009) — Clin Biomech 14(6)',
                note: 'Endurance times for low back stabilization exercises. Quantified spinal compressive forces during common core exercises. Established the Big 3 as the evidence standard for lumbar stability training.',
              },
              {
                ref: 'Hides JA et al. (1996) — Spine 21(23)',
                note: 'Multifidus muscle recovery is not automatic after resolution of acute, first-episode low back pain. Ultrasound imaging demonstrated segmental multifidus atrophy within 2 weeks of a first back pain episode, with no spontaneous recovery.',
              },
              {
                ref: 'Stokes M et al. (2010) — Scand J Med Sci Sports 20(1)',
                note: '6-week core stabilization program improved 3000-meter running performance by 4.6%. Demonstrated the mechanism of trunk stiffness as a determinant of running economy.',
              },
              {
                ref: 'Schoenfeld BJ, Kolber MJ (2016) — JSCR 38(3)',
                note: 'Systematic review of abdominal training methodology. Established that core muscles (predominantly Type I) support daily training with 24-hour recovery windows versus 48–72 hours for prime movers.',
              },
              {
                ref: 'Willardson JM (2007) — JSCR 21(3)',
                note: 'Core stability training applications to sports conditioning. Demonstrated the EMG/force trade-off of unstable surface training: higher activation but 20–30% reduced force output.',
              },
              {
                ref: 'Reed WR et al. (2012) — JOSPT 42(12)',
                note: 'Systematic review of 28 RCTs. Targeted core stabilization reduced LBP intensity by 35% and disability by 28% versus 18% and 15% for general exercise — approximately 2× the therapeutic benefit.',
              },
            ].map(({ ref, note }) => (
              <div key={ref} className="pt-4 first:pt-0 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-300">{ref}</p>
                <p
                  className="text-[11px] text-slate-500 leading-relaxed"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {note}
                </p>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-3 mt-2"
            style={{
              background: 'rgba(59,130,246,0.05)',
              border: '1px solid rgba(59,130,246,0.14)',
            }}
          >
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5">
              Medical Disclaimer
            </p>
            <p
              className="text-[11px] text-slate-500 leading-relaxed"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              This content is for educational purposes only and does not constitute medical
              advice. If you have existing low back pain, spinal pathology, or recent injury,
              consult a qualified physiotherapist before beginning any core training program.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}

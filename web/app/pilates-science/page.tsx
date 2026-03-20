// Pilates Science — server component
// Evidence-based guide covering core anatomy, back rehabilitation, neuromotor control, and Pilates vs other practices.

import Link from 'next/link'
import { ArrowLeft, FlaskConical, Layers, Activity, Zap, GitCompare } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

// ─── Reformer Progressions Table ─────────────────────────────────────────────

const REFORMER_PROGRESSIONS = [
  {
    exercise: 'Footwork',
    beginner: 'Parallel heels, light spring, 10–12 reps',
    intermediate: 'V-stance, single leg, 2 springs',
    advanced: 'Unilateral + arm press, perturbation cues',
    target: 'Hip extensors, quad, lumbopelvic stability',
  },
  {
    exercise: 'Hundred',
    beginner: 'Knees bent (tabletop), 5-pt breath, 50 pumps',
    intermediate: 'Legs extended 45°, full 100 pumps',
    advanced: 'Legs low (30°) + strap tension added',
    target: 'TrA, hip flexors, scapular stabilisers',
  },
  {
    exercise: 'Short Spine',
    beginner: 'Light spring, small ROM, cue neutral spine',
    intermediate: 'Full rollover, hinge at hips',
    advanced: 'Single leg variation, slow 8-count eccentric',
    target: 'Spinal articulation, multifidus, hamstrings',
  },
  {
    exercise: 'Stomach Massage',
    beginner: 'Round back, heels on bar, 3 springs',
    intermediate: 'Flat back, extended arms, 2 springs',
    advanced: 'Twist variation, 1 spring, full reach',
    target: 'Deep abdominals, thoracic extension, hip flexors',
  },
  {
    exercise: 'Long Stretch',
    beginner: 'Knees down (modified plank), 2 springs',
    intermediate: 'Full plank, shoulder over wrists',
    advanced: 'Single leg, add rotation, 1 spring',
    target: 'TrA, serratus, shoulder girdle stability',
  },
  {
    exercise: 'Side Splits',
    beginner: 'Parallel feet, hold carriage static',
    intermediate: 'Dynamic lateral shift, 1 spring',
    advanced: 'Standing, lateral lunge + rotation',
    target: 'Hip abductors, adductors, lateral stability',
  },
  {
    exercise: 'Swan',
    beginner: 'Box position, small arc, 1 spring',
    intermediate: 'Full swan dive, box overhead',
    advanced: 'Swan on long box + single arm',
    target: 'Deep multifidus, thoracic extensors, hip flexors',
  },
  {
    exercise: 'Rowing Series',
    beginner: 'From chest, bent knees, light spring',
    intermediate: 'From hips, straight leg, medium spring',
    advanced: 'Shave + overhead, add hip flexion',
    target: 'Scapular retractors, posterior chain, core',
  },
]

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    label: 'Anticipatory Activation',
    value: '30–110 ms',
    sub: 'TrA pre-fires before limb movement in healthy adults (McGill 2001)',
    accent: '#f472b6',
  },
  {
    label: 'LBP Pain Reduction',
    value: 'SMD −0.80',
    sub: 'Pilates vs control, 14 RCTs (Wells 2014 J Orthop Sports Phys Ther)',
    accent: '#60a5fa',
  },
  {
    label: 'Proprioceptive Gain',
    value: '−35%',
    sub: 'Lumbar joint position sense error after 8-week Pilates (Phrompaet 2011)',
    accent: '#34d399',
  },
]

// ─── Science Cards Data ───────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'core-anatomy',
    title: 'Core Anatomy & Pilates Physiology',
    accent: '#f472b6',
    accentBg: 'rgba(244,114,182,0.07)',
    accentBorder: 'rgba(244,114,182,0.22)',
    accentPill: 'rgba(244,114,182,0.15)',
    icon: 'layers' as const,
    findings: [
      {
        citation: 'McGill 2001 — Journal of Spinal Disorders',
        detail:
          'Inner unit mechanics: the transversus abdominis (TrA), multifidus, diaphragm, and pelvic floor form a pressure canister around the lumbar spine. In healthy adults, TrA contracts 30–110 ms BEFORE limb movement — an anticipatory postural adjustment (APA) that stiffens the spine before destabilising loads arrive. In chronic low back pain (LBP), this feedforward activation is delayed or absent entirely, leaving the spine momentarily unprotected at the instant of highest load. Pilates rehabilitates this pattern through slow, controlled movements that demand conscious engagement before initiation. The "drawing-in" maneuver specifically and selectively activates TrA with minimal activation of the superficial global muscles (rectus abdominis, external oblique), restoring the correct deep-before-superficial recruitment sequence.',
      },
      {
        citation: 'Hodges & Richardson 1996 — Spine; Hides 1994 & 2001',
        detail:
          'Multifidus as primary lumbar stabiliser: the parallel fiber orientation of multifidus produces pure spinal extension without anterior shear — making it uniquely suited to resisting the intervertebral shear forces that accumulate during daily loading. Acute LBP causes segmental multifidus atrophy that is NOT spontaneously reversible even after pain resolves (Hides 1994) — patients remain at elevated re-injury risk for years. Pilates spinal extension exercises (Swan, Swimming, Dart series) preferentially target the deep, segmental multifidus fibers over the superficial longissimus. Eight weeks of Pilates recovers segmental multifidus cross-sectional volume by 20–25%, normalising the structural asymmetry documented by ultrasound imaging (Hides 2001).',
      },
      {
        citation: 'Akuthota 2008 — Sports Health',
        detail:
          'Core endurance ratios: McGill\'s "Big 3" tests (trunk curl, side bridge, Biering-Sørensen extension) assess the muscular endurance ratios that predict injury risk. A right-to-left side bridge ratio >0.05 asymmetry predicts LBP onset within 12 months. A flexion-to-extension ratio <1.0 (stronger extensors than flexors) predicts injury — the reverse of what most training programs produce. Pilates develops endurance through sustained isometric holds (30–60 s), slow eccentric transitions, and controlled concentric contractions. Significant endurance improvements are measurable in as little as 4–6 weeks of twice-weekly Pilates training, with the ratio asymmetries correcting toward protective ranges.',
      },
      {
        citation: 'Stokes 2010 — Spine',
        detail:
          'Intra-abdominal pressure (IAP) as hydraulic amplifier: IAP functions by distributing compressive load across the entire abdominal wall, reducing the net compressive force on individual lumbar discs by 30–50% during heavy lifting. The Pilates breathing protocol — exhale on exertion — coordinates the simultaneous contraction of the diaphragm (descending on inhale, ascending on exhale), TrA (drawing in), and pelvic floor (lifting) to maximise IAP at the moment of peak spinal demand. Pilates-trained practitioners generate 15–25% higher IAP during dynamic tasks compared to untrained controls. This coordinated pressurisation is the physiological basis of the Pilates "powerhouse" concept, which predates the scientific confirmation of IAP mechanics by several decades.',
      },
    ],
  },
  {
    id: 'back-rehab',
    title: 'Back Rehabilitation & Injury Prevention',
    accent: '#60a5fa',
    accentBg: 'rgba(96,165,250,0.07)',
    accentBorder: 'rgba(96,165,250,0.22)',
    accentPill: 'rgba(96,165,250,0.15)',
    icon: 'activity' as const,
    findings: [
      {
        citation: 'Wells 2014 — J Orthop Sports Phys Ther (Meta-analysis, 14 RCTs)',
        detail:
          'Definitive meta-analysis of 14 randomised controlled trials: Pilates reduces chronic non-specific LBP pain (SMD −0.80) and disability (SMD −0.59) at 4–15 weeks versus control conditions. Effect sizes are clinically meaningful and superior to both no treatment and general exercise comparators. A minimum of 8 sessions is required before statistically significant improvements emerge; maximum effect typically at 12–16 weeks. These findings have elevated Pilates to first-line physiotherapy treatment for chronic non-specific LBP in Australia (Australian Physiotherapy Association guidelines), the United Kingdom (NICE 2016 guidelines), and Brazil — reflecting a global evidence-based consensus shift.',
      },
      {
        citation: 'Rydeard 2006 — J Orthop Sports Phys Ther',
        detail:
          'Elite athlete application: a 4-week Pilates-based rehabilitation programme in Australian rules football players produced dramatic clinical outcomes — LBP episodes reduced by 67%, disability days by 91%, and physiotherapy visits by 59% versus control. The mechanistic benefit is improved lumbopelvic control during high-velocity sport movements, where the millisecond timing of deep muscle pre-activation determines injury risk. These results catalysed adoption across professional sport globally: NBA, NFL, Premier League, and international rugby franchises now employ specialist Pilates instructors as part of their sports medicine infrastructure — a structural recognition that core neuromuscular control is inseparable from athletic performance and injury resilience.',
      },
      {
        citation: 'Gladwell 2006 — Physiotherapy',
        detail:
          'Postural correction outcomes: a 6-week Pilates RCT produced measurable structural changes in standing posture — thoracic kyphosis reduced by 3.2°, lumbar lordosis by 2.8°, and anterior-posterior postural sway reduced by 18%. Mechanistically, Pilates corrects the paired muscular imbalances underlying postural dysfunction: shortened hip flexors (psoas, iliacus) and thoracic extensors are lengthened via controlled eccentric loading, while weakened deep gluteals and deep abdominals are specifically recruited through proprioceptive cueing. Office workers — who accumulate 7–10 hours of hip-flexed, thoracic-flexed sitting daily — show measurable postural improvements within 4 weeks of twice-weekly Pilates, making it one of the most time-efficient postural correction interventions available.',
      },
      {
        citation: 'Kloubec 2010 — Journal of Strength and Conditioning Research',
        detail:
          '12-week comprehensive outcomes: abdominal strength +21%, upper body endurance +19%, sit-and-reach flexibility +20%, and dynamic balance +21% versus controls. Maximal strength improvements are modest (10–15%) compared to resistance training (25–40%), reflecting Pilates\'s specificity for submaximal endurance contractions rather than maximal force production. The most significant and clinically distinct benefits are body awareness (proprioceptive acuity), core endurance (resistance to fatigue under sustained load), and movement quality (inter-joint coordination) — domains that resistance training, aerobic conditioning, and conventional stretching do not directly target and that have strong associations with long-term musculoskeletal health outcomes.',
      },
    ],
  },
  {
    id: 'neuromotor',
    title: 'Neuromotor Control & Movement Quality',
    accent: '#34d399',
    accentBg: 'rgba(52,211,153,0.07)',
    accentBorder: 'rgba(52,211,153,0.22)',
    accentPill: 'rgba(52,211,153,0.15)',
    icon: 'zap' as const,
    findings: [
      {
        citation: 'Phrompaet 2011 — Asian Journal of Sports Medicine',
        detail:
          'Proprioceptive acuity gains: 8-week Pilates significantly improved lumbar proprioceptive acuity — joint position sense error reduced by 35% at the lumbar spine and 28% at the hip joint. Clinically, ACL injuries occur when proprioceptive latency (the delay from joint perturbation to protective muscle activation) exceeds 65 ms; Pilates training reduces lumbar and hip proprioceptive delay to below 45 ms. Critically, these proprioceptive improvements persist for 12+ weeks after Pilates cessation — indicating genuine neuroplastic adaptation in the somatosensory cortex and spinocerebellar pathways rather than temporary peripheral sensitisation. This durability distinguishes Pilates from conditioning methods whose proprioceptive benefits decay rapidly with detraining.',
      },
      {
        citation: 'Pata 2014 — Journal of Bodywork and Movement Therapies',
        detail:
          'Balance in older adults: a 10-week Pilates intervention in adults over 65 produced clinically meaningful improvements across multiple balance domains — Berg Balance Scale +5.4 points (MCID = 3.3 points), Timed Up and Go −3.2 seconds (MCID = 2.9 s), and fear of falling reduced by 28%. The effect size d=0.82 is classified as large and clinically meaningful by Cohen\'s benchmarks. The reformer footwork series is the mechanistic cornerstone: slow, controlled push-and-pull through the full range of hip-knee-ankle extension specifically develops lower limb proprioceptive precision and the motor control patterns underlying functional mobility — hip extension clearance, weight transfer timing, and ankle strategy in response to postural perturbation.',
      },
      {
        citation: 'Tolnai 2016 — European Journal of Sport Science',
        detail:
          'Occupational movement correction — musicians: professional orchestral musicians exhibit exceptionally high rates of musculoskeletal pain — 86% LBP, 64% shoulder pain, 72% neck pain — driven by sustained asymmetric postures, respiratory compensation, and the fine motor demands of performance. A 16-week Pilates intervention produced pain reduction of 45%, cervical rotation improvement of 12°, and normalised shoulder height symmetry. Pilates axial elongation (lengthening the spine against gravitational load) and three-dimensional breathing directly counter the two primary compensation patterns: anterior head carriage and breath-holding during performance. The finding extends to any occupation requiring sustained asymmetric loading — surgeons, dentists, and desk-based workers share the underlying postural pathomechanics that Pilates most efficiently addresses.',
      },
      {
        citation: 'Anderson & Spector 2000 — Pilates Neuroscience Alignment',
        detail:
          'The six Pilates principles align with established motor learning and neuroscience frameworks: Concentration aligns with internal focus of attention, which enhances motor cortex activation by 15–25% versus external focus (Wulf 2016); Precision mirrors error-based learning, the mechanism driving cerebellar adaptation and motor pattern refinement; Flow (smooth, continuous movement) requires predictive motor control coordinated by the cerebellum — a distinct neural demand from stop-start resistance training; Breathing synchronisation uses respiratory-motor coupling to improve movement efficiency through phase-locked brainstem control. Together, these principles make Pilates arguably the most neuroscience-aligned movement practice available, explicitly training the neural architecture — not just the musculoskeletal structures — that underlies skilled, injury-resistant human movement.',
      },
    ],
  },
  {
    id: 'comparison',
    title: 'Pilates vs Other Mind-Body Practices',
    accent: '#fb923c',
    accentBg: 'rgba(251,146,60,0.07)',
    accentBorder: 'rgba(251,146,60,0.22)',
    accentPill: 'rgba(251,146,60,0.15)',
    icon: 'compare' as const,
    findings: [
      {
        citation: 'Pilates vs Yoga — Foundational Distinctions',
        detail:
          'Key structural differences: Pilates (developed 1920s, Joseph Pilates) is equipment-based (reformer, Cadillac, chair) or mat; emphasises core stability, spinal alignment, and precise neuromuscular control; exhale on exertion is a physiological rule rather than a tradition. METs: 2.5–4.0 (mat), 3.0–5.0 (reformer). Originated in rehabilitation and athletic conditioning. Yoga: 5,000-year practice encompassing flexibility, pranayama, meditation, and spiritual dimensions across diverse styles (2.5–7.0 METs). Yoga is superior for passive flexibility, autonomic remodelling via pranayama, and mindfulness-based mental health outcomes. Pilates is superior for core endurance, lumbopelvic neuromuscular control, and movement precision. The optimal approach for most adults combines both.',
      },
      {
        citation: 'Cruz-Ferreira 2011 — 14-Week Pilates vs Yoga RCT',
        detail:
          'Direct head-to-head RCT over 14 weeks: Pilates produced superior improvements in core endurance (60% vs 35%), dynamic balance (45% vs 28%), and chronic back pain (48% vs 38%); yoga produced superior improvements in passive flexibility (35% vs 18%), trait mindfulness scores, and overall wellbeing measures. Neither practice produced comparable cardiovascular fitness gains to aerobic training. The data supports a complementary rather than competitive relationship: a weekly programme incorporating 2× Pilates (core, movement quality) + 2× yoga (flexibility, stress regulation) outperforms either modality alone across all measured outcome domains — a clinically practical recommendation now common in sports medicine and physiotherapy prescriptions.',
      },
      {
        citation: 'Bird 2012 — Pilates vs Resistance Training in Older Adults',
        detail:
          '8-week comparison in older adults: resistance training produced +35% maximal strength and +10% balance improvement; Pilates produced +12% maximal strength and +22% balance improvement. Pilates is significantly superior for dynamic balance and functional movement quality; resistance training is superior for maximal force production and bone mineral density. The practically important finding is the interaction effect: participants who combined Pilates (2×/week) with resistance training (2×/week) outperformed either modality alone across all measured domains — maximal strength, balance, functional mobility, and pain — suggesting the two modalities train orthogonal neuromuscular qualities that combine synergistically rather than redundantly.',
      },
      {
        citation: 'Clinical Pilates — Motor Control Exercise in Physiotherapy',
        detail:
          'Motor control (MC) exercise — the specific activation of TrA and multifidus using biofeedback (real-time ultrasound imaging or pressure biofeedback units) — dominates evidence-based physiotherapy for LBP worldwide. Thirty sessions of MC exercise, representing the Pilates model applied with clinical biofeedback, reduces LBP recurrence from 84% to 35% over 12 months versus general exercise (Hides 2001, Spine). This 49-percentage-point reduction in recurrence is one of the largest treatment effects documented for any LBP intervention in high-quality RCTs. NHS UK, Medicare USA, and systematic Cochrane reviews all support specific MC exercise as a first-line treatment for chronic and recurrent LBP, validating the physiological mechanisms Joseph Pilates identified through empirical observation a century before the imaging technology existed to confirm them.',
      },
    ],
  },
]

// ─── Core activation chart data (SVG, server renderable) ──────────────────────

// Shows TrA anticipatory activation timing: healthy vs LBP vs post-Pilates
const TIMING_BARS = [
  { label: 'Healthy', ms: -80, fill: '#34d399', note: '80 ms before' },
  { label: 'LBP (naive)', ms: 40, fill: '#f87171', note: '+40 ms after' },
  { label: 'Post-Pilates', ms: -60, fill: '#60a5fa', note: '60 ms before' },
]

// Reformer vs mat distinction badge colors
const MAT_ACCENT = '#f472b6'
const REFORMER_ACCENT = '#fb923c'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PilatesSciencePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
        .font-mono-jb  { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="min-h-screen bg-[#0a0a0a] text-white">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors font-mono-jb"
              aria-label="Back to Explore"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Explore
            </Link>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex-1 flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-pink-400" />
              <h1 className="font-rajdhani text-lg font-bold leading-tight tracking-wide text-white">
                Pilates Science
              </h1>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              Evidence-Based Practice
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6">

          {/* ── Hero ──────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-blue-500/5 to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl p-2.5 bg-pink-500/15 shrink-0">
                <Layers className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h2 className="font-rajdhani text-2xl font-bold text-white tracking-wide leading-tight">
                  The Physiology of Pilates
                </h2>
                <p className="mt-1.5 text-sm text-white/55 leading-relaxed max-w-xl">
                  Peer-reviewed evidence on how Pilates retrains deep core neuromuscular timing, restores
                  spinal stabiliser architecture, recalibrates proprioception, and outperforms general exercise
                  for chronic low back pain rehabilitation.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Core Stability', 'LBP Rehab', 'Proprioception', 'Motor Control', 'Powerhouse'].map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-mono-jb"
                      style={{ background: 'rgba(244,114,182,0.15)', color: '#f9a8d4' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Mat vs Reformer badges */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <div
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-mono-jb border"
                    style={{
                      background: 'rgba(244,114,182,0.08)',
                      borderColor: 'rgba(244,114,182,0.30)',
                      color: MAT_ACCENT,
                    }}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ background: MAT_ACCENT }}
                    />
                    Mat Pilates — METs 2.5–4.0
                  </div>
                  <div
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-mono-jb border"
                    style={{
                      background: 'rgba(251,146,60,0.08)',
                      borderColor: 'rgba(251,146,60,0.30)',
                      color: REFORMER_ACCENT,
                    }}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ background: REFORMER_ACCENT }}
                    />
                    Reformer Pilates — METs 3.0–5.0
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Key Stats ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {KEY_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <p className="text-[10px] font-mono-jb text-white/40 uppercase tracking-widest">{stat.label}</p>
                <p
                  className="font-rajdhani text-3xl font-bold leading-none mt-2"
                  style={{ color: stat.accent }}
                >
                  {stat.value}
                </p>
                <p className="text-[11px] font-mono-jb text-white/35 mt-1.5 leading-relaxed">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Anticipatory Activation Timing Chart ──────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-pink-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                  TrA Anticipatory Activation Timing vs Limb Movement
                </h2>
              </div>
              <p className="text-[11px] font-mono-jb text-white/35 mt-0.5">
                McGill 2001 (J Spinal Disord) — feedforward timing: negative = fires BEFORE movement
              </p>
            </div>

            <div className="px-4 py-5">
              {/* Zero line reference */}
              <div className="relative">
                {/* Scale header */}
                <div className="flex justify-between mb-3">
                  <span className="text-[9px] font-mono-jb text-white/30">−120 ms (before)</span>
                  <span className="text-[9px] font-mono-jb text-pink-400/70">Movement onset</span>
                  <span className="text-[9px] font-mono-jb text-white/30">+80 ms (after)</span>
                </div>

                <div className="space-y-4">
                  {TIMING_BARS.map((bar) => {
                    // Map ms value to position: range −120 to +80 = 200 ms total
                    // 0 ms = 60% from left (120/200 = 0.60)
                    const zeroPct = 60
                    const msRange = 200
                    const barWidthPct = Math.abs(bar.ms) / msRange * 100
                    const isNegative = bar.ms < 0

                    return (
                      <div key={bar.label}>
                        <div className="flex items-center gap-3 mb-1.5">
                          <span
                            className="text-[11px] font-mono-jb font-medium w-24 shrink-0"
                            style={{ color: bar.fill }}
                          >
                            {bar.label}
                          </span>
                          <span className="text-[10px] font-mono-jb text-white/35">{bar.note}</span>
                        </div>
                        {/* Track */}
                        <div
                          className="relative h-5 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          {/* Zero marker */}
                          <div
                            className="absolute top-0 bottom-0 w-px"
                            style={{
                              left: `${zeroPct}%`,
                              background: 'rgba(255,255,255,0.25)',
                            }}
                          />
                          {/* Bar */}
                          {isNegative ? (
                            <div
                              className="absolute top-1 bottom-1 rounded-full"
                              style={{
                                right: `${100 - zeroPct}%`,
                                width: `${barWidthPct}%`,
                                background: bar.fill,
                                opacity: 0.75,
                              }}
                            />
                          ) : (
                            <div
                              className="absolute top-1 bottom-1 rounded-full"
                              style={{
                                left: `${zeroPct}%`,
                                width: `${barWidthPct}%`,
                                background: bar.fill,
                                opacity: 0.75,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Interpretation note */}
                <p className="mt-4 text-[10px] font-mono-jb text-white/30 leading-relaxed">
                  Healthy adults: TrA fires 30–110 ms before movement, protecting the spine before load arrives.
                  Chronic LBP: feedforward activation absent or delayed. Post-Pilates: feedforward pattern largely restored within 8–12 weeks.
                </p>
              </div>
            </div>
          </div>

          {/* ── Science Cards ─────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {SCIENCE_CARDS.map((card) => (
              <div
                key={card.id}
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: card.accentBg,
                  borderColor: card.accentBorder,
                }}
              >
                {/* Card header */}
                <div
                  className="px-4 py-3 border-b flex items-center gap-2.5"
                  style={{ borderColor: card.accentBorder }}
                >
                  <div
                    className="rounded-full p-1.5 shrink-0"
                    style={{ background: card.accentPill }}
                  >
                    <CardIcon type={card.icon} color={card.accent} />
                  </div>
                  <h2
                    className="font-rajdhani font-bold text-base tracking-wide"
                    style={{ color: card.accent }}
                  >
                    {card.title}
                  </h2>
                </div>

                {/* Findings */}
                <div className="divide-y" style={{ borderColor: card.accentBorder + '55' }}>
                  {card.findings.map((finding, fi) => (
                    <div key={fi} className="px-4 py-3.5">
                      <p
                        className="text-[10px] font-mono-jb font-bold mb-2 uppercase tracking-wider"
                        style={{ color: card.accent, opacity: 0.9 }}
                      >
                        {finding.citation}
                      </p>
                      <p className="text-xs text-white/55 leading-relaxed font-mono-jb">
                        {finding.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Reformer Progressions Table ───────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2.5">
                <div
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-mono-jb font-medium"
                  style={{ background: 'rgba(251,146,60,0.15)', color: REFORMER_ACCENT }}
                >
                  REFORMER
                </div>
                <div
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-mono-jb font-medium"
                  style={{ background: 'rgba(244,114,182,0.12)', color: MAT_ACCENT }}
                >
                  MAT
                </div>
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80 ml-1">
                  Exercise Progressions Reference
                </h2>
              </div>
              <p className="text-[11px] font-mono-jb text-white/35 mt-1">
                Beginner → Intermediate → Advanced progressions across core reformer and mat exercises
              </p>
            </div>

            {/* Mobile-friendly stacked cards */}
            <div className="divide-y divide-white/[0.06]">
              {REFORMER_PROGRESSIONS.map((row, i) => (
                <div key={row.exercise} className="px-4 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: i % 2 === 0 ? REFORMER_ACCENT : MAT_ACCENT }}
                    />
                    <span
                      className="font-rajdhani font-bold text-sm tracking-wide"
                      style={{ color: i % 2 === 0 ? REFORMER_ACCENT : MAT_ACCENT }}
                    >
                      {row.exercise}
                    </span>
                    <span className="text-[10px] font-mono-jb text-white/30 ml-auto">
                      {row.target}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { level: 'Beginner', content: row.beginner, color: '#34d399' },
                      { level: 'Intermediate', content: row.intermediate, color: '#60a5fa' },
                      { level: 'Advanced', content: row.advanced, color: '#f472b6' },
                    ].map((tier) => (
                      <div
                        key={tier.level}
                        className="rounded-xl p-2.5"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <p
                          className="text-[9px] font-mono-jb font-bold uppercase tracking-widest mb-1.5"
                          style={{ color: tier.color }}
                        >
                          {tier.level}
                        </p>
                        <p className="text-[11px] font-mono-jb text-white/50 leading-relaxed">
                          {tier.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Table footer */}
            <div className="px-4 py-3 bg-white/[0.02] border-t border-white/[0.06]">
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <span className="flex items-center gap-1.5 text-[10px] font-mono-jb text-white/35">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: REFORMER_ACCENT }} />
                  Reformer primary
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono-jb text-white/35">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: MAT_ACCENT }} />
                  Mat primary / dual-modality
                </span>
                <span className="text-[10px] font-mono-jb text-white/25 ml-auto">
                  Spring load: light = 1 spring | medium = 2 | heavy = 3+
                </span>
              </div>
            </div>
          </div>

          {/* ── Pilates Principles Quick Reference ────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                  Six Pilates Principles — Neuroscience Alignment
                </h2>
              </div>
              <p className="text-[11px] font-mono-jb text-white/35 mt-0.5">
                Anderson & Spector 2000; Wulf 2016 (attentional focus); cerebellar motor learning literature
              </p>
            </div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
              {[
                {
                  category: 'Cognitive / Attentional',
                  color: '#f472b6',
                  items: [
                    'Concentration: internal focus → +15–25% motor cortex activation',
                    'Precision: error-based learning drives cerebellar adaptation',
                    'Control: cortical override of habitual movement patterns',
                    'Centering: attention to powerhouse = sustained TrA pre-activation',
                  ],
                },
                {
                  category: 'Movement / Physiological',
                  color: '#34d399',
                  items: [
                    'Flow: smooth movement requires predictive cerebellar control',
                    'Breathing: respiratory-motor coupling improves efficiency',
                    'Exhale on exertion: maximises IAP via diaphragm + TrA + PF',
                    'Slow tempo: sustains >30 s endurance holds for Type I fibers',
                  ],
                },
              ].map((group) => (
                <div key={group.category} className="px-4 py-4">
                  <p
                    className="text-[10px] font-mono-jb font-medium uppercase tracking-widest mb-3"
                    style={{ color: group.color }}
                  >
                    {group.category}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs text-white/50 font-mono-jb leading-relaxed"
                      >
                        <span
                          className="inline-block w-1 h-1 rounded-full shrink-0 mt-1.5"
                          style={{ background: group.color, opacity: 0.6 }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* ── Clinical Outcomes Summary ──────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-orange-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                  Pilates vs Comparators — Outcome Summary
                </h2>
              </div>
              <p className="text-[11px] font-mono-jb text-white/35 mt-0.5">
                Cruz-Ferreira 2011; Bird 2012; Wells 2014; Hides 2001
              </p>
            </div>

            {/* Comparison grid */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    <th className="px-4 py-2.5 text-left text-[10px] font-mono-jb text-white/35 uppercase tracking-widest font-medium">
                      Outcome Domain
                    </th>
                    {[
                      { label: 'Pilates', color: '#f472b6' },
                      { label: 'Yoga', color: '#a78bfa' },
                      { label: 'Resistance', color: '#60a5fa' },
                      { label: 'General Ex.', color: '#34d399' },
                    ].map((col) => (
                      <th
                        key={col.label}
                        className="px-3 py-2.5 text-center text-[10px] font-mono-jb uppercase tracking-widest font-bold"
                        style={{ color: col.color }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {[
                    { domain: 'Core endurance', scores: ['●●●', '●●○', '●○○', '●○○'] },
                    { domain: 'Flexibility', scores: ['●●○', '●●●', '●○○', '●○○'] },
                    { domain: 'Balance', scores: ['●●●', '●●○', '●●○', '●○○'] },
                    { domain: 'LBP reduction', scores: ['●●●', '●●○', '●○○', '●●○'] },
                    { domain: 'Max strength', scores: ['●○○', '●○○', '●●●', '●●○'] },
                    { domain: 'Mindfulness', scores: ['●●○', '●●●', '○○○', '○○○'] },
                    { domain: 'Bone density', scores: ['●●○', '●○○', '●●●', '●○○'] },
                    { domain: 'Proprioception', scores: ['●●●', '●●○', '●○○', '○○○'] },
                  ].map((row, ri) => (
                    <tr key={row.domain} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                      <td className="px-4 py-2.5 text-[11px] font-mono-jb text-white/55">{row.domain}</td>
                      {row.scores.map((score, si) => {
                        const colors = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399']
                        return (
                          <td key={si} className="px-3 py-2.5 text-center">
                            <span
                              className="text-sm tracking-widest"
                              style={{ color: colors[si], opacity: 0.80 }}
                            >
                              {score}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-white/[0.06] flex gap-4 flex-wrap">
              <span className="text-[9px] font-mono-jb text-white/25">● = strong evidence</span>
              <span className="text-[9px] font-mono-jb text-white/25">●○ = moderate evidence</span>
              <span className="text-[9px] font-mono-jb text-white/25">○○○ = minimal evidence</span>
            </div>
          </div>

          {/* ── Science note ──────────────────────────────────────────────────── */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <div className="flex items-start gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-white/25 mt-0.5 shrink-0" />
              <p className="text-[11px] font-mono-jb text-white/30 leading-relaxed">
                Evidence sources: McGill 2001 (J Spinal Disord), Hodges & Richardson 1996 (Spine),
                Hides 1994 & 2001 (Spine), Akuthota 2008 (Sports Health), Stokes 2010 (Spine),
                Wells 2014 (J Orthop Sports Phys Ther), Rydeard 2006 (J Orthop Sports Phys Ther),
                Gladwell 2006 (Physiotherapy), Kloubec 2010 (J Strength Cond Res),
                Phrompaet 2011 (Asian J Sports Med), Pata 2014 (J Body Mov Ther),
                Tolnai 2016 (Eur J Sport Sci), Anderson & Spector 2000,
                Wulf 2016 (attentional focus), Cruz-Ferreira 2011, Bird 2012.
                This page is for educational purposes only. Always consult a qualified physiotherapist
                or certified Pilates instructor for personalised guidance, especially when managing
                injury, chronic pain, or post-surgical rehabilitation.
              </p>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}

// ─── Card Icon helper ─────────────────────────────────────────────────────────

function CardIcon({
  type,
  color,
}: {
  type: 'layers' | 'activity' | 'zap' | 'compare'
  color: string
}) {
  const cls = 'w-4 h-4'
  if (type === 'layers') return <Layers className={cls} style={{ color }} />
  if (type === 'activity') return <Activity className={cls} style={{ color }} />
  if (type === 'zap') return <Zap className={cls} style={{ color }} />
  return <GitCompare className={cls} style={{ color }} />
}

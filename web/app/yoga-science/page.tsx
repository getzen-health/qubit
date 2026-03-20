// Yoga Science — server component
// Evidence-based guide covering flexibility, pranayama, mental health, and aging adaptations from yoga practice.

import Link from 'next/link'
import { ArrowLeft, FlaskConical, Wind, Brain, Dumbbell, Leaf } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

// ─── Yoga Styles Reference ────────────────────────────────────────────────────

const YOGA_STYLES = [
  {
    name: 'Hatha',
    met: '3.0–3.5',
    focus: 'Foundational poses, alignment, breath coordination',
    accent: '#a78bfa',
  },
  {
    name: 'Vinyasa',
    met: '4.0–6.0',
    focus: 'Flow between poses, cardiovascular demand, functional strength',
    accent: '#60a5fa',
  },
  {
    name: 'Ashtanga',
    met: '5.0–7.0',
    focus: 'Fixed sequence, progressive intensity, discipline, heat generation',
    accent: '#f97316',
  },
  {
    name: 'Yin',
    met: '1.5–2.5',
    focus: 'Deep connective tissue, passive holds 3–5 min, joint mobility',
    accent: '#34d399',
  },
  {
    name: 'Restorative',
    met: '1.0–2.0',
    focus: 'Parasympathetic activation, nervous system recovery, deep relaxation',
    accent: '#f472b6',
  },
  {
    name: 'Bikram',
    met: '4.0–5.5',
    focus: '26-pose sequence in 40°C heat, detox, cardiovascular stress response',
    accent: '#fb923c',
  },
]

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    label: 'ROM Gain per Session',
    value: '4–8°',
    sub: 'flexibility increase over 6-week yoga practice (Behm 2016)',
    accent: '#a78bfa',
  },
  {
    label: 'GABA Increase',
    value: '+27%',
    sub: 'thalamic GABA after 12-week yoga vs walking (Streeter 2010)',
    accent: '#60a5fa',
  },
  {
    label: 'Fall Risk Reduction',
    value: '−35%',
    sub: '1-year yoga in women >65 (Youkhana 2016 meta-analysis)',
    accent: '#34d399',
  },
]

// ─── Science Cards Data ───────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'flexibility',
    title: 'Flexibility, Mobility & Joint Health',
    accent: '#a78bfa',
    accentBg: 'rgba(167,139,250,0.07)',
    accentBorder: 'rgba(167,139,250,0.22)',
    accentPill: 'rgba(167,139,250,0.15)',
    icon: 'leaf' as const,
    findings: [
      {
        citation: 'Behm 2016 — British Journal of Sports Medicine',
        detail:
          'Flexibility mechanisms: acute yoga stretching increases ROM via two concurrent pathways — neuromuscular inhibition (GTO activation reduces alpha-motoneuron excitability, reducing muscle spindle resistance) and viscoelastic deformation of fascial and connective tissue. Static holds ≥30 s at end-range are required to achieve both simultaneously. Flexibility improves 4–8° per session over 6 weeks of consistent practice. Yoga\'s sustained poses (30–90 s) sit precisely within this optimal window. Multi-joint movements in yoga sequences are uniquely efficient for achieving whole-body flexibility gains versus isolated single-joint stretching protocols.',
      },
      {
        citation: 'Brito 2012 — European Journal of Preventive Cardiology',
        detail:
          'The sit-and-rise test quantifies the ability to lower to the floor and stand without hand or knee support — a composite measure of strength, flexibility, and motor coordination. In 2,002 Brazilian adults aged 51–80, a score <8/10 was associated with 5–6× higher 10-year all-cause mortality after controlling for age, sex, BMI, and physical activity. Hip flexor tightness is mechanistically linked: anterior pelvic tilt increases compressive lumbar loading by 40–60%. Yoga hip openers (pigeon, lizard, happy baby) specifically target this most functionally important flexibility domain, making yoga one of the most lifespan-relevant exercise modalities for adults over 50.',
      },
      {
        citation: 'Cramer 2013 — Clinical Journal of Pain (Meta-analysis, 12 RCTs)',
        detail:
          'Meta-analysis of 12 randomised controlled trials found yoga ≥4 weeks significantly reduced chronic low back pain intensity (SMD −0.48) and disability (SMD −0.59), with effects maintained at 6-month follow-up. Proposed mechanisms include improved activation of the multifidus and transversus abdominis (deep stabilising muscles), and reduced lumbar erector spinae hypertonicity. The WHO (2016 guidelines) now recommends yoga as a first-line non-pharmacologic intervention for chronic LBP alongside exercise therapy and manual therapy.',
      },
      {
        citation: 'Balasubramaniam 2013 — Yoga vs Conventional Stretching',
        detail:
          'Yoga uniquely combines ROM work with load-bearing isometric contractions held in end-range positions — producing simultaneous flexibility AND strength adaptations that conventional stretching cannot match. Over 10 weeks, yoga produced +12° passive ROM and +18% eccentric strength, versus flexibility-only training which yielded +8° PROM with no strength gain. Cross-sectional analysis confirms yoga practitioners have 15–22% greater ROM than non-practitioners matched for age, sex, and total activity level — a structural adaptation specific to yoga\'s end-range loading methodology.',
      },
    ],
  },
  {
    id: 'pranayama',
    title: 'Pranayama & Autonomic Nervous System',
    accent: '#60a5fa',
    accentBg: 'rgba(96,165,250,0.07)',
    accentBorder: 'rgba(96,165,250,0.22)',
    accentPill: 'rgba(96,165,250,0.15)',
    icon: 'wind' as const,
    findings: [
      {
        citation: 'Brown 2009 — Journal of Alternative and Complementary Medicine',
        detail:
          'Slow breathing at 5–6 breaths per minute (Ujjayi and Nadi Shodhana pranayama) maximally activates respiratory sinus arrhythmia (RSA) — the synchronisation of heart rate oscillation with the breathing cycle. Resonance breathing at the 0.1 Hz frequency increases HRV 40–80% acutely by entraining baroreceptor and RSA feedback loops. Chronic practice over 8 weeks produces lasting autonomic remodelling: resting HRV +15–25% and resting heart rate −4–7 bpm, comparable to moderate aerobic conditioning but via parasympathetic rather than cardiac output pathways.',
      },
      {
        citation: 'Jerath 2006 — Medical Hypotheses',
        detail:
          'Pranayama activates the vagus nerve through pulmonary stretch receptors (Hering-Breuer reflex) → nucleus tractus solitarius (NTS) → dorsal vagal complex. The vagus mediates approximately 75% of total parasympathetic output, regulating heart, lungs, gastrointestinal tract, and immune function. A single 20-minute pranayama session reduces salivary cortisol 22% and increases oxytocin 24% — the stress-down, bonding-up hormonal signature that partially explains yoga\'s mood and social bonding benefits across clinical populations.',
      },
      {
        citation: 'Pascoe 2017 — Psychoneuroendocrinology (42-RCT Meta-analysis)',
        detail:
          'In direct comparison with aerobic exercise, yoga reduces cortisol 18% vs aerobic 14%, and reduces salivary alpha-amylase (sympathetic marker) by 16%. Pascoe\'s mega-review of 42 RCTs confirms yoga reduces anxiety (d=0.55) and depression (d=0.59) — effect sizes comparable to antidepressants for mild-moderate presentations. Emergency breath regulation using 4-7-8 and box breathing techniques activates the vagal brake within 90 seconds through the same pulmonary-vagal mechanism, making pranayama the most evidence-dense immediate anxiety intervention available without pharmacology.',
      },
      {
        citation: 'Telles 2013 — Evidence-Based Complementary and Alternative Medicine',
        detail:
          'Different pranayama techniques activate opposite branches of the autonomic nervous system. Kapalabhati (breath of fire: rapid forced exhalations) is sympathetically activating — increasing circulating norepinephrine by 15% and improving alertness scores on cognitive tests. Slow pranayama (Anulom Vilom alternate nostril, Bhramari humming breath) activates the parasympathetic branch. Sequentially mixing stimulating and calming pranayama within a session trains "autonomic flexibility" — the rapid switching between sympathetic and parasympathetic states that is the physiological correlate of emotional regulation capacity in both neuroscience and clinical psychology.',
      },
    ],
  },
  {
    id: 'mental',
    title: 'Mental Health & Neurological Effects',
    accent: '#34d399',
    accentBg: 'rgba(52,211,153,0.07)',
    accentBorder: 'rgba(52,211,153,0.22)',
    accentPill: 'rgba(52,211,153,0.15)',
    icon: 'brain' as const,
    findings: [
      {
        citation: 'Khalsa 2012 — Psychological Studies / van der Kolk 2014',
        detail:
          'A 10-week Kripalu yoga RCT in trauma-exposed women significantly reduced PTSD symptom scores on the Clinician-Administered PTSD Scale. Yoga\'s unique contribution is addressing somatic (body-level) disturbances — the interoceptive dysregulation (inability to sense the body accurately) that psychotherapy and medication do not directly target. Interoceptive training in yoga restores disrupted body awareness and shifts autonomic set-point. In small comparative RCTs, yoga reduced PTSD symptoms as effectively as EMDR (van der Kolk 2014), now validating yoga as an adjunct to PTSD trauma treatment protocols in several NICE-affiliated guidelines.',
      },
      {
        citation: 'Gard 2014 — Frontiers in Human Neuroscience',
        detail:
          'Structural MRI comparison of long-term yoga practitioners vs matched controls revealed 17% greater somatosensory cortex gray matter volume, along with significantly greater cortical thickness in the insula (interoception center), inferior parietal cortex, and prefrontal cortex. Effects correlated positively with years of practice (r=0.61–0.74). Prefrontal cortical thickening is particularly significant as this region normally thins with age at ~0.5% per year — yoga practitioners show substantially attenuated age-related cortical thinning, consistent with the "use-dependent" neuroplasticity model.',
      },
      {
        citation: 'Streeter 2010 — Journal of Alternative and Complementary Medicine',
        detail:
          'In a 12-week RCT comparing yoga to walking (matched for duration and exertion), the yoga group showed a 27% increase in thalamic GABA levels measured by MRS spectroscopy — a gold-standard neuroimaging technique. The walking group showed no significant GABA change despite similar energy expenditure and duration. GABA (gamma-aminobutyric acid) is the brain\'s primary inhibitory neurotransmitter; chronically low GABA is implicated in anxiety, depression, and PTSD. Yoga\'s GABA-boosting mechanism remains under investigation but likely involves the integrated breath-posture-attention practice creating unique neurological entrainment not achieved by movement alone.',
      },
      {
        citation: 'Field 2011 — Complementary Therapies in Clinical Practice',
        detail:
          'Yoga increases circulating serotonin, BDNF (brain-derived neurotrophic factor), and norepinephrine while reducing cortisol — a neurochemical profile directly overlapping with antidepressant mechanisms. As few as 20 minutes of sun salutations (Surya Namaskar) 4 days/week shows measurable antidepressant effects within 4 weeks. Yoga supplements antidepressant medication more effectively than placebo comparators in combined-treatment trials. Additional psychosocial pathways — body image improvement, social bonding in group classes, and mastery of challenging poses — add meaningfully to the biological effect via overlapping serotonergic and reward system pathways.',
      },
    ],
  },
  {
    id: 'strength',
    title: 'Strength, Balance & Aging',
    accent: '#fb923c',
    accentBg: 'rgba(251,146,60,0.07)',
    accentBorder: 'rgba(251,146,60,0.22)',
    accentPill: 'rgba(251,146,60,0.15)',
    icon: 'dumbbell' as const,
    findings: [
      {
        citation: 'Tran 2001 — American Journal of Physiology',
        detail:
          '8-week Hatha yoga intervention produced remarkable muscular fitness improvements: +31% muscular endurance, +13% isokinetic strength, and +188% static balance score versus matched controls. The strength gains are mechanistically explained by yoga\'s extensive use of isometric holds (45–90 s) that intensely recruit slow-twitch (Type I) muscle fibers — the same fibers prioritised by stabilisation training. Additionally, slow eccentric loading during pose transitions and sustained compression during holds improve connective tissue hydration, increasing fascial elasticity and joint surface nutrition in a way that traditional resistance training does not.',
      },
      {
        citation: 'Youkhana 2016 — Disability & Rehabilitation (Meta-analysis, 9 RCTs)',
        detail:
          'Meta-analysis of 9 RCTs confirmed yoga improves balance with a moderate effect size (d=0.52) in older adults — statistically and clinically significant for fall prevention. A 1-year yoga program in women over 65 reduced falls by 35%. Mechanistically, single-leg balance poses (tree, warrior III, half-moon) simultaneously train proprioceptive integration, hip abductor neuromuscular control, and ankle-ankle strategy — the three pillars of fall prevention. Single-leg poses held ≥30 s are the most effective specific element: tree pose and warrior III produce the greatest postural sway reduction in intervention trials.',
      },
      {
        citation: 'Fishman 2016 — Topics in Geriatric Rehabilitation',
        detail:
          '12 consecutive yoga poses held ≥30 s per day for 2 years increased bone mineral density in the lumbar spine and hip in patients with osteopenia and osteoporosis — populations where most exercise interventions show no benefit. The mechanism is Wolff\'s Law: yoga produces mechanical loading well above the minimum effective strain threshold (1,500–3,000 microstrain) needed to stimulate osteoblast activity, particularly in axial and femoral bone. Comparative context: weight-bearing yoga produces superior bone density outcomes vs swimming (non-weight-bearing) and comparable to walking, but inferior to running for cortical bone at the tibia.',
      },
      {
        citation: 'Hagins 2007 — Medicine & Science in Sports & Exercise',
        detail:
          'Direct metabolic measurement quantified yoga energy expenditure: Hatha yoga averages 3.2 METs (light intensity), Vinyasa/Power yoga 4.0–6.0 METs (moderate), Bikram 4.0–5.5 METs (moderate, thermally elevated). Yoga alone is insufficient to meet WHO aerobic guidelines (150 min/week moderate intensity) as a sole exercise modality. However, yoga\'s cardiovascular benefits operate through orthogonal mechanisms — autonomic remodelling, anti-inflammatory cytokine reduction, and cortisol suppression — that produce meaningful cardiovascular risk reduction independent of VO₂max or cardiac output adaptations. WHO recommends yoga as a complement to aerobic and resistance training, not a replacement.',
      },
    ],
  },
]

// ─── Icon helper ──────────────────────────────────────────────────────────────

function CardIcon({ type, color }: { type: typeof SCIENCE_CARDS[0]['icon']; color: string }) {
  const cls = 'w-4 h-4'
  if (type === 'leaf') return <Leaf className={cls} style={{ color }} />
  if (type === 'wind') return <Wind className={cls} style={{ color }} />
  if (type === 'brain') return <Brain className={cls} style={{ color }} />
  return <Dumbbell className={cls} style={{ color }} />
}

// ─── HRV Improvement Visual (SVG, server renderable) ─────────────────────────

const HRV_DATA = [
  { week: 0, baseline: 42, yoga: 42 },
  { week: 2, baseline: 43, yoga: 46 },
  { week: 4, baseline: 43, yoga: 50 },
  { week: 6, baseline: 44, yoga: 55 },
  { week: 8, baseline: 44, yoga: 58 },
]

const HRV_W = 480
const HRV_H = 140
const HRV_PAD_L = 36
const HRV_PAD_R = 16
const HRV_PAD_T = 12
const HRV_PAD_B = 28
const HRV_PLOT_W = HRV_W - HRV_PAD_L - HRV_PAD_R
const HRV_PLOT_H = HRV_H - HRV_PAD_T - HRV_PAD_B
const HRV_MIN = 38
const HRV_MAX = 65

function hrvX(weekIndex: number): number {
  return HRV_PAD_L + (weekIndex / (HRV_DATA.length - 1)) * HRV_PLOT_W
}

function hrvY(val: number): number {
  return HRV_PAD_T + HRV_PLOT_H - ((val - HRV_MIN) / (HRV_MAX - HRV_MIN)) * HRV_PLOT_H
}

function buildLinePath(key: 'baseline' | 'yoga'): string {
  return HRV_DATA.map((d, i) => {
    const x = hrvX(i)
    const y = hrvY(d[key])
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function buildAreaPath(key: 'baseline' | 'yoga'): string {
  const points = HRV_DATA.map((d, i) => `${hrvX(i).toFixed(1)},${hrvY(d[key]).toFixed(1)}`)
  const bottom = HRV_PAD_T + HRV_PLOT_H
  return `M ${points[0]} L ${points.join(' L ')} L ${hrvX(HRV_DATA.length - 1).toFixed(1)},${bottom} L ${HRV_PAD_L},${bottom} Z`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function YogaSciencePage() {
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
              <Leaf className="w-4 h-4 text-purple-400" />
              <h1 className="font-rajdhani text-lg font-bold leading-tight tracking-wide text-white">
                Yoga Science
              </h1>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              Evidence-Based Practice
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6">

          {/* ── Hero ──────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl p-2.5 bg-purple-500/15 shrink-0">
                <Leaf className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="font-rajdhani text-2xl font-bold text-white tracking-wide leading-tight">
                  The Physiology of Yoga
                </h2>
                <p className="mt-1.5 text-sm text-white/55 leading-relaxed max-w-xl">
                  Peer-reviewed evidence on how sustained postures, controlled breathing, and mindful movement
                  restructure the nervous system, connective tissue, brain chemistry, and musculoskeletal architecture.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Flexibility', 'Pranayama', 'Neuroplasticity', 'Longevity', 'Autonomic'].map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-mono-jb"
                      style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd' }}
                    >
                      {tag}
                    </span>
                  ))}
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
                  className="font-rajdhani text-4xl font-bold leading-none mt-2"
                  style={{ color: stat.accent }}
                >
                  {stat.value}
                </p>
                <p className="text-[11px] font-mono-jb text-white/35 mt-1.5 leading-relaxed">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* ── HRV Chart ─────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                  HRV Response: Pranayama Practice vs Baseline (8 Weeks)
                </h2>
              </div>
              <p className="text-[11px] font-mono-jb text-white/35 mt-0.5">
                Brown 2009 — resonance breathing at 0.1 Hz; chronic HRV uplift of 15–25%
              </p>
            </div>

            <div className="px-4 py-4 overflow-x-auto">
              <svg
                viewBox={`0 0 ${HRV_W} ${HRV_H}`}
                className="w-full min-w-[280px]"
                style={{ height: HRV_H }}
                aria-label="HRV improvement over 8 weeks of pranayama practice vs baseline"
              >
                <defs>
                  <linearGradient id="yoga-hrv-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="baseline-hrv-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6b7280" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6b7280" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid */}
                {[40, 45, 50, 55, 60].map((val) => {
                  const y = hrvY(val)
                  return (
                    <g key={val}>
                      <line
                        x1={HRV_PAD_L} y1={y}
                        x2={HRV_W - HRV_PAD_R} y2={y}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="1"
                      />
                      <text
                        x={HRV_PAD_L - 4}
                        y={y + 3.5}
                        textAnchor="end"
                        fill="rgba(255,255,255,0.25)"
                        fontSize="9"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {val}
                      </text>
                    </g>
                  )
                })}

                {/* X-axis labels */}
                {HRV_DATA.map((d, i) => (
                  <text
                    key={d.week}
                    x={hrvX(i)}
                    y={HRV_H - 6}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.25)"
                    fontSize="9"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {d.week === 0 ? 'Start' : `Wk ${d.week}`}
                  </text>
                ))}

                {/* Area fills */}
                <path d={buildAreaPath('baseline')} fill="url(#baseline-hrv-grad)" />
                <path d={buildAreaPath('yoga')} fill="url(#yoga-hrv-grad)" />

                {/* Lines */}
                <path
                  d={buildLinePath('baseline')}
                  fill="none"
                  stroke="rgba(107,114,128,0.55)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <path
                  d={buildLinePath('yoga')}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                {/* Data points — yoga */}
                {HRV_DATA.map((d, i) => (
                  <circle
                    key={i}
                    cx={hrvX(i)}
                    cy={hrvY(d.yoga)}
                    r="3"
                    fill="#60a5fa"
                    stroke="#0a0a0a"
                    strokeWidth="1.5"
                  />
                ))}

                {/* Y-axis label */}
                <text
                  x={8}
                  y={HRV_PAD_T + HRV_PLOT_H / 2}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.20)"
                  fontSize="9"
                  fontFamily="'JetBrains Mono', monospace"
                  transform={`rotate(-90, 8, ${HRV_PAD_T + HRV_PLOT_H / 2})`}
                >
                  HRV (ms)
                </text>
              </svg>

              {/* Legend */}
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[10px] font-mono-jb text-white/40">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-5 border-t-2 border-blue-400" style={{ marginBottom: 1 }} />
                  Pranayama group (+27% by week 8)
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-5"
                    style={{ borderTop: '1.5px dashed rgba(107,114,128,0.65)', marginBottom: 1 }}
                  />
                  Sedentary baseline
                </span>
              </div>
            </div>
          </div>

          {/* ── Yoga Styles Reference ─────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-purple-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                  Yoga Styles — MET Values & Physiological Focus
                </h2>
              </div>
              <p className="text-[11px] font-mono-jb text-white/35 mt-0.5">
                Hagins 2007 (Med Sci Sports Exerc) — direct metabolic measurement
              </p>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {YOGA_STYLES.map((style) => {
                const metParts = style.met.split('–').map(Number)
                const metMid = (metParts[0] + metParts[1]) / 2
                const metPct = Math.min(((metMid - 1) / 6) * 100, 100)
                return (
                  <div key={style.name} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="inline-block w-2 h-2 rounded-full shrink-0"
                          style={{ background: style.accent }}
                        />
                        <span
                          className="font-rajdhani font-bold text-base tracking-wide"
                          style={{ color: style.accent }}
                        >
                          {style.name}
                        </span>
                      </div>
                      <span
                        className="text-xs font-mono-jb font-medium shrink-0"
                        style={{ color: style.accent }}
                      >
                        {style.met} METs
                      </span>
                    </div>
                    {/* MET bar */}
                    <div
                      className="h-1.5 rounded-full mb-2.5"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${metPct}%`,
                          background: style.accent,
                          opacity: 0.65,
                        }}
                      />
                    </div>
                    <p className="text-[11px] font-mono-jb text-white/40 leading-relaxed">
                      {style.focus}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* MET scale legend */}
            <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/[0.06] flex justify-between">
              {['1 MET (rest)', '3 MET (light)', '5 MET (moderate)', '7 MET (vigorous)'].map((label) => (
                <span key={label} className="text-[9px] font-mono-jb text-white/20">
                  {label}
                </span>
              ))}
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

          {/* ── Autonomic Quick Reference ──────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-400" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                  Breath Techniques Quick Reference
                </h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
              {[
                {
                  category: 'Parasympathetic (Calm)',
                  color: '#60a5fa',
                  items: [
                    'Ujjayi (ocean breath): 5–6 bpm, RSA resonance',
                    'Nadi Shodhana (alternate nostril): balancing',
                    'Bhramari (humming): vagal stimulation via vibration',
                    'Anulom Vilom: slow, rhythmic, bilateral activation',
                    '4-7-8 breath: vagal brake in <90 seconds',
                    'Box breathing: equal ratio, cortex-down regulation',
                  ],
                },
                {
                  category: 'Sympathetic (Energise)',
                  color: '#fb923c',
                  items: [
                    'Kapalabhati (fire breath): +15% norepinephrine',
                    'Bhastrika (bellows breath): high ventilation rate',
                    'Rapid Surya Bheda: right-nostril dominant',
                    'Mixing both trains autonomic flexibility',
                    'HRV rises 40–80% acutely at 0.1 Hz resonance',
                    'Chronic practice: resting HR −4–7 bpm (8 wks)',
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

          {/* ── Science note ──────────────────────────────────────────────────── */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <div className="flex items-start gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-white/25 mt-0.5 shrink-0" />
              <p className="text-[11px] font-mono-jb text-white/30 leading-relaxed">
                Evidence sources: Behm 2016 (Br J Sports Med), Brito 2012 (Eur J Prev Cardiol),
                Cramer 2013 (Clin J Pain), Balasubramaniam 2013, Brown 2009 (J Altern Complement Med),
                Jerath 2006 (Med Hypotheses), Pascoe 2017 (Psychoneuroendocrinology),
                Telles 2013 (Evid Based Complement Alternat Med), Khalsa 2012 (Psychol Stud),
                van der Kolk 2014, Gard 2014 (Front Hum Neurosci), Streeter 2010 (J Altern Complement Med),
                Field 2011 (Complement Ther Clin Pract), Tran 2001 (Am J Physiol),
                Youkhana 2016 (Disabil Rehabil), Fishman 2016 (Top Geriatr Rehabil),
                Hagins 2007 (Med Sci Sports Exerc).
                This page is for educational purposes only. Always consult a qualified clinician or yoga
                therapist for personalised guidance, especially if managing injury or chronic conditions.
              </p>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}

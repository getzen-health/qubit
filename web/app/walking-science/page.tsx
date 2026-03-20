// Walking Science — server component
// Evidence-based walking science page covering step count outcomes,
// biomechanics & gait, cognitive health, and practical protocols.

export const metadata = { title: 'Walking Science' }

// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '50–70%',
    label: 'Mortality Reduction',
    sub: '7,000–9,999 steps/day vs <5,000 (Paluch 2021)',
    accent: '#22c55e',
  },
  {
    value: '2%',
    label: 'Hippocampal Growth',
    sub: 'Walking 3×/week for 1 year (Erickson 2011)',
    accent: '#a855f7',
  },
  {
    value: '31%',
    label: 'Lower CVD Risk',
    sub: 'Walking ≥2 hours/week (Spartano 2017)',
    accent: '#3b82f6',
  },
]

const STEP_TIERS = [
  {
    label: 'Sedentary',
    range: '<5,000 steps/day',
    color: '#ef4444',
    barPct: 22,
    note: 'Elevated all-cause mortality risk',
  },
  {
    label: 'Low Active',
    range: '5,000–7,499',
    color: '#f97316',
    barPct: 42,
    note: 'Some benefit; below recommended threshold',
  },
  {
    label: 'Somewhat Active',
    range: '7,500–9,999',
    color: '#eab308',
    barPct: 60,
    note: '50–70% mortality reduction vs sedentary',
  },
  {
    label: 'Active',
    range: '10,000–12,499',
    color: '#84cc16',
    barPct: 78,
    note: 'Benefit plateaus; pace matters more here',
  },
  {
    label: 'Highly Active',
    range: '≥12,500',
    color: '#22c55e',
    barPct: 92,
    note: 'Elite daily step accumulation',
  },
]

const SCIENCE_CARDS = [
  {
    id: 'step-count',
    icon: 'S',
    iconBg: 'rgba(34,197,94,0.15)',
    iconBorder: 'rgba(34,197,94,0.35)',
    iconColor: '#86efac',
    title: 'Step Count & Health Outcomes',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.25)',
    facts: [
      {
        citation: 'Paluch 2021 (JAMA Neurology)',
        text: '7,000–9,999 steps/day reduces all-cause mortality 50–70% compared to fewer than 5,000 steps. Benefit plateaus around 10,000 steps with no additional survival gain beyond that threshold. In adults over 60, the optimal range narrows to 6,000–8,000 steps/day. Critically, the "10,000 steps" target originated from a 1960s Japanese pedometer marketing campaign (manpo-kei — "10,000 step meter"), not from clinical research. Any increase from a sedentary baseline produces measurable and immediate health benefit.',
        stat: '7,000–9,999 steps/day → −50–70% all-cause mortality',
      },
      {
        citation: 'Saint-Maurice 2020 (JAMA Internal Medicine)',
        text: 'Stepping pace independently predicts mortality after statistically controlling for total step count. Achieving ≥100 steps/min (brisk walking) significantly reduces cardiovascular disease risk. Cadence classification: <60 steps/min = slow, 60–99 = purposeful, ≥100 = moderate-to-vigorous intensity. "Incidental steps" accumulated at slow cadence provide substantially less cardiovascular stimulus than intentional brisk walking at the same total volume.',
        stat: '≥100 steps/min (brisk) → significantly reduced CVD risk',
      },
      {
        citation: 'Tudor-Locke 2011 (Int J Behav Nutr Phys Act)',
        text: 'Healthy adults naturally accumulate 7,000–13,000 steps/day without any intentional exercise. Sedentary behaviour is defined as fewer than 5,000 steps/day; highly active adults reach ≥12,500. Household and occupational activity contributes 60–75% of daily steps in the general population. Office workers average only 3,000–5,000 steps on workdays. Standing desks modestly increase steps by approximately 700–900/day.',
        stat: 'Office workers: 3,000–5,000 steps/workday; highly active: ≥12,500',
      },
      {
        citation: 'Spartano 2017 (Am Heart J)',
        text: 'Framingham Heart Study data: walking ≥2 hours per week reduces 10-year cardiovascular disease risk by 31%. Each additional hour of weekly walking lowers blood pressure by 1.5 mmHg, triglycerides by 8%, and raises HDL cholesterol by 3%. Mechanisms include improved insulin sensitivity, reduction of visceral adipose tissue, and decreased sympathetic nervous system tone — all independent of body weight changes.',
        stat: '≥2 h/week walking → −31% 10-year CVD risk; +1 h → −1.5 mmHg BP',
      },
    ],
  },
  {
    id: 'biomechanics',
    icon: 'B',
    iconBg: 'rgba(59,130,246,0.15)',
    iconBorder: 'rgba(59,130,246,0.35)',
    iconColor: '#93c5fd',
    title: 'Walking Biomechanics & Gait',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    facts: [
      {
        citation: 'Kirtley 2006 (Clinical Gait Analysis)',
        text: 'The gait cycle divides into stance phase (60%: initial contact, loading response, mid-stance, terminal stance, pre-swing) and swing phase (40%). Double support — both feet on the ground simultaneously — occurs twice per cycle at approximately 10% each. Walking speed is the product of stride length and cadence. Optimal self-selected cadence is 100–120 steps/min. Walking is 60–70% passive energy-recovery (inverted pendulum model), in sharp contrast to running, which is nearly entirely active energy expenditure.',
        stat: 'Stance 60% / Swing 40%; optimal cadence 100–120 spm; 60–70% passive energy',
      },
      {
        citation: 'Studenski 2011 (JAMA)',
        text: 'Usual gait speed in adults aged ≥65 predicts 10-year survival with 80% accuracy — establishing it as the "sixth vital sign." Classification: <0.6 m/s = severely limited, 0.6–0.99 m/s = impaired, ≥1.0 m/s = normal. Each 0.1 m/s increase in gait speed corresponds to a 12% reduction in mortality risk. Gait speed is more predictive of mortality than many standard laboratory tests including serum biomarkers.',
        stat: '+0.1 m/s gait speed → −12% 10-year mortality; ≥1.0 m/s = normal',
      },
      {
        citation: 'Callisaya 2010 (Stroke)',
        text: 'Gait variability — step-to-step coefficient of variation exceeding 2% — independently predicts fall risk. Dual-task walking (maintaining a conversation while walking) increases gait variability by 15–35%, reflecting impaired cognitive-motor integration. Tai chi practice reduces falls by 35–47% (Li 2005, NEJM), likely by improving this integration. Variability is pathologically worsened by peripheral neuropathy, vestibular dysfunction, and cerebellar disorders.',
        stat: 'Step CV >2% predicts falls; dual-task walking ↑ variability 15–35%',
      },
      {
        citation: 'Menz 2003 (J Biomechanics)',
        text: 'Healthy aging reduces gait speed by 1–2% per year after age 70. Stride length decreases while cadence is maintained. Double support duration increases with age. Foot clearance (toe-raise height) decreases, raising tripping risk substantially. Crucially, physically active older adults maintain gait speeds comparable to sedentary adults 15–20 years their junior — demonstrating that these changes are not biologically inevitable but are largely disuse-driven.',
        stat: 'Active older adults: gait speed of sedentary peers 15–20 years younger',
      },
    ],
  },
  {
    id: 'cognitive',
    icon: 'C',
    iconBg: 'rgba(168,85,247,0.15)',
    iconBorder: 'rgba(168,85,247,0.35)',
    iconColor: '#d8b4fe',
    title: 'Walking & Cognitive Health',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.08)',
    accentBorder: 'rgba(168,85,247,0.25)',
    facts: [
      {
        citation: 'Erickson 2011 (PNAS)',
        text: '1-year randomised controlled trial: walking 3 times per week for 40 minutes increased hippocampal volume by 2% in the exercise group, versus a −1.4% shrinkage in the control group. Larger hippocampal volume correlated directly with improved spatial memory performance. Walking also increased serum BDNF (brain-derived neurotrophic factor) by 18%. BDNF drives neurogenesis in the dentate gyrus — making this the first direct proof that aerobic exercise reverses structural brain aging in humans.',
        stat: '3×/week walking → +2% hippocampal volume, +18% BDNF (RCT)',
      },
      {
        citation: 'Zheng 2016 (Neuroscience)',
        text: 'A single 30-minute bout of moderate-intensity walking improves executive function, attention, and processing speed for 30–60 minutes post-exercise. Prefrontal cortex blood flow increases by 14% during walking. Catecholamines (dopamine, norepinephrine) released from the locus coeruleus improve prefrontal cortical signal-to-noise ratio, sharpening cognitive processing. Even a 10-minute walk produces measurable improvements in mood and immediate cognitive function.',
        stat: '30 min walking → +14% prefrontal blood flow; benefits last 30–60 min',
      },
      {
        citation: 'Meng 2020 (BMJ Open)',
        text: 'Meta-analysis of dementia prevention studies: regular walking reduces dementia risk by 21%. A clear dose-response relationship exists — walking 5 or more days per week versus fewer than 1 day provides the greatest protection. Mechanisms are multi-pathway: improved cerebrovascular health (reduction of white matter lesions), promotion of neuroplasticity via BDNF upregulation, and systemic reduction of inflammatory cytokines that accelerate neurodegeneration.',
        stat: 'Regular walking → −21% dementia risk; 5+ days/week = greatest protection',
      },
      {
        citation: 'Chaddock 2010 (Neuropsychologia)',
        text: 'Children with higher aerobic fitness levels show 12% larger hippocampal volumes, better relational memory, and faster cognitive processing than age-matched low-fitness peers. 20 minutes of daily walking improved standardised test scores by 10–15% in school-based interventions. Aerobic fitness level in childhood predicts executive function capacity 25 years later, establishing youth physical activity as a long-horizon brain-health investment.',
        stat: 'Higher child fitness → 12% larger hippocampus; 20 min/day → +10–15% test scores',
      },
    ],
  },
  {
    id: 'protocols',
    icon: 'P',
    iconBg: 'rgba(20,184,166,0.15)',
    iconBorder: 'rgba(20,184,166,0.35)',
    iconColor: '#5eead4',
    title: 'Practical Walking Protocols',
    accent: '#14b8a6',
    accentBg: 'rgba(20,184,166,0.08)',
    accentBorder: 'rgba(20,184,166,0.25)',
    facts: [
      {
        citation: 'Wahid 2016 (JAMA Intern Med meta-analysis)',
        text: 'Meta-analysis of 280,000 participants: walking 150 minutes per week reduces all-cause mortality by 31%, cardiovascular mortality by 35%, type 2 diabetes incidence by 26%, and depression incidence by 19%. Walking more than 300 minutes per week provides an additional 20% risk reduction. Walking is dose-equivalent to cycling, swimming, or running at the same relative intensity. 30 minutes of brisk walking daily achieves most of the available benefit with minimal injury risk.',
        stat: '150 min/week: −31% all-cause, −35% CVD, −26% T2D, −19% depression',
      },
      {
        citation: 'Dempsey 2016 (Diabetologia) / Dunstan 2012 (Diabetes Care)',
        text: 'Continuous sitting for ≥8 hours per day raises type 2 diabetes risk by 90%, independent of regular exercise performed elsewhere in the day. Brief activity interruptions are powerfully protective: 3-minute light walking every 30 minutes reduces postprandial glucose by 24% and insulin by 22% (Dunstan 2012). Hourly 2-minute walking breaks reduce triglycerides by 11%. These "activity snacks" prevent the acute metabolic derangement caused by prolonged unbroken sitting.',
        stat: '3 min walk/30 min sitting → −24% postprandial glucose, −22% insulin',
      },
      {
        citation: 'Lee 2019 (JAMA Internal Medicine)',
        text: 'Harvard Women\'s Health Study (N = 16,741 women): mortality risk steeply decreased from 2,700 to 7,500 steps per day. No statistically significant additional mortality benefit was observed beyond 7,500 steps per day in women aged 72 and older. Any increase from a sedentary baseline was associated with benefit — the largest gain came from the initial move off the couch. Key message: moving more matters most, even low-intensity step accumulation is protective.',
        stat: 'N=16,741: steepest mortality drop 2,700→7,500 steps; plateau ≥7,500 in women ≥72',
      },
      {
        citation: 'Morris 1953 (Lancet) / Morris & Hardman 1997',
        text: 'The foundational London busmen study: bus conductors who walked 600–700 steps per hour on double-decker buses had a 50% lower coronary heart disease rate than the sedentary drivers. This landmark 1953 Lancet paper established physical activity as a cardiovascular risk factor — the first such evidence in the literature. Morris & Hardman 1997 later demonstrated brisk walking for 30–45 minutes per day, 5 days per week, reduces CHD risk by 30–35%. Walking remains the most evidence-based, lowest-barrier, zero-cost physical activity available to humans.',
        stat: 'Morris 1953: conductors 50% lower CHD vs drivers; 30–45 min/day → −30–35% CHD',
      },
    ],
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  sub,
  accent,
}: {
  value: string
  label: string
  sub: string
  accent: string
}) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderTop: `3px solid ${accent}`,
        borderRadius: 14,
        padding: '18px 16px',
        textAlign: 'center',
        flex: '1 1 0',
        minWidth: 160,
      }}
    >
      <p
        style={{
          fontSize: 32,
          fontWeight: 900,
          color: accent,
          margin: 0,
          letterSpacing: '-1px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '6px 0 3px' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.4 }}>{sub}</p>
    </div>
  )
}

function StepTierChart() {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'rgba(34,197,94,0.08)',
          borderBottom: '1px solid rgba(34,197,94,0.2)',
          borderLeft: '3px solid #22c55e',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 900,
              color: '#86efac',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            N
          </span>
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Daily Step Count Reference
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            Activity classification by steps/day — Tudor-Locke 2011 framework
          </p>
        </div>
      </div>

      <div style={{ padding: '20px 20px 4px' }}>
        {STEP_TIERS.map((tier) => (
          <div key={tier.label} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
                flexWrap: 'wrap',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: tier.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{tier.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    color: '#475569',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {tier.range}
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{tier.note}</span>
            </div>
            <div
              style={{
                height: 10,
                background: '#1a1a1a',
                borderRadius: 5,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${tier.barPct}%`,
                  background: `linear-gradient(90deg, ${tier.color}99, ${tier.color})`,
                  borderRadius: 5,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '8px 20px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: '#334155' }}>0 steps</span>
        <span style={{ fontSize: 11, color: '#334155', fontStyle: 'italic' }}>
          Relative activity classification
        </span>
        <span style={{ fontSize: 11, color: '#334155' }}>≥12,500 steps</span>
      </div>
    </div>
  )
}

function CadenceKey() {
  const zones = [
    { label: 'Slow', range: '<60 spm', color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', note: 'Minimal CV stimulus' },
    { label: 'Purposeful', range: '60–99 spm', color: '#eab308', bg: 'rgba(234,179,8,0.10)', border: 'rgba(234,179,8,0.28)', note: 'Low-moderate intensity' },
    { label: 'Brisk', range: '≥100 spm', color: '#22c55e', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.28)', note: 'Moderate-to-vigorous; CVD protective' },
  ]
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'rgba(59,130,246,0.08)',
          borderBottom: '1px solid rgba(59,130,246,0.2)',
          borderLeft: '3px solid #3b82f6',
          padding: '14px 16px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          Walking Cadence Zones
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
          Steps per minute — intensity classification (Saint-Maurice 2020)
        </p>
      </div>

      <div
        style={{
          padding: '20px',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {zones.map((z) => (
          <div
            key={z.label}
            style={{
              flex: '1 1 160px',
              background: z.bg,
              border: `1px solid ${z.border}`,
              borderRadius: 12,
              padding: '14px 16px',
            }}
          >
            <p
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: z.color,
                margin: '0 0 2px',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                letterSpacing: '-0.5px',
              }}
            >
              {z.range}
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>{z.label}</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.4 }}>{z.note}</p>
          </div>
        ))}
      </div>

      <div
        style={{
          margin: '0 20px 20px',
          padding: '12px 14px',
          background: 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.15)',
          borderRadius: 10,
        }}
      >
        <p style={{ fontSize: 12, color: '#86efac', margin: 0, lineHeight: 1.55 }}>
          <span style={{ fontWeight: 700 }}>Key insight:</span> Two people can accumulate identical
          daily step counts yet experience markedly different cardiovascular outcomes. Pace — not
          just volume — is an independent predictor of mortality after controlling for total steps.
        </p>
      </div>
    </div>
  )
}

function FactRow({ citation, text, stat }: { citation: string; text: string; stat: string }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderBottom: '1px solid #1a1a1a',
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#94a3b8',
          margin: '0 0 6px',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
        }}
      >
        {citation}
      </p>
      <p style={{ fontSize: 13, color: '#cbd5e1', margin: '0 0 8px', lineHeight: 1.6 }}>{text}</p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#e2e8f0',
          margin: 0,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          background: '#1a1a1a',
          borderRadius: 6,
          padding: '4px 8px',
          display: 'inline-block',
        }}
      >
        {stat}
      </p>
    </div>
  )
}

function ScienceCard({
  icon,
  iconBg,
  iconBorder,
  iconColor,
  title,
  accent,
  accentBg,
  accentBorder,
  facts,
}: (typeof SCIENCE_CARDS)[number]) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          background: accentBg,
          borderBottom: `1px solid ${accentBorder}`,
          borderLeft: `3px solid ${accent}`,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: iconBg,
            border: `1px solid ${iconBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 900,
              color: iconColor,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {icon}
          </span>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>{title}</h2>
      </div>

      {/* Facts */}
      {facts.map((fact, i) => (
        <FactRow key={i} {...fact} />
      ))}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WalkingSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f8fafc' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(160deg, #0a0a0a 0%, #0d1a10 40%, #0a1205 70%, #0a0a0a 100%)',
          borderBottom: '1px solid #172417',
          paddingTop: 56,
          paddingBottom: 48,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative rings */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 640,
            height: 640,
            borderRadius: '50%',
            border: '1px solid rgba(34,197,94,0.05)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 420,
            height: 420,
            borderRadius: '50%',
            border: '1px solid rgba(34,197,94,0.08)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 240,
            height: 240,
            borderRadius: '50%',
            border: '1px solid rgba(34,197,94,0.05)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#22c55e',
              margin: '0 0 12px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            Evidence-Based Medicine
          </p>
          <h1
            style={{
              fontSize: 'clamp(32px, 6vw, 52px)',
              fontWeight: 900,
              margin: '0 0 16px',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #22c55e 50%, #14b8a6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Walking Science
          </h1>
          <p
            style={{
              fontSize: 17,
              color: '#94a3b8',
              margin: '0 auto',
              lineHeight: 1.65,
              maxWidth: 560,
            }}
          >
            The most accessible human physical activity — decoded. From step-count mortality curves
            and gait biomechanics to hippocampal neurogenesis and sedentary-break protocols.
          </p>
        </div>
      </div>

      {/* Key stats bar */}
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '32px 20px 0',
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {KEY_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* Step count reference table */}
      <div style={{ maxWidth: 900, margin: '28px auto 0', padding: '0 20px' }}>
        <StepTierChart />
      </div>

      {/* Cadence zones */}
      <div style={{ maxWidth: 900, margin: '24px auto 0', padding: '0 20px' }}>
        <CadenceKey />
      </div>

      {/* Section label */}
      <div style={{ maxWidth: 900, margin: '36px auto 0', padding: '0 20px' }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#475569',
            margin: 0,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}
        >
          Research Summary
        </p>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '6px 0 0', letterSpacing: '-0.5px' }}>
          The Science, Cited
        </p>
      </div>

      {/* Science cards */}
      <div style={{ maxWidth: 900, margin: '20px auto 0', padding: '0 20px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.id} {...card} />
          ))}
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: 32,
            padding: '16px 20px',
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 12,
            borderLeft: '3px solid #22c55e',
          }}
        >
          <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.6 }}>
            <span style={{ color: '#94a3b8', fontWeight: 700 }}>Disclaimer:</span> This page
            summarises peer-reviewed population studies, randomised controlled trials, and
            meta-analyses. Effect sizes reflect relative risk reductions from observational and RCT
            data; individual results will vary. Walking programmes should be progressed gradually,
            particularly in individuals with cardiovascular, musculoskeletal, or neurological
            conditions. Consult a physician before beginning any structured exercise protocol.
          </p>
        </div>
      </div>
    </div>
  )
}

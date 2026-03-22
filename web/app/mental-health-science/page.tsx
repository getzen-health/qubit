// Mental Health Science — server component (no interactivity needed for static content)
// Covers exercise & depression, cognitive health, stress/cortisol, and meditation science.

export const metadata = { title: 'Mental Health Science' }

// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    label: 'Antidepressant Efficacy',
    value: '=',
    sub: 'Exercise vs sertraline for MDD (Blumenthal 1999)',
    accent: '#6366f1',
    detail: 'Exercise matches SSRI effectiveness',
  },
  {
    label: 'Daily Meditation Benefit',
    value: '10 min',
    sub: 'yields 60% of formal 8-week MBSR benefit',
    accent: '#a78bfa',
    detail: 'Significant anxiety & depression relief',
  },
  {
    label: 'Hippocampal Volume',
    value: '+2%',
    sub: '1 year of aerobic exercise (Erickson 2011)',
    accent: '#22c55e',
    detail: 'vs −1.4% in sedentary controls',
  },
  {
    label: 'Relapse Rate at 16 Months',
    value: '30%',
    sub: 'exercise group vs 52% medication group',
    accent: '#3b82f6',
    detail: 'Exercise group had lower MDD relapse',
  },
]

// Dose-response data: exercise frequency vs depression symptom reduction (Cohen's d)
// Derived from Kvam 2016 meta-analysis (23 RCTs)
const DOSE_RESPONSE = [
  { label: '1×/wk', sessions: 1, effectD: 0.22, weeks: '≥8 wks', fill: '#1e3a8a' },
  { label: '2×/wk', sessions: 2, effectD: 0.41, weeks: '≥8 wks', fill: '#1d4ed8' },
  { label: '3×/wk', sessions: 3, effectD: 0.68, weeks: '≥8 wks', fill: '#3b82f6' },
  { label: '4×/wk', sessions: 4, effectD: 0.72, weeks: '≥8 wks', fill: '#60a5fa' },
  { label: '5×/wk', sessions: 5, effectD: 0.70, weeks: '≥8 wks', fill: '#93c5fd' },
]

// Brain regions affected by exercise and meditation
const BRAIN_REGIONS = [
  {
    name: 'Hippocampus',
    x: 50,
    y: 42,
    r: 9,
    color: '#22c55e',
    effects: ['BDNF ↑', '+2% volume', 'Neurogenesis'],
    source: 'Exercise',
  },
  {
    name: 'Prefrontal Cortex',
    x: 50,
    y: 18,
    r: 12,
    color: '#6366f1',
    effects: ['Thickness ↑', 'PFC-amygdala ↑', 'Inhibitory control ↑'],
    source: 'Both',
  },
  {
    name: 'Amygdala',
    x: 35,
    y: 50,
    r: 7,
    color: '#a78bfa',
    effects: ['Gray matter ↓', 'Reactivity ↓', 'Fear circuit ↓'],
    source: 'Meditation',
  },
  {
    name: 'Dorsal Raphe',
    x: 55,
    y: 60,
    r: 6,
    color: '#f97316',
    effects: ['Serotonin synthesis ↑', 'LC inhibition'],
    source: 'Exercise',
  },
  {
    name: 'Anterior Insula',
    x: 28,
    y: 38,
    r: 7,
    color: '#ec4899',
    effects: ['Cortical thickness ↑', 'Interoception ↑'],
    source: 'Meditation',
  },
  {
    name: 'Locus Coeruleus',
    x: 58,
    y: 55,
    r: 5,
    color: '#eab308',
    effects: ['Norepinephrine ↓', 'Anxiety ↓'],
    source: 'Exercise',
  },
]

const SCIENCE_CARDS = [
  {
    icon: 'E',
    iconBg: 'rgba(59,130,246,0.15)',
    iconBorder: 'rgba(59,130,246,0.35)',
    iconColor: '#60a5fa',
    title: 'Exercise & Mental Health',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.10)',
    accentBorder: 'rgba(59,130,246,0.28)',
    facts: [
      {
        citation: 'Blumenthal 1999 — JAMA Internal Med',
        text: 'Exercise vs sertraline for major depressive disorder: both equally effective at 16 weeks. At 16-month follow-up, the exercise group showed significantly lower relapse (30% vs 52%). Exercise increases hippocampal BDNF — the same molecular mechanism as SSRIs — without sexual dysfunction, weight gain, or dependency.',
        stat: 'Relapse: 30% vs 52%',
      },
      {
        citation: 'Kvam 2016 — J Affect Disord meta-analysis (23 RCTs)',
        text: 'Exercise reduces depression with a large effect size d = 0.68. Optimal dose: ≥3 sessions per week for ≥8 weeks. Supervised group exercise carries an additional social benefit beyond the biological mechanisms. Aerobic and resistance training both effective; combined protocols show additive effects.',
        stat: 'Effect size d = 0.68',
      },
      {
        citation: 'Josefsson 2014',
        text: 'Aerobic exercise reduces state anxiety 20–40% acutely — effects begin within 5 minutes of exercise onset. Chronic exercise reduces trait anxiety with effect size d = 0.48. Proposed mechanisms include exercise-induced hyperthermia (reduces muscle tension), monoamine release, and HPA axis recalibration.',
        stat: 'Anxiety ↓ 20–40% acutely',
      },
      {
        citation: 'Hamer 2009',
        text: '5+ years of regular exercise: −30% risk of new-onset depression, −48% risk of new-onset anxiety disorder. In sedentary adults with MDD, exercise is as effective as cognitive-behavioural therapy (CBT). Exercise is the only intervention that simultaneously addresses depression, anxiety, cognitive decline, and cardiometabolic risk.',
        stat: '−48% new-onset anxiety',
      },
    ],
  },
  {
    icon: 'C',
    iconBg: 'rgba(34,197,94,0.15)',
    iconBorder: 'rgba(34,197,94,0.35)',
    iconColor: '#4ade80',
    title: 'Cognitive Health & Neuroplasticity',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.10)',
    accentBorder: 'rgba(34,197,94,0.28)',
    facts: [
      {
        citation: 'Erickson 2011 — PNAS',
        text: '1 year of walking 3×/week increased hippocampal volume +2% vs −1.4% in controls. Larger hippocampal volume correlated with better spatial memory performance. BDNF-driven neurogenesis in the dentate gyrus is the primary mechanism. VO₂max increase was directly proportional to hippocampal volume increase.',
        stat: 'Hippocampus +2% vs −1.4%',
      },
      {
        citation: 'Hillman 2008 — Nat Rev Neurosci',
        text: '20 minutes of moderate exercise immediately improves inhibitory control, attention, and processing speed — effects last 30–60 minutes. Children scored 15% higher on academic tests following 20 minutes of aerobic exercise. Aerobic fitness correlates r = 0.4 with academic achievement across age groups.',
        stat: 'Academic scores +15%',
      },
      {
        citation: 'Lautenschlager 2008 — JAMA',
        text: '24-week exercise program in adults with subjective memory complaints improved the cognitive subscale by 1.3 points vs controls. Exercise improves brain ketone metabolism — providing an alternate fuel source for insulin-resistant neurons. Lifetime regular exercise is associated with a 45–50% reduction in Alzheimer\'s disease risk.',
        stat: 'Alzheimer\'s risk −45–50%',
      },
      {
        citation: 'Kramer 2006',
        text: 'Aerobic exercise doubles BDNF concentration in the hippocampus. IGF-1 (released by exercising muscle) promotes neuronal survival and synaptic plasticity. VEGF drives cerebrovascular angiogenesis — increasing brain blood supply. The "runner\'s high" is produced by endocannabinoids (anandamide), not endorphins — endorphins cannot cross the blood-brain barrier.',
        stat: 'BDNF ×2 in hippocampus',
      },
    ],
  },
  {
    icon: 'S',
    iconBg: 'rgba(249,115,22,0.15)',
    iconBorder: 'rgba(249,115,22,0.35)',
    iconColor: '#fb923c',
    title: 'Stress, Cortisol & Resilience',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.10)',
    accentBorder: 'rgba(249,115,22,0.28)',
    facts: [
      {
        citation: 'Foley 2008',
        text: 'Chronic exercise training blunts the cortisol response to psychological stressors by 20–40% — the cross-stressor adaptation hypothesis. Regularly active adults score 30% lower on the Perceived Stress Scale compared to sedentary peers. Physical stressors and psychological stressors share overlapping HPA axis circuitry; training for one improves tolerance of the other.',
        stat: 'Cortisol response ↓ 20–40%',
      },
      {
        citation: 'Salmon 2001',
        text: 'Trained individuals exhibit improved HPA axis negative feedback — cortisol returns to baseline significantly faster after acute stress. Regular exercisers also display a healthier morning cortisol awakening response (CAR): larger, more phasic peak, reflecting a well-regulated stress axis. Blunted CAR is a biomarker of chronic stress and burnout.',
        stat: 'Faster cortisol recovery',
      },
      {
        citation: 'Greenwood 2003 — Neurosci',
        text: 'Exercise increases serotonin synthesis in the dorsal raphe nucleus, which directly inhibits the locus coeruleus — the brain\'s primary fear and anxiety circuit. Exercise also upregulates GABA receptor density, producing the same calming effect as benzodiazepines without addiction. This dual serotonergic-GABAergic mechanism explains why exercise rivals medication for anxiety disorders.',
        stat: 'Serotonin & GABA both ↑',
      },
      {
        citation: 'Tang 2015 — Nat Rev Neurosci',
        text: 'MBSR reduces salivary cortisol, reduces C-reactive protein (CRP) by 43%, reduces amygdala gray matter density, and increases prefrontal-amygdala connectivity — all measurable after 8 weeks. When mindfulness practice is combined with exercise, additive effects on stress biomarkers are observed; the two interventions target complementary neural circuits.',
        stat: 'CRP ↓ 43% with MBSR',
      },
    ],
  },
  {
    icon: 'M',
    iconBg: 'rgba(167,139,250,0.15)',
    iconBorder: 'rgba(167,139,250,0.35)',
    iconColor: '#c4b5fd',
    title: 'Meditation & Mindfulness Science',
    accent: '#a78bfa',
    accentBg: 'rgba(167,139,250,0.10)',
    accentBorder: 'rgba(167,139,250,0.28)',
    facts: [
      {
        citation: 'Hofmann 2010 — Cog Therapy Res (39 studies)',
        text: 'MBSR reduces anxiety d = 0.97, depression d = 0.95, psychological stress d = 1.23 — effect sizes comparable to pharmacological treatment. The 8-week MBSR protocol is the gold standard, but research shows that 10 minutes per day of mindfulness yields approximately 60% of the formal MBSR benefit (Mrazek 2013: Headspace 10 min/day for 10 days reduced mind-wandering 15%).',
        stat: 'Anxiety d=0.97, Stress d=1.23',
      },
      {
        citation: 'Lazar 2005 — Neuroreport',
        text: 'Long-term meditators have significantly greater cortical thickness in the right anterior insula and right prefrontal cortex — regions governing interoception, attention regulation, and emotional control. Insular cortical thickness correlated directly with years of meditation experience. Meditators showed 40–50% less age-related cortical thinning compared to matched non-meditating controls.',
        stat: '40–50% less cortical thinning',
      },
      {
        citation: 'Davidson 2003 — Psychosom Med',
        text: '8-week MBSR produced a significant left-sided shift in anterior brain activation — a neural signature of positive affect and emotional resilience. Meditators generated greater antibody titers after influenza vaccination, demonstrating measurable immune enhancement. Jacobs 2011: meditators have 30% higher telomerase activity — the enzyme that repairs telomeres and is a direct marker of cellular ageing rate.',
        stat: 'Telomerase activity +30%',
      },
      {
        citation: 'Goyal 2014 — JAMA Internal Med (47 RCTs)',
        text: 'Moderate evidence for mindfulness in anxiety d = 0.38, depression d = 0.30, and pain d = 0.33. App-based delivery is effective: Headspace 10 min/day for 10 days reduces mind-wandering 15% (Mrazek 2013). Even minimal daily practice — as short as 5 minutes — produces measurable changes in self-reported stress within 2 weeks.',
        stat: 'Pain d=0.33, Depression d=0.30',
      },
    ],
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  detail,
}: {
  label: string
  value: string
  sub: string
  accent: string
  detail: string
}) {
  return (
    <div
      style={{
        background: '#111111',
        border: `1px solid ${accent}30`,
        borderRadius: 14,
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <p
        style={{
          fontSize: 30,
          fontWeight: 900,
          color: accent,
          margin: 0,
          letterSpacing: '-1px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '6px 0 2px' }}>
        {label}
      </p>
      <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{sub}</p>
      <p
        style={{
          fontSize: 10,
          color: accent,
          margin: '4px 0 0',
          fontWeight: 600,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        {detail}
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
}: {
  icon: string
  iconBg: string
  iconBorder: string
  iconColor: string
  title: string
  accent: string
  accentBg: string
  accentBorder: string
  facts: { citation: string; text: string; stat: string }[]
}) {
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
        <h3
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#f1f5f9',
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </h3>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {facts.map((fact, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: accent,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  letterSpacing: '0.03em',
                  flexShrink: 0,
                  marginTop: 1,
                  background: `${accent}18`,
                  border: `1px solid ${accent}35`,
                  borderRadius: 4,
                  padding: '2px 6px',
                }}
              >
                {fact.citation}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: accent,
                  flexShrink: 0,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  textAlign: 'right',
                  maxWidth: 170,
                }}
              >
                {fact.stat}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>
              {fact.text}
            </p>
            {i < facts.length - 1 && (
              <div style={{ height: 1, background: '#1a1a1a', marginTop: 6 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dose-Response Graph ───────────────────────────────────────────────────────

function DoseResponseGraph() {
  const maxD = 0.80
  const barWidth = 40

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
          padding: '14px 20px',
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          Exercise Dose-Response: Depression Symptom Reduction
        </h3>
        <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0' }}>
          Kvam 2016 — 23 RCTs — Cohen&apos;s d effect size; ≥8 weeks supervised training
        </p>
      </div>

      <div style={{ padding: '24px 20px 20px' }}>
        {/* Y-axis label */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 160,
              paddingBottom: 28,
              flexShrink: 0,
            }}
          >
            {[0.8, 0.6, 0.4, 0.2, 0].map((tick) => (
              <span
                key={tick}
                style={{
                  fontSize: 9,
                  color: '#475569',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  textAlign: 'right',
                  width: 28,
                  display: 'block',
                }}
              >
                {tick.toFixed(1)}
              </span>
            ))}
          </div>

          {/* Chart area */}
          <div style={{ flex: 1 }}>
            {/* Grid lines */}
            <div style={{ position: 'relative', height: 160 }}>
              {[0, 0.2, 0.4, 0.6, 0.8].map((tick) => (
                <div
                  key={tick}
                  style={{
                    position: 'absolute',
                    bottom: `${(tick / maxD) * 100}%`,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: tick === 0 ? '#2d2d2d' : '#1a1a1a',
                  }}
                />
              ))}

              {/* Threshold line: d=0.5 (medium effect) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: `${(0.5 / maxD) * 100}%`,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: 'rgba(99,102,241,0.4)',
                  borderTop: '1px dashed rgba(99,102,241,0.4)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: `${(0.5 / maxD) * 100 + 1}%`,
                  right: 0,
                  fontSize: 9,
                  color: '#6366f1',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  fontWeight: 700,
                }}
              >
                medium effect
              </span>

              {/* Bars */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  top: 0,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around',
                  gap: 8,
                }}
              >
                {DOSE_RESPONSE.map((row) => {
                  const heightPct = (row.effectD / maxD) * 100
                  return (
                    <div
                      key={row.label}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        flex: 1,
                      }}
                    >
                      {/* d value label */}
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          color: row.fill,
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          marginBottom: 2,
                          position: 'absolute',
                          bottom: `${heightPct + 1}%`,
                        }}
                      >
                        {row.effectD.toFixed(2)}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: barWidth,
                          height: `${heightPct}%`,
                          background: `linear-gradient(to top, ${row.fill}, ${row.fill}99)`,
                          borderRadius: '4px 4px 0 0',
                          border: `1px solid ${row.fill}60`,
                          position: 'relative',
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* X-axis labels */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                marginTop: 6,
              }}
            >
              {DOSE_RESPONSE.map((row) => (
                <span
                  key={row.label}
                  style={{
                    fontSize: 10,
                    color: '#94a3b8',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    fontWeight: 600,
                    textAlign: 'center',
                    flex: 1,
                  }}
                >
                  {row.label}
                </span>
              ))}
            </div>
            <p
              style={{
                fontSize: 10,
                color: '#475569',
                textAlign: 'center',
                margin: '6px 0 0',
                fontWeight: 600,
              }}
            >
              Sessions per week
            </p>
          </div>
        </div>

        {/* Key insight callout */}
        <div
          style={{
            marginTop: 16,
            padding: '10px 14px',
            background: 'rgba(59,130,246,0.07)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 8,
          }}
        >
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            <span
              style={{ color: '#60a5fa', fontWeight: 700, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}
            >
              Optimal:
            </span>{' '}
            3 sessions/week achieves the threshold d = 0.68 where clinical significance is consistent.
            4–5×/week shows marginal additional benefit. Supervised group sessions add social effects
            beyond the biological dose.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Brain Regions Diagram ─────────────────────────────────────────────────────

function BrainRegionsDiagram() {
  const sourceColors: Record<string, string> = {
    Exercise: '#3b82f6',
    Meditation: '#a78bfa',
    Both: '#22c55e',
  }

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
          background: 'rgba(167,139,250,0.08)',
          borderBottom: '1px solid rgba(167,139,250,0.2)',
          borderLeft: '3px solid #a78bfa',
          padding: '14px 20px',
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          Brain Regions: Measured Effects of Exercise & Meditation
        </h3>
        <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0' }}>
          Structural and functional changes with imaging evidence
        </p>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(sourceColors).map(([source, color]) => (
            <div key={source} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{source}</span>
            </div>
          ))}
        </div>

        {/* SVG brain silhouette */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          <svg
            viewBox="0 0 100 80"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            aria-hidden="true"
          >
            {/* Brain silhouette — simplified lateral view */}
            <path
              d="M 18 55
                 C 12 52, 10 44, 12 38
                 C 11 30, 15 22, 22 17
                 C 28 11, 38 8, 50 8
                 C 62 8, 72 11, 78 17
                 C 86 24, 88 33, 86 42
                 C 84 50, 80 55, 75 58
                 C 68 62, 60 63, 50 63
                 C 42 63, 34 62, 28 60
                 C 24 58, 20 57, 18 55 Z"
              fill="#161616"
              stroke="#2a2a2a"
              strokeWidth="0.8"
            />
            {/* Corpus callosum suggestion */}
            <path
              d="M 30 38 C 40 35, 60 35, 70 38"
              fill="none"
              stroke="#252525"
              strokeWidth="0.6"
              strokeDasharray="1.5,1"
            />
            {/* Cerebellum */}
            <ellipse cx="50" cy="68" rx="18" ry="8" fill="#141414" stroke="#222" strokeWidth="0.6" />
            {/* Brainstem */}
            <rect x="46" y="62" width="8" height="10" rx="2" fill="#161616" stroke="#222" strokeWidth="0.5" />

            {/* Sulci suggestions */}
            <path d="M 35 18 C 32 22, 30 28, 32 34" fill="none" stroke="#222" strokeWidth="0.5" />
            <path d="M 55 12 C 55 18, 57 26, 55 32" fill="none" stroke="#222" strokeWidth="0.5" />
            <path d="M 72 22 C 70 28, 68 34, 70 40" fill="none" stroke="#222" strokeWidth="0.5" />

            {/* Connection lines between regions */}
            {BRAIN_REGIONS.map((region, i) =>
              BRAIN_REGIONS.slice(i + 1).map((other, j) => {
                const dist = Math.sqrt(
                  Math.pow(region.x - other.x, 2) + Math.pow(region.y - other.y, 2)
                )
                if (dist > 28) return null
                return (
                  <line
                    key={`${i}-${j}`}
                    x1={region.x}
                    y1={region.y}
                    x2={other.x}
                    y2={other.y}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="0.4"
                  />
                )
              })
            )}

            {/* Region circles */}
            {BRAIN_REGIONS.map((region) => (
              <g key={region.name}>
                {/* Glow ring */}
                <circle
                  cx={region.x}
                  cy={region.y}
                  r={region.r + 2}
                  fill={`${region.color}15`}
                  stroke={`${region.color}30`}
                  strokeWidth="0.5"
                />
                {/* Main circle */}
                <circle
                  cx={region.x}
                  cy={region.y}
                  r={region.r}
                  fill={`${region.color}25`}
                  stroke={region.color}
                  strokeWidth="1.2"
                />
                {/* Source indicator dot */}
                <circle
                  cx={region.x + region.r * 0.6}
                  cy={region.y - region.r * 0.6}
                  r={2}
                  fill={sourceColors[region.source]}
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Region cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
            marginTop: 16,
          }}
        >
          {BRAIN_REGIONS.map((region) => (
            <div
              key={region.name}
              style={{
                background: `${region.color}08`,
                border: `1px solid ${region.color}25`,
                borderRadius: 10,
                padding: '10px 12px',
                borderLeft: `3px solid ${region.color}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: region.color }}>
                  {region.name}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: sourceColors[region.source],
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    background: `${sourceColors[region.source]}15`,
                    border: `1px solid ${sourceColors[region.source]}30`,
                    borderRadius: 3,
                    padding: '1px 5px',
                  }}
                >
                  {region.source}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {region.effects.map((effect) => (
                  <span
                    key={effect}
                    style={{
                      fontSize: 10,
                      color: '#64748b',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MentalHealthSciencePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#f1f5f9',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* ── Hero ── */}
      <div
        style={{
          background:
            'linear-gradient(135deg, #0a0a0a 0%, #0d0a1a 40%, #0a0f1a 70%, #0a0a0a 100%)',
          borderBottom: '1px solid #1a1a2e',
          padding: '56px 24px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 300,
            background:
              'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, rgba(167,139,250,0.06) 50%, transparent 75%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 20,
              padding: '4px 12px',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#6366f1',
                boxShadow: '0 0 8px #6366f188',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#a5b4fc',
                letterSpacing: '0.08em',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              PEER-REVIEWED EVIDENCE
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 900,
              margin: '0 0 14px',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #e2e8f0 0%, #c4b5fd 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Mental Health Science
          </h1>

          <p
            style={{
              fontSize: 'clamp(14px, 2vw, 17px)',
              color: '#64748b',
              margin: '0 0 8px',
              lineHeight: 1.6,
              maxWidth: 560,
            }}
          >
            The neuroscience of exercise, mindfulness & psychological wellbeing — RCT evidence,
            effect sizes, and the biological mechanisms behind mental health interventions.
          </p>

          <p
            style={{
              fontSize: 12,
              color: '#334155',
              margin: 0,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            Sources: JAMA, PNAS, Nat Rev Neurosci, J Affect Disord, Psychosom Med, Neuroreport
          </p>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 80px' }}>
        {/* Key Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
            marginBottom: 36,
          }}
        >
          {KEY_STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Section label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div style={{ height: 1, flex: 1, background: '#1a1a1a' }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#334155',
              letterSpacing: '0.12em',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            SCIENCE CARDS
          </span>
          <div style={{ height: 1, flex: 1, background: '#1a1a1a' }} />
        </div>

        {/* Science Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.title} {...card} />
          ))}
        </div>

        {/* Section label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div style={{ height: 1, flex: 1, background: '#1a1a1a' }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#334155',
              letterSpacing: '0.12em',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            VISUALISATIONS
          </span>
          <div style={{ height: 1, flex: 1, background: '#1a1a1a' }} />
        </div>

        {/* Dose-Response Graph */}
        <div style={{ marginBottom: 16 }}>
          <DoseResponseGraph />
        </div>

        {/* Brain Regions Diagram */}
        <div style={{ marginBottom: 16 }}>
          <BrainRegionsDiagram />
        </div>

        {/* Practical Takeaways */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: 'rgba(99,102,241,0.08)',
              borderBottom: '1px solid rgba(99,102,241,0.2)',
              borderLeft: '3px solid #6366f1',
              padding: '14px 20px',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              Evidence-Based Protocol Summary
            </h3>
            <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0' }}>
              Minimum effective doses from RCT evidence
            </p>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {[
              {
                label: 'Aerobic Exercise',
                protocol: '3×/week, ≥30 min, moderate intensity (60–70% HRmax)',
                benefit: 'Depression d=0.68, Anxiety ↓40%, Hippocampus +2%',
                color: '#3b82f6',
              },
              {
                label: 'Resistance Training',
                protocol: '2–3×/week, progressive overload',
                benefit: 'Depression d=0.66, SWS ↑20%, testosterone ↑',
                color: '#22c55e',
              },
              {
                label: 'MBSR / Mindfulness',
                protocol: '8-week structured program or 10 min/day ongoing',
                benefit: 'Anxiety d=0.97, CRP ↓43%, Telomerase +30%',
                color: '#a78bfa',
              },
              {
                label: 'Combined Protocol',
                protocol: 'Exercise 3×/week + 10 min daily mindfulness',
                benefit: 'Additive effects on cortisol, amygdala, PFC connectivity',
                color: '#f97316',
              },
            ].map((item, i, arr) => (
              <div key={item.label}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '10px 0',
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: item.color,
                      marginTop: 6,
                      flexShrink: 0,
                      boxShadow: `0 0 6px ${item.color}88`,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        flexWrap: 'wrap',
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: '#334155',
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        }}
                      >
                        {item.protocol}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        color: '#64748b',
                        margin: 0,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      {item.benefit}
                    </p>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ height: 1, background: '#1a1a1a' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer citation */}
        <p
          style={{
            fontSize: 10,
            color: '#1e293b',
            textAlign: 'center',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Scientific content is informational. Consult a qualified healthcare provider before
          beginning any mental health intervention or exercise programme.
        </p>
      </div>
    </div>
  )
}

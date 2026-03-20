// Overtraining Science — server component (no interactivity needed for static content)
// Covers OTS diagnosis, mechanisms, monitoring & detection, and recovery protocols.

export const metadata = { title: 'Overtraining Science' }

// ─── Data ─────────────────────────────────────────────────────────────────────

const OTS_SPECTRUM = [
  {
    stage: 'FOR',
    label: 'Functional Overreaching',
    recovery: 'Days–weeks',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.30)',
    description: 'Short-term performance decrement; normal adaptation to training load',
  },
  {
    stage: 'NFOR',
    label: 'Non-Functional Overreaching',
    recovery: 'Weeks–months',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.30)',
    description: 'Sustained decrement + mood disturbance; requires structured recovery',
  },
  {
    stage: 'OTS',
    label: 'Overtraining Syndrome',
    recovery: 'Months+',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.12)',
    border: 'rgba(220,38,38,0.30)',
    description: 'Full syndrome with neuroendocrine & immune dysfunction; months of recovery',
  },
]

const KEY_STATS = [
  {
    label: 'Elite Career Incidence',
    value: '60–65%',
    sub: 'of elite endurance athletes experience NFOR/OTS (Kreher 2012)',
    accent: '#ef4444',
    detail: 'Lifetime prevalence in high-volume sports',
  },
  {
    label: 'HRV Early Warning',
    value: '1–2 wks',
    sub: 'HRV drops before subjective fatigue appears',
    accent: '#3b82f6',
    detail: 'HRV decreases 15–25% before performance drops',
  },
  {
    label: 'Monitoring Sensitivity',
    value: '85%',
    sub: 'HRV + RHR + sleep + sRPE combined (Rønnestad 2022)',
    accent: '#22c55e',
    detail: 'For detecting upcoming illness/injury/OTS',
  },
  {
    label: 'Polarized Training',
    value: '≥60%',
    sub: 'Zone 1 prevents HPA axis & autonomic dysfunction',
    accent: '#a78bfa',
    detail: 'Polarized > pyramidal for OTS risk reduction',
  },
]

const SCIENCE_CARDS = [
  {
    icon: 'D',
    iconBg: 'rgba(239,68,68,0.15)',
    iconBorder: 'rgba(239,68,68,0.35)',
    iconColor: '#f87171',
    title: 'Overtraining Syndrome (OTS) Diagnosis',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.08)',
    accentBorder: 'rgba(239,68,68,0.25)',
    facts: [
      {
        citation: 'Meeusen 2013 — ECSS/ACSM Consensus, Med Sci Sports Exerc',
        stat: 'Gold standard: 2× max test 4h apart',
        text: 'OTS diagnostic criteria: unexplained performance decrement ≥2 weeks despite maintained or reduced training load, combined with mood disturbance. Meeusen formalised the spectrum — FOR (days–weeks recovery), NFOR (weeks–months), OTS (months). Gold standard diagnosis uses the hormonal response to two maximal exercise tests 4 hours apart — blunted GH and cortisol response in OTS, not FOR, distinguishes the syndromes definitively.',
      },
      {
        citation: 'Kreher 2012 — Sports Health',
        stat: 'HRV ↓ 15–25% before subjective fatigue',
        text: '60–65% of elite endurance athletes experience NFOR or OTS during their career; incubation period 3–4 weeks of excessive load. VO₂max remains unchanged while submaximal efficiency drops 5–10%. HRV decreases 15–25% in the weeks before subjective fatigue is noticed — making HRV monitoring the most sensitive early-warning tool available without laboratory testing.',
      },
      {
        citation: 'Halson 2004 — Sports Med',
        stat: 'RESTQ-Sport detects NFOR 1–2 wks early',
        text: 'POMS total mood disturbance score increases systematically with functional overreaching: vigor decreases while fatigue, confusion, and depression all increase. The fatigue:vigor ratio is the most sensitive single POMS indicator. The RESTQ-Sport questionnaire detects NFOR 1–2 weeks earlier than performance tests, making subjective wellness monitoring a cost-free and practical complement to physiological measures.',
      },
      {
        citation: 'Petibois 2002',
        stat: 'T:C ratio <30% of baseline most discriminating',
        text: 'No single biomarker is diagnostic for OTS — a panel is required. The most clinically useful panel: sustained ↓HRV, ↑RHR (>5 bpm above baseline), ↑creatine kinase (>3× normal for ≥3 consecutive days), and ↑cortisol:testosterone ratio. The testosterone:cortisol ratio falling below 30% of individual baseline is the most discriminating biochemical indicator of catabolic/anabolic imbalance in OTS.',
      },
    ],
  },
  {
    icon: 'M',
    iconBg: 'rgba(249,115,22,0.15)',
    iconBorder: 'rgba(249,115,22,0.35)',
    iconColor: '#fb923c',
    title: 'Mechanisms of Overtraining',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.08)',
    accentBorder: 'rgba(249,115,22,0.25)',
    facts: [
      {
        citation: 'Urhausen 2002 — Brit J Sports Med',
        stat: '>80% of endurance OTS is parasympathetic',
        text: 'Two distinct autonomic subtypes: endurance-sport OTS manifests as parasympathetic OTS (bradycardia, low norepinephrine, blunted exercise HR response), while strength and speed-sport OTS manifests as sympathetic OTS (elevated RHR, insomnia, irritability). Over 80% of OTS in endurance athletes is the parasympathetic form, which can be confused with good aerobic fitness — making RHR trends and HRV essential discriminators.',
      },
      {
        citation: 'Smith 2000 — Cytokine Hypothesis',
        stat: 'Training camp cytokine spikes predict staleness',
        text: 'Repeated muscle microtrauma elevates pro-inflammatory cytokines IL-1β, IL-6, and TNF-α. Sustained cytokine elevation drives HPA axis dysregulation, reduces IGF-1 signalling, and impairs mood via serotonergic pathways. Prospective studies show that cytokine spikes during training camps are predictive of subsequent staleness and performance plateau — linking immune inflammation directly to the overtraining syndrome.',
      },
      {
        citation: 'Meeusen 2010 — Central Fatigue Hypothesis',
        stat: 'BCAA delays central fatigue 20–30%',
        text: 'A high serotonin-to-dopamine (5-HT:DA) ratio in the brain causes central fatigue, mood depression, and reduced motivation. BCAAs compete with tryptophan for the blood-brain barrier large neutral amino acid transporter, reducing cerebral serotonin synthesis and delaying central fatigue by 20–30% in ultraendurance events. Carbohydrate feeding also delays central fatigue by reducing plasma NEFA and free tryptophan availability.',
      },
      {
        citation: 'Pyne 2014 — Int J Sports Physiol Perf',
        stat: 'URTI 2–5× more frequent in elite endurance',
        text: 'The "open window" of immune suppression extends 3–72 hours post-intense exercise — natural killer cell activity and salivary IgA (sIgA) are both suppressed. Elite endurance athletes experience upper respiratory tract infections at 2–5× the rate of age-matched non-athletes during peak training phases. Preventing OTS requires addressing immunological recovery: sleep, carbohydrate intake, and probiotics combine to reduce URTI incidence by 200–300%.',
      },
    ],
  },
  {
    icon: 'E',
    iconBg: 'rgba(59,130,246,0.15)',
    iconBorder: 'rgba(59,130,246,0.35)',
    iconColor: '#60a5fa',
    title: 'Monitoring & Early Detection',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    facts: [
      {
        citation: 'Plews 2013 — Int J Sports Physiol Perf',
        stat: 'HRV7-day trend vs performance r = 0.72',
        text: 'Evidence-based HRV monitoring protocol: measure every morning supine using a 5-minute or validated 60-second ultra-short recording. A ≥7% reduction from the 7-day rolling average indicates elevated fatigue — reduce training intensity that day. Five or more consecutive days of downward HRV trend warrants a 48–72-hour load reduction. The 7-day HRV trend correlates with performance readiness at r = 0.72.',
      },
      {
        citation: 'Buchheit 2014 — Int J Sports Physiol Perf',
        stat: 'HRV-guided training: superior VO₂max gains',
        text: 'Smartphone PPG-based HRV measurement has been validated against chest strap ECG (r = 0.97), making daily monitoring practical at scale. Daily HRV monitoring reduces non-functional overreaching episodes by 40% compared to fixed-periodisation schedules. A 9-week RCT demonstrated that HRV-guided training produced superior VO₂max gains versus calendar-based programming — individualising intensity distribution is the key mechanism.',
      },
      {
        citation: 'Foster 1998 — J Strength Cond Res',
        stat: 'Monotony >2.0 = high illness/OTS risk',
        text: 'Session-RPE method: Borg CR-10 score multiplied by session duration in minutes gives training load in arbitrary units (AU). Training monotony = weekly load average divided by standard deviation of daily loads (>2.0 identifies high risk). Training strain = weekly load × monotony. This method predicts illness episodes better than heart-rate zone tracking alone, and requires only a single self-reported number per session.',
      },
      {
        citation: 'Rønnestad 2022',
        stat: '85% sensitivity for OTS detection',
        text: 'Combined multivariate monitoring achieves 85% sensitivity for detecting upcoming illness, injury, or OTS: HRV + resting heart rate + sleep quality + session-RPE. Clinical decision rule: any 2 or more of the following on a given day triggers a mandatory rest or recovery session — HRV >7% below 7-day baseline, RHR >5 bpm above baseline, sleep duration <6 hours, or session-RPE >20% above the planned value.',
      },
    ],
  },
  {
    icon: 'R',
    iconBg: 'rgba(34,197,94,0.15)',
    iconBorder: 'rgba(34,197,94,0.35)',
    iconColor: '#4ade80',
    title: 'Recovery & Prevention Protocols',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.25)',
    facts: [
      {
        citation: 'Kellmann 2002 — Multi-Dimensional Recovery',
        stat: 'Recovery rate must equal training stress',
        text: 'Recovery operates across three dimensions simultaneously: physical (sleep, nutrition, rest), psychological (mood, motivation, perceived recovery), and social (team dynamics, life stress load). Recovery rate must equal or exceed training stress at every temporal scale — micro (daily), meso (weekly), and macro (seasonal). The RESTQ-Sport instrument quantifies all three dimensions and enables structured recovery prescription.',
      },
      {
        citation: 'Hausswirth 2011 — Med Sci Sports Exerc',
        stat: 'CWI reduces CK 30%, soreness 20%',
        text: 'Ranked recovery modality evidence: (1) sleep extension is the single most effective and zero-cost intervention; (2) cold water immersion at 10–15°C for 10–15 minutes; (3) active recovery below 50% HRmax for 20 minutes; (4) massage; (5) compression garments. Cold water immersion reduces CK by 30% and perceived soreness by 20% — but attenuates hypertrophy signalling if applied after strength training sessions.',
      },
      {
        citation: 'Peake 2017 — Front Physiol',
        stat: 'Avoid anti-inflammatories post-training',
        text: 'Recovery nutrition: 0.4 g/kg protein within 2 hours; 1.0–1.2 g/kg/h carbohydrate for the first 4 hours post-exercise. Critically: avoid anti-inflammatory supplements immediately post-training — ibuprofen and high-dose antioxidant supplements (vitamin C, vitamin E) inhibit PGC-1α signalling and satellite cell activation. Strategic post-exercise inflammation is the adaptation signal; suppressing it pharmacologically blunts training gains.',
      },
      {
        citation: 'Stöggl 2014 — Brit J Sports Med',
        stat: 'Polarized beats pyramidal for OTS risk',
        text: 'Polarized training (80% easy / 20% hard) versus pyramidal (50%/25%/25%) distribution in a 9-week RCT with elite cross-country skiers: polarized produced superior performance outcomes AND reduced OTS risk. Threshold-dominated training (Zone 2 heavy) carries the highest risk of inducing OTS due to sustained HPA axis and autonomic load without full recovery. Maintaining ≥60% Zone 1 prevents neuroendocrine and autonomic dysfunction.',
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
          fontSize: 26,
          fontWeight: 900,
          color: accent,
          margin: 0,
          letterSpacing: '-0.5px',
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
                  maxWidth: 180,
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

// ─── OTS Spectrum Visual ───────────────────────────────────────────────────────

function OTSSpectrumDiagram() {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 32,
      }}
    >
      <div
        style={{
          background: 'rgba(239,68,68,0.08)',
          borderBottom: '1px solid rgba(239,68,68,0.2)',
          borderLeft: '3px solid #ef4444',
          padding: '14px 20px',
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          The Overreaching–Overtraining Spectrum
        </h3>
        <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0' }}>
          Meeusen 2013 ECSS/ACSM consensus framework — a continuum of accumulating training stress
        </p>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Severity arrow */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 6 }}>
          <span
            style={{
              fontSize: 9,
              color: '#475569',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            SEVERITY
          </span>
          <div
            style={{
              flex: 1,
              height: 2,
              background: 'linear-gradient(to right, #f97316, #ef4444, #dc2626)',
              borderRadius: 2,
            }}
          />
          <svg width="8" height="10" viewBox="0 0 8 10" aria-hidden="true">
            <polygon points="0,0 8,5 0,10" fill="#dc2626" />
          </svg>
        </div>

        {/* Spectrum cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 10,
            marginBottom: 16,
          }}
        >
          {OTS_SPECTRUM.map((stage) => (
            <div
              key={stage.stage}
              style={{
                background: stage.bg,
                border: `1px solid ${stage.border}`,
                borderRadius: 10,
                padding: '12px 14px',
                borderLeft: `3px solid ${stage.color}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: stage.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {stage.stage}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#94a3b8',
                  }}
                >
                  {stage.label}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px', lineHeight: 1.5 }}>
                {stage.description}
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: `${stage.color}15`,
                  border: `1px solid ${stage.color}30`,
                  borderRadius: 4,
                  padding: '2px 7px',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: stage.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  Recovery: {stage.recovery}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Key insight callout */}
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.18)',
            borderRadius: 8,
          }}
        >
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            <span
              style={{
                color: '#f87171',
                fontWeight: 700,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              Key principle:
            </span>{' '}
            FOR is a deliberate training stimulus. The transition to NFOR and OTS occurs when
            recovery is insufficient relative to load — not from high load alone. Diagnosis requires
            excluding other causes (illness, nutritional deficiency, psychological conditions) before
            labelling OTS.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Monitoring Thresholds Visual ─────────────────────────────────────────────

function MonitoringThresholds() {
  const indicators = [
    {
      metric: 'HRV',
      threshold: '>7% below 7-day avg',
      color: '#3b82f6',
      risk: 'High',
      note: 'Most sensitive early marker',
    },
    {
      metric: 'RHR',
      threshold: '>5 bpm above baseline',
      color: '#ef4444',
      risk: 'High',
      note: 'Sympathetic activation sign',
    },
    {
      metric: 'Sleep',
      threshold: '<6 hours duration',
      color: '#a78bfa',
      risk: 'Moderate',
      note: 'Impairs GH release & repair',
    },
    {
      metric: 'sRPE',
      threshold: '>20% above planned',
      color: '#f97316',
      risk: 'Moderate',
      note: 'Session harder than expected',
    },
    {
      metric: 'Monotony',
      threshold: '>2.0 (avg/SD of loads)',
      color: '#eab308',
      risk: 'Moderate',
      note: 'Lack of load variation',
    },
    {
      metric: 'URTI',
      threshold: 'Any symptoms',
      color: '#ec4899',
      risk: 'Action',
      note: 'Open window immune suppression',
    },
  ]

  const riskColors: Record<string, string> = {
    High: '#ef4444',
    Moderate: '#f97316',
    Action: '#a78bfa',
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
          background: 'rgba(59,130,246,0.08)',
          borderBottom: '1px solid rgba(59,130,246,0.2)',
          borderLeft: '3px solid #3b82f6',
          padding: '14px 20px',
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          Monitoring Alert Thresholds
        </h3>
        <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0' }}>
          Rønnestad 2022 — any 2+ triggered simultaneously = mandatory rest/recovery day
        </p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
            marginBottom: 16,
          }}
        >
          {indicators.map((ind) => (
            <div
              key={ind.metric}
              style={{
                background: `${ind.color}08`,
                border: `1px solid ${ind.color}25`,
                borderRadius: 10,
                padding: '10px 12px',
                borderLeft: `3px solid ${ind.color}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: ind.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {ind.metric}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: riskColors[ind.risk],
                    background: `${riskColors[ind.risk]}15`,
                    border: `1px solid ${riskColors[ind.risk]}30`,
                    borderRadius: 3,
                    padding: '1px 5px',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {ind.risk}
                </span>
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  margin: '0 0 3px',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  fontWeight: 600,
                }}
              >
                {ind.threshold}
              </p>
              <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>{ind.note}</p>
            </div>
          ))}
        </div>

        {/* Rule callout */}
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.18)',
            borderRadius: 8,
          }}
        >
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            <span
              style={{
                color: '#60a5fa',
                fontWeight: 700,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              Decision rule:
            </span>{' '}
            Any single indicator warrants reduced training intensity. Two or more simultaneously
            triggered = complete rest or active recovery only (&lt;50% HRmax). Five or more
            consecutive downward HRV days warrants a 48–72h load reduction regardless of other
            metrics.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OvertrainingSciencePage() {
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
            'linear-gradient(135deg, #0a0a0a 0%, #140a0a 40%, #0a0e14 70%, #0a0a0a 100%)',
          borderBottom: '1px solid #1a1010',
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
              'radial-gradient(ellipse, rgba(239,68,68,0.10) 0%, rgba(249,115,22,0.05) 50%, transparent 75%)',
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
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.30)',
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
                background: '#ef4444',
                boxShadow: '0 0 8px #ef444488',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#fca5a5',
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
              background: 'linear-gradient(135deg, #e2e8f0 0%, #fca5a5 50%, #f87171 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Overtraining Science
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
            Evidence-based OTS diagnosis, mechanisms, monitoring &amp; recovery protocols
          </p>

          <p
            style={{
              fontSize: 12,
              color: '#334155',
              margin: 0,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            Sources: Med Sci Sports Exerc, Sports Health, Brit J Sports Med, Int J Sports Physiol
            Perf, Front Physiol, J Strength Cond Res
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

        {/* Section label — Spectrum */}
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
            OTS SPECTRUM
          </span>
          <div style={{ height: 1, flex: 1, background: '#1a1a1a' }} />
        </div>

        {/* OTS Spectrum Diagram */}
        <OTSSpectrumDiagram />

        {/* Section label — Science Cards */}
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

        {/* Section label — Monitoring */}
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
            MONITORING THRESHOLDS
          </span>
          <div style={{ height: 1, flex: 1, background: '#1a1a1a' }} />
        </div>

        {/* Monitoring Thresholds */}
        <div style={{ marginBottom: 16 }}>
          <MonitoringThresholds />
        </div>

        {/* Recovery Protocol Summary */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 16,
            marginTop: 20,
          }}
        >
          <div
            style={{
              background: 'rgba(34,197,94,0.08)',
              borderBottom: '1px solid rgba(34,197,94,0.2)',
              borderLeft: '3px solid #22c55e',
              padding: '14px 20px',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              Evidence-Based Recovery Priority Order
            </h3>
            <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0' }}>
              Hausswirth 2011 — ranked by evidence strength and effect size
            </p>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {[
              {
                rank: '01',
                label: 'Sleep Extension',
                protocol: 'Priority — zero cost, highest effect size',
                detail: 'GH release, neural repair, HPA axis recalibration',
                color: '#22c55e',
              },
              {
                rank: '02',
                label: 'Cold Water Immersion',
                protocol: '10–15°C × 10–15 min post-endurance only',
                detail: 'CK ↓ 30%, soreness ↓ 20%; avoid after strength sessions',
                color: '#3b82f6',
              },
              {
                rank: '03',
                label: 'Active Recovery',
                protocol: '<50% HRmax × 20 min (walking, easy cycling)',
                detail: 'Lactate clearance, parasympathetic restoration',
                color: '#06b6d4',
              },
              {
                rank: '04',
                label: 'Recovery Nutrition',
                protocol: '0.4 g/kg protein + 1.0–1.2 g/kg/h CHO within 2h',
                detail: 'Avoid NSAIDs and high-dose antioxidants post-training',
                color: '#f97316',
              },
              {
                rank: '05',
                label: 'Polarized Load Distribution',
                protocol: '≥60% Zone 1, ≤20% Zone 3, minimal threshold',
                detail: 'Structural prevention — HPA axis and autonomic protection',
                color: '#a78bfa',
              },
            ].map((item, i, arr) => (
              <div key={item.rank}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '10px 0',
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: `${item.color}60`,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      lineHeight: 1,
                      flexShrink: 0,
                      width: 26,
                      marginTop: 1,
                    }}
                  >
                    {item.rank}
                  </span>
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
                      {item.detail}
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
          Scientific content is informational. Consult a qualified sports medicine physician before
          modifying training load or implementing overtraining recovery protocols.
        </p>
      </div>
    </div>
  )
}

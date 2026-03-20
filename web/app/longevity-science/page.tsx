// Longevity Science — server component
// Evidence-based longevity page covering exercise mortality reduction,
// biomarkers, cellular aging, and practical protocols.

export const metadata = { title: 'Longevity Science' }

// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '13%',
    label: 'Mortality Reduction',
    sub: 'per 1 MET increase in CRF (Kodama 2009)',
    accent: '#22c55e',
  },
  {
    value: '23%',
    label: 'Less All-Cause Mortality',
    sub: '2 strength sessions/week (Stamatakis 2018)',
    accent: '#84cc16',
  },
  {
    value: '70%',
    label: 'Lower Mortality Risk',
    sub: 'VO₂max top quintile vs bottom (Kodama 2009)',
    accent: '#eab308',
  },
]

const SCIENCE_CARDS = [
  {
    id: 'exercise-mortality',
    icon: 'E',
    iconBg: 'rgba(34,197,94,0.15)',
    iconBorder: 'rgba(34,197,94,0.35)',
    iconColor: '#86efac',
    title: 'Exercise & Mortality Reduction',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.25)',
    facts: [
      {
        citation: 'Wen 2011 (Lancet)',
        text: '15 minutes per day of moderate-intensity exercise reduces all-cause mortality by 14% and adds approximately 3 years to life expectancy. A clear dose-response relationship exists, continuing up to ~100 minutes per day, at which point gains plateau. Every additional 15 min/day beyond the minimum yields a further 4% mortality reduction.',
        stat: '15 min/day → −14% mortality, +3 years',
      },
      {
        citation: 'Kodama 2009 (JAMA)',
        text: 'Each 1 MET increment in cardiorespiratory fitness (CRF) is associated with a 13% lower risk of all-cause mortality and 15% lower cardiovascular mortality. Individuals in the top CRF quintile have a 70% lower mortality risk compared to the lowest quintile over an 8.4-year mean follow-up. The dose-response is continuous with no apparent upper threshold.',
        stat: '+1 MET = −13% mortality; top CRF quintile = −70%',
      },
      {
        citation: 'Stamatakis 2018',
        text: 'Two resistance-training sessions per week are associated with a 23% reduction in all-cause mortality and a 31% reduction in cancer mortality, independent of aerobic activity. Grip strength is now considered the single strongest predictor of all-cause mortality in older adults — stronger than blood pressure, BMI, or cholesterol. Each 5 kg lower grip strength raises all-cause mortality risk 16%.',
        stat: '2×/week strength → −23% all-cause, −31% cancer',
      },
      {
        citation: 'Mandsager 2018 (JAMA Network Open)',
        text: 'Low CRF carries a mortality hazard ratio exceeding 5.0 compared to elite fitness — a greater relative risk than hypertension, smoking, or diabetes combined. Critically, the survival benefit of moving from "low" to "below average" fitness is larger than any known pharmacological intervention. Elite fitness confers a 5× survival advantage over low fitness.',
        stat: 'Low → below-average CRF: largest single mortality intervention',
      },
    ],
  },
  {
    id: 'biomarkers',
    icon: 'B',
    iconBg: 'rgba(59,130,246,0.15)',
    iconBorder: 'rgba(59,130,246,0.35)',
    iconColor: '#93c5fd',
    title: 'Longevity Biomarkers',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    facts: [
      {
        citation: 'Levine 2018 (Aging)',
        text: 'PhenoAge is a multi-biomarker composite (albumin, creatinine, glucose, CRP, lymphocyte %, MCV, RDW, alkaline phosphatase, WBC, chronological age) that predicts all-cause mortality better than chronological age alone. Regular exercise reduces PhenoAge by 1–5 years relative to chronological age. Sedentary lifestyle accelerates PhenoAge 8–10 years beyond chronological age.',
        stat: 'Exercise: PhenoAge −1–5 yrs; sedentary: +8–10 yrs',
      },
      {
        citation: 'Studenski 2011 (JAMA)',
        text: 'Each 0.1 m/s increment in usual gait speed is associated with a 12% lower 10-year mortality risk. Gait speed <0.8 m/s identifies a threshold for elevated mortality. Grip strength below 26 kg in men independently predicts future disability, hospitalisation, and mortality — effects persisting after adjustment for physical activity and body composition.',
        stat: 'Gait speed +0.1 m/s → −12% 10-year mortality',
      },
      {
        citation: 'Seals 2016',
        text: 'Heart rate variability (HRV) declines approximately 3% per decade with normal aging, reflecting autonomic dysfunction. Endurance-trained masters athletes maintain HRV 30–50% higher than age-matched sedentary peers. High vagal tone — indexed by HRV — is associated with 15–20% lower cardiovascular mortality in long-term prospective studies.',
        stat: 'Trained masters athletes: HRV 30–50% higher',
      },
      {
        citation: 'Blair 2009 / Cooper Clinic Norms',
        text: 'VO₂max norms for men aged 40–49: low <34, fair 34–39.9, average 40–43.9, good 44–51.9, elite ≥52.5 mL/kg/min. A 10 mL/kg/min higher VO₂max is associated with a 45% reduction in cardiovascular events. The VO₂max decline of ~10% per decade is strongly modifiable: consistent aerobic training preserves VO₂max at levels 20–30 years younger.',
        stat: '+10 mL/kg/min VO₂max → −45% CVD events',
      },
    ],
  },
  {
    id: 'cellular-aging',
    icon: 'C',
    iconBg: 'rgba(168,85,247,0.15)',
    iconBorder: 'rgba(168,85,247,0.35)',
    iconColor: '#d8b4fe',
    title: 'Cellular Aging & Exercise',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.08)',
    accentBorder: 'rgba(168,85,247,0.25)',
    facts: [
      {
        citation: 'Werner 2019 / Cherkas 2008',
        text: 'Endurance athletes show telomeres 5–14 years longer than age-matched sedentary controls, indicating significantly slower cellular aging. Six months of structured endurance training increases telomerase activity 2-fold, reversing prior telomere attrition. Cherkas 2008 (twins study): the most physically active twins are biologically 9 years younger at the cellular level than their inactive co-twins.',
        stat: 'Athletes: telomeres 5–14 yrs longer; 6mo training → 2× telomerase',
      },
      {
        citation: 'Rowe 2016 / Lanza 2012',
        text: 'Mitochondrial dysfunction — declining density, morphology, and oxidative capacity — is now considered a primary hallmark of aging. Lanza 2012: aerobically trained 65-year-olds have mitochondrial function (measured by P/O ratio and complex activity) equivalent to untrained 25-year-olds, a 40-year biological rejuvenation at the organelle level.',
        stat: 'Trained 65yo = untrained 25yo mitochondrial function',
      },
      {
        citation: 'Fontana 2010 / CALERIE Trial',
        text: '30% caloric restriction (CR) extends lifespan 30–40% in multiple rodent species. The CALERIE trial (25% CR in humans, 2 years) improved all measured aging biomarkers: reduced inflammation, insulin resistance, blood pressure, and PhenoAge. A fasting-mimicking diet (FMD) — 5 days/month at ~800 kcal — reduces biological age by 2.5 years in a randomised controlled trial.',
        stat: 'FMD 5d/month → biological age −2.5 years (RCT)',
      },
      {
        citation: 'Kirkland 2017 (Science)',
        text: 'Senescent cells accumulate with age and drive systemic inflammation via the senescence-associated secretory phenotype (SASP) — a process called "inflammaging." Exercise reduces the senescent cell burden by 40–70% in animal models. In humans, 30 minutes of daily moderate exercise is currently the most established anti-senescence intervention, with effects on inflammatory markers (CRP, IL-6, TNF-α) evident after 12 weeks.',
        stat: 'Exercise: −40–70% senescent cell burden in vivo',
      },
    ],
  },
  {
    id: 'protocols',
    icon: 'P',
    iconBg: 'rgba(249,115,22,0.15)',
    iconBorder: 'rgba(249,115,22,0.35)',
    iconColor: '#fdba74',
    title: 'Practical Longevity Protocols',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.08)',
    accentBorder: 'rgba(249,115,22,0.25)',
    facts: [
      {
        citation: 'Attia 2023 (Outlive)',
        text: 'The centenarian decathlon framework: work backwards from desired physical capacity at age 90+ to set current training targets. Target VO₂max at age 75 = 25th percentile of 30-year-olds (>37.5 mL/kg/min), requiring a current VO₂max 20–25% above age-predicted norms. Recommended weekly template: Zone 2 aerobic 3–4h/week + VO₂max intervals 1–2×/week + strength 3×/week + zone 5 HIIT once/week.',
        stat: 'Target: VO₂max at 75 = >37.5 mL/kg/min (25th pct of 30yo)',
      },
      {
        citation: 'Laukkanen 2018 (JAMA Internal Medicine)',
        text: 'Finnish sauna bathing 4–7 sessions per week is associated with 50% lower cardiovascular mortality, 40% lower all-cause mortality, and 65% lower Alzheimer\'s/dementia risk compared to one session/week, in a dose-dependent relationship. Protocol: 19–27 minutes at 80°C, dry sauna. Effects appear synergistic with exercise — combined exercisers and frequent sauna users show the greatest longevity benefit.',
        stat: '4–7 sauna sessions/week: −50% CVD, −40% all-cause mortality',
      },
      {
        citation: 'Nguyen 2016 / HUNT Study',
        text: 'Zone 2 aerobic training (3+ hours/week at lactate threshold 1 intensity) is associated with 58% lower risk of type 2 diabetes and 32% lower metabolic syndrome risk. The HUNT study (n=33,000, 10-year follow-up) identified cardiovascular fitness — driven primarily by Zone 2 volume — as the strongest single predictor of 10-year survival, outperforming all other lifestyle variables.',
        stat: 'Zone 2 ≥3h/week: −58% T2D, strongest survival predictor (HUNT n=33,000)',
      },
      {
        citation: 'Lee 2022 (BJSM)',
        text: '150–300 minutes per week of moderate aerobic exercise reduces all-cause mortality 35% vs. inactive. Combining aerobic with resistance training (concurrent training) is associated with 50% mortality reduction — the strongest exercise combination studied. Each 1 kg increase in appendicular lean mass (muscle) is associated with ~5% lower mortality at age 65+, making muscle mass a key longevity target.',
        stat: 'Aerobic + strength concurrent: −50% all-cause mortality',
      },
    ],
  },
]

// VO₂max longevity tier data (approximate survival-curve representation)
const VO2_TIERS = [
  { tier: 'Low', vo2Range: '<34', color: '#ef4444', survivalAt10yr: 72, label: 'Low CRF' },
  { tier: 'Below Avg', vo2Range: '34–39', color: '#f97316', survivalAt10yr: 82, label: 'Below Average' },
  { tier: 'Average', vo2Range: '40–44', color: '#eab308', survivalAt10yr: 89, label: 'Average' },
  { tier: 'Good', vo2Range: '44–52', color: '#84cc16', survivalAt10yr: 94, label: 'Good' },
  { tier: 'Elite', vo2Range: '>52', color: '#22c55e', survivalAt10yr: 97, label: 'Elite CRF' },
]

// Longevity equation terms
const EQUATION_TERMS = [
  { label: 'VO₂max', sub: 'Cardiorespiratory Fitness', color: '#22c55e', weight: '40%' },
  { label: 'Strength', sub: 'Lean Mass & Grip Force', color: '#84cc16', weight: '25%' },
  { label: 'Sleep', sub: 'Duration & Quality', color: '#3b82f6', weight: '20%' },
  { label: 'Nutrition', sub: 'Caloric Balance & Quality', color: '#eab308', weight: '15%' },
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

function FactRow({ citation, text, stat }: { citation: string; text: string; stat: string; accent: string }) {
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
        <FactRow key={i} {...fact} accent={accent} />
      ))}
    </div>
  )
}

function VO2TierChart() {
  const maxSurvival = 100
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
            V
          </span>
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            VO₂max Longevity Tiers
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            Approximate 10-year survival by CRF level — men aged 40–49 (Cooper Clinic data)
          </p>
        </div>
      </div>

      <div style={{ padding: '20px 20px 4px' }}>
        {VO2_TIERS.map((tier) => {
          const pct = (tier.survivalAt10yr / maxSurvival) * 100
          return (
            <div key={tier.tier} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
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
                    VO₂max {tier.vo2Range} mL/kg/min
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 900,
                    color: tier.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {tier.survivalAt10yr}%
                </span>
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
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${tier.color}99, ${tier.color})`,
                    borderRadius: 5,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          padding: '12px 20px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: '#334155' }}>0%</span>
        <span style={{ fontSize: 11, color: '#334155', fontStyle: 'italic' }}>
          10-year survival probability
        </span>
        <span style={{ fontSize: 11, color: '#334155' }}>100%</span>
      </div>
    </div>
  )
}

function LongevityEquation() {
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
          background: 'rgba(234,179,8,0.08)',
          borderBottom: '1px solid rgba(234,179,8,0.2)',
          borderLeft: '3px solid #eab308',
          padding: '14px 16px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          The Longevity Equation
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
          Determinants of biological age — relative contribution to longevity outcomes
        </p>
      </div>

      <div style={{ padding: '20px 20px 16px' }}>
        {/* Visual equation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 24,
            padding: '16px',
            background: '#0d0d0d',
            borderRadius: 12,
            border: '1px solid #1f1f1f',
          }}
        >
          {EQUATION_TERMS.map((term, i) => (
            <span key={term.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: `${term.color}18`,
                  border: `1px solid ${term.color}44`,
                  fontSize: 15,
                  fontWeight: 800,
                  color: term.color,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                {term.label}
              </span>
              {i < EQUATION_TERMS.length - 1 && (
                <span style={{ fontSize: 20, color: '#475569', fontWeight: 300 }}>+</span>
              )}
            </span>
          ))}
          <span style={{ fontSize: 20, color: '#475569', fontWeight: 300 }}>=</span>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: 'rgba(248,250,252,0.06)',
              border: '1px solid rgba(248,250,252,0.12)',
              fontSize: 15,
              fontWeight: 800,
              color: '#f8fafc',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              whiteSpace: 'nowrap',
            }}
          >
            Biological Age
          </span>
        </div>

        {/* Term detail rows */}
        {EQUATION_TERMS.map((term) => (
          <div
            key={term.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid #181818',
            }}
          >
            <div style={{ flex: '0 0 100px' }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: term.color,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {term.label}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{term.sub}</span>
            </div>
            <div style={{ flex: '0 0 120px' }}>
              <div
                style={{
                  height: 6,
                  background: '#1a1a1a',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: term.weight,
                    background: `linear-gradient(90deg, ${term.color}88, ${term.color})`,
                    borderRadius: 3,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: term.color,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  fontWeight: 700,
                }}
              >
                {term.weight} relative contribution
              </span>
            </div>
          </div>
        ))}

        <p
          style={{
            fontSize: 11,
            color: '#334155',
            margin: '12px 0 0',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          Weights are approximate, based on meta-analytic effect sizes. VO₂max dominates due to its
          linear, continuous mortality dose-response and broad metabolic impact.
        </p>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LongevitySciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f8fafc' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(160deg, #0a0a0a 0%, #0f1a0f 40%, #0a1200 70%, #0a0a0a 100%)',
          borderBottom: '1px solid #1a2a1a',
          paddingTop: 56,
          paddingBottom: 48,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative ring */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            height: 600,
            borderRadius: '50%',
            border: '1px solid rgba(34,197,94,0.06)',
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
            width: 400,
            height: 400,
            borderRadius: '50%',
            border: '1px solid rgba(34,197,94,0.08)',
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
              background: 'linear-gradient(135deg, #f8fafc 0%, #22c55e 50%, #eab308 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Longevity Science
          </h1>
          <p
            style={{
              fontSize: 17,
              color: '#94a3b8',
              margin: '0 auto',
              lineHeight: 1.65,
              maxWidth: 540,
            }}
          >
            The evidence base for living longer, better — from molecular biology to
            population-level mortality data, translated into actionable protocols.
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

      {/* Longevity Equation */}
      <div style={{ maxWidth: 900, margin: '32px auto 0', padding: '0 20px' }}>
        <LongevityEquation />
      </div>

      {/* VO2max Tier Chart */}
      <div style={{ maxWidth: 900, margin: '24px auto 0', padding: '0 20px' }}>
        <VO2TierChart />
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
            <span style={{ color: '#94a3b8', fontWeight: 700 }}>Disclaimer:</span> This page summarises
            peer-reviewed population studies. Effect sizes reflect relative risk reductions from
            observational and RCT data; individual results will vary. Consult a physician before
            beginning any exercise, dietary, or heat-exposure protocol.
          </p>
        </div>
      </div>
    </div>
  )
}

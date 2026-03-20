// Blood Glucose Science — server component
// Evidence-based blood glucose page covering physiology, insulin resistance,
// exercise effects, and CGM technology with metabolic flexibility insights.

export const metadata = { title: 'Blood Glucose Science' }

// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '70%',
    label: 'TIR Target',
    sub: 'Time in 70–180 mg/dL range (ADA 2023)',
    accent: '#ef4444',
  },
  {
    value: '58%',
    label: 'T2D Risk Reduction',
    sub: '7% weight loss + 150 min/week exercise (DPP Trial)',
    accent: '#f97316',
  },
  {
    value: '0.97%',
    label: 'HbA1c Reduction',
    sub: 'Combined aerobic + resistance training (DARE Trial)',
    accent: '#3b82f6',
  },
]

const GLUCOSE_RANGES = [
  {
    label: 'Hypoglycemia',
    range: '< 70 mg/dL',
    hba1c: '—',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.12)',
    border: 'rgba(124,58,237,0.3)',
    note: 'Requires immediate treatment',
  },
  {
    label: 'Optimal Longevity',
    range: '70–90 mg/dL (fasting)',
    hba1c: '< 5.4%',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.3)',
    note: 'Postprandial < 140 mg/dL',
  },
  {
    label: 'Normal',
    range: '80–130 mg/dL (fasting)',
    hba1c: '< 5.7%',
    color: '#84cc16',
    bg: 'rgba(132,204,22,0.12)',
    border: 'rgba(132,204,22,0.3)',
    note: 'Post-meal < 180 mg/dL',
  },
  {
    label: 'Pre-Diabetic',
    range: '100–125 mg/dL (fasting)',
    hba1c: '5.7–6.4%',
    color: '#eab308',
    bg: 'rgba(234,179,8,0.12)',
    border: 'rgba(234,179,8,0.3)',
    note: 'IFG or IGT — intervention window',
  },
  {
    label: 'Diabetic',
    range: '≥ 126 mg/dL (fasting)',
    hba1c: '≥ 6.5%',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    note: 'ADA target HbA1c < 7% (eAG ~154)',
  },
]

const SCIENCE_CARDS = [
  {
    id: 'physiology',
    icon: 'G',
    iconBg: 'rgba(239,68,68,0.15)',
    iconBorder: 'rgba(239,68,68,0.35)',
    iconColor: '#fca5a5',
    title: 'Glucose Physiology & Ranges',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.08)',
    accentBorder: 'rgba(239,68,68,0.25)',
    facts: [
      {
        citation: 'ADA Standards 2023 (Diabetes Care)',
        text: 'Time in range (TIR, 70–180 mg/dL) ≥70% is the primary CGM-based glycemic target. Fasting glucose target: 80–130 mg/dL; post-meal <180 mg/dL; HbA1c <7% (eAG ~154 mg/dL). Prediabetes is defined by fasting glucose 100–125 mg/dL (IFG) or HbA1c 5.7–6.4%. Each 10% improvement in TIR correlates with approximately a 0.5% HbA1c reduction and a 35% lower risk of retinopathy progression.',
        stat: 'TIR +10% → −0.5% HbA1c, −35% retinopathy risk',
      },
      {
        citation: 'Derr 2003 (Diabetes Technol Ther)',
        text: 'Estimated average glucose (eAG) from HbA1c follows a linear relationship: HbA1c 5% ≈ 97 mg/dL, 6% ≈ 126, 7% ≈ 154, 8% ≈ 183, 9% ≈ 212 mg/dL. Formula: eAG = (28.7 × HbA1c) − 46.7. Important clinical limitations: HbA1c is inaccurate in hemolytic anemia, iron deficiency anemia, and hemoglobin variants (HbS, HbC), where CGM-derived metrics are preferred.',
        stat: 'eAG = (28.7 × HbA1c) − 46.7; HbA1c 7% ≈ 154 mg/dL',
      },
      {
        citation: 'Danne 2017 (Diabetes Care)',
        text: 'Glucose variability is an independent risk factor for cardiovascular disease. A coefficient of variation (CV) >36% defines high variability. MAGE (mean amplitude of glycemic excursions) >100 mg/dL predicts microvascular and macrovascular complications. Even brief 15-minute hypoglycemia episodes impair cognitive function for 45+ minutes after glucose normalises. TBR targets: <70 mg/dL <4% of time; <54 mg/dL <1% of time.',
        stat: 'CV >36% = high variability; TBR <70 must be <4% of time',
      },
      {
        citation: 'UKPDS 1998 (Lancet)',
        text: 'Intensive glycemic control in newly diagnosed T2D reduces microvascular complications by 25%. Each 1% reduction in HbA1c yields 37% fewer microvascular complications and 21% fewer diabetes-related deaths. The metabolic memory (legacy effect) of early tight glycemic control persists for decades after the intervention period ends. Cardiovascular benefit from tight control requires 10+ years of sustained glycemic management to become statistically apparent.',
        stat: '−1% HbA1c → −37% microvascular complications, −21% diabetes deaths',
      },
    ],
  },
  {
    id: 'insulin-resistance',
    icon: 'I',
    iconBg: 'rgba(249,115,22,0.15)',
    iconBorder: 'rgba(249,115,22,0.35)',
    iconColor: '#fdba74',
    title: 'Insulin Resistance & Metabolic Health',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.08)',
    accentBorder: 'rgba(249,115,22,0.25)',
    facts: [
      {
        citation: 'DeFronzo 2009 (Diabetes)',
        text: 'The "ominous octet" describes eight pathophysiological defects driving T2D: insulin resistance in skeletal muscle (the most common first defect), liver, and adipose tissue; impaired beta-cell insulin secretion; increased glucagon secretion; enhanced renal glucose reabsorption (increased SGLT2 activity); reduced incretin effect; and brain insulin resistance. Approximately 50% of beta-cell functional mass is already lost at the time of T2D diagnosis, with progressive loss thereafter.',
        stat: '50% beta-cell mass lost by T2D diagnosis; 8 simultaneous defects',
      },
      {
        citation: 'Boden 2002 (Am J Physiol)',
        text: 'Elevated free fatty acids (FFAs) impair insulin signaling via diacylglycerol accumulation, activating protein kinase C (PKC) and impairing IRS-1 tyrosine phosphorylation. Ceramide accumulation from saturated FFA metabolism directly disrupts GLUT4 translocation to the cell membrane. Visceral adipose tissue releases three times more FFAs per unit mass than subcutaneous fat. A single 24-hour high-fat feeding raises skeletal muscle insulin resistance by 50%.',
        stat: 'Visceral fat → 3× more FFAs; 24h high-fat diet → +50% skeletal muscle IR',
      },
      {
        citation: 'Knowler 2002 (NEJM — DPP Trial)',
        text: 'The Diabetes Prevention Program (n=3,234) demonstrated that a lifestyle intervention achieving 7% body weight loss plus 150 minutes per week of moderate-intensity exercise reduced progression from prediabetes to T2D by 58% versus placebo over 2.8 years. In adults aged 60+, the reduction was 71%. Metformin reduced T2D risk by 31%. Walking alone, independent of weight loss, is associated with a 30% reduction in T2D incidence.',
        stat: 'Lifestyle: −58% T2D risk; adults >60: −71%; walking alone: −30%',
      },
      {
        citation: 'Cusi 2010 (Diabetes Care)',
        text: 'A single aerobic exercise bout increases skeletal muscle glucose uptake 2–10× during exercise through insulin-independent GLUT4 translocation. Post-exercise insulin sensitivity remains elevated for 12–48 hours via AMPK pathway activation, increasing GLUT4 protein content and membrane translocation capacity independently of insulin signaling. HIIT improves insulin sensitivity by 20–35% within 2 weeks — compared to 6 weeks required for equivalent improvement with moderate continuous exercise.',
        stat: 'Single aerobic bout: 2–10× glucose uptake; HIIT: +20–35% insulin sensitivity in 2 weeks',
      },
    ],
  },
  {
    id: 'exercise-glucose',
    icon: 'X',
    iconBg: 'rgba(59,130,246,0.15)',
    iconBorder: 'rgba(59,130,246,0.35)',
    iconColor: '#93c5fd',
    title: 'Exercise & Blood Glucose',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    facts: [
      {
        citation: 'Sigal 2006 (Ann Intern Med — DARE Trial)',
        text: 'The DARE trial (n=251 T2D adults) demonstrated combined aerobic and resistance training reduces HbA1c by 0.97% — significantly greater than aerobic training alone (0.51%) or resistance training alone (0.38%). The synergistic effect arises from complementary mechanisms: aerobic exercise directly oxidises circulating glucose as fuel, while resistance training increases total muscle glycogen storage capacity and GLUT4 transporter content, enhancing both immediate and chronic glucose disposal.',
        stat: 'Combined training: −0.97% HbA1c vs −0.51% aerobic or −0.38% resistance alone',
      },
      {
        citation: 'van Dijk 2012 (Diabetes Care)',
        text: 'Three 15-minute light-intensity walks after each main meal reduce postprandial glucose by 22% compared to a single 45-minute continuous walk — equivalent total exercise duration. Post-dinner walking is the most effective of the three meal-time walks, given typical evening glucose nadir timing and blunted insulin sensitivity. The "walk after every meal" strategy is more effective than front-loading exercise earlier in the day when meals have not yet occurred.',
        stat: '3 × 15-min post-meal walks: −22% postprandial glucose vs one 45-min walk',
      },
      {
        citation: 'Chimen 2012 (Obes Rev)',
        text: 'Exercise glycemic effects in T1D are modality-dependent. Aerobic exercise during the day raises hypoglycemia risk via increased glucose uptake without hormonal counter-regulation. Resistance exercise acutely raises blood glucose through catecholamine-driven hepatic glucose output. Nighttime exercise increases nocturnal hypoglycemia risk by 3–4× compared to morning exercise. CGM use reduces exercise-induced hypoglycemia events by 40% versus self-monitoring of blood glucose alone.',
        stat: 'CGM reduces exercise hypoglycemia events 40% vs fingerstick monitoring',
      },
      {
        citation: 'Marliss 2002 (Diabetes)',
        text: 'Exercise above 80% VO₂max raises blood glucose acutely via hepatic glucose output driven by epinephrine and glucagon surges. Non-diabetic marathon runners can reach 180–250 mg/dL during race conditions from catecholamine-driven hepatic glucose production. HIIT raises blood glucose acutely, followed by a delayed glucose nadir 2–4 hours post-exercise — representing a significant delayed hypoglycemia risk window for T1D individuals, requiring CGM vigilance throughout recovery.',
        stat: 'Exercise >80% VO₂max → acute glucose rise; delayed hypoglycemia 2–4h post-HIIT',
      },
    ],
  },
  {
    id: 'cgm-metabolic',
    icon: 'C',
    iconBg: 'rgba(34,197,94,0.15)',
    iconBorder: 'rgba(34,197,94,0.35)',
    iconColor: '#86efac',
    title: 'CGM Technology & Metabolic Flexibility',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.25)',
    facts: [
      {
        citation: 'Danne 2017 (Diabetes Care)',
        text: 'International consensus defines standardised CGM metrics: TIR ≥70% (70–180 mg/dL); TBR <70 mg/dL <4% of time; TBR <54 mg/dL <1%; TAR >180 mg/dL <25%; TAR >250 mg/dL <5%; CV <36%. CGM use reduces severe hypoglycemia events by 38% versus traditional self-monitoring of blood glucose. Real-time CGM with continuous alarms is superior to intermittent flash scanning for hypoglycemia prevention in high-risk individuals.',
        stat: 'CGM: −38% severe hypoglycemia; TAR >180 must be <25% of time',
      },
      {
        citation: 'Hall 2021 (Nat Med) / Zeevi 2015 (Cell)',
        text: 'CGM in 1,000 healthy non-diabetic adults (Hall 2021) reveals that 30–40% of postprandial readings exceed 140 mg/dL — a threshold associated with increased glycation risk. Individual glycemic responses to identical meals vary by up to 300% (Zeevi 2015, n=800), driven primarily by gut microbiome composition, meal timing, sleep, and prior physical activity rather than macronutrient content alone. CGM-guided personalized nutrition coaching reduces postprandial glucose responses 30% more than standard dietary advice.',
        stat: '30–40% of non-diabetics exceed 140 mg/dL postprandially; 300% inter-individual variation',
      },
      {
        citation: 'Volek 2009 (Nutr Metab) / Sainsbury 2018 (Lancet Diabetes)',
        text: 'Low-carbohydrate diets (≤130g carbohydrate/day) reduce HbA1c by 0.8–1.5% in T2D adults over 6 months, outperforming low-fat diets in short-term glycemic control (Sainsbury 2018 meta-analysis). The metabolic mechanism involves reduced glucose flux and insulin secretion demand, with concomitant upregulation of fat oxidation pathways. Fat adaptation improves glucose stability and reduces glycemic variability even without meaningful weight loss, via mitochondrial substrate-switching efficiency.',
        stat: 'Low-carb (≤130g/day): −0.8–1.5% HbA1c in T2D over 6 months',
      },
      {
        citation: 'Attia 2023 (Outlive)',
        text: 'Blood glucose spikes above 180 mg/dL activate non-enzymatic protein glycation, producing advanced glycation end-products (AGEs) in arterial walls, neurons, and renal tissue — structural damage that is largely irreversible. Mitochondrial dysfunction correlating with insulin resistance precedes T2D diagnosis by decades. Fasting glucose ≥95 mg/dL (high-normal, non-diabetic range) is associated with 45% higher cardiovascular disease risk. Optimal longevity targets: fasting glucose 70–90 mg/dL, postprandial peak <140 mg/dL, HbA1c <5.4%.',
        stat: 'Fasting glucose ≥95 mg/dL (normal range) → +45% CVD risk; optimal: 70–90 fasting',
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

function GlucoseRangeTable() {
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
          background: 'rgba(239,68,68,0.08)',
          borderBottom: '1px solid rgba(239,68,68,0.2)',
          borderLeft: '3px solid #ef4444',
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
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.35)',
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
              color: '#fca5a5',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            R
          </span>
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Glucose Range Reference
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            ADA Standards 2023 · Attia 2023 (Outlive) · Danne 2017 (Diabetes Care)
          </p>
        </div>
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr 0.8fr 1.4fr',
          padding: '10px 16px',
          borderBottom: '1px solid #1a1a1a',
          gap: 8,
        }}
      >
        {['Classification', 'Glucose Range', 'HbA1c', 'Clinical Note'].map((h) => (
          <span
            key={h}
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.7px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {GLUCOSE_RANGES.map((row, i) => (
        <div
          key={row.label}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr 0.8fr 1.4fr',
            padding: '12px 16px',
            borderBottom: i < GLUCOSE_RANGES.length - 1 ? '1px solid #181818' : 'none',
            gap: 8,
            alignItems: 'center',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
          }}
        >
          {/* Classification */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: row.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.label}</span>
          </span>

          {/* Range */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#cbd5e1',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {row.range}
          </span>

          {/* HbA1c */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#94a3b8',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {row.hba1c}
          </span>

          {/* Note */}
          <span
            style={{
              fontSize: 11,
              color: '#64748b',
              lineHeight: 1.45,
            }}
          >
            {row.note}
          </span>
        </div>
      ))}

      {/* Legend bar */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #1a1a1a',
          display: 'flex',
          gap: 4,
          alignItems: 'stretch',
          height: 10,
        }}
      >
        {GLUCOSE_RANGES.map((row) => (
          <div
            key={row.label}
            title={row.label}
            style={{
              flex: 1,
              background: row.color,
              borderRadius: 3,
              opacity: 0.75,
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontSize: 11,
          color: '#334155',
          margin: 0,
          padding: '0 16px 12px',
          fontStyle: 'italic',
        }}
      >
        Gradient left to right: hypoglycemia · optimal longevity · normal · pre-diabetic · diabetic
      </p>
    </div>
  )
}

function FactRow({
  citation,
  text,
  stat,
}: {
  citation: string
  text: string
  stat: string
}) {
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

export default function BloodGlucoseSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f8fafc' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(160deg, #0a0a0a 0%, #1a0808 40%, #120000 70%, #0a0a0a 100%)',
          borderBottom: '1px solid #2a1010',
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
            width: 600,
            height: 600,
            borderRadius: '50%',
            border: '1px solid rgba(239,68,68,0.05)',
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
            border: '1px solid rgba(239,68,68,0.08)',
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
            width: 220,
            height: 220,
            borderRadius: '50%',
            border: '1px solid rgba(239,68,68,0.10)',
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
              color: '#ef4444',
              margin: '0 0 12px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            Evidence-Based Metabolic Science
          </p>
          <h1
            style={{
              fontSize: 'clamp(32px, 6vw, 52px)',
              fontWeight: 900,
              margin: '0 0 16px',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #ef4444 45%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Blood Glucose Science
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
            The evidence base for metabolic health — from glucose physiology and insulin
            resistance to CGM technology and longevity-optimised glycemic targets.
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

      {/* Glucose Range Table */}
      <div style={{ maxWidth: 900, margin: '32px auto 0', padding: '0 20px' }}>
        <GlucoseRangeTable />
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
            borderLeft: '3px solid #ef4444',
          }}
        >
          <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.6 }}>
            <span style={{ color: '#94a3b8', fontWeight: 700 }}>Disclaimer:</span> This page
            summarises peer-reviewed population studies and clinical trials. Glucose targets,
            HbA1c goals, and treatment thresholds must be individualised in consultation with a
            physician or certified diabetes care specialist. CGM interpretation should account for
            sensor accuracy, calibration, and haematological conditions affecting eAG validity.
          </p>
        </div>
      </div>
    </div>
  )
}

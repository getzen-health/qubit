// Stair Climbing Science — static server component
// Evidence-based stair climbing science page covering cardiovascular demand,
// muscle mechanics, longevity outcomes, and training protocols.

export const metadata = { title: 'Stair Climbing Science' }

// ─── MET Comparison Data ──────────────────────────────────────────────────────

const MET_ROWS = [
  {
    activity: 'Stair Climbing',
    detail: 'Fast (2+ steps/s)',
    met: 12,
    metDisplay: '12–14',
    barPct: 100,
    color: '#ef4444',
    badge: 'Vigorous+',
    badgeBg: 'rgba(239,68,68,0.15)',
    badgeBorder: 'rgba(239,68,68,0.35)',
    badgeColor: '#fca5a5',
  },
  {
    activity: 'Stair Climbing',
    detail: 'Moderate (1.5 steps/s)',
    met: 10.5,
    metDisplay: '10–11',
    barPct: 86,
    color: '#f97316',
    badge: 'Vigorous',
    badgeBg: 'rgba(249,115,22,0.15)',
    badgeBorder: 'rgba(249,115,22,0.35)',
    badgeColor: '#fdba74',
  },
  {
    activity: 'Running',
    detail: '8 min/mile pace',
    met: 11,
    metDisplay: '11',
    barPct: 84,
    color: '#f97316',
    badge: 'Vigorous',
    badgeBg: 'rgba(249,115,22,0.12)',
    badgeBorder: 'rgba(249,115,22,0.28)',
    badgeColor: '#fdba74',
  },
  {
    activity: 'Stair Climbing',
    detail: 'Slow (1 step/s)',
    met: 8.5,
    metDisplay: '8–9',
    barPct: 71,
    color: '#eab308',
    badge: 'Vigorous',
    badgeBg: 'rgba(234,179,8,0.12)',
    badgeBorder: 'rgba(234,179,8,0.28)',
    badgeColor: '#fde047',
  },
  {
    activity: 'Cycling',
    detail: '14–16 mph',
    met: 10,
    metDisplay: '10',
    barPct: 79,
    color: '#eab308',
    badge: 'Vigorous',
    badgeBg: 'rgba(234,179,8,0.12)',
    badgeBorder: 'rgba(234,179,8,0.28)',
    badgeColor: '#fde047',
  },
  {
    activity: 'Running',
    detail: '10 min/mile pace',
    met: 9,
    metDisplay: '9',
    barPct: 73,
    color: '#eab308',
    badge: 'Vigorous',
    badgeBg: 'rgba(234,179,8,0.10)',
    badgeBorder: 'rgba(234,179,8,0.25)',
    badgeColor: '#fde047',
  },
  {
    activity: 'Stair Descent',
    detail: 'Normal pace',
    met: 3.5,
    metDisplay: '3–4',
    barPct: 32,
    color: '#3b82f6',
    badge: 'Moderate',
    badgeBg: 'rgba(59,130,246,0.12)',
    badgeBorder: 'rgba(59,130,246,0.28)',
    badgeColor: '#93c5fd',
  },
  {
    activity: 'Brisk Walking',
    detail: '3.5–4 mph',
    met: 4.5,
    metDisplay: '4–5',
    barPct: 40,
    color: '#22c55e',
    badge: 'Moderate',
    badgeBg: 'rgba(34,197,94,0.12)',
    badgeBorder: 'rgba(34,197,94,0.28)',
    badgeColor: '#86efac',
  },
  {
    activity: 'Cycling',
    detail: '10–12 mph',
    met: 6,
    metDisplay: '6',
    barPct: 50,
    color: '#84cc16',
    badge: 'Moderate+',
    badgeBg: 'rgba(132,204,22,0.12)',
    badgeBorder: 'rgba(132,204,22,0.28)',
    badgeColor: '#bef264',
  },
  {
    activity: 'Walking',
    detail: '3 mph',
    met: 3.5,
    metDisplay: '3–4',
    barPct: 30,
    color: '#64748b',
    badge: 'Light–Mod',
    badgeBg: 'rgba(100,116,139,0.12)',
    badgeBorder: 'rgba(100,116,139,0.28)',
    badgeColor: '#94a3b8',
  },
  {
    activity: 'Elevator',
    detail: 'Riding (standing)',
    met: 1.3,
    metDisplay: '~1.3',
    barPct: 10,
    color: '#334155',
    badge: 'Sedentary',
    badgeBg: 'rgba(51,65,85,0.12)',
    badgeBorder: 'rgba(51,65,85,0.28)',
    badgeColor: '#475569',
  },
]

// ─── Science Cards Data ───────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'cardio',
    icon: '♥',
    iconBg: 'rgba(239,68,68,0.15)',
    iconBorder: 'rgba(239,68,68,0.35)',
    iconColor: '#fca5a5',
    title: 'Cardiovascular Demand & Efficiency',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.08)',
    accentBorder: 'rgba(239,68,68,0.25)',
    facts: [
      {
        citation: 'Teh & Aziz 2002 (Ergonomics)',
        text: 'Stair climbing delivers 8–14 METs — one of the highest-intensity weight-bearing activities achievable without equipment. A 70 kg person expends approximately 0.15–0.20 kcal per step ascending. Descending costs only 3–4 METs. Critically, 85–90% HRmax is achieved within just 60 seconds of ascent, meaning even brief stair bouts constitute a meaningful cardiovascular stimulus — a property shared by few other accessible activities.',
        stat: '8–14 METs ascending · 0.15–0.20 kcal/step (70 kg) · 85–90% HRmax in 60 s',
      },
      {
        citation: 'Boreham 2005 (J Sports Sci)',
        text: 'Three 1-minute stair bouts per day, 5 days per week, over 12 weeks improved VO₂max by 8.6% in sedentary women. Shorter accumulated bouts yielded cardiovascular benefit equivalent to continuous exercise sessions. The total weekly dose was only 15 minutes — placing stair-climbing among the most time-efficient fitness interventions ever documented in a randomised controlled trial.',
        stat: '3 × 1-min bouts/day, 5 days/week → +8.6% VO₂max in 12 weeks · only 15 min/week total',
      },
      {
        citation: 'Stairs vs Elevator — Public Health Data',
        text: 'A 10-flight stair climb takes 60–90 seconds and burns 8–12 kcal while reaching 85–90% HRmax. The same journey by elevator burns 0 kcal. Choosing stairs over the elevator just twice per day (10 floors each way) over a year yields approximately 4,000–6,000 kcal expended. NICE (National Institute for Health and Care Excellence) recommends stair-use prompting signage as a population-level physical activity intervention, citing zero cost and no access barriers.',
        stat: '10-flight stair climb: 60–90 s, 8–12 kcal, 85–90% HRmax · elevator: 0 kcal · 1 year: 4,000–6,000 kcal',
      },
      {
        citation: 'Allender 2006 (Obes Rev) / Engbers 2005',
        text: 'Stair climbing is classified as vigorous-intensity (≥6 METs) during sustained effort, delivering approximately 3× the cardiovascular stimulus per minute compared to walking at the same time investment. Workplace stair intervention programmes increased climbing frequency by 50–190% (Engbers 2005). Apple Watch counts flights climbed via its barometric pressure sensor, which is accurate to approximately ±1 floor — making it a reliable passive tracker of stair activity.',
        stat: '≥6 METs (vigorous) · 3× stimulus/min vs walking · workplace programmes +50–190% use',
      },
    ],
  },
  {
    id: 'biomechanics',
    icon: 'M',
    iconBg: 'rgba(59,130,246,0.15)',
    iconBorder: 'rgba(59,130,246,0.35)',
    iconColor: '#93c5fd',
    title: 'Muscle Mechanics & Biomechanics',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    facts: [
      {
        citation: 'Nadeau 2003 (Gait Posture)',
        text: 'The ascent cycle divides into push phase (ankle plantarflexion, knee extension) generating 40% of propulsive force, and pull phase (hip flexion, knee flexion) generating 60%. Quadriceps peak torque reaches 100–140% body weight at the knee during ascent. Descending demands eccentric quadriceps work at 80–120% body weight — which is why delayed-onset muscle soreness (DOMS) is more common after descending than ascending, particularly in untrained individuals.',
        stat: 'Push phase 40% / pull phase 60% propulsion · quad torque 100–140% BW ascending · DOMS more common descending',
      },
      {
        citation: 'Reeves 2009 (Med Sci Sports Exerc)',
        text: 'EMG analysis identifies vastus lateralis and gastrocnemius as the primary engines of ascent. Gluteus maximus is activated 30% more intensely during stair climbing than during level walking. Vastus medialis oblique (VMO) activation is 40% higher on stairs versus flat walking, making stair climbing particularly valuable in patellofemoral rehabilitation programmes. Eight weeks of stair training improves quadriceps strength by 12–18%.',
        stat: 'Glut max +30% vs walking · VMO +40% vs flat · 8 weeks stair training → +12–18% quad strength',
      },
      {
        citation: 'Simoneau 2001',
        text: 'Stair descent provides accessible eccentric exercise with a built-in repeated bout effect that progressively reduces subsequent DOMS. Controlled descent training — 3 sets of 5 flights, 3 times per week — increases eccentric quadriceps strength by 22% in 6 weeks. This is particularly valuable for older adults who require eccentric conditioning but cannot tolerate the impact stresses of running. Eccentric capacity is strongly associated with fall prevention and functional independence.',
        stat: '3 sets × 5 flights, 3×/week → +22% eccentric quad strength in 6 weeks',
      },
      {
        citation: 'Brunner-La Rocca 2000 — Clinical Stair Test',
        text: 'The 60-step stair climb test is a validated clinical assessment: patients who take more than 90 seconds have poor cardiac prognosis. Patients who cannot exceed 5 METs on a treadmill are typically unable to climb 3 flights. The correlation coefficient between stair test performance and treadmill exercise capacity is r = 0.92. An inability to climb 3 flights briskly is classified as high perioperative risk for elective surgery — making stair performance a clinically meaningful vital sign.',
        stat: '>90 s for 60 steps = poor cardiac prognosis · r = 0.92 with treadmill · cannot climb 3 flights briskly = high surgical risk',
      },
    ],
  },
  {
    id: 'longevity',
    icon: 'L',
    iconBg: 'rgba(34,197,94,0.15)',
    iconBorder: 'rgba(34,197,94,0.35)',
    iconColor: '#86efac',
    title: 'Stair Climbing & Longevity',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.25)',
    facts: [
      {
        citation: 'Meyer 2020 (Eur J Prev Cardiol)',
        text: 'Each additional flight climbed per day is associated with a 3% lower all-cause mortality. Climbing 5 or more flights per day corresponds to a 20% lower mortality risk compared to sedentary individuals — an effect that is independent of other forms of exercise. This demonstrates that incidental physical activity provides additive mortality benefit beyond structured exercise. Building occupants who routinely take stairs show 15–20% higher cardiovascular fitness than matched elevator users.',
        stat: '+1 flight/day → −3% all-cause mortality · 5+ flights/day → −20% vs sedentary · stair users 15–20% fitter than elevator users',
      },
      {
        citation: 'Ekelund 2019 (BMJ)',
        text: 'Vigorous-intensity physical activity (>6 METs, which includes stair climbing) provides 3–5× more mortality benefit per minute than moderate-intensity exercise. Even 10 minutes of vigorous activity per week produces statistically significant benefit. In terms of cardiovascular benefit per unit of time invested, 4 flights of stairs is equivalent to approximately 30 minutes of walking. At the same time cost, stairs deliver roughly 3× the cardiovascular stimulus of brisk walking.',
        stat: 'Vigorous PA: 3–5× more mortality benefit/min vs moderate · 4 flights ≡ 30 min walking for CV benefit',
      },
      {
        citation: 'Hamer 2012 (Eur J Cardiovasc Prev Rehab)',
        text: 'Scottish Health Survey data: climbing 5 or more floors per day was associated with an 18% lower cardiovascular disease risk after controlling for BMI, socioeconomic status, and other exercise habits. The association was strongest in previously sedentary individuals — the baseline benefit is greatest for those who move the least. Modelling suggests that increasing stair climbing by just 2 flights per day across the adult population would reduce CVD incidence by 3–5%.',
        stat: '≥5 floors/day → −18% CVD risk · strongest in sedentary individuals · population +2 flights/day → −3–5% CVD incidence',
      },
      {
        citation: 'Kang 2018 (J Exerc Nutr Biochem)',
        text: 'Twelve-week stair-climbing protocol (3 days/week, 50 minutes/session) in adults with metabolic syndrome produced: fasting glucose −12%, triglycerides −18%, waist circumference −3.2 cm, and VO₂max +11%. These outcomes are comparable to moderate-intensity continuous running. The intervention required no special equipment, is weather-independent, and can be fully integrated into a daily work commute — addressing the most common barrier to exercise adherence.',
        stat: '12-week stair protocol: glucose −12%, triglycerides −18%, waist −3.2 cm, VO₂max +11% · comparable to running',
      },
    ],
  },
  {
    id: 'protocols',
    icon: 'P',
    iconBg: 'rgba(249,115,22,0.15)',
    iconBorder: 'rgba(249,115,22,0.35)',
    iconColor: '#fdba74',
    title: 'Training Protocols & Practical Applications',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.08)',
    accentBorder: 'rgba(249,115,22,0.25)',
    facts: [
      {
        citation: 'Murtagh 2005 (Prev Med)',
        text: 'Beginner protocol: 2-minute stair bouts (approximately 3 flights), 5 times per day, 5 days per week, for 8 weeks produced VO₂max +6.2%, LDL cholesterol −8%, waist circumference −1.8 cm. No knee pain was reported despite universal DOMS in week 1. The protocol is safe at BMI up to 35 at self-selected pace. Evidence-based beginner prescription: start at 1 flight 3–4 times per day, add 1 flight every 2 weeks, targeting 5 or more floors twice daily.',
        stat: '2-min bouts × 5/day, 5 days/week, 8 weeks → VO₂max +6.2%, LDL −8%, waist −1.8 cm · safe to BMI 35',
      },
      {
        citation: 'Pace & METs Reference / HIIT Protocol',
        text: 'MET output by pace: slow (1 step/s) = 8–9 METs; moderate (1.5 steps/s) = 10–11 METs; fast (2+ steps/s) = 12–14 METs. Taking two steps at a time increases gluteus maximus activation by 35% and cardiovascular demand by 15%. HIIT stair protocol: 20 seconds maximum-effort stair sprint, 40 seconds walk-down recovery, for 8–10 rounds. This produces excess post-exercise oxygen consumption (EPOC) 22% above resting baseline lasting approximately 2 hours post-session.',
        stat: 'Slow: 8–9 METs · moderate: 10–11 · fast: 12–14 · 2-at-a-time: +35% glut max, +15% CV · HIIT EPOC +22% for 2h',
      },
      {
        citation: 'Simoneau 2001 / Descent Training Protocol',
        text: 'Descent-specific training: 3 sets of 10 flights descended slowly (3–4 seconds per step) is equivalent to Nordic hamstring curls for eccentric quadriceps conditioning. This approach reduces knee osteoarthritis pain by strengthening the VMO. Controlling knee angle below 90° limits patellofemoral joint compression. The combination of walking up (concentric contraction) and slowly descending (eccentric contraction) constitutes a complete lower-limb conditioning session within a single staircase.',
        stat: '3 sets × 10 flights slowly → eccentric conditioning equivalent to Nordic curls · knee angle <90° limits patellofemoral load',
      },
      {
        citation: 'Apple Watch Flights Climbed — Sensor Methodology',
        text: 'Apple Watch uses a barometric altimeter to count flights climbed, triggering one count per approximately 3 metres of vertical gain. Passive escalator or elevator use is not accurately credited. Active vertical gain from stairs, hills, and incline treadmills all count toward the metric. An evidence-based daily target is 10 flights, grounded in the Meyer 2020 mortality data. A declining trend in this metric over weeks or months may signal meaningful lifestyle changes worth investigating with a physician.',
        stat: '1 flight ≈ 3 m vertical · stairs, hills, incline treadmill all count · 10 flights/day = evidence-based target · declining trend warrants attention',
      },
    ],
  },
]

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '8–14',
    label: 'METs Ascending',
    sub: 'Teh & Aziz 2002 — highest-intensity bodyweight activity',
    accent: '#ef4444',
  },
  {
    value: '8.6%',
    label: 'VO₂max Gain',
    sub: '3 × 1-min bouts/day for 12 weeks (Boreham 2005)',
    accent: '#3b82f6',
  },
  {
    value: '20%',
    label: 'Lower Mortality',
    sub: '5+ flights/day vs sedentary (Meyer 2020)',
    accent: '#22c55e',
  },
  {
    value: '3–5×',
    label: 'More Benefit/min',
    sub: 'Vigorous vs moderate-intensity PA (Ekelund 2019)',
    accent: '#f97316',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

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
        minWidth: 150,
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
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '6px 0 3px' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.4 }}>{sub}</p>
    </div>
  )
}

function MetTable() {
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
              fontSize: 13,
              fontWeight: 900,
              color: '#fca5a5',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            M
          </span>
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            MET Comparison — Per-Minute Intensity
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            Metabolic equivalents of task · stair climbing vs common activities
          </p>
        </div>
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '0 12px',
          padding: '10px 20px 8px',
          borderBottom: '1px solid #1a1a1a',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Activity</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'right' }}>METs</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'right' }}>Zone</span>
      </div>

      {/* Rows */}
      <div style={{ padding: '8px 20px 16px' }}>
        {MET_ROWS.map((row, i) => (
          <div
            key={i}
            style={{
              marginBottom: 10,
              paddingBottom: 10,
              borderBottom: i < MET_ROWS.length - 1 ? '1px solid #161616' : 'none',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: '0 12px',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: row.activity === 'Stair Climbing' || row.activity === 'Stair Descent'
                      ? '#e2e8f0'
                      : '#94a3b8',
                  }}
                >
                  {row.activity}
                </span>
                <span style={{ fontSize: 11, color: '#475569', marginLeft: 6 }}>{row.detail}</span>
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: row.color,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  textAlign: 'right',
                  minWidth: 40,
                }}
              >
                {row.metDisplay}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: row.badgeColor,
                  background: row.badgeBg,
                  border: `1px solid ${row.badgeBorder}`,
                  borderRadius: 4,
                  padding: '2px 6px',
                  whiteSpace: 'nowrap',
                  minWidth: 68,
                  textAlign: 'center',
                }}
              >
                {row.badge}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: '#1a1a1a',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${row.barPct}%`,
                  background: `linear-gradient(90deg, ${row.color}88, ${row.color})`,
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Insight callout */}
      <div
        style={{
          margin: '0 20px 20px',
          padding: '12px 14px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: 10,
        }}
      >
        <p style={{ fontSize: 12, color: '#fca5a5', margin: 0, lineHeight: 1.55 }}>
          <span style={{ fontWeight: 700 }}>Key insight:</span> A single minute of stair climbing
          (12–14 METs) delivers 3–4× the cardiovascular stimulus of brisk walking and is
          comparable to sprint running — with zero equipment required and accessible in almost
          every building.
        </p>
      </div>
    </div>
  )
}

function FactRow({
  citation,
  text,
  stat,
  accent,
}: {
  citation: string
  text: string
  stat: string
  accent: string
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
          fontSize: 11,
          fontWeight: 700,
          color: accent,
          margin: 0,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          background: '#1a1a1a',
          borderRadius: 6,
          padding: '5px 10px',
          display: 'inline-block',
          lineHeight: 1.5,
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
        <FactRow key={i} citation={fact.citation} text={fact.text} stat={fact.stat} accent={accent} />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StairClimbingSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f8fafc' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(160deg, #0a0a0a 0%, #1a0808 40%, #180a05 70%, #0a0a0a 100%)',
          borderBottom: '1px solid #2a1212',
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
            border: '1px solid rgba(239,68,68,0.04)',
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
            border: '1px solid rgba(239,68,68,0.07)',
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
            border: '1px solid rgba(239,68,68,0.05)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto', padding: '0 24px' }}>
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
            Evidence-Based Medicine
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
            Stair Climbing Science
          </h1>
          <p
            style={{
              fontSize: 17,
              color: '#94a3b8',
              margin: '0 auto',
              lineHeight: 1.65,
              maxWidth: 580,
            }}
          >
            The most underrated cardiovascular stimulus in any building — decoded. From 8–14 MET
            intensity curves and quadriceps biomechanics to longevity data, HIIT protocols, and
            Apple Watch barometric altitude tracking.
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

      {/* MET comparison table */}
      <div style={{ maxWidth: 900, margin: '28px auto 0', padding: '0 20px' }}>
        <MetTable />
      </div>

      {/* Section label */}
      <div style={{ maxWidth: 900, margin: '40px auto 0', padding: '0 20px' }}>
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
        <p
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#f1f5f9',
            margin: '6px 0 0',
            letterSpacing: '-0.5px',
          }}
        >
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
            summarises peer-reviewed population studies, randomised controlled trials, and
            meta-analyses. Effect sizes reflect relative risk reductions from observational and
            RCT data; individual results will vary. Stair-climbing programmes should be progressed
            gradually, particularly in individuals with cardiovascular disease, knee osteoarthritis,
            or balance impairments. Consult a physician before beginning any structured exercise
            protocol. MET values are reference estimates and vary by body weight, fitness level, and
            climbing pace.
          </p>
        </div>
      </div>
    </div>
  )
}

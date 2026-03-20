// VO₂max Science — server component
// Evidence-based VO₂max page covering physiology, longevity, training,
// and measurement/estimation methods.

export const metadata = { title: 'VO₂max Science' }

// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '5×',
    label: 'Higher Mortality',
    sub: 'Low vs elite VO₂max — stronger than smoking (Mandsager 2018)',
    accent: '#ef4444',
  },
  {
    value: '13%',
    label: 'Mortality Reduction',
    sub: 'Per 1 MET increase in cardiorespiratory fitness (Kodama 2009)',
    accent: '#3b82f6',
  },
  {
    value: '46%',
    label: 'VO₂max Gain',
    sub: '4×4 HIIT in post-MI patients vs 14% moderate (Wisløff 2007)',
    accent: '#22c55e',
  },
]

const SCIENCE_CARDS = [
  {
    id: 'physiology',
    icon: 'Φ',
    iconBg: 'rgba(59,130,246,0.15)',
    iconBorder: 'rgba(59,130,246,0.35)',
    iconColor: '#93c5fd',
    title: 'VO₂max Physiology & Determinants',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    facts: [
      {
        citation: 'Bassett & Howley 2000 (Med Sci Sports Exerc)',
        text: 'VO₂max is determined by the Fick equation: VO₂max = cardiac output (CO) × arteriovenous oxygen difference (a-vO₂ diff). Cardiac output is the primary central limiter — untrained stroke volume (SV) is ~70 mL while elite cyclists reach ~200 mL, yielding CO of ~20 L/min untrained vs ~40 L/min in elite athletes. Peripheral determinants include mitochondrial density and capillary-to-fiber ratio. Eccentric cardiac hypertrophy from endurance training is the primary structural adaptation driving SV gains.',
        stat: 'Elite CO 40 L/min vs untrained 20 L/min; SV 200 mL vs 70 mL',
      },
      {
        citation: 'Dempsey 2006 (J Physiol)',
        text: 'Exercise-induced arterial hypoxemia (EIAH) occurs in ~50% of elite athletes with VO₂max >60 mL/kg/min. Arterial O₂ saturation drops 3–5% at maximal effort due to incomplete pulmonary gas exchange at high cardiac outputs. Critically, pulmonary diffusion capacity is NOT trainable — it is a fixed anatomical constraint. Supplemental O₂ improves performance only in elite athletes, not untrained individuals, confirming that respiratory limitation is contingent on reaching high fitness levels.',
        stat: 'EIAH in 50% of elite (VO₂max >60); SaO₂ drops 3–5% at VO₂max',
      },
      {
        citation: 'Saltin 1985 (Acta Physiol Scand)',
        text: 'Peripheral adaptations are equally important as central cardiac changes. Trained muscles extract O₂ more completely across the capillary bed. Mitochondrial volume density doubles with endurance training; capillary density increases 20–40%; myoglobin concentration rises 15–20%. In previously untrained individuals, peripheral adaptations account for ~50% of the total VO₂max improvement seen in the first 6 months of training.',
        stat: 'Mitochondrial density ×2; capillary density +20–40%; myoglobin +15–20%',
      },
      {
        citation: 'Coyle 1995 (J Appl Physiol)',
        text: 'Detraining rapidly erodes VO₂max. The initial 6–20% decline occurs within 3 weeks of stopping training, with the fastest losses in the first 2 weeks driven by plasma volume contraction and reduced stroke volume. Approximately 50% of training-induced gains are lost after 12 weeks of inactivity. Cardiac remodeling — including ventricular wall thickness and chamber volume — requires 3–11 months to fully reverse after training cessation.',
        stat: 'VO₂max −6–20% within 3 weeks; cardiac remodeling reversal 3–11 months',
      },
    ],
  },
  {
    id: 'longevity',
    icon: '♡',
    iconBg: 'rgba(239,68,68,0.15)',
    iconBorder: 'rgba(239,68,68,0.35)',
    iconColor: '#fca5a5',
    title: 'VO₂max & Longevity',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.08)',
    accentBorder: 'rgba(239,68,68,0.25)',
    facts: [
      {
        citation: 'Mandsager 2018 (JAMA Network Open)',
        text: 'In 122,007 patients, those in the lowest VO₂max quartile (low CRF) had 5× higher all-cause mortality compared to elite performers (top 2.3%), a relative risk comparable to — and exceeding — smoking. Each 1 MET increase in measured fitness was associated with a 13% reduction in mortality. Fitness was the strongest single mortality predictor in the dataset, outperforming diabetes, smoking status, hypertension, and coronary artery disease as independent predictors.',
        stat: 'Low vs elite CRF: 5× all-cause mortality; >smoking as mortality predictor',
      },
      {
        citation: 'Kodama 2009 (JAMA)',
        text: 'Meta-analysis of 33 studies (N=102,980) confirmed that each 1 MET increase in CRF reduces cardiovascular disease (CVD) mortality by 15% and all-cause mortality by 13%. High vs low CRF is associated with 50–60% lower CVD and all-cause mortality. The dose-response extends across men and women, across healthy and diseased populations. Critically, no upper threshold of benefit was identified — higher VO₂max continues to confer protection at the highest levels studied.',
        stat: '+1 MET = −15% CVD mortality, −13% all-cause; high vs low CRF = −50–60%',
      },
      {
        citation: 'Erikssen 1998 (Lancet)',
        text: '16-year follow-up of 2,014 Norwegian men found that every 1 mL/kg/min increase in VO₂max was associated with a 9% reduction in 16-year CVD mortality. The "physical fitness paradox" emerged: sedentary individuals who improved fitness by 20% reduced their mortality risk by an amount equivalent to quitting smoking — placing VO₂max improvement among the most potent single modifiable risk factor interventions available in preventive medicine.',
        stat: '+1 mL/kg/min VO₂max = −9% 16-year CVD mortality',
      },
      {
        citation: 'Strand 2016 (Eur J Prev Cardiol)',
        text: 'VO₂max decline by decade follows a stark lifestyle-dependent trajectory. Sedentary individuals lose ~10% per decade after age 30 (~1%/year), while physically active adults lose only ~0.5%/year. Trained masters athletes maintain 30–40 mL/kg/min at age 70+ vs ~25 mL/kg/min for sedentary peers of the same age. Approximately 50% of the age-related VO₂max decline is attributable to lifestyle factors rather than biological aging — making it substantially reversible.',
        stat: 'Sedentary: −10%/decade; active: −5%/decade; 50% of decline is lifestyle-driven',
      },
    ],
  },
  {
    id: 'training',
    icon: '↑',
    iconBg: 'rgba(34,197,94,0.15)',
    iconBorder: 'rgba(34,197,94,0.35)',
    iconColor: '#86efac',
    title: 'Training for VO₂max Improvement',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.25)',
    facts: [
      {
        citation: 'Helgerud 2007 (Med Sci Sports Exerc)',
        text: 'The Norwegian 4×4 protocol — four 4-minute intervals at 90–95% HRmax with 3-minute active recovery — is the most evidence-supported HIIT method for VO₂max improvement. An 8-week RCT showed that 4×4 improved VO₂max by 7.2 mL/kg/min vs only 0.8 mL/kg/min for long slow distance (LSD) training. Stroke volume increased 10% more in the HIIT group. Three sessions per week is the minimum effective dose. In clinical populations (heart failure, post-MI), improvements of 10–20% in 12 weeks are documented.',
        stat: '4×4 HIIT: +7.2 mL/kg/min VO₂max vs +0.8 LSD in 8 weeks',
      },
      {
        citation: 'Midgley 2006 (Sports Med)',
        text: 'The maximal VO₂max stimulus requires ≥20 minutes of accumulated time at ≥90% VO₂max per session. Short Tabata-style protocols generate high perceived exertion and metabolic stress but provide a lower VO₂max-specific stimulus than longer interval formats. The Billat vVO₂max protocol — intervals at the minimum velocity that elicits VO₂max — is optimal for trained runners. Untrained individuals respond substantially to almost any aerobic stimulus above moderate intensity due to a large reserve for adaptation.',
        stat: 'Optimal stimulus: ≥20 min at ≥90% VO₂max per session',
      },
      {
        citation: 'Rønnestad 2014 (Scand J Med Sci Sports)',
        text: 'Block periodization — concentrated 3-week blocks of VO₂max-specific work — improves VO₂max 4.6% more than traditional mixed-intensity training in well-trained cyclists over a 12-week period. The greatest gains occur in weeks 3–4 of each block. Six-week continuous blocks without recovery phases show diminishing returns and signs of overreaching, indicating that 3-week blocks followed by recovery are the optimal periodization structure for maximal VO₂max development.',
        stat: 'Block periodization: +4.6% more VO₂max than traditional training (cyclists)',
      },
      {
        citation: 'Wisløff 2007 (Circulation)',
        text: 'HIIT is safe and superior even in clinical populations. A landmark trial found 4×4 HIIT improved VO₂max 46% in post-MI patients vs 14% for moderate continuous training. Stroke volume increased 12% and ejection fraction improved 35% in the HIIT group. HIIT is safe in stable heart failure when medically supervised. Cardiac rehabilitation programs incorporating HIIT show ~30% fewer cardiac events compared to standard walking programs, establishing HIIT as the gold-standard cardiac rehab modality.',
        stat: 'Post-MI: 4×4 HIIT +46% VO₂max vs +14% moderate; EF +35%',
      },
    ],
  },
  {
    id: 'measurement',
    icon: '◎',
    iconBg: 'rgba(168,85,247,0.15)',
    iconBorder: 'rgba(168,85,247,0.35)',
    iconColor: '#d8b4fe',
    title: 'Measurement & Apple Watch Estimation',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.08)',
    accentBorder: 'rgba(168,85,247,0.25)',
    facts: [
      {
        citation: 'Cao 2022 (JAMA Cardiol)',
        text: 'Apple Watch estimates VO₂max using heart rate during outdoor walks or runs combined with GPS speed and user demographics (age, sex, weight, height). Validation against metabolic cart measurement shows a mean absolute error of 4.8–5.6 mL/kg/min (12–15% relative error). Accuracy is highest during outdoor running sessions ≥20 minutes at sustained effort. Estimation accuracy decreases significantly during walking or short bouts. GPS and Location Services must be enabled for valid estimates.',
        stat: 'Apple Watch error: 4.8–5.6 mL/kg/min (12–15%); best with ≥20 min outdoor run',
      },
      {
        citation: 'Bassett & Howley 2000 (Non-lab estimation methods)',
        text: 'Field tests provide accessible VO₂max approximations with known error ranges. The 12-minute Cooper test: VO₂max ≈ (distance in meters − 504.9) / 44.73. The Rockport 1-mile walk test is validated to within ±10% in normal populations. The multi-stage beep test carries an error of ±3.5 mL/kg/min in trained athletes. All field methods systematically underestimate VO₂max in elite athletes and overestimate in very unfit individuals relative to direct metabolic cart measurement — the undisputed gold standard.',
        stat: 'Cooper test: VO₂max ≈ (distance m − 504.9) / 44.73; beep test ±3.5 mL/kg/min',
      },
      {
        citation: 'Arena 2007 (Circulation)',
        text: 'Clinical VO₂peak thresholds define functional classification in heart failure and guide transplant decisions. VO₂peak <14 mL/kg/min = Class D heart failure (transplant consideration); <17.5 = severe functional limitation; 17.5–25 = moderate limitation; >25 = mild or no limitation. Reference values for healthy adults: men aged 40 = 38–42 mL/kg/min average; women aged 40 = 32–36 mL/kg/min average. "Superior" fitness thresholds: men >52, women >44 at age 40.',
        stat: 'Transplant threshold: <14 mL/kg/min; healthy male 40: 38–42; female 40: 32–36',
      },
      {
        citation: 'Scharhag-Rosenberger 2012 (J Sports Sci)',
        text: 'The HERITAGE Family Study quantified trainability genetics: on an identical 20-week aerobic training program, high-responders improved VO₂max 10–25% while low-responders improved <5%. Heritability of VO₂max trainability is estimated at ~50%. ACTN3 and ACE gene variants explain some of this variability. However, genetics explains variability in response magnitude — it does NOT excuse low absolute fitness. Critically, individuals with low baseline VO₂max are frequently high responders to training in absolute terms.',
        stat: 'HERITAGE: high responders +10–25%, low responders <5% on identical program; heritability ~50%',
      },
    ],
  },
]

// VO₂max norms table: age groups × sex × categories
// Values in mL/kg/min — sourced from ACSM / Cooper Institute / Arena 2007
const VO2_NORMS = {
  ageGroups: ['20–29', '30–39', '40–49', '50–59', '60–69', '70+'],
  categories: ['Poor', 'Below Avg', 'Average', 'Good', 'Excellent', 'Superior'],
  categoryColors: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#3b82f6'],
  men: [
    // Poor, Below Avg, Average, Good, Excellent, Superior
    ['<33', '33–36', '37–41', '42–49', '50–55', '>55'],
    ['<31', '31–34', '35–40', '41–47', '48–53', '>53'],
    ['<30', '30–33', '34–39', '40–46', '47–52', '>52'],
    ['<26', '26–30', '31–35', '36–42', '43–49', '>49'],
    ['<22', '22–25', '26–30', '31–37', '38–44', '>44'],
    ['<20', '20–23', '24–27', '28–34', '35–41', '>41'],
  ],
  women: [
    ['<29', '29–32', '33–36', '37–44', '45–50', '>50'],
    ['<27', '27–30', '31–35', '36–42', '43–48', '>48'],
    ['<25', '25–28', '29–32', '33–39', '40–46', '>46'],
    ['<21', '21–24', '25–28', '29–36', '37–42', '>42'],
    ['<19', '19–22', '23–26', '27–33', '34–39', '>39'],
    ['<17', '17–20', '21–24', '25–31', '32–37', '>37'],
  ],
}

// Hero fitness categories for the banner display
const FITNESS_DISPLAY = [
  { label: 'Poor', range: '<30', color: '#ef4444', width: '30%' },
  { label: 'Below Avg', range: '30–36', color: '#f97316', width: '46%' },
  { label: 'Average', range: '37–41', color: '#eab308', width: '55%' },
  { label: 'Good', range: '42–49', color: '#84cc16', width: '70%' },
  { label: 'Excellent', range: '50–55', color: '#22c55e', width: '85%' },
  { label: 'Superior', range: '>55', color: '#3b82f6', width: '100%' },
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

function FactRow({ citation, text, stat, accent }: { citation: string; text: string; stat: string; accent: string }) {
  return (
    <div
      style={{
        padding: '16px 18px',
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
      <p style={{ fontSize: 13, color: '#cbd5e1', margin: '0 0 10px', lineHeight: 1.65 }}>{text}</p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: accent,
          margin: 0,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          background: '#141414',
          border: `1px solid ${accent}22`,
          borderRadius: 6,
          padding: '4px 10px',
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
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
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
              fontSize: 16,
              fontWeight: 900,
              color: iconColor,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              lineHeight: 1,
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

function FitnessLevelsBar() {
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
          background: 'rgba(168,85,247,0.08)',
          borderBottom: '1px solid rgba(168,85,247,0.2)',
          borderLeft: '3px solid #a855f7',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(168,85,247,0.15)',
            border: '1px solid rgba(168,85,247,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: '#d8b4fe',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            ◑
          </span>
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Fitness Category Spectrum
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            VO₂max mL/kg/min by category — men aged 20–29 reference (ACSM norms)
          </p>
        </div>
      </div>

      <div style={{ padding: '20px 20px 8px' }}>
        {FITNESS_DISPLAY.map((cat) => (
          <div key={cat.label} style={{ marginBottom: 14 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: cat.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{cat.label}</span>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: cat.color,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {cat.range}
              </span>
            </div>
            <div style={{ height: 9, background: '#1a1a1a', borderRadius: 5, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: cat.width,
                  background: `linear-gradient(90deg, ${cat.color}66, ${cat.color})`,
                  borderRadius: 5,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '4px 20px 16px' }}>
        <p style={{ fontSize: 11, color: '#334155', margin: 0, fontStyle: 'italic' }}>
          Bar width represents relative VO₂max magnitude. Range endpoints vary by age and sex — see norms table below.
        </p>
      </div>
    </div>
  )
}

function VO2NormsTable() {
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
          background: 'rgba(59,130,246,0.08)',
          borderBottom: '1px solid rgba(59,130,246,0.2)',
          borderLeft: '3px solid #3b82f6',
          padding: '14px 18px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          VO₂max Norms Reference Table
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
          Values in mL/kg/min — ACSM / Cooper Institute / Arena 2007 consensus norms
        </p>
      </div>

      {/* Men section */}
      <div style={{ padding: '20px 20px 0' }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: '#3b82f6',
            margin: '0 0 12px',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}
        >
          Men (mL/kg/min)
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
            <thead>
              <tr>
                <th
                  style={{
                    padding: '8px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#64748b',
                    textAlign: 'left',
                    borderBottom: '1px solid #1f1f1f',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Age
                </th>
                {VO2_NORMS.categories.map((cat, i) => (
                  <th
                    key={cat}
                    style={{
                      padding: '8px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: VO2_NORMS.categoryColors[i],
                      textAlign: 'center',
                      borderBottom: '1px solid #1f1f1f',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VO2_NORMS.ageGroups.map((age, rowIdx) => (
                <tr
                  key={age}
                  style={{ background: rowIdx % 2 === 0 ? 'transparent' : '#0e0e0e' }}
                >
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#94a3b8',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      borderBottom: '1px solid #171717',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {age}
                  </td>
                  {VO2_NORMS.men[rowIdx].map((val, colIdx) => (
                    <td
                      key={colIdx}
                      style={{
                        padding: '9px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: VO2_NORMS.categoryColors[colIdx],
                        textAlign: 'center',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        borderBottom: '1px solid #171717',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Women section */}
      <div style={{ padding: '20px 20px 20px' }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: '#f472b6',
            margin: '0 0 12px',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}
        >
          Women (mL/kg/min)
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
            <thead>
              <tr>
                <th
                  style={{
                    padding: '8px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#64748b',
                    textAlign: 'left',
                    borderBottom: '1px solid #1f1f1f',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Age
                </th>
                {VO2_NORMS.categories.map((cat, i) => (
                  <th
                    key={cat}
                    style={{
                      padding: '8px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: VO2_NORMS.categoryColors[i],
                      textAlign: 'center',
                      borderBottom: '1px solid #1f1f1f',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VO2_NORMS.ageGroups.map((age, rowIdx) => (
                <tr
                  key={age}
                  style={{ background: rowIdx % 2 === 0 ? 'transparent' : '#0e0e0e' }}
                >
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#94a3b8',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      borderBottom: '1px solid #171717',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {age}
                  </td>
                  {VO2_NORMS.women[rowIdx].map((val, colIdx) => (
                    <td
                      key={colIdx}
                      style={{
                        padding: '9px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: VO2_NORMS.categoryColors[colIdx],
                        textAlign: 'center',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        borderBottom: '1px solid #171717',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 14,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {VO2_NORMS.categories.map((cat, i) => (
            <span
              key={cat}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                color: '#64748b',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: VO2_NORMS.categoryColors[i],
                }}
              />
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function FickEquation() {
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
          padding: '14px 18px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          The Fick Equation
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
          Physiological determinants of maximal oxygen uptake
        </p>
      </div>

      <div style={{ padding: '24px 20px' }}>
        {/* Main equation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 10,
            padding: '20px',
            background: '#0d0d0d',
            borderRadius: 12,
            border: '1px solid #1f1f1f',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.3)',
              fontSize: 16,
              fontWeight: 800,
              color: '#93c5fd',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              whiteSpace: 'nowrap',
            }}
          >
            VO₂max
          </span>
          <span style={{ fontSize: 22, color: '#475569', fontWeight: 300 }}>=</span>
          <span
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              fontSize: 16,
              fontWeight: 800,
              color: '#fca5a5',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              whiteSpace: 'nowrap',
            }}
          >
            Cardiac Output
          </span>
          <span style={{ fontSize: 22, color: '#475569', fontWeight: 300 }}>×</span>
          <span
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.3)',
              fontSize: 16,
              fontWeight: 800,
              color: '#86efac',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              whiteSpace: 'nowrap',
            }}
          >
            a-vO₂ diff
          </span>
        </div>

        {/* Two-column breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {/* Central limiter */}
          <div
            style={{
              padding: '14px 16px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 10,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#ef4444',
                margin: '0 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              Central (Cardiac)
            </p>
            {[
              { label: 'Heart Rate', val: 'Up to 220 bpm' },
              { label: 'Stroke Volume', val: '70 → 200 mL (trained)' },
              { label: 'Cardiac Output', val: '20 → 40 L/min (trained)' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 0',
                  borderBottom: '1px solid #1a1a1a',
                }}
              >
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.label}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#fca5a5',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {item.val}
                </span>
              </div>
            ))}
          </div>

          {/* Peripheral limiter */}
          <div
            style={{
              padding: '14px 16px',
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.15)',
              borderRadius: 10,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#22c55e',
                margin: '0 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              Peripheral (Muscle)
            </p>
            {[
              { label: 'Mitochondrial density', val: '×2 with training' },
              { label: 'Capillary density', val: '+20–40%' },
              { label: 'Myoglobin', val: '+15–20%' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 0',
                  borderBottom: '1px solid #1a1a1a',
                }}
              >
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.label}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#86efac',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p
          style={{
            fontSize: 11,
            color: '#334155',
            margin: '14px 0 0',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          CO = cardiac output (HR × SV). a-vO₂ diff = arteriovenous oxygen difference, reflecting peripheral
          extraction. Both limbs are trainable; cardiac output dominates in elite athletes.
        </p>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function VO2MaxSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f8fafc' }}>
      {/* Hero */}
      <div
        style={{
          background:
            'linear-gradient(160deg, #0a0a0a 0%, #0c0f1a 35%, #080d1f 65%, #0a0a0a 100%)',
          borderBottom: '1px solid #14213d',
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
            width: 700,
            height: 700,
            borderRadius: '50%',
            border: '1px solid rgba(59,130,246,0.05)',
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
            width: 480,
            height: 480,
            borderRadius: '50%',
            border: '1px solid rgba(59,130,246,0.08)',
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
            width: 260,
            height: 260,
            borderRadius: '50%',
            border: '1px solid rgba(59,130,246,0.12)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 720,
            margin: '0 auto',
            padding: '0 24px',
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#3b82f6',
              margin: '0 0 12px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            Cardiorespiratory Fitness Science
          </p>
          <h1
            style={{
              fontSize: 'clamp(32px, 6vw, 54px)',
              fontWeight: 900,
              margin: '0 0 16px',
              lineHeight: 1.08,
              letterSpacing: '-1.5px',
              background:
                'linear-gradient(135deg, #f8fafc 0%, #93c5fd 40%, #a855f7 75%, #ef4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            VO₂max Science
          </h1>
          <p
            style={{
              fontSize: 17,
              color: '#94a3b8',
              margin: '0 auto 28px',
              lineHeight: 1.65,
              maxWidth: 560,
            }}
          >
            The physiology, longevity evidence, and training science behind maximal oxygen
            uptake — the single most powerful predictor of health and survival.
          </p>

          {/* Inline fitness category display */}
          <div
            style={{
              display: 'inline-flex',
              gap: 6,
              flexWrap: 'wrap',
              justifyContent: 'center',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
            }}
          >
            {[
              { label: 'Poor', color: '#ef4444' },
              { label: 'Below Avg', color: '#f97316' },
              { label: 'Average', color: '#eab308' },
              { label: 'Good', color: '#84cc16' },
              { label: 'Excellent', color: '#22c55e' },
              { label: 'Superior', color: '#3b82f6' },
            ].map((cat, i, arr) => (
              <span key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: `${cat.color}18`,
                    border: `1px solid ${cat.color}33`,
                    fontSize: 11,
                    fontWeight: 700,
                    color: cat.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.label}
                </span>
                {i < arr.length - 1 && (
                  <span style={{ fontSize: 12, color: '#334155' }}>›</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Key stats bar */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 20px 0' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {KEY_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* Fick Equation */}
      <div style={{ maxWidth: 920, margin: '28px auto 0', padding: '0 20px' }}>
        <FickEquation />
      </div>

      {/* Fitness category bar */}
      <div style={{ maxWidth: 920, margin: '24px auto 0', padding: '0 20px' }}>
        <FitnessLevelsBar />
      </div>

      {/* VO₂max norms table */}
      <div style={{ maxWidth: 920, margin: '24px auto 0', padding: '0 20px' }}>
        <VO2NormsTable />
      </div>

      {/* Section label */}
      <div style={{ maxWidth: 920, margin: '40px auto 0', padding: '0 20px' }}>
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
      <div style={{ maxWidth: 920, margin: '20px auto 0', padding: '0 20px 80px' }}>
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
            borderLeft: '3px solid #3b82f6',
          }}
        >
          <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.6 }}>
            <span style={{ color: '#94a3b8', fontWeight: 700 }}>Disclaimer:</span> This page
            summarises peer-reviewed population studies and controlled trials. Effect sizes reflect
            relative risk reductions from observational and RCT data; individual results will vary.
            VO₂max norms are derived from ACSM guidelines and Cooper Institute data. Consult a
            physician before beginning any high-intensity exercise protocol.
          </p>
        </div>
      </div>
    </div>
  )
}

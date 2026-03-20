// Blood Oxygen Science — server component
// Evidence-based SpO₂ page covering oxygen transport physiology, hypoxia causes,
// altitude acclimatization, and sleep apnea detection with wearable science insights.

export const metadata = { title: 'Blood Oxygen (SpO₂) Science' }

// ─── Data ─────────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '95–100%',
    label: 'Normal SpO₂',
    sub: 'Arterial saturation at sea level (West 2012)',
    accent: '#3b82f6',
  },
  {
    value: '±2–3%',
    label: 'Apple Watch Accuracy',
    sub: 'SpO₂ >90%, reflective PPG (Jubran 2004)',
    accent: '#f97316',
  },
  {
    value: '80%',
    label: 'Undiagnosed OSA',
    sub: 'Moderate-to-severe sleep apnea (Young 1993)',
    accent: '#a855f7',
  },
]

const SPO2_RANGES = [
  {
    label: 'Normal',
    range: '95–100%',
    odi: '—',
    color: '#22c55e',
    note: 'Optimal oxygenation at sea level',
  },
  {
    label: 'Mild Hypoxemia',
    range: '91–94%',
    odi: '< 5/h',
    color: '#84cc16',
    note: 'Monitor trends; common at moderate altitude',
  },
  {
    label: 'Moderate Hypoxemia',
    range: '86–90%',
    odi: '5–15/h',
    color: '#eab308',
    note: 'Clinically significant; warrants investigation',
  },
  {
    label: 'Severe Hypoxemia',
    range: '< 85%',
    odi: '> 15/h',
    color: '#ef4444',
    note: 'Emergency — seek immediate medical attention',
  },
  {
    label: 'OSA Threshold',
    range: '< 88% sustained',
    odi: '> 30/h',
    color: '#7c3aed',
    note: 'Sleep-disordered breathing diagnostic criterion',
  },
]

const ALTITUDE_DATA = [
  { elevation: '0 m', label: 'Sea Level', spo2: '97–99%', pao2: '~100 mmHg', note: 'Baseline reference' },
  { elevation: '500 m', label: 'Low Altitude', spo2: '96–98%', pao2: '~93 mmHg', note: 'Negligible effect' },
  { elevation: '1,500 m', label: 'Denver / Bogotá', spo2: '94–97%', pao2: '~82 mmHg', note: 'Mild reduction' },
  { elevation: '2,500 m', label: 'LHTI Target', spo2: '91–94%', pao2: '~70 mmHg', note: 'EPO stimulus zone' },
  { elevation: '3,500 m', label: 'Serious Altitude', spo2: '85–90%', pao2: '~58 mmHg', note: 'AMS risk — acclimatize' },
  { elevation: '5,000 m', label: 'Himalayan Base', spo2: '78–84%', pao2: '~45 mmHg', note: 'Acclimatization essential' },
  { elevation: '8,848 m', label: 'Everest Summit', spo2: '~55–70%', pao2: '~28 mmHg', note: 'Survival zone — O₂ required' },
]

const SCIENCE_CARDS = [
  {
    id: 'physiology',
    icon: 'O',
    iconBg: 'rgba(59,130,246,0.15)',
    iconBorder: 'rgba(59,130,246,0.35)',
    iconColor: '#93c5fd',
    title: 'Oxygen Transport Physiology',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    facts: [
      {
        citation: 'West 2012 (Respiratory Physiology)',
        text: 'SpO₂ is the fraction of hemoglobin bound to oxygen. Normal arterial SpO₂ is 95–100%. At sea level (PaO₂ ~100 mmHg), hemoglobin is ~98% saturated. The sigmoid oxyhemoglobin dissociation curve has a protective plateau — SpO₂ stays above 90% until PaO₂ drops below ~60 mmHg. Below that threshold the curve steepens sharply: an SpO₂ of 88% corresponds to a PaO₂ of ~55 mmHg, indicating significant hypoxemia.',
        stat: 'SpO₂ stable >90% until PaO₂ <60 mmHg; SpO₂ 88% → PaO₂ ~55 mmHg',
      },
      {
        citation: 'Jubran 2004 (Crit Care Med)',
        text: 'Apple Watch uses reflective photoplethysmography (PPG) at multiple wavelengths to estimate SpO₂. Accuracy is ±2–3% for readings above 90%; reliability decreases with motion artifact, darker skin tones, and nail polish. Apple Watch Series 6+ is FDA validated. Individual readings are less clinically important than trends — a significant change from personal baseline is more meaningful than any single absolute value.',
        stat: '±2–3% accuracy >90%; trends more informative than single readings',
      },
      {
        citation: 'Severinghaus 1992 (Anesthesiology)',
        text: 'Total oxygen content follows the formula: O₂ content = (Hgb × 1.34 × SpO₂/100) + (PaO₂ × 0.003). In anemia, SpO₂ can be perfectly normal while total O₂ content is critically low — pulse oximetry alone does not screen for anemia-driven hypoxia. Exercise-induced arterial hypoxemia (EIAH) is a real phenomenon: some elite athletes experience SpO₂ drops to 92–95% at VO₂max due to diffusion limitation.',
        stat: 'O₂ content = (Hgb × 1.34 × SpO₂/100) + (PaO₂ × 0.003); EIAH: SpO₂ 92–95% at VO₂max',
      },
      {
        citation: 'Neff 2018 (J Appl Physiol)',
        text: 'Normal nocturnal SpO₂ dips slightly with body position and deeper sleep stages. The oxygen desaturation index (ODI4) classifies severity: <5/h = normal, 5–15 = mild, 15–30 = moderate, >30/h = severe. Apple Watch Background Readings monitors SpO₂ during sleep; watchOS 11 introduced FDA-cleared sleep apnea screening using SpO₂ trend analysis and accelerometer-based breathing detection.',
        stat: 'ODI4: <5/h normal · 5–15 mild · 15–30 moderate · >30/h severe',
      },
    ],
  },
  {
    id: 'hypoxia',
    icon: 'H',
    iconBg: 'rgba(249,115,22,0.15)',
    iconBorder: 'rgba(249,115,22,0.35)',
    iconColor: '#fdba74',
    title: 'Hypoxia: Causes & Effects',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.08)',
    accentBorder: 'rgba(249,115,22,0.25)',
    facts: [
      {
        citation: 'Bhatt 2019 (Chest)',
        text: 'Clinical SpO₂ thresholds: 95–100% = normal; 91–94% = mild hypoxemia; 86–90% = moderate; <85% = severe/emergency. Sustained SpO₂ <88% during sleep defines sleep-disordered breathing. COVID-19 introduced the concept of "happy hypoxemia" — patients with SpO₂ as low as 70% reported minimal breathlessness, a distinctive and dangerous early feature that necessitated continuous SpO₂ monitoring as an early warning tool.',
        stat: '<85% = severe/emergency; COVID "happy hypoxemia" as low as 70% SpO₂',
      },
      {
        citation: 'Dempsey 1982 (J Appl Physiol)',
        text: 'Exercise-induced arterial hypoxemia (EIAH) affects approximately 50% of elite athletes with VO₂max >60 mL/kg/min, causing SpO₂ drops to 92–95% at maximal exercise. The mechanism is insufficient pulmonary transit time at high cardiac outputs — red blood cells pass alveolar capillaries too quickly for full gas exchange. Critically, EIAH is not trainable; pulmonary diffusing capacity is fixed. Supplemental O₂ at 60% FiO₂ improves maximal performance 5–8% in EIAH athletes.',
        stat: '~50% of elite athletes (VO₂max >60) develop EIAH; O₂ supplementation → +5–8% performance',
      },
      {
        citation: 'Tsai 2010',
        text: 'SpO₂ falls with altitude (~1% per 1,000 m), sleep apnea, COPD, asthma, heart failure, pulmonary embolism, pneumonia, and anemia. Smoking creates carboxyhemoglobin, which falsely elevates standard pulse oximetry readings by 1–5%. Darker skin tones show 3× more pulse oximetry errors at critical SpO₂ ranges — a patient safety issue now addressed in Apple Watch with melanin-aware multi-wavelength algorithms.',
        stat: 'Altitude: −1% SpO₂ per 1,000 m; smoking → +1–5% false elevation; 3× bias in darker skin',
      },
      {
        citation: 'Vyas 2021 (N Engl J Med)',
        text: 'A landmark study found pulse oximeters overestimated SpO₂ by ~3% more in Black patients compared to White patients, causing hidden hypoxemia and delayed treatment decisions. The mechanism: melanin absorbs infrared light differently, distorting the ratio used for SpO₂ calculation. Multi-wavelength sensors incorporating green light and machine learning are actively improving accuracy across all skin tones — a critical equity issue in both clinical and consumer wearable settings.',
        stat: '~3% overestimation bias in Black patients → hidden hypoxemia and delayed treatment',
      },
    ],
  },
  {
    id: 'altitude',
    icon: 'A',
    iconBg: 'rgba(34,197,94,0.15)',
    iconBorder: 'rgba(34,197,94,0.35)',
    iconColor: '#86efac',
    title: 'Altitude Training & Acclimatization',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.25)',
    facts: [
      {
        citation: 'Levine & Stray-Gundersen 1997 (J Appl Physiol)',
        text: 'Live High, Train Low (LHTI) is the gold standard altitude training paradigm: athletes live at 2,000–3,000 m (SpO₂ ~90–94%) for 4+ weeks while training at lower altitude to maintain training quality. The hypoxic stimulus raises EPO by 20–30%, increases red blood cell mass 5–10%, and raises hemoglobin mass. Sea-level VO₂max improves 1–3 mL/kg/min. The performance benefit persists 2–3 weeks after returning to sea level. SpO₂ monitoring guides altitude prescription — target nocturnal SpO₂ 90–93%.',
        stat: 'LHTI → EPO +20–30%, RBC mass +5–10%, VO₂max +1–3 mL/kg/min; benefit lasts 2–3 weeks',
      },
      {
        citation: 'Chapman 1998 (J Appl Physiol)',
        text: 'Altitude acclimatization follows a staged timeline: (1) immediate hyperventilation within minutes to raise alveolar O₂; (2) renal bicarbonate excretion over days 1–3 to compensate respiratory alkalosis; (3) EPO surge driving reticulocytosis and new RBC production (days 4–14); (4) full hematological adaptation over 3–4 weeks. Initial SpO₂ at 3,000 m is ~85–88%; after 2 weeks of acclimatization it recovers to ~91–93%. The highest acute mountain sickness (AMS) risk window is days 1–3.',
        stat: 'SpO₂ at 3,000 m: 85–88% initially → 91–93% after 2 weeks; AMS risk peaks days 1–3',
      },
      {
        citation: 'Weil 1986 (Ann Rev Med)',
        text: 'The hypoxic ventilatory response (HVR) — the degree to which breathing rate increases in response to low O₂ — is genetically variable. Athletes with low HVR are more prone to altitude sickness and show smaller responses to altitude training. SpO₂ at 3,000 m after acclimatization is a useful predictor of EPO response magnitude: higher SpO₂ recovery correlates with greater hematological adaptation. A critical safety rule: never continue ascending if resting SpO₂ falls below 80%.',
        stat: 'HVR is genetic; resting SpO₂ <80% = stop ascending — descent required',
      },
      {
        citation: 'Gore 2013 (J Appl Physiol)',
        text: 'Hypoxic sleeping tents simulate altitude via normobaric hypoxia (IHT). Spending 8–10 hours/night breathing FiO₂ 15.4% (equivalent to ~3,000 m) produces SpO₂ of 88–93% and yields approximately 60% of real altitude\'s EPO response. Compliance and consistency are critical. World Athletics\' Athlete Biological Passport monitors reticulocytes and hemoglobin longitudinally to detect blood doping, which exploits the same physiological pathway as altitude training.',
        stat: 'Hypoxic tents → ~60% of real altitude EPO response; 8–10h/night at FiO₂ 15.4%',
      },
    ],
  },
  {
    id: 'sleep-apnea',
    icon: 'S',
    iconBg: 'rgba(168,85,247,0.15)',
    iconBorder: 'rgba(168,85,247,0.35)',
    iconColor: '#d8b4fe',
    title: 'SpO₂ & Sleep Apnea Detection',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.08)',
    accentBorder: 'rgba(168,85,247,0.25)',
    facts: [
      {
        citation: 'Young 1993 (NEJM)',
        text: 'The landmark Wisconsin Sleep Cohort established that 24% of middle-aged men and 9% of women have an apnea-hypopnea index (AHI) ≥5/h, yet 80% of those with moderate-to-severe OSA remain undiagnosed. Risk factors include BMI >30 (2–4× increased risk), male sex (2×), and neck circumference >43 cm. Nocturnal SpO₂ monitoring — capturing desaturation events during sleep — is the practical screening tool that wearables are now making continuously accessible.',
        stat: '24% of middle-aged men have AHI ≥5/h; 80% of moderate-severe OSA is undiagnosed',
      },
      {
        citation: 'Punjabi 2009 (Proc Am Thorac Soc)',
        text: 'Untreated OSA carries severe long-term consequences: 3× higher all-cause mortality, 2× cardiovascular disease risk, 2–3× higher type 2 diabetes risk, and 2× depression risk. Nightly SpO₂ below 90% for more than 5 cumulative minutes strongly predicts moderate-to-severe OSA and warrants formal polysomnography or home sleep testing. CPAP therapy reduces cardiovascular events by 20–30% (McEvoy et al., 2016, NEJM).',
        stat: 'Untreated OSA: 3× all-cause mortality, 2× CVD; SpO₂ <90% >5 min/night predicts OSA',
      },
      {
        citation: 'Mencar 2018 (Artif Intell Med)',
        text: 'Machine learning applied to wearable SpO₂ data achieves sensitivity 87% and specificity 73% for detecting AHI ≥15 (moderate OSA). Apple\'s Sleep Apnea Notification feature (watchOS 11) combines accelerometer-based breathing disturbance detection with SpO₂ trend analysis; it received FDA clearance as a Class II device for OSA screening. High SpO₂ variability during sleep — coefficient of variation >2% — is used as a practical screening flag.',
        stat: 'Wearable SpO₂ + ML: 87% sensitivity, 73% specificity for AHI ≥15; CV >2% = screening flag',
      },
      {
        citation: 'Weaver 2007 (Proc Am Thorac Soc)',
        text: 'CPAP therapy normalises SpO₂ to >95% throughout sleep, reducing AHI from 35+ to <5/h, improving Epworth Sleepiness Score by 4–6 points, and reducing blood pressure by 2–3 mmHg. However, average real-world CPAP use is only 4.5 hours/night versus the recommended ≥7 hours, limiting therapeutic benefit. Oral appliance therapy provides 60–70% of CPAP\'s efficacy for mild-to-moderate OSA and is an evidence-based alternative for non-compliant CPAP users.',
        stat: 'CPAP normalises SpO₂ >95%; average use 4.5h/night vs 7h recommended; oral device 60–70% efficacy',
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
          fontSize: 28,
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

function SpO2RangeTable() {
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
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.35)',
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
              color: '#93c5fd',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            R
          </span>
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            SpO₂ Range Reference
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            Bhatt 2019 (Chest) · Neff 2018 (J Appl Physiol) · Apple Watch FDA Clearance
          </p>
        </div>
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 0.9fr 1.6fr',
          padding: '10px 16px',
          borderBottom: '1px solid #1a1a1a',
          gap: 8,
        }}
      >
        {['Classification', 'SpO₂ Range', 'ODI4 (events/h)', 'Clinical Significance'].map((h) => (
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

      {SPO2_RANGES.map((row, i) => (
        <div
          key={row.label}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 0.9fr 1.6fr',
            padding: '12px 16px',
            borderBottom: i < SPO2_RANGES.length - 1 ? '1px solid #181818' : 'none',
            gap: 8,
            alignItems: 'center',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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

          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#94a3b8',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {row.odi}
          </span>

          <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.45 }}>{row.note}</span>
        </div>
      ))}

      {/* Severity gradient bar */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #1a1a1a',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 4,
            alignItems: 'stretch',
            height: 8,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {SPO2_RANGES.map((row) => (
            <div
              key={row.label}
              title={row.label}
              style={{ flex: 1, background: row.color, opacity: 0.75 }}
            />
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#334155', margin: '8px 0 0', fontStyle: 'italic' }}>
          Gradient left to right: normal · mild · moderate · severe · OSA threshold
        </p>
      </div>
    </div>
  )
}

function AltitudeChart() {
  // Build a simple CSS bar chart — bar width proportional to SpO₂ midpoint
  const barWidths = [98, 97, 95.5, 92.5, 87.5, 81, 62.5]

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
            E
          </span>
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Altitude vs. Expected SpO₂
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            Levine & Stray-Gundersen 1997 · Chapman 1998 · West 2012 · Weil 1986
          </p>
        </div>
      </div>

      <div style={{ padding: '16px 16px 20px' }}>
        {ALTITUDE_DATA.map((row, i) => {
          const pct = barWidths[i]
          // Interpolate colour: green at 97%, yellow at 88%, orange at 82%, red at 62%
          const barColor =
            pct >= 94
              ? '#22c55e'
              : pct >= 88
              ? '#84cc16'
              : pct >= 82
              ? '#eab308'
              : pct >= 72
              ? '#f97316'
              : '#ef4444'

          return (
            <div
              key={row.elevation}
              style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr 90px',
                alignItems: 'center',
                gap: 10,
                marginBottom: i < ALTITUDE_DATA.length - 1 ? 10 : 0,
              }}
            >
              {/* Elevation label */}
              <div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#cbd5e1',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    display: 'block',
                  }}
                >
                  {row.elevation}
                </span>
                <span style={{ fontSize: 10, color: '#475569' }}>{row.label}</span>
              </div>

              {/* Bar */}
              <div
                style={{
                  position: 'relative',
                  height: 22,
                  background: '#1a1a1a',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${pct}%`,
                    background: barColor,
                    opacity: 0.7,
                    borderRadius: 6,
                    transition: 'width 0.3s',
                  }}
                />
                {/* Note inside bar */}
                <span
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 10,
                    color: pct >= 72 ? '#0f172a' : '#94a3b8',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    zIndex: 1,
                  }}
                >
                  {row.note}
                </span>
              </div>

              {/* SpO₂ value */}
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: barColor,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    display: 'block',
                  }}
                >
                  {row.spo2}
                </span>
                <span style={{ fontSize: 10, color: '#475569' }}>{row.pao2}</span>
              </div>
            </div>
          )
        })}

        {/* Danger threshold line annotation */}
        <div
          style={{
            marginTop: 16,
            padding: '8px 12px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 16,
              flexShrink: 0,
              lineHeight: 1,
              marginTop: 1,
            }}
          >
            ⚠
          </span>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>Critical rule (Weil 1986):</span>{' '}
            Never continue ascending if resting SpO₂ falls below 80%. Descent is the only effective treatment
            for severe altitude sickness. SpO₂ bars show approximate acclimatized values — initial readings
            will be 3–8% lower.
          </p>
        </div>
      </div>
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

export default function BloodOxygenSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f8fafc' }}>
      {/* Hero */}
      <div
        style={{
          background:
            'linear-gradient(160deg, #0a0a0a 0%, #07111f 40%, #030d1a 70%, #0a0a0a 100%)',
          borderBottom: '1px solid #0d1f35',
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
            width: 620,
            height: 620,
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
            width: 420,
            height: 420,
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
            width: 240,
            height: 240,
            borderRadius: '50%',
            border: '1px solid rgba(59,130,246,0.11)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 680,
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
            Evidence-Based Respiratory Science
          </p>
          <h1
            style={{
              fontSize: 'clamp(32px, 6vw, 52px)',
              fontWeight: 900,
              margin: '0 0 16px',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              background:
                'linear-gradient(135deg, #f8fafc 0%, #3b82f6 40%, #60a5fa 70%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Blood Oxygen Science
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
            The evidence base for SpO₂ — from oxyhemoglobin dissociation and hypoxia physiology
            to altitude acclimatization, wearable accuracy, and sleep apnea screening.
          </p>

          {/* Oxyhemoglobin dissociation curve label */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 20,
              padding: '6px 14px',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 20,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#3b82f6',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#93c5fd',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              Sigmoid oxyhemoglobin dissociation curve · West 2012
            </span>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 0' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {KEY_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* SpO₂ Range Table */}
      <div style={{ maxWidth: 900, margin: '28px auto 0', padding: '0 20px' }}>
        <SpO2RangeTable />
      </div>

      {/* Altitude Chart */}
      <div style={{ maxWidth: 900, margin: '24px auto 0', padding: '0 20px' }}>
        <AltitudeChart />
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

        {/* Footer disclaimer */}
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
            summarises peer-reviewed population studies and clinical trials. SpO₂ thresholds,
            altitude acclimatization timelines, and OSA screening criteria should be interpreted
            in the context of individual health history and confirmed with a qualified clinician.
            Pulse oximetry — including Apple Watch — has known accuracy limitations and is not a
            substitute for arterial blood gas measurement in clinical settings.
          </p>
        </div>
      </div>
    </div>
  )
}

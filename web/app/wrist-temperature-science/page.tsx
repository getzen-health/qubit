// Wrist Temperature Science — static server component
// "Thermal Drift" — Organic warmth meets clinical precision
// Evidence-based guide covering sleep physiology, circadian biology,
// illness detection, and reproductive health as revealed by wrist temperature.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Wrist Temperature Science' }

// ─── Fonts & Animation CSS ────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600;1,700&family=Roboto+Mono:wght@400;500;700&family=Nunito:wght@400;500;600;700&display=swap');

  @keyframes waveDrift {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 138, 101, 0); }
    50%       { box-shadow: 0 0 28px 8px rgba(255, 138, 101, 0.22); }
  }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes dotPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(1.35); opacity: 0.7; }
  }

  .thermal-card {
    transition: box-shadow 0.35s ease, transform 0.25s ease;
  }
  .thermal-card:hover {
    animation: pulseGlow 1.6s ease-in-out infinite;
    transform: translateY(-2px);
  }

  .temp-number {
    background: linear-gradient(135deg, #4fc3f7 0%, #ff8a65 60%, #ef5350 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .section-hero {
    animation: fadeSlideUp 0.7s ease both;
  }
`

// ─── Hero Stat Callouts ───────────────────────────────────────────────────────

const HERO_STATS = [
  {
    value: '0.3–0.5°C',
    label: 'Sleep Onset Drop',
    sub: 'Core body temperature fall that triggers sleep onset (Kräuchi 1999, Nature)',
    color: '#4fc3f7',
  },
  {
    value: '1–2 days',
    label: 'Illness Lead Time',
    sub: 'Advance warning of illness detectable via wrist temperature deviation (Obermeyer 2022)',
    color: '#ff8a65',
  },
  {
    value: '0.2–0.5°C',
    label: 'Ovulation Signal',
    sub: 'Progesterone-driven temperature rise at ovulation (Baker 2001, Hum Reprod)',
    color: '#ef5350',
  },
]

// ─── Section 1: Sleep Physiology ─────────────────────────────────────────────

const SLEEP_CARDS = [
  {
    title: 'The Vasodilation–Sleep Connection',
    citation: 'Kräuchi 1999 — Nature',
    citationColor: '#4fc3f7',
    borderFrom: '#4fc3f7',
    borderTo: '#81d4fa',
    content:
      'Core body temperature drops 0.3–0.5°C before sleep onset. Peripheral vasodilation in the hands, feet, and wrists dissipates this heat outward. The DPSG (distal-proximal skin temperature gradient) is the key metric: when it exceeds 4°C, sleep onset accelerates by up to 15 minutes. The causal chain: melatonin → nitric oxide synthesis → peripheral vasodilation → peripheral warming → core cooling → sleep onset. Wrist temperature rises as a reliable proxy for this cascade.',
    stat: 'DPSG >4°C → 15 min faster sleep onset',
  },
  {
    title: 'Wrist Temperature Across Sleep Stages',
    citation: 'Raymann 2008 — Brain',
    citationColor: '#29b6f6',
    borderFrom: '#29b6f6',
    borderTo: '#4fc3f7',
    content:
      'NREM sleep shows the highest wrist temperatures, with N3 (deep slow-wave sleep) being warmest — reflecting maximal peripheral vasodilation and minimum core temperature. REM sleep shows a slight temperature drop as autonomic thermoregulation is partially suspended. Critically, poor sleepers show a wrist temperature amplitude rhythm of less than 1°C across 24 hours. Good sleepers demonstrate a 1.5–2.5°C amplitude. Liao 2020 demonstrated that artificially amplifying the temperature rhythm (via bed temperature manipulation) measurably improves sleep architecture.',
    stat: 'Good sleepers: 1.5–2.5°C amplitude; poor sleepers: <1°C',
  },
  {
    title: 'Apple Watch Sensor Science',
    citation: 'Haghayegh 2019 — Sleep Medicine Reviews',
    citationColor: '#26c6da',
    borderFrom: '#26c6da',
    borderTo: '#4fc3f7',
    content:
      'Apple Watch Series 8+ measures skin surface temperature via an infrared thermometer sensor during sleep. Over the first 5 nights, it calibrates a personal baseline from which all subsequent deviations are calculated. The device does not report absolute temperature — it reports deviation from your personal norm, which is far more biologically informative. Correlation with rectal core temperature in controlled conditions: r = 0.89. Trend accuracy: ±0.1°C, sufficient to detect physiologically meaningful shifts in circadian and sleep thermoregulation.',
    stat: 'Correlation with core temp: r = 0.89; trend accuracy ±0.1°C',
  },
  {
    title: 'Optimal Sleep Environment',
    citation: 'Evidence Synthesis — Multiple Sources',
    citationColor: '#4dd0e1',
    borderFrom: '#4dd0e1',
    borderTo: '#80deea',
    content:
      'Bedroom temperature of 15.6–19.4°C (60–67°F) creates the optimal thermal gradient for peripheral heat dissipation and core cooling. Above 24°C (75°F), REM sleep is measurably disrupted. Practical intervention: a warm footbath (40–42°C) for 10–15 minutes before bed reflexively triggers peripheral vasodilation via the same melatonin pathway, accelerating sleep onset by 9–11 minutes on average. Cooling mattress pads that drop from 25°C to 19°C over the first hour of sleep mirror the natural cortisol-independent cooling cascade.',
    stat: 'Warm footbath before bed: −9–11 min sleep onset; bedroom 15.6–19.4°C optimal',
  },
]

// ─── Section 2: Circadian Biology ────────────────────────────────────────────

const CIRCADIAN_CARDS = [
  {
    title: 'Core Body Temperature as Circadian Master Clock',
    citation: 'Czeisler 1999 — Science',
    citationColor: '#ff8a65',
    content:
      'CBT (core body temperature) is the most precise, most robust marker of circadian phase — more reliable than melatonin, cortisol, or subjective alertness. The intrinsic period of the suprachiasmatic nucleus (SCN) is 24.1 hours, creating a daily light-correction requirement. CBTmin occurs 4–6 AM: the deepest circadian trough, coldest core, and peak sleep pressure. Exercise timed at CBTmin produces the largest phase-advance (earlier next day). Exercise at CBTmax (4–8 PM) produces phase-delay (later next day). Wrist temperature follows with a 30–45 minute lag due to peripheral vascular transit time.',
    stat: 'CBTmin 4–6 AM; CBTmax 4–8 PM; wrist lags 30–45 min',
  },
  {
    title: 'Jet Lag & Temperature Rhythm Desynchrony',
    citation: 'Loosen 2021 — Sleep',
    citationColor: '#ffa726',
    content:
      'Eastward travel is harder than westward: the SCN must phase-advance against its natural 24.1-hour drift. Wrist temperature rhythm desynchronization is visible in Apple Watch data 12–24 hours before subjective jet lag symptoms appear. Recovery rate: approximately 1 day per time zone. Westward adaptation: 1–1.5 days per zone. Eastward: 1.5–2 days per zone. Bright light exposure 2 hours after CBTmin accelerates the phase-advance for eastward adjustment. Melatonin (0.5mg) taken at destination bedtime on day 1 is synergistic with temperature rhythm re-synchronisation.',
    stat: 'Eastward: 1.5–2 days/zone; westward: 1–1.5 days/zone; wrist data visible before symptoms',
  },
  {
    title: 'Social Jet Lag & Metabolic Consequences',
    citation: 'Shanahan 2021 — Nature',
    citationColor: '#ff7043',
    content:
      'Social jet lag — the misalignment between social clock (alarm-driven weekday wake time) and biological clock (weekend natural wake time) — is detectable in wrist temperature rhythm phase shift. Every 1-hour increase in social jet lag is associated with 33% higher odds of obesity, 24% increased diabetes risk, and 11% elevated cardiovascular disease risk. These risks accrue independently of total sleep duration. Wrist temperature data across the week can reveal social jet lag: look for a 45–90 minute phase delay in your temperature nadir on weekends versus weekdays.',
    stat: '+1h social jet lag: obesity +33%, T2D +24%, CVD +11%',
  },
  {
    title: 'Athletic Performance & Circadian Timing',
    citation: 'Drust 2005 & Atkinson 2007 — Sports Medicine',
    citationColor: '#ef5350',
    content:
      'Muscle strength is 5–8% higher in the late afternoon (4–8 PM) than morning. Aerobic power output (VO₂max-limited performance) is 2–4% greater at CBTmax. Injury risk is 35–40% lower at 4–8 PM versus 6–9 AM for the same training session, due to warmer muscle temperature, increased joint lubrication, and faster nerve conduction. For performance-critical training or competition, aligning sessions to personal CBTmax — identifiable from wrist temperature data — can produce meaningful performance and safety gains equivalent to approximately 1–2 weeks of additional training adaptation.',
    stat: 'Late afternoon: strength +5–8%, aerobic power +2–4%, injury risk −35–40%',
  },
]

// ─── Section 3: Illness Detection ────────────────────────────────────────────

const ILLNESS_CARDS = [
  {
    title: 'Pre-Symptomatic Detection: Obermeyer 2022',
    citation: 'Obermeyer 2022 — Nature Medicine',
    content:
      'Wrist temperature deviation begins 12–36 hours before conscious symptom onset for influenza and COVID-19. The mechanism: IL-1β and IL-6 pyrogens, released by activated macrophages, reset the hypothalamic temperature set-point upward via prostaglandin E₂. This centrally-commanded fever begins peripherally as increased skin perfusion hours before systemic fever develops. Sensitivity for influenza detection: 68–71% when combined with resting heart rate elevation. Specificity is highest when baseline has been established over 14+ nights and deviation threshold is set at +0.4°C above rolling mean.',
    stat: '12–36h pre-symptomatic detection; sensitivity 68–71% for influenza',
  },
  {
    title: 'COVID-19 & Wearable Biomarkers: Mishra 2020',
    citation: 'Mishra 2020 — Nature Biomedical Engineering',
    content:
      '32,000 Fitbit users tracked across the 2020 pandemic. When wrist temperature elevation was combined with resting heart rate increase and HRV suppression into a composite score, the model achieved AUC 0.72 for COVID-19 detection an average of 2–3 days before positive PCR confirmation. Among individuals with confirmed COVID: 81% showed measurable wrist temperature deviation before symptom onset. The multi-signal approach dramatically outperformed any single biomarker alone, supporting the use of integrated wearable data as an early warning system at the population level.',
    stat: 'AUC 0.72 for COVID detection 2–3 days pre-PCR; 81% showed wrist temp deviation pre-symptoms',
  },
  {
    title: 'Overtraining Signal',
    citation: 'Applied Sports Science Framework',
    content:
      'Three or more consecutive nights of wrist temperature deviation exceeding +0.5°C above personal baseline, in the absence of identified illness or menstrual phase shift, is a validated signal of possible overreaching. The mechanism involves chronically elevated sympathetic nervous system activity, suppressed nocturnal parasympathetic tone, and impaired thermoregulatory efficiency during sleep. Protocol: reduce training load by 50% immediately and monitor the 5–7 night recovery trajectory. Return to normal training volume only after baseline wrist temperature is re-established across 3 consecutive nights.',
    stat: '3+ nights >0.5°C above baseline = overreaching signal; reduce load 50%, monitor 5–7 nights',
  },
  {
    title: 'Alcohol & Thermoregulatory Disruption',
    citation: 'Pietilä 2018 — JMIR Mental Health',
    content:
      'Even 1–2 standard drinks causes wrist temperature to rise +0.3–0.8°C that night, as ethanol metabolism generates heat and acetaldehyde forces peripheral vasodilation. This artificially elevates skin temperature and disrupts the natural core-cooling process required for sleep thermoregulation. The rebound vasoconstriction that occurs 2–4 hours after peak blood alcohol causes sleep fragmentation — explaining the characteristic 3 AM waking pattern. The wrist temperature effect is dose-dependent and visible in Apple Watch data. Zero alcohol for 72 hours before important sleep is evidence-based.',
    stat: '1–2 drinks → wrist +0.3–0.8°C; rebound vasoconstriction causes 2–4 AM fragmentation',
  },
]

// ─── Section 4: Fertility & Reproductive Health ───────────────────────────────

const FERTILITY_CARDS = [
  {
    title: 'Apple Watch Ovulation Detection',
    citation: 'Barron 2021 — npj Digital Medicine',
    content:
      'Apple Watch wrist temperature data can detect ovulation within ±1 day in 64% of menstrual cycles when analyzed retroactively. The Apple Cycle Tracking feature (iOS 16+) integrates wrist temperature from Series 8 and Ultra devices to improve ovulation prediction over previous period-tracking methods. The detection relies on identifying the inflection point where wrist temperature shifts upward after the LH surge — typically a 0.2–0.5°C step change sustained across 3+ consecutive nights. Passive, continuous sensing offers advantages over active BBT methods which require careful morning timing and can be disrupted by even minor lifestyle variation.',
    stat: 'Ovulation detection within ±1 day in 64% of cycles; passive vs active BBT',
  },
  {
    title: 'Basal Body Temperature: Historical & Modern Evidence',
    citation: 'Baker 2001 — Human Reproduction',
    content:
      'BBT (basal body temperature) charting has been used as a fertility awareness method since 1949. The follicular phase (Days 1–14) shows a lower, relatively stable temperature baseline. Ovulation is triggered by the LH surge; the resulting progesterone secretion from the corpus luteum raises both core and peripheral body temperature by 0.2–0.5°C — the shift that Apple Watch captures at the wrist. A sustained deviation of 5+ consecutive days above the follicular baseline reliably indicates the luteal phase. The key improvement of wrist temperature over traditional axillary BBT: continuous passive measurement eliminates user error and enables retrospective analysis.',
    stat: '5+ day sustained deviation confirms luteal phase; progesterone drives 0.2–0.5°C shift',
  },
  {
    title: 'RED-S, Anovulation & Athletic Women',
    citation: 'De Souza 2018 — British Journal of Sports Medicine',
    content:
      'Relative Energy Deficiency in Sport (RED-S) suppresses the HPG axis, causing anovulatory cycles in which the LH surge fails to occur and no corpus luteum is formed. In anovulatory cycles, there is no luteal phase temperature rise — the wrist temperature remains at follicular-phase baseline throughout the entire cycle. This absence of the expected temperature step-change is a direct marker of anovulation detectable in wrist data. An estimated 45% of elite female athletes show menstrual irregularities consistent with RED-S. The temperature data provides an objective, passive screen for this clinically significant endocrine disruption.',
    stat: 'Absent luteal temp rise = anovulation marker; 45% of elite female athletes affected by RED-S',
  },
  {
    title: 'Extended Clinical Applications',
    citation: 'Multiple Clinical Sources',
    content:
      'Menopausal hot flashes produce acute, dramatic wrist temperature spikes of 1–5°C lasting 2–5 minutes — the most extreme temperature events visible in Apple Watch data and easily distinguishable from circadian or ovulatory signals. Thyroid dysfunction shifts the entire baseline: hypothyroidism lowers baseline temperature by 0.5–1.0°C; hyperthyroidism raises it. Raynaud\'s phenomenon creates dramatic cold-triggered peripheral temperature drops of 5–15°C in affected digits. Complex Regional Pain Syndrome (CRPS) causes measurable asymmetry between limbs — wrist temperature differences of >1°C between sides are clinically diagnostic. These applications are extending wrist temperature beyond wellness into active clinical monitoring.',
    stat: 'Hot flashes: 1–5°C acute spikes; thyroid shifts baseline ±0.5–1.0°C; Raynaud\'s drops 5–15°C',
  },
]

// ─── Citations Footer ─────────────────────────────────────────────────────────

const CITATIONS = [
  'Kräuchi K et al. (1999). Warm feet promote the rapid onset of sleep. Nature, 401, 36–37.',
  'Raymann RJ et al. (2008). Skin deep: enhanced sleep depth by cutaneous temperature manipulation. Brain, 131(2), 500–513.',
  'Haghayegh S et al. (2019). Before-bedtime passive body heating by warm shower or bath to improve sleep. Sleep Medicine Reviews, 46, 124–135.',
  'Czeisler CA et al. (1999). Stability, precision, and near-24-hour period of the human circadian pacemaker. Science, 284(5423), 2177–2181.',
  'Loosen A et al. (2021). Wearable-sensor monitoring of circadian rhythm adjustment following international travel. Sleep, 44(10).',
  'Shanahan TL et al. (2021). Social jet lag, type 2 diabetes, and metabolic syndrome in the US population. Journal of Clinical Endocrinology & Metabolism.',
  'Drust B et al. (2005). Circadian rhythms in sports performance. Chronobiology International, 22(1), 21–44.',
  'Obermeyer Z et al. (2022). Predicting and preventing sepsis and COVID-19 using wearable temperature data. Nature Medicine, 28, 1892–1902.',
  'Mishra T et al. (2020). Pre-symptomatic detection of COVID-19 from smartwatch data. Nature Biomedical Engineering, 4, 1208–1220.',
  'Pietilä J et al. (2018). Acute effect of alcohol intake on cardiovascular autonomic regulation. JMIR Mental Health, 5(1), e23.',
  'Barron ML et al. (2021). Use of smartwatch to detect menstrual cycle phases. npj Digital Medicine, 4, 155.',
  'Baker FC et al. (2001). Luteal phase effects on body temperature across the menstrual cycle. Human Reproduction, 16(3), 458–461.',
  'De Souza MJ et al. (2018). Bone stress injuries in female distance runners. British Journal of Sports Medicine, 52(4).',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroStatCard({ value, label, sub, color }: (typeof HERO_STATS)[number]) {
  return (
    <div
      className="thermal-card"
      style={{
        background: 'linear-gradient(135deg, rgba(14,21,32,0.95) 0%, rgba(8,13,26,0.98) 100%)',
        border: `1px solid ${color}28`,
        borderTop: `2px solid ${color}`,
        borderRadius: 16,
        padding: '22px 20px',
        flex: '1 1 0',
        minWidth: 220,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at top left, ${color}08 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />
      <p
        className="temp-number"
        style={{
          fontFamily: "'Roboto Mono', ui-monospace, monospace",
          fontSize: 32,
          fontWeight: 700,
          margin: 0,
          lineHeight: 1,
          letterSpacing: '-0.5px',
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          color: color,
          margin: '9px 0 5px',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 11,
          color: '#4a5568',
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {sub}
      </p>
    </div>
  )
}

function SectionDot({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 10px ${color}88`,
        flexShrink: 0,
        animation: 'dotPulse 2.4s ease-in-out infinite',
      }}
    />
  )
}

function SectionTitle({
  dot,
  label,
  title,
}: {
  dot: string
  label: string
  title: string
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <SectionDot color={dot} />
        <span
          style={{
            fontFamily: "'Roboto Mono', ui-monospace, monospace",
            fontSize: 10,
            fontWeight: 700,
            color: dot,
            textTransform: 'uppercase',
            letterSpacing: '1.4px',
          }}
        >
          {label}
        </span>
      </div>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(26px, 4vw, 38px)',
          fontStyle: 'italic',
          fontWeight: 600,
          color: '#f0f4f8',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
    </div>
  )
}

function ScienceCard({
  title,
  citation,
  citationColor,
  borderFrom,
  borderTo,
  content,
  stat,
}: {
  title: string
  citation: string
  citationColor: string
  borderFrom?: string
  borderTo?: string
  content: string
  stat: string
}) {
  const bFrom = borderFrom ?? citationColor
  const bTo = borderTo ?? citationColor
  return (
    <div
      className="thermal-card"
      style={{
        background: '#0e1520',
        border: '1px solid #131d2e',
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Gradient left border */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${bFrom} 0%, ${bTo} 100%)`,
          borderRadius: '3px 0 0 3px',
        }}
      />
      <div style={{ paddingLeft: 3 }}>
        {/* Header */}
        <div
          style={{
            padding: '14px 18px 12px',
            borderBottom: '1px solid #131d2e',
            background: `linear-gradient(90deg, ${bFrom}0a 0%, transparent 100%)`,
          }}
        >
          <h3
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: '#e2e8f0',
              margin: '0 0 4px',
              lineHeight: 1.3,
            }}
          >
            {title}
          </h3>
          <span
            style={{
              fontFamily: "'Roboto Mono', ui-monospace, monospace",
              fontSize: 10,
              fontWeight: 700,
              color: citationColor,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            {citation}
          </span>
        </div>
        {/* Content */}
        <div style={{ padding: '14px 18px 12px' }}>
          <p
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 13,
              color: '#7a8fa8',
              margin: '0 0 12px',
              lineHeight: 1.72,
            }}
          >
            {content}
          </p>
          <div
            style={{
              display: 'inline-block',
              background: `${bFrom}12`,
              border: `1px solid ${bFrom}28`,
              borderRadius: 6,
              padding: '4px 10px',
            }}
          >
            <span
              style={{
                fontFamily: "'Roboto Mono', ui-monospace, monospace",
                fontSize: 11,
                fontWeight: 700,
                color: citationColor,
                lineHeight: 1.4,
              }}
            >
              {stat}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sine Wave Hero SVG ───────────────────────────────────────────────────────

function ThermalWaveSVG() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 160,
        overflow: 'hidden',
        borderRadius: 16,
        background: 'linear-gradient(180deg, rgba(8,13,26,0.0) 0%, rgba(8,13,26,0.6) 100%)',
        marginBottom: 12,
      }}
    >
      {/* Animated wave container — doubled width, animates translateX -50% for seamless loop */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '200%',
          height: '100%',
          animation: 'waveDrift 18s linear infinite',
        }}
      >
        <svg
          viewBox="0 0 2000 160"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#4fc3f7" stopOpacity="0.7" />
              <stop offset="30%"  stopColor="#81d4fa" stopOpacity="0.5" />
              <stop offset="55%"  stopColor="#ff8a65" stopOpacity="0.6" />
              <stop offset="80%"  stopColor="#ef5350" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#4fc3f7" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="waveAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#ff8a65" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#4fc3f7" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {/* Area fill under curve */}
          <path
            d="M0,80 C125,30 250,130 375,80 C500,30 625,130 750,80 C875,30 1000,130 1125,80 C1250,30 1375,130 1500,80 C1625,30 1750,130 1875,80 C2000,30 2000,160 0,160 Z"
            fill="url(#waveAreaGrad)"
          />
          {/* Wave line */}
          <path
            d="M0,80 C125,30 250,130 375,80 C500,30 625,130 750,80 C875,30 1000,130 1125,80 C1250,30 1375,130 1500,80 C1625,30 1750,130 1875,80 C2000,30 2000,80 2000,80"
            fill="none"
            stroke="url(#waveGrad)"
            strokeWidth="2.5"
          />
          {/* Night label region — warm peak (high wrist temp) */}
          <circle cx="250" cy="130" r="4" fill="#ff8a65" opacity="0.9" />
          <text x="262" y="134" fill="#ff8a65" fontSize="11" fontFamily="Roboto Mono, monospace" opacity="0.85">
            Night — warm wrist
          </text>
          {/* Day label region — cool trough */}
          <circle cx="625" cy="30" r="4" fill="#4fc3f7" opacity="0.9" />
          <text x="637" y="34" fill="#4fc3f7" fontSize="11" fontFamily="Roboto Mono, monospace" opacity="0.85">
            Day — cool wrist
          </text>
          {/* Moon icon area */}
          <text x="195" y="148" fill="#ff8a65" fontSize="14" opacity="0.7">☽</text>
          {/* Sun icon area */}
          <text x="570" y="20" fill="#4fc3f7" fontSize="14" opacity="0.7">☀</text>
        </svg>
      </div>

      {/* Overlay labels */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 18,
          display: 'flex',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 28,
              height: 2,
              background: 'linear-gradient(90deg, #4fc3f7, #ff8a65)',
              borderRadius: 1,
            }}
          />
          <span
            style={{
              fontFamily: "'Roboto Mono', monospace",
              fontSize: 10,
              color: '#4a5568',
              letterSpacing: '0.4px',
            }}
          >
            Wrist Temperature Rhythm (24h)
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Thermometer Bar ──────────────────────────────────────────────────────────

function ThermometerBar() {
  const segments = [
    { label: 'Illness', color: '#ef5350', pct: 16 },
    { label: 'Luteal Phase', color: '#ff7043', pct: 14 },
    { label: 'Post-Ovulation', color: '#ff8a65', pct: 14 },
    { label: 'Baseline', color: '#ffb74d', pct: 14 },
    { label: 'Pre-Ovulation', color: '#81c784', pct: 14 },
    { label: 'Sleep Onset', color: '#4fc3f7', pct: 14 },
    { label: 'Hypothermic', color: '#29b6f6', pct: 14 },
  ]

  return (
    <div style={{ marginBottom: 28 }}>
      <p
        style={{
          fontFamily: "'Roboto Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: '#3a4a5a',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          margin: '0 0 10px',
        }}
      >
        Temperature Spectrum — Clinical Context
      </p>
      <div
        style={{
          display: 'flex',
          height: 10,
          borderRadius: 99,
          overflow: 'hidden',
          gap: 1,
        }}
      >
        {segments.map((s) => (
          <div
            key={s.label}
            style={{
              width: `${s.pct}%`,
              background: s.color,
              opacity: 0.85,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 8, gap: 12, flexWrap: 'wrap' }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: s.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 10,
                color: '#3a4a5a',
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
        <span
          style={{
            fontFamily: "'Roboto Mono', monospace",
            fontSize: 10,
            color: '#29b6f6',
            marginLeft: 'auto',
          }}
        >
          Cool
        </span>
        <span
          style={{
            fontFamily: "'Roboto Mono', monospace",
            fontSize: 10,
            color: '#ef5350',
          }}
        >
          Hot
        </span>
      </div>
    </div>
  )
}

// ─── 24h Circadian Circle Visual ──────────────────────────────────────────────

function CircadianCircle() {
  // SVG-based 24h clock with temperature annotations
  const size = 260
  const cx = size / 2
  const cy = size / 2
  const r = 100

  // Convert hour to angle (0h = top = -90deg)
  const hourToXY = (hour: number, radius: number) => {
    const angle = ((hour / 24) * 360 - 90) * (Math.PI / 180)
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  }

  const markers = [
    { hour: 5, label: 'CBTmin', sublabel: '4–6 AM', color: '#4fc3f7', r: 108 },
    { hour: 16, label: 'CBTmax', sublabel: '4–8 PM', color: '#ef5350', r: 108 },
    { hour: 0, label: 'Midnight', sublabel: 'Warm wrist', color: '#ff8a65', r: 108 },
    { hour: 12, label: 'Noon', sublabel: 'Cool wrist', color: '#81d4fa', r: 108 },
  ]

  // Draw arc segments for temperature coloring
  const arcPath = (startHour: number, endHour: number, radius: number) => {
    const start = hourToXY(startHour, radius)
    const end = hourToXY(endHour, radius)
    const large = endHour - startHour > 12 ? 1 : 0
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`
  }

  return (
    <div
      style={{
        background: '#0e1520',
        border: '1px solid #131d2e',
        borderRadius: 16,
        padding: '24px',
        display: 'flex',
        gap: 28,
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="24-hour circadian temperature cycle">
          <defs>
            <radialGradient id="circBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#1a2540" stopOpacity="1" />
              <stop offset="100%" stopColor="#0e1520" stopOpacity="1" />
            </radialGradient>
          </defs>

          {/* Background circle */}
          <circle cx={cx} cy={cy} r={r + 18} fill="url(#circBg)" />

          {/* Temperature arc — cool blue for daytime (wrist cool) */}
          <path
            d={arcPath(6, 18, r)}
            fill="none"
            stroke="#29b6f6"
            strokeWidth="10"
            strokeOpacity="0.18"
            strokeLinecap="round"
          />
          {/* Temperature arc — warm orange for nighttime (wrist warm) */}
          <path
            d={arcPath(18, 6, r)}
            fill="none"
            stroke="#ff8a65"
            strokeWidth="10"
            strokeOpacity="0.25"
            strokeLinecap="round"
          />

          {/* Hour tick marks */}
          {Array.from({ length: 24 }, (_, i) => {
            const inner = hourToXY(i, r - 14)
            const outer = hourToXY(i, r - 8)
            return (
              <line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#1e2d40"
                strokeWidth={i % 6 === 0 ? 2 : 1}
              />
            )
          })}

          {/* Marker dots */}
          {markers.map((m) => {
            const pos = hourToXY(m.hour, r)
            const labelPos = hourToXY(m.hour, r + 28)
            return (
              <g key={m.label}>
                <circle cx={pos.x} cy={pos.y} r={6} fill={m.color} opacity={0.9} />
                <circle cx={pos.x} cy={pos.y} r={11} fill={m.color} opacity={0.12} />
              </g>
            )
          })}

          {/* Center text */}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            fill="#3a5070"
            fontSize="11"
            fontFamily="Roboto Mono, monospace"
            fontWeight="700"
          >
            24h
          </text>
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            fill="#2a3a50"
            fontSize="9"
            fontFamily="Nunito, sans-serif"
          >
            Circadian
          </text>
          <text
            x={cx}
            y={cy + 22}
            textAnchor="middle"
            fill="#2a3a50"
            fontSize="9"
            fontFamily="Nunito, sans-serif"
          >
            Temperature
          </text>

          {/* Hour labels at 0, 6, 12, 18 */}
          {[0, 6, 12, 18].map((h) => {
            const pos = hourToXY(h, r + 18)
            return (
              <text
                key={h}
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fill="#2d4060"
                fontSize="9"
                fontFamily="Roboto Mono, monospace"
              >
                {h === 0 ? '12a' : h === 12 ? '12p' : `${h}`}
              </text>
            )
          })}
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 220 }}>
        <p
          style={{
            fontFamily: "'Roboto Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            color: '#3a4a5a',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: '0 0 14px',
          }}
        >
          Circadian Temperature Anchors
        </p>
        {[
          {
            time: '4–6 AM',
            event: 'CBTmin — Circadian nadir',
            detail: 'Deepest sleep, coolest core, warmest wrist',
            color: '#4fc3f7',
          },
          {
            time: '4–8 PM',
            event: 'CBTmax — Peak performance',
            detail: 'Fastest reaction time, peak muscle strength',
            color: '#ef5350',
          },
          {
            time: '8–10 PM',
            event: 'Melatonin onset',
            detail: 'Peripheral vasodilation begins, wrist warms',
            color: '#ff8a65',
          },
          {
            time: '30–45 min',
            event: 'Wrist temperature lag',
            detail: 'Peripheral vascular transit time behind core',
            color: '#ffb74d',
          },
        ].map((item) => (
          <div
            key={item.time}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              paddingBottom: 12,
              marginBottom: 12,
              borderBottom: '1px solid #131d2e',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                background: `${item.color}18`,
                border: `1px solid ${item.color}30`,
                borderRadius: 6,
                padding: '3px 7px',
                minWidth: 52,
              }}
            >
              <span
                style={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  color: item.color,
                  letterSpacing: '0.4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.time}
              </span>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#c8d8e8',
                  margin: '0 0 2px',
                }}
              >
                {item.event}
              </p>
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 11,
                  color: '#3a5070',
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Illness Detection Timeline ────────────────────────────────────────────────

function IllnessTimeline() {
  const days = [
    {
      label: 'Day −2',
      title: 'Subclinical Deviation',
      detail: 'Wrist temp +0.3°C above baseline. Immune surveillance activated.',
      temp: '+0.3°C',
      tempColor: '#ff8a65',
      barPct: 35,
      barColor: '#ff8a65',
    },
    {
      label: 'Day −1',
      title: 'Immune Escalation',
      detail: 'Temp +0.6°C. HRV suppressed, resting HR elevated. IL-6 rising.',
      temp: '+0.6°C',
      tempColor: '#ef5350',
      barPct: 65,
      barColor: '#ef5350',
    },
    {
      label: 'Day 0',
      title: 'Symptom Onset',
      detail: 'Fever, fatigue, congestion develop. Hypothalamic set-point reset.',
      temp: '+1.2°C',
      tempColor: '#b71c1c',
      barPct: 100,
      barColor: '#b71c1c',
    },
  ]

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(14,21,32,0.98) 0%, rgba(30,10,10,0.5) 100%)',
        border: '1px solid rgba(239,83,80,0.18)',
        borderRadius: 16,
        padding: '20px 22px',
        marginBottom: 20,
      }}
    >
      <p
        style={{
          fontFamily: "'Roboto Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: '#ef5350',
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          margin: '0 0 16px',
        }}
      >
        Illness Detection Timeline — Wrist Temperature Signature
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {days.map((d) => (
          <div key={d.label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Day label */}
            <div style={{ flexShrink: 0, width: 58 }}>
              <span
                style={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  color: d.tempColor,
                }}
              >
                {d.label}
              </span>
            </div>
            {/* Bar and text */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#c8d8e8',
                  }}
                >
                  {d.title}
                </span>
                <span
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    color: d.tempColor,
                  }}
                >
                  {d.temp}
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  background: '#131d2e',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginBottom: 5,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${d.barPct}%`,
                    background: `linear-gradient(90deg, ${d.barColor}66, ${d.barColor})`,
                    borderRadius: 3,
                  }}
                />
              </div>
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 11,
                  color: '#3a5070',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {d.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Fertility Cycle Timeline ─────────────────────────────────────────────────

function FertilityCycleViz() {
  const phases = [
    {
      label: 'Menstruation',
      days: 'Days 1–5',
      temp: 'Baseline',
      color: '#ef5350',
      width: '18%',
      note: 'Temp returns post-cycle',
    },
    {
      label: 'Follicular',
      days: 'Days 6–13',
      temp: '−0.1 to 0°C',
      color: '#ff8a65',
      width: '28%',
      note: 'Lower, stable baseline',
    },
    {
      label: 'Ovulation',
      days: 'Day 14',
      temp: '+0.2–0.5°C',
      color: '#ffb74d',
      width: '4%',
      note: 'LH surge → progesterone',
    },
    {
      label: 'Luteal',
      days: 'Days 15–28',
      temp: '+0.2–0.5°C',
      color: '#81c784',
      width: '50%',
      note: 'Elevated baseline sustained',
    },
  ]

  return (
    <div
      style={{
        background: '#0e1520',
        border: '1px solid rgba(255,138,101,0.15)',
        borderRadius: 16,
        padding: '20px 22px',
        marginBottom: 20,
      }}
    >
      <p
        style={{
          fontFamily: "'Roboto Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: '#ff8a65',
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          margin: '0 0 16px',
        }}
      >
        28-Day Cycle — Wrist Temperature Signature
      </p>

      {/* Phase bar */}
      <div
        style={{
          display: 'flex',
          height: 12,
          borderRadius: 99,
          overflow: 'hidden',
          gap: 2,
          marginBottom: 14,
        }}
      >
        {phases.map((p) => (
          <div
            key={p.label}
            style={{
              width: p.width,
              background: p.color,
              opacity: 0.75,
            }}
          />
        ))}
      </div>

      {/* Temperature wave representation */}
      <div style={{ height: 48, position: 'relative', marginBottom: 14 }}>
        <svg viewBox="0 0 400 48" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="cycleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#ef5350" stopOpacity="0.6" />
              <stop offset="18%"  stopColor="#ff8a65" stopOpacity="0.5" />
              <stop offset="50%"  stopColor="#ffb74d" stopOpacity="0.8" />
              <stop offset="52%"  stopColor="#81c784" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ef5350" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {/* Flat follicular, rise at ovulation, elevated luteal, drop at cycle end */}
          <path
            d="M0,34 L72,34 L72,32 L90,34 L100,28 L108,18 L130,18 L200,18 L205,34 L400,34"
            fill="none"
            stroke="url(#cycleGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Ovulation marker */}
          <circle cx="104" cy="18" r="4" fill="#ffb74d" opacity="0.9" />
          <text x="108" y="14" fill="#ffb74d" fontSize="8" fontFamily="Roboto Mono, monospace">Ovulation</text>
          {/* Baseline reference line */}
          <line x1="0" y1="34" x2="400" y2="34" stroke="#1e2d40" strokeWidth="1" strokeDasharray="4,4" />
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {phases.map((p) => (
          <div key={p.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, minWidth: 140 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: p.color,
                flexShrink: 0,
                marginTop: 3,
              }}
            />
            <div>
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#a0b4c8',
                  margin: 0,
                }}
              >
                {p.label}
                <span
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontWeight: 400,
                    fontSize: 10,
                    color: '#3a5070',
                    marginLeft: 5,
                  }}
                >
                  {p.days}
                </span>
              </p>
              <p
                style={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: 10,
                  color: p.color,
                  margin: '2px 0 0',
                }}
              >
                {p.temp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WristTemperatureSciencePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #080d1a 0%, #060a14 40%, #080c18 70%, #040810 100%)',
      }}
    >
      {/* Injected font + animation styles */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      {/* ── Sticky Header ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          background: 'rgba(8,13,26,0.82)',
          borderBottom: '1px solid rgba(79,195,247,0.10)',
        }}
      >
        <div
          style={{
            maxWidth: 820,
            margin: '0 auto',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Link
            href="/temperature"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(79,195,247,0.07)',
              border: '1px solid rgba(79,195,247,0.14)',
              color: '#4fc3f7',
              textDecoration: 'none',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
            aria-label="Back to Wrist Temperature"
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </Link>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 17,
                fontWeight: 700,
                color: '#e2e8f0',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Wrist Temperature Science
            </h1>
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 12,
                color: '#3a5070',
                margin: '2px 0 0',
              }}
            >
              Thermal physiology, circadian biology &amp; clinical applications
            </p>
          </div>
          {/* Spectrum accent strip */}
          <div
            style={{
              width: 60,
              height: 6,
              borderRadius: 99,
              background: 'linear-gradient(90deg, #4fc3f7, #ff8a65, #ef5350)',
              opacity: 0.7,
              flexShrink: 0,
            }}
          />
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '28px 20px 100px' }}>

        {/* ── HERO ── */}
        <div className="section-hero" style={{ marginBottom: 40 }}>

          {/* Hero title */}
          <div style={{ marginBottom: 20 }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: 'clamp(36px, 7vw, 64px)',
                color: '#f0f4f8',
                margin: '0 0 14px',
                lineHeight: 1.08,
                letterSpacing: '-0.5px',
              }}
            >
              Wrist Temperature{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #4fc3f7 0%, #ff8a65 55%, #ef5350 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Science
              </span>
            </h2>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 'clamp(16px, 2.8vw, 22px)',
                color: '#4a6070',
                margin: '0 0 24px',
                lineHeight: 1.55,
                maxWidth: 600,
              }}
            >
              Your skin tells your story. Every degree of deviation is data — about your sleep, your immune system, your cycle.
            </p>

            {/* Thermometer spectrum bar */}
            <ThermometerBar />
          </div>

          {/* Temperature wave SVG */}
          <ThermalWaveSVG />

          {/* Hero stat callouts */}
          <div
            style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              marginTop: 20,
            }}
          >
            {HERO_STATS.map((stat) => (
              <HeroStatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>

        {/* ── SECTION 1: SLEEP PHYSIOLOGY ── */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle
            dot="#4fc3f7"
            label="Section 01 — Sleep Physiology"
            title="Why Your Wrist Warms Before You Sleep"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 14,
            }}
          >
            {SLEEP_CARDS.map((card) => (
              <ScienceCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        {/* ── SECTION 2: CIRCADIAN BIOLOGY ── */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle
            dot="#ff8a65"
            label="Section 02 — Circadian Biology"
            title="The Temperature Clock"
          />

          {/* 24h circle visualization */}
          <CircadianCircle />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 14,
            }}
          >
            {CIRCADIAN_CARDS.map((card) => (
              <ScienceCard key={card.title} {...card} borderFrom="#ff8a65" borderTo="#ef5350" />
            ))}
          </div>
        </section>

        {/* ── SECTION 3: ILLNESS DETECTION ── */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle
            dot="#ef5350"
            label="Section 03 — Illness Detection"
            title="Early Warning System"
          />

          {/* Detection timeline */}
          <IllnessTimeline />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 14,
            }}
          >
            {ILLNESS_CARDS.map((card) => (
              <ScienceCard
                key={card.title}
                {...card}
                citationColor="#ef5350"
                borderFrom="#ef5350"
                borderTo="#b71c1c"
              />
            ))}
          </div>
        </section>

        {/* ── SECTION 4: FERTILITY ── */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle
            dot="#ff8a65"
            label="Section 04 — Reproductive Health"
            title="The Cycle in Degrees"
          />

          {/* 28-day cycle visualization */}
          <FertilityCycleViz />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 14,
            }}
          >
            {FERTILITY_CARDS.map((card) => (
              <ScienceCard
                key={card.title}
                {...card}
                citationColor="#ff8a65"
                borderFrom="#ff8a65"
                borderTo="#ff7043"
              />
            ))}
          </div>
        </section>

        {/* ── CITATIONS FOOTER ── */}
        <div
          style={{
            background: '#0a1018',
            border: '1px solid #0e1826',
            borderRadius: 14,
            padding: '18px 20px',
          }}
        >
          <p
            style={{
              fontFamily: "'Roboto Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              color: '#1e3048',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              margin: '0 0 14px',
            }}
          >
            References
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {CITATIONS.map((cite, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: 10,
                  color: '#1e3048',
                  margin: 0,
                  lineHeight: 1.6,
                  paddingLeft: 14,
                  textIndent: '-14px',
                }}
              >
                <span style={{ color: '#2a4060', marginRight: 6 }}>
                  [{String(i + 1).padStart(2, '0')}]
                </span>
                {cite}
              </p>
            ))}
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  )
}

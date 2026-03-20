// Boxing Science — server component
// Punch biomechanics, energy systems, brain health, and training physiology.

// ─── Punch Force Data ─────────────────────────────────────────────────────────

const PUNCH_FORCE_DATA = [
  { label: 'Recreational', force: 1.2, unit: 'kN', desc: 'Untrained adult male', color: '#555555', barColor: '#444444' },
  { label: 'Amateur', force: 2.6, unit: 'kN', desc: 'Club-level competitor', color: '#888888', barColor: '#666666' },
  { label: 'Pro Welterweight', force: 3.1, unit: 'kN', desc: 'Professional fighter', color: '#cc3333', barColor: '#aa2222' },
  { label: 'Pro Heavyweight', force: 4.8, unit: 'kN', desc: 'Elite — Turner 2011 peak', color: '#ff2222', barColor: '#cc0000' },
]

const MAX_FORCE = 5.0

// ─── Training Intensity Zones ─────────────────────────────────────────────────

const TRAINING_ZONES = [
  {
    zone: 'Z1',
    name: 'Shadow / Recovery',
    pctRange: '< 60% HRmax',
    bpmRange: '< 114 bpm',
    desc: 'Footwork, technique drilling, active recovery',
    color: '#555555',
    barWidth: 28,
    highlight: false,
  },
  {
    zone: 'Z2',
    name: 'Bag Work / Pads',
    pctRange: '60–75% HRmax',
    bpmRange: '114–143 bpm',
    desc: 'Aerobic base, combination drilling, fat oxidation',
    color: '#888888',
    barWidth: 45,
    highlight: false,
  },
  {
    zone: 'Z3',
    name: 'Heavy Bag Intervals',
    pctRange: '75–85% HRmax',
    bpmRange: '143–162 bpm',
    desc: 'Lactate threshold, sustained combinations',
    color: '#cc6600',
    barWidth: 60,
    highlight: false,
  },
  {
    zone: 'Z4',
    name: 'Sparring',
    pctRange: '85–92% HRmax',
    bpmRange: '162–175 bpm',
    desc: 'High glycolytic demand — fight-simulation intensity',
    color: '#dd3300',
    barWidth: 76,
    highlight: true,
  },
  {
    zone: 'Z5',
    name: 'Fight Round',
    pctRange: '92–98% HRmax',
    bpmRange: '175–185 bpm',
    desc: 'Dunn 2016 — maintained throughout bouts; PCr + glycolytic dominant',
    color: '#ff2200',
    barWidth: 90,
    highlight: true,
  },
]

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'biomechanics',
    number: '01',
    title: 'Punch Biomechanics & Force Generation',
    accent: '#ff2222',
    accentDim: 'rgba(255,34,34,0.12)',
    accentBorder: 'rgba(255,34,34,0.30)',
    findings: [
      {
        citation: 'Turner 2011 — J Sports Sci',
        stat: '4.8 kN',
        statLabel: 'Peak punch force',
        detail:
          'Elite heavyweight boxers generate peak straight punch forces of 4,800 N (4.8 kN) — equivalent to roughly 489 kg applied instantaneously. Force production is mediated by a proximal-to-distal kinetic chain: ground reaction force → hip rotation → trunk rotation → shoulder → elbow extension → wrist snap. Amateur athletes produce 1.2–2.6 kN; the 2–4× gap between amateur and elite reflects years of neuromuscular coordination training, not simply strength. Leg drive contributes approximately 38% of total punch impulse — boxers who punch purely from the arm generate dramatically less force.',
      },
      {
        citation: 'Lenetsky 2013 — J Strength Cond Res',
        stat: '75–82%',
        statLabel: 'Kinetic energy transferred',
        detail:
          'Of the total kinetic energy in the fist at impact, 75–82% is transferred to the target — the remainder is lost to glove deformation, wrist compliance, and shoulder absorption. Transfer efficiency is maximised by a stiff wrist at impact, tight fist closure 20–30 ms before contact, and a "follow-through" targeting 5–10 cm beyond the surface. Elite boxers demonstrate superior transfer efficiency vs recreational fighters at identical fist speed, entirely attributable to neuromuscular timing and impact stiffness rather than absolute velocity.',
      },
      {
        citation: 'Viano 2005 — Clin J Sport Med',
        stat: '58 g',
        statLabel: 'Peak head acceleration',
        detail:
          'Padded gloves reduce peak head acceleration from ~130 g (bare knuckle) to 58 g — but this remains well above the concussion threshold of 82–100 g identified in football research. Glove mass matters: heavier gloves reduce velocity but not necessarily peak force if momentum is preserved. Finite element modelling shows 16 oz gloves distribute contact pressure over a larger skull surface area, reducing localised pressure concentration by 22% compared to 10 oz competition gloves, which partially explains the divergence between cumulative brain injury in training vs competition.',
      },
      {
        citation: 'Walilko 2005 — Br J Sports Med',
        stat: '40–60%',
        statLabel: 'Force reduction by head movement',
        detail:
          'Active head movement at impact — slipping, rolling, or pulling away — reduces effective transmitted force by 40–60% by converting the rigid collision to a glancing blow. This is the primary defensive mechanism in boxing, far exceeding glove padding or headgear in protective effect. Walilko\'s biomechanical modelling also established that punches landing while the head is turned 15–30° produce 2.3× greater rotational acceleration than direct frontal impacts — a key mechanism for knockout, as rotational acceleration drives axonal shear injury more than linear deceleration.',
      },
    ],
  },
  {
    id: 'energy',
    number: '02',
    title: 'Round Energy Systems & Metabolic Demand',
    accent: '#ff8800',
    accentDim: 'rgba(255,136,0,0.12)',
    accentBorder: 'rgba(255,136,0,0.30)',
    findings: [
      {
        citation: 'Davis 2002 — J Sci Med Sport',
        stat: '90%',
        statLabel: 'PCr + glycolytic energy share',
        detail:
          'During the first 45 seconds of a boxing round, phosphocreatine (PCr) and glycolytic pathways supply approximately 90% of total energy demand. The aerobic system cannot respond fast enough given the >90% HRmax intensities and explosive burst patterns typical of competition. As rounds progress, PCr stores are only partially replenished during the 60-second rest interval, causing progressive reliance on anaerobic glycolysis and blood lactate accumulation of 8–14 mmol/L by the late rounds. This explains the characteristic decline in punch frequency and force in rounds 4–6 of a 6-round bout.',
      },
      {
        citation: 'Dunn 2016 — Int J Sports Physiol Perform',
        stat: '175–185 bpm',
        statLabel: 'Heart rate throughout bouts',
        detail:
          'GPS and heart-rate telemetry in 18 professional boxers across 48 competitive bouts documented that heart rate is sustained at 175–185 bpm for virtually the entire duration of each round — including between exchanges — indicating continuous high cardiorespiratory demand even during defensive manoeuvring and footwork. Heart rate typically drops only 15–25 bpm during the 60-second corner interval, remaining at 150–165 bpm as the next round begins. This creates a cumulative oxygen debt that compounds across rounds and underscores the critical importance of aerobic base for late-round performance.',
      },
      {
        citation: 'Smith 2001 — J Sports Med Phys Fitness',
        stat: '10–14 kcal/min',
        statLabel: 'Energy expenditure rate',
        detail:
          'Direct metabolic measurement using Douglas bags in amateur boxers during 2-minute competitive rounds recorded energy expenditure of 10–14 kcal/min — among the highest rates recorded for any sport. Total bout energy expenditure for a 6-round amateur contest: approximately 500–600 kcal, comparable to running a 5K at race pace. The large range (10–14) reflects individual VO₂max, body mass, and fighting style; aggressive pressure fighters show peak values, while technical counter-punchers operate at the lower bound despite similar external work.',
      },
      {
        citation: 'Scott 2011 — J Sci Med Sport',
        stat: '15–25%',
        statLabel: 'EPOC above resting for 60–90 min',
        detail:
          'Excess post-exercise oxygen consumption (EPOC) following a 6-round boxing session remains 15–25% above resting for 60–90 minutes — the "afterburn" effect that elevates total calorie expenditure well beyond the bout itself. This is driven by lactate clearance, PCr resynthesis, elevated core temperature, and hormonal responses (elevated catecholamines and cortisol). Importantly, EPOC magnitude correlates with peak lactate achieved: boxers who train at true competition intensity generate substantially greater 24-hour caloric deficit than those who spar at controlled intensity.',
      },
    ],
  },
  {
    id: 'brain',
    number: '03',
    title: 'Brain Health, Concussion & CTE',
    accent: '#cc44ff',
    accentDim: 'rgba(204,68,255,0.12)',
    accentBorder: 'rgba(204,68,255,0.30)',
    findings: [
      {
        citation: 'McKee 2015 — Brain (Neuropathology series)',
        stat: '80%',
        statLabel: 'CTE prevalence in deceased boxers',
        detail:
          'Chronic traumatic encephalopathy (CTE) was identified in 80% of deceased professional boxers in McKee\'s landmark neuropathological series. CTE is characterised by abnormal tau protein accumulation in a distinctive perivascular distribution, beginning in frontal and temporal cortices and spreading subcortically. Clinically, CTE presents as "dementia pugilistica" — progressive cognitive decline, Parkinsonism, behavioural dysregulation, and impulse control disorders — typically manifesting 10–20 years after boxing career end. Professional career length correlates strongly with CTE severity; amateur boxing with limited sparring carries substantially lower risk, as subconcussive head impacts appear to be primary drivers rather than frank knockouts.',
      },
      {
        citation: 'Greenwald 2008 — Neurosurgery',
        stat: '82–100 g',
        statLabel: 'Concussion acceleration threshold',
        detail:
          'Concussion probability reaches 50% at head linear accelerations of 82–100 g (with 95% probability at ~120 g) based on NFL biomechanical data modelled by Greenwald. Elite boxing punches regularly produce 58–130 g peak head acceleration depending on punch type — meaning concussion probability per hard punch ranges from 10–70%. Rotational acceleration (rad/s²) may be an even more sensitive predictor of diffuse axonal injury than linear acceleration. A single boxing match with 100 landed head shots represents an extraordinary cumulative rotational acceleration exposure, even without clinical concussion.',
      },
      {
        citation: 'Heilbronner 2009 — Clin Neuropsychol',
        stat: '−1.2 SD',
        statLabel: 'Neuropsychological deficit vs controls',
        detail:
          'Meta-analysis of 27 neuropsychological studies in active and retired professional boxers found deficits of −1.2 SD relative to matched controls in processing speed, −0.8 SD in episodic memory, and −0.7 SD in executive function — all statistically and clinically significant. Deficits correlated with professional bout exposure and were present even in "sub-elite" fighters below world ranking. Critically, deficits were detectable in active fighters still competing, indicating ongoing damage accumulation during careers. Amateur boxers with controlled sparring regimens show substantially smaller deficits (−0.3 to −0.4 SD), supporting the protectiveness of limiting cumulative head impact exposure.',
      },
      {
        citation: 'Zazryn 2003 — Br J Sports Med',
        stat: '47–56%',
        statLabel: 'Headguard KO rate reduction',
        detail:
          'Amateur competition data across 8,922 bouts showed that headguard use reduced KO and TKO rates by 47–56% vs unprotected competition. However, paradoxically, headguards do not reduce concussion incidence in sparring — they expand the effective target area and reduce fear-of-contact inhibition, leading to more, harder punches thrown. The net result is that sparring with headguards may deliver comparable or greater total rotational acceleration to the brain than unprotected technical drilling. This has driven national governing bodies to remove headguards from male Olympic competition since 2016, based on evidence that their real benefit is stopping cuts rather than neurological protection.',
      },
    ],
  },
  {
    id: 'training',
    number: '04',
    title: 'Training Physiology & Athletic Development',
    accent: '#00cc88',
    accentDim: 'rgba(0,204,136,0.12)',
    accentBorder: 'rgba(0,204,136,0.30)',
    findings: [
      {
        citation: 'Khanna 2006 — Br J Sports Med',
        stat: '55–70 mL/kg/min',
        statLabel: 'Elite boxer VO₂max',
        detail:
          'Elite professional boxers demonstrate VO₂max values of 55–70 mL/kg/min — squarely in the range of endurance athletes and far exceeding general population values of 35–45 mL/kg/min. This aerobic capacity is the physiological foundation for late-round performance: a higher VO₂max allows faster PCr and lactate clearance during the 60-second interval, a greater aerobic contribution during lower-intensity rounds, and superior cardiac output under sustained high-intensity demand. Training programmes that neglect aerobic base development in favour of exclusively anaerobic methods consistently produce fighters who deteriorate sharply in rounds 4–6.',
      },
      {
        citation: 'Whiting 1988 — Am J Sports Med',
        stat: '10–14 m/s',
        statLabel: 'Fist velocity at impact',
        detail:
          'High-speed cinematography of elite boxers recorded fist velocities of 10–14 m/s (36–50 km/h) at impact — jabs averaging 10–11 m/s, hooks 12–13 m/s, and rear crosses 12–14 m/s. Cross-punch velocity accounts for roughly 65% of the variance in peak punch force (F = ma), meaning speed training is at least as important as strength training for force development. Plyometric and speed-strength (ballistic) training modalities — medicine ball throws, resistance band punching — produce superior velocity gains compared to traditional resistance training alone.',
      },
      {
        citation: 'Fogelholm 1993 — Int J Sport Nutr',
        stat: '3–5%',
        statLabel: 'Body weight cut before weigh-in',
        detail:
          'Weight cutting — rapid dehydration before weigh-in followed by rehydration — is ubiquitous in boxing. Fogelholm documented that fighters typically cut 3–5% body weight (up to 8% in extreme cases) in 24–48 hours using fluid restriction, sweat suits, and saunas. Rehydration of 3–4% dehydration fully restores performance within 20–24 hours if adequate fluid, electrolyte, and carbohydrate refeeding occurs. However, cuts >5% body weight with <16 hours rehydration window — common in same-day weigh-in formats — produce persistent impairments: −12% VO₂max, −18% anaerobic power, and significant thermoregulatory compromise that persists into competition. Renal and cardiac complications increase with repeated severe cuts.',
      },
      {
        citation: 'Bompa 2009 — Periodization Theory (Applied Boxing)',
        stat: '12 weeks',
        statLabel: 'Standard fight camp duration',
        detail:
          'Bompa\'s periodisation model applied to boxing identifies a standard 12-week fight camp structure: weeks 1–4 (general preparation) focus on aerobic base, strength, and movement volume; weeks 5–8 (specific preparation) introduce sparring, anaerobic intervals, and sport-specific conditioning; weeks 9–11 (pre-competition) peak intensity with reduced volume, technical sharpening, and fight-simulation sparring; week 12 (taper) reduces volume 40–50% while maintaining intensity to allow neuromuscular supercompensation. Tapering too early (>10 days) risks detraining; tapering too late (<5 days) leaves cumulative fatigue unresolved. Peak physical performance consistently emerges 5–7 days post-taper.',
      },
    ],
  },
]

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '4.8 kN', label: 'Elite punch force', sub: 'Turner 2011 — heavyweight peak', color: '#ff2222' },
  { value: '185 bpm', label: 'Bout heart rate', sub: 'Dunn 2016 — sustained throughout rounds', color: '#ff8800' },
  { value: '80%', label: 'CTE in deceased boxers', sub: 'McKee 2015 — professional series', color: '#cc44ff' },
  { value: '67 mL/kg', label: 'Elite VO₂max', sub: 'Khanna 2006 — pro boxer average', color: '#00cc88' },
]

// ─── SVG Punch Force Visualization ───────────────────────────────────────────

const CHART_W = 520
const CHART_H = 180
const CHART_PAD_L = 110
const CHART_PAD_R = 80
const CHART_PAD_T = 16
const CHART_PAD_B = 24
const CHART_PLOT_W = CHART_W - CHART_PAD_L - CHART_PAD_R
const CHART_PLOT_H = (CHART_H - CHART_PAD_T - CHART_PAD_B) / PUNCH_FORCE_DATA.length

function forceBarWidth(force: number): number {
  return (force / MAX_FORCE) * CHART_PLOT_W
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BoxingSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --red: #ff1a1a;
          --red-dim: #cc0000;
          --red-glow: rgba(255,26,26,0.35);
          --red-faint: rgba(255,26,26,0.08);
          --bg: #080808;
          --bg-card: #0f0f0f;
          --bg-card2: #131313;
          --border: rgba(255,255,255,0.07);
          --text: #f0f0f0;
          --text-dim: #888888;
          --text-muted: #444444;
          --mono: 'IBM Plex Mono', monospace;
          --display: 'Anton', sans-serif;
          --body: 'Barlow Condensed', sans-serif;
        }

        .boxing-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: var(--body);
          position: relative;
          overflow-x: hidden;
        }

        /* ── Grain overlay ── */
        .boxing-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 200px 200px;
          pointer-events: none;
          z-index: 0;
          opacity: 0.6;
        }

        /* ── Hero ── */
        .boxing-hero {
          position: relative;
          padding: 0;
          overflow: hidden;
          background: #050505;
          border-bottom: 2px solid var(--red-dim);
        }

        .boxing-hero::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--red), var(--red-dim), transparent);
        }

        .hero-spotlight {
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 600px;
          background: radial-gradient(ellipse at 50% 0%, rgba(255,20,20,0.22) 0%, rgba(200,0,0,0.08) 35%, transparent 65%);
          pointer-events: none;
        }

        .hero-spotlight-2 {
          position: absolute;
          top: 0;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(ellipse at 100% 0%, rgba(255,100,0,0.10) 0%, transparent 60%);
          pointer-events: none;
        }

        /* Corner post decorations */
        .corner-post {
          position: absolute;
          width: 6px;
          background: var(--red-dim);
        }
        .corner-post-tl { top: 0; left: 24px; height: 100%; opacity: 0.4; }
        .corner-post-tr { top: 0; right: 24px; height: 100%; opacity: 0.4; }

        /* Ring rope lines */
        .ring-rope {
          position: absolute;
          left: 30px; right: 30px;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255,26,26,0.25), transparent);
        }

        .hero-inner {
          position: relative;
          z-index: 2;
          max-width: 900px;
          margin: 0 auto;
          padding: 64px 24px 56px;
          text-align: center;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--red);
          background: rgba(255,26,26,0.08);
          border: 1px solid rgba(255,26,26,0.25);
          padding: 6px 16px;
          margin-bottom: 24px;
        }

        .hero-eyebrow::before {
          content: '';
          display: inline-block;
          width: 6px; height: 6px;
          background: var(--red);
          animation: pulse-dot 1.8s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.7); }
        }

        .hero-title {
          font-family: var(--display);
          font-size: clamp(68px, 14vw, 140px);
          line-height: 0.88;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          color: #ffffff;
          margin: 0 0 4px;
          text-shadow: 0 0 80px rgba(255,30,30,0.30), 0 4px 0 #330000;
        }

        .hero-title span {
          color: var(--red);
          display: block;
          text-shadow: 0 0 60px rgba(255,20,20,0.60), 0 4px 0 #220000;
        }

        .hero-sub {
          font-family: var(--body);
          font-size: clamp(15px, 2.5vw, 20px);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin: 20px 0 8px;
        }

        .hero-desc {
          font-family: var(--body);
          font-size: 15px;
          font-weight: 400;
          color: rgba(255,255,255,0.40);
          max-width: 560px;
          margin: 0 auto 32px;
          line-height: 1.65;
          letter-spacing: 0.02em;
        }

        .hero-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .hero-tag {
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--red);
          background: rgba(255,26,26,0.07);
          border: 1px solid rgba(255,26,26,0.22);
          padding: 5px 12px;
        }

        /* ── Diagonal section divider ── */
        .section-cut {
          position: relative;
          height: 40px;
          overflow: hidden;
          margin: 0;
        }
        .section-cut-inner {
          position: absolute;
          inset: 0;
          background: var(--bg);
          clip-path: polygon(0 0, 100% 40%, 100% 100%, 0 100%);
        }

        /* ── Main layout ── */
        .boxing-main {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 16px 100px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* ── Section headings ── */
        .section-label {
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--red);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,26,26,0.3), transparent);
        }

        /* ── Key Stats Grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2px;
          border: 1px solid rgba(255,26,26,0.20);
          background: rgba(255,26,26,0.08);
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .stats-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .stat-cell {
          background: var(--bg-card);
          padding: 20px 16px;
          position: relative;
          overflow: hidden;
          border-right: 1px solid rgba(255,255,255,0.05);
        }

        .stat-cell::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }

        .stat-value {
          font-family: var(--display);
          font-size: clamp(28px, 5vw, 42px);
          line-height: 1;
          letter-spacing: 0.01em;
          display: block;
          margin-bottom: 6px;
        }

        .stat-label {
          font-family: var(--body);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 4px;
          display: block;
        }

        .stat-sub {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 0.03em;
        }

        /* ── Punch Force Chart ── */
        .force-chart-wrap {
          background: var(--bg-card);
          border: 1px solid var(--border);
          overflow: hidden;
          position: relative;
        }

        .force-chart-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--red-dim), transparent);
        }

        .chart-header {
          padding: 16px 20px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chart-title {
          font-family: var(--body);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text);
          margin: 0 0 3px;
        }

        .chart-citation {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-muted);
        }

        /* ── Science Cards ── */
        .science-card {
          border: 1px solid var(--border);
          background: var(--bg-card);
          overflow: hidden;
          position: relative;
        }

        .card-number {
          font-family: var(--display);
          font-size: 80px;
          line-height: 1;
          position: absolute;
          right: 16px;
          top: 8px;
          opacity: 0.06;
          letter-spacing: -0.02em;
          pointer-events: none;
          user-select: none;
        }

        .card-header {
          padding: 18px 20px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: flex-start;
          gap: 14px;
          position: relative;
        }

        .card-accent-bar {
          position: absolute;
          top: 0; bottom: 0;
          left: 0;
          width: 3px;
        }

        .card-title {
          font-family: var(--display);
          font-size: clamp(18px, 3.5vw, 26px);
          letter-spacing: 0.02em;
          text-transform: uppercase;
          line-height: 1.05;
          margin: 0;
          padding-left: 12px;
        }

        .finding-row {
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          position: relative;
        }

        @media (min-width: 580px) {
          .finding-row { grid-template-columns: 90px 1fr; }
        }

        .finding-stat-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-shrink: 0;
        }

        .finding-stat {
          font-family: var(--display);
          font-size: clamp(20px, 4vw, 30px);
          line-height: 1;
          letter-spacing: 0.01em;
        }

        .finding-stat-label {
          font-family: var(--mono);
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
          line-height: 1.3;
        }

        .finding-citation {
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 7px;
          display: block;
        }

        .finding-detail {
          font-family: var(--body);
          font-size: 13px;
          font-weight: 400;
          line-height: 1.70;
          color: rgba(255,255,255,0.48);
          letter-spacing: 0.01em;
        }

        /* ── Training Zones ── */
        .zones-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .zone-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.035);
          transition: background 0.15s;
        }

        .zone-badge {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
          border: 1px solid;
        }

        .zone-name {
          font-family: var(--body);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .zone-desc {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .zone-bar-track {
          height: 4px;
          background: rgba(255,255,255,0.06);
          border-radius: 0;
          flex: 1;
          overflow: hidden;
          min-width: 60px;
        }

        .zone-bar-fill {
          height: 100%;
          border-radius: 0;
        }

        .zone-bpm {
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
          white-space: nowrap;
          text-align: right;
          min-width: 72px;
        }

        /* ── Impact animation rings ── */
        @keyframes ring-expand {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
        }

        .impact-ring {
          position: absolute;
          width: 80px; height: 80px;
          border: 2px solid rgba(255,26,26,0.5);
          border-radius: 50%;
          top: 50%; left: 50%;
          pointer-events: none;
        }

        .impact-ring-1 { animation: ring-expand 2.4s ease-out infinite; }
        .impact-ring-2 { animation: ring-expand 2.4s ease-out 0.8s infinite; }
        .impact-ring-3 { animation: ring-expand 2.4s ease-out 1.6s infinite; }

        /* ── Warning callout ── */
        .warning-box {
          background: rgba(255,26,26,0.05);
          border: 1px solid rgba(255,26,26,0.18);
          padding: 18px 20px;
          display: flex;
          gap: 14px;
        }

        .warning-icon {
          font-family: var(--display);
          font-size: 22px;
          color: var(--red);
          flex-shrink: 0;
          line-height: 1;
          margin-top: 1px;
        }

        .warning-title {
          font-family: var(--body);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--red);
          margin-bottom: 5px;
        }

        .warning-text {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* ── Footer note ── */
        .footer-note {
          font-family: var(--mono);
          font-size: 10px;
          color: #333333;
          line-height: 1.7;
          border-top: 1px solid #1a1a1a;
          padding-top: 24px;
          letter-spacing: 0.01em;
        }

        /* ── Diagonal slash decorative element ── */
        .slash-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }

        .slash-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, var(--red-dim), transparent);
        }

        .slash-glyph {
          font-family: var(--display);
          font-size: 18px;
          color: var(--red-dim);
          letter-spacing: -0.04em;
          opacity: 0.6;
        }

        .slash-line-r {
          flex: 1;
          height: 1px;
          background: linear-gradient(270deg, var(--red-dim), transparent);
        }
      `}} />

      <div className="boxing-page">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="boxing-hero">
          <div className="hero-spotlight" />
          <div className="hero-spotlight-2" />
          <div className="corner-post corner-post-tl" />
          <div className="corner-post corner-post-tr" />
          <div className="ring-rope" style={{ top: '25%' }} />
          <div className="ring-rope" style={{ top: '50%', opacity: 0.6 }} />
          <div className="ring-rope" style={{ top: '75%', opacity: 0.35 }} />

          {/* Animated impact rings */}
          <div style={{ position: 'absolute', top: '40%', left: '14%', width: 0, height: 0 }}>
            <div className="impact-ring impact-ring-1" />
            <div className="impact-ring impact-ring-2" />
            <div className="impact-ring impact-ring-3" />
          </div>
          <div style={{ position: 'absolute', top: '55%', right: '12%', width: 0, height: 0 }}>
            <div className="impact-ring impact-ring-1" style={{ animationDelay: '1.2s' }} />
            <div className="impact-ring impact-ring-2" style={{ animationDelay: '2.0s' }} />
          </div>

          <div className="hero-inner">
            <div>
              <span className="hero-eyebrow">Combat Sports Science</span>
            </div>

            <h1 className="hero-title">
              Boxing
              <span>Science</span>
            </h1>

            <p className="hero-sub">Biomechanics · Energy Systems · Neurology · Physiology</p>

            <p className="hero-desc">
              The peer-reviewed science behind punch mechanics, metabolic demand,
              brain injury risk, and elite athletic development in the world&apos;s oldest combat sport.
            </p>

            <div className="hero-tags">
              {['4.8 kN Peak Force', 'CTE Neuropathology', 'Glycolytic Dominance', 'Kinetic Chain', 'Fight Camp Periodization', 'Concussion Threshold'].map((tag) => (
                <span key={tag} className="hero-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Content ───────────────────────────────────────────────────── */}
        <main className="boxing-main">

          {/* ── Key Stats ──────────────────────────────────────────────────── */}
          <div>
            <div className="section-label">Key Metrics</div>
            <div className="stats-grid">
              {KEY_STATS.map((stat) => (
                <div key={stat.label} className="stat-cell">
                  <div className="stat-cell" style={{ padding: 0, background: 'none', position: 'static', border: 'none' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: stat.color }} />
                    <span className="stat-value" style={{ color: stat.color, textShadow: `0 0 30px ${stat.color}55` }}>
                      {stat.value}
                    </span>
                    <span className="stat-label">{stat.label}</span>
                    <span className="stat-sub">{stat.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Punch Force Comparison (SVG) ───────────────────────────────── */}
          <div>
            <div className="section-label">Force Comparison</div>
            <div className="force-chart-wrap">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Punch Force by Athlete Level</div>
                  <div className="chart-citation">Turner 2011 (J Sports Sci) — straight punch force measurement</div>
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#cc0000', fontWeight: 700, letterSpacing: '0.08em' }}>
                  MAX: 4.8 kN
                </div>
              </div>

              <div style={{ padding: '20px 20px 16px', overflowX: 'auto' }}>
                <svg
                  viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                  style={{ width: '100%', minWidth: 280, height: CHART_H, display: 'block' }}
                  aria-label="Punch force by athlete level"
                >
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4, 5].map((kn) => {
                    const x = CHART_PAD_L + (kn / MAX_FORCE) * CHART_PLOT_W
                    return (
                      <g key={kn}>
                        <line
                          x1={x} y1={CHART_PAD_T}
                          x2={x} y2={CHART_H - CHART_PAD_B}
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth={1}
                        />
                        <text
                          x={x}
                          y={CHART_H - 6}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.20)"
                          fontSize={9}
                          fontFamily="IBM Plex Mono, monospace"
                        >
                          {kn}kN
                        </text>
                      </g>
                    )
                  })}

                  {/* Danger zone marker at 4.8 kN */}
                  {(() => {
                    const x = CHART_PAD_L + (4.8 / MAX_FORCE) * CHART_PLOT_W
                    return (
                      <line
                        x1={x} y1={CHART_PAD_T}
                        x2={x} y2={CHART_H - CHART_PAD_B}
                        stroke="rgba(255,26,26,0.45)"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                      />
                    )
                  })()}

                  {/* Bars */}
                  {PUNCH_FORCE_DATA.map((row, i) => {
                    const y = CHART_PAD_T + i * CHART_PLOT_H
                    const bw = forceBarWidth(row.force)
                    const isElite = row.force >= 4.0
                    return (
                      <g key={row.label}>
                        {/* Row bg */}
                        <rect
                          x={0} y={y + 2}
                          width={CHART_W} height={CHART_PLOT_H - 4}
                          fill={isElite ? 'rgba(255,26,26,0.04)' : 'transparent'}
                        />

                        {/* Label */}
                        <text
                          x={CHART_PAD_L - 10}
                          y={y + CHART_PLOT_H / 2 - 4}
                          textAnchor="end"
                          fill={isElite ? '#ff2222' : '#666666'}
                          fontSize={11}
                          fontFamily="Barlow Condensed, sans-serif"
                          fontWeight={700}
                          letterSpacing="0.05em"
                        >
                          {row.label.toUpperCase()}
                        </text>
                        <text
                          x={CHART_PAD_L - 10}
                          y={y + CHART_PLOT_H / 2 + 10}
                          textAnchor="end"
                          fill="#333333"
                          fontSize={9}
                          fontFamily="IBM Plex Mono, monospace"
                        >
                          {row.desc}
                        </text>

                        {/* Bar track */}
                        <rect
                          x={CHART_PAD_L} y={y + CHART_PLOT_H / 2 - 8}
                          width={CHART_PLOT_W} height={16}
                          fill="rgba(255,255,255,0.03)"
                          rx={0}
                        />

                        {/* Bar fill */}
                        <defs>
                          <linearGradient id={`bar-grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={row.barColor} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={row.color} />
                          </linearGradient>
                        </defs>
                        <rect
                          x={CHART_PAD_L} y={y + CHART_PLOT_H / 2 - 8}
                          width={bw} height={16}
                          fill={`url(#bar-grad-${i})`}
                          rx={0}
                        />
                        {isElite && (
                          <rect
                            x={CHART_PAD_L} y={y + CHART_PLOT_H / 2 - 8}
                            width={bw} height={16}
                            fill="none"
                            stroke="rgba(255,26,26,0.3)"
                            strokeWidth={1}
                          />
                        )}

                        {/* Value label */}
                        <text
                          x={CHART_PAD_L + bw + 8}
                          y={y + CHART_PLOT_H / 2 + 4}
                          fill={isElite ? '#ff2222' : '#555555'}
                          fontSize={12}
                          fontFamily="Anton, sans-serif"
                          fontWeight={700}
                        >
                          {row.force} kN
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* ── Science Cards ───────────────────────────────────────────────── */}
          <div>
            <div className="section-label">Research Deep-Dive</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {SCIENCE_CARDS.map((card) => (
                <div key={card.id} className="science-card">
                  <div className="card-number" style={{ color: card.accent }}>{card.number}</div>
                  <div className="card-header" style={{ background: card.accentDim, borderBottom: `1px solid ${card.accentBorder}` }}>
                    <div className="card-accent-bar" style={{ background: card.accent }} />
                    <h2 className="card-title" style={{ color: card.accent }}>
                      {card.title}
                    </h2>
                  </div>
                  <div>
                    {card.findings.map((finding, fi) => (
                      <div
                        key={fi}
                        className="finding-row"
                        style={{ borderBottomColor: fi === card.findings.length - 1 ? 'transparent' : 'rgba(255,255,255,0.04)' }}
                      >
                        <div className="finding-stat-block">
                          <span className="finding-stat" style={{ color: card.accent }}>
                            {finding.stat}
                          </span>
                          <span className="finding-stat-label">{finding.statLabel}</span>
                        </div>
                        <div>
                          <span className="finding-citation" style={{ color: card.accent }}>
                            {finding.citation}
                          </span>
                          <p className="finding-detail">{finding.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Training Intensity Zones ─────────────────────────────────────── */}
          <div>
            <div className="section-label">Training Intensity Zones</div>
            <div className="zones-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Boxing Intensity Zone Reference</div>
                  <div className="chart-citation">Dunn 2016 (IJSPP) · Davis 2002 · reference max HR 190 bpm</div>
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#333', letterSpacing: '0.06em' }}>
                  Z4–Z5 = Competition
                </div>
              </div>
              <div>
                {TRAINING_ZONES.map((zone) => (
                  <div
                    key={zone.zone}
                    className="zone-row"
                    style={{
                      background: zone.highlight ? `rgba(255,26,26,0.04)` : 'transparent',
                    }}
                  >
                    <div
                      className="zone-badge"
                      style={{
                        color: zone.color,
                        borderColor: `${zone.color}44`,
                        background: `${zone.color}10`,
                      }}
                    >
                      {zone.zone}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="zone-name" style={{ color: zone.highlight ? zone.color : 'rgba(255,255,255,0.75)' }}>
                        {zone.name}
                        {zone.highlight && (
                          <span style={{
                            marginLeft: 8,
                            fontFamily: 'IBM Plex Mono, monospace',
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '0.10em',
                            color: zone.color,
                            background: `${zone.color}15`,
                            border: `1px solid ${zone.color}35`,
                            padding: '1px 6px',
                          }}>
                            FIGHT ZONE
                          </span>
                        )}
                      </div>
                      <div className="zone-desc">{zone.desc}</div>
                      <div className="zone-bar-track" style={{ marginTop: 8 }}>
                        <div
                          className="zone-bar-fill"
                          style={{
                            width: `${zone.barWidth}%`,
                            background: `linear-gradient(90deg, ${zone.color}66, ${zone.color})`,
                            boxShadow: zone.highlight ? `0 0 8px ${zone.color}55` : 'none',
                          }}
                        />
                      </div>
                    </div>
                    <div className="zone-bpm" style={{ color: zone.color }}>
                      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, marginBottom: 2 }}>{zone.pctRange}</div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#444' }}>{zone.bpmRange}</div>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '12px 20px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#2a2a2a', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  BPM values illustrative — scale to individual max heart rate
                </div>
              </div>
            </div>
          </div>

          {/* ── Brain Health Warning ─────────────────────────────────────────── */}
          <div className="warning-box">
            <div className="warning-icon">⚠</div>
            <div>
              <div className="warning-title">Brain Health Consideration</div>
              <p className="warning-text">
                McKee 2015 identified CTE neuropathology in 80% of deceased professional boxers. Cumulative
                subconcussive impacts during sparring — not just competition knockouts — appear to be the primary
                driver of chronic neurological injury. Amateur boxing with controlled, limited sparring carries
                substantially lower risk than professional careers. Headguards reduce lacerations but not concussion
                incidence. The safest training approaches limit hard sparring frequency and mandate adequate
                recovery time between sessions.
              </p>
            </div>
          </div>

          {/* ── Slash divider ────────────────────────────────────────────────── */}
          <div className="slash-divider">
            <div className="slash-line" />
            <span className="slash-glyph">///</span>
            <div className="slash-line-r" />
          </div>

          {/* ── Evidence Note ───────────────────────────────────────────────── */}
          <div className="footer-note">
            <strong style={{ color: '#333' }}>Evidence sources:</strong> Turner 2011 (J Sports Sci — punch force biomechanics);
            Lenetsky 2013 (J Strength Cond Res — kinetic energy transfer); Viano 2005 (Clin J Sport Med — glove mass &amp; acceleration);
            Walilko 2005 (Br J Sports Med — head movement force reduction); Davis 2002 (J Sci Med Sport — PCr/glycolytic energy share);
            Dunn 2016 (Int J Sports Physiol Perform — bout heart rate); Smith 2001 (J Sports Med Phys Fitness — kcal expenditure);
            Scott 2011 (J Sci Med Sport — EPOC); McKee 2015 (Brain — CTE neuropathology); Greenwald 2008 (Neurosurgery — concussion threshold);
            Heilbronner 2009 (Clin Neuropsychol — neuropsychological deficits); Zazryn 2003 (Br J Sports Med — headguard effectiveness);
            Khanna 2006 (Br J Sports Med — VO₂max elite boxers); Whiting 1988 (Am J Sports Med — fist velocity);
            Fogelholm 1993 (Int J Sport Nutr — weight cutting); Bompa 2009 (Periodization Theory — fight camp structure).
            This page is for educational purposes only. Always consult a qualified sports medicine physician and
            certified boxing coach for personalised training, safety, and clinical guidance.
          </div>

        </main>
      </div>
    </>
  )
}

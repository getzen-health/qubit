// Sailing Science — static server component
// Evidence-based sailing physiology covering hiking biomechanics, cardiovascular demands,
// tactical intelligence, and sailing-specific training science.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Sailing Science' }

// ─── Hiking Duration Chart Data ────────────────────────────────────────────────

const HIKING_DURATION = [
  { wind: '8 knots',  minutes: 15, pct: 33 },
  { wind: '12 knots', minutes: 28, pct: 62 },
  { wind: '16 knots', minutes: 38, pct: 84 },
  { wind: '20+ knots', minutes: 45, pct: 100 },
]

// ─── Science Cards ─────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'hiking',
    number: '01',
    title: 'Hiking Biomechanics & Core Demands',
    accent: '#0891b2',
    accentDim: 'rgba(8,145,178,0.12)',
    accentBorder: 'rgba(8,145,178,0.30)',
    icon: '⛵',
    findings: [
      {
        citation: 'Cunningham 2009 — J Sports Sci',
        stat: '40–70°',
        statLabel: 'Body angle over water',
        detail: 'Dinghy hiking mechanics require the sailor to suspend the body outboard at 40–70° from vertical, with feet locked under the hiking strap. The quadriceps sustain an isometric contraction at approximately 90° knee flexion, generating forces 2–3× body weight transmitted through the ankles and hiking strap. Core stabilisation is continuously active to control trunk angle against wave motion and wind variation. Olympic Laser and Finn class sailors sustain continuous hiking for 20–40 minutes per upwind leg without repositioning. Biomechanical analysis quantified ankle-strap contact forces and trunk stabilisation demands across the full wind range.',
      },
      {
        citation: 'Vogiatzis 2002 — Eur J Appl Physiol',
        stat: '1.5–2.0 W/kg',
        statLabel: 'Elite hiking ergometer power-to-weight',
        detail: 'Isokinetic quadriceps strength and endurance are the primary physiological predictors of dinghy sailing performance. Strength-to-weight ratio governs hiking efficiency — lighter sailors with proportionally greater quad strength maintain longer and more stable hiking angles in stronger winds. Training protocols validated in elite programmes include wall-sit endurance (target: 4–6 min continuous), leg-press endurance sets, and purpose-built hiking ergometers that replicate the exact joint angles and force vectors of on-water hiking.',
      },
      {
        citation: 'Biomechanics — 49er / Nacra 17',
        stat: 'Horizontal',
        statLabel: 'Trapeze body suspension',
        detail: 'Trapeze sailing (49er, 470, Nacra 17) demands whole-body horizontal suspension from a wire attached to the mast, with the sailor standing on the gunwale. Shoulder and arm loading is substantial as the sailor adjusts body angle and fore-aft position in response to boat speed and wave action. Hip flexor and abdominal demands are markedly higher than in conventional hiking. Wire tension and optimal body angle are continuously adjusted to maximise righting moment and boat speed across all points of sail.',
      },
      {
        citation: 'Rig Control Physiology — Windsurfing',
        stat: '200–400 N',
        statLabel: 'Sail sheeting forces in planing conditions',
        detail: 'Windsurfing rig control in planing conditions generates sail sheeting forces of 200–400 Newtons through the boom and harness. Grip and forearm endurance are primary fatigue sites, with extensor carpi radialis and flexor digitorum superficialis showing early electromyographic fatigue signatures in extended racing. At higher wind speeds (20+ knots), harness hook load transfers force to the trunk, reducing arm demand but increasing spinal loading. Rig-control forces scale with wind speed squared, making high-wind racing disproportionately demanding on the upper body.',
      },
    ],
  },
  {
    id: 'cardiovascular',
    number: '02',
    title: 'Cardiovascular & Physical Demands',
    accent: '#0ea5e9',
    accentDim: 'rgba(14,165,233,0.12)',
    accentBorder: 'rgba(14,165,233,0.30)',
    icon: '❤️',
    findings: [
      {
        citation: 'Castagna 2007 — Int J Sports Med',
        stat: '55–68 mL/kg/min',
        statLabel: 'VO₂max range for Olympic dinghy sailors',
        detail: 'Physiological profiling of Olympic dinghy sailors confirmed VO₂max values of 55–68 mL/kg/min — reflecting substantial aerobic capacity demands. Heart rate during upwind hiking work reaches 75–90% HRmax, and blood lactate accumulates to 3–6 mmol/L during extended hiking sequences at the upper wind range. Aerobic fitness enables sustained hiking power output across long upwind legs and supports cognitive function under physical fatigue — a critical interaction in tactical racing. Dinghy classes with more downwind sailing have lower average HR but higher peak demands during spinnaker manoeuvres.',
      },
      {
        citation: 'Offshore Racing — Keelboat Physiology',
        stat: '4–8 kg',
        statLabel: 'Crew ballast advantage in keelboats',
        detail: 'Crewed keelboat racing (Volvo Ocean Race, IMOCA 60s) confers a performance advantage on physically larger crew members who provide additional righting moment when hiking on deck. Strength demands for running rigging favour muscle mass and grip endurance. Grinding operations on large racing yachts impose cardiovascular demands of 60–75% VO₂max for 90-second grinding sequences, with peak HR of 85–95% HRmax. Teams rotate grinders to prevent premature fatigue during extended manoeuvres such as sail changes and tacks in heavy weather.',
      },
      {
        citation: 'Tactial Cognition — Sailing Science',
        stat: '60–80%',
        statLabel: 'Performance variance from tactical decisions',
        detail: 'Expert analysis consistently attributes 60–80% of race outcome variance to tactical and strategic decision-making — wind shift reading, current analysis, fleet positioning, and rule application — rather than physical performance alone. Sailing is frequently described as "chess on water." Physical fitness enables cognitive bandwidth by reducing the attentional cost of physical effort: a fatigued sailor invests more neural resources in hiking, leaving less capacity for tactical processing. This physiology-cognition interaction is a central rationale for sailing-specific fitness programmes.',
      },
      {
        citation: 'Cold Water Immersion — Thermal Physiology',
        stat: '<15 min',
        statLabel: 'Swimming failure without wetsuit at 10°C',
        detail: 'Capsize recovery in cold water triggers the cold shock response — involuntary hyperventilation, cardiovascular strain, and rapid loss of swimming ability. Swimming failure occurs within minutes at water temperatures below 15°C due to peripheral neuromuscular impairment. A 3mm wetsuit extends safe immersion from <15 minutes to 45–90 minutes at 10°C. Hypothermia timelines are critically temperature-dependent: unconsciousness can occur in 30–90 minutes at 10°C without thermal protection. Cold water immersion safety drills are mandatory in offshore racing qualification requirements.',
      },
    ],
  },
  {
    id: 'tactical',
    number: '03',
    title: 'Tactical Intelligence & Decision Science',
    accent: '#e8b84b',
    accentDim: 'rgba(232,184,75,0.10)',
    accentBorder: 'rgba(232,184,75,0.28)',
    icon: '🧠',
    findings: [
      {
        citation: 'VMG Analysis — Yacht Racing',
        stat: '2–3 lengths',
        statLabel: 'Gain from tacking on a 5° header',
        detail: 'Velocity made good (VMG) calculations demonstrate that tacking on a 5° wind header yields a 2–3 boat length gain per tack in a fleet of similar boats. Recognising headers and lifts from pressure bands, wave patterns, and cloud formations is a core tactical skill. Layline discipline determines final leg efficiency. In oscillating breeze, the frequency and amplitude of wind shifts determines optimal tacking angle — elite sailors internalise wind oscillation periods and phase relative to the course geometry.',
      },
      {
        citation: 'Start Line Physiology — Racing Rules',
        stat: '±1 s',
        statLabel: 'Required timing precision at the gun',
        detail: 'The pre-start sequence involves significant physiological stress, with cortisol elevation and HR elevation consistent with high-stakes competitive preparation. Line bias analysis (determining which end of the start line is advantaged by wind angle) is calculated in the minutes before the gun. Reaction to the start signal must be calibrated to within ±1 second — 0.2 seconds early results in disqualification under racing rules. Elite starters develop precise internal timing from thousands of practice starts, integrating countdown clocks, boat speed feedback, and fleet positioning simultaneously.',
      },
      {
        citation: 'Mark Rounding Analysis — Fleet Racing',
        stat: '15–30%',
        statLabel: 'Race positions changing at leeward mark',
        detail: 'Tactical concentration zones around marks account for 15–30% of all race position changes in Olympic-class fleet racing. The overlap rule (requiring boats to grant room to overlapping boats at the mark) and the zone (three boat lengths from the mark) create high-intensity decision windows. Physical demands of spinnaker hoists and drops during leeward mark roundings require coordination of multiple crew roles, with grip, core, and cardiovascular demands peaking during these brief manoeuvres.',
      },
      {
        citation: 'Expertise Research — Sailing Perception',
        stat: '3×',
        statLabel: 'Faster wind-data processing in elite sailors',
        detail: 'Expertise research in sailing demonstrates that elite sailors process wind pressure and direction data from surface observations approximately 3 times faster than novice sailors on equivalent recognition tests. This superiority emerges from years of deliberate on-water practice building perceptual-cognitive templates for local meteorological patterns, sea state signatures, and fleet dynamics. Simulator training and video analysis are validated supplements to on-water practice for developing pattern recognition — particularly valuable during winter training periods or for regattas in unfamiliar venues.',
      },
    ],
  },
  {
    id: 'training',
    number: '04',
    title: 'Training Science & Conditioning',
    accent: '#06b6d4',
    accentDim: 'rgba(6,182,212,0.12)',
    accentBorder: 'rgba(6,182,212,0.30)',
    icon: '🏋️',
    findings: [
      {
        citation: 'Laser Performance Research — Hiking Ergometer',
        stat: '1.5–2.0 W/kg',
        statLabel: 'Hiking power ratio target for elite Laser sailing',
        detail: 'Laser sailing performance research established hiking ergometer power-to-weight ratio as the strongest single predictor of competitive results. Training periodisation peaks strength development in early pre-season, transitions to hiking endurance specificity in late pre-season, and maintains hiking capacity at reduced volume during competition season. Deloading weeks prior to major regattas allow neuromuscular freshness without detraining of the specific quad endurance adaptations built across the training year.',
      },
      {
        citation: 'Injury Prevention — Dinghy Sailors',
        stat: '40%+',
        statLabel: 'Reduction in back injury with hip mobility work',
        detail: 'Prolonged hiking position progressively tightens the hip flexor complex (psoas major, iliacus, rectus femoris) over the course of a sailing season. Lower back injury — particularly lumbar facet irritation and disc loading — is the most common chronic injury in dinghy sailors and is strongly associated with hip flexor inflexibility and reduced lumbar mobility. Hip mobility exercises (90/90 stretching, dynamic leg swings, couch stretches) and yoga integration are standard in elite sailing conditioning programmes. Weekly hip mobility work reduces low back symptom incidence significantly across a racing season.',
      },
      {
        citation: 'Olympic Sailing Training Load Analysis',
        stat: '180–220 days',
        statLabel: 'On-water training days per year for medal contenders',
        detail: 'Training volume analysis of Olympic sailing medal contenders shows 180–220 on-water training days per year across a four-year Olympic cycle, supplemented by 3–5 land conditioning sessions per week. Regatta scheduling structures the annual plan into preparation and competition phases. The on-water to land conditioning split is approximately 55:45 in pre-season and 70:30 during the competitive season. Cross-training sports (cycling, rowing ergometer, swimming) maintain aerobic base during periods of limited water access.',
      },
      {
        citation: 'Offshore Nutrition — 24-Hour Racing',
        stat: '400–600 kcal/hr',
        statLabel: 'Energy demand in active offshore conditions',
        detail: 'Caloric requirements during active offshore racing reach 400–600 kcal per hour, driven by sustained physical effort, thermoregulatory demand in cold and wet conditions, and extended wakefulness during night watches. Freeze-dried food logistics govern energy provision on offshore passages — caloric density and preparation simplicity are primary selection criteria. Hydration in salt-spray environments is complicated by insensible fluid loss underestimation — sailors frequently arrive in port with significant dehydration despite believing they have drunk adequate fluid volume during the passage.',
      },
    ],
  },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '40–70°',       label: 'Hiking Body Angle',        sub: 'Sustained isometric quad hold at 90° flexion',      color: '#0891b2' },
  { value: '2–3×',         label: 'Body Weight Through Ankles', sub: 'Hiking strap forces — Cunningham 2009',           color: '#e8b84b' },
  { value: '68 mL/kg/min', label: 'Elite VO₂max',             sub: 'Olympic dinghy sailors — Castagna 2007',            color: '#06b6d4' },
  { value: '60–80%',       label: 'Tactical Decision %',      sub: 'Race outcome variance from strategy and tactics',   color: '#0ea5e9' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SailingSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');

        :root {
          --sail-ocean: #0a1f3a;
          --sail-white: #f5f9ff;
          --sail-gold: #e8b84b;
          --sail-teal: #0891b2;
          --sail-dark: #050f1e;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .sail-root {
          min-height: 100vh;
          background-color: var(--sail-dark);
          color: var(--sail-white);
          font-family: 'Source Sans Pro', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Deep ocean gradient overlay */
        .sail-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse at 20% 10%, rgba(8,145,178,0.07) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 90%, rgba(232,184,75,0.05) 0%, transparent 50%);
        }

        /* Subtle grain */
        .sail-root::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Header */
        .sail-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(5,15,30,0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(8,145,178,0.18);
          padding: 12px 24px;
        }

        .sail-header-inner {
          max-width: 920px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sail-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid rgba(8,145,178,0.25);
          background: rgba(8,145,178,0.06);
          color: rgba(245,249,255,0.55);
          text-decoration: none;
          flex-shrink: 0;
          transition: all 0.15s ease;
          border-radius: 4px;
        }

        .sail-back-btn:hover {
          border-color: var(--sail-teal);
          color: var(--sail-teal);
          background: rgba(8,145,178,0.12);
        }

        .sail-header-label {
          font-family: 'Source Sans Pro', sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--sail-teal);
        }

        .sail-header-title {
          font-family: 'Libre Baskerville', serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--sail-white);
          opacity: 0.88;
        }

        /* Page content */
        .sail-page {
          position: relative;
          z-index: 1;
          max-width: 920px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* Hero */
        .sail-hero {
          padding: 52px 0 44px;
          border-bottom: 1px solid rgba(8,145,178,0.12);
          margin-bottom: 48px;
        }

        .sail-hero-eyebrow {
          font-family: 'Source Sans Pro', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--sail-teal);
          margin-bottom: 16px;
        }

        .sail-hero-layout {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 32px;
        }

        .sail-hero-title {
          font-family: 'Libre Baskerville', serif;
          font-size: clamp(38px, 6vw, 68px);
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.01em;
          color: var(--sail-white);
          margin-bottom: 18px;
        }

        .sail-hero-title em {
          font-style: italic;
          color: var(--sail-gold);
        }

        .sail-hero-desc {
          font-size: 15px;
          font-weight: 300;
          line-height: 1.65;
          color: rgba(245,249,255,0.60);
          max-width: 520px;
        }

        .sail-hero-svg {
          flex-shrink: 0;
          opacity: 0.88;
        }

        /* Key stats */
        .sail-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(8,145,178,0.12);
          border: 1px solid rgba(8,145,178,0.14);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 56px;
        }

        .sail-stat-cell {
          background: rgba(5,15,30,0.85);
          padding: 20px 18px;
          text-align: center;
        }

        .sail-stat-value {
          font-family: 'Libre Baskerville', serif;
          font-size: 26px;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 6px;
        }

        .sail-stat-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: rgba(245,249,255,0.55);
          margin-bottom: 5px;
        }

        .sail-stat-sub {
          font-size: 10px;
          font-weight: 300;
          color: rgba(245,249,255,0.35);
          line-height: 1.4;
        }

        /* Section heading */
        .sail-section-heading {
          font-family: 'Source Sans Pro', sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--sail-teal);
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(8,145,178,0.15);
        }

        /* Chart section */
        .sail-chart-section {
          margin-bottom: 56px;
        }

        .sail-chart-title {
          font-family: 'Libre Baskerville', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--sail-white);
          margin-bottom: 6px;
        }

        .sail-chart-sub {
          font-size: 12px;
          font-weight: 300;
          color: rgba(245,249,255,0.45);
          margin-bottom: 24px;
        }

        .sail-chart-wrap {
          background: rgba(10,31,58,0.55);
          border: 1px solid rgba(8,145,178,0.16);
          border-radius: 10px;
          padding: 28px 28px 20px;
        }

        .sail-bar-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
        }

        .sail-bar-row:last-child { margin-bottom: 0; }

        .sail-bar-wind {
          font-size: 11px;
          font-weight: 600;
          color: rgba(245,249,255,0.60);
          width: 72px;
          flex-shrink: 0;
          text-align: right;
          letter-spacing: 0.02em;
        }

        .sail-bar-track {
          flex: 1;
          height: 28px;
          background: rgba(8,145,178,0.08);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .sail-bar-fill {
          height: 100%;
          border-radius: 4px;
          display: flex;
          align-items: center;
          padding-left: 10px;
          transition: width 0.3s ease;
        }

        .sail-bar-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(245,249,255,0.90);
          white-space: nowrap;
        }

        .sail-bar-minutes {
          font-size: 11px;
          font-weight: 600;
          color: rgba(245,249,255,0.45);
          width: 48px;
          flex-shrink: 0;
          text-align: right;
        }

        .sail-chart-note {
          font-size: 10px;
          font-weight: 300;
          color: rgba(245,249,255,0.30);
          margin-top: 14px;
          font-style: italic;
        }

        /* Science cards */
        .sail-cards-section {
          margin-bottom: 56px;
        }

        .sail-card {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(8,145,178,0.14);
          margin-bottom: 24px;
        }

        .sail-card:last-child { margin-bottom: 0; }

        .sail-card-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(8,145,178,0.10);
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(10,31,58,0.60);
        }

        .sail-card-number {
          font-family: 'Libre Baskerville', serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          opacity: 0.35;
          flex-shrink: 0;
        }

        .sail-card-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .sail-card-title {
          font-family: 'Libre Baskerville', serif;
          font-size: 17px;
          font-weight: 700;
          line-height: 1.2;
          color: var(--sail-white);
        }

        .sail-card-body {
          background: rgba(5,15,30,0.70);
        }

        .sail-finding {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(8,145,178,0.07);
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 20px;
          align-items: start;
        }

        .sail-finding:last-child { border-bottom: none; }

        .sail-finding-left {
          text-align: center;
          padding-top: 2px;
        }

        .sail-finding-stat {
          font-family: 'Libre Baskerville', serif;
          font-size: 22px;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .sail-finding-stat-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: rgba(245,249,255,0.45);
          line-height: 1.3;
        }

        .sail-finding-citation {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          margin-bottom: 6px;
          opacity: 0.70;
        }

        .sail-finding-detail {
          font-size: 13px;
          font-weight: 300;
          line-height: 1.65;
          color: rgba(245,249,255,0.65);
        }

        /* Footer */
        .sail-footer {
          padding-top: 32px;
          border-top: 1px solid rgba(8,145,178,0.12);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .sail-footer-text {
          font-size: 11px;
          font-weight: 300;
          color: rgba(245,249,255,0.28);
          line-height: 1.5;
        }

        .sail-footer-logo {
          font-family: 'Libre Baskerville', serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--sail-teal);
          letter-spacing: 0.04em;
          flex-shrink: 0;
        }

        /* Responsive */
        @media (max-width: 700px) {
          .sail-hero-layout { grid-template-columns: 1fr; }
          .sail-hero-svg { display: none; }
          .sail-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .sail-finding { grid-template-columns: 1fr; }
          .sail-finding-left { text-align: left; display: flex; align-items: baseline; gap: 12px; }
        }

        @media (max-width: 440px) {
          .sail-stats-grid { grid-template-columns: 1fr 1fr; }
          .sail-page { padding: 0 16px 60px; }
        }
      `}} />

      <div className="sail-root">

        {/* Header */}
        <header className="sail-header">
          <div className="sail-header-inner">
            <Link href="/dashboard" className="sail-back-btn" aria-label="Back to dashboard">
              <ArrowLeft size={14} />
            </Link>
            <div>
              <div className="sail-header-label">KQuarks Science</div>
              <div className="sail-header-title">Sailing Science</div>
            </div>
          </div>
        </header>

        <main className="sail-page">

          {/* Hero */}
          <section className="sail-hero">
            <div className="sail-hero-eyebrow">Sailing Physiology &amp; Tactics</div>
            <div className="sail-hero-layout">
              <div>
                <h1 className="sail-hero-title">
                  The Science of<br /><em>Sailing</em>
                </h1>
                <p className="sail-hero-desc">
                  Hiking biomechanics, cardiovascular demands, tactical decision science,
                  and evidence-based conditioning for dinghy and offshore racing — from Olympic
                  quad endurance to wind-shift pattern recognition.
                </p>
              </div>
              {/* Sailboat Hero SVG */}
              <svg
                className="sail-hero-svg"
                width="180"
                height="200"
                viewBox="0 0 180 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Wind lines */}
                <line x1="8" y1="40" x2="42" y2="40" stroke="#0891b2" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" opacity="0.5" />
                <line x1="4" y1="52" x2="32" y2="52" stroke="#0891b2" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" opacity="0.35" />
                <line x1="10" y1="64" x2="36" y2="64" stroke="#0891b2" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" opacity="0.25" />
                <line x1="148" y1="35" x2="174" y2="35" stroke="#0891b2" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" opacity="0.4" />
                <line x1="152" y1="47" x2="172" y2="47" stroke="#0891b2" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" opacity="0.25" />
                {/* Mast */}
                <line x1="90" y1="155" x2="90" y2="22" stroke="#e8b84b" strokeWidth="2.5" strokeLinecap="round" />
                {/* Main sail — filled triangle */}
                <path d="M90 26 L90 148 L52 130 Z" fill="rgba(232,184,75,0.18)" stroke="#e8b84b" strokeWidth="1.5" strokeLinejoin="round" />
                {/* Jib sail */}
                <path d="M90 38 L90 118 L124 128 Z" fill="rgba(245,249,255,0.10)" stroke="rgba(245,249,255,0.45)" strokeWidth="1.2" strokeLinejoin="round" />
                {/* Boom */}
                <line x1="90" y1="148" x2="54" y2="158" stroke="#e8b84b" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                {/* Hull */}
                <path d="M56 158 Q73 168 90 170 Q107 168 124 158 L118 162 Q104 175 90 176 Q76 175 62 162 Z" fill="rgba(8,145,178,0.30)" stroke="#0891b2" strokeWidth="1.5" strokeLinejoin="round" />
                {/* Waterline */}
                <path d="M48 172 Q90 178 132 172" stroke="rgba(8,145,178,0.45)" strokeWidth="2" strokeLinecap="round" fill="none" />
                {/* Wave suggestion */}
                <path d="M30 182 Q50 178 70 183 Q90 188 110 183 Q130 178 150 182" stroke="rgba(8,145,178,0.30)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M20 192 Q45 187 70 192 Q95 197 120 192 Q145 187 162 192" stroke="rgba(8,145,178,0.18)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                {/* Golden sunrise arc */}
                <path d="M40 170 Q90 140 140 170" stroke="rgba(232,184,75,0.12)" strokeWidth="30" strokeLinecap="round" fill="none" />
                <path d="M60 165 Q90 148 120 165" stroke="rgba(232,184,75,0.08)" strokeWidth="12" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          </section>

          {/* Key stats */}
          <div className="sail-stats-grid">
            {KEY_STATS.map((s) => (
              <div className="sail-stat-cell" key={s.label}>
                <div className="sail-stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="sail-stat-label">{s.label}</div>
                <div className="sail-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Hiking Duration Chart */}
          <section className="sail-chart-section">
            <div className="sail-section-heading">Performance Data</div>
            <div className="sail-chart-title">Hiking Duration by Wind Strength</div>
            <div className="sail-chart-sub">Continuous hiking endurance — Laser class dinghy, Olympic racing conditions</div>
            <div className="sail-chart-wrap">
              {HIKING_DURATION.map((row, i) => {
                const alpha = 0.45 + (i / (HIKING_DURATION.length - 1)) * 0.55
                const fillColor = `rgba(8,145,178,${alpha.toFixed(2)})`
                return (
                  <div className="sail-bar-row" key={row.wind}>
                    <div className="sail-bar-wind">{row.wind}</div>
                    <div className="sail-bar-track">
                      <div
                        className="sail-bar-fill"
                        style={{ width: `${row.pct}%`, background: fillColor }}
                      >
                        <span className="sail-bar-label">{row.minutes} min</span>
                      </div>
                    </div>
                    <div className="sail-bar-minutes">continuous</div>
                  </div>
                )
              })}
              <div className="sail-chart-note">
                Higher wind strength increases hiking intensity and duration capacity — up to a biomechanical ceiling at 20+ knots.
              </div>
            </div>
          </section>

          {/* Science Cards */}
          <section className="sail-cards-section">
            <div className="sail-section-heading">Research Findings</div>
            {SCIENCE_CARDS.map((card) => (
              <div className="sail-card" key={card.id} style={{ borderColor: card.accentBorder }}>
                <div className="sail-card-header" style={{ background: card.accentDim }}>
                  <span className="sail-card-number" style={{ color: card.accent }}>{card.number}</span>
                  <span className="sail-card-icon">{card.icon}</span>
                  <h2 className="sail-card-title">{card.title}</h2>
                </div>
                <div className="sail-card-body">
                  {card.findings.map((f, fi) => (
                    <div className="sail-finding" key={fi}>
                      <div className="sail-finding-left">
                        <div className="sail-finding-stat" style={{ color: card.accent }}>{f.stat}</div>
                        <div className="sail-finding-stat-label">{f.statLabel}</div>
                      </div>
                      <div>
                        <div className="sail-finding-citation" style={{ color: card.accent }}>{f.citation}</div>
                        <p className="sail-finding-detail">{f.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Footer */}
          <footer className="sail-footer">
            <p className="sail-footer-text">
              Science content is for educational purposes. Consult qualified coaches and medical
              professionals for individual guidance. Offshore sailing carries inherent risks — always
              follow appropriate safety protocols.
            </p>
            <div className="sail-footer-logo">KQuarks</div>
          </footer>

        </main>
      </div>
    </>
  )
}

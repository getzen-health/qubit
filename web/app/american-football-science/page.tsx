// American Football Science — static server component
// Evidence-based NFL physiology covering positional demands, CTE/concussion science,
// strength & power development, and energy systems.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'American Football Science' }

// ─── Position Speed Data (40-yard dash) ──────────────────────────────────────

const POSITION_SPEED = [
  { pos: 'WR / CB', time: 4.43, display: '4.43s', color: '#ff6b35', barPct: 100 },
  { pos: 'RB / DB', time: 4.50, display: '4.50s', color: '#f7931e', barPct: 97 },
  { pos: 'LB / TE', time: 4.65, display: '4.65s', color: '#c8a45e', barPct: 88 },
  { pos: 'QB / DE', time: 4.75, display: '4.75s', color: '#8b8b6e', barPct: 82 },
  { pos: 'DT', time: 5.05, display: '5.05s', color: '#666666', barPct: 68 },
  { pos: 'OL', time: 5.22, display: '5.22s', color: '#444444', barPct: 60 },
]

// ─── Energy System Contribution per Play ─────────────────────────────────────

const ENERGY_SYSTEMS = [
  { system: 'PCr (Phosphocreatine)', pct: 70, color: '#ff6b35', desc: 'Dominant 0–5 s of play' },
  { system: 'Glycolytic', pct: 20, color: '#f7931e', desc: '5–10 s, extended plays' },
  { system: 'Aerobic (play-clock recovery)', pct: 10, color: '#c8a45e', desc: '40 s between plays' },
]

// ─── Science Cards ─────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'positions',
    number: '01',
    title: 'Positional Demands & Physical Profiles',
    accent: '#ff6b35',
    icon: '🏈',
    findings: [
      {
        citation: 'Brechue 2010 — J Strength Cond Res',
        stat: '143 kg',
        statLabel: 'Average NFL lineman body mass',
        detail: 'NFL Combine data analysis across 6 years shows offensive linemen average 143 kg body mass with 40-yard dash times of 5.18–5.24 s; wide receivers and cornerbacks average 90 kg with 4.38–4.48 s sprint times. The physical profiles diverge completely by position: strength-power for linemen vs speed-power for skill positions. Bench press 225 lbs average reps: offensive linemen 35 reps; defensive backs 16 reps — over 2× the absolute strength difference despite similar training investment.',
      },
      {
        citation: 'Wellman 2016 — J Strength Cond Res',
        stat: '1.5–2.5 km',
        statLabel: 'GPS distance per game (skill positions)',
        detail: 'GPS tracking across 14 NFL games found wide receivers and cornerbacks cover 1.5–2.5 km per game at the following intensity distribution: 46% walking, 31% jogging, 18% running, 5% sprinting. Offensive and defensive linemen cover only 800–1,200 m but perform 40–60 collision events per game at 50–150 G impact force. Aerobic fitness predicts between-play recovery speed — players with higher VO₂max return to near-resting PCr faster in the 40-second play clock.',
      },
      {
        citation: 'Duthie 2003 (contact sport norms)',
        stat: '12–25',
        statLabel: 'Sprint efforts per game (skill positions)',
        detail: 'Skill position players perform 12–25 high-speed efforts (>5.5 m/s) per game, with individual efforts lasting 5–15 m (route-running) up to 20–80 m (breakaway). Acceleration from stationary to maximum speed occurs in 4–5 steps. Estimated peak power at first step for an elite wide receiver: 800–1,200 W — comparable to a 100m sprinter\'s drive phase. Route-running agility compounds the sprint demand: receivers typically execute 3–5 sharp cuts per route, each requiring deceleration-reacceleration cycles of 100–200 ms.',
      },
      {
        citation: 'Broglio 2010 — Neurosurg Focus',
        stat: '50–150 G',
        statLabel: 'Head acceleration per tackle',
        detail: 'Accelerometer-equipped helmets in 78 linemen across a full season recorded head impact accelerations of 50–150 G per tackle. Linemen receive 1,000–1,500 sub-concussive impacts (>10 G) per season — a cumulative exposure far exceeding that of skill positions. Linear acceleration alone does not fully characterise injury risk: rotational acceleration (rad/s²) drives diffuse axonal injury more than translational motion. Neck muscle strength reduces head angular acceleration 20–33% per kg of neck muscle mass — strengthening neck extensors, flexors and lateral flexors is the most cost-effective neuroprotective intervention available.',
      },
    ],
  },
  {
    id: 'cte',
    number: '02',
    title: 'CTE, Concussion & Brain Science',
    accent: '#ef4444',
    icon: '🧠',
    findings: [
      {
        citation: 'McKee 2023 — NEJM (BU CTE Center)',
        stat: '99%',
        statLabel: 'CTE in donated NFL brains',
        detail: 'Chronic traumatic encephalopathy (CTE) was identified in 110 of 111 donated post-mortem NFL player brains (99%) by the Boston University CTE Center. CTE is characterised by perivascular tau protein accumulation progressing from cortical sulci to hippocampus and subcortical structures, clinically manifesting as progressive cognitive decline, Parkinsonism, and impulse dysregulation typically 10–20 years post-career. Critical caveat: severe selection bias — symptomatic players are disproportionately likely to donate brains. Unbiased modelling estimates true CTE prevalence at 30–50% in players with full NFL careers.',
      },
      {
        citation: 'Bazarian 2014 — PLOS ONE',
        stat: '1,000+',
        statLabel: 'Sub-concussive hits per lineman per season',
        detail: 'Diffusion tensor MRI (DTI) showed measurable white matter axonal injury in linemen after a single season without any clinically diagnosed concussions. Sub-concussive impacts (below symptom threshold) accumulate structural brain damage detectable as fractional anisotropy reductions in the superior longitudinal fasciculus and corpus callosum. A lineman accumulating 1,000 sub-concussive hits per season for 10 seasons receives cumulative rotational acceleration exposure potentially exceeding 50 diagnosed concussions in terms of total axonal shear energy.',
      },
      {
        citation: 'McCrory 2023 — Br J Sports Med',
        stat: '6 days',
        statLabel: 'Minimum return-to-play after concussion',
        detail: 'The 6th International Consensus on Concussion in Sport established a minimum 6-day graduated return-to-play (GRTP) protocol following clinical concussion recovery: day 1 symptom-limited activity; day 2 light aerobic; day 3 sport-specific; day 4 non-contact drills; day 5 full-contact practice; day 6 return to competition. NFL protocol includes independent neurological consultant (INC) sideline evaluation since 2011. 2016 NFLPA survey finding: 53% of players reported teammates hiding concussion symptoms to remain on the field — culture change efforts are ongoing.',
      },
      {
        citation: 'Mihalik 2011 — Neurosurgery + NFL rule data',
        stat: '−60%',
        statLabel: 'Kickoff concussions after 2023 rule change',
        detail: 'The 2023 NFL kickoff rule redesign (players lined up stationary, reduced running start) cut kickoff concussions by approximately 60% vs the previous format — the single largest player safety improvement in league history. Independent biomechanical findings: neck strength training (targeting sternocleidomastoid, splenius, semispinalis) reduces head angular acceleration 20–33% per 1 kg additional neck muscle mass. Guardian Cap soft shell added to practice helmets from 2022 reduces linear impact G-force 10–12% at identical velocities.',
      },
    ],
  },
  {
    id: 'strength',
    number: '03',
    title: 'Strength, Power & Performance Science',
    accent: '#f7931e',
    icon: '💪',
    findings: [
      {
        citation: 'Cormie 2010 — Sports Med',
        stat: '<250 ms',
        statLabel: 'Rate-of-force-development window',
        detail: 'Rate of force development (RFD) within the first 250 ms of contraction predicts short sprint performance (10-yard dash) better than peak isometric force in football athletes. Olympic lifting derivatives — power clean, hang clean, push press — produce superior RFD adaptations compared to squat or bench alone because they demand ballistic intent and ground reaction force application. NFL Combine 10-yard dash time is best predicted (r=0.78) by a combination of hang power clean 1RM/body weight and countermovement vertical jump — both RFD-dominant measures.',
      },
      {
        citation: 'Sierer 2008 — J Strength Cond Res',
        stat: '225 kg',
        statLabel: 'NFL OL target back squat',
        detail: 'Position-optimised strength standards: NFL offensive linemen target squat ≥225 kg (495 lbs), bench press ≥136 kg (300 lbs), with acceptable body fat 23–28%. Skill positions (WR/CB/S) target squat ≥180 kg, vertical jump ≥85 cm (33 in), body fat <10%. The secular trend of NFL lineman size increase — from 114 kg average in 1980 to 143 kg in 2023 — reflects both strength demands (heavier players apply more blocking force) and financial incentives driven by free-agency-era performance contracts.',
      },
      {
        citation: 'Stacy 2009 — J Athl Train',
        stat: '38.5–40°C',
        statLabel: 'Core temp during camp sessions',
        detail: 'Training camp physiology (traditional 2-a-days, August): players lose 2–4 kg in the first week from fluid and glycogen depletion. Core temperature reaches 38.5–40°C during afternoon sessions in ambient heat. The 2011 NFL CBA eliminated 2-a-days (maximum 1 padded practice per day); however, heat illness risk peaks in the first 3 days of heat exposure regardless of training load, as heat acclimatisation requires 10–14 days of progressive exposure to achieve full cardiovascular, sudomotor, and electrolyte adaptations.',
      },
      {
        citation: 'Meir 2001 (rugby data applicable to football)',
        stat: '3–5%',
        statLabel: 'Sprint speed decline by Week 10',
        detail: 'Contact sport season fatigue modelling using rugby data (physiologically comparable to football for skill positions) shows cumulative sprint speed decline of 3–5% by midseason, driven by accumulated collagen microdamage, glycogen periodicity, and inflammatory burden from collision events. Recovery optimisation: 72 hours post-game for skill positions; 96 hours for linemen after high-collision games. Evidence-based recovery interventions: cold water immersion (CWI at 10–14°C, 10–15 min), sleep extension to ≥9 hours/night, and protein intake 2.2 g/kg/day to support muscle protein synthesis.',
      },
    ],
  },
  {
    id: 'energy',
    number: '04',
    title: 'Aerobic Fitness & Energy Systems',
    accent: '#c8a45e',
    icon: '❤️',
    findings: [
      {
        citation: 'Davis 2004 — J Strength Cond Res',
        stat: '52–60 mL/kg',
        statLabel: 'VO₂max (WR/CB)',
        detail: 'Position-stratified VO₂max data: wide receivers and cornerbacks 52–60 mL/kg/min; linebackers and safeties 50–58 mL/kg/min; offensive and defensive linemen 40–48 mL/kg/min. Aerobic fitness predicts between-play recovery speed in a dose-response relationship: each 5 mL/kg/min increase in VO₂max reduces PCr resynthesis time by approximately 8 seconds in the 40-second play clock — directly translating to maintained explosiveness in the 4th quarter. Linemen with VO₂max <42 mL/kg/min demonstrate measurable force output reduction by the 3rd quarter.',
      },
      {
        citation: 'Rhea 2008 — J Strength Cond Res',
        stat: '5.8 s',
        statLabel: 'Average NFL play duration',
        detail: 'Time-motion analysis of 632 NFL plays found average duration of 5.8 seconds (range 2–12 s). Energy contribution: phosphocreatine system provides 85–95% of energy for efforts <10 s, glycolytic pathways contribute 5–15%. Blood lactate measured immediately post-series: 4–8 mmol/L — moderate glycolytic contribution from accumulated efforts. The dominant PCr contribution means conditioning priority is repeat-sprint ability and between-play PCr replenishment rate, not sustained aerobic capacity — but aerobic fitness remains the biochemical engine that drives PCr recovery speed.',
      },
      {
        citation: 'Wells 2009 — J Sci Med Sport',
        stat: '8–12%',
        statLabel: '4th-quarter performance decline (RBs)',
        detail: 'Performance analysis of 4 NFL seasons shows running back yards-per-carry declines 8–12% in the 4th quarter vs. the 1st quarter; wide receiver drop rate increases 15–25% in the 4th quarter. Fatigue mechanisms: accumulated glycogen depletion (especially in high-snap-count positions), electrolyte imbalance (2–4% body mass fluid loss), and cognitive fatigue affecting route precision and decision speed. Teams investing in fitness monitoring and nutritional periodisation targeting 4th-quarter performance show statistically significant win-rate advantages in close games (≤7 points with <5 minutes remaining).',
      },
      {
        citation: 'McGill 2016 — J Strength Cond Res',
        stat: '12 weeks',
        statLabel: 'Standard NFL Combine prep duration',
        detail: '12-week NFL Combine preparation (for athletes with Combine invitations) is structured in 3 phases: weeks 1–6 (mechanics emphasis — 40-yard dash start position, arm drive, shin angle; power clean technique); weeks 7–12 (speed accumulation — resisted sprints, overspeed, reactive drills; vertical jump plyometrics). Bench press endurance (225 lbs max reps) programme runs in parallel. VO₂max is not tested at the Combine — but draft scouts correlate 4th-quarter performance in college film directly with aerobic capacity, and teams conduct private aerobic testing on prospects pre-draft.',
      },
    ],
  },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  { value: '99%', label: 'CTE in donated NFL brains', sub: 'McKee 2023 — 110 of 111 players', color: '#ef4444' },
  { value: '4.43s', label: 'Elite WR 40-yard dash', sub: 'Brechue 2010 — NFL Combine analysis', color: '#ff6b35' },
  { value: '150 G', label: 'Peak tackle head impact', sub: 'Broglio 2010 — accelerometer helmets', color: '#f7931e' },
  { value: '−60%', label: 'Kickoff concussions 2023', sub: 'NFL rule change impact (vs prior format)', color: '#c8a45e' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AmericanFootballSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        :root {
          --grid-black: #08060a;
          --grid-dark: #0e0b10;
          --grid-surface: #15121a;
          --grid-surface-2: #1c1822;
          --grid-border: #2a2535;
          --orange: #ff6b35;
          --orange-bright: #ff8c5a;
          --orange-dim: #c04a1e;
          --orange-glow: rgba(255,107,53,0.15);
          --amber: #f7931e;
          --amber-glow: rgba(247,147,30,0.15);
          --red: #ef4444;
          --red-glow: rgba(239,68,68,0.15);
          --tan: #c8a45e;
          --tan-glow: rgba(200,164,94,0.15);
          --chalk: #ede8e2;
          --chalk-dim: #8a8078;
          --chalk-faint: #3a3530;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .afl-root {
          min-height: 100vh;
          background-color: var(--grid-black);
          color: var(--chalk);
          font-family: 'Barlow Condensed', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Grain noise */
        .afl-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Yard-line pattern overlay */
        .afl-root::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 60px,
            rgba(255,107,53,0.03) 60px,
            rgba(255,107,53,0.03) 61px
          );
        }

        .afl-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(8,6,10,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--grid-border);
          padding: 12px 24px;
        }

        .afl-header-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .afl-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--grid-border);
          background: var(--grid-surface);
          color: var(--chalk-dim);
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .afl-back-btn:hover {
          border-color: var(--orange);
          color: var(--orange);
          background: rgba(255,107,53,0.08);
        }

        .afl-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--orange);
        }

        .afl-header-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--chalk);
        }

        .afl-main {
          position: relative;
          z-index: 2;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        .afl-hero {
          position: relative;
          padding: 64px 0 52px;
          text-align: center;
          overflow: hidden;
        }

        .afl-hero-glow {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 500px;
          background: radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.16) 0%, rgba(239,68,68,0.06) 40%, transparent 65%);
          pointer-events: none;
        }

        .afl-hero-tag {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--orange);
          background: rgba(255,107,53,0.07);
          border: 1px solid rgba(255,107,53,0.24);
          padding: 6px 18px;
          margin-bottom: 28px;
        }

        .afl-hero-h1 {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(64px, 13vw, 130px);
          font-weight: 700;
          line-height: 0.9;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 6px;
          text-shadow: 0 0 80px rgba(255,107,53,0.22);
        }

        .afl-hero-h1 .accent { color: var(--orange); display: block; text-shadow: 0 0 60px rgba(255,107,53,0.50); }

        .afl-hero-sub {
          font-size: clamp(13px, 2vw, 17px);
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          margin: 18px auto 36px;
          max-width: 520px;
        }

        .afl-hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .afl-hero-stat-num {
          font-family: 'Oswald', sans-serif;
          font-size: 44px;
          font-weight: 700;
          color: var(--orange);
          line-height: 1;
        }

        .afl-hero-stat-num .unit { font-size: 18px; color: var(--chalk-dim); margin-left: 3px; }

        .afl-hero-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          margin-top: 4px;
        }

        .afl-hero-divider { width: 1px; height: 40px; background: var(--grid-border); }

        .afl-key-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 40px;
        }

        @media (min-width: 600px) { .afl-key-stats { grid-template-columns: repeat(4, 1fr); } }

        .afl-stat-card {
          background: var(--grid-surface);
          border: 1px solid var(--grid-border);
          padding: 16px 14px;
          position: relative;
          overflow: hidden;
        }

        .afl-stat-val {
          font-family: 'Oswald', sans-serif;
          font-size: 30px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 4px;
        }

        .afl-stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          margin-bottom: 4px;
        }

        .afl-stat-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--chalk-faint);
          letter-spacing: 0.04em;
          line-height: 1.5;
        }

        /* Position speed chart */
        .afl-chart {
          background: var(--grid-surface);
          border: 1px solid var(--grid-border);
          padding: 24px;
          margin-bottom: 40px;
        }

        .afl-chart-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--orange);
          margin-bottom: 6px;
        }

        .afl-chart-sub {
          font-size: 12px;
          color: var(--chalk-faint);
          margin-bottom: 20px;
        }

        .afl-chart-rows {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .afl-chart-row {
          display: grid;
          grid-template-columns: 90px 1fr 60px;
          align-items: center;
          gap: 12px;
        }

        .afl-chart-pos {
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .afl-chart-track {
          height: 22px;
          background: rgba(255,255,255,0.04);
          position: relative;
          overflow: hidden;
        }

        .afl-chart-fill {
          height: 100%;
          position: absolute;
          left: 0; top: 0;
          opacity: 0.8;
        }

        .afl-chart-val {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          text-align: right;
        }

        /* Science cards */
        .afl-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }

        .afl-card {
          background: var(--grid-surface);
          border: 1px solid var(--grid-border);
          padding: 28px 24px;
          position: relative;
          overflow: hidden;
        }

        .afl-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 3px;
          height: 100%;
        }

        .afl-card-number {
          font-family: 'Oswald', sans-serif;
          font-size: 72px;
          font-weight: 700;
          line-height: 1;
          position: absolute;
          top: 18px;
          right: 22px;
          opacity: 0.06;
          letter-spacing: -0.02em;
        }

        .afl-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .afl-card-title {
          font-family: 'Oswald', sans-serif;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--chalk);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .afl-findings {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .afl-finding {
          display: flex;
          gap: 14px;
          padding: 13px;
          background: rgba(255,255,255,0.025);
          border-left: 2px solid rgba(255,255,255,0.06);
        }

        .afl-finding:hover { background: rgba(255,255,255,0.04); }

        .afl-finding-stat { flex-shrink: 0; min-width: 88px; }

        .afl-finding-stat-val {
          font-family: 'Oswald', sans-serif;
          font-size: 22px;
          font-weight: 700;
          line-height: 1;
        }

        .afl-finding-stat-lbl {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--chalk-faint);
          letter-spacing: 0.04em;
          margin-top: 2px;
          line-height: 1.4;
        }

        .afl-finding-body { flex: 1; min-width: 0; }

        .afl-finding-citation {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--chalk-faint);
          margin-bottom: 5px;
        }

        .afl-finding-detail {
          font-size: 14px;
          font-weight: 400;
          color: rgba(237,232,226,0.72);
          line-height: 1.55;
        }

        /* Energy systems */
        .afl-energy {
          background: var(--grid-surface);
          border: 1px solid var(--grid-border);
          padding: 24px;
          margin-bottom: 40px;
        }

        .afl-energy-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--orange);
          margin-bottom: 6px;
        }

        .afl-energy-sub {
          font-size: 12px;
          color: var(--chalk-faint);
          margin-bottom: 20px;
        }

        .afl-energy-rows { display: flex; flex-direction: column; gap: 12px; }

        .afl-energy-row { display: grid; grid-template-columns: 200px 1fr 36px; align-items: center; gap: 12px; }

        .afl-energy-label { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

        .afl-energy-track { height: 18px; background: rgba(255,255,255,0.04); position: relative; overflow: hidden; }

        .afl-energy-fill { height: 100%; position: absolute; left: 0; top: 0; opacity: 0.8; }

        .afl-energy-pct { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700; text-align: right; }

        .afl-disclaimer {
          margin-top: 40px;
          padding: 18px 22px;
          background: var(--grid-surface);
          border: 1px solid var(--grid-border);
          border-left: 3px solid var(--chalk-faint);
        }

        .afl-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--chalk-dim);
          line-height: 1.75;
          letter-spacing: 0.04em;
        }

        @media (max-width: 640px) {
          .afl-hero-h1 { font-size: 56px; }
          .afl-card { padding: 22px 18px; }
          .afl-finding { flex-direction: column; gap: 8px; }
          .afl-chart-row { grid-template-columns: 70px 1fr 48px; }
          .afl-energy-row { grid-template-columns: 140px 1fr 32px; }
        }
      `}} />

      <div className="afl-root">
        {/* Header */}
        <header className="afl-header">
          <div className="afl-header-inner">
            <Link href="/workouts" className="afl-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="afl-header-label">Sports Science Series</div>
              <div className="afl-header-title">American Football Science</div>
            </div>
          </div>
        </header>

        <main className="afl-main">
          {/* Hero */}
          <section className="afl-hero">
            <div className="afl-hero-glow" />
            <div className="afl-hero-tag">NFL · Power · Speed · Brain Science</div>
            <h1 className="afl-hero-h1">
              AMERICAN
              <span className="accent">FOOTBALL</span>
            </h1>
            <p className="afl-hero-sub">
              The physics of collision, the neuroscience of impact, the physiology of the gridiron.
            </p>
            <div className="afl-hero-stats">
              <div>
                <div className="afl-hero-stat-num">4.43<span className="unit">s</span></div>
                <div className="afl-hero-stat-label">Elite WR 40-Yard Dash</div>
              </div>
              <div className="afl-hero-divider" />
              <div>
                <div className="afl-hero-stat-num">150<span className="unit">G</span></div>
                <div className="afl-hero-stat-label">Peak Tackle Impact</div>
              </div>
              <div className="afl-hero-divider" />
              <div>
                <div className="afl-hero-stat-num">1,000<span className="unit">+</span></div>
                <div className="afl-hero-stat-label">Sub-concussive hits/season</div>
              </div>
            </div>
          </section>

          {/* Key stats */}
          <div className="afl-key-stats">
            {KEY_STATS.map(s => (
              <div key={s.label} className="afl-stat-card">
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:s.color}} />
                <div className="afl-stat-val" style={{color:s.color}}>{s.value}</div>
                <div className="afl-stat-label">{s.label}</div>
                <div className="afl-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Position speed chart */}
          <div className="afl-chart">
            <div className="afl-chart-title">40-Yard Dash by Position — NFL Combine (Brechue 2010)</div>
            <div className="afl-chart-sub">Faster time = elite speed. OL vs WR gap: ~0.8 s — reflects divergent role demands</div>
            <div className="afl-chart-rows">
              {POSITION_SPEED.map(p => (
                <div key={p.pos} className="afl-chart-row">
                  <div className="afl-chart-pos" style={{color:p.color}}>{p.pos}</div>
                  <div className="afl-chart-track">
                    <div className="afl-chart-fill" style={{width:`${p.barPct}%`,background:p.color}} />
                  </div>
                  <div className="afl-chart-val" style={{color:p.color}}>{p.display}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Science cards */}
          <div className="afl-cards">
            {SCIENCE_CARDS.map(card => (
              <div key={card.id} className="afl-card">
                <div style={{position:'absolute',top:0,left:0,width:'3px',height:'100%',background:card.accent}} />
                <div className="afl-card-number">{card.number}</div>
                <div className="afl-card-kicker" style={{color:card.accent}}>{card.icon} Science Card {card.number}</div>
                <div className="afl-card-title">{card.title}</div>
                <div className="afl-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="afl-finding">
                      <div className="afl-finding-stat">
                        <div className="afl-finding-stat-val" style={{color:card.accent}}>{f.stat}</div>
                        <div className="afl-finding-stat-lbl">{f.statLabel}</div>
                      </div>
                      <div className="afl-finding-body">
                        <div className="afl-finding-citation">{f.citation}</div>
                        <div className="afl-finding-detail">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Energy systems chart */}
          <div className="afl-energy">
            <div className="afl-energy-title">Energy System Contribution Per Play — Rhea 2008</div>
            <div className="afl-energy-sub">Average play duration 5.8 s — PCr dominant; aerobic system drives between-play recovery</div>
            <div className="afl-energy-rows">
              {ENERGY_SYSTEMS.map(e => (
                <div key={e.system} className="afl-energy-row">
                  <div className="afl-energy-label" style={{color:e.color}}>{e.system}</div>
                  <div className="afl-energy-track">
                    <div className="afl-energy-fill" style={{width:`${e.pct}%`,background:e.color}} />
                  </div>
                  <div className="afl-energy-pct" style={{color:e.color}}>{e.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="afl-disclaimer">
            <div className="afl-disclaimer-text">
              CTE prevalence data reflects donated brain studies with significant selection bias; true population prevalence is lower. All performance data reflects NFL/college combine populations. Individual athlete profiles vary significantly by position, training age, and genetics. Head impact data is for educational awareness — contact your team medical staff for personalised injury prevention protocols.
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

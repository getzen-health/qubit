// Track & Field Science — server component
// Sprint biomechanics, energy systems by event, field events, and elite development.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

// ─── Hero Stats ───────────────────────────────────────────────────────────────

const HERO_STATS = [
  { label: 'Ground Contact', value: '≤80ms', sub: 'elite sprint (Haugen 2019)', color: '#ff4d00' },
  { label: 'Type II Fibers', value: '60–80%', sub: 'sprinter muscle composition (Mero 1983)', color: '#ff8c00' },
  { label: 'Reaction Time', value: '0.100s', sub: 'minimum legal start (Pain 2011)', color: '#ffb800' },
  { label: 'H-Force Angle', value: '40–45°', sub: 'optimal push direction (Morin 2011)', color: '#ff4d00' },
]

// ─── World Records ────────────────────────────────────────────────────────────

const WORLD_RECORDS = [
  { event: '100m', wr: '9.58s', holder: 'Bolt 2009', speed: '10.44 m/s', color: '#ff2200' },
  { event: '200m', wr: '19.19s', holder: 'Bolt 2009', speed: '10.42 m/s', color: '#ff4400' },
  { event: '400m', wr: '43.03s', holder: 'Warholm 2021', speed: '9.30 m/s', color: '#ff6600' },
  { event: '800m', wr: '1:40.91', holder: 'Rudisha 2012', speed: '7.91 m/s', color: '#ff8800' },
  { event: '1500m', wr: '3:26.00', holder: 'Ingebrigtsen 2023', speed: '7.27 m/s', color: '#ffaa00' },
  { event: '5000m', wr: '12:35.36', holder: 'Cheptegei 2020', speed: '6.62 m/s', color: '#ffcc00' },
  { event: 'Marathon', wr: '2:00:35', holder: 'Kipchoge 2023', speed: '5.88 m/s', color: '#ffe066' },
]

// ─── Energy System Chart Data ─────────────────────────────────────────────────

const ENERGY_EVENTS = [
  {
    event: '100m',
    pcr: 100, glycolytic: 0, oxidative: 0,
    lactate: '< 4',
    note: '100% anaerobic PCr system — Jones & Carter 2000',
    color: '#ff2200',
  },
  {
    event: '200m',
    pcr: 70, glycolytic: 28, oxidative: 2,
    lactate: '6–10',
    note: 'PCr dominant, glycolytic rapidly recruited',
    color: '#ff4400',
  },
  {
    event: '400m',
    pcr: 30, glycolytic: 50, oxidative: 20,
    lactate: '14–22',
    note: '60% anaerobic; peak blood lactate 14–22 mmol/L — Hirvonen 1987',
    color: '#ff6600',
  },
  {
    event: '800m',
    pcr: 5, glycolytic: 45, oxidative: 50,
    lactate: '12–18',
    note: '50/50 aerobic-anaerobic split — Spencer & Gastin 2001',
    color: '#ff8800',
  },
  {
    event: '1500m',
    pcr: 2, glycolytic: 25, oxidative: 73,
    lactate: '10–15',
    note: '73% aerobic, significant glycolytic reserve',
    color: '#ffaa00',
  },
  {
    event: '5000m',
    pcr: 1, glycolytic: 5, oxidative: 94,
    lactate: '6–10',
    note: 'Run at 95–98% VO₂max — Lacour 1991',
    color: '#ffcc00',
  },
  {
    event: 'Marathon',
    pcr: 0, glycolytic: 2, oxidative: 98,
    lactate: '2–4',
    note: 'Almost entirely oxidative — fat & glycogen',
    color: '#ffe066',
  },
]

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'biomechanics',
    title: 'Sprint Biomechanics',
    accentColor: '#ff3300',
    accentBg: 'rgba(255,51,0,0.07)',
    accentBorder: 'rgba(255,51,0,0.25)',
    accentPill: 'rgba(255,51,0,0.15)',
    label: 'PHASE 01',
    findings: [
      {
        citation: 'Haugen 2019 — International Journal of Sports Physiology & Performance',
        detail:
          'Ground contact time is the master variable of sprint performance. Elite 100m sprinters achieve ground contact times ≤80 ms during the maximum velocity phase — compared to ≥160 ms in recreational runners. This halving of contact time is achieved through neuromuscular pre-activation: the lower limb muscles (particularly gastrocnemius, soleus, and tibialis anterior) begin contracting 50–80 ms before foot strike, converting the leg into a spring-loaded strut. The shorter the contact, the less energy is lost to braking forces. Haugen\'s GPS + force plate data across 850+ sprint trials shows contact time explains 71% of the variance in maximum velocity, more than stride frequency or length alone.',
      },
      {
        citation: 'Morin 2011 — Journal of Biomechanics',
        detail:
          'Horizontal force application is the defining mechanical determinant of sprint acceleration. Morin\'s analysis of force plate data revealed that elite sprinters apply force at 40–45° below horizontal during acceleration — maximising the propulsive component. The "Force-Velocity-Power Profile" framework shows that world-class sprinters are differentiated not by peak force magnitude but by the direction of force application. A 5% improvement in horizontal force ratio (from 0.35 to 0.368) produces measurable performance gains across all sprint distances. This shifted training philosophy from vertical jump strength to sled sprint and resisted sprint protocols that replicate the 40–45° push angle.',
      },
      {
        citation: 'Pain 2011 — Journal of Sports Sciences',
        detail:
          'Legal reaction time in track sprinting must exceed 100 ms (0.100 s) per IAAF rules — the minimum human auditory-motor response time. Pain\'s analysis of 5,000+ sprint starts from World Championship events found the mean elite reaction time is 0.135–0.145 s for men and 0.150–0.165 s for women. Reaction time follows a U-shaped relationship with false starts: athletes who anticipate too early exceed the 100 ms floor; those who respond too slowly lose 3–5 m by the 10m mark. Block clearance velocity (not reaction time per se) is the strongest predictor of 60m performance — block angle, push force, and leg drive all contribute independently.',
      },
      {
        citation: 'Mero 1983 — European Journal of Applied Physiology',
        detail:
          'Skeletal muscle fiber type is the fundamental biological constraint on sprint potential. Elite sprinters have 60–80% Type II (fast-twitch) fibers in the vastus lateralis, compared to 25–40% in untrained adults and ≤20% in elite marathon runners. Type IIx fibers contract 4–5× faster than Type I with 3× greater peak power output per unit cross-section. Mero\'s needle biopsy studies showed a strong dose-response: each 10% increase in Type II fiber proportion corresponds to ~0.08 s faster 100m time. Critically, training can shift IIx toward IIa (more fatigue-resistant fast fibers), but cannot convert Type I to Type II — fiber type is >95% genetically determined.',
      },
    ],
  },
  {
    id: 'energy',
    title: 'Energy Systems by Event',
    accentColor: '#ff8800',
    accentBg: 'rgba(255,136,0,0.07)',
    accentBorder: 'rgba(255,136,0,0.25)',
    accentPill: 'rgba(255,136,0,0.15)',
    label: 'PHASE 02',
    findings: [
      {
        citation: 'Jones & Carter 2000 — Sports Medicine (Review)',
        detail:
          'The 100m sprint runs entirely on phosphocreatine (PCr) — the only energy system fast enough to match the ATP turnover rate required at 10+ m/s. PCr stores are exhausted in 6–10 seconds and require 3–5 minutes for complete resynthesis (95%). Jones & Carter\'s review confirms that by the 90m mark, falling PCr concentration is the primary cause of velocity decrement in even elite sprinters — not lactate accumulation, which barely rises during a 10s event. This is why 100m specialists train with long rest intervals (8–12 minutes between maximal sprints) to allow near-complete PCr recovery, preserving the neural and phosphate system quality of each rep.',
      },
      {
        citation: 'Hirvonen 1987 — International Journal of Sports Medicine',
        detail:
          'The 400m is physiologically unique: it demands maximal effort over 43–50 seconds (elite-to-recreational), which falls in the "valley of metabolic misery" — too long for PCr to sustain, too short for oxidative phosphorylation to contribute meaningfully. Hirvonen\'s muscle biopsy and blood lactate data showed blood lactate peaks at 14–22 mmol/L after 400m — the highest of any track event. The energy split is approximately 60% anaerobic (PCr + glycolytic) and 40% aerobic. The cardinal tactical error is running the first 200m too fast: a 0.5 s differential between first and second 200m halves produces significantly lower total time than even-split or negative-split strategies due to the quadratic relationship between glycolytic rate and lactate production.',
      },
      {
        citation: 'Spencer & Gastin 2001 — Journal of Sports Sciences',
        detail:
          'The 800m occupies the exact boundary between speed-endurance and pure endurance — a 50/50 aerobic-anaerobic split confirmed by Spencer & Gastin\'s breath-by-breath VO₂ measurement and accumulated oxygen deficit methodology. This unique metabolic duality requires double specialisation: 800m champions need VO₂max values comparable to 1500m runners AND anaerobic speed comparable to 400m runners. Training must simultaneously develop glycolytic capacity (short hill reps, 200m intervals at 400m pace) and aerobic ceiling (tempo runs, easy mileage). The critical speed concept (Monod & Scherrer framework) defines the exact boundary between finite and indefinite exercise — elite 800m runners operate 8–12% above their critical speed for the full race duration.',
      },
      {
        citation: 'Lacour 1991 — European Journal of Applied Physiology',
        detail:
          '5000m is run at 95–98% of VO₂max in elite athletes — the highest fractional utilisation of any running event longer than 1500m. Lacour\'s treadmill-to-track comparative methodology showed that at 12:35 pace (the current WR), oxygen uptake runs at ~98% VO₂max for the full 12+ minutes. This is possible because elite East African runners also have exceptionally high lactate threshold velocities (>88% of vVO₂max), meaning they can sustain near-maximal oxygen consumption without catastrophic lactate accumulation. Running economy (oxygen cost per unit velocity) is the differentiating variable among athletes with similar VO₂max values — explaining why smaller, lighter athletes from altitude-born populations disproportionately dominate at 5000m and 10000m.',
      },
    ],
  },
  {
    id: 'field',
    title: 'Field Events: Throws & Jumps',
    accentColor: '#ffcc00',
    accentBg: 'rgba(255,204,0,0.07)',
    accentBorder: 'rgba(255,204,0,0.25)',
    accentPill: 'rgba(255,204,0,0.15)',
    label: 'PHASE 03',
    findings: [
      {
        citation: 'Gregor 1988 — International Journal of Sport Biomechanics',
        detail:
          'Elite javelin throwers release the implement at 28–30 m/s, achieved through a proximal-to-distal sequential kinetic chain: hip rotation initiates torque, transmitted through the trunk to the shoulder, elbow, and finally wrist and fingers. Gregor\'s high-speed cinematography (300 fps) analysis showed the shoulder reaches peak angular velocity of 1,200–1,500°/s at release. The optimal release angle is 29–34° above horizontal (not 45° as projectile physics would suggest) because the javelin generates aerodynamic lift during flight — the actual optimal varies with wind conditions and thrower speed. Attack angle (angle between javelin axis and velocity vector) must be <10° to avoid stall-drag penalties.',
      },
      {
        citation: 'Dapena 1988 — Journal of Biomechanics',
        detail:
          'The Fosbury Flop revolutionised high jump through a counterintuitive principle: the athlete\'s centre of gravity (CG) can pass below the bar while the body clears it. Dapena\'s kinematic analysis showed that elite floppers bend their body into an arch so extreme that at peak height, the CG is 10–20 cm below the bar — a physical impossibility with the straddle technique. Run-up speed (7.5–8.5 m/s) and penultimate step lowering are the two critical performance determinants. The curved approach converts linear momentum into angular momentum (400–550°/s bar rotation), which combined with active plant-and-jump mechanics, produces vertical velocity of 3.8–4.5 m/s at takeoff in world-class jumpers.',
      },
      {
        citation: 'Hay 1993 — Journal of Biomechanics (Review)',
        detail:
          'Long jump mechanics decompose into approach, takeoff, flight, and landing phases — each with distinct optimisation targets. Hay\'s comprehensive kinematic database of international competitions identified horizontal velocity at board contact as the single largest predictor of jump distance (r=0.97). Elite athletes achieve 10.8–11.1 m/s at the board, losing only 0.3–0.6 m/s from the preceding stride due to board compliance and angular impulse generation. Takeoff angle of 18–24° (not the theoretically optimal 45°) minimises velocity loss while generating sufficient vertical displacement for the ~1.0 second flight time. In flight, the hitch-kick technique (2.5 rotations) prevents forward rotation and allows optimum landing position — adding 15–25 cm over a sail technique.',
      },
      {
        citation: 'Young 2004 — Journal of Strength and Conditioning Research',
        detail:
          'Shot put rotational technique requires hip angular velocities of 470–550°/s during the power phase — faster than nearly any other athletic motion. Young\'s 3D motion capture analysis of elite rotational putters showed the kinetic energy generated by hip rotation is transferred to the implement through a brief "blocking" of the left side (for right-handed throwers), creating an elastic energy transfer from legs through trunk to arm. The difference between elite glide and rotational technique is primarily approach velocity: rotation generates 0.8–1.2 m/s higher release velocity, translating to 3–4 m additional distance at world-class level. Implement release angle optimum is 36–38° — lower than the 45° projectile physics optimum due to implement aerodynamics and athlete-specific biomechanics.',
      },
    ],
  },
  {
    id: 'training',
    title: 'Training & Elite Development',
    accentColor: '#22ddaa',
    accentBg: 'rgba(34,221,170,0.07)',
    accentBorder: 'rgba(34,221,170,0.25)',
    accentPill: 'rgba(34,221,170,0.15)',
    label: 'PHASE 04',
    findings: [
      {
        citation: 'Pfaff 2015 — IAAF New Studies in Athletics',
        detail:
          'Dave Pfaff\'s 4-phase annual periodization model — used with multiple Olympic champions — divides the training year into General Preparation (aerobic base, general strength, high volume/low intensity), Special Preparation (event-specific conditioning, strength peaking, reduced volume), Pre-Competition (race-specific intensities, technical sharpening, tapering volume by 30–50%), and Competition (maintenance of peak condition, recovery emphasis, 8–12 day competition cycles). The key principle is undulating intensity: within each phase, hard-easy-hard-easy weekly sequencing prevents CNS fatigue accumulation. Peak performance windows are predictable 8–12 weeks after the transition from Special Preparation to Pre-Competition — validated across Pfaff\'s work with sprinters, hurdlers, and jumpers at multiple Olympic cycles.',
      },
      {
        citation: 'Daniels & Oldridge 1970 — Medicine & Science in Sports',
        detail:
          'Altitude training (2000–2500 m) elevates VO₂max and running economy through three concurrent mechanisms: erythropoietin (EPO) upregulation increases red blood cell mass 5–8% over 4–6 weeks; hypoxic training stress drives mitochondrial biogenesis; and post-altitude return to sea level produces a 2–4% performance window lasting 2–3 weeks before erythrocyte count normalises. Daniels & Oldridge\'s original "live high, train high" data showed VO₂max gains of 4–8% in elite distance runners after 3-week altitude camps. The "live high, train low" model (sleep at 2500 m, train at sea level) emerged as superior for sprint athletes — preserving training speed/quality while capturing haematological gains.',
      },
      {
        citation: 'Siff 2003 — Supertraining (6th ed.)',
        detail:
          'Central nervous system (CNS) recovery from maximal sprint and power training takes 48–72 hours — substantially longer than the 24h recovery from aerobic or moderate resistance training. Siff\'s neuromuscular fatigue framework explains why elite sprinters train at maximal intensity no more than 2–3 times per week: each maximal session depletes neural drive, reduces motor unit synchronisation, and temporarily impairs inter-muscular coordination for 36–72 hours. Training at submaximal intensities during the CNS recovery window is not only safe but productive — it consolidates motor patterns without creating additional neural debt. Resting heart rate elevation >5 bpm above baseline is a reliable field indicator of incomplete CNS recovery.',
      },
      {
        citation: 'Balyi 2004 — Long-Term Athlete Development (Canadian Sport for Life)',
        detail:
          'Balyi\'s 10-year LTAD model defines stage-specific training priorities across the athlete lifecycle: FUNdamentals (6–9), Learning to Train (9–12), Training to Train (12–16), Training to Compete (16–18), Training to Win (18+), and Active for Life. The critical insight is that volume and technical drilling in the 9–12 window (when neuromuscular coordination plasticity is maximal) permanently determines the technical ceiling of adult performance. Track & field specific application: this window is optimal for speed, agility, and movement literacy acquisition. Premature event specialisation before age 14 correlates with burnout and injuries; multi-event training through the FUNdamentals and Learning to Train stages produces superior adult track specialists versus early single-event focus.',
      },
    ],
  },
]

// ─── SVG Chart Helpers ────────────────────────────────────────────────────────

const CHART_W = 560
const CHART_H = 200
const BAR_H = 22
const BAR_GAP = 6
const LABEL_W = 64
const PAD_RIGHT = 8
const BAR_AREA_W = CHART_W - LABEL_W - PAD_RIGHT

function energyBarY(index: number): number {
  return index * (BAR_H + BAR_GAP)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackFieldSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

        .tf-display { font-family: 'Anton', 'Barlow Condensed', sans-serif; }
        .tf-condensed { font-family: 'Barlow Condensed', sans-serif; }
        .tf-mono { font-family: 'JetBrains Mono', monospace; }

        /* ── Track lane grid background ─────────────────────────────────────── */
        .tf-lane-bg {
          background-image:
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 79px,
              rgba(255,100,0,0.04) 79px,
              rgba(255,100,0,0.04) 80px
            ),
            repeating-linear-gradient(
              180deg,
              transparent,
              transparent 79px,
              rgba(255,100,0,0.03) 79px,
              rgba(255,100,0,0.03) 80px
            );
        }

        /* ── Scoreboard scanline effect ─────────────────────────────────────── */
        .tf-scanlines::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.12) 2px,
            rgba(0,0,0,0.12) 4px
          );
          pointer-events: none;
          border-radius: inherit;
        }

        /* ── Spotlight glow on hero numbers ─────────────────────────────────── */
        .tf-spotlight {
          position: relative;
        }
        .tf-spotlight::before {
          content: '';
          position: absolute;
          inset: -20px;
          background: radial-gradient(ellipse at center, rgba(255,80,0,0.18) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .tf-spotlight > * { position: relative; z-index: 1; }

        /* ── Pulse animation ─────────────────────────────────────────────────── */
        @keyframes tf-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.92); }
        }
        .tf-pulse { animation: tf-pulse 1.8s ease-in-out infinite; }

        @keyframes tf-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .tf-blink { animation: tf-blink 1.1s step-end infinite; }

        /* ── Slide-in stagger on hero ────────────────────────────────────────── */
        @keyframes tf-rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tf-rise-1 { animation: tf-rise 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
        .tf-rise-2 { animation: tf-rise 0.55s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        .tf-rise-3 { animation: tf-rise 0.55s cubic-bezier(0.22,1,0.36,1) 0.25s both; }
        .tf-rise-4 { animation: tf-rise 0.55s cubic-bezier(0.22,1,0.36,1) 0.35s both; }

        /* ── WR row hover ────────────────────────────────────────────────────── */
        .tf-wr-row {
          transition: background 0.15s ease;
        }
        .tf-wr-row:hover {
          background: rgba(255,80,0,0.08);
        }

        /* ── Phase label pill ────────────────────────────────────────────────── */
        .tf-phase-pill {
          letter-spacing: 0.25em;
          text-transform: uppercase;
          font-size: 10px;
        }

        /* ── Energy bar segments ─────────────────────────────────────────────── */
        .tf-energy-row:hover .tf-energy-label {
          opacity: 1;
        }

        /* ── Citation highlight ──────────────────────────────────────────────── */
        .tf-citation {
          letter-spacing: 0.05em;
        }

        /* ── Card finding separator ──────────────────────────────────────────── */
        .tf-finding + .tf-finding {
          border-top-width: 1px;
          border-top-style: solid;
        }

        /* ── Hero number counter effect ──────────────────────────────────────── */
        .tf-stat-num {
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }

        /* ── Diagonal hero stripe ────────────────────────────────────────────── */
        .tf-stripe {
          background: repeating-linear-gradient(
            -55deg,
            transparent,
            transparent 8px,
            rgba(255,100,0,0.06) 8px,
            rgba(255,100,0,0.06) 9px
          );
        }

        /* ── Speed gradient bar ──────────────────────────────────────────────── */
        .tf-speed-bar {
          background: linear-gradient(90deg, #ff2200 0%, #ff8800 40%, #ffcc00 75%, #ffe066 100%);
        }

        /* ── Section divider track line ──────────────────────────────────────── */
        .tf-divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255,80,0,0.45), transparent);
        }

        /* ── Card accent line ────────────────────────────────────────────────── */
        .tf-card-accent-line {
          height: 2px;
          background: currentColor;
          opacity: 0.55;
          border-radius: 1px;
        }
      `}} />

      <div className="min-h-screen text-white tf-lane-bg" style={{ background: '#0d0c0b' }}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-50 border-b"
          style={{ background: 'rgba(13,12,11,0.92)', borderColor: 'rgba(255,80,0,0.18)', backdropFilter: 'blur(14px)' }}
        >
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 tf-mono transition-colors"
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}
              aria-label="Back to Explore"
            >
              <ArrowLeft style={{ width: 13, height: 13 }} />
              Explore
            </Link>
            <div style={{ width: 1, height: 16, background: 'rgba(255,80,0,0.3)' }} />
            <div className="flex-1 flex items-center gap-3">
              {/* Sprint icon — track oval SVG */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <ellipse cx="9" cy="9" rx="7" ry="4.5" stroke="#ff5500" strokeWidth="1.5" fill="none"/>
                <line x1="2" y1="9" x2="16" y2="9" stroke="#ff5500" strokeWidth="0.8" strokeDasharray="2 1.5"/>
                <circle cx="13.5" cy="6.8" r="1.5" fill="#ff5500"/>
              </svg>
              <h1 className="tf-condensed font-bold tracking-wide text-white" style={{ fontSize: 17 }}>
                Track &amp; Field Science
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span
                className="tf-pulse inline-block rounded-full"
                style={{ width: 6, height: 6, background: '#ff4400' }}
              />
              <span className="tf-mono text-white/25" style={{ fontSize: 9, letterSpacing: '0.2em' }}>
                BIOMECHANICS LAB
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

          {/* ── Hero Section ─────────────────────────────────────────────────── */}
          <div
            className="relative overflow-hidden rounded-2xl tf-scanlines tf-stripe"
            style={{
              background: 'linear-gradient(135deg, rgba(255,60,0,0.12) 0%, rgba(255,140,0,0.06) 50%, rgba(13,12,11,0) 100%)',
              border: '1px solid rgba(255,80,0,0.28)',
              minHeight: 240,
            }}
          >
            {/* Stadium spotlight radial */}
            <div
              style={{
                position: 'absolute',
                top: -60,
                right: -60,
                width: 320,
                height: 320,
                background: 'radial-gradient(ellipse at center, rgba(255,100,0,0.14) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            {/* Track lane lines across bottom */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 40,
                background: 'repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,80,0,0.12) 79px, rgba(255,80,0,0.12) 80px)',
              }}
            />

            <div className="relative z-10 p-6 pb-8">
              {/* Eyebrow */}
              <div className="tf-rise-1 flex items-center gap-2 mb-3">
                <span
                  className="tf-mono tf-phase-pill rounded"
                  style={{ background: 'rgba(255,80,0,0.2)', color: '#ff6633', padding: '3px 8px' }}
                >
                  The Broadest Athletic Discipline
                </span>
                <span className="tf-blink tf-mono" style={{ color: '#ff4400', fontSize: 12 }}>|</span>
              </div>

              {/* Main headline */}
              <div className="tf-rise-2">
                <h2
                  className="tf-display leading-none tracking-tight"
                  style={{ fontSize: 'clamp(38px, 8vw, 68px)', color: '#ffffff' }}
                >
                  TRACK &amp; FIELD
                </h2>
                <h2
                  className="tf-display leading-none tracking-tight"
                  style={{ fontSize: 'clamp(38px, 8vw, 68px)', color: '#ff4400' }}
                >
                  SCIENCE
                </h2>
              </div>

              <p className="tf-rise-3 mt-3 max-w-xl text-white/50 leading-relaxed" style={{ fontSize: 13 }}>
                From 80 ms ground contacts to 10-year development pathways — the biomechanics, physiology,
                and training science behind the fastest humans and greatest field athletes on Earth.
              </p>

              {/* Tags */}
              <div className="tf-rise-4 mt-4 flex flex-wrap gap-2">
                {['Sprint Biomechanics', 'Energy Systems', 'Field Events', 'Periodization', 'LTAD'].map((tag) => (
                  <span
                    key={tag}
                    className="tf-mono rounded-sm"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.07em',
                      background: 'rgba(255,80,0,0.1)',
                      color: 'rgba(255,140,60,0.85)',
                      padding: '3px 9px',
                      border: '1px solid rgba(255,80,0,0.2)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Hero Stats ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="tf-spotlight rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,80,0,0.15)',
                  padding: '16px 14px',
                }}
              >
                <p className="tf-mono text-white/30" style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  {stat.label}
                </p>
                <p
                  className="tf-display tf-stat-num mt-2"
                  style={{ fontSize: 30, color: stat.color, letterSpacing: '-0.01em' }}
                >
                  {stat.value}
                </p>
                <p className="tf-mono text-white/30 mt-1 leading-tight" style={{ fontSize: 9 }}>
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>

          {/* ── Energy System Bar Chart ──────────────────────────────────────── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 border-b flex items-center gap-3"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <div style={{ width: 2, height: 24, background: '#ff6600', borderRadius: 1 }} />
              <div>
                <h2 className="tf-condensed font-bold tracking-wide text-white" style={{ fontSize: 16 }}>
                  Energy System Breakdown by Event
                </h2>
                <p className="tf-mono text-white/35 mt-0.5" style={{ fontSize: 10 }}>
                  PCr = phosphocreatine · Glycolytic = lactate system · Oxidative = aerobic
                </p>
              </div>
            </div>

            <div className="px-5 py-5 overflow-x-auto">
              {/* Legend */}
              <div className="flex items-center gap-5 mb-5">
                {[
                  { label: 'PCr / Anaerobic-Alactic', color: '#ff2200' },
                  { label: 'Glycolytic / Lactic', color: '#ff8800' },
                  { label: 'Oxidative / Aerobic', color: '#22aa66' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="rounded-sm inline-block" style={{ width: 10, height: 10, background: l.color, opacity: 0.85 }} />
                    <span className="tf-mono text-white/40" style={{ fontSize: 9 }}>{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Stacked horizontal bars via SVG */}
              <svg
                viewBox={`0 0 ${CHART_W} ${ENERGY_EVENTS.length * (BAR_H + BAR_GAP) - BAR_GAP + 20}`}
                className="w-full min-w-[340px]"
                style={{ height: ENERGY_EVENTS.length * (BAR_H + BAR_GAP) - BAR_GAP + 20 }}
                aria-label="Energy system breakdown by track event"
              >
                <defs>
                  <linearGradient id="tf-pcr-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff2200" stopOpacity="0.9"/>
                    <stop offset="100%" stopColor="#ff4400" stopOpacity="0.7"/>
                  </linearGradient>
                  <linearGradient id="tf-gly-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff6600" stopOpacity="0.85"/>
                    <stop offset="100%" stopColor="#ff9900" stopOpacity="0.65"/>
                  </linearGradient>
                  <linearGradient id="tf-ox-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22aa66" stopOpacity="0.75"/>
                    <stop offset="100%" stopColor="#44cc88" stopOpacity="0.55"/>
                  </linearGradient>
                </defs>

                {ENERGY_EVENTS.map((ev, i) => {
                  const y = energyBarY(i)
                  const totalW = BAR_AREA_W - 2
                  const pcrW = (ev.pcr / 100) * totalW
                  const glyW = (ev.glycolytic / 100) * totalW
                  const oxW = (ev.oxidative / 100) * totalW
                  return (
                    <g key={ev.event} className="tf-energy-row">
                      {/* Event label */}
                      <text
                        x={LABEL_W - 8}
                        y={y + BAR_H / 2 + 4}
                        textAnchor="end"
                        fill={ev.color}
                        fontSize="12"
                        fontFamily="'Anton', sans-serif"
                        letterSpacing="0.02em"
                      >
                        {ev.event}
                      </text>

                      {/* Background track */}
                      <rect
                        x={LABEL_W}
                        y={y}
                        width={totalW}
                        height={BAR_H}
                        fill="rgba(255,255,255,0.04)"
                        rx="3"
                      />

                      {/* PCr segment */}
                      {pcrW > 0 && (
                        <rect x={LABEL_W} y={y} width={pcrW} height={BAR_H} fill="url(#tf-pcr-grad)" rx="3" />
                      )}
                      {/* Glycolytic segment */}
                      {glyW > 0 && (
                        <rect x={LABEL_W + pcrW} y={y} width={glyW} height={BAR_H} fill="url(#tf-gly-grad)" rx={pcrW === 0 ? '3 0 0 3' : '0'} />
                      )}
                      {/* Oxidative segment */}
                      {oxW > 0 && (
                        <rect
                          x={LABEL_W + pcrW + glyW}
                          y={y}
                          width={oxW}
                          height={BAR_H}
                          fill="url(#tf-ox-grad)"
                          rx={pcrW === 0 && glyW === 0 ? '3' : '0 3 3 0'}
                        />
                      )}

                      {/* Percentage labels inside bar */}
                      {ev.pcr > 8 && (
                        <text
                          x={LABEL_W + pcrW / 2}
                          y={y + BAR_H / 2 + 4}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.9)"
                          fontSize="9"
                          fontFamily="'JetBrains Mono', monospace"
                          fontWeight="700"
                        >
                          {ev.pcr}%
                        </text>
                      )}
                      {ev.glycolytic > 8 && (
                        <text
                          x={LABEL_W + pcrW + glyW / 2}
                          y={y + BAR_H / 2 + 4}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.9)"
                          fontSize="9"
                          fontFamily="'JetBrains Mono', monospace"
                          fontWeight="700"
                        >
                          {ev.glycolytic}%
                        </text>
                      )}
                      {ev.oxidative > 8 && (
                        <text
                          x={LABEL_W + pcrW + glyW + oxW / 2}
                          y={y + BAR_H / 2 + 4}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.85)"
                          fontSize="9"
                          fontFamily="'JetBrains Mono', monospace"
                          fontWeight="700"
                        >
                          {ev.oxidative}%
                        </text>
                      )}

                      {/* Lactate badge */}
                      <text
                        x={CHART_W - PAD_RIGHT}
                        y={y + BAR_H / 2 + 4}
                        textAnchor="end"
                        fill="rgba(255,200,100,0.55)"
                        fontSize="8.5"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        La {ev.lactate}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* Source line */}
              <p className="tf-mono text-white/22 mt-3" style={{ fontSize: 9 }}>
                Sources: Jones &amp; Carter 2000 · Hirvonen 1987 · Spencer &amp; Gastin 2001 · Lacour 1991 · La = blood lactate mmol/L
              </p>
            </div>
          </div>

          {/* ── World Records Comparison ─────────────────────────────────────── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="px-5 py-4 border-b flex items-center gap-3"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <div style={{ width: 2, height: 24, background: '#ffcc00', borderRadius: 1 }} />
              <div>
                <h2 className="tf-condensed font-bold tracking-wide text-white" style={{ fontSize: 16 }}>
                  World Records — Speed Across Distances
                </h2>
                <p className="tf-mono text-white/35 mt-0.5" style={{ fontSize: 10 }}>
                  Average speed comparison — elite human performance spectrum
                </p>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {WORLD_RECORDS.map((rec) => {
                const speed = parseFloat(rec.speed)
                const maxSpeed = 10.44
                const barPct = Math.round((speed / maxSpeed) * 100)
                return (
                  <div key={rec.event} className="tf-wr-row px-5 py-3.5 flex items-center gap-4">
                    <div style={{ width: 52 }}>
                      <span className="tf-display" style={{ fontSize: 22, color: rec.color, letterSpacing: '0.01em' }}>
                        {rec.event}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        className="rounded-full overflow-hidden"
                        style={{ height: 6, background: 'rgba(255,255,255,0.07)' }}
                      >
                        <div
                          className="h-full rounded-full tf-speed-bar"
                          style={{ width: `${barPct}%`, opacity: 0.85 }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0" style={{ minWidth: 60 }}>
                      <p className="tf-condensed font-bold text-white" style={{ fontSize: 16 }}>
                        {rec.wr}
                      </p>
                      <p className="tf-mono text-white/35" style={{ fontSize: 9 }}>{rec.holder}</p>
                    </div>
                    <div
                      className="hidden sm:block text-right shrink-0 tf-mono"
                      style={{ minWidth: 72, fontSize: 11, color: rec.color, opacity: 0.8 }}
                    >
                      {rec.speed}
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              className="px-5 py-2.5 flex justify-between"
              style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="tf-mono text-white/20" style={{ fontSize: 9 }}>SLOWER</span>
              <span className="tf-mono text-white/20" style={{ fontSize: 9 }}>← Average speed (m/s) →</span>
              <span className="tf-mono text-white/20" style={{ fontSize: 9 }}>FASTER</span>
            </div>
          </div>

          {/* ── Track divider ────────────────────────────────────────────────── */}
          <div className="tf-divider" />

          {/* ── Science Cards ────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {SCIENCE_CARDS.map((card) => (
              <div
                key={card.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: card.accentBg,
                  border: `1px solid ${card.accentBorder}`,
                }}
              >
                {/* Card header */}
                <div
                  className="px-5 py-4 border-b flex items-center gap-3"
                  style={{ borderColor: card.accentBorder }}
                >
                  <span
                    className="tf-mono tf-phase-pill rounded shrink-0"
                    style={{ background: card.accentPill, color: card.accentColor, padding: '4px 9px' }}
                  >
                    {card.label}
                  </span>
                  <div style={{ flex: 1 }}>
                    <h2
                      className="tf-condensed font-bold tracking-wide"
                      style={{ fontSize: 18, color: card.accentColor }}
                    >
                      {card.title}
                    </h2>
                  </div>
                  {/* Decorative speed lines */}
                  <div className="hidden sm:flex flex-col gap-0.5 shrink-0" style={{ opacity: 0.25 }}>
                    {[40, 70, 55, 85].map((w, i) => (
                      <div key={i} className="rounded-full" style={{ width: w, height: 1.5, background: card.accentColor }} />
                    ))}
                  </div>
                </div>

                {/* Findings */}
                <div>
                  {card.findings.map((finding, fi) => (
                    <div
                      key={fi}
                      className="tf-finding px-5 py-4"
                      style={{ borderColor: card.accentBorder + '44' }}
                    >
                      <p
                        className="tf-mono tf-citation mb-2.5 uppercase font-bold"
                        style={{ fontSize: 9.5, color: card.accentColor, opacity: 0.88 }}
                      >
                        {finding.citation}
                      </p>
                      <p className="text-white/55 leading-relaxed" style={{ fontSize: 12 }}>
                        {finding.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Quick Reference: Energy System Rules of Thumb ─────────────────── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <h2 className="tf-condensed font-bold tracking-wide text-white" style={{ fontSize: 16 }}>
                Training Principles Quick Reference
              </h2>
              <p className="tf-mono text-white/30 mt-0.5" style={{ fontSize: 10 }}>
                Event-specific rules of thumb for coaches and athletes
              </p>
            </div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              {[
                {
                  title: 'Sprints (≤400m)',
                  color: '#ff5500',
                  items: [
                    'Max sprints: 2–3×/week — CNS 48–72h recovery (Siff)',
                    'Long rest: 8–12 min between max efforts (PCr resynthesis)',
                    'Resisted sprints: 10–15% body weight for horizontal force',
                    'Block work: 40–45° push angle target (Morin 2011)',
                    'Type II dominance: cannot be trained — select genetically',
                    '400m: avoid > 0.5s negative-split margin (Hirvonen)',
                  ],
                },
                {
                  title: 'Distance & Field',
                  color: '#22cc88',
                  items: [
                    '800m: train both glycolytic AND aerobic ceiling equally',
                    '5000m: lactate threshold >88% vVO₂max required',
                    'Altitude: 2000–2500 m, 4–6 weeks for RBC adaptation',
                    'LTAD: multi-event through age 14 — no early specialisation',
                    'Jumps: horizontal velocity at board > takeoff angle',
                    'Throws: proximal-to-distal kinetic chain — hip first',
                  ],
                },
              ].map((group) => (
                <div key={group.title} className="px-5 py-5">
                  <p
                    className="tf-condensed font-bold tracking-wide mb-4"
                    style={{ fontSize: 14, color: group.color }}
                  >
                    {group.title}
                  </p>
                  <ul className="space-y-2.5">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span
                          className="shrink-0 rounded-sm mt-1"
                          style={{ width: 5, height: 5, background: group.color, opacity: 0.65, marginTop: 5 }}
                        />
                        <span className="text-white/45 leading-snug" style={{ fontSize: 12 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* ── Footer citation note ─────────────────────────────────────────── */}
          <div
            className="rounded-xl px-5 py-4 flex items-start gap-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
              <circle cx="7" cy="7" r="6" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/>
              <path d="M7 6v4M7 4.5V5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <p className="tf-mono text-white/25 leading-relaxed" style={{ fontSize: 10 }}>
              Evidence sources: Haugen 2019 (IJSPP) · Morin 2011 (J Biomech) · Pain 2011 (J Sports Sci) ·
              Mero 1983 (Eur J Appl Physiol) · Jones &amp; Carter 2000 (Sports Med) · Hirvonen 1987 (Int J Sports Med) ·
              Spencer &amp; Gastin 2001 (J Sports Sci) · Lacour 1991 (Eur J Appl Physiol) · Gregor 1988 (Int J Sport Biomech) ·
              Dapena 1988 (J Biomech) · Hay 1993 (J Biomech) · Young 2004 (J Strength Cond Res) · Pfaff 2015 (IAAF NSA) ·
              Daniels &amp; Oldridge 1970 (Med Sci Sports) · Siff 2003 (Supertraining) · Balyi 2004 (LTAD model).
              For educational purposes only. Consult a qualified strength &amp; conditioning coach or sports scientist
              for individualised training guidance.
            </p>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}

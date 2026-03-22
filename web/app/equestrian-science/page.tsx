// Equestrian Science — static server component
// Evidence-based guide covering rider biomechanics, horse-rider interaction physics,
// discipline demands, and injury science for equestrian athletes.

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Equestrian Science' }

// ─── Cardiovascular Intensity by Discipline ───────────────────────────────────

const CV_DISCIPLINES = [
  { discipline: 'Cross-Country', pct: 90, display: '90%', color: '#c9a84c', barPct: 100,  desc: 'Eventing cross-country phase — 8–12 min sustained intensity' },
  { discipline: 'Polo',          pct: 87, display: '87%', color: '#b8972a', barPct:  97,  desc: 'Chukka play — galloping plus mallet-striking demands' },
  { discipline: 'Show Jumping',  pct: 83, display: '83%', color: '#6b3a2a', barPct:  92,  desc: 'Competition rounds — anaerobic bursts and recovery' },
  { discipline: 'Dressage',      pct: 73, display: '73%', color: '#2d5a27', barPct:  81,  desc: 'Grand Prix test — sustained isometric postural demand' },
  { discipline: 'Hacking/Leisure', pct: 55, display: '55%', color: '#4a7a44', barPct: 61, desc: 'Pleasure riding — low intensity cardiovascular baseline' },
]

// ─── Key Stats ─────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '3–5 G',
    label: 'Sitting Trot Spinal Load',
    sub: 'Vertical force per stride on lumbar spine (equestrian biomechanics research)',
    color: '#c9a84c',
  },
  {
    value: '66%',
    label: 'Elite Riders with LBP',
    sub: 'Chronic low back pain prevalence in elite equestrian athletes',
    color: '#6b3a2a',
  },
  {
    value: '1:350h',
    label: 'Fall Rate (Cross-Country)',
    sub: 'Highest-risk equestrian discipline; 1 fall per 350 riding hours',
    color: '#c9a84c',
  },
  {
    value: '52–62',
    label: 'VO₂max mL/kg/min',
    sub: 'Elite eventer aerobic capacity — mid-distance running equivalent',
    color: '#2d5a27',
  },
]

// ─── Science Cards ─────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'biomechanics',
    number: '01',
    title: 'Rider Biomechanics & Position',
    accent: '#c9a84c',
    icon: '🐴',
    findings: [
      {
        citation: 'Lovett 2005 — Equestrian Biomechanics Research',
        stat: '60–80',
        statLabel: 'Posting rises per minute',
        detail: 'The rising (posting) trot requires 60–80 pelvis-lift cycles per minute, precisely matching the horse\'s two-beat diagonal gait. Hip flexion/extension must couple exactly with the horse\'s footfall sequence — the rider rises as the outside diagonal pair leaves the ground. Energy absorption occurs through the lumbar spine and hip joints during the sitting phase; maintaining pelvis neutrality prevents shear loading at L4–L5. Joint angles at the peak of the rise: hip 110–120°, knee ~150°, ankle in slight dorsiflexion to stabilise through the heel. Skilled riders reduce peak vertical acceleration transmitted to the horse\'s back by 30–40% compared to novices — measurable protection for the horse\'s thoracolumbar fascia.',
      },
      {
        citation: 'Equestrian Biomechanics — Sitting Trot Spinal Loading Studies',
        stat: '3–5 G',
        statLabel: 'Lumbar vertical impact per stride',
        detail: 'In the sitting trot, the rider\'s lumbar spine bears 3–5 G of vertical impact force per stride as the horse\'s hindquarters push upward through each beat. Erector spinae and multifidus activate eccentrically to decelerate spinal flexion and protect intervertebral discs. Rising trot reduces per-stride lumbar loading by ~50%, though it doubles the number of muscle activation cycles per minute. Saddle fit critically modulates force transmission: an incorrect tree angle concentrates pressure asymmetrically under the rider\'s seat bones, creating lateral pelvic tilt and compensatory scoliotic loading. Back injury prevention therefore requires simultaneous attention to rider posture, core conditioning, and equipment fit — no single intervention is sufficient in isolation.',
      },
      {
        citation: 'Show Jumping Position Biomechanics Research',
        stat: '15–80 N',
        statLabel: 'Rein grip force on take-off',
        detail: 'The two-point (jumping) position requires sustained isometric contraction of gluteus maximus, vastus lateralis, and rectus femoris to maintain a flexed-hip, weight-forward posture with heels pressed down and the lower leg stable against the horse\'s barrel. Ankle dorsiflexion of 15–25° distributes body weight through the heel, preventing the leg from swinging back on take-off. Rein grip forces during take-off average 15–20 N in trained riders but spike to 60–80 N in novices who compensate for balance loss through the hands — a major unintended source of bit pressure on the horse. Core engagement prevents the upper body pitching forward over the horse\'s neck, which shifts the combined centre of mass ahead of the withers and disrupts the horse\'s jumping arc.',
      },
      {
        citation: 'Cross-Country Eventing Impact & Safety Research',
        stat: '3 G',
        statLabel: 'Rider impact force at gallop landing',
        detail: 'During cross-country fence landings at gallop, forces transmitted through the rider\'s body reach three times body weight — approximately 3 G — concentrated across the spine, pelvis, and lower limbs within 100–150 ms of landing. Spinal compression peaks at L1–L3 during the initial landing phase before the horse rebalances forward. Modern air-vest technology (BETA/ASTM-rated) activates within 100 ms of fall-sensor trigger, inflating 40–50 mm of protective foam to redistribute thoracic impact forces. Fall statistics in cross-country: approximately 1 per 350 riding hours at Novice/BE100 level. Critically, 24% of falls result in head contact with the ground — making certified helmet use (ASTM F1163, PAS 015, SNELL E2016) the single most evidence-based protective intervention in equestrian sport.',
      },
    ],
  },
  {
    id: 'interaction',
    number: '02',
    title: 'Horse-Rider Interaction Physics',
    accent: '#2d5a27',
    icon: '⚖️',
    findings: [
      {
        citation: 'Classical Dressage Biomechanics — Combined Centre of Mass Studies',
        stat: 'At withers',
        statLabel: 'Optimal combined CoM in lateral work',
        detail: 'In classical dressage, the ideal combined (horse + rider) centre of mass sits approximately at the horse\'s withers — roughly two-thirds of the way along the back from nose to tail. During lateral movements (shoulder-in, half-pass, travers), the rider\'s weight distribution directly influences the horse\'s ability to cross its legs and maintain balance through the movement. Research shows that even 3–5 kg more weight on one seat bone causes measurable asymmetry in the horse\'s hindlimb thrust and can gradually develop asymmetric musculature across the horse\'s back. Rider straightness is therefore not aesthetic aspiration but a physical necessity: a rider who is crooked by habit creates a systematically asymmetric horse, regardless of the quality of training otherwise applied.',
      },
      {
        citation: 'Instrumented Rein Tension Studies — Equine & Rider Biomechanics',
        stat: '0.5–12 kg',
        statLabel: 'Rein tension range (contact to collection)',
        detail: 'Instrumented rein tension studies show that trained dressage riders maintain light contact of 0.5–3.0 kg during free forward paces, rising to 8–12 kg during collection applied through intermittent half-halts. Bit type and leverage ratio fundamentally alter force transmission: a simple snaffle applies 1:1 rein-to-bit-ring force; a Pelham with two reins multiplies rider hand force 2.5–4× at the bit. Hand position in the vertical plane affects rein tension because each 5 cm of hand movement forward or back creates 0.5–1.0 kg of tension change through the rein\'s elastic properties. Proprioceptive feedback through the reins allows skilled riders to sense subtle changes in the horse\'s balance and rhythm before they become visible externally — a key discriminator between educated and uneducated hands.',
      },
      {
        citation: 'Rider EMG Studies — Anticipatory Muscle Activation in Equestrian Athletes',
        stat: '50–100 ms',
        statLabel: 'Core pre-activation before foot strike',
        detail: 'Electromyographic studies comparing skilled and novice riders find that experienced equestrians pre-activate core stabiliser muscles (transversus abdominis, internal oblique, multifidus) 50–100 ms before each expected horse foot strike — a feed-forward neuromuscular strategy that stabilises the pelvis and lumbar spine before the impact impulse arrives. Novice riders show reactive activation only after foot strike, creating a brief window of spinal instability every stride. This anticipatory pattern emerges from years of proprioceptive integration with the horse\'s rhythmic movement and cannot be consciously directed. Skilled riders also show significantly reduced antagonist co-contraction compared to novices — explaining the \'effortless\' appearance of advanced equitation despite high underlying muscle demands.',
      },
      {
        citation: 'Pressure Mat & Kinematic Studies — Saddle Fit and Horse Performance',
        stat: '15–25%',
        statLabel: 'Performance reduction with poor saddle fit',
        detail: 'Pressure mat studies show that poorly fitting saddles create peak pressures exceeding 40 kPa over localised areas of the horse\'s longissimus dorsi muscle — above the 11 kPa threshold at which capillary blood flow is occluded. Horses ridden in ill-fitting saddles show objective kinematic changes: stride length shortens 8–12%, thoracolumbar range of motion decreases, and hindquarter engagement reduces — a cumulative measurable performance loss of 15–25%. Chronic poor saddle fit causes progressive muscular atrophy in the contact region, worsening the fit over time in a self-reinforcing cycle. Qualified saddle-fitter and equine physiotherapist assessments are recommended every 6–12 months, or whenever the horse\'s body condition score changes significantly through training or seasonal variation.',
      },
    ],
  },
  {
    id: 'demands',
    number: '03',
    title: 'Physical Demands of Equestrian Disciplines',
    accent: '#c9a84c',
    icon: '💓',
    findings: [
      {
        citation: 'Elite Eventing Physiology Research — Three-Day Event Cardiovascular Demands',
        stat: '75–92%',
        statLabel: 'HRmax during cross-country phase',
        detail: 'Elite three-day eventing cross-country phases last 8–12 minutes at sustained intensity, with riders maintaining 75–92% of maximal heart rate throughout. VO₂max requirements for elite eventers: 52–62 mL/kg/min — comparable to mid-distance running athletes. HR profiles across fence types are non-uniform: approach and landing at large technical fences (water complexes, coffin combinations) briefly spike HR to near-maximal, while galloping sections between fences allow partial recovery. The cross-country phase accounts for the majority of rider fatalities and serious injuries in eventing history. Cardiovascular fitness is therefore not merely a performance variable but a safety-critical factor: a fatigued rider at fence 20 of a challenging cross-country course makes measurably worse line and pace decisions than a fit rider, with corresponding injury risk implications.',
      },
      {
        citation: 'Dressage Rider Physiology — Isometric Postural Demands & Heart Rate',
        stat: '65–80%',
        statLabel: 'HRmax during Grand Prix dressage test',
        detail: 'Despite appearing relatively static, competitive dressage is a demanding postural endurance sport. Riders maintain isometric contraction of hip adductors throughout (applying leg aids and maintaining position), deep core stabilisers (resisting 3–5 G sitting trot loads), and scapular stabilisers (keeping shoulders back while sustaining elastic rein contact). HR during Grand Prix dressage tests reaches 65–80% HRmax — lower than cross-country but sustained for 5–8 minutes without recovery opportunities. The proprioceptive and cognitive demands are exceptionally high: riders execute complex movement sequences (piaffe, passage, one-time tempi changes) while monitoring the horse\'s balance, rhythm, and engagement with 100+ individual aids per minute. Aerobic fitness, while important, is secondary to neuromuscular skill and proprioceptive acuity in dressage performance at the highest levels.',
      },
      {
        citation: 'Show Jumping Competition Physiology — Accumulated Fatigue Studies',
        stat: '35–45',
        statLabel: 'Fences per competition day',
        detail: 'At championship level, show jumping riders may compete in 3–4 rounds per day, jumping 35–45 fences in total. Individual round duration: 60–90 seconds at 400–450 m/minute canter, producing HR 75–88% HRmax. The primary physiological challenge is not any single round but accumulated fatigue: coordination and reaction time deteriorate measurably from round 1 to round 4 on the same horse. Recovery periods between rounds of 20–120 minutes are frequently insufficient for complete metabolic recovery when high-intensity efforts are repeated across a competition day. Cognitive fatigue management — maintaining concentration, line selection accuracy, and pace control across multiple rounds — is as critical as physical conditioning in elite show jumping. Horse welfare management across competition days adds a further cognitive layer not present in other elite sports.',
      },
      {
        citation: 'Polo Physiology & Biomechanics Research — Upper Body Demands',
        stat: '40–50 km/h',
        statLabel: 'Galloping speed during play',
        detail: 'Polo combines the cardiovascular demands of mounted galloping (HR frequently 80–92% HRmax in chukkas) with the upper-body rotational demands of mallet play. The polo swing requires rapid trunk rotation of 60–80° at 180–220°/s against the destabilising platform of a galloping horse — exceptional core stiffness and hip adductor grip are prerequisites. Spatial cognition is extreme: riders must simultaneously track a 7.5 cm ball, four teammates, four opponents, and two umpires while galloping at 40–50 km/h and steering a highly responsive pony. Lateral lean requirements for ground-level shots demand 90–120° of hip abduction from a neutral seated position — a unique loading pattern generating distinct hip joint stress not present in other equestrian disciplines and requiring specific hip mobility and adductor strength conditioning.',
      },
    ],
  },
  {
    id: 'injury',
    number: '04',
    title: 'Injury Science & Safety',
    accent: '#2d5a27',
    icon: '🩹',
    findings: [
      {
        citation: 'Equestrian Injury Epidemiology — Fall Rate & Severity Studies',
        stat: '1 per 350h',
        statLabel: 'Fall rate in cross-country',
        detail: 'Fall rates vary significantly by discipline: cross-country eventing carries the highest risk at approximately 1 fall per 350 riding hours; flatwork and dressage are considerably safer at 1 per 1,000+ hours. Fall severity distribution: 70–75% result in minor or no injury; ~20% produce moderate injury (bruising, muscle strain, minor fracture); 5–10% require significant medical attention. Head injuries occur in approximately 24% of falls involving ground contact — underscoring that helmet use is the single most evidence-supported safety intervention in equestrian sport. Modern certified helmets (ASTM F1163, PAS 015, SNELL E2016) reduce serious traumatic brain injury probability by 60–70% versus no helmet. Air vest deployment in eventing falls has been associated with reduced thoracic injury severity in observational studies.',
      },
      {
        citation: 'Low Back Pain in Equestrian Athletes — Prevalence & Biomechanical Aetiology',
        stat: '66%',
        statLabel: 'Elite riders with chronic LBP',
        detail: 'Surveys of elite equestrian athletes consistently find 60–70% reporting chronic or recurrent low back pain — among the highest prevalence rates in any sport. Biomechanical contributors: repeated lumbar flexion-extension in sitting trot (up to 800 load cycles per hour), asymmetric rein hand dominance creating lateral pelvic tilt, and prolonged static loading compressing intervertebral discs. Disc pressure in the riding position is 30–40% higher than standing, and the rhythmic vertical loading creates a fatigue-stress pattern on annular fibres. Dominant rein hand asymmetry — most riders carry 15–25% more tension on the dominant side — produces systematic differences in paraspinal muscle development over months to years. Targeted core stabilisation programmes reduce LBP incidence and severity; combined pilates, yoga, and sport-specific strength training is the most evidence-supported approach in this population.',
      },
      {
        citation: 'Equestrian Fracture Epidemiology — Hospital-Based Studies',
        stat: '22–28%',
        statLabel: 'Clavicle share of all riding fractures',
        detail: 'Clavicle (collarbone) fracture is the most common fracture sustained in equestrian falls, occurring through the FOOSH (Fall On OutStretched Hand) mechanism: impact forces travel up the extended arm and concentrate at the clavicle, which lacks protective muscular coverage found at other upper extremity segments. Clavicle fractures account for 22–28% of all equestrian fractures in hospital-based studies. The outstretched-arm protective reflex is extremely difficult to suppress even with specific training, though judo and martial arts rolling techniques can partially redirect fall forces. Distal radius (wrist) fractures are the second most common, also via FOOSH. Together, upper extremity fractures account for approximately 45–55% of all riding-related fractures — a pattern distinct from other high-speed sports where lower extremity fractures dominate.',
      },
      {
        citation: 'Evidence-Based Conditioning for Equestrian Athletes — Core Stability & LBP Outcomes',
        stat: '35–45%',
        statLabel: 'LBP reduction with core training',
        detail: 'RCT-level evidence in equestrian populations shows 35–45% reduction in chronic low back pain severity and frequency following structured core stabilisation programmes. Pilates is the most extensively studied modality: 8–12 week mat pilates programmes improve rider position, reduce postural asymmetry, and decrease LBP numerical rating scores by ~40% on average. Yoga improves hip flexor flexibility and thoracic rotation range — both critical for balanced, symmetric riding. Gyrotonic movement systems address the three-dimensional spinal mobility patterns uniquely relevant to mounted equitation. Off-horse functional strength training (single-leg squats, Romanian deadlifts, pallof press anti-rotation) builds the hip stabiliser and core strength that underpins effective riding biomechanics. An optimal equestrian conditioning programme integrates cardiovascular fitness, core endurance, hip mobility, and neuromuscular coordination developed in sport-specific patterns.',
      },
    ],
  },
]

// ─── Discipline Comparison Grid ────────────────────────────────────────────────

const DISCIPLINE_GRID = [
  { discipline: 'Eventing',      demand: 'Aerobic + Impact',   vo2: '52–62', hr: '75–92%', injury: 'High',   primary: 'Cross-country falls, LBP' },
  { discipline: 'Dressage',      demand: 'Isometric Postural', vo2: '45–55', hr: '65–80%', injury: 'Low',    primary: 'LBP, hip adductor strain' },
  { discipline: 'Show Jumping',  demand: 'Anaerobic Bursts',   vo2: '48–58', hr: '75–88%', injury: 'Medium', primary: 'Falls, accumulated fatigue' },
  { discipline: 'Polo',          demand: 'Multi-System',       vo2: '50–60', hr: '80–92%', injury: 'High',   primary: 'Falls, mallet strikes, hip' },
]

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function EquestrianSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Cormorant+SC:wght@400;500;600;700&display=swap');

        :root {
          --eq-earth: #1a0f08;
          --eq-earth-dark: #130b05;
          --eq-earth-mid: #231408;
          --eq-surface: #221208;
          --eq-surface-2: #2c1a0e;
          --eq-border: #3d2010;
          --eq-leather: #6b3a2a;
          --eq-leather-bright: #8b4a35;
          --eq-leather-dim: #4a2318;
          --eq-leather-glow: rgba(107,58,42,0.18);
          --eq-green: #2d5a27;
          --eq-green-bright: #3d7a35;
          --eq-green-dim: #1e3d1a;
          --eq-green-glow: rgba(45,90,39,0.18);
          --eq-gold: #c9a84c;
          --eq-gold-bright: #e8c460;
          --eq-gold-dim: #8c7030;
          --eq-gold-glow: rgba(201,168,76,0.15);
          --eq-text: #f5ede0;
          --eq-text-dim: #c4aa8e;
          --eq-text-faint: #7a5f48;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .eq-root {
          min-height: 100vh;
          background-color: var(--eq-earth);
          color: var(--eq-text);
          font-family: 'Cormorant Garamond', Georgia, serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Subtle parchment grain */
        .eq-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Warm ambient glow */
        .eq-root::after {
          content: '';
          position: fixed;
          top: 10vh;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(201,168,76,0.04) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Header ── */
        .eq-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(26,15,8,0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--eq-border);
          padding: 12px 24px;
        }

        .eq-header-inner {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .eq-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--eq-border);
          background: var(--eq-surface);
          color: var(--eq-text-dim);
          text-decoration: none;
          transition: all 0.18s ease;
          flex-shrink: 0;
        }

        .eq-back-btn:hover {
          border-color: var(--eq-gold);
          color: var(--eq-gold);
          background: var(--eq-gold-glow);
        }

        .eq-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--eq-gold);
        }

        .eq-header-title {
          font-family: 'Cormorant SC', serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--eq-text);
        }

        /* ── Main ── */
        .eq-main {
          position: relative;
          z-index: 2;
          max-width: 960px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* ── Hero ── */
        .eq-hero {
          position: relative;
          padding: 72px 0 60px;
          text-align: center;
          overflow: hidden;
        }

        .eq-hero-glow-gold {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-55%);
          width: 700px;
          height: 500px;
          background: radial-gradient(ellipse, rgba(201,168,76,0.10) 0%, transparent 60%);
          pointer-events: none;
        }

        .eq-hero-glow-green {
          position: absolute;
          top: 60px;
          left: 50%;
          transform: translateX(-35%);
          width: 500px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(45,90,39,0.07) 0%, transparent 60%);
          pointer-events: none;
        }

        .eq-hero-crest {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--eq-gold);
          background: var(--eq-gold-glow);
          border: 1px solid rgba(201,168,76,0.28);
          padding: 7px 22px;
          margin-bottom: 36px;
        }

        /* SVG Hero illustration */
        .eq-hero-svg {
          display: block;
          margin: 0 auto 32px;
          width: min(420px, 90vw);
          height: auto;
          opacity: 0.88;
          filter: drop-shadow(0 0 40px rgba(201,168,76,0.25));
        }

        .eq-hero-h1 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(52px, 11vw, 108px);
          font-weight: 700;
          font-style: italic;
          line-height: 0.92;
          letter-spacing: 0.02em;
          color: var(--eq-text);
          margin-bottom: 10px;
          text-shadow: 0 0 100px rgba(201,168,76,0.18);
        }

        .eq-hero-h1 .gold  { color: var(--eq-gold); text-shadow: 0 0 60px rgba(201,168,76,0.55); }
        .eq-hero-h1 .green { color: var(--eq-green-bright); text-shadow: 0 0 40px rgba(61,122,53,0.50); }

        .eq-hero-rule {
          width: 80px;
          height: 1px;
          background: linear-gradient(to right, transparent, var(--eq-gold), transparent);
          margin: 20px auto;
        }

        .eq-hero-sub {
          font-size: clamp(14px, 2.2vw, 18px);
          font-weight: 400;
          font-style: italic;
          color: var(--eq-text-dim);
          margin: 0 auto 40px;
          max-width: 560px;
          line-height: 1.6;
          letter-spacing: 0.01em;
        }

        .eq-hero-numerics {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          flex-wrap: wrap;
        }

        .eq-hero-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
          font-weight: 700;
          color: var(--eq-gold);
          line-height: 1;
        }

        .eq-hero-num .unit {
          font-size: 20px;
          color: var(--eq-text-dim);
          margin-left: 3px;
        }

        .eq-hero-num-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--eq-text-faint);
          margin-top: 4px;
        }

        .eq-hero-divider {
          width: 1px;
          height: 44px;
          background: var(--eq-border);
        }

        /* ── Key Stats Grid ── */
        .eq-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 44px;
        }

        @media (min-width: 620px) {
          .eq-stats-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .eq-stat-card {
          background: var(--eq-surface);
          border: 1px solid var(--eq-border);
          padding: 18px 15px;
          position: relative;
          overflow: hidden;
        }

        .eq-stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }

        .eq-stat-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 5px;
        }

        .eq-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--eq-text-dim);
          margin-bottom: 5px;
        }

        .eq-stat-sub {
          font-size: 11px;
          font-style: italic;
          color: var(--eq-text-faint);
          line-height: 1.5;
        }

        /* ── HR Chart ── */
        .eq-chart {
          background: var(--eq-surface);
          border: 1px solid var(--eq-border);
          padding: 28px 26px;
          margin-bottom: 44px;
          position: relative;
          overflow: hidden;
        }

        .eq-chart::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 3px;
          height: 100%;
          background: var(--eq-gold);
        }

        .eq-chart-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--eq-gold);
          margin-bottom: 4px;
        }

        .eq-chart-title {
          font-family: 'Cormorant SC', serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--eq-text);
          margin-bottom: 4px;
        }

        .eq-chart-sub {
          font-size: 13px;
          font-style: italic;
          color: var(--eq-text-faint);
          margin-bottom: 28px;
        }

        .eq-chart-rows { display: flex; flex-direction: column; gap: 14px; }

        .eq-chart-row { display: grid; grid-template-columns: 130px 1fr 56px; align-items: center; gap: 14px; }

        @media (max-width: 500px) {
          .eq-chart-row { grid-template-columns: 100px 1fr 50px; gap: 8px; }
        }

        .eq-chart-disc {
          font-family: 'Cormorant SC', serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: var(--eq-text-dim);
          text-align: right;
        }

        .eq-chart-wrap { display: flex; flex-direction: column; gap: 4px; }

        .eq-chart-track {
          height: 22px;
          background: rgba(255,255,255,0.04);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .eq-chart-fill { height: 100%; position: absolute; left: 0; top: 0; opacity: 0.85; }

        .eq-chart-row-desc {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--eq-text-faint);
          letter-spacing: 0.04em;
          line-height: 1.4;
        }

        .eq-chart-pct {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          text-align: right;
        }

        /* ── Science Cards ── */
        .eq-cards { display: flex; flex-direction: column; gap: 20px; margin-bottom: 44px; }

        .eq-card {
          background: var(--eq-surface);
          border: 1px solid var(--eq-border);
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
        }

        .eq-card-accent-bar {
          position: absolute;
          top: 0; left: 0;
          width: 3px;
          height: 100%;
        }

        .eq-card-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 80px;
          font-weight: 700;
          font-style: italic;
          line-height: 1;
          position: absolute;
          top: 12px;
          right: 24px;
          opacity: 0.05;
          letter-spacing: -0.02em;
          pointer-events: none;
        }

        .eq-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .eq-card-title {
          font-family: 'Cormorant SC', serif;
          font-size: 26px;
          font-weight: 600;
          color: var(--eq-text);
          line-height: 1.15;
          margin-bottom: 24px;
          letter-spacing: 0.02em;
        }

        .eq-findings { display: flex; flex-direction: column; gap: 14px; }

        .eq-finding {
          display: flex;
          gap: 16px;
          padding: 15px 14px;
          background: rgba(255,255,255,0.022);
          border-left: 2px solid rgba(255,255,255,0.06);
          transition: background 0.15s ease;
        }

        .eq-finding:hover { background: rgba(255,255,255,0.04); }

        .eq-finding-stat { flex-shrink: 0; min-width: 92px; }

        .eq-finding-stat-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
        }

        .eq-finding-stat-lbl {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          color: var(--eq-text-faint);
          letter-spacing: 0.04em;
          margin-top: 3px;
          line-height: 1.45;
        }

        .eq-finding-body { flex: 1; min-width: 0; }

        .eq-finding-citation {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--eq-text-faint);
          margin-bottom: 6px;
        }

        .eq-finding-detail {
          font-size: 14.5px;
          font-weight: 400;
          color: rgba(245,237,224,0.74);
          line-height: 1.60;
        }

        /* ── Discipline Comparison Table ── */
        .eq-table-wrap {
          background: var(--eq-surface);
          border: 1px solid var(--eq-border);
          padding: 28px 26px;
          margin-bottom: 44px;
          overflow-x: auto;
        }

        .eq-table-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--eq-gold);
          margin-bottom: 4px;
        }

        .eq-table-heading {
          font-family: 'Cormorant SC', serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--eq-text);
          margin-bottom: 20px;
        }

        .eq-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 520px;
        }

        .eq-table th {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--eq-text-faint);
          text-align: left;
          padding: 0 10px 10px 0;
          border-bottom: 1px solid var(--eq-border);
        }

        .eq-table td {
          font-size: 13px;
          color: var(--eq-text-dim);
          padding: 11px 10px 11px 0;
          border-bottom: 1px solid rgba(61,32,16,0.4);
          vertical-align: top;
          line-height: 1.4;
        }

        .eq-table td:first-child {
          font-family: 'Cormorant SC', serif;
          font-size: 15px;
          font-weight: 600;
          color: var(--eq-text);
          white-space: nowrap;
        }

        .eq-table tr:last-child td { border-bottom: none; }

        .eq-table .mono {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
        }

        /* ── Disclaimer ── */
        .eq-disclaimer {
          margin-top: 40px;
          padding: 20px 24px;
          background: var(--eq-surface);
          border: 1px solid var(--eq-border);
          border-left: 3px solid var(--eq-gold-dim);
        }

        .eq-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--eq-text-faint);
          line-height: 1.80;
          letter-spacing: 0.04em;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .eq-hero-h1 { font-size: 50px; }
          .eq-card { padding: 24px 18px; }
          .eq-finding { flex-direction: column; gap: 8px; }
          .eq-finding-stat { min-width: unset; }
          .eq-chart-row { grid-template-columns: 90px 1fr 48px; gap: 8px; }
          .eq-hero-numerics { gap: 20px; }
        }
      `}} />

      <div className="eq-root">

        {/* ── Header ── */}
        <header className="eq-header">
          <div className="eq-header-inner">
            <Link href="/workouts" className="eq-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="eq-header-label">Sports Science Series</div>
              <div className="eq-header-title">Equestrian Science</div>
            </div>
          </div>
        </header>

        <main className="eq-main">

          {/* ── Hero ── */}
          <section className="eq-hero">
            <div className="eq-hero-glow-gold" />
            <div className="eq-hero-glow-green" />

            <div className="eq-hero-crest">Equestrian · Horse &amp; Rider Science</div>

            {/* Dressage extended trot SVG silhouette */}
            <svg
              className="eq-hero-svg"
              viewBox="0 0 420 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Horse and rider in dressage extended trot silhouette"
            >
              {/* Ground line */}
              <line x1="20" y1="205" x2="400" y2="205" stroke="#3d2010" strokeWidth="1" />

              {/* Horse body — extended trot, stretched forward */}
              {/* Main barrel */}
              <ellipse cx="210" cy="148" rx="90" ry="34" fill="#c9a84c" opacity="0.75" />
              {/* Neck arched forward */}
              <path d="M280 130 Q310 105 315 88 Q318 78 310 72 Q302 66 295 75 Q290 83 285 98 Q275 115 268 128 Z" fill="#c9a84c" opacity="0.75" />
              {/* Head in flexion — poll at highest point */}
              <ellipse cx="308" cy="66" rx="18" ry="10" transform="rotate(-20 308 66)" fill="#c9a84c" opacity="0.75" />
              {/* Nose/muzzle extended */}
              <path d="M318 60 Q330 58 334 63 Q330 70 318 70 Z" fill="#c9a84c" opacity="0.70" />
              {/* Eye */}
              <circle cx="314" cy="62" r="2" fill="#1a0f08" />
              {/* Ear */}
              <path d="M303 57 Q306 48 310 50 Q308 58 305 59 Z" fill="#c9a84c" opacity="0.70" />

              {/* Tail flowing behind */}
              <path d="M120 145 Q95 140 80 160 Q72 175 85 185 Q90 178 88 168 Q100 155 118 155 Z" fill="#c9a84c" opacity="0.60" />

              {/* Extended trot legs — diagonal pairs */}
              {/* Front left (leading diagonal) — reaching far forward */}
              <path d="M270 175 Q275 155 285 145 Q292 138 295 145 Q290 155 285 165 Q280 178 278 200" stroke="#c9a84c" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.80" />
              {/* Front right — extended forward in air */}
              <path d="M255 170 Q258 148 268 135 Q276 128 280 136 Q276 148 270 160 Q264 174 262 200" stroke="#c9a84c" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.80" />
              {/* Hind right — pushing off behind */}
              <path d="M150 175 Q140 158 128 152 Q120 148 118 156 Q122 165 130 172 Q140 182 142 200" stroke="#c9a84c" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.80" />
              {/* Hind left — elevated and extended */}
              <path d="M168 172 Q158 150 145 140 Q135 133 134 143 Q140 154 148 165 Q158 178 160 200" stroke="#c9a84c" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.80" />

              {/* Rider — dressage position, upright and tall */}
              {/* Seat / pelvis on horse */}
              <ellipse cx="220" cy="118" rx="18" ry="9" fill="#2d5a27" opacity="0.85" />
              {/* Torso — upright */}
              <rect x="214" y="82" width="14" height="38" rx="6" fill="#2d5a27" opacity="0.85" />
              {/* Head */}
              <circle cx="221" cy="70" r="11" fill="#2d5a27" opacity="0.85" />
              {/* Top hat */}
              <rect x="213" y="58" width="16" height="5" rx="2" fill="#1a0f08" opacity="0.90" />
              <rect x="215" y="44" width="12" height="15" rx="2" fill="#1a0f08" opacity="0.90" />
              {/* Arms extended with reins */}
              <path d="M214 95 Q195 102 185 108 Q178 113 175 120" stroke="#2d5a27" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.80" />
              <path d="M228 95 Q242 100 250 104 Q260 108 270 112" stroke="#2d5a27" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.80" />
              {/* Reins to bit */}
              <path d="M175 120 Q200 118 240 108 Q270 100 295 85" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.55" strokeDasharray="4 3" />
              <path d="M270 112 Q285 104 300 92 Q308 84 310 78" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.55" strokeDasharray="4 3" />
              {/* Legs / boots */}
              <path d="M220 125 Q215 148 212 175 Q212 190 210 200" stroke="#1a0f08" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.85" />
              <path d="M222 126 Q228 149 230 175 Q230 190 232 200" stroke="#1a0f08" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.85" />
              {/* Boot tops */}
              <rect x="205" y="170" width="11" height="22" rx="3" fill="#1a0f08" opacity="0.85" />
              <rect x="226" y="170" width="11" height="22" rx="3" fill="#1a0f08" opacity="0.85" />

              {/* Gold accent lines — decorative dressage arena markers */}
              <line x1="20" y1="210" x2="50" y2="210" stroke="#c9a84c" strokeWidth="1" opacity="0.35" />
              <line x1="370" y1="210" x2="400" y2="210" stroke="#c9a84c" strokeWidth="1" opacity="0.35" />
              <text x="35" y="218" fill="#c9a84c" opacity="0.35" fontSize="8" fontFamily="serif" fontStyle="italic">A</text>
              <text x="385" y="218" fill="#c9a84c" opacity="0.35" fontSize="8" fontFamily="serif" fontStyle="italic">C</text>
            </svg>

            <h1 className="eq-hero-h1">
              <span className="gold">Equestrian</span>{' '}
              <span className="green">Science</span>
            </h1>

            <div className="eq-hero-rule" />

            <p className="eq-hero-sub">
              3–5 G through the lumbar spine at every sitting trot stride.<br />
              66% of elite riders carry chronic back pain. The physiology of<br />
              the most technically demanding of all Olympic sports.
            </p>

            <div className="eq-hero-numerics">
              <div>
                <div className="eq-hero-num">3–5<span className="unit"> G</span></div>
                <div className="eq-hero-num-label">Sitting trot spinal load</div>
              </div>
              <div className="eq-hero-divider" />
              <div>
                <div className="eq-hero-num">90<span className="unit">%</span></div>
                <div className="eq-hero-num-label">HRmax cross-country</div>
              </div>
              <div className="eq-hero-divider" />
              <div>
                <div className="eq-hero-num">66<span className="unit">%</span></div>
                <div className="eq-hero-num-label">Elite LBP prevalence</div>
              </div>
            </div>
          </section>

          {/* ── Key Stats ── */}
          <div className="eq-stats-grid">
            {KEY_STATS.map(s => (
              <div key={s.label} className="eq-stat-card">
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:s.color}} />
                <div className="eq-stat-val" style={{color:s.color}}>{s.value}</div>
                <div className="eq-stat-label">{s.label}</div>
                <div className="eq-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Cardiovascular Intensity Chart ── */}
          <div className="eq-chart">
            <div className="eq-chart-eyebrow">Cardiovascular Intensity by Discipline</div>
            <div className="eq-chart-title">Heart Rate as % of Maximum</div>
            <div className="eq-chart-sub">Sustained intensity during competition phases — elite equestrian athletes</div>
            <div className="eq-chart-rows">
              {CV_DISCIPLINES.map(d => (
                <div key={d.discipline} className="eq-chart-row">
                  <div className="eq-chart-disc" style={{color: d.color}}>{d.discipline}</div>
                  <div className="eq-chart-wrap">
                    <div className="eq-chart-track">
                      <div className="eq-chart-fill" style={{width:`${d.barPct}%`, background: d.color}} />
                    </div>
                    <div className="eq-chart-row-desc">{d.desc}</div>
                  </div>
                  <div className="eq-chart-pct" style={{color: d.color}}>{d.display}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Science Cards ── */}
          <div className="eq-cards">
            {SCIENCE_CARDS.map(card => (
              <div key={card.id} className="eq-card">
                <div className="eq-card-accent-bar" style={{background: card.accent}} />
                <div className="eq-card-number">{card.number}</div>
                <div className="eq-card-kicker" style={{color: card.accent}}>
                  {card.icon} Science Card {card.number}
                </div>
                <div className="eq-card-title">{card.title}</div>
                <div className="eq-findings">
                  {card.findings.map((f, i) => (
                    <div key={i} className="eq-finding" style={{borderLeftColor: `${card.accent}55`}}>
                      <div className="eq-finding-stat">
                        <div className="eq-finding-stat-val" style={{color: card.accent}}>{f.stat}</div>
                        <div className="eq-finding-stat-lbl">{f.statLabel}</div>
                      </div>
                      <div className="eq-finding-body">
                        <div className="eq-finding-citation">{f.citation}</div>
                        <div className="eq-finding-detail">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Discipline Comparison Table ── */}
          <div className="eq-table-wrap">
            <div className="eq-table-eyebrow">Discipline Comparison</div>
            <div className="eq-table-heading">Physical Profile by Equestrian Discipline</div>
            <table className="eq-table">
              <thead>
                <tr>
                  <th>Discipline</th>
                  <th>Primary Demand</th>
                  <th>VO₂max Target</th>
                  <th>HR Range</th>
                  <th>Injury Risk</th>
                  <th>Primary Injury</th>
                </tr>
              </thead>
              <tbody>
                {DISCIPLINE_GRID.map(row => (
                  <tr key={row.discipline}>
                    <td>{row.discipline}</td>
                    <td>{row.demand}</td>
                    <td className="mono" style={{color:'#c9a84c'}}>{row.vo2} mL/kg/min</td>
                    <td className="mono" style={{color:'#c9a84c'}}>{row.hr}</td>
                    <td style={{color: row.injury === 'High' ? '#c9a84c' : row.injury === 'Medium' ? '#8b7040' : '#4a7a44'}}>{row.injury}</td>
                    <td style={{fontStyle:'italic'}}>{row.primary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Disclaimer ── */}
          <div className="eq-disclaimer">
            <div className="eq-disclaimer-text">
              All performance data, cardiovascular parameters, and injury statistics are drawn from peer-reviewed equestrian sports science research, biomechanics studies, and epidemiological literature. Data reflects elite competitive equestrian athletes across Olympic and international disciplines. Individual requirements vary significantly by discipline, competitive level, horse, and athlete physiology. Equestrian science is an evolving field; where discipline-specific data is limited, extrapolations from analogous sports or general sports science principles are noted. This content is for educational purposes only; consult qualified sports medicine practitioners and equine professionals for individualised assessment and programming.
            </div>
          </div>

        </main>
      </div>
    </>
  )
}

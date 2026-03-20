// Heart Rate Recovery Science — static server component
// Evidence-based guide covering HRR physiology, cardiovascular mortality,
// training for improved HRR, and clinical monitoring.

import Link from 'next/link'
import { ArrowLeft, HeartPulse, Activity, TrendingUp, FlaskConical, AlertTriangle } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Heart Rate Recovery Science' }

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '4×',
    label: 'Mortality Risk',
    sub: 'HRR ≤12 bpm at 1 min → 6-year all-cause mortality (Cole 1999, NEJM)',
    accent: '#ef4444',
  },
  {
    value: '40%',
    label: 'Faster Vagal Recovery',
    sub: 'High-fit vs untrained at same %VO₂max (Hautala 2003, Am J Physiol)',
    accent: '#f97316',
  },
  {
    value: '50%',
    label: 'Lower CHD Mortality',
    sub: 'Highest vs lowest HRR quartile over 23 years (Jouven 2005, NEJM)',
    accent: '#22c55e',
  },
]

// ─── HRR Reference Table Data ─────────────────────────────────────────────────

const HRR_TABLE_PASSIVE = [
  { category: 'Excellent', range: '>25 bpm', color: '#22c55e', width: '100%' },
  { category: 'Good',      range: '20–25 bpm', color: '#84cc16', width: '80%' },
  { category: 'Normal',    range: '12–19 bpm', color: '#eab308', width: '56%' },
  { category: 'Abnormal',  range: '<12 bpm',  color: '#ef4444', width: '30%' },
]

const HRR_TABLE_ACTIVE = [
  { category: 'Excellent',  range: '>22 bpm', color: '#22c55e', width: '100%' },
  { category: 'Good',       range: '18–22 bpm', color: '#84cc16', width: '78%' },
  { category: 'Suboptimal', range: '<18 bpm', color: '#f97316', width: '42%' },
]

// ─── Science Cards Data ───────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'physiology',
    title: 'HRR Physiology & Mechanisms',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.07)',
    accentBorder: 'rgba(239,68,68,0.22)',
    accentPill: 'rgba(239,68,68,0.14)',
    iconSymbol: '♥',
    iconColor: '#fca5a5',
    findings: [
      {
        citation: 'Imai 1994 — Lancet',
        detail:
          'HRR1 = peak HR − HR at 1 minute post-exercise. First demonstration that HRR is mediated by parasympathetic (vagal) reactivation, not sympathetic withdrawal. HRR2 reflects both vagal reactivation AND sympathetic withdrawal, making HRR1 the "pure" vagal marker. Speed of vagal reactivation correlates with resting HRV — connecting two of the most valuable autonomic biomarkers available from consumer wearables.',
        stat: 'HRR1 = pure vagal marker; HRR2 = vagal + sympathetic withdrawal',
      },
      {
        citation: 'Hautala 2003 — American Journal of Physiology',
        detail:
          'High-fit individuals reactivate vagal tone 40% faster than untrained individuals at the same relative exercise intensity (%VO₂max). Endurance training shifts the autonomic set point toward higher resting parasympathetic tone. Critically, HRR improves before VO₂max in early training phases — making it an early and sensitive adaptation indicator that can motivate adherence before cardiovascular fitness gains become measurable.',
        stat: 'High-fit: 40% faster vagal reactivation; HRR improves before VO₂max',
      },
      {
        citation: 'Daanen 2012 — Sports Medicine',
        detail:
          'Temporal breakdown: HRR1 = parasympathetic reactivation; HRR2–5 = vagal recovery + sympathetic withdrawal + catecholamine clearance. HRR improves with: aerobic training, quality sleep, hydration, low psychological stress, and absence of upper respiratory tract infection (URTI). A decline of 5+ bpm below personal daily baseline indicates incomplete recovery, overreaching, or sub-clinical illness — before subjective symptoms appear.',
        stat: '5+ bpm below personal baseline = incomplete recovery or illness flag',
      },
      {
        citation: 'Pierpont 2000 — American Heart Journal',
        detail:
          'HRR is 3–8 bpm higher with active recovery (walking) versus passive rest — making protocol standardisation critical for valid comparisons. The clinical standard is the Bruce treadmill protocol followed by 1 minute of passive standing. Clinical thresholds: HRR <12 bpm (passive) or <18 bpm (active) = abnormal per AHA guidelines. Active recovery HRR on Apple Watch is therefore expected to be higher than passive clinical cut-points.',
        stat: 'Active vs passive: +3–8 bpm; AHA abnormal: <12 passive, <18 active',
      },
    ],
  },
  {
    id: 'mortality',
    title: 'HRR & Cardiovascular Mortality',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.07)',
    accentBorder: 'rgba(249,115,22,0.22)',
    accentPill: 'rgba(249,115,22,0.14)',
    iconSymbol: '⚠',
    iconColor: '#fdba74',
    findings: [
      {
        citation: 'Cole 1999 — New England Journal of Medicine',
        detail:
          'Landmark study of 9,454 patients: HRR ≤12 bpm at 1 minute post-exercise was associated with 4× higher 6-year all-cause mortality. This association remained independent of VO₂max, exercise workload, and traditional cardiovascular risk factors. In patients with known coronary artery disease (CAD), HRR predicted mortality more strongly than VO₂max itself. An HRR <12 bpm should trigger further cardiac evaluation.',
        stat: 'HRR ≤12 bpm → 4× 6-year all-cause mortality; independent of VO₂max',
      },
      {
        citation: 'Nishime 2000 — JAMA',
        detail:
          '12-year follow-up of 5,234 patients: HRR ≤18 bpm at 2 minutes post-exercise was associated with 2.6× higher 12-year all-cause mortality. Every 10 bpm improvement in HRR reduces mortality risk by approximately 15–20%. Crucially, this predictive relationship was maintained in populations without known heart disease — establishing HRR as a primary prevention biomarker, not merely a cardiac rehabilitation metric.',
        stat: 'HRR ≤18 bpm at 2 min → 2.6× 12-year mortality; +10 bpm = −15–20% risk',
      },
      {
        citation: 'Morshedi-Meibodi 2002 — Circulation',
        detail:
          'Framingham Heart Study (3,837 adults): poor HRR (≤42 bpm at 2 minutes) was associated with 2× higher 8-year CVD events versus good HRR (>62 bpm at 2 minutes). HRR was a better predictor than the Framingham Risk Score alone, and adding HRR to standard risk models significantly improved the C-statistic. HRR is now recognised as an independent CVD risk factor in AHA/ACC clinical guidelines.',
        stat: 'Framingham: poor HRR → 2× CVD events; better predictor than Framingham Risk Score',
      },
      {
        citation: 'Shetler 2001 — Journal of the American College of Cardiology',
        detail:
          'HRR identifies autonomic dysfunction via a distinct mechanism from ischaemic ST changes on ECG — the two abnormalities are additive, not overlapping. Combined abnormal ST depression + abnormal HRR = 8× higher mortality versus neither abnormality. The combination of HRR + VO₂max is the most powerful non-invasive cardiac risk stratification available without cardiac catheterisation.',
        stat: 'Abnormal ST + abnormal HRR = 8× mortality vs neither; most powerful non-invasive combo',
      },
    ],
  },
  {
    id: 'training',
    title: 'Improving HRR with Training',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.07)',
    accentBorder: 'rgba(34,197,94,0.22)',
    accentPill: 'rgba(34,197,94,0.14)',
    iconSymbol: '↑',
    iconColor: '#86efac',
    findings: [
      {
        citation: 'Pichot 2000 — Journal of Applied Physiology',
        detail:
          '5-week intensified training followed by a 3-week taper in elite runners showed HRR1 improved by 8 bpm during the taper phase (supercompensation). HRR tracks training adaptation more sensitively than resting heart rate. In sedentary individuals, 8–12 weeks of aerobic training improves HRR1 by 5–10 bpm through increased resting vagal tone — detectable on Apple Watch before VO₂max estimates shift meaningfully.',
        stat: '+8 bpm HRR1 with taper supercompensation; +5–10 bpm in 8–12 weeks (sedentary)',
      },
      {
        citation: 'Jouven 2005 — New England Journal of Medicine',
        detail:
          '23-year follow-up of 5,713 asymptomatic working men: the highest HRR quartile had 50% lower coronary heart disease mortality compared to the lowest quartile. This association held after adjustment for VO₂max — confirming a direct autonomous mechanism, not simply a proxy for fitness. Improving HRR is therefore a physiologically valid, independent target for CVD risk reduction, not merely a side-effect of fitness gains.',
        stat: 'Highest vs lowest HRR quartile: 50% lower CHD mortality; VO₂max-independent',
      },
      {
        citation: 'Lamberts 2011 — International Journal of Sports Physiology & Performance',
        detail:
          'Daily HRR monitoring in elite cyclists: HRR1 below the 5-day rolling average showed 80% sensitivity for detecting overtraining and illness, more sensitive than morning resting heart rate alone. Combining HRR1 + morning resting HR raised sensitivity to 91%. HRR responds to sleep quality, hydration status, and tapered training load — supporting its use as a daily readiness metric even in non-elite athletes using consumer wearables.',
        stat: 'HRR1 below 5-day avg: 80% sensitivity for overtraining/illness; +RHR = 91%',
      },
      {
        citation: 'Yamamoto 2001 (Med Sci Sports Exerc) & Bhattacharya 2022',
        detail:
          'HIIT (4×4 min at 90% HRmax) improves HRR1 faster than moderate-intensity training: 7 bpm in 8 weeks versus 4 bpm with moderate training. Yoga pranayama (controlled breathing practice) also improves HRR1 by 6 bpm in 8 weeks (Bhattacharya 2022). Both exercise and mindfulness practices converge on the vagal pathway — reflecting that HRR improvement equals cardiac autonomic health improvement across diverse training modalities.',
        stat: 'HIIT: +7 bpm HRR1 in 8 wks vs moderate +4 bpm; pranayama: +6 bpm',
      },
    ],
  },
  {
    id: 'monitoring',
    title: 'HRR Monitoring & Clinical Use',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.07)',
    accentBorder: 'rgba(59,130,246,0.22)',
    accentPill: 'rgba(59,130,246,0.14)',
    iconSymbol: '◎',
    iconColor: '#93c5fd',
    findings: [
      {
        citation: 'Apple Watch HRR Measurement',
        detail:
          'Post-workout HRR is measured via the optical heart rate sensor during 1–3 minutes of active cool-down (walking) after outdoor runs and walks with GPS enabled. Accuracy: ±3–5 bpm versus ECG reference. Results appear in the Fitness app under Heart Rate Recovery. Apple uses a 1-minute active recovery protocol. Normal reference: ≥18 bpm active; ≥22 bpm = excellent cardiovascular fitness per active recovery norms.',
        stat: 'Accuracy ±3–5 bpm vs ECG; normal ≥18 bpm; excellent ≥22 bpm (active 1-min)',
      },
      {
        citation: 'Clinical Classification & Confounding Factors',
        detail:
          'Passive 1-minute recovery thresholds: >25 bpm excellent, 20–25 bpm good, 12–19 bpm normal, <12 bpm abnormal (AHA). Active 1-minute: >22 bpm excellent, 18–22 bpm good, <18 bpm suboptimal. Factors that lower HRR: heat/humidity, dehydration, caffeine withdrawal, sleep deprivation, illness, overtraining. Factors that improve HRR: cool environment, full hydration, adequate recovery, tapered training load. Track trends over weeks rather than reacting to single values.',
        stat: 'Key confounders: heat, dehydration, poor sleep, caffeine withdrawal',
      },
      {
        citation: 'Heart Rate Reserve — Karvonen Method (Important Distinction)',
        detail:
          'HRR (Heart Rate Reserve) for training zones uses the Karvonen formula: HRmax − Resting HR. This is DIFFERENT from HRR (Heart Rate Recovery) after exercise. Karvonen target HR = RHR + (HRmax − RHR) × intensity%. Zone ranges: Z1 = 50–60%, Z2 = 60–70%, Z3 = 70–80%, Z4 = 80–90%, Z5 = 90–100%. A higher Heart Rate Reserve indicates greater aerobic fitness range. These two HRR acronyms are frequently confused in fitness literature.',
        stat: 'HRR (reserve) = HRmax − RHR ≠ HRR (recovery) = peak − 1-min post-exercise',
      },
      {
        citation: 'Laukkanen 2018 — JAMA Internal Medicine',
        detail:
          '20-year follow-up of 2,315 Finnish men (KIHD study): 4–7 sauna sessions per week reduced all-cause mortality by 40% and CVD mortality by 50% versus once weekly. The proposed mechanism includes improved autonomic balance, plasma volume expansion, and HRR enhancement. Regular sauna use raises HR to 100–150 bpm followed by rapid recovery, and improves HRR1 to a degree similar to moderate aerobic exercise. Sauna + aerobic exercise produce additive HRR improvement.',
        stat: '4–7 sauna/week: −40% all-cause, −50% CVD mortality; additive with aerobic exercise',
      },
    ],
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
        minWidth: 160,
      }}
    >
      <p
        style={{
          fontSize: 34,
          fontWeight: 900,
          color: accent,
          margin: 0,
          letterSpacing: '-1px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', margin: '8px 0 4px' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.45 }}>{sub}</p>
    </div>
  )
}

function FindingRow({
  citation,
  detail,
  stat,
  accent,
}: {
  citation: string
  detail: string
  stat: string
  accent: string
}) {
  return (
    <div style={{ padding: '16px 18px', borderBottom: '1px solid #1a1a1a' }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#94a3b8',
          margin: '0 0 7px',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        {citation}
      </p>
      <p style={{ fontSize: 13, color: '#cbd5e1', margin: '0 0 11px', lineHeight: 1.65 }}>{detail}</p>
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
          lineHeight: 1.4,
        }}
      >
        {stat}
      </p>
    </div>
  )
}

function ScienceCard({
  iconSymbol,
  iconColor,
  title,
  accent,
  accentBg,
  accentBorder,
  accentPill,
  findings,
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
            width: 38,
            height: 38,
            borderRadius: 10,
            background: accentPill,
            border: `1px solid ${accentBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: iconColor,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              lineHeight: 1,
            }}
          >
            {iconSymbol}
          </span>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>{title}</h2>
      </div>

      {/* Findings */}
      {findings.map((f, i) => (
        <FindingRow key={i} {...f} accent={accent} />
      ))}
    </div>
  )
}

// ─── HRR Reference Table ──────────────────────────────────────────────────────

function HRRReferenceTable() {
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
          HRR Clinical Reference Table
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
          Heart Rate Recovery fitness categories — 1-minute post-exercise; passive vs active protocol
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        }}
      >
        {/* Passive Protocol */}
        <div style={{ padding: '20px 20px', borderRight: '1px solid #1f1f1f' }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              margin: '0 0 14px',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            1-Min Passive Recovery (AHA / Bruce Protocol)
          </p>
          {HRR_TABLE_PASSIVE.map((row) => (
            <div key={row.category} style={{ marginBottom: 14 }}>
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
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: row.color,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
                    {row.category}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: row.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {row.range}
                </span>
              </div>
              <div style={{ height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: row.width,
                    background: `linear-gradient(90deg, ${row.color}55, ${row.color}cc)`,
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          ))}
          <p
            style={{
              fontSize: 11,
              color: '#334155',
              margin: '8px 0 0',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            Passive = standing still. Clinical standard. Lower values expected vs active recovery.
          </p>
        </div>

        {/* Active Protocol */}
        <div style={{ padding: '20px 20px' }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              margin: '0 0 14px',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            1-Min Active Recovery (Apple Watch / Walking Cool-Down)
          </p>
          {HRR_TABLE_ACTIVE.map((row) => (
            <div key={row.category} style={{ marginBottom: 14 }}>
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
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: row.color,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
                    {row.category}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: row.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {row.range}
                </span>
              </div>
              <div style={{ height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: row.width,
                    background: `linear-gradient(90deg, ${row.color}55, ${row.color}cc)`,
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          ))}
          <p
            style={{
              fontSize: 11,
              color: '#334155',
              margin: '8px 0 0',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            Active = walking cool-down. Apple Watch uses this protocol. Expect 3–8 bpm higher than passive.
          </p>
        </div>
      </div>

      {/* Protocol note */}
      <div
        style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid #1a1a1a',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.55 }}>
          <span style={{ color: '#94a3b8', fontWeight: 700 }}>Protocol matters:</span> HRR values are
          3–8 bpm higher with active (walking) versus passive (standing) recovery. Always compare
          like-for-like. Track your personal trend over weeks — a sustained 5+ bpm drop below your
          baseline is more clinically meaningful than any single reading.
        </p>
      </div>
    </div>
  )
}

// ─── HRR vs HRR Distinction Panel ─────────────────────────────────────────────

function HRRDistinctionPanel() {
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
          background: 'rgba(234,179,8,0.07)',
          borderBottom: '1px solid rgba(234,179,8,0.2)',
          borderLeft: '3px solid #eab308',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'rgba(234,179,8,0.15)',
            border: '1px solid rgba(234,179,8,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: '#fde047',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            !
          </span>
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            HRR: Two Different Metrics — Common Confusion
          </h2>
          <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
            "HRR" is used for two distinct physiological concepts in fitness science
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 0,
        }}
      >
        {/* Recovery */}
        <div
          style={{
            padding: '20px 20px',
            borderRight: '1px solid #1f1f1f',
            borderBottom: '1px solid #1f1f1f',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#fca5a5',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              HRR (Recovery)
            </span>
          </div>
          <p
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#ef4444',
              margin: '0 0 6px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              letterSpacing: '-0.5px',
            }}
          >
            Peak HR − HR₁ₘᵢₙ
          </p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.55 }}>
            Drop in heart rate during the first minute after stopping exercise. Measures parasympathetic
            reactivation speed. Higher = better cardiac autonomic function.
          </p>
          <ul style={{ margin: 0, padding: '0 0 0 12px', listStyle: 'none' }}>
            {[
              'Autonomic nervous system health',
              'Cardiovascular mortality predictor',
              'Recovery readiness metric',
              'Sensitive to overtraining & illness',
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  marginBottom: 4,
                  paddingLeft: 8,
                  position: 'relative',
                  lineHeight: 1.45,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: -4,
                    top: 6,
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#ef4444',
                    opacity: 0.6,
                    display: 'inline-block',
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Reserve */}
        <div style={{ padding: '20px 20px', borderBottom: '1px solid #1f1f1f' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.3)',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#93c5fd',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              HRR (Reserve) — Karvonen
            </span>
          </div>
          <p
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#3b82f6',
              margin: '0 0 6px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              letterSpacing: '-0.5px',
            }}
          >
            HRmax − RHR
          </p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.55 }}>
            The range of heart rate available for exercise. Used in the Karvonen formula to calculate
            personalised training zones. Higher reserve = greater aerobic fitness range.
          </p>
          <ul style={{ margin: 0, padding: '0 0 0 12px', listStyle: 'none' }}>
            {[
              'Zone 1: 50–60% of HRR + RHR',
              'Zone 2: 60–70% of HRR + RHR',
              'Zone 3: 70–80% of HRR + RHR',
              'Zone 4–5: 80–100% of HRR + RHR',
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  marginBottom: 4,
                  paddingLeft: 8,
                  position: 'relative',
                  lineHeight: 1.45,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: -4,
                    top: 6,
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#3b82f6',
                    opacity: 0.6,
                    display: 'inline-block',
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Visual formula row */}
      <div style={{ padding: '16px 20px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0d0d0d',
            borderRadius: 10,
            border: '1px solid #1a1a1a',
            padding: '14px 16px',
          }}
        >
          <span
            style={{
              padding: '7px 14px',
              borderRadius: 7,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              fontSize: 13,
              fontWeight: 800,
              color: '#fca5a5',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              whiteSpace: 'nowrap',
            }}
          >
            Recovery HRR = Peak HR − HR₁ₘᵢₙ
          </span>
          <span style={{ fontSize: 18, color: '#334155', fontWeight: 700 }}>≠</span>
          <span
            style={{
              padding: '7px 14px',
              borderRadius: 7,
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.3)',
              fontSize: 13,
              fontWeight: 800,
              color: '#93c5fd',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              whiteSpace: 'nowrap',
            }}
          >
            Reserve HRR = HRmax − RHR
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Autonomic Recovery Timeline ──────────────────────────────────────────────

function RecoveryTimeline() {
  const phases = [
    {
      label: 'HRR1 (0–1 min)',
      mechanism: 'Parasympathetic (vagal) reactivation',
      color: '#ef4444',
      detail: 'Pure vagal marker. Fastest and most clinically validated window.',
    },
    {
      label: 'HRR2 (1–2 min)',
      mechanism: 'Vagal recovery + early sympathetic withdrawal',
      color: '#f97316',
      detail: 'Mixed autonomic signal. Also strongly predictive of CVD mortality (Nishime 2000).',
    },
    {
      label: 'HRR3–5 (2–5 min)',
      mechanism: 'Catecholamine clearance + full sympathetic withdrawal',
      color: '#eab308',
      detail: 'Slower hormonal and neurohumoral normalisation phase.',
    },
    {
      label: 'Full Recovery (5–60 min)',
      mechanism: 'Metabolic & thermoregulatory normalisation',
      color: '#22c55e',
      detail: 'Lactate, core temperature, and plasma volume return to baseline.',
    },
  ]

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
          background: 'rgba(239,68,68,0.07)',
          borderBottom: '1px solid rgba(239,68,68,0.18)',
          borderLeft: '3px solid #ef4444',
          padding: '14px 18px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          Post-Exercise Recovery Timeline
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
          Autonomic phases following peak exercise — Daanen 2012 (Sports Medicine)
        </p>
      </div>

      <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {phases.map((phase, idx) => (
          <div key={phase.label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {/* Timeline dot + line */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexShrink: 0,
                width: 20,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: phase.color,
                  border: `2px solid ${phase.color}55`,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              {idx < phases.length - 1 && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 20,
                    marginTop: 4,
                    background: `linear-gradient(180deg, ${phase.color}44, transparent)`,
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: idx < phases.length - 1 ? 8 : 0 }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'baseline',
                  gap: '4px 10px',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: phase.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {phase.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                  {phase.mechanism}
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                {phase.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HRRSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f8fafc' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div
        style={{
          background:
            'linear-gradient(160deg, #0a0a0a 0%, #130808 30%, #0e1008 60%, #0a0a0a 100%)',
          borderBottom: '1px solid #1f1010',
          paddingTop: 56,
          paddingBottom: 48,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative concentric rings — evoke a heartbeat monitor */}
        {[700, 480, 300, 160].map((size, i) => (
          <div
            key={size}
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: size,
              height: size,
              borderRadius: '50%',
              border: `1px solid rgba(239,68,68,${0.03 + i * 0.025})`,
              pointerEvents: 'none',
            }}
          />
        ))}

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 720,
            margin: '0 auto',
            padding: '0 24px',
          }}
        >
          {/* Back link */}
          <div style={{ marginBottom: 20 }}>
            <Link
              href="/explore"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: '#475569',
                textDecoration: 'none',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                letterSpacing: '0.5px',
                padding: '5px 10px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              ← Back to Explore
            </Link>
          </div>

          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: '#ef4444',
              margin: '0 0 14px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            Cardiac Autonomic Science
          </p>
          <h1
            style={{
              fontSize: 'clamp(30px, 6vw, 52px)',
              fontWeight: 900,
              margin: '0 0 18px',
              lineHeight: 1.08,
              letterSpacing: '-1.5px',
              background:
                'linear-gradient(135deg, #f8fafc 0%, #fca5a5 35%, #f97316 65%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Heart Rate Recovery
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
            The parasympathetic physiology, cardiovascular mortality evidence, and training science
            behind one of medicine's most powerful non-invasive autonomic biomarkers.
          </p>

          {/* Topic pills */}
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
              { label: 'Vagal Physiology', color: '#ef4444' },
              { label: 'CVD Mortality', color: '#f97316' },
              { label: 'Training Adaptation', color: '#22c55e' },
              { label: 'Clinical Monitoring', color: '#3b82f6' },
            ].map((tag) => (
              <span
                key={tag.label}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: `${tag.color}18`,
                  border: `1px solid ${tag.color}33`,
                  fontSize: 11,
                  fontWeight: 700,
                  color: tag.color,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Key Stats ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 20px 0' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {KEY_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* ── HRR vs HRR Distinction ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 920, margin: '24px auto 0', padding: '0 20px' }}>
        <HRRDistinctionPanel />
      </div>

      {/* ── Recovery Timeline ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 920, margin: '24px auto 0', padding: '0 20px' }}>
        <RecoveryTimeline />
      </div>

      {/* ── HRR Reference Table ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 920, margin: '24px auto 0', padding: '0 20px' }}>
        <HRRReferenceTable />
      </div>

      {/* ── Section label ─────────────────────────────────────────────────────── */}
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
          Peer-Reviewed Evidence
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

      {/* ── Science Cards ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 920, margin: '20px auto 0', padding: '0 20px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.id} {...card} />
          ))}
        </div>

        {/* Disclaimer */}
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
            <span style={{ color: '#94a3b8', fontWeight: 700 }}>Evidence note: </span>
            Mortality statistics are derived from observational cohorts and large prospective studies
            (Cole 1999 NEJM, Nishime 2000 JAMA, Morshedi-Meibodi 2002 Circulation, Jouven 2005 NEJM,
            Lamberts 2011, Laukkanen 2018 JAMA Intern Med). Effect sizes reflect relative risk from
            population data; individual results vary. HRR thresholds are guidelines, not diagnostics.
            An abnormal single reading is not grounds for alarm — sustained patterns matter.
            Consult a cardiologist if you have known heart disease or persistent abnormal HRR values.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

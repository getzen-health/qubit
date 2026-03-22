// HRV Science — static server component
// Evidence-based guide covering HRV physiology, health outcomes,
// HRV-guided training, measurement norms, and Apple Watch interpretation.

import Link from 'next/link'
import { ArrowLeft, Brain, HeartPulse, Activity, Watch } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'HRV Science' }

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '50+ ms',
    label: 'Healthy SDNN',
    sub: 'Resting 5-min SDNN threshold (Task Force 1996, Circulation)',
    accent: '#a855f7',
  },
  {
    value: '32–45%',
    label: 'Higher Mortality',
    sub: 'Lowest HRV quartile vs highest (Thayer 2010, Neurosci Biobehav Rev)',
    accent: '#3b82f6',
  },
  {
    value: 'r = 0.72',
    label: 'Training Correlation',
    sub: 'HRV 7-day trend vs performance — highest of any wearable biomarker (Plews 2013)',
    accent: '#22c55e',
  },
  {
    value: 'r = 0.94',
    label: 'Apple Watch Accuracy',
    sub: 'PPG SDNN vs ECG reference (Bumgarner 2018, J Am Heart Assoc)',
    accent: '#f97316',
  },
]

// ─── SDNN Norms by Age & Fitness ──────────────────────────────────────────────

const SDNN_NORMS = [
  { age: '20s', sedentary: '35–55', average: '55–80', trained: '80–110', color: '#a855f7' },
  { age: '30s', sedentary: '30–45', average: '45–70', trained: '70–100', color: '#8b5cf6' },
  { age: '40s', sedentary: '25–40', average: '35–60', trained: '60–90',  color: '#7c3aed' },
  { age: '50s', sedentary: '20–35', average: '30–50', trained: '50–75',  color: '#6d28d9' },
  { age: '60s', sedentary: '18–30', average: '25–45', trained: '45–65',  color: '#5b21b6' },
  { age: '70+', sedentary: '15–25', average: '20–40', trained: '38–55',  color: '#4c1d95' },
]

// ─── HRV Traffic Light System ─────────────────────────────────────────────────

const TRAFFIC_LIGHT = [
  {
    signal: 'Green',
    condition: 'HRV ≥5% above 7-day rolling average',
    action: 'Train hard',
    detail: 'Nervous system is primed. High-intensity or heavy strength session. Best time to set PRs or do race-pace work.',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
    accent: '#22c55e',
    dot: '#22c55e',
    label: 'GO',
  },
  {
    signal: 'Amber',
    condition: 'HRV within ±5% of 7-day rolling average',
    action: 'Moderate intensity',
    detail: 'Normal recovery state. Zone 2 cardio, moderate strength, or skill work. Avoid maximal efforts. Listen to body.',
    bg: 'rgba(234,179,8,0.08)',
    border: 'rgba(234,179,8,0.25)',
    accent: '#eab308',
    dot: '#eab308',
    label: 'CAUTION',
  },
  {
    signal: 'Red',
    condition: 'HRV ≥7% below 7-day rolling average OR 3+ consecutive days falling',
    action: 'Rest or very easy',
    detail: 'Autonomic stress detected. Active recovery walk, yoga, or full rest. Investigate stressors: sleep, alcohol, illness, overtraining.',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    accent: '#ef4444',
    dot: '#ef4444',
    label: 'STOP',
  },
]

// ─── Science Cards Data ───────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'physiology',
    title: 'HRV Physiology & Autonomic Nervous System',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.07)',
    accentBorder: 'rgba(168,85,247,0.22)',
    accentPill: 'rgba(168,85,247,0.14)',
    iconSymbol: '⚡',
    iconColor: '#d8b4fe',
    findings: [
      {
        citation: 'Task Force 1996 — Circulation (the definitive HRV standards paper)',
        detail:
          'SDNN reflects total autonomic variability and is the standard summary metric. RMSSD reflects specifically parasympathetic (vagal) activity — the value Apple Watch primarily captures overnight. LF power (0.04–0.15 Hz) represents mixed sympatho-vagal influence. HF power (0.15–0.4 Hz) represents pure vagal tone. Apple Watch reports SDNN from 5-minute overnight measurements. Healthy adults: SDNN 20–200 ms; a value above 50 ms is considered healthy. RMSSD tracks training load better than SDNN in athletes due to its parasympathetic specificity.',
        stat: 'SDNN >50 ms = healthy; Apple Watch uses SDNN from overnight 5-min windows',
      },
      {
        citation: 'Berntson 1997 — Psychophysiology',
        detail:
          'The heart receives dual autonomic innervation. Parasympathetic input via the vagus nerve (acetylcholine) causes bradycardia and increases HRV. Sympathetic input (norepinephrine/epinephrine) causes tachycardia and reduces HRV. At rest, parasympathetic tone dominates — the "vagal brake." HRV fundamentally reflects the beat-to-beat competition between sympathetic acceleration and parasympathetic slowing. Higher HRV = better parasympathetic dominance = healthier autonomic balance.',
        stat: 'Higher HRV = stronger vagal brake = better parasympathetic dominance at rest',
      },
      {
        citation: 'Shaffer 2014 — Frontiers in Public Health',
        detail:
          'Key HRV determinants: age reduces HRV approximately 1% per year after age 25. Pre-menopausal women have higher HRV than age-matched men. Aerobic fitness is the strongest modifiable determinant — elite endurance athletes average SDNN 90–120 ms versus 30–50 ms in sedentary adults. Genetic factors account for 25–35% of HRV variance. Remarkably, slow breathing at 6 breaths/minute acutely doubles HRV within minutes, regardless of baseline fitness level.',
        stat: 'Aerobic fitness strongest modifiable factor; elite athletes SDNN 90–120 ms vs sedentary 30–50 ms',
      },
      {
        citation: 'Billman 2011 — Frontiers in Physiology & La Rovere 1998 — Circulation',
        detail:
          'Low HRV (SDNN <50 ms) indicates impaired vagal modulation of the heart. Vagal activity is intrinsically anti-arrhythmic — it stabilises electrical conduction and reduces vulnerability to ventricular fibrillation. Post-MI patients with SDNN <50 ms have 3× higher all-cause mortality (La Rovere 1998, Circulation). Exercise training raises SDNN by 20–40 ms in previously sedentary individuals within 12 weeks — a physiologically meaningful shift across the mortality threshold.',
        stat: 'SDNN <50 ms → 3× post-MI mortality; exercise raises SDNN 20–40 ms in 12 weeks',
      },
    ],
  },
  {
    id: 'health-outcomes',
    title: 'HRV & Health Outcomes',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.07)',
    accentBorder: 'rgba(59,130,246,0.22)',
    accentPill: 'rgba(59,130,246,0.14)',
    iconSymbol: '◎',
    iconColor: '#93c5fd',
    findings: [
      {
        citation: 'Thayer 2010 — Neuroscience & Biobehavioral Reviews',
        detail:
          'Pooled analysis of 16 prospective studies: low resting HRV independently predicts all-cause mortality. The lowest HRV quartile shows 32–45% higher all-cause mortality versus the highest quartile. HRV adds prognostic value beyond blood pressure, cholesterol, diabetes status, and smoking history. This breadth of prediction reflects that the autonomic nervous system regulates not just the heart, but immune function, inflammatory signalling, and neuroendocrine systems simultaneously.',
        stat: 'Lowest HRV quartile: 32–45% higher all-cause mortality; independent of BP, lipids, T2D, smoking',
      },
      {
        citation: 'Carney 2002 — Journal of the American College of Cardiology',
        detail:
          'Major depression is associated with SDNN 25–40% lower than matched controls. Low HRV is proposed as the physiological bridge linking depression to cardiovascular disease excess mortality. HRV biofeedback produces antidepressant effects comparable to medication in small RCTs. Exercise and yoga improve HRV by 15–25% alongside concurrent depression score improvements — suggesting shared vagal mechanisms.',
        stat: 'Depression: SDNN 25–40% lower than controls; HRV biofeedback = antidepressant comparable to medication',
      },
      {
        citation: 'Nasermoaddeli 2004 & Carnethon 2003 — Diabetes Care',
        detail:
          'Low HRV predicts T2D incidence: each SD decrease in HRV is associated with 1.6× increased T2D risk (Carnethon 2003). Each SD decrease also raises hypertension risk by 18%. Low nocturnal HRV serves as an apnea-hypopnea index (AHI) proxy, making it useful for sleep apnea screening. Notably, reduced cardiac autonomic modulation precedes clinical Alzheimer\'s disease diagnosis by 5+ years — suggesting HRV may be an early neurodegenerative biomarker.',
        stat: 'Each SD drop: 1.6× T2D risk, +18% HTN risk; ANS dysfunction precedes Alzheimer\'s by 5+ years',
      },
      {
        citation: 'Ernst 2006 — Preventive Medicine & Tracey 2002 — Nature',
        detail:
          'Higher HRV correlates with stronger vaccine responses and elevated NK cell activity. Low HRV is associated with elevated CRP, IL-6, and TNF-α — the core inflammatory triad. Vagal nerve stimulation reduces systemic inflammation via the cholinergic anti-inflammatory pathway (Tracey 2002, Nature) — meaning higher vagal tone directly suppresses inflammatory cytokine production. Exercise training that raises HRV simultaneously and significantly lowers all three inflammatory biomarkers.',
        stat: 'Higher HRV → lower CRP, IL-6, TNF-α; vagal stimulation activates anti-inflammatory pathway (Tracey 2002)',
      },
    ],
  },
  {
    id: 'guided-training',
    title: 'HRV-Guided Training',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.07)',
    accentBorder: 'rgba(34,197,94,0.22)',
    accentPill: 'rgba(34,197,94,0.14)',
    iconSymbol: '↑',
    iconColor: '#86efac',
    findings: [
      {
        citation: 'Plews 2013 — International Journal of Sports Physiology & Performance',
        detail:
          'Single-day HRV is too noisy for reliable daily decisions. The 7-day rolling average smooths biological and measurement noise. A reading ≥7% below the 7-day average signals to reduce training intensity that day. Five or more consecutive days of downward HRV trend signals a need to reduce overall training load for 48–72 hours. The correlation between 7-day HRV trend and performance is r = 0.72 — the highest relationship documented for any consumer wearable biomarker.',
        stat: '≥7% below 7-day avg = reduce intensity; r = 0.72 HRV trend-to-performance correlation',
      },
      {
        citation: 'Buchheit 2014 — International Journal of Sports Physiology & Performance',
        detail:
          '9-week randomised controlled trial comparing HRV-guided versus calendar-based training periodization. HRV-guided group improved VO₂max by 3.9 versus 2.1 mL/kg/min for calendar-based — a 85% larger gain. HRV-guided athletes experienced 40% fewer overreaching episodes. The traffic light system: train hard on green days (HRV ≥5% above average), easy on amber (±5%), rest on red (≥7% below). HRV-guided outperforms fixed periodization across all measured outcomes.',
        stat: 'HRV-guided VO₂max: +3.9 vs +2.1 mL/kg/min; 40% fewer overreaching episodes vs fixed plan',
      },
      {
        citation: 'Kiviniemi 2010 — British Journal of Sports Medicine',
        detail:
          '12-week randomised trial comparing HRV-guided versus fixed periodization in recreational runners. The HRV-guided group ran 15% fewer total sessions while achieving equivalent performance gains. Hard sessions were reserved for days when the body demonstrated optimal recovery readiness — making each high-intensity session more productive. This study established HRV-guided training as the most efficient approach documented for non-elite athletes.',
        stat: '15% fewer sessions, equivalent gains; hard sessions only on optimal recovery days',
      },
      {
        citation: 'Stanley 2013 — International Journal of Sports Physiology & Performance',
        detail:
          'Documented HRV suppressors: alcohol (2 drinks → 20–30% HRV drop for 24 hours), poor sleep (<6h → 15–25% reduction), heat without adequate rehydration, illness (HRV drops before subjective symptoms appear), and psychological stress. Documented HRV boosters: aerobic exercise, slow diaphragmatic breathing (6 bpm), yoga, cold exposure (10-minute cold shower → +10–15% for approximately 6 hours), and social connection and laughter.',
        stat: '2 drinks → 20–30% HRV drop; cold exposure → +10–15% for 6h; illness detectable before symptoms',
      },
    ],
  },
  {
    id: 'measurement',
    title: 'Measurement, Norms & Apple Watch',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.07)',
    accentBorder: 'rgba(249,115,22,0.22)',
    accentPill: 'rgba(249,115,22,0.14)',
    iconSymbol: '◷',
    iconColor: '#fdba74',
    findings: [
      {
        citation: 'Bumgarner 2018 — Journal of the American Heart Association',
        detail:
          'Apple Watch uses PPG (photoplethysmography) during sleep to measure SDNN with a validated accuracy of r = 0.94 versus ECG reference — clinically useful precision. Accuracy degrades with motion, cardiac arrhythmia, and poor wrist contact. The Health app displays SDNN averaged overnight — the most reliable reading available. For standardised daily monitoring outside sleep, the Breathe app 5-minute sessions provide consistent baseline conditions for trend tracking.',
        stat: 'PPG vs ECG: r = 0.94; overnight SDNN most reliable; 5-min Breathe sessions for daily baseline',
      },
      {
        citation: 'Population SDNN Norms — Resting 5-Min Measurement',
        detail:
          'Age-stratified resting SDNN norms: 20s: 55–80 ms; 30s: 45–70 ms; 40s: 35–60 ms; 50s: 30–50 ms; 60s: 25–45 ms; 70+: 20–40 ms. Trained athletes sit 25–40 ms above age-matched norms. Critically, individual variation within a person (100–300%) far exceeds population differences between age groups — meaning your personal trend over weeks is far more meaningful than where you rank against population averages. Always compare your HRV to your own baseline.',
        stat: 'Individual variation 100–300% exceeds age group differences; trend beats absolute comparison',
      },
      {
        citation: 'HRV Biofeedback — Resonance Frequency Training',
        detail:
          'Identify your resonance frequency: typically 5–6 breaths per minute (one breath every 10 seconds). Twenty minutes per day of resonance breathing raises HRV 40–80% acutely during the session. An 8-week daily practice protocol raises resting SDNN by 15–25% persistently. Used clinically for anxiety, PTSD, depression, asthma, IBS, and hypertension. The 4-7-8 technique (4 seconds inhale, 7 seconds hold, 8 seconds exhale) measurably raises HRV within 90 seconds.',
        stat: '5–6 bpm resonance breathing: +40–80% acute HRV; 8-week practice: +15–25% resting SDNN',
      },
      {
        citation: 'Interpreting HRV Trends — Practical Framework',
        detail:
          'A rising HRV trend over 2–4 weeks indicates positive training adaptation and supercompensation. A flat trend during a training block indicates optimal load-recovery balance. A falling trend over 3+ consecutive days signals accumulated fatigue, illness, or an unresolved life stressor. Note: menstrual phase matters — follicular phase typically shows HRV 5–10 ms above luteal phase. Alcohol the night before is the single most reliable HRV suppressor: 2+ drinks reliably drops next-day HRV 20–35%.',
        stat: 'Rising 2–4 wk = adaptation; falling 3+ days = accumulated fatigue; alcohol: most reliable suppressor',
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
          fontSize: 30,
          fontWeight: 900,
          color: accent,
          margin: 0,
          letterSpacing: '-0.5px',
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

// ─── SDNN Norms Table ─────────────────────────────────────────────────────────

function SDNNNormsTable() {
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
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          SDNN Population Norms by Age & Fitness Level
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
          Resting 5-minute SDNN reference ranges (ms) — Shaffer 2014, Task Force 1996 standards
        </p>
      </div>

      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr 1fr 1fr',
          padding: '10px 20px',
          borderBottom: '1px solid #1f1f1f',
          background: '#0e0e0e',
        }}
      >
        {(['Age', 'Sedentary', 'Average', 'Trained Athlete'] as const).map((h) => (
          <p
            key={h}
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#475569',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {h}
          </p>
        ))}
      </div>

      {/* Table rows */}
      {SDNN_NORMS.map((row, i) => (
        <div
          key={row.age}
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 1fr 1fr',
            padding: '12px 20px',
            borderBottom: i < SDNN_NORMS.length - 1 ? '1px solid #181818' : undefined,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: row.color,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {row.age}
          </span>
          <span style={{ fontSize: 13, color: '#64748b', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
            {row.sedentary} ms
          </span>
          <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
            {row.average} ms
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#86efac',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {row.trained} ms
          </span>
        </div>
      ))}

      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #1f1f1f',
          background: '#0e0e0e',
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Sedentary', color: '#64748b' },
          { label: 'Average', color: '#94a3b8' },
          { label: 'Trained Athlete', color: '#86efac' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: '#475569' }}>{label}</span>
          </div>
        ))}
        <span style={{ fontSize: 11, color: '#334155', marginLeft: 'auto', fontStyle: 'italic' }}>
          Individual variation (100–300%) exceeds age group differences — track your own trend
        </span>
      </div>
    </div>
  )
}

// ─── Traffic Light System ─────────────────────────────────────────────────────

function TrafficLightSystem() {
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
          background: 'rgba(34,197,94,0.07)',
          borderBottom: '1px solid rgba(34,197,94,0.2)',
          borderLeft: '3px solid #22c55e',
          padding: '14px 18px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          HRV Traffic Light System — Daily Training Decisions
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
          Buchheit 2014 framework — compare daily HRV to your personal 7-day rolling average
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}
      >
        {TRAFFIC_LIGHT.map((item, i) => (
          <div
            key={item.signal}
            style={{
              padding: '22px 20px',
              background: item.bg,
              borderRight: i < TRAFFIC_LIGHT.length - 1 ? `1px solid #1a1a1a` : undefined,
              borderTop: i > 0 ? '1px solid #1a1a1a' : undefined,
              position: 'relative',
            }}
          >
            {/* Signal dot + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: item.dot,
                  boxShadow: `0 0 12px ${item.dot}66`,
                  flexShrink: 0,
                }}
              />
              <div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: item.accent,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    letterSpacing: '1px',
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: '#475569',
                    marginLeft: 8,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {item.signal}
                </span>
              </div>
            </div>

            {/* Action */}
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#f1f5f9',
                margin: '0 0 6px',
              }}
            >
              {item.action}
            </p>

            {/* Condition */}
            <div
              style={{
                background: '#141414',
                border: `1px solid ${item.border}`,
                borderRadius: 6,
                padding: '5px 10px',
                marginBottom: 10,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: item.accent,
                  margin: 0,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  lineHeight: 1.4,
                }}
              >
                {item.condition}
              </p>
            </div>

            {/* Detail */}
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #1a1a1a',
          background: '#0d0d0d',
        }}
      >
        <p style={{ fontSize: 11, color: '#334155', margin: 0, lineHeight: 1.55 }}>
          <span style={{ color: '#475569', fontWeight: 700 }}>Protocol:</span> Measure HRV at the same time each morning before rising, after 5+ minutes lying still. A 5-day consecutive downward trend overrides single-day colour — reduce total load for 48–72 hours. HRV-guided training outperforms fixed periodisation by 85% in VO₂max gains (Buchheit 2014).
        </p>
      </div>
    </div>
  )
}

// ─── HRV Frequency Bands Visual ───────────────────────────────────────────────

function FrequencyBandsVisual() {
  const bands = [
    { name: 'VLF', range: '0.003–0.04 Hz', meaning: 'Hormonal, thermoregulatory, humoral modulation', fill: '#7c3aed', width: '20%' },
    { name: 'LF', range: '0.04–0.15 Hz', meaning: 'Mixed sympatho-vagal; baroreflex activity', fill: '#3b82f6', width: '40%' },
    { name: 'HF', range: '0.15–0.40 Hz', meaning: 'Pure vagal (parasympathetic) tone', fill: '#22c55e', width: '75%' },
    { name: 'HF peak at 6 bpm', range: '≈0.10 Hz resonance', meaning: 'Slow breathing creates largest HRV amplitude; doubles SDNN', fill: '#a855f7', width: '55%' },
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
          background: 'rgba(59,130,246,0.08)',
          borderBottom: '1px solid rgba(59,130,246,0.2)',
          borderLeft: '3px solid #3b82f6',
          padding: '14px 18px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          HRV Frequency Domain — Spectral Bands Explained
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
          Task Force 1996 standard frequency bands — what each component of HRV reflects
        </p>
      </div>

      <div style={{ padding: '20px 20px' }}>
        {bands.map((band) => (
          <div key={band.name} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
                flexWrap: 'wrap',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: band.fill,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    minWidth: 32,
                  }}
                >
                  {band.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#475569',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    letterSpacing: '0.4px',
                  }}
                >
                  {band.range}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#64748b' }}>{band.meaning}</span>
            </div>
            <div style={{ height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: band.width,
                  background: `linear-gradient(90deg, ${band.fill}44, ${band.fill}cc)`,
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        ))}
        <p style={{ fontSize: 11, color: '#334155', margin: '8px 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>
          LF/HF ratio was previously used as a sympathovagal balance index but is no longer recommended as a standalone metric (Task Force cautionary note). RMSSD (time domain) correlates with HF power and is the recommended parasympathetic proxy for wearables.
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HRVSciencePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/hrv"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to HRV"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">HRV Science</h1>
            <p className="text-sm text-text-secondary">
              Evidence-based guide to heart rate variability
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-purple-400" />
            <Brain className="w-5 h-5 text-blue-400" />
            <Activity className="w-5 h-5 text-green-400" />
            <Watch className="w-5 h-5 text-orange-400" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">

        {/* Hero intro */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(59,130,246,0.08) 50%, rgba(34,197,94,0.06) 100%)',
            border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: 16,
            padding: '20px 22px',
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: '#94a3b8',
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            Heart Rate Variability (HRV) is the millisecond-level variation in time between consecutive heartbeats.
            Far from random noise, this variation reflects real-time competition between your sympathetic ("fight or flight")
            and parasympathetic ("rest and digest") nervous systems. Higher HRV = stronger parasympathetic dominance =
            better recovery, resilience, and long-term health. The science here is drawn from peer-reviewed cardiology,
            physiology, and sports science literature — the same evidence base used in clinical cardiac risk stratification.
          </p>
        </div>

        {/* Key stats */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 28,
          }}
        >
          {KEY_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Science cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.id} {...card} />
          ))}
        </div>

        {/* SDNN Norms Table */}
        <div style={{ marginBottom: 20 }}>
          <SDNNNormsTable />
        </div>

        {/* Traffic Light System */}
        <div style={{ marginBottom: 20 }}>
          <TrafficLightSystem />
        </div>

        {/* Frequency Bands Visual */}
        <div style={{ marginBottom: 20 }}>
          <FrequencyBandsVisual />
        </div>

        {/* HRV boosters and suppressors */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: 'rgba(249,115,22,0.07)',
              borderBottom: '1px solid rgba(249,115,22,0.2)',
              borderLeft: '3px solid #f97316',
              padding: '14px 18px',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              HRV Boosters vs Suppressors — Quick Reference
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
              Stanley 2013, Plews 2013 — acute and chronic HRV modifiers
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            }}
          >
            {/* Boosters */}
            <div style={{ padding: '20px', borderRight: '1px solid #1a1a1a' }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#22c55e',
                  margin: '0 0 14px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                HRV Boosters
              </p>
              {[
                { item: 'Aerobic exercise (Zone 2)', effect: '+15–40% chronic' },
                { item: 'Slow breathing (6 bpm)', effect: '+40–100% acute' },
                { item: 'Yoga / mind-body practice', effect: '+15–25% chronic' },
                { item: 'Cold exposure (10 min)', effect: '+10–15% for 6h' },
                { item: 'Quality sleep (7–9h)', effect: '+10–20%' },
                { item: 'Social connection / laughter', effect: 'Acute vagal boost' },
                { item: 'HRV biofeedback (daily 20 min)', effect: '+15–25% in 8 weeks' },
                { item: 'Taper / recovery week', effect: 'Supercompensation +8 ms' },
              ].map(({ item, effect }) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '7px 0',
                    borderBottom: '1px solid #181818',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#cbd5e1' }}>{item}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#22c55e',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      flexShrink: 0,
                    }}
                  >
                    {effect}
                  </span>
                </div>
              ))}
            </div>

            {/* Suppressors */}
            <div style={{ padding: '20px' }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#ef4444',
                  margin: '0 0 14px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                HRV Suppressors
              </p>
              {[
                { item: 'Alcohol (2+ drinks)', effect: '−20–35% next day' },
                { item: 'Sleep deprivation (<6h)', effect: '−15–25% acute' },
                { item: 'Psychological stress', effect: '−10–20%' },
                { item: 'Overtraining / accumulated load', effect: '−15–30%' },
                { item: 'Illness (often precedes symptoms)', effect: '−20–40%' },
                { item: 'Heat without rehydration', effect: '−10–15% acute' },
                { item: 'Caffeine withdrawal', effect: 'Transient suppression' },
                { item: 'High-calorie meal (post-prandial)', effect: '−5–15% for 2–3h' },
              ].map(({ item, effect }) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '7px 0',
                    borderBottom: '1px solid #181818',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#cbd5e1' }}>{item}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#ef4444',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      flexShrink: 0,
                    }}
                  >
                    {effect}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key takeaways footer */}
        <div
          style={{
            background: '#0e0e0e',
            border: '1px solid #1f1f1f',
            borderRadius: 14,
            padding: '18px 20px',
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#475569',
              margin: '0 0 10px',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            Key Principles
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Your HRV trend over weeks matters far more than any single reading.',
              'Individual baseline varies 100–300% — compare only to yourself, not population charts.',
              'SDNN >50 ms is the clinical healthy threshold; aerobic fitness is the strongest modifier.',
              'Alcohol the night before is the single most reliable HRV suppressor (20–35% drop).',
              'Slow breathing at 6 bpm doubles HRV acutely, regardless of fitness level.',
              'HRV-guided training outperforms fixed periodization — use the traffic light system daily.',
              'Apple Watch overnight SDNN (r = 0.94 vs ECG) is clinically meaningful — trust the trend.',
            ].map((point, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: '#a855f7',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    flexShrink: 0,
                    marginTop: 2,
                    letterSpacing: '0.5px',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.55 }}>{point}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

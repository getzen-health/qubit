// AFib Science — static server component
// Evidence-based guide covering AFib physiology, epidemiology, ECG & wearable
// monitoring, stroke risk scoring, and management/prevention science.

import Link from 'next/link'
import { ArrowLeft, Heart, AlertTriangle, Activity, Watch, Shield } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'AFib Science' }

// ─── Key Stats ────────────────────────────────────────────────────────────────

const KEY_STATS = [
  {
    value: '5×',
    label: 'Higher Stroke Risk',
    sub: 'AFib vs sinus rhythm (Wolf 1991, Framingham Stroke Study)',
    accent: '#ef4444',
  },
  {
    value: '25%',
    label: 'Lifetime Risk',
    sub: 'Adults ≥40y (Lloyd-Jones 2004, Framingham Heart Study)',
    accent: '#f97316',
  },
  {
    value: '98.3%',
    label: 'ECG Sensitivity',
    sub: 'Apple Watch single-lead ECG for AFib (Fung 2021, Eur Heart J Digital Health)',
    accent: '#3b82f6',
  },
  {
    value: '64%',
    label: 'Stroke Reduction',
    sub: 'Warfarin vs placebo; DOACs equally effective (Hart 2007, Ann Intern Med)',
    accent: '#22c55e',
  },
]

// ─── CHA₂DS₂-VASc Score Data ──────────────────────────────────────────────────

const CHADS_SCORES = [
  { score: 0, risk: '0%',   riskNum: 0,   category: 'Very Low', color: '#22c55e',  recommendation: 'No antithrombotic therapy' },
  { score: 1, risk: '1.3%', riskNum: 1.3, category: 'Low',      color: '#84cc16',  recommendation: 'Consider anticoagulation (men); no treatment (women)' },
  { score: 2, risk: '2.2%', riskNum: 2.2, category: 'Moderate', color: '#eab308',  recommendation: 'Anticoagulation recommended' },
  { score: 3, risk: '3.2%', riskNum: 3.2, category: 'Moderate', color: '#f97316',  recommendation: 'Anticoagulation recommended' },
  { score: 4, risk: '4.0%', riskNum: 4.0, category: 'High',     color: '#f97316',  recommendation: 'Anticoagulation strongly indicated' },
  { score: 5, risk: '6.7%', riskNum: 6.7, category: 'High',     color: '#ef4444',  recommendation: 'Anticoagulation strongly indicated' },
  { score: 6, risk: '9.7%', riskNum: 9.7, category: 'High',     color: '#ef4444',  recommendation: 'Anticoagulation strongly indicated' },
  { score: 7, risk: '11.2%',riskNum: 11.2,category: 'Very High',color: '#dc2626',  recommendation: 'Anticoagulation strongly indicated' },
  { score: 8, risk: '13.6%',riskNum: 13.6,category: 'Very High',color: '#b91c1c',  recommendation: 'Anticoagulation strongly indicated' },
  { score: 9, risk: '15.2%',riskNum: 15.2,category: 'Very High',color: '#991b1b',  recommendation: 'Anticoagulation strongly indicated' },
]

const CHADS_FACTORS = [
  { abbr: 'C',  name: 'Congestive Heart Failure',                        points: '+1' },
  { abbr: 'H',  name: 'Hypertension (or treated hypertension)',           points: '+1' },
  { abbr: 'A₂', name: 'Age ≥ 75 years',                                  points: '+2' },
  { abbr: 'D',  name: 'Diabetes mellitus',                               points: '+1' },
  { abbr: 'S₂', name: 'Stroke / TIA / thromboembolism (prior)',          points: '+2' },
  { abbr: 'V',  name: 'Vascular disease (prior MI, PAD, aortic plaque)', points: '+1' },
  { abbr: 'A',  name: 'Age 65–74 years',                                 points: '+1' },
  { abbr: 'Sc', name: 'Sex category: female',                            points: '+1' },
]

// ─── Monitoring Comparison Data ───────────────────────────────────────────────

const MONITORING_COMPARISON = [
  {
    capability: 'Detect irregular rhythm (PPG)',
    ppg: true,
    ecg: true,
    ppgNote: '71.5% sensitivity, 97.3% specificity',
    ecgNote: 'Reference standard',
  },
  {
    capability: 'Record single-lead ECG (lead I)',
    ppg: false,
    ecg: true,
    ppgNote: 'Not available',
    ecgNote: 'Series 4+ with Digital Crown contact',
  },
  {
    capability: 'Confirm AFib diagnosis',
    ppg: false,
    ecg: false,
    ppgNote: 'Cannot diagnose — screens only',
    ecgNote: 'Screens; 12-lead required for diagnosis',
  },
  {
    capability: 'Detect atrial flutter',
    ppg: false,
    ecg: false,
    ppgNote: 'Not validated',
    ecgNote: 'Not FDA-cleared for flutter',
  },
  {
    capability: 'Continuous background monitoring',
    ppg: true,
    ecg: false,
    ppgNote: 'Passive, all-day notifications',
    ecgNote: 'On-demand only (30-sec recording)',
  },
  {
    capability: 'AFib burden tracking',
    ppg: true,
    ecg: false,
    ppgNote: 'AFib History (iOS 16+, confirmed AFib users)',
    ecgNote: 'Single snapshot; no burden tracking',
  },
  {
    capability: 'Diagnose other arrhythmias',
    ppg: false,
    ecg: false,
    ppgNote: 'Not validated',
    ecgNote: 'Limited; cardiologist review needed',
  },
  {
    capability: 'Use in patients < 22 years old',
    ppg: false,
    ecg: false,
    ppgNote: 'Not validated in pediatric patients',
    ecgNote: 'Not FDA-approved < 22y',
  },
  {
    capability: 'Large-scale population screening',
    ppg: true,
    ecg: false,
    ppgNote: '419,297 participants (Apple Heart Study 2019)',
    ecgNote: 'Not practical at scale',
  },
  {
    capability: 'Class IIa screening recommendation (≥65)',
    ppg: true,
    ecg: true,
    ppgNote: 'ACC/AHA 2023 guideline',
    ecgNote: 'ACC/AHA 2023 guideline',
  },
]

// ─── Science Cards ────────────────────────────────────────────────────────────

const SCIENCE_CARDS = [
  {
    id: 'physiology',
    title: 'AFib Physiology & Epidemiology',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.07)',
    accentBorder: 'rgba(239,68,68,0.22)',
    accentPill: 'rgba(239,68,68,0.14)',
    iconSymbol: '♥',
    iconColor: '#fca5a5',
    findings: [
      {
        citation: 'Fuster 2006 — Circulation (AHA/ESC Guidelines)',
        detail:
          'Atrial fibrillation is defined as a supraventricular tachyarrhythmia characterized by uncoordinated atrial activation and consequent deterioration of mechanical atrial function. On ECG: no discrete P waves, an irregularly irregular ventricular rate. AFib types: paroxysmal (self-terminating, ≤7 days), persistent (>7 days requiring cardioversion), long-standing persistent (>12 months continuous), and permanent (rhythm-control strategy abandoned). The core mechanism is multiple re-entrant wavelets propagating simultaneously through structurally remodeled atrial myocardium — wavelets that maintain themselves through the very anatomic substrate they create.',
        stat: 'Mechanism: multiple re-entrant wavelets in remodeled atrial myocardium; irregular irregular rate',
      },
      {
        citation: 'Lloyd-Jones 2004 — Circulation (Framingham Heart Study)',
        detail:
          'Prevalence is steeply age-dependent: 0.1% in adults <55 years, rising to 3.8% at ages 60–69, 9% at 70–79, and 18% in those ≥80 years. Overall population prevalence: 1–2%. Lifetime risk for adults ≥40 years is 25% — one in four adults will develop AFib. By 2050, an estimated 12–16 million Americans will have AFib. AFib already accounts for one-third of all cardiac rhythm-related hospitalizations in the US, placing enormous and growing burden on healthcare systems.',
        stat: 'Age 80+: 18% prevalence; lifetime risk 25% for adults ≥40; 12–16M Americans by 2050',
      },
      {
        citation: 'Wolf 1991 (Stroke — Framingham) + Risk Factor Evidence',
        detail:
          'Hypertension is the leading attributable risk factor with 14–22% population-attributable risk. Other major risk factors include heart failure, valvular disease, CAD, diabetes, sleep apnea, and obesity. Lifestyle factors: each additional drink per day raises AFib risk 8%; extreme endurance sport (marathon, ultra-triathlon) raises lone AFib risk 5-fold. Conversely, each 10% reduction in body weight reduces AFib recurrence by 46%. Moderate exercise ≤150 min/week is protective — the dose-response is J-shaped: too little or too much raises risk.',
        stat: 'HTN: #1 risk (14–22% attributable); 10% weight loss → −46% recurrence; alcohol: +8%/drink/day',
      },
      {
        citation: 'Haissaguerre 1998 — New England Journal of Medicine',
        detail:
          'Landmark discovery: most AFib-triggering ectopic foci originate within the pulmonary veins (PV), not from diffuse atrial tissue. Rapid PV firing initiates and drives re-entrant atrial circuits. This mechanistic insight directly led to pulmonary vein isolation (PVI) catheter ablation as a curative strategy. PVI achieves sinus rhythm in 70–85% of paroxysmal AFib patients after a single procedure (Calkins 2012 meta-analysis), revolutionizing the field from purely drug-based management to interventional cure.',
        stat: 'PV foci trigger most AFib; PVI ablation: 70–85% paroxysmal AFib cure after single procedure',
      },
    ],
  },
  {
    id: 'ecg-monitoring',
    title: 'ECG & Apple Watch Cardiac Monitoring',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.07)',
    accentBorder: 'rgba(59,130,246,0.22)',
    accentPill: 'rgba(59,130,246,0.14)',
    iconSymbol: '◈',
    iconColor: '#93c5fd',
    findings: [
      {
        citation: 'Perez 2019 — New England Journal of Medicine (Apple Heart Study)',
        detail:
          '419,297 participants enrolled — the largest cardiovascular screening study ever conducted using a wearable device. Irregular rhythm notifications were sent to 0.52% of participants. Of those notified and who subsequently wore a confirmatory ECG patch: 84% had confirmed AFib on the concurrent recording. Not all notifications reflected real-time AFib — some captured prior events. A 14% false-positive rate led to unnecessary cardiology referrals, highlighting the importance of confirmatory diagnostics. This study established PPG-based wearable technology as a valid large-population AFib screening tool.',
        stat: '419,297 participants; 84% notification accuracy for AFib on confirmatory patch; 14% false-positive rate',
      },
      {
        citation: 'Lubitz 2022 — Circulation & Fung 2021 — Eur Heart J Digital Health',
        detail:
          'Apple Watch generates a single-lead ECG (equivalent to lead I) when the user presses a finger on the Digital Crown, completing an electrical circuit. Sensitivity for AFib detection: 98.3%. Specificity: 99.6% vs reference 12-lead ECG. The PPG irregular rhythm notification performs differently: sensitivity 71.5%, specificity 97.3%. Critical limitation: Apple Watch cannot diagnose AFib — it screens. Confirmed AFib diagnosis requires a 12-lead ECG interpreted by a cardiologist. The ACC/AHA 2023 guidelines give a Class IIa recommendation for wearable screening in adults ≥65.',
        stat: 'ECG: 98.3% sensitivity, 99.6% specificity; PPG: 71.5% sensitivity; screens only — not diagnostic',
      },
      {
        citation: 'Bumgarner 2018 — Journal of the American College of Cardiology',
        detail:
          'Prospective validation of Apple Watch ECG in 100 patients with known AFib and 100 age-matched controls. Area under the ROC curve: 0.97. Sensitivity 98%, specificity 90% vs 12-lead ECG reference. Performance is comparable to dedicated cardiac event monitors used in standard clinical practice. The Apple Watch received FDA De Novo clearance in 2018 as a software medical device. Contraindications: not approved for users under 22 years old, not validated for atrial flutter detection, not approved for ventricular arrhythmia detection.',
        stat: 'AUC 0.97; 98% sensitivity, 90% specificity vs 12-lead; FDA De Novo cleared 2018',
      },
      {
        citation: 'Chung 2020 — Heart Rhythm & EAST-AFNET4 2020 — New England Journal of Medicine',
        detail:
          'Even brief AFib episodes — ≥1 minute per day of documented AFib — are associated with a 2–3× higher stroke risk compared to zero burden. Apple Watch AFib History (available in iOS 16+ for users with confirmed AFib diagnosis) reports estimated weekly burden as a percentage of time in AFib. The EAST-AFNET4 trial demonstrated that early rhythm control initiated within one year of diagnosis significantly reduces cardiovascular death, stroke, and heart failure hospitalization compared to rate control alone, establishing the urgency of early intervention.',
        stat: '≥1 min/day AFib: 2–3× stroke risk; early rhythm control (EAST-AFNET4) significantly reduces CVD events',
      },
    ],
  },
  {
    id: 'stroke-risk',
    title: 'Stroke Risk & CHA₂DS₂-VASc Score',
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.07)',
    accentBorder: 'rgba(249,115,22,0.22)',
    accentPill: 'rgba(249,115,22,0.14)',
    iconSymbol: '⚠',
    iconColor: '#fdba74',
    findings: [
      {
        citation: 'Wolf 1991 (Stroke) + Lip 2010 — European Heart Journal (CHA₂DS₂-VASc)',
        detail:
          'AFib confers a 5× higher stroke risk compared to age-matched individuals in sinus rhythm (Wolf 1991, Framingham). The CHA₂DS₂-VASc score quantifies individual stroke risk: Congestive heart failure (+1), Hypertension (+1), Age ≥75 (+2), Diabetes (+1), prior Stroke/TIA (+2), Vascular disease (+1), Age 65–74 (+1), female Sex (+1). Maximum score: 9. Clinical thresholds: score 0 = low risk, no treatment needed; score ≥2 = high risk, anticoagulation required; intermediate score 1 requires individualized assessment. Annual stroke risk at score 0: 0%; score 2: 2.2%; score 6: 9.7%; score 9: 15.2%.',
        stat: 'AFib: 5× stroke risk; CHA₂DS₂-VASc ≥2 → anticoagulation required; score 9 = 15.2%/year stroke risk',
      },
      {
        citation: 'Hart 2007 — Annals of Internal Medicine + Ruff 2014 — Lancet',
        detail:
          'Hart 2007 meta-analysis: warfarin (target INR 2.0–3.0) reduces stroke risk by 64% compared to placebo. Aspirin reduces stroke risk by only 22% — inadequate for high-risk AFib patients. Ruff 2014 Lancet meta-analysis of 71,683 patients: Direct Oral Anticoagulants (DOACs — apixaban, rivaroxaban, dabigatran, edoxaban) are at least as effective as warfarin for stroke prevention while reducing intracranial hemorrhage by 50%. DOACs are now first-line over warfarin. Each missed DOAC dose raises the monthly stroke risk by approximately 15% — adherence is critical.',
        stat: 'Warfarin: −64% stroke risk; DOACs: equally effective + 50% less intracranial hemorrhage vs warfarin',
      },
      {
        citation: 'Hijazi 2016 (Eur Heart J) + Healey 2012 — ASSERT Trial (NEJM)',
        detail:
          'Subclinical AFib (SCAF) — episodes detected on implantable monitors not previously recognized clinically — emerged as a distinct high-risk phenotype. ASSERT trial (Healey 2012, NEJM): episodes >6 minutes detected on continuous cardiac monitors were associated with a 2.5× higher stroke or systemic embolism risk over 2.5 years of follow-up. Even episodes <6 minutes may confer elevated risk. Apple Watch may identify SCAF in individuals who were previously undiagnosed — expanding the at-risk population detected before a first stroke occurs.',
        stat: 'SCAF episodes >6 min: 2.5× higher stroke risk (ASSERT trial); Apple Watch may detect previously invisible SCAF',
      },
      {
        citation: 'Kim 2020 — NEJM Evidence (WATCHMAN LAA Closure)',
        detail:
          'Approximately 90% of thrombus that causes AFib-related stroke forms in the left atrial appendage (LAA) — a blind-ended pouch of the left atrium where blood stagnates during fibrillation. The WATCHMAN device (FDA 2015) mechanically seals the LAA with a nitinol plug, physically preventing thrombus from reaching the systemic circulation. PROTECT-AF trial demonstrated non-inferiority to warfarin at 5-year follow-up. Recommended for patients with high stroke risk combined with high bleeding risk who cannot tolerate chronic anticoagulation.',
        stat: '90% of AFib thrombus forms in LAA; WATCHMAN non-inferior to warfarin at 5 years (PROTECT-AF)',
      },
    ],
  },
  {
    id: 'management',
    title: 'AFib Management & Prevention',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.07)',
    accentBorder: 'rgba(34,197,94,0.22)',
    accentPill: 'rgba(34,197,94,0.14)',
    iconSymbol: '↑',
    iconColor: '#86efac',
    findings: [
      {
        citation: 'Calkins 2012 — Circulation (HRS/EHRA/ECAS Guidelines) + CABANA 2019 — JAMA',
        detail:
          'Pulmonary vein isolation (PVI) ablation outcomes: paroxysmal AFib achieves sinus rhythm in 70–85% after single procedure, 80–90% with repeat ablation. Persistent AFib: 50–70% after single procedure. CABANA trial (2019, JAMA): ablation was superior to antiarrhythmic drugs for maintaining sinus rhythm and was associated with significantly reduced mortality (HR 0.60 in intention-to-treat analysis) and reduced heart failure hospitalization. Earlier ablation — within the first year of diagnosis — dramatically improves procedural success rates due to less atrial structural remodeling at that stage.',
        stat: 'PVI: 70–85% paroxysmal cure; CABANA: HR 0.60 mortality vs drugs; earlier ablation = better outcomes',
      },
      {
        citation: 'Patel 2020 — Lancet (LEGACY Study)',
        detail:
          'The LEGACY study followed 825 overweight/obese AFib patients over 5 years, comparing comprehensive lifestyle modification (targeting ≥10% weight loss, structured exercise, alcohol reduction, smoking cessation, sleep apnea treatment) against standard care. AFib freedom at 5 years: 45% in the lifestyle modification group versus 8% in controls — a 5-fold difference achieved purely through behavioral intervention, without pharmacological or ablative therapy. Weight loss was identified as the single most powerful modifiable factor: each 10% reduction in body weight reduces AFib recurrence by 46%.',
        stat: 'Lifestyle modification: 45% AFib-free at 5y vs 8% control; 10% weight loss → −46% recurrence',
      },
      {
        citation: 'Pathak 2015 — Journal of the American College of Cardiology (ARREST-AF)',
        detail:
          'ARREST-AF cohort study of 308 symptomatic AFib patients undergoing ablation: those who completed a structured exercise program (moderate-intensity, 200 min/week at 60–80% HRmax) had 50% lower AFib burden and 60% lower ablation recurrence rates at 5-year follow-up compared to sedentary controls. Every 1 MET increase in cardiorespiratory fitness was associated with a 13% reduction in AFib risk. Exercise prescription: avoid high-intensity exercise (consistently >80% HRmax) — the relationship is J-shaped. Personalized moderate exercise is optimal.',
        stat: 'Exercise (200 min/wk, 60–80% HRmax): −50% AFib burden, −60% ablation recurrence; +1 MET = −13% risk',
      },
      {
        citation: 'Camm 2022 — European Heart Journal + RACE II Trial',
        detail:
          'Rate control targets: the RACE II trial established that lenient rate control (resting HR <110 bpm) is equally effective as strict control (<80 bpm) for preventing adverse cardiovascular outcomes. Symptom-driven rate control is the preferred modern approach. Pharmacological options: beta-blockers (first-line), non-dihydropyridine calcium channel blockers (verapamil, diltiazem), digoxin (for sedentary patients). Apple Watch AFib Burden monitoring enables objective, continuous assessment of therapy response — a patient can see whether their resting HR while in AFib is being adequately controlled.',
        stat: 'RACE II: resting HR <110 bpm (lenient) equals <80 bpm (strict) for outcomes; symptom-driven preferred',
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

// ─── CHA₂DS₂-VASc Score Calculator Table ─────────────────────────────────────

function CHADSTable() {
  const maxRisk = 15.2
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
          background: 'rgba(249,115,22,0.08)',
          borderBottom: '1px solid rgba(249,115,22,0.2)',
          borderLeft: '3px solid #f97316',
          padding: '14px 18px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          CHA₂DS₂-VASc Score — Annual Stroke Risk Table
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
          Lip 2010 (Eur Heart J) — score 0 to 9 with annual stroke risk and anticoagulation thresholds
        </p>
      </div>

      {/* Score factors legend */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a', background: '#0e0e0e' }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#475569',
            margin: '0 0 10px',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}
        >
          Score Components
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '6px 20px',
          }}
        >
          {CHADS_FACTORS.map((f) => (
            <div key={f.abbr} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: '#f97316',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  minWidth: 28,
                  flexShrink: 0,
                }}
              >
                {f.abbr}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8', flex: 1 }}>{f.name}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#f97316',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  flexShrink: 0,
                }}
              >
                {f.points}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '52px 80px 90px 1fr',
          padding: '10px 20px',
          borderBottom: '1px solid #1f1f1f',
          background: '#0a0a0a',
        }}
      >
        {(['Score', 'Annual Risk', 'Category', 'Recommendation'] as const).map((h) => (
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

      {/* Score rows */}
      {CHADS_SCORES.map((row, i) => (
        <div
          key={row.score}
          style={{
            display: 'grid',
            gridTemplateColumns: '52px 80px 90px 1fr',
            padding: '11px 20px',
            borderBottom: i < CHADS_SCORES.length - 1 ? '1px solid #161616' : undefined,
            alignItems: 'center',
            gap: 4,
          }}
        >
          {/* Score number */}
          <span
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: row.color,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              lineHeight: 1,
            }}
          >
            {row.score}
          </span>

          {/* Risk percentage with bar */}
          <div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: row.color,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {row.risk}
            </span>
            <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden', width: '90%' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(row.riskNum / maxRisk) * 100}%`,
                  background: row.color,
                  borderRadius: 2,
                  opacity: 0.8,
                }}
              />
            </div>
          </div>

          {/* Category */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: row.color,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              opacity: 0.85,
            }}
          >
            {row.category}
          </span>

          {/* Recommendation */}
          <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{row.recommendation}</span>
        </div>
      ))}

      {/* Footer */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #1a1a1a',
          background: '#0a0a0a',
        }}
      >
        <p style={{ fontSize: 11, color: '#334155', margin: 0, lineHeight: 1.55 }}>
          <span style={{ color: '#475569', fontWeight: 700 }}>Note:</span> The female sex category (+1) does not independently trigger anticoagulation at score 1 in women — the ACC/AHA 2019 guidelines clarify that female sex is a risk modifier, not an independent risk factor. Decisions must integrate bleeding risk (HAS-BLED score) alongside CHA₂DS₂-VASc. All treatment decisions require physician assessment.
        </p>
      </div>
    </div>
  )
}

// ─── Monitoring Comparison Table ──────────────────────────────────────────────

function MonitoringComparisonTable() {
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
          Apple Watch PPG Monitoring vs ECG — Capabilities Compared
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
          Perez 2019, Lubitz 2022, Bumgarner 2018 — what each modality can and cannot do
        </p>
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 130px 130px',
          padding: '10px 20px',
          borderBottom: '1px solid #1a1a1a',
          background: '#0a0a0a',
          gap: 8,
        }}
      >
        <p
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
          Capability
        </p>
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#7c3aed',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            PPG
          </p>
          <p style={{ fontSize: 10, color: '#334155', margin: '2px 0 0', lineHeight: 1.3 }}>
            Irregular Rhythm Notification
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#3b82f6',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            ECG
          </p>
          <p style={{ fontSize: 10, color: '#334155', margin: '2px 0 0', lineHeight: 1.3 }}>
            Single-Lead (Lead I)
          </p>
        </div>
      </div>

      {/* Rows */}
      {MONITORING_COMPARISON.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 130px 130px',
            padding: '12px 20px',
            borderBottom: i < MONITORING_COMPARISON.length - 1 ? '1px solid #141414' : undefined,
            alignItems: 'start',
            gap: 8,
            background: i % 2 === 0 ? 'transparent' : '#0d0d0d',
          }}
        >
          <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.45 }}>{row.capability}</span>

          {/* PPG column */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 4 }}>
              {row.ppg ? (
                <span
                  style={{
                    display: 'inline-block',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(34,197,94,0.15)',
                    border: '1.5px solid #22c55e',
                    lineHeight: '18px',
                    fontSize: 12,
                    color: '#22c55e',
                    fontWeight: 900,
                  }}
                >
                  ✓
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-block',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(239,68,68,0.12)',
                    border: '1.5px solid rgba(239,68,68,0.4)',
                    lineHeight: '18px',
                    fontSize: 12,
                    color: '#ef4444',
                    fontWeight: 900,
                  }}
                >
                  ✗
                </span>
              )}
            </div>
            <p style={{ fontSize: 10, color: '#475569', margin: 0, lineHeight: 1.4 }}>{row.ppgNote}</p>
          </div>

          {/* ECG column */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 4 }}>
              {row.ecg ? (
                <span
                  style={{
                    display: 'inline-block',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(34,197,94,0.15)',
                    border: '1.5px solid #22c55e',
                    lineHeight: '18px',
                    fontSize: 12,
                    color: '#22c55e',
                    fontWeight: 900,
                  }}
                >
                  ✓
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-block',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(239,68,68,0.12)',
                    border: '1.5px solid rgba(239,68,68,0.4)',
                    lineHeight: '18px',
                    fontSize: 12,
                    color: '#ef4444',
                    fontWeight: 900,
                  }}
                >
                  ✗
                </span>
              )}
            </div>
            <p style={{ fontSize: 10, color: '#475569', margin: 0, lineHeight: 1.4 }}>{row.ecgNote}</p>
          </div>
        </div>
      ))}

      {/* Footer */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #1a1a1a',
          background: '#0a0a0a',
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {[
          { symbol: '✓', label: 'Supported', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: '#22c55e' },
          { symbol: '✗', label: 'Not supported', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)' },
        ].map(({ symbol, label, color, bg, border }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: bg,
                border: `1.5px solid ${border}`,
                lineHeight: '14px',
                fontSize: 10,
                color,
                fontWeight: 900,
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              {symbol}
            </span>
            <span style={{ fontSize: 11, color: '#475569' }}>{label}</span>
          </div>
        ))}
        <span style={{ fontSize: 11, color: '#334155', marginLeft: 'auto', fontStyle: 'italic' }}>
          Neither modality provides a standalone AFib diagnosis — 12-lead ECG + cardiologist required
        </span>
      </div>
    </div>
  )
}

// ─── AFib Types Visual ────────────────────────────────────────────────────────

function AFibTypesVisual() {
  const types = [
    {
      name: 'Paroxysmal',
      duration: '≤ 7 days',
      detail: 'Self-terminating; recurs spontaneously. Most amenable to ablation.',
      color: '#eab308',
      bg: 'rgba(234,179,8,0.08)',
      border: 'rgba(234,179,8,0.22)',
      width: '25%',
    },
    {
      name: 'Persistent',
      duration: '> 7 days',
      detail: 'Requires cardioversion (electrical or pharmacological) to restore sinus rhythm.',
      color: '#f97316',
      bg: 'rgba(249,115,22,0.08)',
      border: 'rgba(249,115,22,0.22)',
      width: '50%',
    },
    {
      name: 'Long-Standing Persistent',
      duration: '> 12 months',
      detail: 'Continuous AFib >1 year; still possible rhythm control strategy.',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.22)',
      width: '75%',
    },
    {
      name: 'Permanent',
      duration: 'Ongoing',
      detail: 'Rhythm-control strategy abandoned by joint patient-physician decision; rate control only.',
      color: '#7c3aed',
      bg: 'rgba(124,58,237,0.08)',
      border: 'rgba(124,58,237,0.22)',
      width: '100%',
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
          borderBottom: '1px solid rgba(239,68,68,0.2)',
          borderLeft: '3px solid #ef4444',
          padding: '14px 18px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          AFib Classification by Duration — Fuster 2006 (AHA/ESC)
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
          Understanding your AFib type determines treatment strategy and ablation candidacy
        </p>
      </div>

      <div style={{ padding: '20px' }}>
        {types.map((t) => (
          <div key={t.name} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 7,
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: t.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {t.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: t.color,
                    background: t.bg,
                    border: `1px solid ${t.border}`,
                    borderRadius: 4,
                    padding: '2px 7px',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {t.duration}
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#64748b', flex: 1, minWidth: 180, textAlign: 'right' }}>
                {t.detail}
              </span>
            </div>
            <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: t.width,
                  background: `linear-gradient(90deg, ${t.color}55, ${t.color}bb)`,
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Key Principles Footer ────────────────────────────────────────────────────

function KeyPrinciples() {
  const principles = [
    'AFib is a supraventricular arrhythmia caused by chaotic re-entrant wavelets; it is not a single disease but a spectrum from paroxysmal to permanent.',
    'One in four adults ≥40 will develop AFib in their lifetime; prevalence rises to 18% in those over 80 (Framingham data).',
    'Apple Watch ECG screens for AFib with 98.3% sensitivity but cannot diagnose — confirmed diagnosis requires 12-lead ECG reviewed by a cardiologist.',
    'CHA₂DS₂-VASc ≥2 mandates anticoagulation; DOACs (not aspirin) are first-line with 50% less intracranial hemorrhage than warfarin.',
    'Even 1 minute per day of AFib is associated with 2–3× higher stroke risk; subclinical AFib detected by wearables is clinically meaningful.',
    '10% weight loss reduces AFib recurrence 46%; structured moderate exercise (200 min/wk) reduces ablation recurrence 60%.',
    'Pulmonary vein isolation ablation cures 70–85% of paroxysmal AFib; early ablation (within 1 year) dramatically improves success.',
    'Rate control target: resting HR <110 bpm (lenient) is equally effective as <80 bpm (strict) for outcomes (RACE II trial).',
  ]

  return (
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
          margin: '0 0 12px',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        Key Principles
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {principles.map((point, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: '#ef4444',
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
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AFibSciencePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/afib-burden"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to AFib Burden"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary">AFib Science</h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#ef4444',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Medical
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              Evidence-based guide to atrial fibrillation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            <Activity className="w-5 h-5 text-blue-400" />
            <Shield className="w-5 h-5 text-orange-400" />
            <Watch className="w-5 h-5 text-green-400" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">

        {/* Medical Disclaimer */}
        <div
          style={{
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderLeft: '3px solid #ef4444',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <AlertTriangle
            style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0, marginTop: 1 }}
          />
          <p style={{ fontSize: 12, color: '#fca5a5', margin: 0, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700 }}>Medical notice:</span> Atrial fibrillation is a serious cardiac condition requiring physician management. Apple Watch can screen for irregular rhythms but cannot diagnose AFib. All anticoagulation, cardioversion, and ablation decisions must be made with a qualified cardiologist. Contact your doctor or emergency services immediately if you experience chest pain, severe shortness of breath, or syncope.
          </p>
        </div>

        {/* Hero intro */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(249,115,22,0.07) 35%, rgba(59,130,246,0.06) 70%, rgba(34,197,94,0.05) 100%)',
            border: '1px solid rgba(239,68,68,0.18)',
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
              lineHeight: 1.75,
            }}
          >
            Atrial fibrillation is the most common sustained cardiac arrhythmia, affecting 1–2% of the general population and conferring a 5-fold higher stroke risk. The science spans chaotic re-entrant electrophysiology, consumer wearable validation, algorithmic stroke risk stratification, and evidence-based lifestyle interventions that can achieve AFib freedom in 45% of patients through behavioral change alone. This guide synthesizes the peer-reviewed evidence base — the same science used in AHA, ESC, and ACC/AHA clinical guidelines.
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

        {/* AFib Types Classification */}
        <div style={{ marginBottom: 20 }}>
          <AFibTypesVisual />
        </div>

        {/* Science Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
          {SCIENCE_CARDS.map((card) => (
            <ScienceCard key={card.id} {...card} />
          ))}
        </div>

        {/* CHA₂DS₂-VASc Table */}
        <div style={{ marginBottom: 20 }}>
          <CHADSTable />
        </div>

        {/* Monitoring Comparison */}
        <div style={{ marginBottom: 20 }}>
          <MonitoringComparisonTable />
        </div>

        {/* Key Principles */}
        <KeyPrinciples />

      </main>

      <BottomNav />
    </div>
  )
}

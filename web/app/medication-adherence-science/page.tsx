'use client'

import React from 'react'

const weeklyData = [
  { week: 'W8', rate: 90 }, { week: 'W7', rate: 96 }, { week: 'W6', rate: 71 },
  { week: 'W5', rate: 88 }, { week: 'W4', rate: 94 }, { week: 'W3', rate: 78 },
  { week: 'W2', rate: 85 }, { week: 'W1', rate: 92 },
]

const medicationTypes = [
  { name: 'Antihypertensive', rate: 88 }, { name: 'Statin', rate: 92 },
  { name: 'Antidepressant', rate: 71 }, { name: 'Metformin', rate: 85 },
]

function getRateColor(rate: number) {
  if (rate >= 90) return '#16a34a'
  if (rate >= 75) return '#d97706'
  return '#dc2626'
}

function SciCard({ title, icon, color, items }: { title: string; icon: string; color: string; items: { stat: string; detail: string }[] }) {
  return (
    <div style={{ background: '#111', borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ color, fontWeight: 700, fontSize: 17, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{icon}</span>{title}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < items.length - 1 ? '1px solid #222' : 'none' }}>
          <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>{item.stat}</div>
          <div style={{ color: '#e5e7eb', fontSize: 12, lineHeight: 1.5 }}>{item.detail}</div>
        </div>
      ))}
    </div>
  )
}

export default function MedicationAdherenceSciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: 60 }}>
      <div style={{ background: 'linear-gradient(135deg, #052e16 0%, #0a0a0a 60%)', padding: '48px 24px 36px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💊</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 10px', color: '#16a34a' }}>Medication Adherence Science</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Adherence research, chronic disease outcomes & reminder systems — WHO 2003: only 50% of chronic patients take meds as prescribed
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 20, marginBottom: 16 }}>
          {[{ value: '87%', label: 'Adherence Rate', color: '#d97706' }, { value: '12d', label: 'Current Streak', color: '#3b82f6' }, { value: '4', label: 'Missed Doses', color: '#d97706' }].map((s, i) => (
            <div key={i} style={{ background: '#111', borderRadius: 10, padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#111', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Weekly Adherence Rate (8 Weeks)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
            {weeklyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ fontSize: 9, color: '#9ca3af' }}>{d.rate}%</div>
                <div style={{ width: '100%', height: (d.rate / 100) * 80, background: getRateColor(d.rate), borderRadius: 4, opacity: 0.85 }} />
                <div style={{ fontSize: 9, color: '#9ca3af' }}>{d.week}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 14 }}>
            {[['#16a34a', '≥90%'], ['#d97706', '75–89%'], ['#dc2626', '<75%']].map(([color, label]) => (
              <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color as string }} />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{label as string}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#111', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Adherence by Medication Type</div>
          {medicationTypes.map((med, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>{med.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: getRateColor(med.rate) }}>{med.rate}%</span>
              </div>
              <div style={{ background: '#222', borderRadius: 4, height: 6 }}>
                <div style={{ width: `${med.rate}%`, height: '100%', background: getRateColor(med.rate), borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
        <SciCard title="Adherence Science & Outcomes" icon="📊" color="#3b82f6" items={[
          { stat: 'WHO 2003', detail: 'Only 50% of patients with chronic diseases take medications as prescribed; non-adherence costs US healthcare ~$300 billion/year in avoidable hospitalizations and complications' },
          { stat: 'Sabaté 2003', detail: 'Efficacy thresholds: antihypertensives require ≥80% adherence for BP control; HIV antiretrovirals require ≥95% for viral suppression; statins show mortality benefit at ≥80% (Shalev 2009)' },
          { stat: 'DiMatteo 2004', detail: 'Meta-analysis of 569 studies: adherence 43–78% across conditions; once-daily dosing improves adherence 26% vs. 4× daily; social support increases adherence 27%; regular physician contact +21%' },
          { stat: 'Osterberg 2005', detail: 'NEJM review: psychiatric medications lowest (40–60%); oral contraceptives highest (92%); regimen complexity inversely proportional to adherence — simplification is the highest-impact structural intervention' },
        ]} />
        <SciCard title="Why We Forget" icon="🧠" color="#d97706" items={[
          { stat: 'Cramer 1991', detail: 'Top reasons: forgetfulness 55%, feeling better 28%, cost 17%, side effects 11%; morning doses forgotten 35% more than evening — circadian attention rhythms peak mid-morning' },
          { stat: 'Haynes 2008', detail: 'Forgetting patterns: weekend miss rate 32% higher vs. weekdays; travel 3.1× higher; illness 2.7× higher; routine disruption is the single largest predictor of dose omission' },
          { stat: 'Brown 2014', detail: 'Cognitive load from stressful life events reduces adherence 18%; executive function deficits predict non-adherence — explains challenges in ADHD and depression' },
          { stat: 'Lehane 2007', detail: 'Unintentional non-adherence (forgetting) responds to reminders; intentional (beliefs/side effects) requires motivational interviewing — the intervention must match the type' },
        ]} />
        <SciCard title="Reminder Systems & Technology" icon="📱" color="#16a34a" items={[
          { stat: 'Anglada-Martínez 2015', detail: 'Smartphone reminders improve adherence 17–22%; SMS text: +12%; app with visual confirmation: +19%; apps with electronic blister packaging: +28% improvement' },
          { stat: 'Park 2014', detail: 'Routine-tied alarms (morning coffee, teeth brushing) 40% more effective than time-only; implementation intentions (if-then planning) increase adherence 28–35% vs. simple reminders' },
          { stat: 'Vollmer 2011', detail: 'Automated pharmacy refill reminders increase MPR by 0.08–0.12 across chronic disease categories — consistent and measurable improvement across populations' },
          { stat: 'Dayer 2013', detail: 'mHealth adherence meta-analysis (16 RCTs): mean improvement 16.3%; patient satisfaction 87%; medication error rate reduced 25% when apps include drug interaction warnings' },
        ]} />
        <SciCard title="Chronic Disease Impact" icon="❤️" color="#dc2626" items={[
          { stat: 'Hypertension', detail: 'Vrijens 2008: 50% discontinue within 1 year; 10 mmHg BP reduction reduces stroke risk 35%, MI risk 25%; white-coat adherence detectable via serum drug levels' },
          { stat: 'Type 2 Diabetes', detail: 'Cramer 2004: each 10% adherence improvement → 0.2% HbA1c reduction; medication non-adherence accounts for 30% of hospitalizations in diabetic patients (IMS Institute 2013)' },
          { stat: 'Mental Health', detail: 'Morken 2008: each missed lithium dose doubles 2-week bipolar relapse probability; antidepressant discontinuation within 3 months occurs in 42% — primary driver of treatment-resistant depression cycles' },
          { stat: 'Statins', detail: 'Dormuth 2009: first-90-day statin adherence predicts long-term adherence; MPR ≥0.80 reduces cardiovascular events 40% vs. non-adherent; generic substitution maintains adherence in 94%' },
        ]} />
        <div style={{ background: '#111', borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: '#16a34a' }}>✅ Science-Backed Adherence Tips</div>
          {[
            { tip: 'Tie your dose to an existing routine', why: 'Routine-tied alarms are 40% more effective than time-only reminders (Park 2014)' },
            { tip: 'Use pill organizers or blister packs', why: 'Visual dose confirmation reduces missed doses and double-dosing uncertainty by 35%' },
            { tip: 'Ask your doctor about once-daily formulations', why: 'Once-daily dosing improves adherence 26% vs. 4× daily regimens (DiMatteo 2004)' },
            { tip: 'Track adherence streaks with KQuarks', why: '7-day adherence visibility predicts and prevents lapses before they become chronic patterns' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < 3 ? '1px solid #222' : 'none' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{item.tip}</div>
              <div style={{ color: '#9ca3af', fontSize: 12 }}>{item.why}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

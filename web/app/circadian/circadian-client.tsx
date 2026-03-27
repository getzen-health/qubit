'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sun, Moon, Utensils, ArrowLeft, RotateCcw } from 'lucide-react'
import { assessChronotype, lightExposureScore, circadianMealAlignment, generateCircadianPlan, type ChronotypeProfile } from '@/lib/circadian'

const TABS = ['Plan', 'Light', 'Meals'] as const
type Tab = (typeof TABS)[number]

const Q: { text: string; opts: [string, number][] }[] = [
  { text: 'If entirely free to plan your evening, what time would you go to bed?',
    opts: [['Before 9pm',5],['9–10pm',4],['10–11pm',3],['11pm–midnight',2],['After midnight',1]] },
  { text: 'How easy do you find getting up in the morning?',
    opts: [['Very easy',5],['Fairly easy',4],['Fairly difficult',2],['Very difficult',1]] },
  { text: 'How alert do you feel in the first 30 min after waking?',
    opts: [['Very alert',5],['Fairly alert',4],['Fairly foggy',2],['Not at all alert',1]] },
  { text: 'If free to plan your day, at what time would you get up?',
    opts: [['Before 6:30am',5],['6:30–7:45am',4],['7:45–9:45am',3],['9:45–11am',2],['After 11am',1]] },
  { text: 'Do you consider yourself a morning or evening type?',
    opts: [['Definitely morning',5],['More morning',4],['Neither',3],['More evening',2],['Definitely evening',1]] },
]

type LightLog = { date: string; morning_lux: number|null; afternoon_lux: number|null; evening_lux: number|null; outdoor_minutes: number|null }
type Assessment = { meq_score: number; chronotype: string; dlmo_estimate: string; social_jet_lag: number; overall_score: number } | null

interface Props { lightLogs: LightLog[]; latestAssessment: Assessment }

export function CircadianClient({ lightLogs, latestAssessment }: Props) {
  const [step, setStep]             = useState(0)
  const [answers, setAnswers]       = useState<number[]>([])
  const [showQuiz, setShowQuiz]     = useState(!latestAssessment)
  const [tab, setTab]               = useState<Tab>('Plan')
  const [saving, setSaving]         = useState(false)
  const [assessment, setAssessment] = useState<Assessment>(latestAssessment)
  const [workWake, setWorkWake]     = useState('07:00')
  const [freeWake, setFreeWake]     = useState('08:00')
  const [morning, setMorning]       = useState('')
  const [afternoon, setAfternoon]   = useState('')
  const [evening, setEvening]       = useState('')
  const [outdoor, setOutdoor]       = useState('')
  const [saved, setSaved]           = useState(false)

  const toMin = (t: string) => { const [h,m]=t.split(':').map(Number); return h*60+(m||0) }
  const sjl = Math.abs(toMin(freeWake)-toMin(workWake))/60
  const meqScore = answers.reduce((s,v)=>s+v,0)
  const quizProfile: ChronotypeProfile|null = answers.length===Q.length ? assessChronotype(meqScore) : null
  const profile = assessment ? assessChronotype(assessment.meq_score) : quizProfile
  const plan = profile ? generateCircadianPlan(profile, sjl) : null
  const lscore = lightExposureScore([
    ...(morning   ? [{time:'08:00',lux:+morning,  durationMinutes:+outdoor||20}]:[]),
    ...(afternoon ? [{time:'14:00',lux:+afternoon, durationMinutes:30}]:[]),
    ...(evening   ? [{time:'21:30',lux:+evening,   durationMinutes:60}]:[]),
  ])

  const handleAnswer = (v: number) => {
    const next=[...answers,v]; setAnswers(next)
    if (step<Q.length-1) setStep(s=>s+1)
  }
  const handleSave = async (p: ChronotypeProfile) => {
    setSaving(true)
    const res = await fetch('/api/circadian',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({type:'assessment',meq_score:p.mEQScore,chronotype:p.chronotype,
        dlmo_estimate:p.dlmoEstimate,social_jet_lag:sjl,overall_score:Math.round(Math.max(0,100-sjl*15))})})
    if (res.ok){ const d=await res.json(); setAssessment(d.assessment); setShowQuiz(false) }
    setSaving(false)
  }
  const handleSaveLight = async () => {
    setSaving(true)
    await fetch('/api/circadian',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({morning_lux:morning||null,afternoon_lux:afternoon||null,evening_lux:evening||null,outdoor_minutes:outdoor||null})})
    setSaved(true); setSaving(false); setTimeout(()=>setSaved(false),2000)
  }
  const resetQuiz = () => { setAnswers([]); setStep(0); setShowQuiz(true) }

  const scoreColor = (s:number) => s>=70?'#22c55e':s>=45?'#f59e0b':'#ef4444'
  const score = assessment?.overall_score??50
  const r=44, c=2*Math.PI*r, dash=(score/100)*c

  if (showQuiz) {
    if (answers.length===Q.length && quizProfile) return (
      <div className="max-w-xl mx-auto p-4 pt-8">
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center gap-3">
          <Sun className="w-10 h-10 text-yellow-400"/>
          <h2 className="text-xl font-bold text-text-primary">{quizProfile.label}</h2>
          <p className="text-sm text-text-secondary text-center">{quizProfile.description}</p>
          <div className="grid grid-cols-2 gap-2 w-full text-xs mt-1">
            {([['Wake',quizProfile.optimalWake],['Sleep',quizProfile.optimalSleep],
               ['Focus',quizProfile.optimalFocus],['MEQ',`${meqScore}/25`]] as [string,string][]).map(([k,v])=>(
              <div key={k} className="bg-background rounded-xl p-3 border border-border">
                <p className="text-text-secondary">{k}</p><p className="font-semibold text-text-primary">{v}</p>
              </div>
            ))}
          </div>
          <button onClick={()=>handleSave(quizProfile)} disabled={saving}
            className="mt-3 w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-50">
            {saving?'Saving…':'Save My Chronotype'}
          </button>
          <button onClick={resetQuiz} className="text-xs text-text-secondary underline">Retake Quiz</button>
        </div>
      </div>
    )
    const q=Q[step]
    return (
      <div className="max-w-xl mx-auto p-4 pt-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface text-text-secondary"><ArrowLeft className="w-5 h-5"/></Link>
          <div><h1 className="text-xl font-bold text-text-primary">Circadian Optimizer</h1>
            <p className="text-xs text-text-secondary">Question {step+1} of {Q.length}</p></div>
        </div>
        <div className="w-full h-1.5 bg-surface rounded-full mb-5">
          <div className="h-1.5 bg-primary rounded-full transition-all" style={{width:`${((step+1)/Q.length)*100}%`}}/>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-6">
          <p className="font-semibold text-text-primary mb-4">{q.text}</p>
          <div className="flex flex-col gap-2">
            {q.opts.map(([label,val])=>(
              <button key={val} onClick={()=>handleAnswer(val)}
                className="w-full px-4 py-3 text-left rounded-xl border border-border bg-background hover:bg-primary hover:text-white hover:border-primary transition-colors text-sm">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-4 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface text-text-secondary"><ArrowLeft className="w-5 h-5"/></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">Circadian Optimizer</h1>
          <p className="text-xs text-text-secondary">Borbély Two-Process · Czeisler PRC</p>
        </div>
        <button onClick={resetQuiz} className="p-2 rounded-lg hover:bg-surface text-text-secondary" title="Retake quiz"><RotateCcw className="w-4 h-4"/></button>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4 mb-4">
        <svg width="96" height="96" viewBox="0 0 100 100" aria-label={`Score ${score}`}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="9"/>
          <circle cx="50" cy="50" r={r} fill="none" stroke={scoreColor(score)} strokeWidth="9"
            strokeDasharray={`${dash} ${c}`} strokeLinecap="round" transform="rotate(-90 50 50)"/>
          <text x="50" y="56" textAnchor="middle" fontSize="20" fontWeight="bold" fill="var(--text-primary)">{score}</text>
        </svg>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary truncate">{profile?.label??'Take the quiz'}</p>
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{profile?.description??''}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[['Wake',profile?.optimalWake],['Sleep',profile?.optimalSleep],['DLMO',profile?.dlmoEstimate]].map(([k,v])=>(
              <span key={k} className="text-xs bg-background border border-border rounded-lg px-2 py-0.5">{k} {v}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 mb-4">
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t?'bg-primary text-white':'text-text-secondary hover:text-text-primary'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab==='Plan' && plan && (
        <div className="flex flex-col gap-3">
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
            {[
              {icon:<Sun className="w-4 h-4 text-yellow-400"/>,label:'Light Therapy',val:`${plan.lightTherapyWindow.start}–${plan.lightTherapyWindow.end}`,note:'Get ≥2500 lux to anchor your clock.'},
              {icon:<Moon className="w-4 h-4 text-blue-400"/>,label:'Dim after',val:plan.dimmingTime,note:`Keep <50 lux for melatonin rise (DLMO ~${assessment?.dlmo_estimate??profile?.dlmoEstimate}).`},
              {icon:<Utensils className="w-4 h-4 text-green-400"/>,label:'Meal Window (eTRE)',val:`${plan.mealWindow.start}–${plan.mealWindow.end}`,note:'8h window, <30% kcal after 7pm (Sutton 2018).'},
            ].map(({icon,label,val,note})=>(
              <div key={label} className="border-b border-border last:border-0 pb-2 last:pb-0">
                <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">{icon}{label}: <span className="font-bold">{val}</span></p>
                <p className="text-xs text-text-secondary mt-0.5">{note}</p>
              </div>
            ))}
          </div>
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h3 className="font-semibold text-text-primary mb-2">Social Jet Lag</h3>
            <div className="flex gap-3 items-end mb-2">
              {[['Workday wake',workWake,setWorkWake],['Weekend wake',freeWake,setFreeWake]].map(([label,val,setter])=>(
                <div key={label as string} className="flex-1">
                  <label className="text-xs text-text-secondary block mb-1">{label as string}</label>
                  <input type="time" value={val as string} onChange={e=>(setter as (v:string)=>void)(e.target.value)}
                    className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-text-primary text-sm"/>
                </div>
              ))}
              <div className="text-center pb-1.5 min-w-[48px]">
                <p className={`font-bold text-lg ${sjl<1?'text-green-500':sjl<2?'text-yellow-500':'text-red-500'}`}>{sjl.toFixed(1)}h</p>
                <p className="text-[10px] text-text-secondary">SJL</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary">{sjl<1?'✅ Low risk':sjl<2?'⚠️ Align within 1h':sjl<3?'🔴 Cardiometabolic risk (Roenneberg 2012)':'🚨 Severe — metabolic syndrome risk'}</p>
          </div>
          {plan.socialJetLagNote&&<div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3"><p className="text-sm text-amber-700 dark:text-amber-400">{plan.socialJetLagNote}</p></div>}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h3 className="font-semibold text-text-primary mb-2">Recommendations</h3>
            <ul className="flex flex-col gap-1.5">
              {plan.recommendations.map((r,i)=>(<li key={i} className="text-xs text-text-secondary flex gap-2"><span className="text-primary shrink-0">•</span>{r}</li>))}
            </ul>
          </div>
        </div>
      )}

      {tab==='Light'&&(
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
          <h3 className="font-semibold text-text-primary flex items-center gap-2"><Sun className="w-4 h-4 text-yellow-400"/>Log Light Exposure Today</h3>
          <div className="grid grid-cols-3 gap-2">
            {([['☀️ Morning (6–10am)',morning,setMorning],['🌤️ Afternoon',afternoon,setAfternoon],['🌙 Evening (>9pm)',evening,setEvening]] as const).map(([label,val,setter])=>(
              <div key={label}>
                <label className="text-xs text-text-secondary block mb-1">{label}</label>
                <input type="number" placeholder="lux" value={val} onChange={e=>(setter as (v:string)=>void)(e.target.value)}
                  className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-text-primary text-sm"/>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Outdoor minutes (6am–noon)</label>
            <input type="number" placeholder="e.g. 20" value={outdoor} onChange={e=>setOutdoor(e.target.value)}
              className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-text-primary text-sm"/>
          </div>
          <div className="bg-background border border-border rounded-xl p-3 text-xs">
            <div className="flex justify-between mb-1"><span className="text-text-secondary font-medium">Light Score</span><span className="font-bold text-text-primary">{lscore.total}/100</span></div>
            <div className="w-full h-2 bg-surface rounded-full"><div className="h-2 bg-primary rounded-full" style={{width:`${lscore.total}%`}}/></div>
            {lscore.recommendation&&<p className="mt-1.5 text-text-secondary">{lscore.recommendation}</p>}
          </div>
          <button onClick={handleSaveLight} disabled={saving}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-50">
            {saved?'✓ Saved':saving?'Saving…':'Save Light Log'}
          </button>
          {lightLogs.length>0&&(
            <div>
              <p className="text-xs font-semibold text-text-secondary mb-2">Recent Logs</p>
              <div className="flex flex-col gap-1">
                {lightLogs.slice(0,7).map(l=>(
                  <div key={l.date} className="flex justify-between text-xs bg-background rounded-lg px-3 py-2 border border-border">
                    <span className="text-text-secondary">{l.date}</span>
                    <span className="text-text-primary">☀️{l.morning_lux??'–'} 🌤️{l.afternoon_lux??'–'} 🌙{l.evening_lux??'–'} lx</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='Meals'&&<MealSection/>}
    </div>
  )
}

function MealSection() {
  const [meals,setMeals]=useState([{time:'08:00',kcal:'400'},{time:'12:30',kcal:'600'},{time:'18:00',kcal:'500'}])
  const parsed=meals.map(m=>({time:m.time,kcal:parseInt(m.kcal)||0}))
  const result=circadianMealAlignment(parsed)
  const hours=Array.from({length:15},(_,i)=>i+6)
  const maxKcal=Math.max(...hours.map(h=>parsed.filter(m=>parseInt(m.time.split(':')[0])===h).reduce((s,m)=>s+m.kcal,0)),1)
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
      <h3 className="font-semibold text-text-primary flex items-center gap-2"><Utensils className="w-4 h-4 text-green-400"/>Meal Alignment (eTRE)</h3>
      {meals.map((m,i)=>(
        <div key={i} className="flex gap-2 items-center">
          <input type="time" value={m.time} onChange={e=>setMeals(ms=>ms.map((x,j)=>j===i?{...x,time:e.target.value}:x))}
            className="border border-border rounded-lg px-2 py-1.5 bg-background text-text-primary text-sm"/>
          <input type="number" placeholder="kcal" value={m.kcal} onChange={e=>setMeals(ms=>ms.map((x,j)=>j===i?{...x,kcal:e.target.value}:x))}
            className="flex-1 border border-border rounded-lg px-2 py-1.5 bg-background text-text-primary text-sm"/>
          <button onClick={()=>setMeals(ms=>ms.filter((_,j)=>j!==i))} className="text-text-secondary hover:text-red-500 px-2 text-sm">✕</button>
        </div>
      ))}
      <button onClick={()=>setMeals(m=>[...m,{time:'12:00',kcal:'400'}])} className="text-xs text-primary underline text-left">+ Add meal</button>
      <div className="flex items-end gap-0.5 h-14 mt-1">
        {hours.map(h=>{const hk=parsed.filter(m=>parseInt(m.time.split(':')[0])===h).reduce((s,m)=>s+m.kcal,0);return(
          <div key={h} className="flex-1 flex flex-col justify-end">
            <div className={`w-full rounded-sm ${h>=19?'bg-red-400':'bg-primary/70'}`} style={{height:`${(hk/maxKcal)*100}%`,minHeight:hk>0?'3px':'0'}}/>
          </div>
        )})}
      </div>
      <div className="flex gap-0.5">
        {hours.map(h=><div key={h} className="flex-1 text-center text-[9px] text-text-secondary">{h<12?`${h}a`:h===12?'12p':`${h-12}p`}</div>)}
      </div>
      <div className="bg-background border border-border rounded-xl p-3 text-xs">
        {[['Window',`${result.windowHours}h`,result.windowHours<=8],['Late cal',`${result.lateCaloriePct}%`,result.lateCaloriePct<=30],['Score',`${result.score}/100`,result.score>=70]].map(([k,v,ok])=>(
          <div key={k as string} className="flex justify-between mb-1"><span className="text-text-secondary">{k as string}</span><span className="font-semibold text-text-primary">{v as string} {(ok as boolean)?'✅':'⚠️'}</span></div>
        ))}
        <div className="w-full h-1.5 bg-surface rounded-full mt-1"><div className="h-1.5 bg-primary rounded-full" style={{width:`${result.score}%`}}/></div>
        {result.recommendation&&<p className="mt-2 text-text-secondary">{result.recommendation}</p>}
      </div>
    </div>
  )
}

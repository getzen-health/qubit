"use client"
import React, { useEffect, useRef, useState } from 'react'
import { BREAK_ACTIVITIES, BREAK_INTERVALS, BreakActivity, BreakType, getNextBreakActivity } from '@/lib/breaks'
import { useRouter } from 'next/navigation'

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PosturePage() {
  const [intervalMin, setIntervalMin] = useState(30)
  const [timerSec, setTimerSec] = useState(intervalMin * 60)
  const [running, setRunning] = useState(false)
  const [showBreak, setShowBreak] = useState(false)
  const [breakIdx, setBreakIdx] = useState(0)
  const [breakSec, setBreakSec] = useState(BREAK_ACTIVITIES[0].durationSec)
  const [activity, setActivity] = useState<BreakActivity>(BREAK_ACTIVITIES[0])
  const [stats, setStats] = useState<{completedToday:number,totalSittingMin:number,breaks:any[]}>({completedToday:0,totalSittingMin:0,breaks:[]})
  const [settings, setSettings] = useState({
    enabledTypes: BREAK_ACTIVITIES.map(a=>a.type),
    notifications: false,
  })
  const timerRef = useRef<NodeJS.Timeout|null>(null)
  const breakTimerRef = useRef<NodeJS.Timeout|null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/breaks').then(r=>r.json()).then(setStats)
  }, [showBreak])

  useEffect(() => {
    setTimerSec(intervalMin * 60)
  }, [intervalMin])

  useEffect(() => {
    if (!running || showBreak) return
    timerRef.current = setInterval(() => {
      setTimerSec(sec => {
        if (sec <= 1) {
          clearInterval(timerRef.current!); setShowBreak(true); setBreakSec(activity.durationSec)
          if (settings.notifications && Notification.permission === 'granted') {
            new Notification('Time for a break!', { body: activity.label })
          }
          return 0
        }
        return sec - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!);
  }, [running, showBreak, activity, settings.notifications])

  useEffect(() => {
    if (!showBreak) return
    breakTimerRef.current = setInterval(() => {
      setBreakSec(sec => {
        if (sec <= 1) { clearInterval(breakTimerRef.current!); return 0 }
        return sec - 1
      })
    }, 1000)
    return () => clearInterval(breakTimerRef.current!);
  }, [showBreak])

  function handleDoneBreak() {
    fetch('/api/breaks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        break_type: activity.type,
        duration_seconds: activity.durationSec,
        completed: true,
        sitting_minutes_before: Math.round((intervalMin)),
      })
    }).then(()=>{
      setShowBreak(false)
      setTimerSec(intervalMin * 60)
      setActivity(getNextBreakActivity(activity.type))
      setBreakSec(getNextBreakActivity(activity.type).durationSec)
      setBreakIdx(idx => (idx+1)%settings.enabledTypes.length)
      setRunning(false)
      fetch('/api/breaks').then(r=>r.json()).then(setStats)
    })
  }

  function handleStart() { setRunning(true) }
  function handlePause() { setRunning(false) }
  function handleSkip() { setShowBreak(true); setBreakSec(activity.durationSec) }

  function handleIntervalChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setIntervalMin(Number(e.target.value))
  }

  function handleTypeToggle(type: BreakType) {
    setSettings(s => ({...s, enabledTypes: s.enabledTypes.includes(type) ? s.enabledTypes.filter(t=>t!==type) : [...s.enabledTypes, type]}))
  }

  function handleNotifToggle() {
    if (!settings.notifications && typeof Notification !== 'undefined') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') setSettings(s=>({...s, notifications:true}))
      })
    } else {
      setSettings(s=>({...s, notifications:!s.notifications}))
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">🪑 Posture & Breaks</h1>
      {/* Break Timer */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2 items-center">
        <div className="text-lg">⏱️ {formatTime(timerSec)} until next break</div>
        <div className="flex gap-2 items-center">
          <label className="text-text-secondary">Break Interval:</label>
          <select className="bg-surface border border-border rounded px-2 py-1" value={intervalMin} onChange={handleIntervalChange}>
            {BREAK_INTERVALS.map(i=>(<option key={i.minutes} value={i.minutes}>{i.label}</option>))}
          </select>
        </div>
        <div className="flex gap-2 mt-2">
          {!running && <button className="bg-primary text-white rounded px-3 py-1" onClick={handleStart}>▶ Start Timer</button>}
          {running && <button className="bg-surface border border-border rounded px-3 py-1" onClick={handlePause}>⏸ Pause</button>}
          <button className="bg-surface border border-border rounded px-3 py-1" onClick={handleSkip}>Skip</button>
        </div>
      </div>
      {/* Break Activity Card */}
      {showBreak && (
        <div className="bg-surface border border-primary rounded-2xl p-4 flex flex-col gap-2 items-center animate-pulse">
          <div className="text-2xl">{activity.emoji} {activity.label}</div>
          <div className="text-text-secondary">{activity.research}</div>
          <ol className="list-decimal ml-6 text-text-primary">
            {activity.instructions.map((step,i)=>(<li key={i}>{step}</li>))}
          </ol>
          <div className="text-lg">⏳ {formatTime(breakSec)} left</div>
          <button className="bg-primary text-white rounded px-4 py-2 mt-2" onClick={handleDoneBreak} disabled={breakSec>0}>Done ✅</button>
        </div>
      )}
      {/* Today's Stats */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="font-semibold mb-2">Today's Stats</div>
        <div className="flex gap-4">
          <div>Breaks taken: <span className="font-bold">{stats.completedToday}</span></div>
          <div>Sitting time: <span className="font-bold">{stats.totalSittingMin} min</span></div>
          <div>Goal: <span className="font-bold">~16</span> breaks</div>
        </div>
        <div className="mt-2 text-text-secondary text-sm">Timeline:</div>
        <div className="flex flex-wrap gap-2 mt-1">
          {stats.breaks?.map((b,i)=>(<span key={b.id} className="px-2 py-1 rounded bg-primary/10 text-primary text-xs">{b.break_type} {new Date(b.logged_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>))}
        </div>
      </div>
      {/* Settings */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="font-semibold mb-2">Settings</div>
        <div className="flex gap-4 flex-wrap items-center">
          <div>
            <div className="text-text-secondary text-xs mb-1">Break types:</div>
            <div className="flex gap-2 flex-wrap">
              {BREAK_ACTIVITIES.map(a=>(
                <label key={a.type} className="flex items-center gap-1">
                  <input type="checkbox" checked={settings.enabledTypes.includes(a.type)} onChange={()=>handleTypeToggle(a.type)} />
                  <span>{a.emoji} {a.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.notifications} onChange={handleNotifToggle} />
              Enable browser notifications
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

import { THERMAL_PROFILES, ThermalType, calculateHormeticLoad, hormeticLoadLabel, ThermalSession } from '@/lib/thermal'
import { createClient } from '@/lib/supabase/server'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default async function ThermalPage() {
  const supabase = await createClient()
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const { data: sessions } = await supabase
    .from('thermal_sessions')
    .select('*')
    .gte('logged_at', since.toISOString())
    .order('logged_at', { ascending: false })
    .limit(50)

  const today = new Date().toISOString().slice(0, 10)
  const todaySessions = (sessions || []).filter((s: any) => s.logged_at.slice(0, 10) === today)
  const coldCount = (sessions || []).filter((s: any) => THERMAL_PROFILES[s.session_type].category === 'cold').length
  const heatCount = (sessions || []).filter((s: any) => THERMAL_PROFILES[s.session_type].category === 'heat').length
  const hormeticScore = calculateHormeticLoad(sessions || [])
  const hormesis = hormeticLoadLabel(hormeticScore)

  // Chart data: group by day, cold/heat
  const chartData: Record<string, { date: string, cold: number, heat: number }> = {}
  for (const s of sessions || []) {
    const d = s.logged_at.slice(0, 10)
    if (!chartData[d]) chartData[d] = { date: d, cold: 0, heat: 0 }
    chartData[d][THERMAL_PROFILES[s.session_type].category]++
  }
  const chartArr = Object.values(chartData).sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Thermal Therapy Tracker <span title="Hormesis: controlled stress → adaptation and resilience">🌡️</span></h1>
      <div className="flex gap-4 mb-4">
        <div className="bg-surface rounded-2xl p-4 flex-1 border border-border">
          <div className="text-text-secondary text-xs mb-1">Cold Sessions</div>
          <div className="text-2xl font-bold text-primary">{coldCount}</div>
        </div>
        <div className="bg-surface rounded-2xl p-4 flex-1 border border-border">
          <div className="text-text-secondary text-xs mb-1">Heat Sessions</div>
          <div className="text-2xl font-bold text-primary">{heatCount}</div>
        </div>
        <div className="bg-surface rounded-2xl p-4 flex-1 border border-border" title="{hormesis.label}">
          <div className="text-text-secondary text-xs mb-1">Hormetic Load</div>
          <div className="text-2xl font-bold" style={{ color: hormesis.color }}>{hormesis.emoji} {Math.round(hormeticScore)}</div>
        </div>
      </div>
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Weekly Chart</h2>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartArr} stackOffset="sign">
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="cold" stackId="a" fill="#0ea5e9" />
            <Bar dataKey="heat" stackId="a" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Log Session</h2>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(THERMAL_PROFILES).map(([type, profile]) => (
            <button key={type} className="bg-surface border border-border rounded-2xl p-3 flex flex-col items-center hover:bg-primary/10" title={profile.label + ': ' + profile.benefits.join(', ')}>
              <span className="text-2xl mb-1">{profile.emoji}</span>
              <span className="text-xs text-text-secondary">{profile.label}</span>
            </button>
          ))}
        </div>
        {/* TODO: Modal for logging session, guided timer if timerMode */}
      </div>
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Today's Sessions</h2>
        <ul className="divide-y divide-border">
          {todaySessions.map((s: any) => (
            <li key={s.id} className="flex items-center gap-3 py-2">
              <span className="text-2xl">{THERMAL_PROFILES[s.session_type].emoji}</span>
              <span className="flex-1">{THERMAL_PROFILES[s.session_type].label} <span className="text-xs text-text-secondary">{Math.round(s.duration_seconds/60)} min</span></span>
              <span className="rounded-full px-2 py-1 text-xs" style={{ background: '#eee', color: '#333' }}>Diff {s.difficulty || '-'} / Mood {s.mood_after || '-'}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Benefits Unlocked</h2>
        <ul className="flex flex-wrap gap-2">
          {Object.entries(THERMAL_PROFILES).map(([type, profile]) => {
            const unlocked = (sessions || []).some((s: any) => s.session_type === type)
            return (
              <li key={type} className={`rounded-2xl px-3 py-1 text-xs border ${unlocked ? 'bg-primary/10 border-primary' : 'bg-surface border-border text-text-secondary'}`}>{profile.emoji} {profile.label}</li>
            )
          })}
        </ul>
      </div>
      <div className="text-xs text-text-secondary mt-8">
        <b>Research basis:</b> Cold immersion: reduces DOMS 24h post-exercise (Bleakley et al. Cochrane 2012). Cold exposure activates brown adipose tissue → 5-8% metabolic increase (Cypess et al. NEJM 2009). Sauna 4+ sessions/week → 50% lower cardiovascular mortality (Laukkanen et al. JAMA IM 2015). Heat shock proteins after 30+ min sauna: neuroprotective (Rhonda Patrick / Howard 2021). Hormesis: controlled stress → adaptation and resilience. Cold shower protocol: 30s–3 min, gradual temperature drop.
      </div>
    </div>
  )
}

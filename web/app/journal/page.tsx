"use client"
import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

const moodEmojis = [
  { score: 1, emoji: '😩' }, { score: 2, emoji: '😔' }, { score: 3, emoji: '😐' },
  { score: 4, emoji: '🙂' }, { score: 5, emoji: '😊' }, { score: 6, emoji: '😄' },
  { score: 7, emoji: '🥰' }, { score: 8, emoji: '⚡' }, { score: 9, emoji: '🌟' }, { score: 10, emoji: '💫' }
]

function MoodSelector({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2 flex-wrap justify-center my-2">
      {moodEmojis.map(({ score, emoji }) => (
        <button
          key={score}
          className={`text-2xl px-2 py-1 rounded-full border ${value === score ? 'bg-primary text-white' : 'bg-surface border-border text-text-primary'}`}
          onClick={() => onChange(score)}
          type="button"
        >{emoji}<span className="sr-only">{score}</span></button>
      ))}
    </div>
  )
}

function EnergySlider({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="my-2">
      <label className="block text-text-secondary text-sm mb-1">Energy level: <b>{value}</b></label>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full" />
    </div>
  )
}

function Collapsible({ title, children }: { title: string, children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-3">
      <button type="button" className="font-semibold text-primary mb-1" onClick={() => setOpen(o => !o)}>{open ? '▼' : '▶'} {title}</button>
      {open && <div className="pl-2">{children}</div>}
    </div>
  )
}

export default function JournalPage() {
  const [tab, setTab] = useState<'today'|'history'>('today')
  const [form, setForm] = useState<any>({ mood_score: 5, energy_level: 5 })
  const [saving, setSaving] = useState(false)
  const [streak, setStreak] = useState(0)
  const [history, setHistory] = useState<any[]>([])
  const [insights, setInsights] = useState<any>({})

  useEffect(() => {
    fetch('/api/journal').then(r => r.json()).then(d => {
      setHistory(d.entries || [])
      setStreak(d.streak || 0)
    })
    fetch('/api/journal/insights').then(r => r.json()).then(setInsights)
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const todayEntry = history.find(e => e.entry_date === today)

  useEffect(() => {
    if (todayEntry) setForm({ ...todayEntry })
  }, [todayEntry])

  async function save() {
    setSaving(true)
    await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setSaving(false)
    window.location.reload()
  }

  // Mood chart data
  const chartData = history.slice(0, 14).reverse().map(e => ({ date: e.entry_date.slice(5), mood: e.mood_score }))

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="flex gap-2 mb-4">
        <button className={`flex-1 py-2 rounded-2xl ${tab==='today'?'bg-primary text-white':'bg-surface border border-border text-text-primary'}`} onClick={()=>setTab('today')}>Today</button>
        <button className={`flex-1 py-2 rounded-2xl ${tab==='history'?'bg-primary text-white':'bg-surface border border-border text-text-primary'}`} onClick={()=>setTab('history')}>History</button>
      </div>
      {tab==='today' ? (
        <form className="space-y-3" onSubmit={e=>{e.preventDefault();save()}}>
          <label className="block text-text-secondary text-sm">How do you feel today?</label>
          <MoodSelector value={form.mood_score} onChange={v=>setForm(f=>({...f, mood_score:v}))} />
          <EnergySlider value={form.energy_level} onChange={v=>setForm(f=>({...f, energy_level:v}))} />
          <Collapsible title="🙏 Three things I'm grateful for today">
            <Input placeholder="Gratitude 1" value={form.gratitude_1||''} onChange={e=>setForm(f=>({...f, gratitude_1:e.target.value}))} className="mb-1" />
            <Input placeholder="Gratitude 2" value={form.gratitude_2||''} onChange={e=>setForm(f=>({...f, gratitude_2:e.target.value}))} className="mb-1" />
            <Input placeholder="Gratitude 3" value={form.gratitude_3||''} onChange={e=>setForm(f=>({...f, gratitude_3:e.target.value}))} />
          </Collapsible>
          <Collapsible title="💭 What challenged me today">
            <textarea className="w-full rounded-2xl border border-border bg-surface p-2" rows={2} value={form.challenge||''} onChange={e=>setForm(f=>({...f, challenge:e.target.value}))} />
          </Collapsible>
          <Collapsible title="🔄 A healthier way to see it">
            <textarea className="w-full rounded-2xl border border-border bg-surface p-2" rows={2} value={form.reframe||''} onChange={e=>setForm(f=>({...f, reframe:e.target.value}))} />
          </Collapsible>
          <Collapsible title="🌅 My intention for tomorrow">
            <Input placeholder="Intention" value={form.intentions||''} onChange={e=>setForm(f=>({...f, intentions:e.target.value}))} />
          </Collapsible>
          <label className="block text-text-secondary text-sm">Anything else on your mind?</label>
          <textarea className="w-full rounded-2xl border border-border bg-surface p-2" rows={3} value={form.free_text||''} onChange={e=>setForm(f=>({...f, free_text:e.target.value}))} />
          <Button type="submit" className="w-full mt-2" disabled={saving}>{saving?'Saving...':`Save${streak?` (🔥 ${streak} day streak!)`:''}`}</Button>
        </form>
      ) : (
        <div>
          <div className="mb-4">
            <div className="font-semibold mb-1">Mood trend (last 14 days)</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={[1,10]} hide />
                <Tooltip />
                <Line type="monotone" dataKey="mood" stroke="#f59e42" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-1">Mood calendar</div>
            <div className="grid grid-cols-7 gap-1">
              {history.slice(0,30).reverse().map(e => (
                <div key={e.entry_date} className={`w-8 h-8 flex items-center justify-center rounded-full border ${e.mood_score>=7?'bg-green-200':e.mood_score>=5?'bg-yellow-100':e.mood_score>=1?'bg-red-200':'bg-gray-100'} text-xs`}>{e.mood_score||''}</div>
              ))}
            </div>
          </div>
          {streak>=3 && <div className="mb-2"><span className="inline-block bg-orange-100 text-orange-800 rounded-2xl px-3 py-1 text-xs">🔥 {streak} day streak!</span></div>}
          {insights?.alert?.alert==='low_mood_streak' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 mb-3">
              <p className="font-semibold text-amber-800 dark:text-amber-200">💛 We noticed you've had a tough few days</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">It's okay not to be okay. Consider talking to someone you trust or a mental health professional.</p>
              <a href="https://www.findahelpline.com" target="_blank" className="text-xs text-amber-600 underline mt-2 block">Find support resources →</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'
import { useState } from 'react'

const SYMPTOMS = ['Cramps','Bloating','Headache','Fatigue','Mood swings','Back pain','Nausea','Spotting']

export function CycleForm({ onLogged }: { onLogged?: () => void }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [flow, setFlow] = useState<'light'|'medium'|'heavy'>('medium')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  function toggleSymptom(s: string) {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate) return
    setLoading(true)
    const res = await fetch('/api/cycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: startDate, end_date: endDate || null, flow_intensity: flow, symptoms: selectedSymptoms, notes }),
    })
    if (res.ok) {
      setStartDate(''); setEndDate(''); setSelectedSymptoms([]); setNotes('')
      setMsg('Cycle logged!')
      setTimeout(() => setMsg(''), 2000)
      onLogged?.()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border p-5 space-y-4 mb-6">
      <h2 className="font-semibold">Log Period</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Start Date *</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full border border-border rounded-lg p-2 text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-border rounded-lg p-2 text-sm bg-background" />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Flow</label>
        <div className="flex gap-2">
          {(['light','medium','heavy'] as const).map(f => (
            <button key={f} type="button" onClick={() => setFlow(f)} className={`flex-1 py-1.5 rounded-lg text-sm border-2 transition-colors capitalize ${flow === f ? 'border-primary bg-primary/10' : 'border-border'}`}>{f}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Symptoms</label>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map(s => (
            <button key={s} type="button" onClick={() => toggleSymptom(s)} className={`px-3 py-1 rounded-full text-xs border transition-colors ${selectedSymptoms.includes(s) ? 'border-primary bg-primary/10' : 'border-border'}`}>{s}</button>
          ))}
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-lg py-2 font-medium disabled:opacity-50">
        {loading ? 'Saving...' : 'Log Period'}
      </button>
      {msg && <p className="text-green-600 text-sm text-center">{msg}</p>}
    </form>
  )
}

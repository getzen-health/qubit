'use client'
import { useState } from 'react'

const WORKOUT_TYPES = ['Running','Cycling','Swimming','Strength','HIIT','Yoga','Walking','Hiking','Rowing','Other']

interface WorkoutFormProps { onAdded?: (w: any) => void }
export function WorkoutForm({ onAdded }: WorkoutFormProps) {
  const [type, setType] = useState('Running')
  const [duration, setDuration] = useState('')
  const [calories, setCalories] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!duration) return
    setLoading(true)
    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, duration_minutes: Number(duration), calories: calories ? Number(calories) : undefined, notes }),
    })
    const data = await res.json()
    if (res.ok) {
      onAdded?.(data.data)
      setDuration(''); setCalories(''); setNotes('')
      setMsg('Workout logged!')
      setTimeout(() => setMsg(''), 2000)
    } else {
      setMsg(data.error || 'Error logging workout')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border p-5 space-y-4 mb-6">
      <h2 className="font-semibold">Log Workout</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-border rounded-lg p-2 text-sm bg-background">
            {WORKOUT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Duration (min) *</label>
          <input type="number" value={duration} onChange={e => setDuration(e.target.value)} required min="1" placeholder="30" className="w-full border border-border rounded-lg p-2 text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Calories</label>
          <input type="number" value={calories} onChange={e => setCalories(e.target.value)} min="0" placeholder="optional" className="w-full border border-border rounded-lg p-2 text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional" className="w-full border border-border rounded-lg p-2 text-sm bg-background" />
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-lg py-2 font-medium disabled:opacity-50">
        {loading ? 'Saving...' : 'Log Workout'}
      </button>
      {msg && <p className={`text-sm text-center ${msg.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
    </form>
  )
}

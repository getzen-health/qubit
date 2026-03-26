'use client'
import { useState } from 'react'

export default function BPForm() {
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [pulse, setPulse] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    const res = await fetch('/api/blood-pressure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systolic, diastolic, pulse, notes })
    })
    if (res.ok) {
      setSuccess(true)
      setSystolic('')
      setDiastolic('')
      setPulse('')
      setNotes('')
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to submit')
    }
    setLoading(false)
  }

  return (
    <form className="mb-6 rounded-xl border border-border p-4" onSubmit={handleSubmit}>
      <h2 className="font-semibold mb-2">Add Blood Pressure</h2>
      <div className="flex gap-2 mb-2">
        <input type="number" required min="50" max="250" placeholder="Systolic" className="input input-bordered w-24" value={systolic} onChange={e => setSystolic(e.target.value)} />
        <input type="number" required min="30" max="150" placeholder="Diastolic" className="input input-bordered w-24" value={diastolic} onChange={e => setDiastolic(e.target.value)} />
        <input type="number" min="30" max="200" placeholder="Pulse (opt)" className="input input-bordered w-28" value={pulse} onChange={e => setPulse(e.target.value)} />
      </div>
      <input type="text" placeholder="Notes (optional)" className="input input-bordered w-full mb-2" value={notes} onChange={e => setNotes(e.target.value)} />
      <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Submit'}</button>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      {success && <div className="text-green-600 text-sm mt-2">Saved!</div>}
    </form>
  )
}

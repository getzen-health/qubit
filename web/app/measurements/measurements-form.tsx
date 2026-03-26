'use client'
import { useState } from 'react'

export default function MeasurementsForm() {
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [neck, setNeck] = useState('')
  const [hips, setHips] = useState('')
  const [height, setHeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    const res = await fetch('/api/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight_kg: weight, waist_cm: waist, neck_cm: neck, hips_cm: hips, height_cm: height })
    })
    if (res.ok) {
      setSuccess(true)
      setWeight('')
      setWaist('')
      setNeck('')
      setHips('')
      setHeight('')
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to submit')
    }
    setLoading(false)
  }

  return (
    <form className="mb-6 rounded-xl border border-border p-4" onSubmit={handleSubmit}>
      <h2 className="font-semibold mb-2">Add Measurement</h2>
      <div className="flex gap-2 mb-2">
        <input type="number" required min="20" max="300" placeholder="Weight (kg)" className="input input-bordered w-32" value={weight} onChange={e => setWeight(e.target.value)} />
        <input type="number" min="30" max="200" placeholder="Waist (cm)" className="input input-bordered w-32" value={waist} onChange={e => setWaist(e.target.value)} />
        <input type="number" min="20" max="60" placeholder="Neck (cm)" className="input input-bordered w-32" value={neck} onChange={e => setNeck(e.target.value)} />
        <input type="number" min="30" max="200" placeholder="Hips (cm)" className="input input-bordered w-32" value={hips} onChange={e => setHips(e.target.value)} />
        <input type="number" min="100" max="250" placeholder="Height (cm)" className="input input-bordered w-32" value={height} onChange={e => setHeight(e.target.value)} />
      </div>
      <div className="text-xs text-muted-foreground mb-2">Body fat % is calculated from neck, waist, hips, and height.</div>
      <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Submit'}</button>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      {success && <div className="text-green-600 text-sm mt-2">Saved!</div>}
    </form>
  )
}

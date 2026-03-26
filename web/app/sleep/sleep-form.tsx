'use client'
import { useState } from 'react'

export function SleepForm({ onSuccess }: { onSuccess?: () => void }) {
  const [bedtime, setBedtime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [quality, setQuality] = useState(3)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bedtime, wake_time: wakeTime, quality }),
    })
    if (res.ok) {
      setMessage('Sleep logged!')
      setBedtime('')
      setWakeTime('')
      setQuality(3)
      onSuccess && onSuccess()
      setTimeout(() => setMessage(''), 2000)
    } else {
      const data = await res.json()
      setMessage(data.error || 'Error logging sleep')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border p-6 mb-8 space-y-4">
      <h2 className="font-semibold">Log Sleep Session</h2>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Bedtime</label>
        <input type="datetime-local" value={bedtime} onChange={e => setBedtime(e.target.value)} required className="border rounded-lg p-2" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Wake Time</label>
        <input type="datetime-local" value={wakeTime} onChange={e => setWakeTime(e.target.value)} required className="border rounded-lg p-2" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Quality</label>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(n => (
            <button type="button" key={n} onClick={() => setQuality(n)} className={`text-2xl ${quality >= n ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{quality} / 5</span>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-lg py-2 font-medium disabled:opacity-50">
        {loading ? 'Logging...' : 'Log Sleep'}
      </button>
      {message && <p className="text-center text-sm text-green-600">{message}</p>}
    </form>
  )
}

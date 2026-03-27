'use client'
import { useState } from 'react'

function parseDuration(bedtimeStr: string, wakeStr: string): { hours: number; minutes: number; error?: string } | null {
  if (!bedtimeStr || !wakeStr) return null
  const bed = new Date(bedtimeStr)
  const wake = new Date(wakeStr)
  if (isNaN(bed.getTime()) || isNaN(wake.getTime())) return null
  // Handle midnight crossing: if wake is before bed, add 1 day
  if (wake <= bed) wake.setDate(wake.getDate() + 1)
  const diffMs = wake.getTime() - bed.getTime()
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.round((diffMs % 3600000) / 60000)
  if (hours < 1) return { hours, minutes, error: 'Sleep too short (< 1 hour)' }
  if (hours > 14) return { hours, minutes, error: 'Sleep too long (> 14 hours)' }
  return { hours, minutes }
}

export function SleepForm({ onSuccess }: { onSuccess?: () => void }) {
  const [bedtime, setBedtime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [quality, setQuality] = useState(3)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const duration = parseDuration(bedtime, wakeTime)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (duration?.error) {
      setMessage({ text: duration.error, ok: false })
      return
    }
    if (!duration) {
      setMessage({ text: 'Please fill in both times', ok: false })
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedtime,
          wake_time: wakeTime,
          quality,
          duration_minutes: duration.hours * 60 + duration.minutes,
        }),
      })
      if (res.ok) {
        setMessage({ text: 'Sleep logged!', ok: true })
        setBedtime('')
        setWakeTime('')
        setQuality(3)
        onSuccess?.()
        setTimeout(() => setMessage(null), 3000)
      } else {
        const data = await res.json()
        setMessage({ text: data.error || 'Error logging sleep', ok: false })
      }
    } catch {
      setMessage({ text: 'Network error — please try again', ok: false })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border p-6 mb-8 space-y-4">
      <h2 className="font-semibold">Log Sleep Session</h2>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Bedtime</label>
        <input
          type="datetime-local"
          value={bedtime}
          onChange={e => setBedtime(e.target.value)}
          required
          className="border rounded-lg p-2"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Wake Time</label>
        <input
          type="datetime-local"
          value={wakeTime}
          onChange={e => setWakeTime(e.target.value)}
          required
          className="border rounded-lg p-2"
        />
        {duration && !duration.error && (
          <p className="text-xs text-muted-foreground">
            Duration: {duration.hours}h {duration.minutes}m
          </p>
        )}
        {duration?.error && (
          <p className="text-xs text-red-500">{duration.error}</p>
        )}
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
      <button
        type="submit"
        disabled={loading || !!duration?.error}
        className="w-full bg-primary text-primary-foreground rounded-lg py-2 font-medium disabled:opacity-50"
      >
        {loading ? 'Logging...' : 'Log Sleep'}
      </button>
      {message && (
        <p className={`text-center text-sm ${message.ok ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </form>
  )
}

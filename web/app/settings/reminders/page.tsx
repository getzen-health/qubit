'use client'

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const hourOptions = Array.from({ length: 7 }, (_, i) => 6 + i) // 6am-12pm
const endHourOptions = Array.from({ length: 11 }, (_, i) => 12 + i) // 12pm-10pm
const intervalOptions = [1, 1.5, 2, 3, 4]

function formatHour(hour: number) {
  const h = hour % 24
  const ampm = h < 12 ? 'AM' : 'PM'
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display}:00 ${ampm}`
}

function getNextReminder(start: number, end: number, interval: number) {
  const now = new Date()
  let hour = start
  while (hour <= end) {
    if (now.getHours() < hour) return hour
    hour += interval
  }
  return null
}

export default function HydrationRemindersPage() {
  const [enabled, setEnabled] = useState(true)
  const [startHour, setStartHour] = useState(8)
  const [endHour, setEndHour] = useState(20)
  const [interval, setInterval] = useState(2)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/reminders/hydration')
      .then(r => r.json())
      .then(data => {
        setEnabled(data.enabled ?? true)
        setStartHour(data.start_hour ?? 8)
        setEndHour(data.end_hour ?? 20)
        setInterval(data.interval_hours ?? 2)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)
    const res = await fetch('/api/reminders/hydration', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled,
        start_hour: startHour,
        end_hour: endHour,
        interval_hours: interval
      })
    })
    if (!res.ok) {
      setError('Failed to save')
    } else {
      setSuccess(true)
    }
    setSaving(false)
  }

  const next = getNextReminder(startHour, endHour, interval)

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Hydration Reminders</h1>
      {loading ? <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" /></div> : (
        <>
          <div className="flex items-center mb-4">
            <Switch checked={enabled} onCheckedChange={setEnabled} id="enabled" />
            <label htmlFor="enabled" className="ml-2">Enable reminders</label>
          </div>
          <div className="mb-4">
            <label className="block mb-1">Start time</label>
            <Select value={String(startHour)} onValueChange={v => setStartHour(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {hourOptions.map(h => (
                  <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mb-4">
            <label className="block mb-1">End time</label>
            <Select value={String(endHour)} onValueChange={v => setEndHour(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {endHourOptions.map(h => (
                  <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mb-4">
            <label className="block mb-1">Interval</label>
            <Select value={String(interval)} onValueChange={v => setInterval(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {intervalOptions.map(i => (
                  <SelectItem key={i} value={String(i)}>{i} hour{i !== 1 ? 's' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? 'Saving...' : 'Save'}</Button>
          {error && <div className="text-red-500 mt-2">{error}</div>}
          {success && <div className="text-green-600 mt-2">Saved!</div>}
          <div className="mt-4 text-sm text-gray-600">
            Next reminder at: {next ? formatHour(next) : 'Tomorrow'}
          </div>
        </>
      )}
    </div>
  )
}

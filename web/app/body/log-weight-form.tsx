'use client'

import { useState, useTransition } from 'react'
import { logWeight } from './actions'

export function LogWeightForm({ latestKg }: { latestKg?: number }) {
  const [kg, setKg] = useState(latestKg?.toFixed(1) ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = parseFloat(kg)
    if (isNaN(value) || value <= 0) { setError('Enter a valid weight'); return }
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await logWeight(value)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="number"
          step="0.1"
          min="20"
          max="500"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          placeholder="e.g. 75.5"
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary pointer-events-none">kg</span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {pending ? 'Saving…' : success ? 'Saved!' : 'Log'}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </form>
  )
}

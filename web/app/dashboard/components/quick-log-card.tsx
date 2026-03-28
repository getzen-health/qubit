'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface QuickAction {
  label: string
  icon: string
  action: () => Promise<void> | void
}

function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  function show(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2000)
  }
  return { message, show }
}

export function QuickLogCard() {
  const router = useRouter()
  const { message, show } = useToast()
  const [busy, setBusy] = useState<string | null>(null)

  async function postAndToast(key: string, url: string, body: object, successMsg: string) {
    if (busy) return
    setBusy(key)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) show(successMsg)
      else show('Failed — try again')
    } catch {
      show('Failed — try again')
    } finally {
      setBusy(null)
    }
  }

  const actions: QuickAction[] = [
    {
      label: '+250ml',
      icon: '💧',
      action: () => postAndToast('water', '/api/water', { amount_ml: 250 }, '💧 +250 ml logged'),
    },
    {
      label: 'Coffee',
      icon: '☕',
      action: () =>
        postAndToast(
          'coffee',
          '/api/caffeine',
          { drink_type: 'coffee', caffeine_mg: 95 },
          '☕ Coffee logged'
        ),
    },
    {
      label: 'Energy',
      icon: '⚡',
      action: () => router.push('/energy'),
    },
    {
      label: 'Mood',
      icon: '😴',
      action: () => router.push('/mood'),
    },
  ]

  return (
    <div className="bg-surface border border-border rounded-2xl px-4 py-3 mb-4">
      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg pointer-events-none animate-fade-in">
          {message}
        </div>
      )}
      <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
        Quick Log
      </p>
      <div className="flex gap-2 flex-wrap">
        {actions.map(({ label, icon, action }) => (
          <button
            key={label}
            onClick={() => void action()}
            disabled={busy !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-sm font-medium text-text-primary hover:bg-surface-secondary hover:border-accent/40 transition-colors disabled:opacity-50 active:scale-95"
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

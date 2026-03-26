"use client"
import { useState, useEffect } from 'react'

const QUICK_AMOUNTS = [
  { label: 'Sip', ml: 100, emoji: '💧' },
  { label: 'Small', ml: 200, emoji: '🥤' },
  { label: 'Can', ml: 330, emoji: '🥫' },
  { label: 'Bottle', ml: 500, emoji: '🍼' },
  { label: 'Large', ml: 750, emoji: '🫙' },
  { label: '1L', ml: 1000, emoji: '🏺' },
]

const DRINK_TYPES = [
  { id: 'water', label: 'Water', emoji: '💧' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'tea', label: 'Tea', emoji: '🍵' },
  { id: 'juice', label: 'Juice', emoji: '🍊' },
  { id: 'sports_drink', label: 'Sports', emoji: '⚡' },
  { id: 'milk', label: 'Milk', emoji: '🥛' },
]

export default function HydrationPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('water')
  const [customMl, setCustomMl] = useState('')
  const [logging, setLogging] = useState(false)
  const [recentLog, setRecentLog] = useState<string | null>(null)

  const refresh = () =>
    fetch('/api/hydration/target').then(r => r.json()).then(d => { setData(d); setLoading(false) })

  useEffect(() => { refresh() }, [])

  const logDrink = async (ml: number) => {
    setLogging(true)
    await fetch('/api/hydration/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_ml: ml, drink_type: selectedType }),
    })
    setRecentLog(`+${ml}ml logged!`)
    setTimeout(() => setRecentLog(null), 2000)
    await refresh()
    setLogging(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-secondary">Loading...</div>

  const pct = data?.percentage ?? 0
  // Water fill height for the bottle visual (0-100%)
  const fillHeight = pct

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Hydration</h1>
        <p className="text-sm text-text-secondary mb-6">
          Target: {((data?.target_ml ?? 2000) / 1000).toFixed(1)}L/day
          {data?.exercise_bonus_ml > 0 && ` (+${(data.exercise_bonus_ml/1000).toFixed(1)}L for today's workout)`}
        </p>

        {/* Water bottle visualization */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Bottle shape using border-radius */}
            <div className="w-24 h-44 rounded-b-3xl rounded-t-lg border-4 border-blue-300 overflow-hidden bg-gray-50 relative">
              {/* Water fill */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-blue-400/70 transition-all duration-1000 rounded-b-2xl"
                style={{ height: `${fillHeight}%` }}
              />
              {/* Percentage text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-700">{pct}%</span>
              </div>
            </div>
            {/* Status */}
            <div className="text-center mt-2">
              <span className="text-xl">{data?.status_emoji}</span>
              <p className="text-xs text-text-secondary mt-0.5">{data?.status?.replace('-', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-border p-3 text-center">
            <div className="font-bold text-primary">{((data?.consumed_ml ?? 0) / 1000).toFixed(1)}L</div>
            <div className="text-xs text-text-secondary">Consumed</div>
          </div>
          <div className="bg-white rounded-xl border border-border p-3 text-center">
            <div className="font-bold text-text-primary">{((data?.target_ml ?? 2000) / 1000).toFixed(1)}L</div>
            <div className="text-xs text-text-secondary">Target</div>
          </div>
          <div className="bg-white rounded-xl border border-border p-3 text-center">
            <div className="font-bold text-orange-500">{((data?.remaining_ml ?? 0) / 1000).toFixed(1)}L</div>
            <div className="text-xs text-text-secondary">Remaining</div>
          </div>
        </div>

        {/* Drink type selector */}
        <div className="mb-4">
          <p className="text-xs font-medium text-text-secondary mb-2">Drink type</p>
          <div className="flex gap-2 flex-wrap">
            {DRINK_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 rounded-xl border text-sm transition-all ${selectedType === t.id ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border text-text-secondary'}`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick-add buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a.ml}
              onClick={() => logDrink(a.ml)}
              disabled={logging}
              className="bg-white border border-border rounded-xl p-3 text-center hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
            >
              <div className="text-xl">{a.emoji}</div>
              <div className="text-sm font-semibold text-text-primary">{a.label}</div>
              <div className="text-xs text-text-secondary">{a.ml}ml</div>
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            placeholder="Custom ml..."
            value={customMl}
            onChange={e => setCustomMl(e.target.value)}
            className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary bg-white"
          />
          <button
            onClick={() => { if (customMl) { logDrink(parseInt(customMl)); setCustomMl('') } }}
            disabled={!customMl || logging}
            className="bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            Log
          </button>
        </div>

        {/* Recent log toast */}
        {recentLog && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            {recentLog}
          </div>
        )}

        {/* Today's log */}
        {data?.logs?.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-4">
            <h3 className="font-semibold text-text-primary mb-3">Today's Log</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...data.logs].reverse().slice(0, 10).map((log: any) => (
                <div key={log.id} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{DRINK_TYPES.find(t => t.id === log.drink_type)?.emoji ?? '💧'}</span>
                    <span className="text-text-secondary capitalize">{log.drink_type ?? 'water'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-text-primary">{log.amount_ml}ml</span>
                    <span className="text-xs text-text-secondary">{new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Science note */}
        <p className="text-xs text-text-secondary text-center mt-4">
          Target based on EFSA 2023 guidelines (35ml/kg) + exercise adjustment
        </p>
      </div>
    </div>
  )
}

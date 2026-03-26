'use client'
import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Droplets, Plus, Trash2 } from 'lucide-react'

const DAILY_GOAL_ML = 2500
const QUICK_AMOUNTS = [200, 300, 500, 750]

interface WaterEntry { id: string; amount_ml: number; logged_at: string }
interface WeeklyPoint { date: string; ml: number; L: string }

function CircularProgress({ value, max }: { value: number; max: number }) {
  const size = 180
  const sw = 16
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#3b82f6" strokeWidth={sw}
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Droplets className="w-6 h-6 text-blue-400 mb-1" />
        <span className="text-2xl font-bold text-text-primary">{(value/1000).toFixed(1)}L</span>
        <span className="text-xs text-text-secondary">of {max/1000}L goal</span>
        <span className="text-xs text-blue-400 font-medium mt-1">{Math.round(pct*100)}%</span>
      </div>
    </div>
  )
}

export default function WaterPage() {
  const [entries, setEntries] = useState<WaterEntry[]>([])
  const [total, setTotal] = useState(0)
  const [weekly, setWeekly] = useState<WeeklyPoint[]>([])
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/water').then(r => r.json()),
      fetch('/api/water/weekly').then(r => r.json()),
    ]).then(([today, week]) => {
      setEntries(today.data ?? [])
      setTotal(today.total ?? 0)
      setWeekly(week.data ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function addWater(ml: number) {
    if (!ml || ml <= 0) return
    await fetch('/api/water', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount_ml: ml }) })
    loadData()
  }

  async function deleteEntry(id: string) {
    await fetch('/api/water', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadData()
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Water Tracker</h1>

      {loading ? <div className="h-48 animate-pulse bg-surface rounded-2xl" /> : (
        <>
          <CircularProgress value={total} max={DAILY_GOAL_ML} />
          
          <div className="grid grid-cols-4 gap-2 mt-6">
            {QUICK_AMOUNTS.map(ml => (
              <button key={ml} onClick={() => addWater(ml)}
                className="flex flex-col items-center py-3 bg-surface border border-border rounded-xl hover:border-blue-500 transition-colors">
                <Plus className="w-4 h-4 text-blue-400 mb-1" />
                <span className="text-xs font-semibold text-text-primary">{ml}ml</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <input type="number" placeholder="Custom (ml)" value={custom}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustom(e.target.value)}
              className="flex-1 bg-surface border border-border rounded-xl px-4 py-2 text-text-primary text-sm" />
            <button onClick={() => { addWater(parseInt(custom) || 0); setCustom('') }}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold">Add</button>
          </div>

          <div className="mt-6">
            <h2 className="font-semibold text-text-primary mb-3">This Week</h2>
            <div className="bg-surface rounded-2xl border border-border p-4">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={weekly}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => [`${(v/1000).toFixed(1)}L`, 'Water']} contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
                  <ReferenceLine y={DAILY_GOAL_ML} stroke="#3b82f6" strokeDasharray="4 4" />
                  <Bar dataKey="ml" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="font-semibold text-text-primary mb-3">Today&apos;s Log</h2>
            {entries.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-6">No entries yet today</p>
            ) : (
              <div className="space-y-2">
                {entries.map(e => (
                  <div key={e.id} className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-text-primary">{e.amount_ml} ml</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary">{new Date(e.logged_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
                      <button onClick={() => deleteEntry(e.id)} className="text-text-secondary hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}


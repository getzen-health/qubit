'use client'
import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts'
import { Activity, Trash2, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'

// WHO/ADA reference ranges (mmol/L)
const RANGES = {
  fasting: { low: 3.9, normal_low: 3.9, normal_high: 5.6, high: 7.0 },
  post_meal: { low: 3.9, normal_low: 3.9, normal_high: 7.8, high: 11.0 },
  default: { low: 3.9, normal_low: 3.9, normal_high: 7.8, high: 11.0 },
}

const CONTEXT_LABELS: Record<string, string> = {
  fasting: 'Fasting', post_meal: 'Post-meal', pre_meal: 'Pre-meal',
  random: 'Random', bedtime: 'Bedtime'
}

interface GlucoseEntry {
  id: string; value_mmol: number; value_mgdl: number
  context: string; notes: string | null; logged_at: string
}

function getStatus(value: number, context: string): { label: string; color: string } {
  const range = RANGES[context as keyof typeof RANGES] ?? RANGES.default
  if (value < range.low) return { label: 'Low', color: 'text-red-400' }
  if (value <= range.normal_high) return { label: 'Normal', color: 'text-green-400' }
  if (value <= range.high) return { label: 'Elevated', color: 'text-yellow-400' }
  return { label: 'High', color: 'text-red-400' }
}

export default function GlucosePage() {
  const [readings, setReadings] = useState<GlucoseEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/glucose')
      .then(r => r.json())
      .then(d => { setReadings(d.records ?? []); setLoading(false) })
      .catch(() => { setError('Failed to load glucose data'); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Blood Glucose</h1>
            <p className="text-sm text-text-secondary">CGM &amp; glucose meter data</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {loading && <p className="text-text-secondary text-center py-8">Loading glucose data…</p>}
        {error && <p className="text-red-400 text-center py-8">{error}</p>}
        {!loading && !error && readings.length === 0 && (
          <p className="text-text-secondary text-center py-8">No glucose readings found. Sync your data or log manually.</p>
        )}
        {readings.length > 0 && (
          <ul className="space-y-3">
            {readings.map(r => {
              const status = getStatus(r.value_mmol, r.context)
              return (
                <li key={r.id} className="bg-surface rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-primary">{r.value_mmol} mmol/L <span className="text-text-secondary text-sm">({r.value_mgdl} mg/dL)</span></p>
                    <p className="text-sm text-text-secondary">{CONTEXT_LABELS[r.context] ?? r.context} · {new Date(r.logged_at).toLocaleString()}</p>
                  </div>
                  <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                </li>
              )
            })}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  )
}

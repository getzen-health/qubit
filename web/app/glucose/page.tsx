'use client'
import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts'
import { Activity, Trash2, Plus } from 'lucide-react'

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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneDayAgo = new Date(Date.now() - 86400000).toISOString()

  const { data: records } = await supabase
    .from('health_records')
    .select('value, start_time')
    .eq('user_id', user.id)
    .eq('type', 'blood_glucose')
    .gte('start_time', oneDayAgo)
    .gt('value', 0)
    .order('start_time', { ascending: true })
    .limit(288)

  const readings = (records ?? [])
    .filter((r) => r.value > 30 && r.value < 600)
    .map((r) => ({
      timestamp: r.start_time,
      mgdl: Math.round(r.value),
      mmol: +(r.value / 18.0).toFixed(1),
      hour: new Date(r.start_time).getHours(),
    }))

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
        <GlucoseClient readings={readings} />
      </main>
      <BottomNav />
    </div>
  )
}

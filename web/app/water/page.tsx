'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, Droplets } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface WaterLog {
  id: string
  amount_ml: number
  logged_at: string
}

interface DailyWater {
  date: string
  total_ml: number
}

const QUICK_AMOUNTS = [
  { label: 'Cup', ml: 150 },
  { label: 'Glass', ml: 250 },
  { label: 'Bottle', ml: 500 },
  { label: '1L', ml: 1000 },
]

function ProgressRing({ totalMl, targetMl }: { totalMl: number; targetMl: number }) {
  const size = 160
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = targetMl > 0 ? Math.min(totalMl / targetMl, 1) : 0
  const offset = circumference * (1 - progress)
  const center = size / 2
  const pct = Math.round(progress * 100)

  const colorClass = totalMl >= targetMl ? '#22c55e' : totalMl >= targetMl * 0.5 ? '#3b82f6' : '#60a5fa'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth={strokeWidth} />
          <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={colorClass} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <Droplets className="w-6 h-6 text-blue-400" />
          <span className="text-2xl font-bold text-text-primary leading-none">
            {totalMl >= 1000 ? `${(totalMl / 1000).toFixed(1)}L` : `${totalMl}ml`}
          </span>
          <span className="text-xs text-text-secondary leading-none">{pct}% of goal</span>
        </div>
      </div>
      <p className="text-sm text-text-secondary">
        Goal: {targetMl >= 1000 ? `${(targetMl / 1000).toFixed(1)}L` : `${targetMl}ml`} /day
      </p>
    </div>
  )
}

import { WaterClient } from './water-client'

export default async function WaterPage() {
  // Fetch initial data for SSR
  const today = new Date().toISOString().slice(0, 10)
  let total = 0
  let logs: any[] = []
  let goal = 2500
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_today_water`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' }
    })
    if (res.ok) {
      const data = await res.json()
      total = data.total_ml ?? 0
      logs = data.logs ?? []
      goal = data.goal_ml ?? 2500
    }
  } catch {}
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <WaterClient initialTotal={total} initialLogs={logs as any[]} goal={goal} />
      </div>
    </div>
  )
}


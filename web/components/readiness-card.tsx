'use client'
import { useEffect, useState } from 'react'
import { Zap, Moon, Heart, Activity } from 'lucide-react'
import Link from 'next/link'

interface ReadinessData {
  score: number
  status: 'optimal' | 'good' | 'recovery'
  advice: string
  factors: string[]
  components: { hrv: number; sleep: number; restingHr: number; strain: number }
}

const STATUS_CONFIG = {
  optimal: { label: 'Optimal', color: 'text-green-400', bg: 'from-green-500/20 to-green-500/5', border: 'border-green-500/30', ring: '#22c55e' },
  good: { label: 'Good', color: 'text-yellow-400', bg: 'from-yellow-500/20 to-yellow-500/5', border: 'border-yellow-500/30', ring: '#eab308' },
  recovery: { label: 'Recovery', color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/30', ring: '#3b82f6' },
}

const COMPONENT_ICONS = [
  { key: 'hrv', label: 'HRV', icon: Activity, max: 30 },
  { key: 'sleep', label: 'Sleep', icon: Moon, max: 25 },
  { key: 'restingHr', label: 'Resting HR', icon: Heart, max: 20 },
  { key: 'strain', label: 'Strain', icon: Zap, max: 25 },
]

export function ReadinessCard() {
  const [data, setData] = useState<ReadinessData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/readiness')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-40 animate-pulse bg-surface rounded-2xl border border-border" />
  if (!data) return null

  const cfg = STATUS_CONFIG[data.status]
  const circumference = 2 * Math.PI * 38
  const dash = (data.score / 100) * circumference

  return (
    <div className={`bg-gradient-to-br ${cfg.bg} border ${cfg.border} rounded-2xl p-4`}>
      <div className="flex items-center gap-4">
        {/* Score ring */}
        <div className="relative flex-shrink-0">
          <svg width={88} height={88} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={44} cy={44} r={38} fill="none" stroke="#333" strokeWidth={8} />
            <circle cx={44} cy={44} r={38} fill="none" stroke={cfg.ring} strokeWidth={8}
              strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-text-primary">{data.score}</span>
            <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text-primary">Today&apos;s Readiness</h3>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">{data.advice}</p>
          {data.factors.length > 0 && (
            <p className="text-xs text-text-secondary mt-1 line-clamp-1">• {data.factors[0]}</p>
          )}
        </div>
      </div>

      {/* Component bars */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {COMPONENT_ICONS.map(({ key, label, icon: Icon, max }) => {
          const val = data.components[key as keyof typeof data.components]
          const pct = (val / max) * 100
          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <Icon className="w-3 h-3 text-text-secondary" />
              <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[9px] text-text-secondary">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

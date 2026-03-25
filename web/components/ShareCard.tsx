'use client'

import { useRef, useState } from 'react'
import { Copy, Download, Check, Activity, Moon, Heart, Flame, Wind } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ShareCardMetrics {
  steps: number
  stepGoal?: number
  hrv?: number
  sleepHours?: number
  sleepGoalHours?: number
  calories?: number
  calorieGoal?: number
  restingHR?: number
  vo2max?: number
  date?: string
  userName?: string
  avatarUrl?: string
}

interface ShareCardProps {
  metrics: ShareCardMetrics
  shareUrl?: string
}

function MetricTile({
  icon,
  label,
  value,
  unit,
  subtext,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  subtext?: string
  color: string
}) {
  return (
    <div className="flex-1 flex flex-col gap-1 min-w-0">
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', color)}>
        {icon}
      </div>
      <div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-xl font-bold text-white leading-none">{value}</span>
          {unit && <span className="text-[10px] text-white/60 leading-none">{unit}</span>}
        </div>
        <p className="text-[10px] text-white/50 leading-tight mt-0.5">{label}</p>
        {subtext && <p className="text-[10px] text-white/40 leading-tight">{subtext}</p>}
      </div>
    </div>
  )
}

function formatDate(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatSteps(steps: number): string {
  if (steps >= 1000) return (steps / 1000).toFixed(1) + 'k'
  return steps.toString()
}

export function ShareCard({ metrics, shareUrl }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const {
    steps,
    stepGoal,
    hrv,
    sleepHours,
    sleepGoalHours,
    calories,
    restingHR,
    vo2max,
    date,
    userName,
  } = metrics

  const handleCopyLink = async () => {
    const url = shareUrl ?? window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
    }
  }

  const handleDownload = async () => {
    const card = cardRef.current
    if (!card) return
    setDownloading(true)
    try {
      // Use html2canvas if available, otherwise use a screenshot API
      // For now, we use a simple approach via the Canvas API equivalent
      const { default: html2canvas } = await import('html2canvas').catch(() => ({ default: null }))
      if (html2canvas) {
        const canvas = await html2canvas(card, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(({ scale: 2, useCORS: true, backgroundColor: null }) as any),
        })
        const link = document.createElement('a')
        link.download = `kquarks-health-${date ?? new Date().toISOString().slice(0, 10)}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } else {
        // Fallback: copy the share URL
        await handleCopyLink()
      }
    } catch {
      // Silently fail — user can screenshot manually
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Card — 640×360 px */}
      <div
        ref={cardRef}
        style={{ width: 640, height: 360 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#18103a] via-[#1a1235] to-[#0d0d1e] shadow-2xl flex flex-col justify-between p-8"
        aria-label="Health snapshot card"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-violet-700/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-24 rounded-full bg-purple-500/5 blur-2xl" />
        </div>

        {/* Header row */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-widest text-purple-400 uppercase">KQuarks</p>
              {userName && (
                <p className="text-[10px] text-white/40 leading-tight">{userName}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-white/60">{formatDate(date)}</p>
            <p className="text-[10px] text-white/30 mt-0.5">Health Snapshot</p>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="relative flex gap-6 items-end">
          <MetricTile
            icon={<Activity className="w-3.5 h-3.5 text-green-300" />}
            label="Steps"
            value={formatSteps(steps)}
            subtext={stepGoal ? `/ ${formatSteps(stepGoal)} goal` : undefined}
            color="bg-green-500/20"
          />
          {hrv !== undefined && (
            <MetricTile
              icon={<Heart className="w-3.5 h-3.5 text-purple-300" />}
              label="HRV"
              value={Math.round(hrv)}
              unit="ms"
              color="bg-purple-500/20"
            />
          )}
          {sleepHours !== undefined && (
            <MetricTile
              icon={<Moon className="w-3.5 h-3.5 text-blue-300" />}
              label="Sleep"
              value={sleepHours.toFixed(1)}
              unit="h"
              subtext={sleepGoalHours ? `/ ${sleepGoalHours}h goal` : undefined}
              color="bg-blue-500/20"
            />
          )}
          {calories !== undefined && (
            <MetricTile
              icon={<Flame className="w-3.5 h-3.5 text-orange-300" />}
              label="Calories"
              value={calories >= 1000 ? (calories / 1000).toFixed(1) + 'k' : calories}
              unit={calories >= 1000 ? '' : 'cal'}
              color="bg-orange-500/20"
            />
          )}
          {restingHR !== undefined && (
            <MetricTile
              icon={<Heart className="w-3.5 h-3.5 text-red-300" />}
              label="Resting HR"
              value={Math.round(restingHR)}
              unit="bpm"
              color="bg-red-500/20"
            />
          )}
          {vo2max !== undefined && (
            <MetricTile
              icon={<Wind className="w-3.5 h-3.5 text-cyan-300" />}
              label="VO₂max"
              value={Math.round(vo2max)}
              unit="ml/kg/min"
              color="bg-cyan-500/20"
            />
          )}
        </div>

        {/* Footer */}
        <div className="relative flex items-center justify-between">
          <p className="text-[10px] text-white/20 tracking-wide">kquarks.com</p>
          <div className="flex gap-1">
            {[steps, hrv, sleepHours, calories, vo2max].filter(Boolean).map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-purple-500/40" />
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCopyLink}
          aria-label={copied ? 'Link copied to clipboard' : 'Copy health snapshot link'}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl border transition-all',
            copied
              ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
              : 'bg-surface-secondary border-border text-text-secondary hover:text-text-primary hover:border-purple-500/30'
          )}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          aria-label={downloading ? 'Saving snapshot as image' : 'Download health snapshot as image'}
          className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-60"
        >
          <Download className="w-3.5 h-3.5" />
          {downloading ? 'Saving…' : 'Download'}
        </button>
      </div>
    </div>
  )
}

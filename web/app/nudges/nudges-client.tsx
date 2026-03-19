'use client'

import {
  Activity,
  Zap,
  Moon,
  Heart,
  Flame,
  Footprints,
  RefreshCw,
  Map,
  TriangleAlert,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

export interface Nudge {
  id: string
  icon: string
  colorClass: string
  bgClass: string
  category: string
  title: string
  body: string
  action: string | null
  priority: number  // 0=positive 1=caution 2=urgent
}

interface Props {
  nudges: Nudge[]
  rowCount: number
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  waveform: Activity,
  heart: Heart,
  moon: Moon,
  footprints: Footprints,
  flame: Flame,
  zap: Zap,
  activity: Activity,
  refresh: RefreshCw,
  map: Map,
}

function NudgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Activity
  return <Icon className={className} />
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority === 2) return (
    <span className="flex items-center gap-1 text-xs font-medium text-orange-400">
      <TriangleAlert className="w-3 h-3" />
      Urgent
    </span>
  )
  if (priority === 1) return (
    <span className="flex items-center gap-1 text-xs font-medium text-yellow-400">
      <AlertCircle className="w-3 h-3" />
      Caution
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-400">
      <CheckCircle2 className="w-3 h-3" />
      Positive
    </span>
  )
}

function NudgeCard({ nudge }: { nudge: Nudge }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg ${nudge.bgClass} flex items-center justify-center shrink-0`}>
          <NudgeIcon name={nudge.icon} className={`w-5 h-5 ${nudge.colorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-semibold tracking-wide uppercase ${nudge.colorClass}`}>
              {nudge.category}
            </span>
            <PriorityBadge priority={nudge.priority} />
          </div>
          <p className="text-sm font-semibold text-text-primary leading-snug">{nudge.title}</p>
        </div>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed">{nudge.body}</p>

      {nudge.action && (
        <div className={`rounded-lg ${nudge.bgClass} px-3 py-2 flex items-start gap-2`}>
          <span className={`text-xs font-medium ${nudge.colorClass} leading-relaxed`}>
            → {nudge.action}
          </span>
        </div>
      )}
    </div>
  )
}

export function NudgesClient({ nudges, rowCount }: Props) {
  if (rowCount < 5) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Zap className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">Not Enough Data Yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync at least 5 days of health data from your iOS app to receive personalised recommendations.
        </p>
      </div>
    )
  }

  if (nudges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">All Metrics Look Good!</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Your HRV, sleep, steps, and activity are all within healthy ranges. Keep up the great work.
        </p>
      </div>
    )
  }

  const urgent  = nudges.filter(n => n.priority === 2)
  const caution = nudges.filter(n => n.priority === 1)
  const positive = nudges.filter(n => n.priority === 0)

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Urgent',   count: urgent.length,   color: 'text-red-400',    bg: 'bg-red-500/10' },
          { label: 'Caution',  count: caution.length,  color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Positive', count: positive.length, color: 'text-green-400',  bg: 'bg-green-500/10' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Urgent */}
      {urgent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
            <TriangleAlert className="w-3.5 h-3.5 text-orange-400" />
            Needs Attention
          </h2>
          {urgent.map(n => <NudgeCard key={n.id} nudge={n} />)}
        </section>
      )}

      {/* Caution */}
      {caution.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
            Watch Out For
          </h2>
          {caution.map(n => <NudgeCard key={n.id} nudge={n} />)}
        </section>
      )}

      {/* Positive */}
      {positive.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            Looking Good
          </h2>
          {positive.map(n => <NudgeCard key={n.id} nudge={n} />)}
        </section>
      )}

      <p className="text-xs text-text-secondary text-center opacity-40 pb-2">
        Based on your last 14 days of synced data · Rule-based, not AI
      </p>
    </div>
  )
}

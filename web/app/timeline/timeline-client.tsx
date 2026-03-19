'use client'

import Link from 'next/link'
import type { TimelineEvent, EventKind } from './page'

const KIND_LABEL: Record<EventKind, string> = {
  workout: 'Workout',
  sleep: 'Sleep',
  hrv_high: 'HRV',
  hrv_low: 'HRV',
  step_pr: 'Steps',
  step_goal: 'Steps',
  calorie_high: 'Activity',
}

interface Props {
  events: TimelineEvent[]
}

function groupByDate(events: TimelineEvent[]): [string, TimelineEvent[]][] {
  const map = new Map<string, TimelineEvent[]>()
  for (const e of events) {
    const arr = map.get(e.date) ?? []
    arr.push(e)
    map.set(e.date, arr)
  }
  // Already sorted newest first
  return [...map.entries()]
}

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function TimelineClient({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <span className="text-5xl">📋</span>
        <h2 className="text-lg font-semibold text-text-primary">No events yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your Apple Health data to see workouts, sleep, and key health events in your timeline.
        </p>
        <Link
          href="/sync"
          className="mt-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Sync Health Data
        </Link>
      </div>
    )
  }

  const grouped = groupByDate(events)

  // Count by kind for summary
  const workoutCount = events.filter((e) => e.kind === 'workout').length
  const sleepCount   = events.filter((e) => e.kind === 'sleep').length
  const prCount      = events.filter((e) => e.kind === 'step_pr').length

  return (
    <div className="space-y-6">
      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: `${workoutCount} workouts`, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
          { label: `${sleepCount} sleep nights`, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
          { label: `${prCount} PR${prCount !== 1 ? 's' : ''}`, color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
        ].filter((p) => !p.label.startsWith('0')).map((p) => (
          <span key={p.label} className={`text-xs font-medium px-3 py-1 rounded-full border ${p.color}`}>
            {p.label}
          </span>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {grouped.map(([date, dayEvents]) => (
          <div key={date} className="mb-6">
            {/* Date header */}
            <div className="sticky top-16 z-10 mb-3">
              <span className="inline-block text-xs font-semibold text-text-secondary bg-background px-2 py-1 rounded-md border border-border/50">
                {fmtDate(date)}
              </span>
            </div>

            {/* Events for this day */}
            <div className="space-y-2 pl-4 border-l border-border">
              {dayEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EventRow({ event }: { event: TimelineEvent }) {
  const inner = (
    <div
      className="relative flex items-start gap-3 bg-surface rounded-xl border border-border p-3 hover:bg-surface-secondary transition-colors group"
    >
      {/* Timeline dot */}
      <div
        className="absolute -left-5 top-4 w-2 h-2 rounded-full border-2 border-background shrink-0"
        style={{ backgroundColor: event.color }}
      />

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: `${event.color}18` }}
      >
        {event.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-text-primary leading-tight">{event.title}</p>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{event.subtitle}</p>
            {event.detail && (
              <p className="text-xs text-text-secondary opacity-60 mt-0.5">{event.detail}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            {event.time && (
              <p className="text-xs text-text-secondary opacity-50">{event.time.slice(0, 5)}</p>
            )}
            <span
              className="text-xs font-medium"
              style={{ color: event.color }}
            >
              {KIND_LABEL[event.kind]}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  if (event.href) {
    return <Link href={event.href}>{inner}</Link>
  }
  return inner
}

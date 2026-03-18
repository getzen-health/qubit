import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Cardiac Events' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function EventBadge({ type }: { type: string }) {
  if (type === 'afib_event') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20">
        AFib Detected
      </span>
    )
  }
  if (type === 'high_heart_rate_event') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold border border-orange-500/20">
        High Heart Rate
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
      Low Heart Rate
    </span>
  )
}

export default async function CardiacPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: events } = await supabase
    .from('health_records')
    .select('type, start_time, end_time, source')
    .eq('user_id', user.id)
    .in('type', ['afib_event', 'high_heart_rate_event', 'low_heart_rate_event'])
    .gte('start_time', ninetyDaysAgo.toISOString())
    .order('start_time', { ascending: false })

  const allEvents = events ?? []
  const afibCount = allEvents.filter((e) => e.type === 'afib_event').length
  const highHRCount = allEvents.filter((e) => e.type === 'high_heart_rate_event').length
  const lowHRCount = allEvents.filter((e) => e.type === 'low_heart_rate_event').length

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
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Cardiac Events</h1>
              <p className="text-sm text-text-secondary">Last 90 days · Apple Watch alerts</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
        {allEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <span className="text-5xl">💚</span>
            <h2 className="text-lg font-semibold text-text-primary">No cardiac events detected</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              Apple Watch monitors your heart continuously. No irregular rhythm, high HR, or low HR events were detected in the last 90 days.
            </p>
            <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary max-w-xs text-left space-y-1.5">
              <p className="font-semibold text-text-primary">Requirements</p>
              <p>• Apple Watch Series 4 or later</p>
              <p>• Irregular rhythm notifications enabled</p>
              <p>• Worn consistently during the day</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface rounded-xl border border-border p-4 text-center">
                <p className={`text-2xl font-bold ${afibCount > 0 ? 'text-red-400' : 'text-green-400'}`}>{afibCount}</p>
                <p className="text-xs text-text-secondary mt-0.5">AFib Events</p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4 text-center">
                <p className={`text-2xl font-bold ${highHRCount > 5 ? 'text-orange-400' : 'text-text-primary'}`}>{highHRCount}</p>
                <p className="text-xs text-text-secondary mt-0.5">High HR Alerts</p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4 text-center">
                <p className={`text-2xl font-bold ${lowHRCount > 5 ? 'text-blue-400' : 'text-text-primary'}`}>{lowHRCount}</p>
                <p className="text-xs text-text-secondary mt-0.5">Low HR Alerts</p>
              </div>
            </div>

            {/* AFib warning */}
            {afibCount > 0 && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-1.5">
                <p className="font-semibold text-red-400">AFib Detected</p>
                <p className="text-sm text-text-secondary">
                  Your Apple Watch detected an irregular heart rhythm consistent with atrial fibrillation. AFib can increase stroke risk. Please share this data with your doctor.
                </p>
              </div>
            )}

            {/* Event list */}
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Event History</h2>
              {allEvents.map((event, i) => (
                <div key={i} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <EventBadge type={event.type} />
                    <p className="text-xs text-text-secondary mt-1">{formatDate(event.start_time)} at {formatTime(event.start_time)}</p>
                    {event.source && <p className="text-xs text-text-secondary opacity-60">{event.source}</p>}
                  </div>
                  {event.end_time && event.end_time !== event.start_time && (
                    <p className="text-xs text-text-secondary shrink-0">
                      Until {formatTime(event.end_time)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Info */}
        <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-2">
          <p className="font-medium text-text-primary text-sm">About these alerts</p>
          <div className="space-y-2">
            {[
              {
                title: 'Irregular Heart Rhythm (AFib)',
                desc: 'Apple Watch uses the optical heart sensor to detect patterns consistent with atrial fibrillation. This is not an ECG diagnosis — confirm with your doctor.',
              },
              {
                title: 'High Heart Rate',
                desc: 'Triggered when your heart rate exceeds your threshold (typically 120 bpm) while you appear to have been inactive for at least 10 minutes.',
              },
              {
                title: 'Low Heart Rate',
                desc: 'Triggered when your heart rate falls below your threshold (typically 40–50 bpm) while you appear to have been inactive for at least 10 minutes.',
              },
            ].map(({ title, desc }) => (
              <div key={title}>
                <p className="font-medium text-text-primary">{title}</p>
                <p className="opacity-70 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <p className="opacity-50 pt-1">⚠️ This data is for personal awareness only — not a medical diagnosis. Consult a healthcare provider for any cardiac concerns.</p>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

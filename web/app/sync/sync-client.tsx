'use client'

interface Device {
  device_name: string
  device_type: string
  last_sync_at: string | null
  created_at: string
}

interface Summary {
  date: string
  steps: number | null
  active_calories: number | null
  sleep_duration_minutes: number | null
  resting_heart_rate: number | null
  avg_hrv: number | null
}

interface Workout {
  start_time: string
  workout_type: string
}

interface HealthRecord {
  type: string
  start_time: string
}

interface SyncStatusClientProps {
  devices: Device[]
  summaries: Summary[]
  workouts: Workout[]
  latestSleep: { start_time: string } | null
  healthRecords: HealthRecord[]
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function fmtDateShort(iso: string): string {
  return new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function deviceIcon(type: string): string {
  if (type === 'apple_watch') return '⌚'
  if (type === 'iphone') return '📱'
  return '💻'
}

function getCoverageColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 50) return 'bg-yellow-500'
  if (pct >= 20) return 'bg-orange-500'
  return 'bg-red-500'
}

export function SyncStatusClient({ devices, summaries, workouts, latestSleep, healthRecords }: SyncStatusClientProps) {
  // Last sync time
  const lastSyncAt = devices.reduce<string | null>((latest, d) => {
    if (!d.last_sync_at) return latest
    if (!latest || d.last_sync_at > latest) return d.last_sync_at
    return latest
  }, null)

  // Data coverage metrics
  const totalDays = 90
  const daysWithSteps = summaries.filter((s) => (s.steps ?? 0) > 0).length
  const daysWithSleep = summaries.filter((s) => (s.sleep_duration_minutes ?? 0) > 0).length
  const daysWithCalories = summaries.filter((s) => (s.active_calories ?? 0) > 0).length
  const daysWithHrv = summaries.filter((s) => (s.avg_hrv ?? 0) > 0).length
  const daysWithRhr = summaries.filter((s) => (s.resting_heart_rate ?? 0) > 0).length

  // Health record counts by type
  const typeCounts: Record<string, number> = {}
  const typeLatest: Record<string, string> = {}
  for (const r of healthRecords) {
    typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1
    if (!typeLatest[r.type] || r.start_time > typeLatest[r.type]) {
      typeLatest[r.type] = r.start_time
    }
  }

  const METRIC_LABELS: Record<string, string> = {
    heart_rate: 'Heart Rate',
    oxygen_saturation: 'Blood Oxygen (SpO₂)',
    respiratory_rate: 'Respiratory Rate',
    blood_pressure_systolic: 'Blood Pressure (Systolic)',
    blood_pressure_diastolic: 'Blood Pressure (Diastolic)',
    vo2_max: 'VO₂ Max',
    wrist_temperature: 'Wrist Temperature',
    headphone_audio_exposure: 'Headphone Audio',
    environmental_audio_exposure: 'Environmental Audio',
    running_cadence: 'Running Cadence',
    running_stride_length: 'Running Stride',
    running_vertical_oscillation: 'Vertical Oscillation',
    running_ground_contact_time: 'Ground Contact Time',
    running_power: 'Running Power',
    time_in_daylight: 'Daylight Exposure',
    stand_hours: 'Stand Hours',
    mindfulness: 'Mindfulness',
    blood_glucose: 'Blood Glucose',
    dietary_energy: 'Dietary Calories',
    dietary_protein: 'Dietary Protein',
    dietary_carbs: 'Dietary Carbs',
    dietary_fat: 'Dietary Fat',
    dietary_fiber: 'Dietary Fiber',
    dietary_water: 'Dietary Water',
  }

  const recordedTypes = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)

  // Workout type breakdown (last 90 days)
  const workoutTypeCounts: Record<string, number> = {}
  for (const w of workouts) {
    workoutTypeCounts[w.workout_type] = (workoutTypeCounts[w.workout_type] ?? 0) + 1
  }
  const workoutTypes = Object.entries(workoutTypeCounts).sort(([, a], [, b]) => b - a)

  // Coverage metrics list
  const coverageMetrics = [
    { label: 'Step Count', days: daysWithSteps, icon: '👣' },
    { label: 'Active Calories', days: daysWithCalories, icon: '🔥' },
    { label: 'Sleep Duration', days: daysWithSleep, icon: '🌙' },
    { label: 'Resting Heart Rate', days: daysWithRhr, icon: '❤️' },
    { label: 'HRV', days: daysWithHrv, icon: '💚' },
  ]

  // Overall health: is last sync recent?
  const syncAge = lastSyncAt
    ? (Date.now() - new Date(lastSyncAt).getTime()) / (1000 * 60 * 60)
    : null

  const syncStatus = syncAge === null
    ? { label: 'Never synced', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
    : syncAge < 6
    ? { label: 'Up to date', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' }
    : syncAge < 24
    ? { label: 'Synced today', color: 'text-lime-400', bg: 'bg-lime-500/10 border-lime-500/20' }
    : syncAge < 72
    ? { label: 'Synced recently', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' }
    : { label: 'Sync overdue', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' }

  return (
    <div className="space-y-6">
      {/* Sync status hero */}
      <div className={`rounded-xl border p-4 ${syncStatus.bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-semibold ${syncStatus.color}`}>{syncStatus.label}</p>
            {lastSyncAt && (
              <p className="text-xs text-text-secondary mt-0.5">
                {fmtDate(lastSyncAt)} · {timeAgo(lastSyncAt)}
              </p>
            )}
            {!lastSyncAt && (
              <p className="text-xs text-text-secondary mt-0.5">Open the KQuarks iOS app to sync</p>
            )}
          </div>
          <span className="text-3xl">{lastSyncAt ? (syncAge! < 24 ? '✅' : '⚠️') : '❌'}</span>
        </div>
      </div>

      {/* Devices */}
      {devices.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Synced Devices</h3>
          <div className="space-y-3">
            {devices.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-2xl">{deviceIcon(d.device_type)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{d.device_name}</p>
                  <p className="text-xs text-text-secondary capitalize">{d.device_type.replace('_', ' ')}</p>
                </div>
                <div className="text-right text-xs text-text-secondary">
                  {d.last_sync_at ? (
                    <>
                      <p className="text-text-primary font-medium">{timeAgo(d.last_sync_at)}</p>
                      <p className="opacity-60">{fmtDateShort(d.last_sync_at)}</p>
                    </>
                  ) : (
                    <p className="text-orange-400">Never synced</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data coverage */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Data Coverage (90 days)</h3>
        <div className="space-y-3">
          {coverageMetrics.map(({ label, days, icon }) => {
            const pct = Math.round((days / totalDays) * 100)
            return (
              <div key={label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="text-text-primary">{label}</span>
                  </div>
                  <span className="text-text-secondary">{days}/{totalDays} days ({pct}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getCoverageColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Workout summary */}
      {workouts.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Workout Records ({workouts.length} total · 90 days)
          </h3>
          <div className="space-y-2">
            {workoutTypes.slice(0, 8).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{type}</span>
                <span className="font-medium text-text-primary">{count} sessions</span>
              </div>
            ))}
          </div>
          {workoutTypes.length > 8 && (
            <p className="text-xs text-text-secondary mt-2">+{workoutTypes.length - 8} more types</p>
          )}
        </div>
      )}

      {/* Health records by type */}
      {recordedTypes.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Health Record Types (90 days)</h3>
          <div className="space-y-2">
            {recordedTypes.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-text-primary">{METRIC_LABELS[type] ?? type.replace(/_/g, ' ')}</p>
                  {typeLatest[type] && (
                    <p className="text-text-secondary opacity-60">
                      Latest: {fmtDateShort(typeLatest[type])}
                    </p>
                  )}
                </div>
                <span className="font-mono text-text-secondary shrink-0 ml-4">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {devices.length === 0 && workouts.length === 0 && healthRecords.length === 0 && (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-3xl mb-3">📱</p>
          <p className="font-semibold text-text-primary mb-1">No data synced yet</p>
          <p className="text-sm text-text-secondary">
            Download the KQuarks app on your iPhone, sign in, and tap Sync to import your Apple Health data.
          </p>
        </div>
      )}
    </div>
  )
}

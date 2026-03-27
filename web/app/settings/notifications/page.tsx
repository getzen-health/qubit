'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NotificationPrefs {
  morning_briefing: boolean
  goal_reminders: boolean
  anomaly_alerts: boolean
  streak_milestones: boolean
  weekly_digest: boolean
  hrv_alerts: boolean
  sleep_alerts: boolean
  activity_reminders: boolean
  achievement_notifications: boolean
  briefing_hour: number
  hrv_threshold_percent: number
  rhr_threshold_bpm: number
  quiet_hours_enabled: boolean
  quiet_hours_start: number
  quiet_hours_end: number
  weekly_digest_day: number
  weekly_digest_hour: number
  anomaly_severity_threshold: string
}

const DEFAULTS: NotificationPrefs = {
  morning_briefing: true,
  goal_reminders: true,
  anomaly_alerts: true,
  streak_milestones: true,
  weekly_digest: true,
  hrv_alerts: true,
  sleep_alerts: true,
  activity_reminders: true,
  achievement_notifications: true,
  briefing_hour: 7,
  hrv_threshold_percent: 20,
  rhr_threshold_bpm: 10,
  quiet_hours_enabled: false,
  quiet_hours_start: 21,
  quiet_hours_end: 8,
  weekly_digest_day: 0,
  weekly_digest_hour: 7,
  anomaly_severity_threshold: 'medium',
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pushStatus, setPushStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const supabase = createClient()

  const loadPrefs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (data) {
      setPrefs({
        morning_briefing: data.morning_briefing ?? DEFAULTS.morning_briefing,
        goal_reminders: data.goal_reminders ?? DEFAULTS.goal_reminders,
        anomaly_alerts: data.anomaly_alerts ?? DEFAULTS.anomaly_alerts,
        streak_milestones: data.streak_milestones ?? DEFAULTS.streak_milestones,
        weekly_digest: data.weekly_digest ?? DEFAULTS.weekly_digest,
        hrv_alerts: data.hrv_alerts ?? DEFAULTS.hrv_alerts,
        sleep_alerts: data.sleep_alerts ?? DEFAULTS.sleep_alerts,
        activity_reminders: data.activity_reminders ?? DEFAULTS.activity_reminders,
        achievement_notifications: data.achievement_notifications ?? DEFAULTS.achievement_notifications,
        briefing_hour: data.briefing_hour ?? DEFAULTS.briefing_hour,
        hrv_threshold_percent: data.hrv_threshold_percent ?? DEFAULTS.hrv_threshold_percent,
        rhr_threshold_bpm: data.rhr_threshold_bpm ?? DEFAULTS.rhr_threshold_bpm,
        quiet_hours_enabled: data.quiet_hours_enabled ?? DEFAULTS.quiet_hours_enabled,
        quiet_hours_start: data.quiet_hours_start ?? DEFAULTS.quiet_hours_start,
        quiet_hours_end: data.quiet_hours_end ?? DEFAULTS.quiet_hours_end,
        weekly_digest_day: data.weekly_digest_day ?? DEFAULTS.weekly_digest_day,
        weekly_digest_hour: data.weekly_digest_hour ?? DEFAULTS.weekly_digest_hour,
        anomaly_severity_threshold: data.anomaly_severity_threshold ?? DEFAULTS.anomaly_severity_threshold,
      })
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadPrefs() }, [loadPrefs])

  // Check push notification status on mount
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushStatus('unsupported')
      return
    }
    const perm = Notification.permission
    if (perm === 'granted' || perm === 'denied') setPushStatus(perm)
    if (perm === 'granted') {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        setPushEnabled(!!sub)
      })
    }
  }, [])

  const handlePushToggle = async () => {
    setPushLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready

      if (pushEnabled) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/notifications/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
        setPushEnabled(false)
      } else {
        const permission = await Notification.requestPermission()
        setPushStatus(permission as 'granted' | 'denied')
        if (permission !== 'granted') { setPushLoading(false); return }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        })
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        })
        setPushEnabled(true)
      }
    } catch {
      setError('Could not update push notification settings.')
    }
    setPushLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }

    const { error: upsertError } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' })

    if (upsertError) {
      setError('Failed to save preferences. Please try again.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const toggle = (key: keyof NotificationPrefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }))

  const setNum = (key: keyof NotificationPrefs, val: string) => {
    const n = parseInt(val, 10)
    if (!isNaN(n)) setPrefs((p) => ({ ...p, [key]: n }))
  }

  const setStr = (key: keyof NotificationPrefs, val: string) =>
    setPrefs((p) => ({ ...p, [key]: val }))

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  const ToggleRow = ({
    label,
    description,
    field,
  }: {
    label: string
    description?: string
    field: keyof NotificationPrefs
  }) => {
    if (typeof prefs[field] !== 'boolean') return null
    return (
      <div className="flex items-start justify-between gap-3 py-3 border-b border-border last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{label}</p>
          {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
        </div>
        <button
          role="switch"
          aria-checked={!!(prefs[field])}
          onClick={() => toggle(field)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
            prefs[field] ? 'bg-accent' : 'bg-surface-secondary'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              prefs[field] ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/settings" className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <Bell className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Push Notifications */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Push Notifications</h2>
          {pushStatus === 'unsupported' ? (
            <p className="text-sm text-text-secondary">Push notifications are not supported in this browser.</p>
          ) : pushStatus === 'denied' ? (
            <p className="text-sm text-red-400">Push notifications are blocked. Enable them in your browser settings, then refresh.</p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Enable push notifications</p>
                <p className="text-xs text-text-secondary mt-0.5">Get reminders for hydration, medications, and habits even when the app is closed</p>
              </div>
              <button
                onClick={handlePushToggle}
                disabled={pushLoading}
                role="switch"
                aria-checked={pushEnabled}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                  pushEnabled ? 'bg-accent' : 'bg-surface-secondary'
                }`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${pushEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          )}
        </div>

        {/* Alert Categories */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Alert Types</h2>
          <ToggleRow
            label="Morning Briefing"
            description="Daily summary delivered each morning"
            field="morning_briefing"
          />
          <ToggleRow
            label="Goal Reminders"
            description="Reminders when you're behind on daily goals"
            field="goal_reminders"
          />
          <ToggleRow
            label="Anomaly Alerts"
            description="Unusual patterns in your health metrics"
            field="anomaly_alerts"
          />
          <ToggleRow
            label="Achievement Notifications"
            description="Celebrate when you reach milestones"
            field="achievement_notifications"
          />
          <ToggleRow
            label="Streak Milestones"
            description="Celebrate when you hit streak milestones"
            field="streak_milestones"
          />
          <ToggleRow
            label="Weekly Digest"
            description="Weekly summary of your health trends"
            field="weekly_digest"
          />
          <ToggleRow
            label="HRV Alerts"
            description="When HRV drops significantly below your baseline"
            field="hrv_alerts"
          />
          <ToggleRow
            label="Sleep Alerts"
            description="When sleep quality or duration is poor"
            field="sleep_alerts"
          />
          <ToggleRow
            label="Activity Reminders"
            description="Afternoon nudge when you're below 50% of step goal"
            field="activity_reminders"
          />
        </div>

        {/* Daily Briefing Settings */}
        {prefs.morning_briefing && (
          <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Morning Briefing Time</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Delivery Hour</p>
                <p className="text-xs text-text-secondary">0–23 (24-hour format)</p>
              </div>
              <input
                type="number"
                min={0}
                max={23}
                value={prefs.briefing_hour}
                onChange={(e) => setNum('briefing_hour', e.target.value)}
                className="w-20 text-center bg-surface-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>
        )}

        {/* Weekly Digest Settings */}
        {prefs.weekly_digest && (
          <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Weekly Digest</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Delivery Day</p>
                <p className="text-xs text-text-secondary">When to send your weekly summary</p>
              </div>
              <select
                value={prefs.weekly_digest_day}
                onChange={(e) => setNum('weekly_digest_day', e.target.value)}
                className="bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {DAYS_OF_WEEK.map((day, idx) => (
                  <option key={idx} value={idx}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Delivery Hour</p>
                <p className="text-xs text-text-secondary">0–23 (24-hour format)</p>
              </div>
              <input
                type="number"
                min={0}
                max={23}
                value={prefs.weekly_digest_hour}
                onChange={(e) => setNum('weekly_digest_hour', e.target.value)}
                className="w-20 text-center bg-surface-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>
        )}

        {/* Anomaly Alert Settings */}
        {prefs.anomaly_alerts && (
          <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Anomaly Alerts</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Severity Threshold</p>
                <p className="text-xs text-text-secondary">Only alert on high-severity anomalies</p>
              </div>
              <select
                value={prefs.anomaly_severity_threshold}
                onChange={(e) => setStr('anomaly_severity_threshold', e.target.value)}
                className="bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {SEVERITY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Metric Thresholds */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Alert Thresholds</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">HRV Alert Threshold</p>
              <p className="text-xs text-text-secondary">Percentage drop from 30-day baseline (5–50%)</p>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={5}
                max={50}
                value={prefs.hrv_threshold_percent}
                onChange={(e) => setNum('hrv_threshold_percent', e.target.value)}
                className="w-20 text-center bg-surface-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <span className="text-sm text-text-secondary">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-text-primary">RHR Alert Threshold</p>
              <p className="text-xs text-text-secondary">BPM elevation above 7-day average (3–20 bpm)</p>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={3}
                max={20}
                value={prefs.rhr_threshold_bpm}
                onChange={(e) => setNum('rhr_threshold_bpm', e.target.value)}
                className="w-20 text-center bg-surface-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <span className="text-sm text-text-secondary">bpm</span>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Quiet Hours</h2>
          <ToggleRow
            label="Enable Quiet Hours"
            description="Suppress notifications during specified times"
            field="quiet_hours_enabled"
          />
          {prefs.quiet_hours_enabled && (
            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Start Time</p>
                  <p className="text-xs text-text-secondary">When to stop notifications</p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={prefs.quiet_hours_start}
                    onChange={(e) => setNum('quiet_hours_start', e.target.value)}
                    className="w-20 text-center bg-surface-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <span className="text-sm text-text-secondary">:00</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">End Time</p>
                  <p className="text-xs text-text-secondary">When to resume notifications</p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={prefs.quiet_hours_end}
                    onChange={(e) => setNum('quiet_hours_end', e.target.value)}
                    className="w-20 text-center bg-surface-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <span className="text-sm text-text-secondary">:00</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-accent text-white font-semibold py-3 rounded-xl transition-opacity disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Preferences'}
        </button>

        <p className="text-xs text-text-secondary text-center">
          Preferences are synced to the cloud and restored after reinstall.
        </p>
      </main>
    </div>
  )
}

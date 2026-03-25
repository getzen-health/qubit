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
  briefing_hour: number
  hrv_threshold_percent: number
  rhr_threshold_bpm: number
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
  briefing_hour: 7,
  hrv_threshold_percent: 20,
  rhr_threshold_bpm: 10,
}

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
        briefing_hour: data.briefing_hour ?? DEFAULTS.briefing_hour,
        hrv_threshold_percent: data.hrv_threshold_percent ?? DEFAULTS.hrv_threshold_percent,
        rhr_threshold_bpm: data.rhr_threshold_bpm ?? DEFAULTS.rhr_threshold_bpm,
      })
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadPrefs() }, [loadPrefs])

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
  }) => (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={!!prefs[field]}
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

        {/* Alerts section */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Alerts</h2>
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

        {/* Timing section */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Timing</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Morning Briefing Hour</p>
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

        {/* Thresholds section */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Thresholds</h2>
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

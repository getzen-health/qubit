'use client'

import { useState, useEffect } from 'react'
import { Check, AlertCircle } from 'lucide-react'

type PrivacyMode = 'public' | 'friends' | 'private'

interface ProfilePrivacy {
  privacy_mode: PrivacyMode
  share_steps: boolean
  share_workouts: boolean
  share_sleep: boolean
  share_hrv: boolean
  share_readiness: boolean
}

const PRIVACY_MODE_LABELS: Record<PrivacyMode, string> = {
  public: 'Public - Anyone can see',
  friends: 'Friends Only - Only my friends can see',
  private: 'Private - Only me',
}

const METRIC_LABELS: Record<string, { label: string; description: string }> = {
  share_steps: { label: 'Steps', description: 'Daily step count' },
  share_workouts: { label: 'Workouts', description: 'Exercise activities and duration' },
  share_sleep: { label: 'Sleep', description: 'Sleep duration and stages' },
  share_hrv: { label: 'Heart Rate Variability', description: 'HRV measurements' },
  share_readiness: { label: 'Readiness Score', description: 'Daily readiness assessment' },
}

export function PrivacyClient() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [privacy, setPrivacy] = useState<ProfilePrivacy>({
    privacy_mode: 'friends',
    share_steps: true,
    share_workouts: true,
    share_sleep: false,
    share_hrv: false,
    share_readiness: true,
  })

  useEffect(() => {
    async function loadPrivacy() {
      try {
        const res = await fetch('/api/profile/privacy')
        if (res.ok) {
          const data = await res.json()
          setPrivacy(data)
        }
      } catch {
        setError('Failed to load privacy settings')
      } finally {
        setLoading(false)
      }
    }

    loadPrivacy()
  }, [])

  async function saveSettings() {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/profile/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(privacy),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      } else {
        setError('Failed to save settings')
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-surface rounded-xl border border-border animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Privacy Mode Section */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
        <div>
          <h2 className="font-semibold text-text-primary text-sm mb-3">Privacy Mode</h2>
          <p className="text-xs text-text-secondary mb-3">
            Control who can see your health data on the social leaderboard and friend profiles.
          </p>
        </div>

        <div className="space-y-2">
          {Object.entries(PRIVACY_MODE_LABELS).map(([mode, label]) => (
            <label
              key={mode}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-secondary cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="privacy_mode"
                value={mode}
                checked={privacy.privacy_mode === mode}
                onChange={(e) =>
                  setPrivacy((p) => ({
                    ...p,
                    privacy_mode: e.target.value as PrivacyMode,
                  }))
                }
                className="w-4 h-4 rounded-full cursor-pointer"
              />
              <div>
                <p className="text-sm text-text-primary font-medium">{label}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Metrics Sharing Section */}
      {privacy.privacy_mode !== 'private' && (
        <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary text-sm mb-1">Share Metrics</h2>
            <p className="text-xs text-text-secondary">
              Choose which metrics to share with {privacy.privacy_mode === 'public' ? 'everyone' : 'friends'}.
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(METRIC_LABELS).map(([key, { label, description }]) => (
              <label
                key={key}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-secondary cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={privacy[key as keyof typeof METRIC_LABELS] as boolean}
                  onChange={(e) =>
                    setPrivacy((p) => ({
                      ...p,
                      [key]: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded mt-1 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-sm text-text-primary font-medium">{label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {privacy.privacy_mode === 'private' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200">
            <p className="font-medium">Private Mode</p>
            <p className="text-xs mt-1 opacity-90">
              All your health data is hidden from other users. Only you can see your health information.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex gap-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-200">Settings saved successfully!</p>
        </div>
      )}

      <button
        onClick={saveSettings}
        disabled={saving}
        className="w-full py-3 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-60 transition-opacity"
      >
        {saving ? 'Saving…' : 'Save Privacy Settings'}
      </button>
    </div>
  )
}

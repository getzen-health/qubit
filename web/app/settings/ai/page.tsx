'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function AISettingsPage() {
  const [hasKey, setHasKey] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user/ai-key')
      .then((r) => r.json())
      .then((d) => setHasKey(!!d.hasKey))
      .catch(() => setError('Could not load key status'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    const trimmed = newKey.trim()
    if (!trimmed) return
    setError(null)
    const res = await fetch('/api/user/ai-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: trimmed }),
    })
    if (res.ok) {
      setHasKey(true)
      setNewKey('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setError('Failed to save key. Please try again.')
    }
  }

  const handleRemove = async () => {
    setError(null)
    const res = await fetch('/api/user/ai-key', { method: 'DELETE' })
    if (res.ok) {
      setHasKey(false)
      setNewKey('')
    } else {
      setError('Failed to remove key. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">AI Insights</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Claude API Key</h2>
            <p className="text-sm text-text-secondary">
              Optional. If not set, the app uses a shared key (with rate limits). Add your own key
              from <span className="text-accent">console.anthropic.com</span> for unlimited
              insights.
            </p>
            {hasKey && (
              <p className="mt-1 text-xs text-green-400">
                ✓ API key saved securely on server
              </p>
            )}
            {!hasKey && !loading && (
              <p className="mt-1 text-xs text-text-secondary">Using shared key</p>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder={hasKey ? 'Enter a new key to replace the saved one' : 'sk-ant-...'}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!newKey.trim() || loading}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-40"
            >
              {saved ? 'Saved!' : 'Save Key'}
            </button>
            {hasKey && (
              <button
                onClick={handleRemove}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/10 transition-colors disabled:opacity-40"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="font-semibold text-text-primary mb-2">How it works</h2>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">1.</span>
              Your health data (steps, sleep, HRV, recovery) is sent to Claude for analysis.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">2.</span>
              Claude generates personalized insights about your patterns and trends.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">3.</span>
              Insights are stored in your account and shown on the dashboard.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">4.</span>
              Your API key is encrypted and stored securely on the server — never in the browser.
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}


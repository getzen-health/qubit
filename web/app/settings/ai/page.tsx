'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

const API_KEY_KEY = 'kquarks_claude_api_key'

export default function AISettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_KEY)
    if (stored) {
      setHasKey(true)
      setApiKey(stored)
    }
  }, [])

  const handleSave = () => {
    const trimmed = apiKey.trim()
    if (trimmed) {
      localStorage.setItem(API_KEY_KEY, trimmed)
      setHasKey(true)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRemove = () => {
    localStorage.removeItem(API_KEY_KEY)
    setApiKey('')
    setHasKey(false)
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
              Optional. If not set, the app uses a shared key (with rate limits). Add your own key from{' '}
              <span className="text-accent">console.anthropic.com</span> for unlimited insights.
            </p>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasKey ? '••••••••••••••••••••••' : 'sk-ant-...'}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
              autoComplete="off"
              spellCheck={false}
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
              disabled={!apiKey.trim()}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-40"
            >
              {saved ? 'Saved!' : 'Save Key'}
            </button>
            {hasKey && (
              <button
                onClick={handleRemove}
                className="px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/10 transition-colors"
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
              Your API key is stored locally in your browser and never sent to our servers.
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}

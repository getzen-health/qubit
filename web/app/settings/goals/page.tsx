'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const STORAGE_KEY = 'kquarks_step_goal'
const DEFAULT_STEP_GOAL = 10000

export default function GoalsSettingsPage() {
  const [stepGoal, setStepGoal] = useState(DEFAULT_STEP_GOAL)
  const [inputValue, setInputValue] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const n = parseInt(stored, 10)
      if (!isNaN(n) && n > 0) {
        setStepGoal(n)
        setInputValue(n.toString())
      } else {
        setInputValue(DEFAULT_STEP_GOAL.toString())
      }
    } else {
      setInputValue(DEFAULT_STEP_GOAL.toString())
    }
  }, [])

  const handleSave = () => {
    const n = parseInt(inputValue, 10)
    if (!isNaN(n) && n > 0 && n <= 100000) {
      localStorage.setItem(STORAGE_KEY, n.toString())
      setStepGoal(n)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
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
          <h1 className="text-xl font-bold text-text-primary">Goals</h1>
          {saved && <span className="ml-auto text-sm text-accent">Saved</span>}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Daily Step Goal</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Steps target shown on your dashboard and used for streak tracking.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <input
              type="number"
              min={1000}
              max={100000}
              step={500}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-32 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-center text-lg font-mono focus:outline-none focus:border-accent"
            />
            <span className="text-text-secondary text-sm">steps / day</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[5000, 8000, 10000, 12000, 15000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setInputValue(preset.toString())
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  stepGoal === preset
                    ? 'bg-accent text-white border-accent'
                    : 'border-border text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {preset.toLocaleString()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-2.5 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Save Goal
          </button>
        </section>

        <p className="text-xs text-text-secondary text-center">
          Goal is stored locally on this device. Changes apply immediately on your dashboard.
        </p>
      </main>
    </div>
  )
}

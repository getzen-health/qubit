'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

interface Allergen {
  id: string
  allergen: string
  severity: 'mild' | 'moderate' | 'severe'
  created_at: string
}

const SEVERITY_COLORS: Record<string, string> = {
  mild: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  moderate: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  severe: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const COMMON_ALLERGENS = [
  'Milk', 'Eggs', 'Fish', 'Shellfish', 'Tree nuts', 'Peanuts',
  'Wheat', 'Soybeans', 'Sesame', 'Gluten',
]

export default function AllergensPage() {
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [loading, setLoading] = useState(true)
  const [newAllergen, setNewAllergen] = useState('')
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  async function fetchAllergens() {
    setLoading(true)
    try {
      const res = await fetch('/api/allergens')
      const json = await res.json()
      setAllergens(json.allergens ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAllergens() }, [])

  async function addAllergen(allergenName?: string) {
    const name = (allergenName ?? newAllergen).trim()
    if (!name) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/allergens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allergen: name, severity }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to add allergen'); return }
      setNewAllergen('')
      await fetchAllergens()
    } finally {
      setAdding(false)
    }
  }

  async function removeAllergen(id: string) {
    await fetch('/api/allergens', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setAllergens((prev) => prev.filter((a) => a.id !== id))
  }

  const existingNames = allergens.map((a) => a.allergen.toLowerCase())

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-text-primary">My Allergens</h1>
            <p className="text-xs text-text-secondary">Get warnings when scanning food</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Add allergen form */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Allergen
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAllergen}
              onChange={(e) => setNewAllergen(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addAllergen() }}
              placeholder="e.g. Peanuts, Gluten…"
              className="flex-1 px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as 'mild' | 'moderate' | 'severe')}
              className="px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none"
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
            <button
              onClick={() => addAllergen()}
              disabled={adding || !newAllergen.trim()}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Add
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* Quick-add common allergens */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COMMON_ALLERGENS.filter((a) => !existingNames.includes(a.toLowerCase())).map((a) => (
              <button
                key={a}
                onClick={() => addAllergen(a)}
                className="px-2.5 py-1 rounded-full bg-surface-secondary border border-border text-xs text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
              >
                + {a}
              </button>
            ))}
          </div>
        </div>

        {/* Allergen list */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide px-1">
            Your allergens ({allergens.length})
          </h2>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-surface rounded-xl border border-border p-4 h-14" />
              ))}
            </div>
          ) : allergens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-text-primary">No allergens added</p>
              <p className="text-sm text-text-secondary mt-1">Add allergens above to get warnings when scanning food products.</p>
            </div>
          ) : (
            allergens.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-surface rounded-xl border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{a.allergen}</p>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs border font-medium ${SEVERITY_COLORS[a.severity]}`}>
                      {a.severity}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeAllergen(a.id)}
                  className="p-2 rounded-lg hover:bg-surface-secondary text-text-secondary hover:text-red-400 transition-colors"
                  aria-label={`Remove ${a.allergen}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

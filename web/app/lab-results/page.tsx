'use client'
import { useState, useEffect } from 'react'
import { BIOMARKERS, getRangeStatus, getStatusColor, getStatusLabel } from '@/lib/biomarkers'

const CATEGORIES = ['Metabolic', 'Lipids', 'CBC', 'Inflammation', 'Vitamins', 'Iron', 'Thyroid', 'Hormones', 'Liver', 'Kidney']

export default function LabResultsPage() {
  const [results, setResults] = useState<any[]>([])
  const [latest, setLatest] = useState<Record<string, any>>({})
  const [selectedCategory, setSelectedCategory] = useState('Metabolic')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ biomarker_key: '', value: '', lab_date: new Date().toISOString().slice(0,10), lab_name: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = () => fetch('/api/lab-results').then(r => r.json()).then(d => { setResults(d.results ?? []); setLatest(d.latest ?? {}) })
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.biomarker_key || !form.value) return
    setSaving(true)
    await fetch('/api/lab-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, value: parseFloat(form.value) }),
    })
    setAdding(false)
    setForm({ biomarker_key: '', value: '', lab_date: new Date().toISOString().slice(0,10), lab_name: '', notes: '' })
    await load()
    setSaving(false)
  }

  const categoryBiomarkers = Object.entries(BIOMARKERS).filter(([, ref]) => ref.category === selectedCategory)

  // Summary: count optimal/normal/suboptimal/critical
  const statusCounts = { optimal: 0, normal: 0, suboptimal: 0, critical: 0 }
  for (const [key, result] of Object.entries(latest)) {
    const status = getRangeStatus(key, result.value)
    if (status in statusCounts) statusCounts[status as keyof typeof statusCounts]++
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Lab Results</h1>
            <p className="text-sm text-text-secondary">Blood tests with optimal range analysis</p>
          </div>
          <button onClick={() => setAdding(true)} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">+ Log</button>
        </div>

        {/* Summary badges */}
        {Object.values(latest).length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { key: 'optimal', label: 'Optimal', color: 'bg-green-100 text-green-700' },
              { key: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
              { key: 'suboptimal', label: 'Suboptimal', color: 'bg-yellow-100 text-yellow-700' },
              { key: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
            ].filter(s => statusCounts[s.key as keyof typeof statusCounts] > 0).map(s => (
              <span key={s.key} className={`px-3 py-1 rounded-full text-sm font-medium ${s.color}`}>
                {statusCounts[s.key as keyof typeof statusCounts]} {s.label}
              </span>
            ))}
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Biomarker cards */}
        <div className="space-y-2 mb-4">
          {categoryBiomarkers.map(([key, ref]) => {
            const result = latest[key]
            const status = result ? getRangeStatus(key, result.value) : 'unknown'
            const colorClass = getStatusColor(status)

            return (
              <div key={key} className={`bg-white rounded-2xl border p-4 ${result ? colorClass.split(' ')[2] : 'border-border'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-text-primary">{ref.name}</div>
                    <div className="text-xs text-text-secondary">{ref.description}</div>
                    {ref.optimalLow !== undefined || ref.optimalHigh !== undefined ? (
                      <div className="text-xs text-green-600 mt-0.5">
                        Optimal: {ref.optimalLow ?? ''}–{ref.optimalHigh ?? ''} {ref.unit}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right ml-3">
                    {result ? (
                      <>
                        <div className="font-bold text-text-primary">{result.value} {ref.unit}</div>
                        <div className={`text-xs font-medium mt-0.5 ${colorClass.split(' ')[0]}`}>{getStatusLabel(status)}</div>
                        <div className="text-xs text-text-secondary">{new Date(result.lab_date).toLocaleDateString()}</div>
                      </>
                    ) : (
                      <button onClick={() => { setForm(f => ({ ...f, biomarker_key: key })); setAdding(true) }}
                        className="text-xs text-primary underline">Log result</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add result modal */}
        {adding && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setAdding(false)}>
            <div className="bg-white w-full max-w-lg rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold text-text-primary">Log Lab Result</h3>
                <button onClick={() => setAdding(false)} className="text-text-secondary">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Biomarker</label>
                  <select value={form.biomarker_key} onChange={e => setForm(f => ({ ...f, biomarker_key: e.target.value }))}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-white">
                    <option value="">Select biomarker...</option>
                    {CATEGORIES.map(cat => (
                      <optgroup key={cat} label={cat}>
                        {Object.entries(BIOMARKERS).filter(([, r]) => r.category === cat).map(([key, r]) => (
                          <option key={key} value={key}>{r.name} ({r.unit})</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {form.biomarker_key && (
                  <div className="text-xs text-text-secondary bg-surface rounded-xl p-2">
                    {BIOMARKERS[form.biomarker_key]?.description}
                    {BIOMARKERS[form.biomarker_key]?.optimalLow !== undefined && (
                      <span className="text-green-600 ml-2">Optimal: {BIOMARKERS[form.biomarker_key].optimalLow}–{BIOMARKERS[form.biomarker_key].optimalHigh} {BIOMARKERS[form.biomarker_key].unit}</span>
                    )}
                  </div>
                )}
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Value ({form.biomarker_key ? BIOMARKERS[form.biomarker_key]?.unit : 'unit'})</label>
                  <input type="number" step="0.01" placeholder="e.g. 35" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Test date</label>
                    <input type="date" value={form.lab_date} onChange={e => setForm(f => ({ ...f, lab_date: e.target.value }))}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-white" />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Lab name (optional)</label>
                    <input type="text" placeholder="e.g. Quest" value={form.lab_name} onChange={e => setForm(f => ({ ...f, lab_name: e.target.value }))}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-white" />
                  </div>
                </div>
                <button onClick={save} disabled={saving || !form.biomarker_key || !form.value}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Result'}
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-text-secondary text-center mt-4">
          Optimal ranges based on functional medicine guidelines (IFM 2022). Not medical advice — consult your doctor.
        </p>
      </div>
    </div>
  )
}

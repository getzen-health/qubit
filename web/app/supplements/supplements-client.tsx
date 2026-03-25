'use client'

import { useState } from 'react'
import { Plus, X, Check, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Supplement {
  id: string
  name: string
  brand: string | null
  category: string | null
  dosage_amount: number | null
  dosage_unit: string | null
  frequency: string | null
  times: string[] | null
  notes: string | null
  is_active: boolean
}

interface SupplementsClientProps {
  initialSupplements: Supplement[]
  userId: string
}

const CATEGORIES = ['Vitamin', 'Mineral', 'Protein', 'Herb', 'Other']
const DOSAGE_UNITS = ['mg', 'g', 'mcg', 'IU', 'capsule']
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'as_needed']

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  as_needed: 'As Needed',
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
      {initials}
    </div>
  )
}

export function SupplementsClient({ initialSupplements, userId }: SupplementsClientProps) {
  const [supplements, setSupplements] = useState<Supplement[]>(initialSupplements)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState('')

  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: 'Vitamin' as string,
    dosage_amount: '',
    dosage_unit: 'mg' as string,
    frequency: 'daily' as string,
    notes: '',
  })

  function resetForm() {
    setForm({
      name: '',
      brand: '',
      category: 'Vitamin',
      dosage_amount: '',
      dosage_unit: 'mg',
      frequency: 'daily',
      notes: '',
    })
    setEditingId(null)
    setFormStatus('idle')
    setFormError('')
  }

  function openForm(supplement?: Supplement) {
    if (supplement) {
      setEditingId(supplement.id)
      setForm({
        name: supplement.name,
        brand: supplement.brand ?? '',
        category: supplement.category ?? 'Vitamin',
        dosage_amount: supplement.dosage_amount?.toString() ?? '',
        dosage_unit: supplement.dosage_unit ?? 'mg',
        frequency: supplement.frequency ?? 'daily',
        notes: supplement.notes ?? '',
      })
    } else {
      resetForm()
    }
    setShowForm(true)
  }

  async function saveSupplement() {
    if (!form.name.trim()) {
      setFormError('Supplement name is required')
      return
    }

    setFormStatus('loading')
    setFormError('')

    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim() || null,
        category: form.category || null,
        dosage_amount: form.dosage_amount ? parseFloat(form.dosage_amount) : null,
        dosage_unit: form.dosage_unit || 'mg',
        frequency: form.frequency || 'daily',
        notes: form.notes.trim() || null,
        user_id: userId,
      }

      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/supplements/${editingId}` : '/api/supplements'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error ?? 'Failed to save supplement')
        setFormStatus('error')
        return
      }

      const saved = await res.json()

      if (editingId) {
        setSupplements((prev) =>
          prev.map((s) => (s.id === editingId ? saved : s))
        )
      } else {
        setSupplements((prev) => [saved, ...prev].sort((a, b) => a.name.localeCompare(b.name)))
      }

      setFormStatus('success')
      setTimeout(() => {
        setShowForm(false)
        resetForm()
      }, 1000)
    } catch (error) {
      setFormError('Network error')
      setFormStatus('error')
    }
  }

  async function deleteSupplement(id: string) {
    if (!confirm('Delete this supplement?')) return

    try {
      const res = await fetch(`/api/supplements/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSupplements((prev) => prev.filter((s) => s.id !== id))
      }
    } catch {
      // silently fail
    }
  }

  async function logTaken(supplement: Supplement) {
    try {
      await fetch('/api/supplement-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplement_id: supplement.id,
          user_id: userId,
          taken_at: new Date().toISOString(),
          skipped: false,
        }),
      })
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => openForm()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-accent/50 text-accent text-sm font-medium hover:bg-accent/5 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Supplement
      </button>

      {supplements.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center text-text-secondary text-sm">
          No supplements yet. Add one to get started!
        </div>
      ) : (
        <div className="space-y-3">
          {supplements.map((s) => (
            <div
              key={s.id}
              className="bg-surface rounded-xl border border-border p-4 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <AvatarInitials name={s.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary text-sm truncate">{s.name}</p>
                    {s.category && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-md whitespace-nowrap">
                        {s.category}
                      </span>
                    )}
                  </div>
                  {s.brand && (
                    <p className="text-xs text-text-secondary truncate">{s.brand}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {s.dosage_amount && (
                      <span className="text-xs text-text-secondary">
                        {s.dosage_amount}{s.dosage_unit}
                      </span>
                    )}
                    {s.frequency && (
                      <span className="text-xs text-text-secondary">
                        • {FREQUENCY_LABELS[s.frequency] || s.frequency}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => logTaken(s)}
                  className="py-1.5 px-3 bg-green-500/10 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors"
                >
                  Log taken
                </button>
                <button
                  onClick={() => openForm(s)}
                  className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-text-secondary" />
                </button>
                <button
                  onClick={() => deleteSupplement(s.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-sm p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-background z-10">
              <h3 className="font-semibold text-text-primary">
                {editingId ? 'Edit Supplement' : 'Add Supplement'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="p-1 rounded-lg hover:bg-surface-secondary"
              >
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Vitamin D3"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">Brand</label>
                <input
                  type="text"
                  placeholder="e.g., Nature Made"
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Amount</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={form.dosage_amount}
                    onChange={(e) => setForm((f) => ({ ...f, dosage_amount: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Unit</label>
                  <select
                    value={form.dosage_unit}
                    onChange={(e) => setForm((f) => ({ ...f, dosage_unit: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    {DOSAGE_UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {FREQUENCIES.map((freq) => (
                    <option key={freq} value={freq}>{FREQUENCY_LABELS[freq]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">Notes</label>
                <textarea
                  placeholder="Any additional notes..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                />
              </div>
            </div>

            {formStatus === 'error' && formError && (
              <p className="text-xs text-red-500">{formError}</p>
            )}
            {formStatus === 'success' && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Supplement saved!
              </p>
            )}

            <button
              onClick={saveSupplement}
              disabled={formStatus === 'loading' || formStatus === 'success'}
              className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-60 transition-opacity"
            >
              {formStatus === 'loading' ? 'Saving…' : editingId ? 'Update' : 'Add Supplement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

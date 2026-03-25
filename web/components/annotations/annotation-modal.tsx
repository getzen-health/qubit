'use client'

import { useState } from 'react'
import { X, MessageSquare, Save } from 'lucide-react'

interface AnnotationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: string, category?: string) => Promise<void>
  initialNote?: string
  initialCategory?: string
  entryDate: string
  entryType: string
}

const ANNOTATION_CATEGORIES = [
  { value: 'injury', label: 'Injury' },
  { value: 'travel', label: 'Travel' },
  { value: 'stress', label: 'Stress' },
  { value: 'illness', label: 'Illness' },
  { value: 'medication', label: 'Medication' },
  { value: 'sleep-quality', label: 'Sleep Quality' },
  { value: 'diet', label: 'Diet' },
  { value: 'weather', label: 'Weather' },
]

export function AnnotationModal({
  isOpen,
  onClose,
  onSave,
  initialNote = '',
  initialCategory = '',
  entryDate,
  entryType,
}: AnnotationModalProps) {
  const [note, setNote] = useState(initialNote)
  const [category, setCategory] = useState(initialCategory)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = async () => {
    if (!note.trim()) {
      setError('Note cannot be empty')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave(note, category || undefined)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl border border-border max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-text-primary">Add Note</h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 hover:bg-surface-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <p className="text-sm text-text-secondary mb-4">
          {entryType.charAt(0).toUpperCase() + entryType.slice(1)} • {entryDate}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          maxLength={500}
          rows={4}
          className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 mb-4 resize-none"
        />

        <div className="mb-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Category (optional)</p>
          <div className="grid grid-cols-2 gap-2">
            {ANNOTATION_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(category === cat.value ? '' : cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-accent text-white'
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !note.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <p className="text-xs text-text-secondary text-center mt-3">
          {note.length}/500
        </p>
      </div>
    </div>
  )
}

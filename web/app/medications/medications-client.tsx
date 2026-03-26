'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Pill,
  X,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Medication {
  id: string
  user_id: string
  name: string
  dosage: number
  unit: string
  frequency: string
  time_of_day: string[]
  start_date: string
  end_date: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

interface MedicationLog {
  id: string
  user_id: string
  medication_id: string
  taken_at: string
  skipped: boolean
  notes: string | null
}

interface MedicationsClientProps {
  initialMedications: Medication[]
  initialTodayLogs: MedicationLog[]
  userId: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_times_daily', label: 'Three times daily' },
  { value: 'as_needed', label: 'As needed' },
]

const TIME_OF_DAY_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
]

const UNIT_OPTIONS = ['mg', 'mcg', 'g', 'ml', 'IU', 'tablet', 'capsule', 'drop', 'patch']

const FREQUENCY_LABELS: Record<string, string> = {
  once_daily: 'Once daily',
  twice_daily: 'Twice daily',
  three_times_daily: 'Three times daily',
  as_needed: 'As needed',
}

// ─── Empty form state ─────────────────────────────────────────────────────────

function emptyForm() {
  return {
    name: '',
    dosage: '',
    unit: 'mg',
    frequency: 'once_daily',
    time_of_day: [] as string[],
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    notes: '',
  }
}

// ─── Today's Checklist ────────────────────────────────────────────────────────

interface ChecklistProps {
  medications: Medication[]
  logs: MedicationLog[]
  onMark: (medication: Medication, skipped: boolean, logId?: string) => void
  loadingId: string | null
}

function TodayChecklist({ medications, logs, onMark, loadingId }: ChecklistProps) {
  const today = new Date().toISOString().slice(0, 10)

  const activeDueToday = medications.filter((m) => {
    if (!m.active) return false
    if (m.start_date > today) return false
    if (m.end_date && m.end_date < today) return false
    if (m.frequency === 'as_needed') return false
    return true
  })

  const logByMedId = useMemo(() => {
    const map = new Map<string, MedicationLog>()
    for (const log of logs) map.set(log.medication_id, log)
    return map
  }, [logs])

  if (activeDueToday.length === 0) {
    return (
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Today's Checklist
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-center">
          <Pill className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No medications scheduled for today.</p>
        </div>
      </section>
    )
  }

  const total = activeDueToday.length
  const taken = activeDueToday.filter((m) => {
    const log = logByMedId.get(m.id)
    return log && !log.skipped
  }).length

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Today's Checklist</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {taken}/{total} taken
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${total > 0 ? (taken / total) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-2">
        {activeDueToday.map((med) => {
          const log = logByMedId.get(med.id)
          const isTaken = !!log && !log.skipped
          const isSkipped = !!log && log.skipped
          const isLoading = loadingId === med.id

          return (
            <div
              key={med.id}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border transition-all',
                isTaken
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                  : isSkipped
                  ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-60'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', isTaken ? 'text-green-800 dark:text-green-300' : 'text-gray-900 dark:text-gray-100')}>
                  {med.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {med.dosage} {med.unit}
                  {med.time_of_day.length > 0 && (
                    <> · {med.time_of_day.join(', ')}</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {log ? (
                  <button
                    onClick={() => onMark(med, false, log.id)}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    title="Undo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                ) : null}
                {!isTaken && (
                  <button
                    onClick={() => onMark(med, true)}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50"
                    title="Mark as skipped"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => log ? onMark(med, false, log.id) : onMark(med, false)}
                  disabled={isLoading || isTaken}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50',
                    isTaken
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isTaken ? 'Taken' : isLoading ? '…' : 'Take'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Active Medications List ──────────────────────────────────────────────────

interface MedicationListProps {
  medications: Medication[]
  onEdit: (med: Medication) => void
  onToggle: (med: Medication) => void
  onDelete: (med: Medication) => void
  actionLoadingId: string | null
}

function ActiveMedicationsList({ medications, onEdit, onToggle, onDelete, actionLoadingId }: MedicationListProps) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        All Medications
      </h2>
      {medications.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-center">
          <Pill className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No medications added yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {medications.map((med) => (
            <div
              key={med.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {med.name}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                        med.active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {med.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {med.dosage} {med.unit} · {FREQUENCY_LABELS[med.frequency] ?? med.frequency}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Started {med.start_date}
                    {med.end_date && <> · Until {med.end_date}</>}
                  </p>
                  {med.time_of_day.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {med.time_of_day.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {med.notes && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{med.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEdit(med)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggle(med)}
                    disabled={actionLoadingId === med.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                    title={med.active ? 'Pause' : 'Resume'}
                  >
                    {med.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onDelete(med)}
                    disabled={actionLoadingId === med.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

interface ModalProps {
  editingMed: Medication | null
  form: ReturnType<typeof emptyForm>
  setForm: (f: ReturnType<typeof emptyForm>) => void
  onSave: () => void
  onClose: () => void
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string
}

function MedicationModal({ editingMed, form, setForm, onSave, onClose, status, error }: ModalProps) {
  function toggleTimeOfDay(t: string) {
    setForm({
      ...form,
      time_of_day: form.time_of_day.includes(t)
        ? form.time_of_day.filter((v) => v !== t)
        : [...form.time_of_day, t],
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {editingMed ? 'Edit Medication' : 'Add Medication'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Medication name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Lisinopril"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Dosage + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Dosage <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Frequency <span className="text-red-500">*</span>
            </label>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {FREQUENCY_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Time of day */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Time of day
            </label>
            <div className="flex flex-wrap gap-2">
              {TIME_OF_DAY_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleTimeOfDay(t.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    form.time_of_day.includes(t.value)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start / End date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Start date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                End date
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                min={form.start_date}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Optional notes…"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={status === 'loading'}
              className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {status === 'loading' ? 'Saving…' : status === 'success' ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function MedicationsClient({
  initialMedications,
  initialTodayLogs,
}: MedicationsClientProps) {
  const [medications, setMedications] = useState<Medication[]>(initialMedications)
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>(initialTodayLogs)

  const [showModal, setShowModal] = useState(false)
  const [editingMed, setEditingMed] = useState<Medication | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState('')

  const [checklistLoadingId, setChecklistLoadingId] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  function openAdd() {
    setEditingMed(null)
    setForm(emptyForm())
    setFormStatus('idle')
    setFormError('')
    setShowModal(true)
  }

  function openEdit(med: Medication) {
    setEditingMed(med)
    setForm({
      name: med.name,
      dosage: med.dosage.toString(),
      unit: med.unit,
      frequency: med.frequency,
      time_of_day: med.time_of_day,
      start_date: med.start_date,
      end_date: med.end_date ?? '',
      notes: med.notes ?? '',
    })
    setFormStatus('idle')
    setFormError('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingMed(null)
    setFormStatus('idle')
    setFormError('')
  }

  async function saveMedication() {
    if (!form.name.trim()) { setFormError('Medication name is required'); return }
    const dosageNum = parseFloat(form.dosage)
    if (!form.dosage || isNaN(dosageNum) || dosageNum <= 0) { setFormError('Dosage must be greater than 0'); return }
    if (!form.start_date) { setFormError('Start date is required'); return }

    setFormStatus('loading')
    setFormError('')

    const payload = {
      name: form.name.trim(),
      dosage: dosageNum,
      unit: form.unit,
      frequency: form.frequency,
      time_of_day: form.time_of_day,
      start_date: form.start_date,
      end_date: form.end_date || null,
      notes: form.notes.trim() || null,
    }

    try {
      const method = editingMed ? 'PUT' : 'POST'
      const url = editingMed ? `/api/medications/${editingMed.id}` : '/api/medications'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error ?? 'Failed to save medication')
        setFormStatus('error')
        return
      }

      const saved: Medication = await res.json()
      if (editingMed) {
        setMedications((prev) => prev.map((m) => (m.id === editingMed.id ? saved : m)))
      } else {
        setMedications((prev) => [saved, ...prev].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setFormStatus('success')
      setTimeout(closeModal, 800)
    } catch {
      setFormError('Network error')
      setFormStatus('error')
    }
  }

  async function toggleActive(med: Medication) {
    setActionLoadingId(med.id)
    try {
      const res = await fetch(`/api/medications/${med.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !med.active }),
      })
      if (res.ok) {
        const updated: Medication = await res.json()
        setMedications((prev) => prev.map((m) => (m.id === med.id ? updated : m)))
      }
    } catch { /* silently fail */ }
    setActionLoadingId(null)
  }

  async function deleteMedication(med: Medication) {
    if (!confirm(`Delete "${med.name}"? This cannot be undone.`)) return
    setActionLoadingId(med.id)
    try {
      const res = await fetch(`/api/medications/${med.id}`, { method: 'DELETE' })
      if (res.ok) {
        setMedications((prev) => prev.filter((m) => m.id !== med.id))
        setTodayLogs((prev) => prev.filter((l) => l.medication_id !== med.id))
      }
    } catch { /* silently fail */ }
    setActionLoadingId(null)
  }

  async function markMedication(med: Medication, skipped: boolean, logId?: string) {
    setChecklistLoadingId(med.id)
    try {
      if (logId) {
        // Undo: delete the log
        const res = await fetch(`/api/medication-logs?id=${logId}`, { method: 'DELETE' })
        if (res.ok) {
          setTodayLogs((prev) => prev.filter((l) => l.id !== logId))
        }
      } else {
        const res = await fetch('/api/medication-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medication_id: med.id,
            taken_at: new Date().toISOString(),
            skipped,
          }),
        })
        if (res.ok) {
          const log: MedicationLog = await res.json()
          // Replace any existing log for this med today, then add new
          setTodayLogs((prev) => [...prev.filter((l) => l.medication_id !== med.id), log])
        }
      }
    } catch { /* silently fail */ }
    setChecklistLoadingId(null)
  }

  return (
    <>
      {/* Add Medication button */}
      <div className="flex justify-end">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Medication
        </button>
      </div>

      {/* Today's checklist */}
      <TodayChecklist
        medications={medications}
        logs={todayLogs}
        onMark={markMedication}
        loadingId={checklistLoadingId}
      />

      {/* All medications */}
      <ActiveMedicationsList
        medications={medications}
        onEdit={openEdit}
        onToggle={toggleActive}
        onDelete={deleteMedication}
        actionLoadingId={actionLoadingId}
      />

      {/* Add/Edit modal */}
      {showModal && (
        <MedicationModal
          editingMed={editingMed}
          form={form}
          setForm={setForm}
          onSave={saveMedication}
          onClose={closeModal}
          status={formStatus}
          error={formError}
        />
      )}
    </>
  )
}

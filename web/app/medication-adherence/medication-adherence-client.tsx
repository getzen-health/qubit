'use client'

import { useState, useCallback, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar } from 'recharts'
import { Pill, CheckCircle2, XCircle, Clock, AlertTriangle, Plus, ChevronDown, ChevronUp, Info, Flame } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  checkInteractions,
  getChronopharmacologyTip,
  getAdherenceStatus,
  getMissedDoseGuidance,
  ADHERENCE_COLORS,
  ADHERENCE_LABELS,
  FREQUENCY_LABELS,
  WHO_ADHERENCE_TIPS,
  type MedicationEntry,
  type MedicationFrequency,
} from '@/lib/medication-adherence'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MedLog {
  id?: string
  medication_id: string
  scheduled_time: string
  taken_at: string | null
  skipped: boolean
  notes?: string
}

interface MedStat {
  medication_id: string
  name: string
  taken: number
  scheduled: number
  rate: number
}

interface ChartPoint {
  date: string
  rate: number
  taken: number
  scheduled: number
}

interface Props {
  medications: MedicationEntry[]
  todayLogs: MedLog[]
  chartData: ChartPoint[]
  perMedStats: MedStat[]
  overallRate: number
  streak: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FREQUENCY_TIMES: Record<MedicationFrequency, string[]> = {
  once_daily: ['08:00'],
  twice_daily: ['08:00', '20:00'],
  three_daily: ['08:00', '14:00', '20:00'],
  four_daily: ['08:00', '12:00', '16:00', '20:00'],
  weekly: ['08:00'],
  as_needed: [],
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Severity badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: 'major' | 'moderate' | 'minor' }) {
  const map = { major: 'bg-red-500/20 text-red-400', moderate: 'bg-orange-500/20 text-orange-400', minor: 'bg-yellow-500/20 text-yellow-400' }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide', map[severity])}>
      {severity}
    </span>
  )
}

// ─── Compliance ring ──────────────────────────────────────────────────────────

function ComplianceRing({ rate, size = 80 }: { rate: number; size?: number }) {
  const status = getAdherenceStatus(rate)
  const color = ADHERENCE_COLORS[status]
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={(size - 8) / 2} fill="none" stroke="var(--color-border, #333)" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={(size - 8) / 2}
          fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={Math.PI * (size - 8)}
          strokeDashoffset={Math.PI * (size - 8) * (1 - rate / 100)}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>{rate}%</span>
    </div>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 py-2.5 text-sm font-medium rounded-xl transition-all',
        active
          ? 'bg-primary text-white shadow-md'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface',
      )}
    >
      {children}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MedicationAdherenceClient({
  medications: initialMeds,
  todayLogs: initialLogs,
  chartData,
  perMedStats,
  overallRate,
  streak,
}: Props) {
  const [tab, setTab] = useState<'today' | 'medications' | 'compliance'>('today')
  const [medications, setMedications] = useState<MedicationEntry[]>(initialMeds)
  const [todayLogs, setTodayLogs] = useState<MedLog[]>(initialLogs)
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedInteraction, setExpandedInteraction] = useState<string | null>(null)

  // ── Add medication form state ───────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    dose: '',
    unit: 'mg',
    frequency: 'once_daily' as MedicationFrequency,
    times_of_day: ['08:00'],
    with_food: false,
    start_date: new Date().toISOString().slice(0, 10),
    prescribing_doctor: '',
    indication: '',
    notes: '',
  })

  // ── Interaction checker state ──────────────────────────────────────────
  const [selectedForInteraction, setSelectedForInteraction] = useState<string[]>([])

  // ── Today's scheduled doses (computed from medications) ─────────────────
  const today = new Date().toISOString().slice(0, 10)
  const scheduledDoses = useMemo(() => {
    const doses: Array<{ medication: MedicationEntry; scheduled_time: string; log?: MedLog }> = []
    for (const med of medications) {
      if (med.frequency === 'as_needed') continue
      for (const time of med.times_of_day) {
        const scheduled_time = `${today}T${time}:00`
        const log = todayLogs.find(l => l.medication_id === med.id && l.scheduled_time.startsWith(`${today}T${time}`))
        doses.push({ medication: med, scheduled_time, log })
      }
    }
    return doses.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
  }, [medications, todayLogs, today])

  // ── Today compliance rate ──────────────────────────────────────────────
  const todayRate = useMemo(() => {
    if (scheduledDoses.length === 0) return 100
    const taken = scheduledDoses.filter(d => d.log?.taken_at && !d.log?.skipped).length
    return Math.round((taken / scheduledDoses.length) * 100)
  }, [scheduledDoses])

  // ── Interaction warnings for all active meds ───────────────────────────
  const allInteractions = useMemo(
    () => checkInteractions(medications.map(m => m.name)),
    [medications]
  )
  const majorInteractions = allInteractions.filter(i => i.severity === 'major')

  // ── Log a dose ─────────────────────────────────────────────────────────
  const logDose = useCallback(async (
    medication_id: string,
    scheduled_time: string,
    action: 'taken' | 'skipped'
  ) => {
    setLoading(true)
    try {
      const res = await fetch('/api/medication-adherence?resource=log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medication_id,
          scheduled_time,
          taken_at: action === 'taken' ? new Date().toISOString() : null,
          skipped: action === 'skipped',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { log } = await res.json()
      setTodayLogs(prev => {
        const without = prev.filter(l => !(l.medication_id === medication_id && l.scheduled_time.startsWith(scheduled_time.slice(0, 16))))
        return [...without, log]
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Add medication ─────────────────────────────────────────────────────
  const addMedication = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/medication-adherence?resource=medication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dose: form.dose ? parseFloat(form.dose) : null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { medication } = await res.json()
      setMedications(prev => [...prev, medication])
      setShowAddForm(false)
      setForm({
        name: '', dose: '', unit: 'mg', frequency: 'once_daily',
        times_of_day: ['08:00'], with_food: false,
        start_date: new Date().toISOString().slice(0, 10),
        prescribing_doctor: '', indication: '', notes: '',
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [form])

  // ── Deactivate medication ──────────────────────────────────────────────
  const deactivateMedication = useCallback(async (id: string) => {
    if (!confirm('Stop tracking this medication?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/medication-adherence?resource=deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medication_id: id }),
      })
      if (!res.ok) throw new Error(await res.text())
      setMedications(prev => prev.filter(m => m.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Checked interactions for selected meds ─────────────────────────────
  const checkedInteractions = useMemo(
    () => checkInteractions(selectedForInteraction),
    [selectedForInteraction]
  )

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Medication Adherence</h1>
            <p className="text-xs text-text-secondary">Compliance · Schedule · Drug-food interactions</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Major interaction banner */}
        {majorInteractions.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="text-xs text-red-400">
              <span className="font-semibold">Major interaction{majorInteractions.length > 1 ? 's' : ''} detected</span>
              {' '}with your current medications — see Medications tab for details.
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-surface border border-border rounded-2xl p-1">
          <TabButton active={tab === 'today'} onClick={() => setTab('today')}>Today</TabButton>
          <TabButton active={tab === 'medications'} onClick={() => setTab('medications')}>Medications</TabButton>
          <TabButton active={tab === 'compliance'} onClick={() => setTab('compliance')}>Compliance</TabButton>
        </div>

        {/* ── TODAY TAB ─────────────────────────────────────────────────────── */}
        {tab === 'today' && (
          <div className="space-y-4">
            {/* Today compliance ring + summary */}
            <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
              <ComplianceRing rate={todayRate} size={80} />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {ADHERENCE_LABELS[getAdherenceStatus(todayRate)]}
                </p>
                <p className="text-xs text-text-secondary">
                  {scheduledDoses.filter(d => d.log?.taken_at && !d.log?.skipped).length}/{scheduledDoses.length} doses taken today
                </p>
                {scheduledDoses.length === 0 && (
                  <p className="text-xs text-text-secondary">No doses scheduled for today</p>
                )}
              </div>
            </div>

            {/* Scheduled doses */}
            {scheduledDoses.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-6 text-center text-text-secondary text-sm">
                No scheduled doses today. Add medications in the Medications tab.
              </div>
            ) : (
              <div className="space-y-2">
                {scheduledDoses.map(({ medication, scheduled_time, log }) => {
                  const time = scheduled_time.slice(11, 16)
                  const isTaken = !!log?.taken_at && !log?.skipped
                  const isSkipped = !!log?.skipped
                  const tip = getChronopharmacologyTip(medication.name)
                  const now = new Date()
                  const scheduledDate = new Date(scheduled_time)
                  const hoursLate = (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60)
                  const missedGuidance = !isTaken && !isSkipped && hoursLate > 0
                    ? getMissedDoseGuidance(medication.name, hoursLate)
                    : null

                  return (
                    <div
                      key={`${medication.id}-${scheduled_time}`}
                      className={cn(
                        'bg-surface border rounded-2xl p-4 transition-all',
                        isTaken ? 'border-green-500/30' : isSkipped ? 'border-border opacity-60' : 'border-border',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-text-primary truncate">{medication.name}</span>
                            {medication.dose && (
                              <span className="text-xs text-text-secondary">{medication.dose} {medication.unit}</span>
                            )}
                            {medication.with_food && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">With food</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-text-secondary">
                            <Clock className="w-3 h-3" />
                            <span>{time}</span>
                            {isTaken && (
                              <span className="text-green-400 ml-1">
                                ✓ Taken {log?.taken_at ? new Date(log.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            )}
                            {isSkipped && <span className="text-text-secondary ml-1">Skipped</span>}
                          </div>
                          {tip && !isTaken && !isSkipped && (
                            <div className="mt-1.5 text-xs text-primary/80 flex gap-1">
                              <Info className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{tip.optimal_timing} — {tip.reason.slice(0, 80)}…</span>
                            </div>
                          )}
                          {missedGuidance && (
                            <div className={cn(
                              'mt-1.5 text-xs flex gap-1',
                              missedGuidance.action === 'consult_doctor' ? 'text-red-400' :
                              missedGuidance.action === 'take_now' ? 'text-yellow-400' : 'text-text-secondary',
                            )}>
                              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{missedGuidance.message}</span>
                            </div>
                          )}
                        </div>
                        {!isTaken && !isSkipped && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => logDose(medication.id, scheduled_time, 'taken')}
                              disabled={loading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-xl text-xs font-medium hover:bg-green-500/30 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Taken
                            </button>
                            <button
                              onClick={() => logDose(medication.id, scheduled_time, 'skipped')}
                              disabled={loading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-surface border border-border text-text-secondary rounded-xl text-xs font-medium hover:border-primary/50 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Skip
                            </button>
                          </div>
                        )}
                        {isTaken && (
                          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MEDICATIONS TAB ───────────────────────────────────────────────── */}
        {tab === 'medications' && (
          <div className="space-y-4">
            {/* Add medication button */}
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary/10 border border-primary/30 text-primary rounded-2xl text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {showAddForm ? 'Cancel' : 'Add Medication'}
            </button>

            {/* Add form */}
            {showAddForm && (
              <form onSubmit={addMedication} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <h3 className="font-semibold text-text-primary text-sm">New Medication</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-text-secondary mb-1 block">Name *</label>
                    <input
                      required value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Metformin"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Dose</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={form.dose}
                      onChange={e => setForm(p => ({ ...p, dose: e.target.value }))}
                      placeholder="500"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Unit</label>
                    <select
                      value={form.unit}
                      onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
                    >
                      {['mg', 'mcg', 'g', 'IU', 'mL', 'units', 'tablets', 'capsules'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-text-secondary mb-1 block">Frequency *</label>
                    <select
                      required value={form.frequency}
                      onChange={e => {
                        const freq = e.target.value as MedicationFrequency
                        setForm(p => ({ ...p, frequency: freq, times_of_day: FREQUENCY_TIMES[freq] }))
                      }}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
                    >
                      {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-text-secondary mb-1 block">Start Date *</label>
                    <input
                      type="date" required value={form.start_date}
                      onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-text-secondary mb-1 block">Indication / Condition</label>
                    <input
                      value={form.indication}
                      onChange={e => setForm(p => ({ ...p, indication: e.target.value }))}
                      placeholder="e.g. Type 2 diabetes"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-text-secondary mb-1 block">Prescribing Doctor</label>
                    <input
                      value={form.prescribing_doctor}
                      onChange={e => setForm(p => ({ ...p, prescribing_doctor: e.target.value }))}
                      placeholder="Dr. Smith"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox" id="with_food"
                      checked={form.with_food}
                      onChange={e => setForm(p => ({ ...p, with_food: e.target.checked }))}
                      className="accent-primary"
                    />
                    <label htmlFor="with_food" className="text-sm text-text-primary">Take with food</label>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Adding…' : 'Add Medication'}
                </button>
              </form>
            )}

            {/* Medications list */}
            {medications.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-6 text-center text-text-secondary text-sm">
                No active medications. Tap &quot;Add Medication&quot; to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {medications.map(med => {
                  const tip = getChronopharmacologyTip(med.name)
                  const interactions = checkInteractions([med.name])
                  return (
                    <div key={med.id} className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text-primary">{med.name}</p>
                          <p className="text-xs text-text-secondary">
                            {med.dose ? `${med.dose} ${med.unit} · ` : ''}{FREQUENCY_LABELS[med.frequency]}
                            {med.with_food ? ' · With food' : ''}
                          </p>
                          {med.indication && (
                            <p className="text-xs text-text-secondary mt-0.5">For: {med.indication}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deactivateMedication(med.id)}
                          className="text-xs text-text-secondary hover:text-red-400 transition-colors shrink-0 px-2 py-1 border border-border rounded-lg"
                        >
                          Stop
                        </button>
                      </div>

                      {tip && (
                        <div className="flex gap-2 bg-primary/5 border border-primary/20 rounded-xl p-2.5">
                          <Clock className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <div className="text-xs">
                            <span className="text-primary font-medium">Best timing: {tip.optimal_timing}</span>
                            <p className="text-text-secondary mt-0.5">{tip.reason}</p>
                          </div>
                        </div>
                      )}

                      {interactions.length > 0 && (
                        <div className="space-y-1.5">
                          {interactions.map((ix, i) => (
                            <div
                              key={i}
                              className={cn(
                                'rounded-xl p-2.5 cursor-pointer',
                                ix.severity === 'major' ? 'bg-red-500/10 border border-red-500/20' :
                                ix.severity === 'moderate' ? 'bg-orange-500/10 border border-orange-500/20' :
                                'bg-yellow-500/10 border border-yellow-500/20',
                              )}
                              onClick={() => setExpandedInteraction(
                                expandedInteraction === `${med.id}-${i}` ? null : `${med.id}-${i}`
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span className="text-text-primary font-medium">Avoid: {ix.food}</span>
                                  <SeverityBadge severity={ix.severity} />
                                </div>
                                {expandedInteraction === `${med.id}-${i}` ? <ChevronUp className="w-3 h-3 text-text-secondary" /> : <ChevronDown className="w-3 h-3 text-text-secondary" />}
                              </div>
                              {expandedInteraction === `${med.id}-${i}` && (
                                <div className="mt-2 space-y-1 text-xs text-text-secondary">
                                  <p><span className="font-medium text-text-primary">Mechanism:</span> {ix.mechanism}</p>
                                  <p><span className="font-medium text-text-primary">Advice:</span> {ix.recommendation}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Drug-food interaction checker */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Interaction Checker
              </h3>
              <p className="text-xs text-text-secondary">Select 2+ medications to check for drug-food interactions.</p>
              <div className="flex flex-wrap gap-2">
                {medications.map(med => (
                  <button
                    key={med.id}
                    onClick={() => setSelectedForInteraction(prev =>
                      prev.includes(med.name)
                        ? prev.filter(n => n !== med.name)
                        : [...prev, med.name]
                    )}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                      selectedForInteraction.includes(med.name)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background border-border text-text-secondary hover:border-primary/50',
                    )}
                  >
                    {med.name}
                  </button>
                ))}
              </div>
              {selectedForInteraction.length >= 1 && checkedInteractions.length > 0 && (
                <div className="space-y-2">
                  {checkedInteractions.map((ix, i) => (
                    <div key={i} className={cn(
                      'rounded-xl p-3 text-xs',
                      ix.severity === 'major' ? 'bg-red-500/10 border border-red-500/20' :
                      ix.severity === 'moderate' ? 'bg-orange-500/10 border border-orange-500/20' :
                      'bg-yellow-500/10 border border-yellow-500/20',
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-text-primary">{ix.matchedMedication}</span>
                        <span className="text-text-secondary">→</span>
                        <span className="text-text-primary">{ix.food}</span>
                        <SeverityBadge severity={ix.severity} />
                      </div>
                      <p className="text-text-secondary">{ix.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}
              {selectedForInteraction.length >= 1 && checkedInteractions.length === 0 && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  No known drug-food interactions found for selected medications.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── COMPLIANCE TAB ────────────────────────────────────────────────── */}
        {tab === 'compliance' && (
          <div className="space-y-4">
            {/* Overall stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface border border-border rounded-2xl p-3 text-center">
                <ComplianceRing rate={overallRate} size={64} />
                <p className="text-xs text-text-secondary mt-1">30-day overall</p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-3 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-2xl font-bold text-text-primary">{streak}</span>
                </div>
                <p className="text-xs text-text-secondary">day streak</p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-3 flex flex-col items-center justify-center">
                <p className="text-lg font-bold" style={{ color: ADHERENCE_COLORS[getAdherenceStatus(overallRate)] }}>
                  {getAdherenceStatus(overallRate).charAt(0).toUpperCase() + getAdherenceStatus(overallRate).slice(1)}
                </p>
                <p className="text-xs text-text-secondary">WHO status</p>
              </div>
            </div>

            {/* 30-day chart */}
            {chartData.length > 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">30-Day Compliance Rate</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} interval={6} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [`${v}%`, 'Compliance']}
                    />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={ADHERENCE_COLORS[getAdherenceStatus(entry.rate)]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-2xl p-6 text-center text-text-secondary text-sm">
                Log doses to see your 30-day compliance chart.
              </div>
            )}

            {/* Per-medication breakdown */}
            {perMedStats.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">Per-Medication Compliance</h3>
                {perMedStats.map(stat => (
                  <div key={stat.medication_id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-primary font-medium truncate max-w-[60%]">{stat.name}</span>
                      <span style={{ color: ADHERENCE_COLORS[getAdherenceStatus(stat.rate)] }}>
                        {stat.rate}% ({stat.taken}/{stat.scheduled} doses)
                      </span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${stat.rate}%`,
                          backgroundColor: ADHERENCE_COLORS[getAdherenceStatus(stat.rate)],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* WHO adherence tips */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                WHO Adherence Tips
              </h3>
              <ul className="space-y-2">
                {WHO_ADHERENCE_TIPS.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs text-text-secondary">
                    <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-text-secondary/60 pt-1">
                Source: WHO 2003 adherence report — &quot;Non-adherence is a worldwide problem of striking magnitude.&quot;
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

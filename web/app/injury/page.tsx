'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, AlertTriangle, ChevronRight, CheckCircle2, RefreshCw, Clock, X } from 'lucide-react'
import {
  BODY_REGIONS,
  PROTOCOLS,
  getProtocol,
  requiresMedicalAttention,
  type BodyRegion,
  type PainType,
  type OnsetType,
  type RecoveryStatus,
  type InjuryLog,
} from '@/lib/injury-tracker'

const PAIN_TYPES: { value: PainType; label: string; emoji: string }[] = [
  { value: 'sharp', label: 'Sharp', emoji: '⚡' },
  { value: 'dull', label: 'Dull', emoji: '🔵' },
  { value: 'aching', label: 'Aching', emoji: '😣' },
  { value: 'burning', label: 'Burning', emoji: '🔥' },
  { value: 'tingling', label: 'Tingling', emoji: '⚡' },
  { value: 'pressure', label: 'Pressure', emoji: '🫸' },
]

const ONSET_TYPES: { value: OnsetType; label: string; desc: string }[] = [
  { value: 'acute', label: 'Acute', desc: 'Sudden injury' },
  { value: 'gradual', label: 'Gradual', desc: 'Developed over time' },
  { value: 'chronic', label: 'Chronic', desc: 'Long-standing issue' },
]

const AGGRAVATING = ['Running', 'Sitting', 'Lifting', 'Stairs', 'Walking', 'Standing', 'Sleeping', 'Overhead', 'Bending', 'Twisting']
const RELIEVING = ['Rest', 'Ice', 'Heat', 'Stretching', 'Elevation', 'Compression', 'Massage', 'Movement', 'Medication']

const INTENSITY_EMOJI = ['😌', '🙂', '😐', '😕', '😟', '😣', '😖', '😫', '😭', '🤬', '💀']

const CATEGORY_ICONS: Record<string, string> = {
  head: '🧠', neck: '↕️', shoulder: '💪', arm: '🦾', chest: '🫁', back: '🔙', hip: '🦴', leg: '🦵', foot: '🦶',
}

const CATEGORY_ORDER = ['head', 'neck', 'shoulder', 'arm', 'chest', 'back', 'hip', 'leg', 'foot'] as const

const STATUS_COLORS: Record<RecoveryStatus, string> = {
  active: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  improving: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  recurring: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

const INTENSITY_COLORS = [
  'bg-green-500', 'bg-green-400', 'bg-lime-400', 'bg-yellow-400', 'bg-yellow-500',
  'bg-orange-400', 'bg-orange-500', 'bg-red-400', 'bg-red-500', 'bg-red-600', 'bg-red-700',
]

export default function InjuryPage() {
  const [tab, setTab] = useState<'map' | 'active' | 'recovery'>('map')
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null)
  const [painType, setPainType] = useState<PainType>('aching')
  const [intensity, setIntensity] = useState(3)
  const [onset, setOnset] = useState<OnsetType>('acute')
  const [onsetDate, setOnsetDate] = useState(new Date().toISOString().slice(0, 10))
  const [aggravating, setAggravating] = useState<string[]>([])
  const [relieving, setRelieving] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeInjuries, setActiveInjuries] = useState<any[]>([])
  const [selectedForRecovery, setSelectedForRecovery] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/injury')
      .then((r) => r.json())
      .then((d) => {
        setActiveInjuries(d.active ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function toggleFactor(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val])
  }

  async function handleLogInjury() {
    if (!selectedRegion) return
    setSaving(true)
    try {
      const res = await fetch('/api/injury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body_region: selectedRegion.id,
          pain_type: painType,
          intensity,
          onset_type: onset,
          onset_date: onsetDate,
          aggravating_factors: aggravating,
          relieving_factors: relieving,
          notes,
        }),
      })
      if (res.ok) {
        const { log } = await res.json()
        setActiveInjuries((prev) => [log, ...prev])
        setSaved(true)
        setTimeout(() => {
          setSaved(false)
          setSelectedRegion(null)
          setAggravating([])
          setRelieving([])
          setNotes('')
          setIntensity(3)
        }, 1500)
      }
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(id: string, status: RecoveryStatus) {
    await fetch('/api/injury', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, recovery_status: status }),
    })
    setActiveInjuries((prev) =>
      prev.map((i) => (i.id === id ? { ...i, recovery_status: status } : i))
    )
  }

  const regionsByCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    regions: BODY_REGIONS.filter((r) => r.category === cat),
  }))

  const fakeLog = (inj: any): InjuryLog => ({
    id: inj.id,
    body_region: inj.body_region,
    pain_type: inj.pain_type as PainType,
    intensity: inj.intensity,
    onset: inj.onset_type as OnsetType,
    onset_date: inj.onset_date ?? '',
    aggravating_factors: inj.aggravating_factors ?? [],
    relieving_factors: inj.relieving_factors ?? [],
    recovery_status: inj.recovery_status as RecoveryStatus,
    notes: inj.notes ?? '',
  })

  function daysSince(dateStr: string) {
    if (!dateStr) return null
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold text-text-primary">Pain & Injury Tracker</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-surface">
        {(['map', 'active', 'recovery'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t === 'map' ? 'Body Map' : t === 'active' ? `Active (${activeInjuries.filter((i) => i.recovery_status !== 'resolved').length})` : 'Recovery'}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 max-w-xl mx-auto">
        {/* ── BODY MAP TAB ── */}
        {tab === 'map' && (
          <div>
            {!selectedRegion ? (
              <>
                <p className="text-text-secondary text-sm mb-4">Tap a body region to log pain or injury.</p>
                {regionsByCategory.map(({ cat, regions }) => (
                  <div key={cat} className="mb-4">
                    <p className="text-xs font-semibold uppercase text-text-secondary mb-2 tracking-wide">
                      {CATEGORY_ICONS[cat]} {cat}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {regions.map((r) => {
                        const hasActive = activeInjuries.some((i) => i.body_region === r.id && i.recovery_status !== 'resolved')
                        return (
                          <button
                            key={r.id}
                            onClick={() => setSelectedRegion(r)}
                            className={`relative rounded-2xl border px-3 py-2.5 text-sm text-left transition-all ${
                              hasActive
                                ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                : 'border-border bg-surface text-text-primary hover:border-primary hover:bg-primary/5'
                            }`}
                          >
                            {hasActive && (
                              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                            )}
                            <span className="truncate block">{r.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="space-y-4">
                {/* Region header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Logging pain for</p>
                    <h2 className="text-lg font-semibold text-text-primary">{selectedRegion.name}</h2>
                  </div>
                  <button onClick={() => setSelectedRegion(null)} className="p-2 rounded-full hover:bg-border/40">
                    <X className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>

                {/* Pain type chips */}
                <div>
                  <p className="text-sm font-medium text-text-primary mb-2">Pain type</p>
                  <div className="flex flex-wrap gap-2">
                    {PAIN_TYPES.map((pt) => (
                      <button
                        key={pt.value}
                        onClick={() => setPainType(pt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          painType === pt.value
                            ? 'bg-primary text-white border-primary'
                            : 'border-border bg-surface text-text-primary hover:border-primary'
                        }`}
                      >
                        {pt.emoji} {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensity slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-text-primary">Intensity (NRS 0–10)</p>
                    <span className="text-2xl">{INTENSITY_EMOJI[intensity]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-text-secondary mt-1">
                    <span>0 No pain</span>
                    <span className={`font-bold text-sm ${INTENSITY_COLORS[intensity].replace('bg-', 'text-')}`}>{intensity}/10</span>
                    <span>10 Worst</span>
                  </div>
                </div>

                {/* Onset type */}
                <div>
                  <p className="text-sm font-medium text-text-primary mb-2">Onset</p>
                  <div className="grid grid-cols-3 gap-2">
                    {ONSET_TYPES.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => setOnset(o.value)}
                        className={`rounded-2xl border p-2 text-center transition-all ${
                          onset === o.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-surface text-text-primary hover:border-primary'
                        }`}
                      >
                        <p className="text-sm font-medium">{o.label}</p>
                        <p className="text-xs text-text-secondary">{o.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Onset date */}
                <div>
                  <p className="text-sm font-medium text-text-primary mb-1">When did it start?</p>
                  <input
                    type="date"
                    value={onsetDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setOnsetDate(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-text-primary"
                  />
                </div>

                {/* Aggravating factors */}
                <div>
                  <p className="text-sm font-medium text-text-primary mb-2">Aggravating factors</p>
                  <div className="flex flex-wrap gap-2">
                    {AGGRAVATING.map((f) => (
                      <button
                        key={f}
                        onClick={() => toggleFactor(aggravating, setAggravating, f)}
                        className={`px-3 py-1 rounded-full text-sm border transition-all ${
                          aggravating.includes(f)
                            ? 'bg-orange-100 border-orange-400 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'border-border bg-surface text-text-secondary hover:border-orange-400'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Relieving factors */}
                <div>
                  <p className="text-sm font-medium text-text-primary mb-2">Relieving factors</p>
                  <div className="flex flex-wrap gap-2">
                    {RELIEVING.map((f) => (
                      <button
                        key={f}
                        onClick={() => toggleFactor(relieving, setRelieving, f)}
                        className={`px-3 py-1 rounded-full text-sm border transition-all ${
                          relieving.includes(f)
                            ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'border-border bg-surface text-text-secondary hover:border-green-400'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-sm font-medium text-text-primary mb-1">Notes</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Describe the injury, how it happened..."
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary resize-none"
                  />
                </div>

                {/* Medical warning */}
                {intensity >= 8 && (
                  <div className="flex items-start gap-2 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 p-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400">
                      High pain intensity — consider seeking medical attention before self-managing.
                    </p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleLogInjury}
                  disabled={saving || saved}
                  className="w-full rounded-2xl bg-primary text-white py-3 font-medium disabled:opacity-60 transition-opacity"
                >
                  {saved ? '✅ Logged!' : saving ? 'Saving…' : 'Log Injury'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVE INJURIES TAB ── */}
        {tab === 'active' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-text-secondary py-10">Loading…</div>
            ) : activeInjuries.filter((i) => i.recovery_status !== 'resolved').length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-text-secondary">No active injuries 🎉</p>
              </div>
            ) : (
              activeInjuries
                .filter((i) => i.recovery_status !== 'resolved')
                .map((inj) => {
                  const region = BODY_REGIONS.find((r) => r.id === inj.body_region)
                  const needsMD = requiresMedicalAttention(fakeLog(inj))
                  const days = daysSince(inj.onset_date ?? inj.logged_at)
                  return (
                    <div
                      key={inj.id}
                      className="rounded-2xl border border-border bg-surface p-4 space-y-3"
                    >
                      {needsMD && (
                        <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                          <p className="text-xs text-red-600 dark:text-red-400 font-medium">⚠️ Consider medical attention</p>
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-text-primary">
                            {region?.name ?? inj.body_region}
                          </p>
                          <p className="text-sm text-text-secondary capitalize">{inj.pain_type} pain</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${INTENSITY_COLORS[inj.intensity]} text-white`}>
                            {inj.intensity}/10
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[inj.recovery_status as RecoveryStatus]}`}>
                            {inj.recovery_status}
                          </span>
                        </div>
                      </div>
                      {days !== null && (
                        <p className="text-xs text-text-secondary flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {days === 0 ? 'Today' : `${days} day${days !== 1 ? 's' : ''} ago`}
                        </p>
                      )}
                      {inj.aggravating_factors?.length > 0 && (
                        <p className="text-xs text-text-secondary">
                          Aggravated by: {inj.aggravating_factors.join(', ')}
                        </p>
                      )}
                      {/* Status update buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {(['improving', 'resolved', 'recurring'] as RecoveryStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(inj.id, s)}
                            disabled={inj.recovery_status === s}
                            className={`rounded-full px-3 py-1 text-xs border transition-all disabled:opacity-40 ${
                              inj.recovery_status === s
                                ? STATUS_COLORS[s]
                                : 'border-border text-text-secondary hover:border-primary hover:text-primary'
                            }`}
                          >
                            {s === 'improving' ? '📈 Improving' : s === 'resolved' ? '✅ Resolved' : '🔄 Recurring'}
                          </button>
                        ))}
                        <button
                          onClick={() => { setSelectedForRecovery(inj); setTab('recovery') }}
                          className="rounded-full px-3 py-1 text-xs border border-primary text-primary hover:bg-primary/10 flex items-center gap-1 transition-all"
                        >
                          Protocol <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        )}

        {/* ── RECOVERY TAB ── */}
        {tab === 'recovery' && (
          <div className="space-y-4">
            {/* Injury selector */}
            {activeInjuries.filter((i) => i.recovery_status !== 'resolved').length > 0 && (
              <div>
                <p className="text-sm font-medium text-text-primary mb-2">Select an injury</p>
                <div className="flex flex-wrap gap-2">
                  {activeInjuries
                    .filter((i) => i.recovery_status !== 'resolved')
                    .map((inj) => {
                      const region = BODY_REGIONS.find((r) => r.id === inj.body_region)
                      return (
                        <button
                          key={inj.id}
                          onClick={() => setSelectedForRecovery(inj)}
                          className={`rounded-full px-3 py-1.5 text-sm border transition-all ${
                            selectedForRecovery?.id === inj.id
                              ? 'bg-primary text-white border-primary'
                              : 'border-border bg-surface text-text-primary hover:border-primary'
                          }`}
                        >
                          {region?.name ?? inj.body_region}
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {selectedForRecovery ? (() => {
              const region = BODY_REGIONS.find((r) => r.id === selectedForRecovery.body_region)
              const protocol = region
                ? getProtocol(region, selectedForRecovery.intensity, selectedForRecovery.onset_type as OnsetType)
                : PROTOCOLS.general
              const needsMD = requiresMedicalAttention(fakeLog(selectedForRecovery))

              return (
                <div className="space-y-4">
                  {needsMD && (
                    <div className="flex items-start gap-2 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 p-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-red-700 dark:text-red-400">Seek medical attention</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">High intensity or possible nerve involvement — see a healthcare professional before starting self-management.</p>
                      </div>
                    </div>
                  )}

                  {/* Protocol header */}
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">{protocol.phase} phase</p>
                    <h2 className="text-lg font-bold text-text-primary">{protocol.name}</h2>
                    <p className="text-sm text-text-secondary mt-1">Return to sport estimate: <span className="font-medium text-text-primary">{protocol.return_to_sport_days}</span></p>
                  </div>

                  {/* PEACE & LOVE steps */}
                  <div>
                    <p className="text-sm font-semibold text-text-primary mb-2">Protocol Steps</p>
                    <div className="space-y-2">
                      {protocol.steps.map((step, i) => (
                        <div key={i} className="rounded-2xl border border-border bg-surface p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-text-primary text-sm">{step.label}</p>
                            <span className="text-xs text-text-secondary bg-border/40 rounded-full px-2 py-0.5">{step.duration}</span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">{step.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exercises */}
                  <div>
                    <p className="text-sm font-semibold text-text-primary mb-2">Recommended Exercises</p>
                    <div className="space-y-2">
                      {protocol.exercises.map((ex, i) => (
                        <div key={i} className="rounded-2xl border border-border bg-surface p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-text-primary text-sm">{ex.name}</p>
                            <span className="text-xs text-primary font-medium">{ex.sets_reps}</span>
                          </div>
                          <p className="text-xs text-text-secondary">{ex.cue}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warning signs */}
                  <div className="rounded-2xl border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-4">
                    <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Warning Signs — See a Doctor
                    </p>
                    <ul className="space-y-1">
                      {protocol.warning_signs.map((w, i) => (
                        <li key={i} className="text-xs text-orange-600 dark:text-orange-400 flex items-start gap-1.5">
                          <span className="mt-0.5">•</span>{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })() : (
              <div className="text-center py-16">
                <RefreshCw className="w-10 h-10 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary text-sm">Select an active injury to see its recovery protocol.</p>
                {activeInjuries.filter((i) => i.recovery_status !== 'resolved').length === 0 && (
                  <p className="text-text-secondary text-xs mt-2">No active injuries — log one on the Body Map tab.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

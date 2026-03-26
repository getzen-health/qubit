'use client'
import { useState, useEffect } from 'react'

// Body regions with emoji and anatomical grouping
const BODY_REGIONS = [
  // Head/Neck
  { id: 'head', label: 'Head', emoji: '🧠', group: 'Upper' },
  { id: 'neck', label: 'Neck', emoji: '↕️', group: 'Upper' },
  // Torso
  { id: 'upper_back', label: 'Upper Back', emoji: '🔝', group: 'Torso' },
  { id: 'lower_back', label: 'Lower Back', emoji: '⬇️', group: 'Torso' },
  { id: 'chest', label: 'Chest', emoji: '🫁', group: 'Torso' },
  { id: 'abdomen', label: 'Abdomen', emoji: '🫄', group: 'Torso' },
  // Arms
  { id: 'shoulder_left', label: 'L Shoulder', emoji: '🫸', group: 'Arms' },
  { id: 'shoulder_right', label: 'R Shoulder', emoji: '🫷', group: 'Arms' },
  { id: 'elbow', label: 'Elbow', emoji: '💪', group: 'Arms' },
  { id: 'wrist', label: 'Wrist', emoji: '✋', group: 'Arms' },
  // Legs
  { id: 'hip', label: 'Hip', emoji: '🦴', group: 'Legs' },
  { id: 'quad', label: 'Quad/Thigh', emoji: '🦵', group: 'Legs' },
  { id: 'hamstring', label: 'Hamstring', emoji: '🏃', group: 'Legs' },
  { id: 'knee_left', label: 'L Knee', emoji: '🦿', group: 'Legs' },
  { id: 'knee_right', label: 'R Knee', emoji: '🦿', group: 'Legs' },
  { id: 'calf', label: 'Calf', emoji: '🦵', group: 'Legs' },
  { id: 'ankle', label: 'Ankle', emoji: '🦶', group: 'Legs' },
  { id: 'foot', label: 'Foot', emoji: '👟', group: 'Legs' },
]

const PAIN_TYPES = ['sharp', 'aching', 'burning', 'stiffness', 'throbbing', 'other']
const PAIN_COLORS = ['bg-green-100', 'bg-green-200', 'bg-yellow-100', 'bg-yellow-200', 'bg-orange-100', 'bg-orange-200', 'bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-400', 'bg-red-500']

export default function InjuriesPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [painLevel, setPainLevel] = useState(3)
  const [painType, setPainType] = useState('aching')
  const [notes, setNotes] = useState('')
  const [activityModified, setActivityModified] = useState(false)
  const [relatedToWorkout, setRelatedToWorkout] = useState(false)
  const [regionSummary, setRegionSummary] = useState<any[]>([])
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/injuries').then(r => r.json()).then(d => {
      setRegionSummary(d.regionSummary ?? [])
      setRecentLogs(d.logs ?? [])
    })
  }, [])

  const getRegionStatus = (regionId: string) => regionSummary.find(r => r.region === regionId)

  const save = async () => {
    if (!selected) return
    setSaving(true)
    await fetch('/api/injuries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body_region: selected, pain_level: painLevel, pain_type: painType, notes, activity_modified: activityModified, related_to_workout: relatedToWorkout }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // Refresh
    const d = await fetch('/api/injuries').then(r => r.json())
    setRegionSummary(d.regionSummary ?? [])
    setRecentLogs(d.logs ?? [])
    setSelected(null)
    setPainLevel(3)
    setNotes('')
    setSaving(false)
  }

  const trafficLight = (level: number) => level <= 3 ? '🟢' : level <= 6 ? '🟡' : '🔴'
  const trafficAdvice = (level: number) => level <= 3 ? 'Train normally' : level <= 6 ? 'Modify training' : 'Rest & recover'

  const groups = [...new Set(BODY_REGIONS.map(r => r.group))]

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Injury & Pain Tracker</h1>
        <p className="text-sm text-text-secondary mb-6">Log pain to track recovery and prevent re-injury</p>

        {/* Active issues */}
        {regionSummary.filter(r => r.status !== 'green').length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
            <h3 className="font-semibold text-orange-800 mb-2">⚠️ Active Issues</h3>
            <div className="space-y-1">
              {regionSummary.filter(r => r.status !== 'green').map(r => (
                <div key={r.region} className="flex justify-between items-center text-sm">
                  <span className="text-orange-700">{BODY_REGIONS.find(b => b.id === r.region)?.emoji} {r.region.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600">{trafficLight(r.latestLevel)} Level {r.latestLevel}/10</span>
                    <span className="text-xs text-orange-500">{r.daysSince}d ago</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body region grid */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h3 className="font-semibold text-text-primary mb-3">Select Body Region</h3>
          {groups.map(group => (
            <div key={group} className="mb-3">
              <div className="text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">{group}</div>
              <div className="flex flex-wrap gap-2">
                {BODY_REGIONS.filter(r => r.group === group).map(region => {
                  const status = getRegionStatus(region.id)
                  const isSelected = selected === region.id
                  return (
                    <button
                      key={region.id}
                      onClick={() => setSelected(region.id)}
                      className={`px-3 py-1.5 rounded-xl border text-sm transition-all ${
                        isSelected ? 'border-primary bg-primary/10 font-medium text-primary' :
                        status?.status === 'red' ? 'border-red-300 bg-red-50 text-red-700' :
                        status?.status === 'yellow' ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                        'border-border text-text-secondary hover:border-primary'
                      }`}
                    >
                      {region.emoji} {region.label}
                      {status && <span className="ml-1 text-xs">{trafficLight(status.latestLevel)}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Pain log form */}
        {selected && (
          <div className="bg-white rounded-2xl border border-border p-4 mb-4">
            <h3 className="font-semibold text-text-primary mb-3">
              Log: {BODY_REGIONS.find(r => r.id === selected)?.emoji} {selected.replace(/_/g, ' ')}
            </h3>

            {/* Pain scale */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-text-secondary">Pain Level: {painLevel}/10</label>
                <span className="text-sm">{trafficLight(painLevel)} {trafficAdvice(painLevel)}</span>
              </div>
              <input type="range" min={0} max={10} value={painLevel} onChange={e => setPainLevel(parseInt(e.target.value))}
                className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>0 None</span><span>5 Moderate</span><span>10 Severe</span>
              </div>
            </div>

            {/* Pain type */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary block mb-2">Pain type</label>
              <div className="flex flex-wrap gap-2">
                {PAIN_TYPES.map(t => (
                  <button key={t} onClick={() => setPainType(t)}
                    className={`px-3 py-1 rounded-full text-xs border capitalize transition-all ${painType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input type="checkbox" checked={relatedToWorkout} onChange={e => setRelatedToWorkout(e.target.checked)} className="rounded" />
                After workout
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input type="checkbox" checked={activityModified} onChange={e => setActivityModified(e.target.checked)} className="rounded" />
                Modified activity
              </label>
            </div>

            <input type="text" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-surface mb-3" />

            <button onClick={save} disabled={saving}
              className="w-full bg-primary text-white py-2.5 rounded-xl font-semibold disabled:opacity-50">
              {saving ? 'Saving...' : saved ? '✓ Logged' : 'Log Pain Entry'}
            </button>
          </div>
        )}

        {/* Recovery tracker */}
        {regionSummary.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-4 mb-4">
            <h3 className="font-semibold text-text-primary mb-3">Recovery Status</h3>
            <div className="space-y-2">
              {regionSummary.map(r => (
                <div key={r.region} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm font-medium text-text-primary capitalize">{r.region.replace(/_/g, ' ')}</span>
                    <div className="text-xs text-text-secondary">Last logged {r.daysSince === 0 ? 'today' : `${r.daysSince} days ago`}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{trafficLight(r.latestLevel)} {r.latestLevel}/10</div>
                    <div className="text-xs text-text-secondary">{trafficAdvice(r.latestLevel)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent entries */}
        {recentLogs.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-4">
            <h3 className="font-semibold text-text-primary mb-3">Recent Entries</h3>
            <div className="space-y-2">
              {recentLogs.slice(0, 8).map((log: any) => (
                <div key={log.id} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
                  <div>
                    <span className="font-medium text-text-primary capitalize">{log.body_region.replace(/_/g, ' ')}</span>
                    <span className="text-text-secondary"> · {log.pain_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{trafficLight(log.pain_level)} {log.pain_level}/10</span>
                    <span className="text-xs text-text-secondary">{new Date(log.logged_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-text-secondary text-center mt-4">
          Pain scale based on IASP NRS guidelines. Not a substitute for medical advice.
        </p>
      </div>
    </div>
  )
}

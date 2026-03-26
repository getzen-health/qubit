'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plane, Syringe, Mountain, Package, Plus, Check, Printer, Share2, ChevronDown, ChevronUp, AlertTriangle, Info, Shield } from 'lucide-react'
import {
  calculateJetLag,
  calculateAMSRisk,
  calculateDVTRisk,
  getRecommendedVaccines,
  getWaterFoodSafetyTier,
  VACCINATION_DATABASE,
  TRAVEL_HEALTH_KIT,
  DVT_RISK_FACTOR_OPTIONS,
  type KitItem,
  type DestinationType,
} from '@/lib/travel-health'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Trip {
  id: string
  destination_country: string
  destination_city?: string
  departure_date: string
  return_date?: string
  departure_timezone?: string
  arrival_timezone?: string
  max_altitude_m: number
  created_at: string
}

interface TravelVaccination {
  id: string
  vaccine_name: string
  dose_number: number
  date_given: string
  expiry_date?: string
  provider?: string
  notes?: string
}

type TabId = 'plan' | 'vaccinations' | 'altitude' | 'kit'

// ─────────────────────────────────────────────────────────────────────────────
// Helper components
// ─────────────────────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: 'low' | 'moderate' | 'high' }) {
  const styles = {
    low: 'bg-green-500/15 text-green-400 border-green-500/30',
    moderate: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    high: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[level]}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </span>
  )
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan Tab
// ─────────────────────────────────────────────────────────────────────────────

const TIMEZONE_OPTIONS = [
  'UTC-12', 'UTC-11', 'UTC-10', 'UTC-9', 'UTC-8', 'UTC-7', 'UTC-6', 'UTC-5',
  'UTC-4', 'UTC-3', 'UTC-2', 'UTC-1', 'UTC+0', 'UTC+1', 'UTC+2', 'UTC+3',
  'UTC+4', 'UTC+4:30', 'UTC+5', 'UTC+5:30', 'UTC+5:45', 'UTC+6', 'UTC+6:30',
  'UTC+7', 'UTC+8', 'UTC+9', 'UTC+9:30', 'UTC+10', 'UTC+10:30', 'UTC+11', 'UTC+12',
]

function PlanTab() {
  const [form, setForm] = useState({
    destination_country: '',
    destination_city: '',
    departure_date: '',
    return_date: '',
    departure_timezone: 'UTC+0',
    arrival_timezone: 'UTC+0',
    max_altitude_m: '0',
    flight_hours: '8',
    health_notes: '',
  })
  const [dvtFactors, setDvtFactors] = useState<string[]>([])
  const [result, setResult] = useState<ReturnType<typeof calculateJetLag> | null>(null)
  const [dvtResult, setDvtResult] = useState<ReturnType<typeof calculateDVTRisk> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandSchedule, setExpandSchedule] = useState(false)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const jetLag = calculateJetLag(
      form.departure_timezone,
      form.arrival_timezone,
      form.departure_date,
    )
    const dvt = calculateDVTRisk(Number(form.flight_hours), dvtFactors)
    setResult(jetLag)
    setDvtResult(dvt)
    setExpandSchedule(false)
  }, [form, dvtFactors])

  const handleSave = useCallback(async () => {
    if (!form.destination_country || !form.departure_date) return
    setSaving(true)
    try {
      await fetch('/api/travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'trip', ...form, max_altitude_m: Number(form.max_altitude_m) }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }, [form])

  const recommendedVaccines = form.destination_country
    ? getRecommendedVaccines(form.destination_country)
    : []

  const safetyTier = form.destination_country
    ? getWaterFoodSafetyTier(form.destination_country)
    : null

  const tierColors = ['', 'text-green-400', 'text-yellow-300', 'text-orange-400', 'text-red-400']

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Trip Details</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1 space-y-1">
            <label className="text-xs text-text-secondary">Destination Country *</label>
            <input
              required
              value={form.destination_country}
              onChange={e => setForm(f => ({ ...f, destination_country: e.target.value }))}
              placeholder="e.g. Thailand"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 space-y-1">
            <label className="text-xs text-text-secondary">City (optional)</label>
            <input
              value={form.destination_city}
              onChange={e => setForm(f => ({ ...f, destination_city: e.target.value }))}
              placeholder="e.g. Bangkok"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Departure Date *</label>
            <input
              required
              type="date"
              value={form.departure_date}
              onChange={e => setForm(f => ({ ...f, departure_date: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Return Date</label>
            <input
              type="date"
              value={form.return_date}
              onChange={e => setForm(f => ({ ...f, return_date: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Home Timezone</label>
            <select
              value={form.departure_timezone}
              onChange={e => setForm(f => ({ ...f, departure_timezone: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            >
              {TIMEZONE_OPTIONS.map(tz => <option key={tz}>{tz}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Destination Timezone</label>
            <select
              value={form.arrival_timezone}
              onChange={e => setForm(f => ({ ...f, arrival_timezone: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            >
              {TIMEZONE_OPTIONS.map(tz => <option key={tz}>{tz}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Flight Duration (hours)</label>
            <input
              type="number"
              min="0"
              max="20"
              value={form.flight_hours}
              onChange={e => setForm(f => ({ ...f, flight_hours: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Max Altitude (m)</label>
            <input
              type="number"
              min="0"
              max="8850"
              value={form.max_altitude_m}
              onChange={e => setForm(f => ({ ...f, max_altitude_m: e.target.value }))}
              placeholder="0"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* DVT Risk Factors */}
        <div className="space-y-2">
          <label className="text-xs text-text-secondary font-medium">DVT Risk Factors (select all that apply)</label>
          <div className="grid grid-cols-2 gap-1.5">
            {DVT_RISK_FACTOR_OPTIONS.map(factor => (
              <label key={factor} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dvtFactors.includes(factor)}
                  onChange={e => setDvtFactors(prev =>
                    e.target.checked ? [...prev, factor] : prev.filter(f => f !== factor)
                  )}
                  className="accent-primary w-4 h-4 rounded"
                />
                <span className="text-xs text-text-secondary">{factor}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Analyse Trip
          </button>
          {result && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-text-primary hover:border-primary/50 transition-colors"
            >
              {saved ? <Check className="w-4 h-4 text-green-400" /> : <Plus className="w-4 h-4" />}
              {saved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
      </form>

      {result && (
        <>
          {/* Jet Lag Card */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">Jet Lag Recovery</h3>
              </div>
              <RiskBadge level={result.severity === 'mild' ? 'low' : result.severity === 'moderate' ? 'moderate' : 'high'} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{result.timezonesDelta}</p>
                <p className="text-xs text-text-secondary">Timezones</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{result.daysToAdapt}</p>
                <p className="text-xs text-text-secondary">Days to Adapt</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-text-primary capitalize">{result.direction}</p>
                <p className="text-xs text-text-secondary">Direction</p>
              </div>
            </div>

            {result.timezonesDelta > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setExpandSchedule(s => !s)}
                  className="flex items-center gap-1 text-xs text-primary font-medium"
                >
                  {expandSchedule ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expandSchedule ? 'Hide' : 'Show'} day-by-day schedule
                </button>
                {expandSchedule && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1.5 pr-3 text-text-secondary font-medium">Day</th>
                          <th className="text-left py-1.5 pr-3 text-text-secondary font-medium">Sleep Window</th>
                          <th className="text-left py-1.5 pr-3 text-text-secondary font-medium">Light Therapy</th>
                          <th className="text-left py-1.5 text-text-secondary font-medium">Melatonin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.recoverySchedule.map(day => (
                          <tr key={day.day} className="border-b border-border/50">
                            <td className="py-1.5 pr-3 font-semibold text-text-primary">D{day.day}</td>
                            <td className="py-1.5 pr-3 text-text-secondary">{day.sleepWindow}</td>
                            <td className="py-1.5 pr-3 text-text-secondary">{day.lightTherapy}</td>
                            <td className="py-1.5 text-text-secondary">{day.melatonin}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DVT Risk Card */}
          {dvtResult && (
            <SectionCard title="DVT / Blood Clot Risk" icon={Shield}>
              <div className="flex items-center gap-3 mb-2">
                <RiskBadge level={dvtResult.riskLevel} />
                <span className="text-xs text-text-secondary">Risk score: {dvtResult.riskScore}</span>
              </div>
              <ul className="space-y-1">
                {dvtResult.preventionPlan.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                    <Check className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Water / Food Safety */}
          {safetyTier && (
            <SectionCard title="Water & Food Safety" icon={Info}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-bold ${tierColors[safetyTier.tier]}`}>
                  Tier {safetyTier.tier} — {safetyTier.label}
                </span>
                {!safetyTier.tapWaterSafe && (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <AlertTriangle className="w-3 h-3" /> Tap water unsafe
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mb-2">{safetyTier.description}</p>
              <ul className="space-y-1">
                {safetyTier.guidance.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                    <Check className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Recommended Vaccines */}
          {recommendedVaccines.length > 0 && (
            <SectionCard title={`Recommended Vaccines for ${form.destination_country}`} icon={Syringe}>
              <div className="space-y-2">
                {recommendedVaccines.map(v => (
                  <div key={v.id} className="border border-border/50 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary">{v.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${v.routineVsTravel === 'routine' ? 'bg-blue-500/15 text-blue-400' : 'bg-orange-500/15 text-orange-400'}`}>
                        {v.routineVsTravel}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{v.targetDiseases.join(', ')}</p>
                    <p className="text-xs text-text-secondary">{v.notes}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Vaccinations Tab
// ─────────────────────────────────────────────────────────────────────────────

function VaccinationsTab() {
  const [records, setRecords] = useState<TravelVaccination[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    vaccine_name: '',
    dose_number: '1',
    date_given: '',
    expiry_date: '',
    provider: '',
    lot_number: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/travel')
    if (res.ok) {
      const d = await res.json()
      setRecords(d.vaccinations ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/travel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'vaccination', ...form, dose_number: Number(form.dose_number) }),
    })
    if (res.ok) {
      await load()
      setShowForm(false)
      setForm({ vaccine_name: '', dose_number: '1', date_given: '', expiry_date: '', provider: '', lot_number: '', notes: '' })
    }
    setSaving(false)
  }

  // Calculate upcoming boosters (vaccines with expiry_date in next 6 months)
  const now = new Date()
  const sixMonths = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
  const upcoming = records.filter(r => {
    if (!r.expiry_date) return false
    const exp = new Date(r.expiry_date)
    return exp >= now && exp <= sixMonths
  })

  return (
    <div className="space-y-4">
      {upcoming.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-yellow-400">Upcoming Boosters</h3>
          </div>
          {upcoming.map(r => (
            <div key={r.id} className="flex items-center justify-between text-xs">
              <span className="text-text-primary font-medium">{r.vaccine_name} (Dose {r.dose_number})</span>
              <span className="text-yellow-400">Expires {r.expiry_date}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Vaccination Records</h2>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Record
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">New Vaccination Record</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-text-secondary">Vaccine Name *</label>
              <select
                required
                value={form.vaccine_name}
                onChange={e => setForm(f => ({ ...f, vaccine_name: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="">Select vaccine…</option>
                {VACCINATION_DATABASE.map(v => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
                <option value="Other">Other</option>
              </select>
              {form.vaccine_name === 'Other' && (
                <input
                  placeholder="Vaccine name"
                  onChange={e => setForm(f => ({ ...f, vaccine_name: e.target.value }))}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Dose Number</label>
              <input
                type="number" min="1" max="6"
                value={form.dose_number}
                onChange={e => setForm(f => ({ ...f, dose_number: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Date Given *</label>
              <input
                required type="date"
                value={form.date_given}
                onChange={e => setForm(f => ({ ...f, date_given: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Expiry Date</label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Provider / Clinic</label>
              <input
                value={form.provider}
                onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                placeholder="e.g. City Travel Clinic"
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs text-text-secondary">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Record'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-text-secondary text-sm">Loading…</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 bg-surface border border-border rounded-2xl">
          <Syringe className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No vaccination records yet.</p>
          <p className="text-text-secondary text-xs mt-1">Add your first vaccination record above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Vaccine', 'Dose', 'Date Given', 'Expires', 'Provider'].map(h => (
                  <th key={h} className="text-left py-2 pr-3 text-text-secondary font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const expired = r.expiry_date && new Date(r.expiry_date) < now
                return (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-surface-secondary/50">
                    <td className="py-2.5 pr-3 font-medium text-text-primary">{r.vaccine_name}</td>
                    <td className="py-2.5 pr-3 text-text-secondary">{r.dose_number}</td>
                    <td className="py-2.5 pr-3 text-text-secondary">{r.date_given}</td>
                    <td className={`py-2.5 pr-3 ${expired ? 'text-red-400' : 'text-text-secondary'}`}>
                      {r.expiry_date ?? '—'}{expired ? ' ⚠️' : ''}
                    </td>
                    <td className="py-2.5 text-text-secondary">{r.provider ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Altitude Tab
// ─────────────────────────────────────────────────────────────────────────────

const LAKE_LOUISE_CRITERIA = [
  { score: '0–3', level: 'None', description: 'No AMS. Safe to ascend.' },
  { score: '4–5', level: 'Mild AMS', description: 'Rest at current altitude. Descend if no improvement in 24h.' },
  { score: '6–9', level: 'Moderate AMS', description: 'Descend 300–500m. Do not ascend.' },
  { score: '10–12', level: 'Severe AMS', description: 'Immediate descent. Emergency medical attention required.' },
]

function AltitudeTab() {
  const [form, setForm] = useState({ altitude: '3500', ascentRate: '500', accliDays: '1' })
  const [result, setResult] = useState<ReturnType<typeof calculateAMSRisk> | null>(null)

  const handleCalc = (e: React.FormEvent) => {
    e.preventDefault()
    setResult(calculateAMSRisk(Number(form.altitude), Number(form.ascentRate), Number(form.accliDays)))
  }

  const riskColors = {
    low: 'text-green-400 bg-green-500/15 border-green-500/30',
    moderate: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
    high: 'text-red-400 bg-red-500/15 border-red-500/30',
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCalc} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">AMS Risk Calculator</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Max Altitude (m)</label>
            <input
              type="number" min="0" max="8850" required
              value={form.altitude}
              onChange={e => setForm(f => ({ ...f, altitude: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Ascent Rate (m/day)</label>
            <input
              type="number" min="50" max="2000" required
              value={form.ascentRate}
              onChange={e => setForm(f => ({ ...f, ascentRate: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Extra Accli. Days</label>
            <input
              type="number" min="0" max="10"
              value={form.accliDays}
              onChange={e => setForm(f => ({ ...f, accliDays: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Calculate AMS Risk
        </button>
      </form>

      {result && (
        <>
          {/* Risk gauge */}
          <div className={`border rounded-2xl p-4 ${riskColors[result.lakeLouiseRisk]}`}>
            <div className="flex items-center gap-3">
              <Mountain className="w-6 h-6" />
              <div>
                <p className="text-base font-bold capitalize">{result.lakeLouiseRisk} AMS Risk</p>
                <p className="text-sm">{result.riskLabel}</p>
              </div>
            </div>
          </div>

          {/* Prevention list */}
          <SectionCard title="Prevention Strategies" icon={Shield}>
            <ul className="space-y-1.5">
              {result.prevention.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <Check className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Acclimatisation schedule */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Acclimatisation Schedule</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 pr-3 text-text-secondary font-medium">Day</th>
                    <th className="text-left py-1.5 pr-3 text-text-secondary font-medium">Day Altitude</th>
                    <th className="text-left py-1.5 pr-3 text-text-secondary font-medium">Sleep Altitude</th>
                    <th className="text-left py-1.5 text-text-secondary font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map(day => (
                    <tr key={day.day} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-semibold text-text-primary">D{day.day}</td>
                      <td className="py-2 pr-3 text-text-secondary">{day.altitude}m</td>
                      <td className="py-2 pr-3 text-primary font-medium">{day.sleepAltitude}m</td>
                      <td className="py-2 text-text-secondary">{day.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lake Louise reference */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Lake Louise Score Reference (0–12)</h3>
            <p className="text-xs text-text-secondary">Assess symptoms: headache, GI upset, fatigue/weakness, dizziness, difficulty sleeping. Max 3 pts each.</p>
            <div className="space-y-2">
              {LAKE_LOUISE_CRITERIA.map(c => (
                <div key={c.score} className="flex items-start gap-3 text-xs">
                  <span className="font-bold text-primary w-12 shrink-0">{c.score}</span>
                  <span className="font-semibold text-text-primary w-28 shrink-0">{c.level}</span>
                  <span className="text-text-secondary">{c.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety rules card */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-red-400">Critical Safety Rules</h3>
            </div>
            <ul className="space-y-1">
              {[
                'Never ascend with AMS symptoms — rest or descend.',
                'Descend immediately for: ataxia (HACE) or breathlessness at rest (HAPE).',
                'SpO₂ below 85% at rest = descend immediately.',
                'Alcohol worsens dehydration and impairs acclimatisation.',
                'Do NOT take sleeping pills at altitude (suppress breathing).',
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-red-300">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Kit Tab
// ─────────────────────────────────────────────────────────────────────────────

const DEST_TYPES: { id: DestinationType; label: string; emoji: string }[] = [
  { id: 'tropical', label: 'Tropical', emoji: '🌴' },
  { id: 'cold', label: 'Cold', emoji: '❄️' },
  { id: 'altitude', label: 'Altitude', emoji: '⛰️' },
  { id: 'urban', label: 'Urban', emoji: '🏙️' },
]

function KitTab() {
  const [destType, setDestType] = useState<DestinationType>('tropical')
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const items = TRAVEL_HEALTH_KIT.filter(item => item.destinations.includes(destType))
  const categories = Array.from(new Set(items.map(i => i.category)))

  const toggle = (id: string) =>
    setChecked(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const handlePrint = () => {
    const lines = items.map(i => `[${checked.has(i.id) ? 'x' : ' '}] ${i.name}${i.notes ? ` — ${i.notes}` : ''}`).join('\n')
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(`<pre style="font-family:monospace;font-size:12px;padding:20px">KQuarks Travel Kit — ${destType.toUpperCase()}\n${'─'.repeat(50)}\n${lines}</pre>`)
      win.print()
    }
  }

  const checkedCount = items.filter(i => checked.has(i.id)).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-4 gap-2 flex-1">
          {DEST_TYPES.map(d => (
            <button
              key={d.id}
              onClick={() => setDestType(d.id)}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-2xl border transition-all text-xs font-medium ${
                destType === d.id
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-surface border-border text-text-secondary hover:border-primary/50'
              }`}
            >
              <span className="text-lg">{d.emoji}</span>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">{checkedCount} / {items.length} packed</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChecked(new Set(items.map(i => i.id)))}
            className="text-xs text-primary font-medium hover:underline"
          >
            Check all
          </button>
          <span className="text-border">|</span>
          <button
            onClick={() => setChecked(new Set())}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            Clear
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={() => {
              const text = items.map(i => `• ${i.name}`).join('\n')
              navigator.share?.({ title: 'Travel Health Kit', text }).catch(() => navigator.clipboard.writeText(text))
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${items.length ? (checkedCount / items.length) * 100 : 0}%` }}
        />
      </div>

      {categories.map(category => {
        const catItems = items.filter(i => i.category === category)
        return (
          <div key={category} className="bg-surface border border-border rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{category}</h3>
            {catItems.map((item: KitItem) => (
              <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                  checked.has(item.id) ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/50'
                }`} onClick={() => toggle(item.id)}>
                  {checked.has(item.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium transition-colors ${checked.has(item.id) ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                    {item.name}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-text-secondary mt-0.5">{item.notes}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main client component
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'plan', label: 'Plan', icon: Plane },
  { id: 'vaccinations', label: 'Vaccines', icon: Syringe },
  { id: 'altitude', label: 'Altitude', icon: Mountain },
  { id: 'kit', label: 'Kit', icon: Package },
]

export function TravelClient() {
  const [tab, setTab] = useState<TabId>('plan')

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-1">
            <Plane className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-text-primary">Travel Health</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Jet lag calculator, vaccinations, altitude AMS screening & travel kit.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-surface border border-border rounded-2xl p-1 mb-5">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                  active ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {tab === 'plan' && <PlanTab />}
        {tab === 'vaccinations' && <VaccinationsTab />}
        {tab === 'altitude' && <AltitudeTab />}
        {tab === 'kit' && <KitTab />}
      </div>
    </div>
  )
}

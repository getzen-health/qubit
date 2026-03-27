"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { estimateVitaminD, getSeasonFromMonth, getUVIRisk, SKIN_TYPES, BODY_EXPOSURE, SkinType } from '@/lib/vitamin-d'

const SPF_OPTIONS = [0, 8, 15, 30, 50]
const BODY_EXPOSURE_OPTIONS = [
  { key: 'face_only', label: 'Face only' },
  { key: 'face_arms', label: 'Face + Arms' },
  { key: 'arms_legs', label: 'Arms + Legs' },
  { key: 'arms_legs_torso', label: 'Arms + Legs + Torso' },
  { key: 'swimsuit', label: 'Swimsuit' },
]
const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60]

function getLatitudeRisk(lat: number): 'low' | 'medium' | 'high' {
  if (Math.abs(lat) > 50) return 'high'
  if (Math.abs(lat) > 35) return 'medium'
  return 'low'
}

export default function SunExposurePage() {
  // UV Index state
  const [uvIndex, setUvIndex] = useState<number | null>(null)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [uviLoading, setUviLoading] = useState(false)

  // Profile state (localStorage)
  const [skinType, setSkinType] = useState<SkinType>(3)
  const [defaultSpf, setDefaultSpf] = useState<number>(0)

  // Log form state
  const [duration, setDuration] = useState<number>(15)
  const [bodyExposure, setBodyExposure] = useState<string>('face_arms')
  const [spf, setSpf] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [logLoading, setLogLoading] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)

  // Logs and summary
  const [logs, setLogs] = useState<any[]>([])
  const [totalIU, setTotalIU] = useState<number>(0)
  const [refreshLogs, setRefreshLogs] = useState(0)

  // Supplement recommendation
  const [showSupplement, setShowSupplement] = useState(false)

  // Load profile from localStorage
  useEffect(() => {
    const st = localStorage.getItem('sun_skin_type')
    const spf = localStorage.getItem('sun_default_spf')
    if (st) setSkinType(Number(st) as SkinType)
    if (spf) setDefaultSpf(Number(spf))
  }, [])

  // Save profile to localStorage
  useEffect(() => {
    localStorage.setItem('sun_skin_type', String(skinType))
    localStorage.setItem('sun_default_spf', String(defaultSpf))
  }, [skinType, defaultSpf])

  // Set SPF override to default
  useEffect(() => {
    setSpf(defaultSpf)
  }, [defaultSpf])

  // Fetch logs
  useEffect(() => {
    fetch('/api/sun-exposure')
      .then(r => r.json())
      .then(d => {
        setLogs(d.logs || [])
        setTotalIU(d.totalIU || 0)
        // Supplement recommendation: <400 IU/day avg
        const days = d.logs?.length || 1
        setShowSupplement((d.totalIU || 0) / days < 400)
      })
  }, [refreshLogs])

  // Get UVI from location
  const fetchUVI = (lat: number, lon: number) => {
    setUviLoading(true)
    fetch(`/api/sun-exposure/uv-index?lat=${lat}&lon=${lon}`)
      .then(r => r.json())
      .then(d => setUvIndex(d.uvi))
      .finally(() => setUviLoading(false))
  }

  // Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) return
    setUviLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        fetchUVI(pos.coords.latitude, pos.coords.longitude)
      },
      () => setUviLoading(false)
    )
  }

  // Estimate IU
  const now = new Date()
  const season = getSeasonFromMonth(now.getMonth() + 1)
  const latitude = location?.lat ?? 40.7128
  const longitude = location?.lon ?? -74.0060
  const latitudeRisk = getLatitudeRisk(latitude)
  const estimatedIU = uvIndex
    ? estimateVitaminD({
        durationMin: duration,
        uvIndex,
        skinType,
        bodyExposure,
        spf,
        season,
        latitudeRisk,
      })
    : 0

  // Log exposure
  const handleLog = async () => {
    setLogLoading(true)
    setLogError(null)
    try {
      const res = await fetch('/api/sun-exposure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_min: duration,
          uv_index: uvIndex,
          skin_type: skinType,
          body_exposure: bodyExposure,
          spf,
          latitude,
          longitude,
          notes,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setRefreshLogs(x => x + 1)
      setNotes('')
    } catch (e: any) {
      setLogError(e.message)
    } finally {
      setLogLoading(false)
    }
  }

  // Delete log
  const handleDelete = async (id: string) => {
    await fetch('/api/sun-exposure', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setRefreshLogs(x => x + 1)
  }

  // UVI risk
  const uviRisk = getUVIRisk(uvIndex ?? 0)

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border -mx-4 px-4 py-3 mb-2 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </Link>
        <h1 className="text-xl font-bold text-text-primary">Sun Exposure</h1>
      </div>
      {/* UV Index Card */}
      <div className="bg-surface rounded-2xl p-4 border border-border flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Today's UV Index</div>
          <button
            className="bg-primary text-white px-3 py-1 rounded"
            onClick={handleGetLocation}
            disabled={uviLoading}
          >
            {uviLoading ? 'Locating...' : 'Get your location'}
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className={`text-3xl font-bold text-${uviRisk.color}`}>{uvIndex ?? '--'}</span>
          <span className={`px-2 py-1 rounded bg-${uviRisk.color}/20 text-${uviRisk.color} text-sm font-medium`}>{uviRisk.label}</span>
          <span className="text-text-secondary text-xs">{uviRisk.advice}</span>
        </div>
        <div className="text-text-secondary text-xs mt-1">
          Optimal window for Vitamin D: <b>10am–2pm</b> when UVI ≥ 3
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-surface rounded-2xl p-4 border border-border">
        <div className="font-semibold mb-2">Your Profile</div>
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <span className="text-text-secondary text-sm">Skin type:</span>
          {Object.entries(SKIN_TYPES).map(([k, v]) => (
            <button
              key={k}
              className={`px-2 py-1 rounded border ${skinType === Number(k) ? 'bg-primary text-white' : 'bg-surface border-border text-text-primary'}`}
              onClick={() => setSkinType(Number(k) as SkinType)}
            >
              <span className="mr-1">{v.emoji}</span>{v.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-text-secondary text-sm">Default SPF:</span>
          {SPF_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`px-2 py-1 rounded border ${defaultSpf === opt ? 'bg-primary text-white' : 'bg-surface border-border text-text-primary'}`}
              onClick={() => setDefaultSpf(opt)}
            >
              {opt === 0 ? 'None' : `SPF ${opt}`}
            </button>
          ))}
        </div>
      </div>

      {/* Log Exposure Section */}
      <div className="bg-surface rounded-2xl p-4 border border-border">
        <div className="font-semibold mb-2">Log Sun Exposure</div>
        <div className="flex gap-2 mb-2 flex-wrap">
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`px-2 py-1 rounded border ${duration === opt ? 'bg-primary text-white' : 'bg-surface border-border text-text-primary'}`}
              onClick={() => setDuration(opt)}
            >
              {opt} min
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-2 flex-wrap">
          {BODY_EXPOSURE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`px-2 py-1 rounded border ${bodyExposure === opt.key ? 'bg-primary text-white' : 'bg-surface border-border text-text-primary'}`}
              onClick={() => setBodyExposure(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-2 flex-wrap">
          <span className="text-text-secondary text-sm">SPF for this session:</span>
          {SPF_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`px-2 py-1 rounded border ${spf === opt ? 'bg-primary text-white' : 'bg-surface border-border text-text-primary'}`}
              onClick={() => setSpf(opt)}
            >
              {opt === 0 ? 'None' : `SPF ${opt}`}
            </button>
          ))}
        </div>
        <div className="mb-2">
          <textarea
            className="w-full border border-border rounded p-2 text-sm"
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <div className="mb-2 text-text-secondary text-sm">
          Estimated Vitamin D synthesized: <b>{estimatedIU} IU</b>
        </div>
        <button
          className="bg-primary text-white px-4 py-2 rounded mt-1"
          onClick={handleLog}
          disabled={logLoading || !uvIndex}
        >
          {logLoading ? 'Logging...' : 'Log Exposure'}
        </button>
        {logError && <div className="text-red-600 text-sm mt-1">{logError}</div>}
      </div>

      {/* Weekly Summary */}
      <div className="bg-surface rounded-2xl p-4 border border-border">
        <div className="font-semibold mb-2">Weekly Summary</div>
        <div className="mb-2">Total estimated IU this week: <b>{totalIU} IU</b></div>
        <div className="w-full bg-border rounded h-3 mb-2">
          <div
            className="bg-primary h-3 rounded"
            style={{ width: `${Math.min(100, (totalIU / (600 * 7)) * 100)}%` }}
          />
        </div>
        <div className="mb-2 text-text-secondary text-sm">
          {logs.length} days logged. RDA: 600 IU/day × 7 days = 4200 IU
        </div>
        {showSupplement && (
          <div className="text-orange-600 text-sm mb-2">
            Your average is below 400 IU/day. Consider a Vitamin D supplement.
          </div>
        )}
        <div className="mt-2">
          <div className="font-semibold text-sm mb-1">Recent Logs</div>
          <ul className="divide-y divide-border">
            {logs.map(log => (
              <li key={log.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="text-sm">
                    {log.duration_min} min, {BODY_EXPOSURE_OPTIONS.find(o => o.key === log.body_exposure)?.label || log.body_exposure}, SPF {log.spf}, {SKIN_TYPES[log.skin_type as keyof typeof SKIN_TYPES]?.label}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {log.estimated_iu} IU, {new Date(log.logged_at).toLocaleString()}
                  </div>
                  {log.notes && <div className="text-xs text-text-secondary italic">{log.notes}</div>}
                </div>
                <button
                  className="text-red-600 text-xs px-2 py-1 rounded border border-red-200"
                  onClick={() => handleDelete(log.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

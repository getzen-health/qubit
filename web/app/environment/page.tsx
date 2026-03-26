'use client'

import { useEffect, useRef, useState } from 'react'
import { getAQILevel, getIndoorAirScore, AQILevel } from '@/lib/air-quality'

function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => setError(err.message)
    )
  }
  return { coords, error, getLocation }
}

export default function EnvironmentPage() {
  const [outdoor, setOutdoor] = useState<{ aqi: number | null; pm25: number | null; pm10: number | null } | null>(null)
  const [indoorLogs, setIndoorLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const { coords, error, getLocation } = useGeolocation()

  // Indoor log form state
  const [co2, setCo2] = useState('')
  const [humidity, setHumidity] = useState('')
  const [temp, setTemp] = useState('')
  const [voc, setVoc] = useState<'low' | 'medium' | 'high' | ''>('')
  const [logError, setLogError] = useState<string | null>(null)
  const [logSuccess, setLogSuccess] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Fetch AQI and logs
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      let url = '/api/environment'
      if (coords) url += `?lat=${coords.lat}&lon=${coords.lon}`
      const res = await fetch(url)
      const data = await res.json()
      setOutdoor({ aqi: data.outdoorAQI, pm25: data.pm25, pm10: data.pm10 })
      setIndoorLogs(data.indoorLogs)
      setLoading(false)
    }
    fetchData()
  }, [coords])

  // Indoor air score
  const indoorScore = getIndoorAirScore({
    co2Ppm: co2 ? parseInt(co2) : undefined,
    humidityPct: humidity ? parseFloat(humidity) : undefined,
    tempC: temp ? parseFloat(temp) : undefined,
    vocLevel: voc || undefined,
  })

  // Submit indoor log
  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    setLogError(null)
    setLogSuccess(null)
    const body: any = {
      co2_ppm: co2 ? parseInt(co2) : null,
      humidity_pct: humidity ? parseFloat(humidity) : null,
      temperature_c: temp ? parseFloat(temp) : null,
      voc_level: voc || null,
      location: 'indoor',
      logged_at: new Date().toISOString(),
    }
    const res = await fetch('/api/environment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      setLogError('Failed to log. Try again.')
      return
    }
    setLogSuccess('Logged!')
    setCo2(''); setHumidity(''); setTemp(''); setVoc('')
    formRef.current?.reset()
    // Refresh logs
    const logsRes = await fetch('/api/environment')
    const logsData = await logsRes.json()
    setIndoorLogs(logsData.indoorLogs)
  }

  // AQI badge
  function AQIBadge({ aqi }: { aqi: number | null }) {
    if (aqi == null) return <span className="text-text-secondary">No data</span>
    const level: AQILevel = getAQILevel(aqi)
    return (
      <div className="flex flex-col items-center p-4 rounded-2xl" style={{ background: level.bgColor }}>
        <span className="text-4xl" style={{ color: level.color }}>{level.emoji}</span>
        <span className="text-3xl font-bold" style={{ color: level.color }}>{aqi}</span>
        <span className="text-lg font-semibold" style={{ color: level.color }}>{level.label}</span>
        <span className="text-text-secondary text-sm mt-1">{level.description}</span>
      </div>
    )
  }

  // Indoor air score badge
  function IndoorScoreBadge() {
    return (
      <div className="flex flex-col items-center p-4 rounded-2xl bg-surface border border-border">
        <span className="text-3xl font-bold text-primary">{indoorScore.score}</span>
        <span className="text-text-secondary text-sm">Indoor Air Score</span>
        {indoorScore.issues.length > 0 && (
          <ul className="mt-2 text-red-500 text-xs">
            {indoorScore.issues.map((i, idx) => <li key={idx}>⚠️ {i}</li>)}
          </ul>
        )}
        {indoorScore.tips.length > 0 && (
          <ul className="mt-2 text-text-secondary text-xs">
            {indoorScore.tips.map((t, idx) => <li key={idx}>💡 {t}</li>)}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-2">Environment & Air Quality</h1>
      {/* Outdoor AQI Section */}
      <section className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Outdoor Air Quality</h2>
          <button className="bg-primary text-white px-3 py-1 rounded-2xl text-sm" onClick={getLocation}>Get My Location</button>
        </div>
        {error && <div className="text-red-500 text-xs">{error}</div>}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <AQIBadge aqi={outdoor?.aqi ?? null} />
          <div className="flex flex-col gap-1">
            <span className="text-text-secondary text-sm">PM2.5: <span className="font-semibold text-text-primary">{outdoor?.pm25 ?? '--'} μg/m³</span></span>
            <span className="text-text-secondary text-sm">PM10: <span className="font-semibold text-text-primary">{outdoor?.pm10 ?? '--'} μg/m³</span></span>
            <span className="text-text-secondary text-xs">WHO 2021: PM2.5 &lt;5 μg/m³ annual, &lt;15 μg/m³ 24h</span>
            {outdoor?.aqi != null && (
              <span className="text-text-secondary text-xs mt-2">{getAQILevel(outdoor.aqi).exerciseAdvice}</span>
            )}
          </div>
        </div>
      </section>

      {/* Indoor AQI Section */}
      <section className="bg-surface border border-border rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-2">Indoor Air Quality</h2>
        <form ref={formRef} className="flex flex-col gap-2 md:flex-row md:items-end" onSubmit={handleLog}>
          <div>
            <label className="block text-xs text-text-secondary">CO₂ (ppm)</label>
            <input type="number" min="0" className="border border-border rounded-2xl px-2 py-1 w-24" value={co2} onChange={e => setCo2(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-text-secondary">Humidity (%)</label>
            <input type="number" min="0" max="100" className="border border-border rounded-2xl px-2 py-1 w-20" value={humidity} onChange={e => setHumidity(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-text-secondary">Temp (°C)</label>
            <input type="number" className="border border-border rounded-2xl px-2 py-1 w-20" value={temp} onChange={e => setTemp(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-text-secondary">VOC</label>
            <select className="border border-border rounded-2xl px-2 py-1 w-24" value={voc} onChange={e => setVoc(e.target.value as any)}>
              <option value="">--</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button type="submit" className="bg-primary text-white px-3 py-1 rounded-2xl text-sm">Log</button>
        </form>
        {logError && <div className="text-red-500 text-xs mt-1">{logError}</div>}
        {logSuccess && <div className="text-green-600 text-xs mt-1">{logSuccess}</div>}
        <div className="mt-4">
          <IndoorScoreBadge />
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-1">Last 7 Days Logs</h3>
          <ul className="divide-y divide-border">
            {indoorLogs.length === 0 && <li className="text-text-secondary text-xs">No logs yet.</li>}
            {indoorLogs.map((log, idx) => (
              <li key={log.id || idx} className="py-2 flex flex-col md:flex-row md:items-center md:gap-4">
                <span className="text-xs text-text-secondary">{new Date(log.logged_at).toLocaleString()}</span>
                <span className="text-xs">CO₂: <span className="font-semibold">{log.co2_ppm ?? '--'} ppm</span></span>
                <span className="text-xs">Humidity: <span className="font-semibold">{log.humidity_pct ?? '--'}%</span></span>
                <span className="text-xs">Temp: <span className="font-semibold">{log.temperature_c ?? '--'}°C</span></span>
                <span className="text-xs">VOC: <span className="font-semibold">{log.voc_level ?? '--'}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Health Impact Section */}
      <section className="bg-surface border border-border rounded-2xl p-4">
        <h2 className="text-xl font-semibold mb-2">Health Impact & Tips</h2>
        <ul className="list-disc pl-5 text-text-secondary text-sm space-y-1">
          <li>When AQI is high (&gt;150), avoid outdoor exercise. Use indoor workouts instead.</li>
          <li>CO₂ above 1000 ppm impairs focus and memory. Ventilate regularly.</li>
          <li>Keep humidity between 40-60% for optimal respiratory health.</li>
          <li>Use a HEPA air purifier if AQI is poor or you live near traffic.</li>
          <li>Open windows when outdoor AQI is good (&lt;50) to refresh indoor air.</li>
          <li>Plants like snake plant, pothos, and peace lily can help improve indoor air.</li>
        </ul>
      </section>
    </div>
  )
}

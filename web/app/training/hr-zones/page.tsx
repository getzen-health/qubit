'use client'
import { useState } from 'react'
import { calculateZones } from '@/lib/hr-zones'
import { Heart } from 'lucide-react'

export default function HRZonesPage() {
  const [age, setAge] = useState(30)
  const [restingHR, setRestingHR] = useState(60)
  const zones = calculateZones(age, restingHR)
  const maxHR = 220 - age

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-6 h-6 text-red-500" />
        <h1 className="text-2xl font-bold text-text-primary">HR Zone Training</h1>
      </div>
      
      <div className="bg-surface rounded-2xl border border-border p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Your Age</label>
            <input type="number" min={10} max={100} value={age} onChange={e => setAge(Number(e.target.value))}
              className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-text-primary" />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Resting HR (bpm)</label>
            <input type="number" min={40} max={100} value={restingHR} onChange={e => setRestingHR(Number(e.target.value))}
              className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-text-primary" />
          </div>
        </div>
        <p className="text-center text-sm text-text-secondary mt-3">Max HR: <span className="font-bold text-text-primary">{maxHR} bpm</span></p>
      </div>

      <div className="space-y-3">
        {zones.map(zone => (
          <div key={zone.zone} className="bg-surface rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">Zone {zone.zone}: {zone.name}</span>
                  <span className="text-sm font-mono text-text-secondary">{zone.minBPM}–{zone.maxBPM} bpm</span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{zone.benefit}</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary pl-6">{zone.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

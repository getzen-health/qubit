export interface HRZone {
  zone: number
  name: string
  minPct: number
  maxPct: number
  color: string
  benefit: string
  description: string
}

export const HR_ZONES: HRZone[] = [
  { zone: 1, name: 'Recovery', minPct: 50, maxPct: 60, color: '#3b82f6', benefit: 'Active recovery, fat burning', description: 'Very light effort. Builds aerobic base and aids recovery.' },
  { zone: 2, name: 'Aerobic Base', minPct: 60, maxPct: 70, color: '#22c55e', benefit: 'Endurance, fat metabolism', description: 'Comfortable pace. Primary fat-burning zone, builds endurance.' },
  { zone: 3, name: 'Aerobic', minPct: 70, maxPct: 80, color: '#f59e0b', benefit: 'Cardio fitness, efficiency', description: 'Moderate effort. Improves cardiovascular efficiency.' },
  { zone: 4, name: 'Threshold', minPct: 80, maxPct: 90, color: '#f97316', benefit: 'Speed, lactate threshold', description: 'Hard effort. Raises lactate threshold and speed.' },
  { zone: 5, name: 'VO2 Max', minPct: 90, maxPct: 100, color: '#ef4444', benefit: 'Max performance, power', description: 'Maximum effort. Improves VO₂ max and athletic performance.' },
]

export function calculateZones(age: number, restingHR = 60) {
  const maxHR = 220 - age
  const hrReserve = maxHR - restingHR
  return HR_ZONES.map(z => ({
    ...z,
    minBPM: Math.round(restingHR + (hrReserve * z.minPct) / 100),
    maxBPM: Math.round(restingHR + (hrReserve * z.maxPct) / 100),
    maxAbsBPM: Math.round((maxHR * z.maxPct) / 100),
  }))
}

export function getZoneForHR(hr: number, age: number, restingHR = 60): HRZone | null {
  const zones = calculateZones(age, restingHR)
  return zones.find(z => hr >= z.minBPM && hr < z.maxBPM) ?? zones[zones.length - 1]
}

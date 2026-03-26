export type ThermalType = 'cold_shower' | 'ice_bath' | 'cold_plunge' | 'cryotherapy' | 'sauna_dry' | 'sauna_steam' | 'sauna_infrared' | 'hot_bath' | 'contrast'

export interface ThermalSession {
  session_type: ThermalType
  duration_seconds: number
  temperature_c?: number
  difficulty?: number
  mood_after?: number
  notes?: string
}

export interface ThermalProfile {
  label: string
  emoji: string
  category: 'cold' | 'heat' | 'contrast'
  color: string
  typicalTempRange: [number, number] // Celsius
  recommendedDuration: [number, number] // seconds
  benefits: string[]
  citation: string
  timerMode: boolean // show guided timer
}

export const THERMAL_PROFILES: Record<ThermalType, ThermalProfile> = {
  cold_shower: {
    label: 'Cold Shower',
    emoji: '🚿',
    category: 'cold',
    color: '#0ea5e9',
    typicalTempRange: [10, 20],
    recommendedDuration: [60, 180],
    benefits: ['Reduces inflammation', 'Boosts alertness', 'Activates brown fat'],
    citation: 'Bleakley et al. Cochrane 2012',
    timerMode: true,
  },
  ice_bath: {
    label: 'Ice Bath',
    emoji: '🧊',
    category: 'cold',
    color: '#38bdf8',
    typicalTempRange: [4, 15],
    recommendedDuration: [180, 600],
    benefits: ['Accelerates muscle recovery', 'Reduces DOMS 24-48h', 'Mental resilience'],
    citation: 'Bleakley et al. Cochrane 2012',
    timerMode: true,
  },
  cold_plunge: {
    label: 'Cold Plunge',
    emoji: '🏊',
    category: 'cold',
    color: '#0284c7',
    typicalTempRange: [7, 15],
    recommendedDuration: [120, 300],
    benefits: ['Recovery', 'Norepinephrine surge', 'Mood elevation'],
    citation: 'Cypess et al. NEJM 2009',
    timerMode: true,
  },
  cryotherapy: {
    label: 'Cryotherapy',
    emoji: '❄️',
    category: 'cold',
    color: '#bae6fd',
    typicalTempRange: [-110, -60],
    recommendedDuration: [120, 180],
    benefits: ['Full body cold exposure', 'Reduced inflammation', 'Pain relief'],
    citation: 'Bleakley & Davison, Br J Sports Med 2010',
    timerMode: false,
  },
  sauna_dry: {
    label: 'Dry Sauna',
    emoji: '🔥',
    category: 'heat',
    color: '#f97316',
    typicalTempRange: [80, 100],
    recommendedDuration: [900, 1800],
    benefits: ['Cardiovascular health', 'Heat shock proteins', 'Detoxification'],
    citation: 'Laukkanen et al. JAMA IM 2015',
    timerMode: true,
  },
  sauna_steam: {
    label: 'Steam Room',
    emoji: '💨',
    category: 'heat',
    color: '#fb923c',
    typicalTempRange: [40, 55],
    recommendedDuration: [600, 1200],
    benefits: ['Skin hydration', 'Respiratory benefits', 'Relaxation'],
    citation: 'Ernst et al. Eur J Phys Rehab Med 2006',
    timerMode: false,
  },
  sauna_infrared: {
    label: 'Infrared Sauna',
    emoji: '☀️',
    category: 'heat',
    color: '#ef4444',
    typicalTempRange: [45, 65],
    recommendedDuration: [1200, 2400],
    benefits: ['Deeper tissue penetration', 'Detox', 'Pain relief'],
    citation: 'Masuda et al. J Card Fail 2005',
    timerMode: false,
  },
  hot_bath: {
    label: 'Hot Bath',
    emoji: '🛁',
    category: 'heat',
    color: '#fbbf24',
    typicalTempRange: [38, 42],
    recommendedDuration: [900, 1800],
    benefits: ['Muscle relaxation', 'Sleep improvement', 'Stress reduction'],
    citation: 'Haghayegh et al. Sleep Med Rev 2019',
    timerMode: false,
  },
  contrast: {
    label: 'Contrast Therapy',
    emoji: '🔄',
    category: 'contrast',
    color: '#8b5cf6',
    typicalTempRange: [10, 40],
    recommendedDuration: [600, 1200],
    benefits: ['Best of both worlds', 'Vasodilation/vasoconstriction pump', 'Enhanced recovery'],
    citation: 'Bieuzen et al. PLoS ONE 2013',
    timerMode: false,
  },
}

// Hormetic load score (weekly)
export function calculateHormeticLoad(sessions: ThermalSession[]): number {
  return sessions.reduce((total, s) => {
    const durationScore = s.duration_seconds / 60  // per minute
    const difficultyMultiplier = s.difficulty ? 0.5 + (s.difficulty / 10) : 1
    const categoryMultiplier = s.session_type.startsWith('sauna') ? 0.8 : 1.2 // cold is harder
    return total + (durationScore * difficultyMultiplier * categoryMultiplier)
  }, 0)
}

export function hormeticLoadLabel(score: number): { label: string; color: string; emoji: string } {
  if (score === 0) return { label: 'None this week', color: 'gray', emoji: '😴' }
  if (score < 20) return { label: 'Light hormesis', color: 'blue', emoji: '🌱' }
  if (score < 50) return { label: 'Moderate stress', color: 'green', emoji: '⚡' }
  if (score < 100) return { label: 'Strong adaptation', color: 'orange', emoji: '🔥' }
  return { label: 'Elite level', color: 'red', emoji: '🏆' }
}

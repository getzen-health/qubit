export interface AQILevel {
  range: [number, number]
  label: string
  color: string
  emoji: string
  description: string
  exerciseAdvice: string
  bgColor: string
}

// US AQI scale (EPA)
export const US_AQI_LEVELS: AQILevel[] = [
  { range: [0, 50], label: 'Good', color: '#22c55e', emoji: '😊', bgColor: '#f0fdf4', description: 'Air quality is satisfactory. Little or no risk.', exerciseAdvice: 'Perfect for outdoor exercise.' },
  { range: [51, 100], label: 'Moderate', color: '#eab308', emoji: '😐', bgColor: '#fefce8', description: 'Acceptable air quality. Unusually sensitive people may be affected.', exerciseAdvice: 'Safe for most. Sensitive individuals take care.' },
  { range: [101, 150], label: 'Unhealthy for Sensitive Groups', color: '#f97316', emoji: '😷', bgColor: '#fff7ed', description: 'Sensitive groups may experience health effects.', exerciseAdvice: 'Limit prolonged outdoor exertion if sensitive.' },
  { range: [151, 200], label: 'Unhealthy', color: '#ef4444', emoji: '🚫', bgColor: '#fef2f2', description: 'Everyone may begin to experience health effects.', exerciseAdvice: 'Avoid outdoor exercise. Work out indoors.' },
  { range: [201, 300], label: 'Very Unhealthy', color: '#8b5cf6', emoji: '⚠️', bgColor: '#faf5ff', description: 'Health alert: serious health effects possible.', exerciseAdvice: 'Stay indoors. Keep windows closed.' },
  { range: [301, 500], label: 'Hazardous', color: '#991b1b', emoji: '☠️', bgColor: '#fef2f2', description: 'Health emergency. Everyone affected.', exerciseAdvice: 'Do not go outside. Use air purifier.' },
]

export function getAQILevel(aqi: number): AQILevel {
  return US_AQI_LEVELS.find(l => aqi >= l.range[0] && aqi <= l.range[1]) ?? US_AQI_LEVELS[US_AQI_LEVELS.length - 1]
}

export function getIndoorAirScore(params: {
  co2Ppm?: number
  humidityPct?: number
  tempC?: number
  vocLevel?: 'low' | 'medium' | 'high'
}): { score: number; issues: string[]; tips: string[] } {
  let score = 100
  const issues: string[] = []
  const tips: string[] = []

  if (params.co2Ppm) {
    if (params.co2Ppm > 2000) { score -= 30; issues.push(`CO₂ very high: ${params.co2Ppm} ppm`); tips.push('Open windows immediately — CO₂ at this level causes headaches and fatigue') }
    else if (params.co2Ppm > 1000) { score -= 15; issues.push(`CO₂ elevated: ${params.co2Ppm} ppm`); tips.push('Ventilate room — CO₂ >1000 ppm reduces cognitive performance 15% (Harvard 2016)') }
  }

  if (params.humidityPct !== undefined) {
    if (params.humidityPct < 30) { score -= 15; issues.push(`Low humidity: ${params.humidityPct}%`); tips.push('Use humidifier — low humidity dries airways and increases virus transmission') }
    else if (params.humidityPct > 70) { score -= 20; issues.push(`High humidity: ${params.humidityPct}%`); tips.push('Dehumidify — high humidity promotes mold and dust mite growth') }
  }

  if (params.vocLevel === 'high') { score -= 20; issues.push('High VOC levels'); tips.push('Identify sources: paint, cleaning products, new furniture. Increase ventilation.') }
  else if (params.vocLevel === 'medium') { score -= 10; tips.push('Moderate VOC — ensure regular air circulation') }

  return { score: Math.max(0, score), issues, tips }
}

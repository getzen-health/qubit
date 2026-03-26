// Eco-score based on Open Food Facts ecoscore_grade field + packaging analysis
export type EcoGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'unknown'

const ECO_COLORS: Record<EcoGrade, string> = {
  A: '#1a9850', B: '#91cf60', C: '#fee08b', D: '#fc8d59', E: '#d73027', unknown: '#999'
}
const ECO_LABELS: Record<EcoGrade, string> = {
  A: 'Very low environmental impact',
  B: 'Low environmental impact',
  C: 'Moderate environmental impact',
  D: 'High environmental impact',
  E: 'Very high environmental impact',
  unknown: 'Environmental impact unknown',
}

export function getEcoGrade(rawGrade?: string): EcoGrade {
  const g = (rawGrade ?? '').toUpperCase()
  if (['A', 'B', 'C', 'D', 'E'].includes(g)) return g as EcoGrade
  return 'unknown'
}

export function getEcoColor(grade: EcoGrade): string { return ECO_COLORS[grade] }
export function getEcoLabel(grade: EcoGrade): string { return ECO_LABELS[grade] }

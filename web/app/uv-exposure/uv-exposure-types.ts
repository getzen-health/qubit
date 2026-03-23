// Shared types and utilities for UV Exposure feature
// This file is imported by both the server page and client component

export type UVCategory = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme'

export interface UVDay {
  date: string       // 'YYYY-MM-DD'
  uv: number         // J/m²
  category: UVCategory
  note?: string      // optional activity label
}

export interface UVSummary {
  today: number
  todayCategory: UVCategory
  avg30d: number
  peak30d: number
  peakDate: string
  highPlusDays: number
  daysTracked: number
}

export interface UVExposureData {
  days: UVDay[]
  summary: UVSummary
}

export function getUVCategory(uv: number): UVCategory {
  if (uv < 25) return 'Low'
  if (uv < 50) return 'Moderate'
  if (uv < 100) return 'High'
  if (uv < 200) return 'Very High'
  return 'Extreme'
}

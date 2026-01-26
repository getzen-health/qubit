/**
 * Color Palette for kquarks
 * Uses HSL values for easy manipulation
 */

export interface HSLColor {
  h: number
  s: number
  l: number
}

// Semantic metric colors - consistent across all themes
export const metricColors = {
  recovery: { h: 142, s: 71, l: 45 },    // Green
  strain: { h: 24, s: 95, l: 53 },       // Orange
  heart: { h: 0, s: 84, l: 60 },         // Red
  sleep: { h: 221, s: 83, l: 53 },       // Blue
  activity: { h: 142, s: 76, l: 36 },    // Dark green
  hrv: { h: 280, s: 70, l: 55 },         // Purple
  glucose: { h: 45, s: 93, l: 47 },      // Amber
} as const

// Preset accent colors for user selection
export const accentPresets = [
  { name: 'Purple', h: 270, s: 70, l: 50 },
  { name: 'Blue', h: 220, s: 80, l: 50 },
  { name: 'Green', h: 150, s: 70, l: 40 },
  { name: 'Orange', h: 30, s: 90, l: 50 },
  { name: 'Pink', h: 330, s: 70, l: 55 },
  { name: 'Teal', h: 180, s: 70, l: 40 },
] as const

// Convert HSL to CSS string
export function hslToString(color: HSLColor): string {
  return `hsl(${color.h}, ${color.s}%, ${color.l}%)`
}

// Convert HSL to CSS variable format (space-separated)
export function hslToVar(color: HSLColor): string {
  return `${color.h} ${color.s}% ${color.l}%`
}

// Adjust lightness for variants
export function adjustLightness(color: HSLColor, amount: number): HSLColor {
  return {
    ...color,
    l: Math.max(0, Math.min(100, color.l + amount)),
  }
}

// Generate color scale from base HSL
export function generateColorScale(base: HSLColor): Record<string, string> {
  return {
    50: hslToVar({ ...base, s: base.s * 0.3, l: 97 }),
    100: hslToVar({ ...base, s: base.s * 0.5, l: 94 }),
    200: hslToVar({ ...base, s: base.s * 0.7, l: 86 }),
    300: hslToVar({ ...base, s: base.s * 0.8, l: 76 }),
    400: hslToVar({ ...base, s: base.s * 0.9, l: 64 }),
    500: hslToVar(base),
    600: hslToVar({ ...base, l: base.l - 8 }),
    700: hslToVar({ ...base, l: base.l - 16 }),
    800: hslToVar({ ...base, l: base.l - 24 }),
    900: hslToVar({ ...base, l: base.l - 32 }),
    950: hslToVar({ ...base, l: base.l - 40 }),
  }
}

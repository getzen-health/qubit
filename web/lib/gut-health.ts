export interface BristolType {
  type: number
  label: string
  emoji: string
  description: string
  assessment: 'constipation' | 'ideal' | 'diarrhea'
  color: string
}

export const BRISTOL_TYPES: BristolType[] = [
  { type: 1, label: 'Separate hard lumps', emoji: '🪨', description: 'Hard to pass, like nuts or rabbit droppings', assessment: 'constipation', color: '#ef4444' },
  { type: 2, label: 'Lumpy and sausage-like', emoji: '🔴', description: 'Sausage-shaped but lumpy', assessment: 'constipation', color: '#f97316' },
  { type: 3, label: 'Sausage with cracks', emoji: '🟡', description: 'Like a sausage with cracks on the surface', assessment: 'ideal', color: '#eab308' },
  { type: 4, label: 'Smooth sausage', emoji: '🟢', description: 'Like a sausage or snake, smooth and soft — ideal', assessment: 'ideal', color: '#22c55e' },
  { type: 5, label: 'Soft blobs', emoji: '🟡', description: 'Soft blobs with clear-cut edges', assessment: 'ideal', color: '#eab308' },
  { type: 6, label: 'Fluffy and mushy', emoji: '🟠', description: 'Fluffy pieces with ragged edges', assessment: 'diarrhea', color: '#f97316' },
  { type: 7, label: 'Watery, no solids', emoji: '🔴', description: 'Entirely liquid, no solid pieces', assessment: 'diarrhea', color: '#ef4444' },
]

export type GutSymptom = 'bloating' | 'gas' | 'heartburn' | 'nausea' | 'cramping' | 'urgency'

export const GUT_SYMPTOMS: Record<GutSymptom, { label: string; emoji: string }> = {
  bloating: { label: 'Bloating', emoji: '🫃' },
  gas: { label: 'Gas', emoji: '💨' },
  heartburn: { label: 'Heartburn', emoji: '🔥' },
  nausea: { label: 'Nausea', emoji: '🤢' },
  cramping: { label: 'Cramping', emoji: '😣' },
  urgency: { label: 'Urgency', emoji: '🏃' },
}

// Gut health score (0-100)
export function calculateGutHealthScore(params: {
  avgBristolType: number
  avgDailyFrequency: number
  avgSymptomSeverity: number // 0-5
  fiberIntakeDays: number // days out of 7 with >25g fiber
  fermentedFoodDays: number // days out of 7 with fermented food
}): { score: number; grade: string; color: string } {
  let score = 100

  // Bristol type scoring (ideal is 3-4, penalize extremes)
  const bristolDev = Math.abs(params.avgBristolType - 3.5)
  score -= bristolDev * 12

  // Frequency (ideal 1-2/day)
  if (params.avgDailyFrequency < 0.5) score -= 20 // less than every 2 days
  else if (params.avgDailyFrequency < 1) score -= 10
  else if (params.avgDailyFrequency > 3) score -= 15

  // Symptoms
  score -= params.avgSymptomSeverity * 8

  // Diet bonuses
  score += params.fiberIntakeDays * 1.5
  score += params.fermentedFoodDays * 2

  score = Math.max(0, Math.min(100, Math.round(score)))
  const grade = score >= 80 ? 'Great' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Attention'
  const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : score >= 40 ? 'orange' : 'red'
  return { score, grade, color }
}

export const GUT_TIPS: Record<string, string[]> = {
  constipation: [
    'Increase water intake to 2+ liters/day',
    'Add 5g of soluble fiber (oats, psyllium) daily',
    'Walk 15-20 min after meals to stimulate motility',
    'Try squatting position (Squatty Potty) for easier evacuation',
  ],
  diarrhea: [
    'Identify trigger foods (common: dairy, gluten, FODMAPs, caffeine)',
    'Try BRAT diet temporarily: Bananas, Rice, Applesauce, Toast',
    'Consider a probiotic with Lactobacillus rhamnosus GG',
    'Stay hydrated — add electrolytes if frequent',
  ],
  ideal: [
    'Keep it up! Maintain fiber intake and stay hydrated',
    'Add variety: 30 different plant foods per week supports diversity',
    'Continue fermented foods: yogurt, kefir, sauerkraut, kimchi',
  ],
}

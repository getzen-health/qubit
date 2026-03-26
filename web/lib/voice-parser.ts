export type ParsedVoiceEntry =
  | { type: 'water'; amount_ml: number; drink_type: string }
  | { type: 'mood'; score: number; notes?: string }
  | { type: 'weight'; value_kg: number }
  | { type: 'steps'; count: number }
  | { type: 'sleep'; hours: number }
  | { type: 'food'; meal_name: string; meal_slot?: string }
  | { type: 'workout'; activity: string; duration_min?: number; distance_km?: number }
  | { type: 'unknown'; raw: string }

export function parseVoiceInput(text: string): ParsedVoiceEntry {
  const t = text.toLowerCase().trim()

  // Water patterns: "log 500ml water", "drank 2 cups of water", "500 milliliters"
  const waterMl = t.match(/(\d+(?:\.\d+)?)\s*(?:ml|milliliter|millilitre)/i)
  if (waterMl) {
    const type = t.includes('coffee') || t.includes('espresso') ? 'coffee'
      : t.includes('tea') ? 'tea'
      : t.includes('juice') ? 'juice'
      : t.includes('milk') ? 'milk'
      : t.includes('soda') || t.includes('cola') ? 'soda'
      : 'water'
    return { type: 'water', amount_ml: Math.round(parseFloat(waterMl[1])), drink_type: type }
  }
  const waterCups = t.match(/(\d+(?:\.\d+)?)\s*(?:cup|glass|bottle)/i)
  if ((waterCups && t.includes('water')) || (waterCups && t.includes('drink'))) {
    const multiplier = t.includes('bottle') ? 500 : 250
    return { type: 'water', amount_ml: Math.round(parseFloat(waterCups[1]) * multiplier), drink_type: 'water' }
  }
  const waterLiter = t.match(/(\d+(?:\.\d+)?)\s*(?:liter|litre|l)\b/)
  if (waterLiter && (t.includes('water') || t.includes('drink'))) {
    return { type: 'water', amount_ml: Math.round(parseFloat(waterLiter[1]) * 1000), drink_type: 'water' }
  }

  // Mood patterns: "feeling 7 out of 10", "mood is 8", "i feel a 6"
  const moodMatch = t.match(/(?:mood|feel(?:ing)?|rate)(?:\s+(?:is|was|a))?\s+(\d+)(?:\s*(?:out of|\/)\s*10)?/)
  if (moodMatch) {
    const score = parseInt(moodMatch[1])
    if (score >= 1 && score <= 10) return { type: 'mood', score, notes: text }
  }

  // Weight patterns: "i weigh 72 kg", "weight 158 pounds", "72.5 kilograms"
  const weightKg = t.match(/(?:weigh|weight|body weight)[^\d]*(\d+(?:\.\d+)?)\s*(?:kg|kilogram)/i)
  if (weightKg) return { type: 'weight', value_kg: parseFloat(weightKg[1]) }
  const weightLbs = t.match(/(?:weigh|weight)[^\d]*(\d+(?:\.\d+)?)\s*(?:lb|pound)/i)
  if (weightLbs) return { type: 'weight', value_kg: Math.round(parseFloat(weightLbs[1]) * 0.453592 * 10) / 10 }

  // Steps patterns: "walked 8000 steps", "10k steps today"
  const stepsMatch = t.match(/(\d+(?:\.\d+)?)\s*k?\s*step/i)
  if (stepsMatch) {
    const raw = parseFloat(stepsMatch[1])
    const steps = t.includes('k') && raw < 100 ? raw * 1000 : raw
    return { type: 'steps', count: Math.round(steps) }
  }

  // Sleep patterns: "slept 7.5 hours", "i got 8 hours of sleep"
  const sleepMatch = t.match(/(?:slept|sleep|got)\s+(\d+(?:\.\d+)?)\s*(?:hour|hr)/i)
  if (sleepMatch) return { type: 'sleep', hours: parseFloat(sleepMatch[1]) }

  // Workout patterns: "ran 5k in 28 minutes", "30 minute run", "yoga for 45 minutes"
  const workoutActivities = ['run', 'ran', 'jog', 'walk', 'cycl', 'bike', 'swim', 'yoga', 'gym', 'lift', 'workout', 'hike', 'pilates', 'crossfit', 'hiit', 'stretch']
  const hasActivity = workoutActivities.find(a => t.includes(a))
  if (hasActivity) {
    const durationMatch = t.match(/(\d+)\s*(?:min|minute)/i)
    const distanceMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:km|kilometer|mile)/i)
    const activity = hasActivity === 'ran' ? 'run' : hasActivity
    return {
      type: 'workout',
      activity,
      duration_min: durationMatch ? parseInt(durationMatch[1]) : undefined,
      distance_km: distanceMatch ? parseFloat(distanceMatch[1]) : undefined,
    }
  }

  // Food patterns: "had oatmeal for breakfast", "ate a chicken salad for lunch"
  const mealSlots = ['breakfast', 'lunch', 'dinner', 'snack', 'brunch']
  const mealSlot = mealSlots.find(s => t.includes(s))
  const foodPhrases = ['had', 'ate', 'eating', 'log food', 'food was', 'meal was']
  const hasFoodPhrase = foodPhrases.find(p => t.includes(p))
  if (hasFoodPhrase || mealSlot) {
    // Extract food name by removing filler words
    const cleaned = text
      .replace(/^(i )?(had|ate|eating|log|logged)\s*/i, '')
      .replace(/\s*for\s*(breakfast|lunch|dinner|snack|brunch)\s*/i, '')
      .trim()
    if (cleaned.length > 2) return { type: 'food', meal_name: cleaned, meal_slot: mealSlot }
  }

  return { type: 'unknown', raw: text }
}

export function describeEntry(entry: ParsedVoiceEntry): string {
  switch (entry.type) {
    case 'water': return `💧 Log ${entry.amount_ml}ml of ${entry.drink_type}`
    case 'mood': return `😊 Log mood: ${entry.score}/10`
    case 'weight': return `⚖️ Log weight: ${entry.value_kg} kg`
    case 'steps': return `👟 Log ${entry.count.toLocaleString()} steps`
    case 'sleep': return `😴 Log ${entry.hours}h sleep`
    case 'workout': return `🏃 Log ${entry.activity}${entry.duration_min ? ` (${entry.duration_min} min)` : ''}${entry.distance_km ? ` · ${entry.distance_km}km` : ''}`
    case 'food': return `🍽️ Log food: "${entry.meal_name}"${entry.meal_slot ? ` for ${entry.meal_slot}` : ''}`
    default: return `❓ Could not understand: "${entry.raw}"`
  }
}

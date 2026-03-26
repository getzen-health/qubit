export type JournalType = 'free' | 'gratitude' | 'cbt' | 'morning_pages'
export type SentimentLevel = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive'

export interface JournalEntry {
  id?: string
  user_id?: string
  date?: string
  entry_date?: string
  type: JournalType
  content?: string
  sentiment_score?: number // -5 to +5
  sentiment_level?: SentimentLevel
  gratitude_items?: GratitudeItem[] // Three Good Things
  cbt_record?: CBTRecord
  word_count?: number
  mood_before?: number // 1-10
  mood_after?: number // 1-10
  tags?: string[]
  created_at?: string
}

export interface GratitudeItem {
  event: string
  why: string
  feeling: string
}

export interface CBTRecord {
  situation: string
  automatic_thought: string
  belief_before: number // 0-100
  emotion: string
  emotion_intensity_before: number // 0-100
  evidence_for: string
  evidence_against: string
  balanced_thought: string
  belief_after: number // 0-100
  emotion_intensity_after: number // 0-100
}

// AFINN-111 subset — ~200 common emotional words (Nielsen 2011, public domain)
export const AFINN_WORDS: Record<string, number> = {
  // Very Positive (+4/+5)
  amazing: 4, fantastic: 4, thrilled: 4, extraordinary: 4, fabulous: 4,
  outstanding: 3, awesome: 4, superb: 4, ecstatic: 4, euphoric: 4,
  // Positive (+2/+3)
  happy: 3, great: 3, love: 3, loved: 3, loving: 3, excellent: 3,
  wonderful: 3, joy: 3, joyful: 3, joyous: 3, grateful: 3, thankful: 3,
  blessed: 3, excited: 3, proud: 3, motivated: 3, passionate: 3,
  passion: 3, inspired: 3, beautiful: 3, brilliant: 3, cheerful: 3,
  delight: 3, delighted: 3, flourish: 3, fortunate: 3, fulfilled: 3,
  glad: 3, gleeful: 3, glee: 3, glorious: 3, lucky: 3, marvelous: 3,
  merry: 3, optimistic: 3, radiant: 3, rejuvenated: 3, serene: 3,
  success: 3, successful: 3, thriving: 3, uplifted: 3, vibrant: 3,
  accomplished: 3, appreciate: 3, appreciated: 3, zeal: 3, worthy: 2,
  good: 2, nice: 2, calm: 2, peaceful: 2, hopeful: 2, confident: 2,
  energized: 2, enjoy: 2, enjoyed: 2, enjoying: 2, enthusiasm: 3,
  enthusiastic: 3, free: 1, friendly: 2, fun: 2, generous: 2,
  graceful: 2, growth: 2, healthy: 2, heartfelt: 3, helpful: 2,
  kind: 2, laugh: 2, laughing: 2, laughter: 2, light: 1, lively: 2,
  meaningful: 2, nourished: 2, playful: 2, pleasure: 3, positive: 2,
  powerful: 2, progress: 2, refreshed: 2, relaxed: 2, relief: 2,
  relieved: 2, resilient: 2, safe: 2, satisfied: 2, smart: 2,
  smile: 2, smiling: 2, special: 2, strong: 2, support: 2,
  supported: 2, thankfulness: 3, trust: 2, warm: 2, welcome: 2,
  win: 3, winning: 3, wise: 2, zen: 2, achieve: 2, achieved: 2,
  advantage: 2, celebrate: 3, clarity: 2, compassion: 2, connected: 2,
  courage: 2, creative: 2, energetic: 2, focused: 2, grounded: 2,
  healing: 2, honest: 2, humility: 2, integrity: 2, nurturing: 2,
  open: 1, patient: 2, present: 1, purposeful: 2, rested: 2,
  shine: 2, stable: 1, thankgiving: 3, thriving: 3, tranquil: 2,
  treasured: 2, victorious: 3, welcome: 2, wholesome: 2, wonder: 3,
  // Very Negative (-4/-5)
  horrible: -4, disgusting: -4, despicable: -4, atrocious: -4,
  catastrophic: -4, devastating: -4, horrifying: -4, nightmarish: -4,
  // Negative (-2/-3)
  sad: -2, sadness: -2, bad: -2, angry: -3, anger: -3, hate: -3,
  hated: -3, hating: -3, terrible: -3, awful: -3, hopeless: -3,
  worthless: -3, depressed: -3, depression: -3, miserable: -3,
  misery: -3, grief: -3, agony: -3, desperate: -3, destroyed: -3,
  devastated: -3, disaster: -3, disgrace: -3, disgusted: -3,
  dread: -2, dreading: -2, failure: -3, heartbroken: -3,
  nightmare: -3, panic: -3, rage: -3, ruin: -3, terrified: -3,
  unworthy: -3, vicious: -3, violent: -3,
  stress: -2, stressed: -2, stressful: -2, anxious: -2, anxiety: -2,
  worried: -2, worry: -2, afraid: -2, fear: -2, fearful: -2,
  lonely: -2, loneliness: -2, exhausted: -2, exhaustion: -2,
  overwhelmed: -2, overwhelm: -2, frustrated: -2, frustration: -2,
  fail: -2, failed: -2, abandon: -2, ache: -2, aching: -2,
  alone: -1, annoyed: -2, annoy: -2, apathetic: -2, ashamed: -3,
  bitter: -2, blame: -2, bleak: -2, burden: -2, chaos: -2, chaotic: -2,
  crying: -2, damage: -2, dark: -1, dead: -3, destroy: -3,
  disappoint: -2, disappointed: -2, disappointment: -2, disease: -2,
  doubt: -1, dull: -1, empty: -2, envy: -2, evil: -3,
  exhausting: -2, fragile: -1, guilty: -2, guilt: -2, harsh: -2,
  helpless: -2, hopelessness: -3, hurt: -2, ignored: -2,
  incompetent: -2, inferior: -2, insecure: -2, insignificant: -2,
  irritated: -2, irritating: -2, jealous: -2, jealousy: -2,
  lazy: -1, lies: -2, loss: -2, lost: -2, mad: -2, meaningless: -2,
  mess: -2, miss: -1, mistake: -1, negative: -1, nervous: -2,
  numb: -1, offensive: -2, paralyzed: -2, pessimistic: -2,
  pitiful: -2, powerless: -2, problem: -1, regret: -2, reject: -2,
  rejected: -2, resentment: -2, rough: -1, shame: -2, shocked: -1,
  sick: -2, sorrow: -2, stuck: -1, suffer: -2, suffering: -2,
  tense: -1, trapped: -2, trouble: -1, ugly: -2, uncertain: -1,
  uncomfortable: -1, unfair: -2, unhappy: -2, upset: -2, useless: -2,
  vulnerable: -1, weak: -1, withdrawn: -1, wrong: -1, tired: -1,
  confused: -1, conflict: -2, difficulty: -1, disagree: -1,
  false: -1, pain: -2, painful: -2, broken: -2,
}

export function analyzeSentiment(text: string): {
  score: number
  level: SentimentLevel
  topWords: string[]
} {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return { score: 0, level: 'neutral', topWords: [] }

  let total = 0
  const found: Array<{ word: string; score: number }> = []

  for (const word of words) {
    const score = AFINN_WORDS[word]
    if (score !== undefined) {
      total += score
      found.push({ word, score })
    }
  }

  // Normalize: sum / word_count * 5
  const raw = words.length > 0 ? (total / words.length) * 5 : 0
  const score = Math.max(-5, Math.min(5, parseFloat(raw.toFixed(2))))

  const topPositive = found
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(f => f.word)
  const topNegative = found
    .filter(f => f.score < 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map(f => f.word)
  const topWords = [...topPositive, ...topNegative].slice(0, 6)

  let level: SentimentLevel
  if (score > 2) level = 'very_positive'
  else if (score > 0.5) level = 'positive'
  else if (score >= -0.5) level = 'neutral'
  else if (score >= -2) level = 'negative'
  else level = 'very_negative'

  return { score, level, topWords }
}

export function getWritingPrompts(type: JournalType): string[] {
  const prompts: Record<JournalType, string[]> = {
    free: [
      "What's on your mind right now? Let it flow without judgment.",
      'Describe your day as if telling it to a close friend.',
      'What emotion has been with you most today? Where do you feel it in your body?',
      'What surprised you today?',
      'What do you want to remember about this moment?',
      "If today had a color, what would it be and why?",
      'What conversation has stayed with you this week?',
      "What's one thing you're genuinely looking forward to?",
      'Write about a small moment that brought you peace today.',
      'What do you need to let go of right now?',
    ],
    gratitude: [
      'Think of three things that went well today — even small ones count.',
      'Who made your life better today, and how?',
      "What's something you usually take for granted that you're grateful for?",
      'Describe a moment today when you felt fortunate.',
    ],
    cbt: [
      'Describe a situation that triggered a strong emotion today.',
      'What was going through your mind during a challenging moment?',
      'Identify a thought you had today that may not be entirely accurate.',
      "What's a belief about yourself you'd like to examine more closely?",
    ],
    morning_pages: [
      "Stream of consciousness — write whatever comes. Don't stop, don't edit.",
      'What do you need to release before starting your day?',
      'What intentions will guide you today?',
      'Write about your dreams last night, however fragmented.',
      'What would make today feel like a success?',
    ],
  }
  return prompts[type]
}

export function getMoodShift(entry: JournalEntry): number {
  if (entry.mood_before == null || entry.mood_after == null) return 0
  return entry.mood_after - entry.mood_before
}

export const SENTIMENT_COLORS: Record<SentimentLevel, string> = {
  very_negative: '#ef4444',
  negative: '#f97316',
  neutral: '#94a3b8',
  positive: '#22c55e',
  very_positive: '#16a34a',
}

export const SENTIMENT_LABELS: Record<SentimentLevel, string> = {
  very_negative: 'Very Negative',
  negative: 'Negative',
  neutral: 'Neutral',
  positive: 'Positive',
  very_positive: 'Very Positive',
}

export const JOURNAL_TYPE_LABELS: Record<JournalType, string> = {
  free: 'Free Write',
  gratitude: 'Three Good Things',
  cbt: 'CBT Record',
  morning_pages: 'Morning Pages',
}

export const JOURNAL_TYPE_ICONS: Record<JournalType, string> = {
  free: '✍️',
  gratitude: '🙏',
  cbt: '🧠',
  morning_pages: '🌅',
}

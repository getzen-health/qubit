import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    // Get 7 days ago at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)
    start.setDate(today.getDate() - 6)
    const startIso = start.toISOString()

    // Query and group by date (YYYY-MM-DD)
    const { data, error } = await supabase
      .from('food_diary_entries')
      .select('logged_at,calories,protein_g,carbs_g,fat_g')
      .eq('user_id', user!.id)
      .gte('logged_at', startIso)
      .order('logged_at', { ascending: true })

    if (error) return secureErrorResponse('Failed to fetch weekly food diary', 500)

    // Aggregate by day
    const days: Record<string, { date: string, calories: number, protein_g: number, carbs_g: number, fat_g: number }> = {}
    for (const entry of data) {
      const date = entry.logged_at.slice(0, 10)
      if (!days[date]) days[date] = { date, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      days[date].calories += entry.calories || 0
      days[date].protein_g += Number(entry.protein_g) || 0
      days[date].carbs_g += Number(entry.carbs_g) || 0
      days[date].fat_g += Number(entry.fat_g) || 0
    }
    // Fill missing days
    const result = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      result.push(days[key] || { date: key, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })
    }
    return secureJsonResponse(result)
  }
)

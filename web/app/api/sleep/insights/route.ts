import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    // Fetch last 7 sleep records
    const { data: sleepRecords } = await supabase
      .from('sleep_records')
      .select('date, duration_hours, quality_score')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(7)

    if (!sleepRecords || sleepRecords.length < 3) {
      return secureJsonResponse({ insight: 'Log at least 3 nights of sleep to get insights.', avgDuration: null })
    }

    // Call edge function
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-sleep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sleepRecords, userId: user!.id }),
    })
    const data = await res.json()
    return secureJsonResponse(data)
  }
)

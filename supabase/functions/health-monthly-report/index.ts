import { createClient } from 'supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MonthlySummary {
  user_id: string
  month: string
  year: number
  month_num: number
  days_recorded: number
  avg_steps: number
  max_steps_day: number
  min_steps_day: number
  total_steps: number
  avg_active_calories: number
  total_active_calories: number
  avg_distance_m: number
  total_distance_m: number
  avg_sleep_minutes: number
  max_sleep_minutes: number
  min_sleep_minutes: number
  avg_resting_hr: number
  avg_hrv: number
  best_recovery_score: number
  worst_recovery_score: number
  avg_recovery_score: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Parse query parameters
    const url = new URL(req.url)
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString())
    const month = url.searchParams.get('month') // Optional: filter by specific month

    // Fetch monthly summaries
    let query = supabase
      .from('monthly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', year)
      .order('month_num', { ascending: true })

    if (month) {
      const monthNum = parseInt(month)
      if (monthNum < 1 || monthNum > 12) {
        return new Response(
          JSON.stringify({ error: 'Invalid month (1-12)' }),
          { status: 400, headers: corsHeaders }
        )
      }
      query = query.eq('month_num', monthNum)
    }

    const { data: monthlySummaries, error: queryError } = await query

    if (queryError) {
      console.error('Query error:', queryError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch monthly summaries' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Calculate yearly aggregate if no specific month
    let yearlyAggregate = null
    if (!month) {
      const summaries = monthlySummaries as MonthlySummary[]
      if (summaries.length > 0) {
        yearlyAggregate = {
          year,
          total_days_recorded: summaries.reduce((sum, s) => sum + s.days_recorded, 0),
          avg_daily_steps: Math.round(
            summaries.reduce((sum, s) => sum + s.avg_steps, 0) / summaries.length
          ),
          total_steps: summaries.reduce((sum, s) => sum + s.total_steps, 0),
          best_month_steps: Math.max(...summaries.map(s => s.total_steps)),
          worst_month_steps: Math.min(...summaries.map(s => s.total_steps)),
          avg_sleep_hours: parseFloat(
            (summaries.reduce((sum, s) => sum + s.avg_sleep_minutes, 0) / summaries.length / 60).toFixed(1)
          ),
          avg_recovery_score: parseFloat(
            summaries.reduce((sum, s) => sum + (s.avg_recovery_score || 0), 0)
              .toFixed(1)
          ),
          months_with_data: summaries.length,
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        year,
        monthly_data: monthlySummaries,
        yearly_summary: yearlyAggregate,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})

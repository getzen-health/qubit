import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/water - Get user's water logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') // Optional: filter by date (YYYY-MM-DD)

    // Get today's summary
    const today = date || new Date().toISOString().split('T')[0]

    const { data: dailySummary, error: summaryError } = await supabase
      .from('daily_water')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    // Get individual logs for the day
    const { data: logs, error: logsError } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00`)
      .lt('logged_at', `${today}T23:59:59`)
      .order('logged_at', { ascending: false })

    if (logsError) {
      console.error('Error fetching water logs:', logsError)
      return NextResponse.json({ error: 'Failed to fetch water logs' }, { status: 500 })
    }

    // Get user's water target
    const { data: settings } = await supabase
      .from('user_nutrition_settings')
      .select('water_target_ml')
      .eq('user_id', user.id)
      .single()

    const target = settings?.water_target_ml || 2500

    return NextResponse.json({
      date: today,
      total_ml: dailySummary?.total_ml || 0,
      target_ml: target,
      log_count: dailySummary?.log_count || 0,
      logs: logs || [],
    })
  } catch (error) {
    console.error('Water GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/water - Log water intake
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const amount_ml = parseInt(body.amount_ml)

    if (!amount_ml || amount_ml <= 0) {
      return NextResponse.json({ error: 'Invalid amount_ml' }, { status: 400 })
    }

    const { data: log, error } = await supabase
      .from('water_logs')
      .insert({
        user_id: user.id,
        amount_ml: amount_ml,
        logged_at: body.logged_at || new Date().toISOString(),
        source: body.source || 'manual',
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging water:', error)
      return NextResponse.json({ error: 'Failed to log water' }, { status: 500 })
    }

    // Get updated daily total
    const today = new Date().toISOString().split('T')[0]
    const { data: dailySummary } = await supabase
      .from('daily_water')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    return NextResponse.json({
      log,
      daily_total_ml: dailySummary?.total_ml || amount_ml,
    }, { status: 201 })
  } catch (error) {
    console.error('Water POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/water?id=xxx - Delete a water log
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const logId = request.nextUrl.searchParams.get('id')
    if (!logId) {
      return NextResponse.json({ error: 'Log ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('water_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting water log:', error)
      return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Water DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

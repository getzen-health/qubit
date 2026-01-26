import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/fasting - Get user's fasting sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const active = searchParams.get('active') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (active) {
      // Get only the active (not ended) session
      query = query.is('ended_at', null)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching fasting sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Get user's default fasting settings
    const { data: settings } = await supabase
      .from('user_nutrition_settings')
      .select('default_fasting_protocol, default_fasting_hours')
      .eq('user_id', user.id)
      .single()

    // Calculate elapsed time for active session
    const activeSession = sessions?.find((s) => !s.ended_at)
    let activeSessionWithElapsed = null

    if (activeSession) {
      const startedAt = new Date(activeSession.started_at)
      const now = new Date()
      const elapsedMs = now.getTime() - startedAt.getTime()
      const elapsedHours = elapsedMs / (1000 * 60 * 60)

      activeSessionWithElapsed = {
        ...activeSession,
        elapsed_hours: Math.round(elapsedHours * 100) / 100,
        remaining_hours: Math.max(0, activeSession.target_hours - elapsedHours),
        progress_percent: Math.min(100, (elapsedHours / activeSession.target_hours) * 100),
      }
    }

    return NextResponse.json({
      active_session: activeSessionWithElapsed,
      recent_sessions: sessions?.filter((s) => s.ended_at) || [],
      default_protocol: settings?.default_fasting_protocol || '16:8',
      default_hours: settings?.default_fasting_hours || 16,
    })
  } catch (error) {
    console.error('Fasting GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/fasting - Start a new fasting session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if there's already an active session
    const { data: existingActive } = await supabase
      .from('fasting_sessions')
      .select('id')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .single()

    if (existingActive) {
      return NextResponse.json(
        { error: 'You already have an active fasting session. End it first.' },
        { status: 400 }
      )
    }

    const { data: session, error } = await supabase
      .from('fasting_sessions')
      .insert({
        user_id: user.id,
        protocol: body.protocol || '16:8',
        target_hours: body.target_hours || 16,
        started_at: body.started_at || new Date().toISOString(),
        notes: body.notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating fasting session:', error)
      return NextResponse.json({ error: 'Failed to start fasting' }, { status: 500 })
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Fasting POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/fasting - End an active fasting session
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const sessionId = body.id

    // Get the active session
    const { data: activeSession, error: fetchError } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .single()

    if (fetchError || !activeSession) {
      return NextResponse.json({ error: 'No active fasting session found' }, { status: 404 })
    }

    // Calculate actual duration
    const startedAt = new Date(activeSession.started_at)
    const endedAt = body.ended_at ? new Date(body.ended_at) : new Date()
    const actualHours = (endedAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60)
    const completed = actualHours >= activeSession.target_hours

    const { data: session, error } = await supabase
      .from('fasting_sessions')
      .update({
        ended_at: endedAt.toISOString(),
        actual_hours: Math.round(actualHours * 100) / 100,
        completed,
        notes: body.notes || activeSession.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeSession.id)
      .select()
      .single()

    if (error) {
      console.error('Error ending fasting session:', error)
      return NextResponse.json({ error: 'Failed to end fasting' }, { status: 500 })
    }

    return NextResponse.json({
      session,
      completed,
      actual_hours: Math.round(actualHours * 100) / 100,
    })
  } catch (error) {
    console.error('Fasting PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/fasting?id=xxx - Delete a fasting session
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = request.nextUrl.searchParams.get('id')
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('fasting_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting fasting session:', error)
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fasting DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

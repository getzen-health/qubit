import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('profiles')
      .select('privacy_mode, share_steps, share_workouts, share_sleep, share_hrv, share_readiness')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data || {
      privacy_mode: 'friends',
      share_steps: true,
      share_workouts: true,
      share_sleep: false,
      share_hrv: false,
      share_readiness: true,
    })
  } catch (error) {
    console.error('Error fetching privacy settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { privacy_mode, share_steps, share_workouts, share_sleep, share_hrv, share_readiness } = body

    // Validate privacy_mode
    const validPrivacyModes = ['public', 'friends', 'private']
    if (privacy_mode && !validPrivacyModes.includes(privacy_mode)) {
      return NextResponse.json({ error: 'Invalid privacy_mode value' }, { status: 400 })
    }

    // Validate boolean fields
    const booleanFields = { share_steps, share_workouts, share_sleep, share_hrv, share_readiness }
    for (const [key, value] of Object.entries(booleanFields)) {
      if (value !== undefined && typeof value !== 'boolean') {
        return NextResponse.json({ error: `${key} must be a boolean` }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        privacy_mode: privacy_mode || 'friends',
        share_steps: share_steps !== undefined ? share_steps : true,
        share_workouts: share_workouts !== undefined ? share_workouts : true,
        share_sleep: share_sleep !== undefined ? share_sleep : false,
        share_hrv: share_hrv !== undefined ? share_hrv : false,
        share_readiness: share_readiness !== undefined ? share_readiness : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating privacy settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

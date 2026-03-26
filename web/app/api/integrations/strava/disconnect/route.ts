import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the integration record
    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'strava')

    if (error) {
      console.error('Failed to delete integration:', error)
      return NextResponse.json(
        { error: 'Failed to disconnect' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Disconnect error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { export_schedule } = await request.json()

    if (!['none', 'weekly', 'monthly'].includes(export_schedule)) {
      return NextResponse.json(
        { error: 'Invalid export schedule' },
        { status: 400 }
      )
    }

    // Get user preferences
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id, export_schedule')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('user_preferences')
        .update({ export_schedule })
        .eq('user_id', user.id)

      if (error) throw error
    } else {
      // Create new
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          export_schedule,
        })

      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      export_schedule,
      message: export_schedule === 'none'
        ? 'Auto-export disabled'
        : `Reports will be emailed ${export_schedule}ly`,
    })
  } catch (error) {
    console.error('Export schedule update error:', error)
    return NextResponse.json(
      { error: 'Failed to update export schedule' },
      { status: 500 }
    )
  }
}

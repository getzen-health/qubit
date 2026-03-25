import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'Anomaly ID required' }, { status: 400 })
  }

  // Verify the anomaly belongs to the user before updating
  const { data: anomaly, error: fetchError } = await supabase
    .from('anomalies')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !anomaly) {
    return NextResponse.json({ error: 'Anomaly not found' }, { status: 404 })
  }

  // Mark as dismissed
  const { error: updateError } = await supabase
    .from('anomalies')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

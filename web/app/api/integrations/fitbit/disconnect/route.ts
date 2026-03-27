import { NextResponse } from 'next/server'
import { createSecureApiHandler } from '@/lib/security'

export const POST = createSecureApiHandler(
  { requireAuth: true },
  async (_request, context) => {
    const { user, supabase } = context

    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', user!.id)
      .eq('provider', 'fitbit')

    if (error) {
      console.error('Failed to disconnect Fitbit:', error)
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }
)

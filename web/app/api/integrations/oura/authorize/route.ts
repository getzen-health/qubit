import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.OURA_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Oura not configured' }, { status: 503 })

  const state = crypto.randomUUID()
  cookies().set('oura_state', state, { httpOnly: true, secure: true, maxAge: 600 })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oura/callback`,
    response_type: 'code',
    scope: 'daily sleep readiness',
    state
  })

  return NextResponse.redirect(`https://cloud.ouraring.com/oauth/authorize?${params}`)
}

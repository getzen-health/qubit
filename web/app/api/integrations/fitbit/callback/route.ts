import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect('/login')

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const cookieStore = await cookies()
  const savedState = cookieStore.get('fitbit_state')?.value
  const verifier = cookieStore.get('fitbit_code_verifier')?.value

  if (!code || state !== savedState || !verifier) {
    return NextResponse.redirect('/integrations?error=fitbit_auth_failed')
  }

  const tokenRes = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      code_verifier: verifier,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/fitbit/callback`
    })
  })

  if (!tokenRes.ok) return NextResponse.redirect('/integrations?error=fitbit_token_failed')
  const tokens = await tokenRes.json()

  const { error: intErr } = await supabase.from('integrations').upsert({
    user_id: user.id,
    provider: 'fitbit',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    metadata: { user_id: tokens.user_id }
  }, { onConflict: 'user_id,provider' })

  return NextResponse.redirect('/integrations?success=fitbit')
}

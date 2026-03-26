import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect('/login')

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const savedState = cookies().get('oura_state')?.value

  if (!code || state !== savedState) {
    return NextResponse.redirect('/integrations?error=oura_auth_failed')
  }

  const tokenRes = await fetch('https://api.ouraring.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.OURA_CLIENT_ID}:${process.env.OURA_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oura/callback`
    })
  })

  if (!tokenRes.ok) return NextResponse.redirect('/integrations?error=oura_token_failed')
  const tokens = await tokenRes.json()

  await supabase.from('integrations').upsert({
    user_id: user.id,
    provider: 'oura',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: tokens.expires_at ? new Date(tokens.expires_at * 1000).toISOString() : null,
    metadata: {}
  }, { onConflict: 'user_id,provider' })

  return NextResponse.redirect('/integrations?success=oura')
}

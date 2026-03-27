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
  const cookieStore = await cookies();
const savedState = cookieStore.get('google_fit_state')?.value

  if (!code || state !== savedState) {
    return NextResponse.redirect('/integrations?error=google_fit_auth_failed')
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-fit/callback`,
      grant_type: 'authorization_code'
    })
  })

  if (!tokenRes.ok) return NextResponse.redirect('/integrations?error=google_fit_token_failed')
  const tokens = await tokenRes.json()

  const { error: intErr } = await supabase.from('integrations').upsert({
    user_id: user.id,
    provider: 'google_fit',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    metadata: {}
  }, { onConflict: 'user_id,provider' })

  return NextResponse.redirect('/integrations?success=google_fit')
}

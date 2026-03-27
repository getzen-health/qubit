import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect('/login')

  const { searchParams } = new URL(request.url)
  const oauthToken = searchParams.get('oauth_token')
  const oauthVerifier = searchParams.get('oauth_verifier')

  if (!oauthToken || !oauthVerifier) {
    return NextResponse.redirect('/integrations?error=garmin_callback_failed')
  }

  // Store placeholder - real implementation exchanges for access token
  const { error: intErr } = await supabase.from('integrations').upsert({
    user_id: user.id,
    provider: 'garmin',
    metadata: { oauth_token: oauthToken, connected_at: new Date().toISOString() }
  }, { onConflict: 'user_id,provider' })

  return NextResponse.redirect('/integrations?success=garmin')
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptToken, isLegacyToken, migrateToken } from '@/lib/encryption'
import { checkRateLimit } from '@/lib/security/rate-limit'

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET
const STRAVA_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/strava/callback`
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

export async function GET(request: NextRequest) {
  try {
    // Auth check at top of callback
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect('/login?error=session_expired')
    }

    // Rate limiting on callback endpoint
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = await checkRateLimit(clientId, 'integrations')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // Validate environment variables
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !ENCRYPTION_KEY) {
      console.error('Strava integration not properly configured')
      return NextResponse.json(
        { error: 'Strava integration not configured' },
        { status: 500 }
      )
    }

    // Get authorization code and state from query params
    const code = request.nextUrl.searchParams.get('code')
    const stateFromUrl = request.nextUrl.searchParams.get('state')
    const error = request.nextUrl.searchParams.get('error')

    // Check for OAuth errors
    if (error) {
      const redirectTo = stateFromUrl ? new URL(stateFromUrl).pathname : '/settings/integrations'
      return NextResponse.redirect(`${redirectTo}?error=oauth_denied&error_description=${error}`)
    }

    if (!code) {
      return NextResponse.redirect('/settings/integrations?error=no_authorization_code')
    }

    if (!stateFromUrl) {
      return NextResponse.redirect('/settings/integrations?error=missing_state_parameter')
    }

    // Verify state matches stored cookie (CSRF protection)
    const storedState = request.cookies.get('strava_oauth_state')?.value
    if (!storedState || storedState !== stateFromUrl) {
      console.error('CSRF validation failed: state mismatch')
      return NextResponse.redirect('/settings/integrations?error=csrf_validation_failed')
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Strava token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(
        `/settings/integrations?error=token_exchange_failed&code=${tokenResponse.status}`
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_at } = tokenData

    if (!access_token) {
      console.error('No access token in Strava response')
      return NextResponse.redirect('/settings/integrations?error=invalid_token_response')
    }

    // Encrypt tokens with AES-256-GCM before storing
    let encryptedAccessToken: string
    let encryptedRefreshToken: string | null = null

    try {
      encryptedAccessToken = encryptToken(access_token, ENCRYPTION_KEY)
      if (refresh_token) {
        encryptedRefreshToken = encryptToken(refresh_token, ENCRYPTION_KEY)
      }
    } catch (encryptError) {
      console.error('Token encryption failed:', encryptError)
      return NextResponse.redirect('/settings/integrations?error=encryption_failed')
    }

    // Store integration in database
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert(
        {
          user_id: user.id,
          provider: 'strava',
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: new Date(expires_at * 1000).toISOString(),
          is_active: true,
          last_sync: null,
        },
        { onConflict: 'user_id,provider' }
      )

    if (dbError) {
      console.error('Failed to store integration:', dbError)
      return NextResponse.redirect('/settings/integrations?error=storage_failed')
    }

    // Create redirect response
    const redirectUrl = new URL('/settings/integrations', process.env.NEXT_PUBLIC_APP_URL)
    redirectUrl.searchParams.set('success', 'strava_connected')

    const redirectResponse = NextResponse.redirect(redirectUrl)
    redirectResponse.cookies.delete('strava_oauth_state')

    return redirectResponse
  } catch (error) {
    console.error('Strava callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

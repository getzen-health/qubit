import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET
const STRAVA_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/strava/callback`

// Simple encryption helper (in production, use a proper encryption library)
function encryptToken(token: string): string {
  // TODO: Implement proper encryption using a library like tweetnacl or crypto-js
  // For now, base64 encode (NOT SECURE - for development only)
  return Buffer.from(token).toString('base64')
}

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Strava integration not configured' },
        { status: 500 }
      )
    }

    // Get authorization code and state from query params
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')

    if (!code) {
      return NextResponse.redirect(
        `${state || '/settings/integrations'}?error=authorization_failed`
      )
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
        `${state || '/settings/integrations'}?error=token_exchange_failed`
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_at } = tokenData

    // Get user from Supabase auth
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect('/login')
    }

    // Store integration in database
    // TODO: Implement proper token encryption before storing
    const encryptedAccessToken = encryptToken(access_token)
    const encryptedRefreshToken = refresh_token ? encryptToken(refresh_token) : null

    const { error } = await supabase
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

    if (error) {
      console.error('Failed to store integration:', error)
      return NextResponse.redirect(
        `${state || '/settings/integrations'}?error=storage_failed`
      )
    }

    // TODO: Trigger initial sync of Strava activities
    // await triggerStravaSync(user.id)

    return NextResponse.redirect(
      `${state || '/settings/integrations'}?success=strava_connected`
    )
  } catch (error) {
    console.error('Strava callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

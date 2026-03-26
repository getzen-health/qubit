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

  const cookieStore = cookies()
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

  await supabase.from('integrations').upsert({
    user_id: user.id,
    provider: 'fitbit',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    metadata: { user_id: tokens.user_id }
  }, { onConflict: 'user_id,provider' })

  return NextResponse.redirect('/integrations?success=fitbit')
}

import { createClient } from '@/lib/supabase/server'
import { encryptToken } from '@/lib/encryption'
import { checkRateLimit } from '@/lib/security/rate-limit'

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET
const FITBIT_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/fitbit/callback`
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

/**
 * GET /api/integrations/fitbit/callback
 * Exchange the authorization code + PKCE verifier for access/refresh tokens,
 * store them encrypted in user_integrations, and schedule an initial sync via
 * the sync_queue table.
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = await checkRateLimit(clientIp, 'integrations')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET || !ENCRYPTION_KEY) {
      console.error('Fitbit integration not properly configured')
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=fitbit_not_configured`
      )
    }

    const code = request.nextUrl.searchParams.get('code')
    const stateFromUrl = request.nextUrl.searchParams.get('state')
    const oauthError = request.nextUrl.searchParams.get('error')

    if (oauthError) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=oauth_denied&provider=fitbit`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=no_authorization_code`
      )
    }

    // Verify state (CSRF protection)
    const storedState = request.cookies.get('fitbit_oauth_state')?.value
    if (!storedState || storedState !== stateFromUrl) {
      console.error('Fitbit CSRF validation failed')
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=csrf_validation_failed`
      )
    }

    // Retrieve code verifier stored during authorize step
    const codeVerifier = request.cookies.get('fitbit_code_verifier')?.value
    if (!codeVerifier) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=missing_code_verifier`
      )
    }

    // Exchange code for tokens using PKCE
    const credentials = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')
    const tokenRes = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: FITBIT_CLIENT_ID,
        grant_type: 'authorization_code',
        redirect_uri: FITBIT_REDIRECT_URI,
        code,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      console.error('Fitbit token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=token_exchange_failed`
      )
    }

    const tokenData = await tokenRes.json()
    const { access_token, refresh_token, expires_in } = tokenData

    if (!access_token) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=invalid_token_response`
      )
    }

    // Verify user session
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${appUrl}/login?error=session_expired`)
    }

    // Encrypt tokens
    let encryptedAccessToken: string
    let encryptedRefreshToken: string | null = null
    try {
      encryptedAccessToken = encryptToken(access_token, ENCRYPTION_KEY)
      if (refresh_token) {
        encryptedRefreshToken = encryptToken(refresh_token, ENCRYPTION_KEY)
      }
    } catch (err) {
      console.error('Fitbit token encryption failed:', err)
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=encryption_failed`
      )
    }

    const tokenExpiry = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null

    // Upsert integration record
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert(
        {
          user_id: user.id,
          provider: 'fitbit',
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: tokenExpiry,
          is_active: true,
          last_sync: null,
        },
        { onConflict: 'user_id,provider' }
      )

    if (dbError) {
      console.error('Failed to store Fitbit integration:', dbError)
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=storage_failed`
      )
    }

    // Schedule an initial background sync via sync_queue
    await supabase.from('sync_queue').insert({
      user_id: user.id,
      provider: 'fitbit',
      status: 'pending',
      payload: { trigger: 'initial_connect' },
    })

    const redirectResponse = NextResponse.redirect(
      `${appUrl}/settings/integrations?success=fitbit_connected`
    )
    redirectResponse.cookies.delete('fitbit_code_verifier')
    redirectResponse.cookies.delete('fitbit_oauth_state')
    return redirectResponse
  } catch (error) {
    console.error('Fitbit callback error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

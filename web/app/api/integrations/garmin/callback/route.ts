import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { encryptToken } from '@/lib/encryption'
import { checkRateLimit } from '@/lib/security/rate-limit'

const GARMIN_CONSUMER_KEY = process.env.GARMIN_CONSUMER_KEY
const GARMIN_CONSUMER_SECRET = process.env.GARMIN_CONSUMER_SECRET
const GARMIN_ACCESS_TOKEN_URL = 'https://oauth.garmin.com/oauth/access_token'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

/**
 * Build an OAuth 1.0a Authorization header with HMAC-SHA1 signature
 * for the access token exchange step.
 */
function buildOAuth1AccessHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  oauthToken: string,
  tokenSecret: string,
  oauthVerifier: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: oauthToken,
    oauth_verifier: oauthVerifier,
    oauth_version: '1.0',
  }

  const sortedParams = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&')

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64')

  const headerParts = { ...oauthParams, oauth_signature: signature }
  const headerValue = Object.entries(headerParts)
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ')

  return `OAuth ${headerValue}`
}

/**
 * GET /api/integrations/garmin/callback
 * Garmin OAuth 1.0a callback: exchange oauth_token + oauth_verifier for
 * permanent access tokens and store them encrypted in user_integrations.
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

    if (!GARMIN_CONSUMER_KEY || !GARMIN_CONSUMER_SECRET || !ENCRYPTION_KEY) {
      console.error('Garmin integration not properly configured')
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=garmin_not_configured`
      )
    }

    const oauthToken = request.nextUrl.searchParams.get('oauth_token')
    const oauthVerifier = request.nextUrl.searchParams.get('oauth_verifier')

    if (!oauthToken || !oauthVerifier) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=missing_oauth_params`
      )
    }

    // Retrieve the request token secret stored during the authorize step
    const requestTokenSecret = request.cookies.get('garmin_request_token_secret')?.value
    if (!requestTokenSecret) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=missing_request_token_secret`
      )
    }

    // Exchange request token for access token
    const oauthHeader = buildOAuth1AccessHeader(
      'POST',
      GARMIN_ACCESS_TOKEN_URL,
      GARMIN_CONSUMER_KEY,
      GARMIN_CONSUMER_SECRET,
      oauthToken,
      requestTokenSecret,
      oauthVerifier
    )

    const tokenRes = await fetch(GARMIN_ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: { Authorization: oauthHeader },
    })

    if (!tokenRes.ok) {
      console.error('Garmin access token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=token_exchange_failed`
      )
    }

    const body = await tokenRes.text()
    const params = new URLSearchParams(body)
    const accessToken = params.get('oauth_token')
    const accessTokenSecret = params.get('oauth_token_secret')

    if (!accessToken || !accessTokenSecret) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=invalid_access_token_response`
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

    // Encrypt tokens before storing
    let encryptedAccessToken: string
    let encryptedTokenSecret: string
    try {
      encryptedAccessToken = encryptToken(accessToken, ENCRYPTION_KEY)
      // OAuth 1.0a uses a token secret instead of a refresh token
      encryptedTokenSecret = encryptToken(accessTokenSecret, ENCRYPTION_KEY)
    } catch (err) {
      console.error('Garmin token encryption failed:', err)
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=encryption_failed`
      )
    }

    // Upsert into user_integrations; store token secret as refresh_token
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert(
        {
          user_id: user.id,
          provider: 'garmin',
          access_token: encryptedAccessToken,
          refresh_token: encryptedTokenSecret,
          is_active: true,
          last_sync: null,
        },
        { onConflict: 'user_id,provider' }
      )

    if (dbError) {
      console.error('Failed to store Garmin integration:', dbError)
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=storage_failed`
      )
    }

    const redirectResponse = NextResponse.redirect(
      `${appUrl}/settings/integrations?success=garmin_connected`
    )
    redirectResponse.cookies.delete('garmin_request_token_secret')
    return redirectResponse
  } catch (error) {
    console.error('Garmin callback error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

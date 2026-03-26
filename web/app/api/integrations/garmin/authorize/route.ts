import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Garmin uses OAuth 1.0a - redirect to auth page with instructions
  const consumerKey = process.env.GARMIN_CONSUMER_KEY
  if (!consumerKey) {
    return NextResponse.json({ error: 'Garmin not configured. Set GARMIN_CONSUMER_KEY and GARMIN_CONSUMER_SECRET.' }, { status: 503 })
  }

  // OAuth 1.0a request token flow placeholder
  // Full implementation requires oauth-1.0a library
  return NextResponse.redirect('https://connect.garmin.com/oauthConfirm')
}

import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security/rate-limit'

const GARMIN_CONSUMER_KEY = process.env.GARMIN_CONSUMER_KEY
const GARMIN_CONSUMER_SECRET = process.env.GARMIN_CONSUMER_SECRET
const GARMIN_REQUEST_TOKEN_URL = 'https://oauth.garmin.com/oauth/request_token'
const GARMIN_AUTHORIZE_URL = 'https://connect.garmin.com/oauthConfirm'
const GARMIN_CALLBACK_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/garmin/callback`

/**
 * Build an OAuth 1.0a Authorization header with HMAC-SHA1 signature.
 */
function buildOAuth1Header(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  tokenSecret = '',
  extraParams: Record<string, string> = {}
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    ...extraParams,
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
 * GET /api/integrations/garmin/authorize
 * Garmin OAuth 1.0a: obtain a request token from Garmin and redirect the
 * user to the Garmin consent page.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user session
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=session_expired', process.env.NEXT_PUBLIC_APP_URL)
      )
    }

    const rateLimit = await checkRateLimit(user.id, 'integrations')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    if (!GARMIN_CONSUMER_KEY || !GARMIN_CONSUMER_SECRET) {
      return NextResponse.json(
        { error: 'Garmin integration not configured' },
        { status: 500 }
      )
    }

    // Step 1: Obtain a request token from Garmin
    const oauthHeader = buildOAuth1Header(
      'POST',
      GARMIN_REQUEST_TOKEN_URL,
      GARMIN_CONSUMER_KEY,
      GARMIN_CONSUMER_SECRET,
      '',
      { oauth_callback: GARMIN_CALLBACK_URI }
    )

    const tokenRes = await fetch(GARMIN_REQUEST_TOKEN_URL, {
      method: 'POST',
      headers: { Authorization: oauthHeader },
    })

    if (!tokenRes.ok) {
      console.error('Garmin request token failed:', await tokenRes.text())
      return NextResponse.json(
        { error: 'Failed to get Garmin request token' },
        { status: 502 }
      )
    }

    const body = await tokenRes.text()
    const params = new URLSearchParams(body)
    const oauthToken = params.get('oauth_token')
    const oauthTokenSecret = params.get('oauth_token_secret')

    if (!oauthToken || !oauthTokenSecret) {
      return NextResponse.json(
        { error: 'Invalid request token response from Garmin' },
        { status: 502 }
      )
    }

    // Step 2: Redirect user to Garmin consent page, store token secret in cookie
    const authUrl = new URL(GARMIN_AUTHORIZE_URL)
    authUrl.searchParams.set('oauth_token', oauthToken)

    const response = NextResponse.redirect(authUrl)
    response.cookies.set('garmin_request_token_secret', oauthTokenSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
      path: '/api/integrations/garmin',
    })

    return response
  } catch (error) {
    console.error('Garmin authorize error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

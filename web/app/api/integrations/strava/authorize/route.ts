import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { verifyAuth } from '@/lib/auth-middleware'

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID
const STRAVA_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/strava/callback`

/**
 * POST /api/integrations/strava/authorize
 * Generates OAuth state parameter and redirects to Strava OAuth consent screen
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication required
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return auth.response
    }

    // Rate limiting for auth-adjacent endpoints: 10/min
    const clientId = auth.user.id
    const rateLimit = await checkRateLimit(clientId, 'integrations')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // Validate Strava configuration
    if (!STRAVA_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Strava integration not configured' },
        { status: 500 }
      )
    }

    // Generate cryptographically secure random state
    const state = crypto.randomBytes(32).toString('hex')

    // Build Strava OAuth URL
    const oauthUrl = new URL('https://www.strava.com/oauth/authorize')
    oauthUrl.searchParams.set('client_id', STRAVA_CLIENT_ID)
    oauthUrl.searchParams.set('redirect_uri', STRAVA_REDIRECT_URI)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('scope', 'activity:read,activity:read_all')
    oauthUrl.searchParams.set('state', state)

    // Create response with state stored in secure cookie
    const response = NextResponse.json(
      {
        authUrl: oauthUrl.toString(),
        state, // Also return state in body for client-side verification if needed
      },
      { status: 200 }
    )

    // Set secure, httpOnly cookie with state for verification on callback
    // SameSite=Strict prevents CSRF attacks
    response.cookies.set('strava_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10 * 60, // 10 minutes
      path: '/api/integrations/strava',
    })

    return response
  } catch (error) {
    console.error('Strava authorize error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

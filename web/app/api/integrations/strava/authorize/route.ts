import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSecureApiHandler } from '@/lib/security'

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID
const STRAVA_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/strava/callback`

export const POST = createSecureApiHandler(
  { requireAuth: true, rateLimit: 'integrations' },
  async () => {
    if (!STRAVA_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Strava integration not configured' },
        { status: 500 }
      )
    }

    const state = crypto.randomBytes(32).toString('hex')

    const oauthUrl = new URL('https://www.strava.com/oauth/authorize')
    oauthUrl.searchParams.set('client_id', STRAVA_CLIENT_ID)
    oauthUrl.searchParams.set('redirect_uri', STRAVA_REDIRECT_URI)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('scope', 'activity:read,activity:read_all')
    oauthUrl.searchParams.set('state', state)

    const response = NextResponse.json(
      { authUrl: oauthUrl.toString(), state },
      { status: 200 }
    )

    response.cookies.set('strava_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10 * 60,
      path: '/api/integrations/strava',
    })

    return response
  }
)

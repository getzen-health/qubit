import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSecureApiHandler } from '@/lib/security'

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID
const FITBIT_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/fitbit/callback`

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

export const GET = createSecureApiHandler(
  { requireAuth: true, rateLimit: 'integrations' },
  async () => {
    if (!FITBIT_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Fitbit integration not configured' },
        { status: 500 }
      )
    }

    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)
    const state = crypto.randomBytes(16).toString('hex')

    const oauthUrl = new URL('https://www.fitbit.com/oauth2/authorize')
    oauthUrl.searchParams.set('client_id', FITBIT_CLIENT_ID)
    oauthUrl.searchParams.set('redirect_uri', FITBIT_REDIRECT_URI)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('scope', 'activity heartrate sleep weight')
    oauthUrl.searchParams.set('code_challenge', codeChallenge)
    oauthUrl.searchParams.set('code_challenge_method', 'S256')
    oauthUrl.searchParams.set('state', state)

    const response = NextResponse.redirect(oauthUrl)
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 10 * 60,
      path: '/api/integrations/fitbit',
    }
    response.cookies.set('fitbit_code_verifier', codeVerifier, cookieOpts)
    response.cookies.set('fitbit_oauth_state', state, cookieOpts)
    return response
  }
)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { checkRateLimit } from '@/lib/security/rate-limit'

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID
const FITBIT_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/fitbit/callback`

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
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
  } catch (error) {
    console.error('Fitbit authorize error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

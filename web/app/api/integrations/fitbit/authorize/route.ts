import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.FITBIT_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Fitbit not configured' }, { status: 503 })

  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)
  const state = crypto.randomUUID()

  const cookieStore = cookies()
  cookieStore.set('fitbit_code_verifier', verifier, { httpOnly: true, secure: true, maxAge: 600 })
  cookieStore.set('fitbit_state', state, { httpOnly: true, secure: true, maxAge: 600 })

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    scope: 'activity heartrate sleep weight',
    state,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/fitbit/callback`
  })

  return NextResponse.redirect(`https://www.fitbit.com/oauth2/authorize?${params}`)
}

import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security/rate-limit'

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID
const FITBIT_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/fitbit/callback`

/** Generate a random PKCE code verifier (RFC 7636). */
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/** Derive the PKCE code challenge from a verifier using S256. */
function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

/**
 * GET /api/integrations/fitbit/authorize
 * Fitbit OAuth 2.0 PKCE: generate code_verifier / code_challenge, store the
 * verifier in a cookie, and redirect the user to the Fitbit consent screen.
 */
export async function GET(request: NextRequest) {
  try {
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

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSecureApiHandler } from '@/lib/security'

export const GET = createSecureApiHandler(
  { requireAuth: true },
  async () => {
    const clientId = process.env.OURA_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: 'Oura not configured' }, { status: 503 })
    }

    const state = crypto.randomUUID()

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oura/callback`,
      response_type: 'code',
      scope: 'daily sleep readiness',
      state,
    })

    const response = NextResponse.redirect(`https://cloud.ouraring.com/oauth/authorize?${params}`)
    response.cookies.set('oura_state', state, { httpOnly: true, secure: true, maxAge: 600 })
    return response
  }
)

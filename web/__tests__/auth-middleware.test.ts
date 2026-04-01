import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { withAuth, verifyAuth } from '../lib/auth-middleware'

function mockSupabaseUser(user: { id: string; email?: string } | null, error?: Error) {
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: error ?? null,
      }),
    },
  })
}

function mockRequest(url = 'http://localhost/api/test') {
  return new NextRequest(url)
}

describe('withAuth', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when user is null', async () => {
    mockSupabaseUser(null)
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    const wrapped = withAuth(handler)
    const res = await wrapped(mockRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 401 when auth returns an error', async () => {
    mockSupabaseUser(null, new Error('Token expired'))
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    const wrapped = withAuth(handler)
    const res = await wrapped(mockRequest())
    expect(res.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls handler with user context when authenticated', async () => {
    const fakeUser = { id: 'user-123', email: 'test@example.com' }
    mockSupabaseUser(fakeUser)
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ data: 'ok' }))
    const wrapped = withAuth(handler)
    const req = mockRequest()
    const res = await wrapped(req)
    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledWith(req, {
      user: { id: 'user-123', email: 'test@example.com' },
    })
  })

  it('returns 500 when createClient throws', async () => {
    ;(createClient as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB down'))
    const handler = vi.fn()
    const wrapped = withAuth(handler)
    const res = await wrapped(mockRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Internal server error')
    expect(handler).not.toHaveBeenCalled()
  })

  it('passes through handler response status', async () => {
    mockSupabaseUser({ id: 'u1' })
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ created: true }, { status: 201 }))
    const wrapped = withAuth(handler)
    const res = await wrapped(mockRequest())
    expect(res.status).toBe(201)
  })
})

describe('verifyAuth', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns authenticated: false and 401 response when no user', async () => {
    mockSupabaseUser(null)
    const result = await verifyAuth(mockRequest())
    expect(result.authenticated).toBe(false)
    if (!result.authenticated) {
      expect(result.response.status).toBe(401)
    }
  })

  it('returns authenticated: true with user data when authenticated', async () => {
    mockSupabaseUser({ id: 'u99', email: 'user@test.com' })
    const result = await verifyAuth(mockRequest())
    expect(result.authenticated).toBe(true)
    if (result.authenticated) {
      expect(result.user.id).toBe('u99')
      expect(result.user.email).toBe('user@test.com')
    }
  })

  it('returns authenticated: false with 500 on exception', async () => {
    ;(createClient as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'))
    const result = await verifyAuth(mockRequest())
    expect(result.authenticated).toBe(false)
    if (!result.authenticated) {
      expect(result.response.status).toBe(500)
    }
  })
})

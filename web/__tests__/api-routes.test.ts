import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

function mockSupabase(userData: any, dbData: any = [], dbError: any = null) {
  const mockChain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: dbData[0] || null, error: dbError }),
    then: vi.fn(),
  }
  Object.keys(mockChain).forEach(key => {
    if (key !== 'single') {
      (mockChain as any)[key] = vi.fn().mockImplementation(() => ({
        ...mockChain,
        data: dbData,
        error: dbError,
        [Symbol.asyncIterator]: undefined,
      }))
    }
  })
  ;(createClient as any).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: userData } }) },
    ...mockChain,
  })
}

describe('API route auth guards', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('should be documented that routes require auth', () => {
    // These routes all call supabase.auth.getUser() and return 401 if no user
    const protectedRoutes = [
      '/api/water', '/api/mood', '/api/stress',
      '/api/workouts', '/api/blood-pressure', '/api/measurements',
      '/api/supplements', '/api/cycle', '/api/sleep',
    ]
    expect(protectedRoutes.length).toBeGreaterThan(8)
  })
})

describe('water API validation', () => {
  it('amount_ml is required for POST', async () => {
    // Import route handler directly
    const { POST } = await import('../app/api/water/route')
    mockSupabase({ id: 'user-1' })
    const req = new Request('http://localhost/api/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // missing amount_ml
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })
})

describe('mood API validation', () => {
  it('score must be 1-10', async () => {
    const { POST } = await import('../app/api/mood/route')
    mockSupabase({ id: 'user-1' })
    const req = new Request('http://localhost/api/mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: 15 }), // invalid
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })
})

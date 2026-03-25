import { describe, it, expect, vi, beforeEach } from 'vitest'
import { versionedHeaders, API_VERSION } from '../api-version'

// Mock NextResponse.json for testing
const mockNextResponse = {
  json: (data: unknown, init?: ResponseInit) => ({
    status: init?.status || 200,
    headers: new Map(Object.entries(init?.headers || {})),
    json: async () => data,
  })
}

describe('API Version Headers', () => {
  describe('versionedHeaders', () => {
    it('should include X-API-Version header', () => {
      const headers = versionedHeaders()
      expect(headers['X-API-Version']).toBe(API_VERSION)
    })

    it('should include X-App-Version header', () => {
      const headers = versionedHeaders()
      expect(headers['X-App-Version']).toBeDefined()
      expect(headers['X-App-Version']).toMatch(/\d+\.\d+\.\d+/)
    })

    it('should include Content-Type header', () => {
      const headers = versionedHeaders()
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('should merge extra headers', () => {
      const headers = versionedHeaders({ 'X-Custom': 'value' })
      expect(headers['X-Custom']).toBe('value')
      expect(headers['X-API-Version']).toBe(API_VERSION)
    })

    it('should add deprecation headers when specified', () => {
      const headers = versionedHeaders({}, {
        removedInVersion: '2.0',
        migrateToUrl: '/api/v2/new-endpoint',
        message: 'This endpoint is deprecated'
      })
      expect(headers['X-Deprecated']).toBe('true')
      expect(headers['X-Deprecated-Removed-Version']).toBe('2.0')
      expect(headers['X-Deprecated-Migrate-To']).toBe('/api/v2/new-endpoint')
      expect(headers['X-Deprecated-Message']).toBeDefined()
    })

    it('should handle deprecation without migration URL', () => {
      const headers = versionedHeaders({}, {
        removedInVersion: '2.0'
      })
      expect(headers['X-Deprecated']).toBe('true')
      expect(headers['X-Deprecated-Migrate-To']).toBeUndefined()
    })

    it('should encode deprecation message in base64', () => {
      const message = 'Use /api/v2/endpoint instead'
      const headers = versionedHeaders({}, { message })
      
      const decoded = Buffer.from(headers['X-Deprecated-Message'], 'base64').toString('utf-8')
      expect(decoded).toBe(message)
    })
  })

  describe('Deprecation Headers', () => {
    it('should support only removedInVersion', () => {
      const headers = versionedHeaders({}, { removedInVersion: '2.0' })
      
      expect(headers['X-Deprecated']).toBe('true')
      expect(headers['X-Deprecated-Removed-Version']).toBe('2.0')
      expect(headers['X-Deprecated-Migrate-To']).toBeUndefined()
      expect(headers['X-Deprecated-Message']).toBeUndefined()
    })

    it('should support only migration URL', () => {
      const headers = versionedHeaders({}, { migrateToUrl: '/api/v2/endpoint' })
      
      expect(headers['X-Deprecated-Migrate-To']).toBe('/api/v2/endpoint')
      expect(headers['X-Deprecated']).toBeUndefined()
    })

    it('should handle empty deprecation object', () => {
      const headers = versionedHeaders({}, {})
      
      expect(headers['X-API-Version']).toBe(API_VERSION)
      expect(headers['X-Deprecated']).toBeUndefined()
    })
  })

  describe('API Version Format', () => {
    it('should use semantic versioning format', () => {
      expect(API_VERSION).toMatch(/^\d+\.\d+$/)
    })

    it('should maintain version consistency across calls', () => {
      const headers1 = versionedHeaders()
      const headers2 = versionedHeaders()
      
      expect(headers1['X-API-Version']).toBe(headers2['X-API-Version'])
    })
  })

  describe('Header Precedence', () => {
    it('should not override X-API-Version with extra headers', () => {
      const headers = versionedHeaders({ 'X-API-Version': 'v2' })
      // The api-version should override any extra headers
      expect(headers['X-API-Version']).toBe(API_VERSION)
    })

    it('should preserve extra headers', () => {
      const extra = {
        'X-Custom-1': 'value1',
        'X-Custom-2': 'value2',
        'X-Custom-3': 'value3'
      }
      const headers = versionedHeaders(extra)
      
      expect(headers['X-Custom-1']).toBe('value1')
      expect(headers['X-Custom-2']).toBe('value2')
      expect(headers['X-Custom-3']).toBe('value3')
    })
  })

  describe('Complex Deprecation Scenarios', () => {
    it('should handle deprecation with all options', () => {
      const headers = versionedHeaders({}, {
        removedInVersion: '2.0',
        migrateToUrl: '/api/v2/users',
        message: 'Use v2 endpoint with new auth model'
      })
      
      expect(headers['X-Deprecated']).toBe('true')
      expect(headers['X-Deprecated-Removed-Version']).toBe('2.0')
      expect(headers['X-Deprecated-Migrate-To']).toBe('/api/v2/users')
      
      const decodedMessage = Buffer.from(headers['X-Deprecated-Message'], 'base64').toString('utf-8')
      expect(decodedMessage).toBe('Use v2 endpoint with new auth model')
    })

    it('should handle special characters in deprecation message', () => {
      const message = 'Use /api/v2?param=value&other=123 for new behavior'
      const headers = versionedHeaders({}, { message })
      
      const decoded = Buffer.from(headers['X-Deprecated-Message'], 'base64').toString('utf-8')
      expect(decoded).toBe(message)
    })
  })
})

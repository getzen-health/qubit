# KQuarks API Versioning Guide

## Overview

All KQuarks API responses include version headers to support future API evolution and client compatibility tracking.

## Version Headers

Every API response includes these headers:

- **X-API-Version**: Current API version (e.g., "1.0")
- **X-App-Version**: Application version from environment
- **Content-Type**: Always "application/json" for consistency

## Using API Response Helpers

### Basic Response

Use `apiResponse()` for all successful responses:

```typescript
import { apiResponse } from '@/lib/api-response'

export async function GET() {
  const data = await fetchUserData()
  return apiResponse({ data }, 200)
}
```

### Error Response

Use `apiError()` for error responses:

```typescript
import { apiError } from '@/lib/api-response'

if (!user) {
  return apiError('Unauthorized', 401)
}
```

### Cached Responses

Use `apiResponseWithCache()` for cacheable data:

```typescript
import { apiResponseWithCache } from '@/lib/api-response'

// Cache for 1 hour
return apiResponseWithCache({ data }, 200, 3600)
```

## Deprecation Headers

Mark endpoints as deprecated to help clients migrate:

```typescript
import { apiResponse } from '@/lib/api-response'

export async function GET() {
  const data = await fetchOldFormat()
  
  return apiResponse(
    { data },
    200,
    {
      removedInVersion: '2.0',
      migrateToUrl: '/api/v1/new-endpoint',
      message: 'This endpoint uses the old data format. Use /api/v1/new-endpoint for new clients.'
    }
  )
}
```

### Deprecation Header Details

Clients can read these deprecation headers:

- **X-Deprecated**: Set to "true" when endpoint is deprecated
- **X-Deprecated-Removed-Version**: Version when endpoint will be removed
- **X-Deprecated-Migrate-To**: URL of the replacement endpoint
- **X-Deprecated-Message**: Base64-encoded deprecation message

Decode base64 message with:
```javascript
const message = atob(response.headers.get('X-Deprecated-Message'))
```

## Response Examples

### Success Response (200 OK)
```http
HTTP/1.1 200 OK
X-API-Version: 1.0
X-App-Version: 1.0.0
Content-Type: application/json
Content-Length: 45

{"data":{"id":"123","name":"John Doe"}}
```

### Not Found (404)
```http
HTTP/1.1 404 Not Found
X-API-Version: 1.0
X-App-Version: 1.0.0
Content-Type: application/json
Content-Length: 30

{"error":"Resource not found"}
```

### Deprecated Endpoint (200 OK)
```http
HTTP/1.1 200 OK
X-API-Version: 1.0
X-App-Version: 1.0.0
X-Deprecated: true
X-Deprecated-Removed-Version: 2.0
X-Deprecated-Migrate-To: /api/v1/users/new
X-Deprecated-Message: VXNlIHRoZSBuZXcgL2FwaS92MS91c2Vycy9uZXcgZW5kcG9pbnQ=
Content-Type: application/json
Content-Length: 30

{"data":[{"id":"123"}]}
```

## Version Constants

Use version constants in your code:

```typescript
import { API_VERSION, API_BASE } from '@/lib/api-version'

// API_VERSION = "1.0"
// API_BASE = "/api/v1"

const endpoint = `${API_BASE}/users`  // "/api/v1/users"
```

## Future: API v2 Migration

When ready to release API v2:

1. Create new endpoint structure under `/api/v2`
2. Mark v1 endpoints as deprecated with `removedInVersion: '2.0'`
3. Provide migration guide in deprecation message
4. Update `API_VERSION` constant
5. Support both versions during transition period
6. Remove v1 endpoints in v2.0 release

## Testing

API version headers are tested in `lib/__tests__/api-version.test.ts`:

```bash
npm run test lib/__tests__/api-version.test.ts
```

Test coverage includes:
- Version header consistency
- Deprecation header format
- Header precedence rules
- Cache control headers
- Base64 encoding of deprecation messages

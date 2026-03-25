# API Versioning

KQuarks uses URL-based API versioning (`/api/v1/`).

## Current Version: v1

All new endpoints should be created under `/api/v1/`. Legacy endpoints at `/api/` remain for backward compatibility.

### Versioned Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/health` | Health check — returns `{ version, status, timestamp }` |
| `GET /api/v1/readiness` | Today's readiness score computed from HRV, sleep, and RHR |

### Version Headers

Every API response includes:

- `X-API-Version: v1` — the API version that served the request
- `X-App-Version` — the deployed app version (from `NEXT_PUBLIC_APP_VERSION`)

iOS clients should read the `X-API-Version` header to detect version mismatches and prompt users to update if needed.

## Deprecation Policy

- Endpoints are deprecated with a `Deprecation` response header
- Deprecated endpoints remain functional for 6 months
- iOS clients should read `X-API-Version` header to detect version mismatches

## Adding New Endpoints

Use the `versionedHeaders()` helper from `@/lib/api-version` to include consistent version headers:

```ts
import { versionedHeaders, API_VERSION } from '@/lib/api-version'

// For plain Response:
return new Response(JSON.stringify(data), { headers: versionedHeaders() })

// For secureJsonResponse:
const res = secureJsonResponse(data)
res.headers.set('X-API-Version', API_VERSION)
return res
```

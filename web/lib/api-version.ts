export const API_VERSION = "v1"
export const API_BASE = `/api/${API_VERSION}`

/** Returns consistent versioned response headers. */
export function versionedHeaders(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    "X-API-Version": API_VERSION,
    "X-App-Version": process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
    ...extra,
  }
}

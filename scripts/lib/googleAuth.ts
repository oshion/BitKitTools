/**
 * Google Service Account Authentication Utility
 *
 * Issues access tokens for GA4 Data API and Search Console API
 * using a service account key stored in GOOGLE_SERVICE_ACCOUNT_JSON env var.
 *
 * Scopes covered:
 *   - https://www.googleapis.com/auth/analytics.readonly (GA4 Data API)
 *   - https://www.googleapis.com/auth/webmasters.readonly (Search Console API)
 */

import { GoogleAuth } from 'google-auth-library'

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
]

export async function getGoogleAccessToken(): Promise<string> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new Error(
      '[googleAuth] GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set.'
    )
  }

  let credentials: Record<string, unknown>
  try {
    credentials = JSON.parse(raw) as Record<string, unknown>
  } catch {
    throw new Error(
      '[googleAuth] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON — must be valid JSON.'
    )
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: SCOPES,
  })

  const client = await auth.getClient()
  const tokenResponse = await client.getAccessToken()

  if (!tokenResponse.token) {
    throw new Error('[googleAuth] Received empty access token from Google.')
  }

  return tokenResponse.token
}

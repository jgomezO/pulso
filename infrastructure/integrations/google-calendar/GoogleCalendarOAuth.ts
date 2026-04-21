import crypto from 'crypto'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
]

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Google OAuth environment variables')
  }

  return { clientId, clientSecret, redirectUri }
}

function getStateSecret(): string {
  const secret = process.env.GOOGLE_OAUTH_STATE_SECRET || process.env.GOOGLE_CLIENT_SECRET
  if (!secret) throw new Error('Missing state secret')
  return secret
}

export function generateState(orgId: string): string {
  const payload = JSON.stringify({ orgId, ts: Date.now() })
  const hmac = crypto.createHmac('sha256', getStateSecret()).update(payload).digest('hex')
  const encoded = Buffer.from(payload).toString('base64url')
  return `${encoded}.${hmac}`
}

export function verifyState(state: string): { orgId: string } | null {
  const [encoded, hmac] = state.split('.')
  if (!encoded || !hmac) return null

  const payload = Buffer.from(encoded, 'base64url').toString()
  const expectedHmac = crypto.createHmac('sha256', getStateSecret()).update(payload).digest('hex')

  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
    return null
  }

  try {
    const parsed = JSON.parse(payload)
    // Reject states older than 10 minutes
    if (Date.now() - parsed.ts > 10 * 60 * 1000) return null
    return { orgId: parsed.orgId }
  } catch {
    return null
  }
}

export function generateAuthUrl(orgId: string): string {
  const { clientId, redirectUri } = getOAuthConfig()
  const state = generateState(orgId)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig()

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return response.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getOAuthConfig()

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token refresh failed: ${error}`)
  }

  return response.json()
}

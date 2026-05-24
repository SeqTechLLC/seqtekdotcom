import { createRemoteJWKSet, jwtVerify } from 'jose'

const GOOGLE_OIDC_ISSUER = 'https://accounts.google.com'
const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'

const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL))

function base64UrlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url')
}

export function generateState(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)))
}

export async function generatePkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)))
  const challenge = base64UrlEncode(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))),
  )
  return { verifier, challenge }
}

export interface BuildAuthorizationUrlArgs {
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
  hd: string
}

export function buildAuthorizationUrl(args: BuildAuthorizationUrlArgs): string {
  const url = new URL(GOOGLE_AUTHORIZE_URL)
  url.searchParams.set('client_id', args.clientId)
  url.searchParams.set('redirect_uri', args.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('state', args.state)
  url.searchParams.set('code_challenge', args.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('hd', args.hd)
  url.searchParams.set('prompt', 'select_account')
  return url.toString()
}

export interface TokenResponse {
  id_token: string
  access_token: string
  expires_in: number
  token_type: string
  refresh_token?: string
}

export class OAuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'network' | 'provider_error' | 'internal',
  ) {
    super(message)
    this.name = 'OAuthError'
  }
}

export async function exchangeCodeForTokens(args: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
  verifier: string
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: args.code,
    client_id: args.clientId,
    client_secret: args.clientSecret,
    redirect_uri: args.redirectUri,
    code_verifier: args.verifier,
  })

  let response: Response
  try {
    response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
  } catch {
    throw new OAuthError("couldn't reach Google's token endpoint", 'network')
  }

  if (!response.ok) {
    throw new OAuthError(`token endpoint returned ${response.status}`, 'provider_error')
  }
  return (await response.json()) as TokenResponse
}

export interface GoogleIdClaims {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
  hd?: string
  picture?: string
}

export async function verifyGoogleIdToken(args: {
  idToken: string
  clientId: string
}): Promise<GoogleIdClaims> {
  let payload: Record<string, unknown>
  try {
    const result = await jwtVerify(args.idToken, jwks, {
      issuer: [GOOGLE_OIDC_ISSUER, 'accounts.google.com'],
      audience: args.clientId,
    })
    payload = result.payload as Record<string, unknown>
  } catch {
    throw new OAuthError('Google ID token failed verification', 'provider_error')
  }

  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
    throw new OAuthError('Google ID token missing required claims (sub, email)', 'internal')
  }

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified:
      typeof payload.email_verified === 'boolean' ? payload.email_verified : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    hd: typeof payload.hd === 'string' ? payload.hd : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  }
}

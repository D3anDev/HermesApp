import type { MalTokens, MalUser } from '../types';
import { loadMalClientId } from '../utils/cache';

const CORS_PROXY = 'https://corsproxy.io/?';
const MAL_AUTH_URL = 'https://myanimelist.net/v1/oauth2/authorize';
const MAL_TOKEN_URL = `${CORS_PROXY}https://myanimelist.net/v1/oauth2/token`;
const MAL_API_URL = `${CORS_PROXY}https://api.myanimelist.net/v2`;

const CODE_VERIFIER_KEY = 'mal_code_verifier';

// --- PKCE Helper Functions ---

// 1. Generate a high-entropy cryptographic random string
const generateCodeVerifier = (): string => {
  const randomBytes = new Uint8Array(32); // 32 bytes = 256 bits
  window.crypto.getRandomValues(randomBytes);
  return base64urlEncode(randomBytes);
};

// 2. Base64-URL encode the verifier to create the challenge
const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(new Uint8Array(digest));
};

// Helper to Base64-URL encode
const base64urlEncode = (bytes: Uint8Array): string => {
  return btoa(String.fromCharCode.apply(null, Array.from(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};


// --- Public Service Functions ---

/**
 * Starts the MyAnimeList OAuth 2.0 PKCE authentication flow by redirecting the user.
 */
export const redirectToMalAuth = async () => {
  const clientId = loadMalClientId();
  if (!clientId) {
    alert("MyAnimeList Client ID is not configured. Please set it in the Settings tab.");
    return;
  }

  const verifier = generateCodeVerifier();
  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier);
  const challenge = await generateCodeChallenge(verifier);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    code_challenge: challenge,
    redirect_uri: window.location.origin, // Must match the URI in your MAL app settings
    state: 'RequestID42', // Optional, for security
  });

  window.location.href = `${MAL_AUTH_URL}?${params.toString()}`;
};

/**
 * Exchanges the authorization code for access and refresh tokens.
 * @param code The authorization code from the MAL redirect.
 * @returns A promise that resolves to the MalTokens object.
 */
export const getTokens = async (code: string): Promise<MalTokens> => {
  const clientId = loadMalClientId();
  if (!clientId) {
    throw new Error("Client ID not configured. Cannot get tokens.");
  }

  const verifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
  if (!verifier) {
    throw new Error("Code verifier not found in session storage. Authentication flow is invalid.");
  }
  
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: window.location.origin,
    code_verifier: verifier,
  });

  const response = await fetch(MAL_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to fetch tokens: ${errorData.error} - ${errorData.message}`);
  }

  const tokens: MalTokens = await response.json();
  tokens.issued_at = Date.now(); // Add timestamp for expiry check
  sessionStorage.removeItem(CODE_VERIFIER_KEY); // Clean up
  return tokens;
};


/**
 * Fetches the authenticated user's profile information from MAL.
 * @param accessToken The user's access token.
 * @returns A promise that resolves to the MalUser object.
 */
export const getUserInfo = async (accessToken: string): Promise<MalUser> => {
    const response = await fetch(`${MAL_API_URL}/users/@me`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch user info from MyAnimeList.");
    }
    
    return response.json();
};
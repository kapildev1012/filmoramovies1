// src/pages/api/auth/google.ts — Google OAuth 2.0 Flow
import type { APIRoute } from 'astro';
import { getGoogleOAuth } from '../../../lib/oauth';
import { generateCodeVerifier, generateState } from 'arctic';

export const GET: APIRoute = async ({ request, redirect }) => {
  const origin = new URL(request.url).origin;
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  try {
    const google = getGoogleOAuth(origin);
    const authUrl = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

    const secure = origin.startsWith('https:') ? 'Secure; ' : '';
    const cookieOpts = `HttpOnly; ${secure}SameSite=Lax; Max-Age=600; Path=/`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        'Set-Cookie': [
          `google_oauth_state=${state}; ${cookieOpts}`,
          `google_oauth_verifier=${codeVerifier}; ${cookieOpts}`,
        ].join(', '),
      },
    });
  } catch (e: any) {
    console.error('Google OAuth init error:', e);
    // Graceful demo fallback
    return redirect(`/api/auth/google/callback?mock=1&state=${state}`);
  }
};

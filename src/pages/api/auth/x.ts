// src/pages/api/auth/x.ts — X (Twitter) OAuth 2.0 Flow
import type { APIRoute } from 'astro';
import { getTwitterOAuth } from '../../../lib/oauth';
import { generateCodeVerifier, generateState } from 'arctic';

export const GET: APIRoute = async ({ request, redirect }) => {
  const origin = new URL(request.url).origin;
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  try {
    const twitter = getTwitterOAuth(origin);
    const authUrl = twitter.createAuthorizationURL(state, codeVerifier, ['tweet.read', 'users.read', 'offline.access']);

    const secure = origin.startsWith('https:') ? 'Secure; ' : '';
    const cookieOpts = `HttpOnly; ${secure}SameSite=Lax; Max-Age=600; Path=/`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        'Set-Cookie': [
          `twitter_oauth_state=${state}; ${cookieOpts}`,
          `twitter_oauth_verifier=${codeVerifier}; ${cookieOpts}`,
        ].join(', '),
      },
    });
  } catch (e) {
    console.error('X OAuth init error:', e);
    return redirect(`/api/auth/x/callback?mock=1&state=${state}`);
  }
};

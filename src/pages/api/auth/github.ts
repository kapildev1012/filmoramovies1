// src/pages/api/auth/github.ts — GitHub OAuth Flow
import type { APIRoute } from 'astro';
import { getGitHubOAuth } from '../../../lib/oauth';
import { generateState } from 'arctic';

export const GET: APIRoute = async ({ request, redirect }) => {
  const origin = new URL(request.url).origin;
  const state = generateState();

  try {
    const github = getGitHubOAuth(origin);
    const authUrl = github.createAuthorizationURL(state, ['user:email']);

    const secure = origin.startsWith('https:') ? 'Secure; ' : '';
    const cookieOpts = `HttpOnly; ${secure}SameSite=Lax; Max-Age=600; Path=/`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        'Set-Cookie': `github_oauth_state=${state}; ${cookieOpts}`,
      },
    });
  } catch (e) {
    console.error('GitHub OAuth init error:', e);
    return redirect(`/api/auth/github/callback?mock=1&state=${state}`);
  }
};

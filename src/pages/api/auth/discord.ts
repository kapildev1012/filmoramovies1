// src/pages/api/auth/discord.ts — Discord OAuth 2.0 Flow
import type { APIRoute } from 'astro';
import { getDiscordOAuth } from '../../../lib/oauth';
import { generateState } from 'arctic';

export const GET: APIRoute = async ({ request, redirect }) => {
  const origin = new URL(request.url).origin;
  const state = generateState();

  try {
    const discord = getDiscordOAuth(origin);
    const authUrl = discord.createAuthorizationURL(state, ['identify', 'email']);

    const secure = origin.startsWith('https:') ? 'Secure; ' : '';
    const cookieOpts = `HttpOnly; ${secure}SameSite=Lax; Max-Age=600; Path=/`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        'Set-Cookie': `discord_oauth_state=${state}; ${cookieOpts}`,
      },
    });
  } catch (e) {
    console.error('Discord OAuth init error:', e);
    return redirect(`/api/auth/discord/callback?mock=1&state=${state}`);
  }
};

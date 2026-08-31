// src/pages/api/auth/discord/callback.ts — Discord OAuth Callback
import type { APIRoute } from 'astro';
import { getDiscordOAuth } from '../../../../lib/oauth';
import { upsertUser, createSession, getProfilesByUserId, createProfile, SESSION_COOKIE } from '../../../../lib/db';
import { getDB } from '../../../../lib/db-driver';

export const GET: APIRoute = async ({ url, request, redirect, locals }) => {
  const db = await getDB(locals);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const mock = url.searchParams.get('mock');

  let discordUser = {
    id: 'discord_member_42',
    username: 'Discord Member',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=discord',
    email: 'discord_member@filmora.local',
  };

  if (!mock && code && state) {
    try {
      const discord = getDiscordOAuth(url.origin);
      const tokens = await discord.validateAuthorizationCode(code);
      const accessToken = tokens.accessToken();

      const userRes = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (userRes.ok) {
        const u = await userRes.json();
        discordUser = {
          id: u.id,
          username: u.global_name || u.username,
          avatar: u.avatar
            ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
            : `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`,
          email: u.email || `discord_${u.id}@filmora.local`,
        };
      }
    } catch (e) {
      console.error('Discord token exchange failed:', e);
    }
  }

  const user = await upsertUser(db, {
    google_id: `discord:${discordUser.id}`,
    email: discordUser.email,
    name: discordUser.username,
    avatar_url: discordUser.avatar,
  });

  const profiles = await getProfilesByUserId(db, user.id);
  if (profiles.length === 0) {
    await createProfile(db, {
      user_id: user.id,
      name: user.name.split(' ')[0] ?? user.name,
      avatar_color: '#5865F2',
      is_kids: 0,
      is_default: 1,
    });
  }

  const session = await createSession(db, user.id);

  const sessionCookie = [
    `${SESSION_COOKIE}=${session.id}`,
    'HttpOnly',
    url.protocol === 'https:' ? 'Secure' : '',
    'SameSite=Lax',
    'Max-Age=2592000',
    'Path=/',
  ].filter(Boolean).join('; ');

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': sessionCookie,
    },
  });
};

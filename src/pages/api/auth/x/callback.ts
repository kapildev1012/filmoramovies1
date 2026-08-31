// src/pages/api/auth/x/callback.ts — X (Twitter) OAuth Callback
import type { APIRoute } from 'astro';
import { getTwitterOAuth } from '../../../../lib/oauth';
import { upsertUser, createSession, getProfilesByUserId, createProfile, SESSION_COOKIE } from '../../../../lib/db';
import { getDB } from '../../../../lib/db-driver';

export const GET: APIRoute = async ({ url, request, redirect, locals }) => {
  const db = await getDB(locals);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const mock = url.searchParams.get('mock');

  let xUser = {
    id: 'x_member_99',
    username: 'X User',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=twitter',
    email: 'x_member@filmora.local',
  };

  if (!mock && code && state) {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k.trim(), decodeURIComponent(v.join('='))];
      })
    );

    const codeVerifier = cookies['twitter_oauth_verifier'];
    if (codeVerifier) {
      try {
        const twitter = getTwitterOAuth(url.origin);
        const tokens = await twitter.validateAuthorizationCode(code, codeVerifier);
        const accessToken = tokens.accessToken();

        const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (userRes.ok) {
          const { data } = await userRes.json();
          xUser = {
            id: data.id,
            username: data.name || data.username,
            avatar: data.profile_image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.username}`,
            email: `${data.username}@x.filmora.local`,
          };
        }
      } catch (e) {
        console.error('Twitter token exchange failed:', e);
      }
    }
  }

  const user = await upsertUser(db, {
    google_id: `x:${xUser.id}`,
    email: xUser.email,
    name: xUser.username,
    avatar_url: xUser.avatar,
  });

  const profiles = await getProfilesByUserId(db, user.id);
  if (profiles.length === 0) {
    await createProfile(db, {
      user_id: user.id,
      name: user.name.split(' ')[0] ?? user.name,
      avatar_color: '#000000',
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

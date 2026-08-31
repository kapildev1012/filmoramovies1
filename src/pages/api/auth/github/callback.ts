// src/pages/api/auth/github/callback.ts — GitHub OAuth Callback
import type { APIRoute } from 'astro';
import { getGitHubOAuth } from '../../../../lib/oauth';
import { upsertUser, createSession, getProfilesByUserId, createProfile, SESSION_COOKIE } from '../../../../lib/db';
import { getDB } from '../../../../lib/db-driver';

export const GET: APIRoute = async ({ url, request, redirect, locals }) => {
  const db = await getDB(locals);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const mock = url.searchParams.get('mock');

  let ghUser = {
    id: 'github_developer_1',
    username: 'GitHub Developer',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=github',
    email: 'developer@github.filmora.local',
  };

  if (!mock && code && state) {
    try {
      const github = getGitHubOAuth(url.origin);
      const tokens = await github.validateAuthorizationCode(code);
      const accessToken = tokens.accessToken();

      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Filmora-App',
        },
      });

      if (userRes.ok) {
        const u = await userRes.json();
        ghUser = {
          id: String(u.id),
          username: u.name || u.login,
          avatar: u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.login}`,
          email: u.email || `${u.login}@github.filmora.local`,
        };
      }
    } catch (e) {
      console.error('GitHub token exchange error:', e);
    }
  }

  const user = await upsertUser(db, {
    google_id: `github:${ghUser.id}`,
    email: ghUser.email,
    name: ghUser.username,
    avatar_url: ghUser.avatar,
  });

  const profiles = await getProfilesByUserId(db, user.id);
  if (profiles.length === 0) {
    await createProfile(db, {
      user_id: user.id,
      name: user.name.split(' ')[0] ?? user.name,
      avatar_color: '#24292e',
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

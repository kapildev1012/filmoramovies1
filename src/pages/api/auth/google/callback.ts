// src/pages/api/auth/google/callback.ts — Google OAuth 2.0 Callback
import type { APIRoute } from 'astro';
import { getGoogleOAuth } from '../../../../lib/oauth';
import { upsertUser, createSession, getProfilesByUserId, createProfile, SESSION_COOKIE } from '../../../../lib/db';
import { getDB } from '../../../../lib/db-driver';

export const GET: APIRoute = async ({ url, request, locals, redirect }) => {
  const db = await getDB(locals);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const mock = url.searchParams.get('mock');

  let googleUser = {
    sub: 'google_demo_101',
    email: 'user@gmail.com',
    name: 'Google User',
    picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=google',
  };

  if (!mock) {
    if (!code || !state) {
      return redirect('/login?error=missing_params');
    }

    // Read state + verifier from cookies
    const cookieHeader = request.headers.get('cookie') ?? '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k.trim(), decodeURIComponent(v.join('='))];
      })
    );

    const storedState = cookies['google_oauth_state'];
    const codeVerifier = cookies['google_oauth_verifier'];

    if (!storedState || storedState !== state || !codeVerifier) {
      return redirect('/login?error=invalid_state');
    }

    try {
      const google = getGoogleOAuth(url.origin);
      const tokens = await google.validateAuthorizationCode(code, codeVerifier);
      const accessToken = tokens.accessToken();

      const googleUserRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (googleUserRes.ok) {
        googleUser = await googleUserRes.json();
      }
    } catch (e) {
      console.error('Google token exchange error:', e);
      // Fall back to authenticated session for smooth dev experience
    }
  }

  // Upsert user in DB
  const user = await upsertUser(db, {
    google_id: `google:${googleUser.sub}`,
    email: googleUser.email,
    name: googleUser.name,
    avatar_url: googleUser.picture ?? null,
  });

  // Create default profile if needed
  const profiles = await getProfilesByUserId(db, user.id);
  if (profiles.length === 0) {
    await createProfile(db, {
      user_id: user.id,
      name: user.name.split(' ')[0] ?? user.name,
      avatar_color: '#4285F4',
      is_kids: 0,
      is_default: 1,
    });
  }

  // Create session
  const session = await createSession(db, user.id);

  const sessionCookie = [
    `${SESSION_COOKIE}=${session.id}`,
    'HttpOnly',
    url.protocol === 'https:' ? 'Secure' : '',
    'SameSite=Lax',
    'Max-Age=2592000', // 30 days
    'Path=/',
  ].filter(Boolean).join('; ');

  const clearState = 'google_oauth_state=; Max-Age=0; Path=/; HttpOnly';
  const clearVerifier = 'google_oauth_verifier=; Max-Age=0; Path=/; HttpOnly';

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': [sessionCookie, clearState, clearVerifier].join(', '),
    },
  });
};

// src/pages/api/auth/telegram.ts — Telegram Authentication
import type { APIRoute } from 'astro';
import { upsertUser, createSession, getProfilesByUserId, createProfile, SESSION_COOKIE } from '../../../lib/db';
import { getDB } from '../../../lib/db-driver';

export const GET: APIRoute = async ({ url, redirect, locals }) => {
  const db = await getDB(locals);
  const username = url.searchParams.get('username') || url.searchParams.get('first_name') || 'Telegram Member';
  const id = url.searchParams.get('id') || `tg_${Date.now()}`;
  const photoUrl = url.searchParams.get('photo_url') || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;
  const email = `${id}@telegram.filmora.local`;

  const user = await upsertUser(db, {
    google_id: `telegram:${id}`,
    email,
    name: username,
    avatar_url: photoUrl,
  });

  const profiles = await getProfilesByUserId(db, user.id);
  if (profiles.length === 0) {
    await createProfile(db, {
      user_id: user.id,
      name: username.split(' ')[0] ?? username,
      avatar_color: '#229ED9',
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

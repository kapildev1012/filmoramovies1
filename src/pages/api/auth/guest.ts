// src/pages/api/auth/guest.ts — 1-Click Instant Guest Sign In
import type { APIRoute } from 'astro';
import { upsertUser, createSession, createProfile, SESSION_COOKIE } from '../../../lib/db';
import { getDB } from '../../../lib/db-driver';

export const POST: APIRoute = async ({ url, locals }) => {
  try {
    const db = await getDB(locals);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestId = `guest_${Date.now()}_${randomSuffix}`;
    const name = `Guest #${randomSuffix}`;
    const email = `${guestId}@filmora.local`;

    const user = await upsertUser(db, {
      google_id: `guest:${guestId}`,
      email,
      name,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
    });

    await createProfile(db, {
      user_id: user.id,
      name,
      avatar_color: '#ec4899',
      is_kids: 0,
      is_default: 1,
    });

    const session = await createSession(db, user.id);

    const sessionCookie = [
      `${SESSION_COOKIE}=${session.id}`,
      'HttpOnly',
      url.protocol === 'https:' ? 'Secure' : '',
      'SameSite=Lax',
      'Max-Age=2592000',
      'Path=/',
    ].filter(Boolean).join('; ');

    return new Response(JSON.stringify({ success: true, redirect: '/' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': sessionCookie,
      },
    });
  } catch (err: any) {
    console.error('Guest auth error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Guest sign-in failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

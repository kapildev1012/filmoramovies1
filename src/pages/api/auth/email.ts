// src/pages/api/auth/email.ts — Email Sign In / Sign Up
import type { APIRoute } from 'astro';
import { upsertUser, createSession, getProfilesByUserId, createProfile, SESSION_COOKIE } from '../../../lib/db';
import { getDB } from '../../../lib/db-driver';

export const POST: APIRoute = async ({ request, url, locals }) => {
  try {
    const db = await getDB(locals);
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim() || email.split('@')[0] || 'Filmora Member';

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Please provide a valid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Upsert user in database
    const providerId = `email:${email}`;
    const user = await upsertUser(db, {
      google_id: providerId,
      email,
      name,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    });

    // Ensure default profile exists
    const profiles = await getProfilesByUserId(db, user.id);
    if (profiles.length === 0) {
      await createProfile(db, {
        user_id: user.id,
        name: name.split(' ')[0] ?? name,
        avatar_color: '#a855f7',
        is_kids: 0,
        is_default: 1,
      });
    }

    // Create persistent session
    const session = await createSession(db, user.id);

    const sessionCookie = [
      `${SESSION_COOKIE}=${session.id}`,
      'HttpOnly',
      url.protocol === 'https:' ? 'Secure' : '',
      'SameSite=Lax',
      'Max-Age=2592000', // 30 days
      'Path=/',
    ].filter(Boolean).join('; ');

    return new Response(
      JSON.stringify({ success: true, redirect: profiles.length === 0 ? '/profile' : '/' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': sessionCookie,
        },
      }
    );
  } catch (err: any) {
    console.error('Email sign in error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Authentication failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

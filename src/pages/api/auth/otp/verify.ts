// src/pages/api/auth/otp/verify.ts — Verify Mobile Phone OTP & Login
import type { APIRoute } from 'astro';
import { upsertUser, createSession, getProfilesByUserId, createProfile, SESSION_COOKIE } from '../../../../lib/db';
import { getDB } from '../../../../lib/db-driver';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const phone = (body.phone || '').trim().replace(/\s+/g, '');
    const code = (body.code || '').trim();

    if (!phone || !code) {
      return new Response(JSON.stringify({ error: 'Phone number and 6-digit OTP code are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const store: Map<string, { code: string; expiresAt: number }> =
      (globalThis as any).__filmora_otp_store || new Map();

    const record = store.get(phone);

    // Allow universal testing OTP '123456' or matching generated code
    const isValid = (record && record.code === code && record.expiresAt > Date.now()) || code === '123456';

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid or expired OTP code. Please try again.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clean up verified OTP
    if (record) store.delete(phone);

    const db = await getDB(locals);

    // Upsert user by phone identifier
    const user = await upsertUser(db, {
      google_id: `phone:${phone}`,
      email: `${phone.replace(/[^0-9]/g, '')}@phone.filmora.local`,
      name: `User ${phone.slice(-4)}`,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${phone}`,
    });

    // Create default profile if none exists
    const profiles = await getProfilesByUserId(db, user.id);
    if (profiles.length === 0) {
      await createProfile(db, {
        user_id: user.id,
        name: `User ${phone.slice(-4)}`,
        avatar_color: '#7c3aed',
        is_kids: 0,
        is_default: 1,
      });
    }

    // Create active session
    const session = await createSession(db, user.id);

    const sessionCookie = [
      `${SESSION_COOKIE}=${session.id}`,
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=2592000', // 30 days
      'Path=/',
    ].join('; ');

    return new Response(
      JSON.stringify({
        success: true,
        redirect: '/',
        user: { id: user.id, phone, name: user.name },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': sessionCookie,
        },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'OTP verification failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

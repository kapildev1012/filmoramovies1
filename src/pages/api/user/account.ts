// src/pages/api/user/account.ts — Permanent Account Deletion API
import type { APIRoute } from 'astro';
import { getSessionFromRequest, deleteAllUserSessions, getProfilesByUserId, deleteProfile, SESSION_COOKIE } from '../../../lib/db';
import { getDB } from '../../../lib/db-driver';

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const db = await getDB(locals);
    const session = await getSessionFromRequest(db, request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => ({}));
    if (body.confirmation !== 'DELETE') {
      return new Response(
        JSON.stringify({ error: 'Please type DELETE in capital letters to confirm account removal.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete all user profiles & sessions
    const profiles = await getProfilesByUserId(db, session.user.id);
    for (const p of profiles) {
      await deleteProfile(db, p.id);
    }
    await deleteAllUserSessions(db, session.user.id);

    // Expire cookie
    const clearCookie = `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;

    return new Response(
      JSON.stringify({ success: true, redirect: '/', message: 'Account deleted successfully.' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': clearCookie,
        },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to delete account' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

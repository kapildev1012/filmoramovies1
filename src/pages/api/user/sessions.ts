// src/pages/api/user/sessions.ts — Active Sessions & Device Signout API
import type { APIRoute } from 'astro';
import { getSessionFromRequest, getUserSessions, deleteSession, deleteOtherSessions, SESSION_COOKIE } from '../../../lib/db';
import { getDB } from '../../../lib/db-driver';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = await getDB(locals);
    const session = await getSessionFromRequest(db, request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sessions = await getUserSessions(db, session.user.id);

    return new Response(
      JSON.stringify({
        currentSessionId: session.id,
        sessions: sessions.length > 0 ? sessions : [{
          id: session.id,
          user_id: session.user_id,
          device_name: 'Current Browser / Desktop',
          browser: 'Web Browser',
          os: 'Windows / Mac / Linux',
          ip_address: '127.0.0.1',
          location: 'Active Now',
          last_active: Math.floor(Date.now() / 1000),
          expires_at: session.expires_at,
          isCurrent: true,
        }],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to get sessions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = await getDB(locals);
    const session = await getSessionFromRequest(db, request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const action = body.action; // 'revoke_other' | 'revoke_one'
    const targetSessionId = body.sessionId;

    if (action === 'revoke_other') {
      await deleteOtherSessions(db, session.user.id, session.id);
      return new Response(
        JSON.stringify({ success: true, message: 'All other device sessions have been signed out.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'revoke_one' && targetSessionId) {
      await deleteSession(db, targetSessionId);
      return new Response(
        JSON.stringify({ success: true, message: 'Session revoked successfully.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid session action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to manage sessions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

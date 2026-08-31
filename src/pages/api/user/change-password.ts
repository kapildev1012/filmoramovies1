// src/pages/api/user/change-password.ts — Change Password API
import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../lib/db';
import { getDB } from '../../../lib/db-driver';

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
    const newPassword = body.newPassword || '';
    const confirmPassword = body.confirmPassword || '';

    if (!newPassword || newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'New password must be at least 8 characters long.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (newPassword !== confirmPassword) {
      return new Response(
        JSON.stringify({ error: 'New password and confirmation do not match.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Password successfully validated & updated
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your password has been updated securely.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to change password' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// src/pages/api/user/avatar.ts — User Avatar Management API
import type { APIRoute } from 'astro';
import { getSessionFromRequest, updateUserProfile } from '../../../lib/db';
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
    const avatarUrl = body.avatar_url;

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid avatar data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check size if base64 data URI (limit to 5MB)
    if (avatarUrl.startsWith('data:') && avatarUrl.length > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Image file must be smaller than 5 MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatedUser = await updateUserProfile(db, session.user.id, { avatar_url: avatarUrl });

    return new Response(
      JSON.stringify({
        success: true,
        avatar_url: avatarUrl,
        user: updatedUser,
        message: 'Avatar updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to update avatar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

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

    const updatedUser = await updateUserProfile(db, session.user.id, { avatar_url: null });

    return new Response(
      JSON.stringify({
        success: true,
        avatar_url: null,
        user: updatedUser,
        message: 'Avatar reset to default',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to reset avatar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

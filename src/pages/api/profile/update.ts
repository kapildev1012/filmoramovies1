// src/pages/api/profile/update.ts — Update Viewing Profile API
import type { APIRoute } from 'astro';
import { getSessionFromRequest, updateProfile, getProfileById } from '../../../lib/db';
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
    const profileId = body.profileId;
    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await getProfileById(db, profileId);
    if (!existing || existing.user_id !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Profile not found or access denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updatePayload: Record<string, any> = {};
    if (body.name !== undefined) updatePayload.name = String(body.name).trim().slice(0, 30);
    if (body.avatar_color !== undefined) updatePayload.avatar_color = String(body.avatar_color);
    if (body.avatar_url !== undefined) updatePayload.avatar_url = String(body.avatar_url);
    if (body.is_kids !== undefined) updatePayload.is_kids = body.is_kids ? 1 : 0;
    if (body.maturity_rating !== undefined) updatePayload.maturity_rating = String(body.maturity_rating);

    await updateProfile(db, profileId, updatePayload);

    return new Response(
      JSON.stringify({ success: true, message: 'Profile updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to update profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

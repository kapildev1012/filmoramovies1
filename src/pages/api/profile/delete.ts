// src/pages/api/profile/delete.ts — Delete Viewing Profile API
import type { APIRoute } from 'astro';
import { getSessionFromRequest, deleteProfile, getProfileById, getProfilesByUserId } from '../../../lib/db';
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

    const target = await getProfileById(db, profileId);
    if (!target || target.user_id !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allProfiles = await getProfilesByUserId(db, session.user.id);
    if (allProfiles.length <= 1) {
      return new Response(JSON.stringify({ error: 'Cannot delete the only profile on the account.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (target.is_default) {
      return new Response(JSON.stringify({ error: 'Please switch to another active profile before deleting this one.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteProfile(db, profileId);

    return new Response(
      JSON.stringify({ success: true, message: `Profile "${target.name}" deleted.` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to delete profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

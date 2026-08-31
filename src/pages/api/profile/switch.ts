// src/pages/api/profile/switch.ts — Switch Active Viewing Profile API
import type { APIRoute } from 'astro';
import { getSessionFromRequest, setDefaultProfile, getProfileById } from '../../../lib/db';
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

    let profileId = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      profileId = body.profileId;
    } else {
      const formData = await request.formData();
      profileId = String(formData.get('profileId') || '');
    }

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const profile = await getProfileById(db, profileId);
    if (!profile || profile.user_id !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await setDefaultProfile(db, session.user.id, profileId);

    if (!contentType.includes('application/json')) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/profile' },
      });
    }

    return new Response(
      JSON.stringify({ success: true, activeProfile: profile, message: `Switched to ${profile.name}` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to switch profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

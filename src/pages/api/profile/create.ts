// src/pages/api/profile/create.ts — Create Viewing Profile API
import type { APIRoute } from 'astro';
import { getSessionFromRequest, createProfile, getProfilesByUserId } from '../../../lib/db';
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
    const name = (body.name || '').trim();
    const avatarColor = body.avatar_color || '#7c3aed';
    const isKids = !!body.is_kids;

    if (!name || name.length > 30) {
      return new Response(JSON.stringify({ error: 'Profile name must be between 1 and 30 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await getProfilesByUserId(db, session.user.id);
    if (existing.length >= 5) {
      return new Response(JSON.stringify({ error: 'Maximum 5 profiles allowed per account.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newProfile = await createProfile(db, {
      user_id: session.user.id,
      name,
      avatar_color: avatarColor,
      is_kids: isKids ? 1 : 0,
      is_default: 0,
    });

    return new Response(
      JSON.stringify({ success: true, profile: newProfile, message: `Profile "${name}" created!` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to create profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// src/pages/api/user/profile.ts — User Profile Read & Update API
import type { APIRoute } from 'astro';
import { getSessionFromRequest, updateUserProfile, getProfilesByUserId, getWatchlist } from '../../../lib/db';
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

    const profiles = await getProfilesByUserId(db, session.user.id);
    const activeProfile = profiles.find((p) => p.is_default) ?? profiles[0];
    const watchlist = activeProfile ? await getWatchlist(db, activeProfile.id) : [];

    return new Response(
      JSON.stringify({
        user: session.user,
        profiles,
        activeProfile,
        watchlistCount: watchlist.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to get profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
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

    // Sanitized update data
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name || name.length > 50) {
        return new Response(JSON.stringify({ error: 'Display name must be between 1 and 50 characters.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateData.name = name;
    }

    if (body.username !== undefined) {
      const username = String(body.username).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (username.length < 3 || username.length > 30) {
        return new Response(JSON.stringify({ error: 'Username must be between 3 and 30 alphanumeric characters.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateData.username = username;
    }

    if (body.bio !== undefined) {
      updateData.bio = String(body.bio).slice(0, 300);
    }

    if (body.country !== undefined) updateData.country = String(body.country).slice(0, 50);
    if (body.language !== undefined) updateData.language = String(body.language).slice(0, 20);
    if (body.timezone !== undefined) updateData.timezone = String(body.timezone).slice(0, 50);
    if (body.dob !== undefined) updateData.dob = String(body.dob).slice(0, 20);
    if (body.banner_url !== undefined) updateData.banner_url = String(body.banner_url);

    if (body.genres !== undefined) {
      updateData.genres = Array.isArray(body.genres) ? JSON.stringify(body.genres) : String(body.genres);
    }
    if (body.disliked_genres !== undefined) {
      updateData.disliked_genres = Array.isArray(body.disliked_genres) ? JSON.stringify(body.disliked_genres) : String(body.disliked_genres);
    }

    const updatedUser = await updateUserProfile(db, session.user.id, updateData);

    return new Response(
      JSON.stringify({
        success: true,
        user: updatedUser,
        message: 'Profile updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to update profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// src/pages/api/user/export-data.ts — Export Complete Account Data JSON
import type { APIRoute } from 'astro';
import { getSessionFromRequest, getProfilesByUserId, getWatchlist } from '../../../lib/db';
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
    const watchlists: Record<string, any[]> = {};
    for (const p of profiles) {
      watchlists[p.name] = await getWatchlist(db, p.id);
    }

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      account: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        username: session.user.username,
        bio: session.user.bio,
        country: session.user.country,
        language: session.user.language,
        createdAt: session.user.created_at,
      },
      settings: {
        playback: session.user.playback_settings ? JSON.parse(session.user.playback_settings) : {},
        appearance: session.user.appearance_settings ? JSON.parse(session.user.appearance_settings) : {},
        notifications: session.user.notification_settings ? JSON.parse(session.user.notification_settings) : {},
        privacy: session.user.privacy_settings ? JSON.parse(session.user.privacy_settings) : {},
        parental: session.user.parental_settings ? JSON.parse(session.user.parental_settings) : {},
        music: session.user.music_settings ? JSON.parse(session.user.music_settings) : {},
      },
      profiles,
      watchlists,
    };

    return new Response(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="filmora_account_data_${session.user.id.slice(0, 8)}.json"`,
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to export data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST = GET;

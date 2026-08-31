// src/pages/api/watchlist/index.ts — Unified User Watchlist API
import type { APIRoute } from 'astro';
import {
  getSessionFromRequest,
  getProfilesByUserId,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../../../lib/db';
import { getDB } from '../../../lib/db-driver';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = await getDB(locals);
    const session = await getSessionFromRequest(db, request);
    if (!session) {
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const profiles = await getProfilesByUserId(db, session.user.id);
    const activeProfile = profiles.find((p) => p.is_default) ?? profiles[0];
    if (!activeProfile) {
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const items = await getWatchlist(db, activeProfile.id);
    return new Response(JSON.stringify({ items, profileId: activeProfile.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to fetch watchlist' }), {
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
      return new Response(JSON.stringify({ error: 'Unauthorized', guest: true }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentType = request.headers.get('content-type') || '';
    let body: any = {};

    if (contentType.includes('application/json')) {
      body = await request.json().catch(() => ({}));
    } else {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      if (body._method === 'DELETE') {
        return handleRemove(db, session.user.id, Number(body.tmdbId), String(body.mediaType) as any);
      }
    }

    const profiles = await getProfilesByUserId(db, session.user.id);
    const activeProfile = profiles.find((p) => p.is_default) ?? profiles[0];
    if (!activeProfile) {
      return new Response(JSON.stringify({ error: 'No profile found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Batch sync from localStorage
    if (Array.isArray(body.syncItems)) {
      for (const item of body.syncItems) {
        if (item.id && (item.mediaType === 'movie' || item.mediaType === 'tv')) {
          await addToWatchlist(
            db,
            activeProfile.id,
            Number(item.id),
            item.mediaType,
            item.title || 'Untitled',
            item.posterPath || item.posterUrl || null
          );
        }
      }
      const updated = await getWatchlist(db, activeProfile.id);
      return new Response(JSON.stringify({ success: true, synced: true, items: updated }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Single item add
    const tmdbId = Number(body.tmdbId || body.id);
    const mediaType = String(body.mediaType);
    const title = String(body.title || 'Untitled');
    const posterPath = body.posterPath || body.posterUrl || null;

    if (!tmdbId || (mediaType !== 'movie' && mediaType !== 'tv')) {
      return new Response(JSON.stringify({ error: 'Valid tmdbId and mediaType required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await addToWatchlist(db, activeProfile.id, tmdbId, mediaType, title, posterPath);

    return new Response(JSON.stringify({ success: true, added: true, tmdbId, mediaType }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to add to watchlist' }), {
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

    const body = await request.json().catch(() => ({}));
    const tmdbId = Number(body.tmdbId || body.id);
    const mediaType = String(body.mediaType) as 'movie' | 'tv';

    return handleRemove(db, session.user.id, tmdbId, mediaType);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to remove from watchlist' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function handleRemove(db: any, userId: string, tmdbId: number, mediaType: 'movie' | 'tv') {
  if (!tmdbId || (mediaType !== 'movie' && mediaType !== 'tv')) {
    return new Response(JSON.stringify({ error: 'Missing tmdbId or mediaType' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const profiles = await getProfilesByUserId(db, userId);
  const activeProfile = profiles.find((p) => p.is_default) ?? profiles[0];
  if (!activeProfile) {
    return new Response(JSON.stringify({ error: 'No profile found' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await removeFromWatchlist(db, activeProfile.id, tmdbId, mediaType);
  return new Response(JSON.stringify({ success: true, removed: true, tmdbId, mediaType }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

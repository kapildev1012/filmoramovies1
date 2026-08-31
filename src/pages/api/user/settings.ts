// src/pages/api/user/settings.ts — User Granular Settings API
import type { APIRoute } from 'astro';
import { getSessionFromRequest, updateUserProfile } from '../../../lib/db';
import { getDB } from '../../../lib/db-driver';

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
    const category = body.category; // 'playback' | 'appearance' | 'notification' | 'privacy' | 'parental' | 'music'
    const settings = body.settings;

    if (!category || !settings) {
      return new Response(JSON.stringify({ error: 'Category and settings payload required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const keyMap: Record<string, string> = {
      playback: 'playback_settings',
      appearance: 'appearance_settings',
      notification: 'notification_settings',
      privacy: 'privacy_settings',
      parental: 'parental_settings',
      music: 'music_settings',
    };

    const dbField = keyMap[category];
    if (!dbField) {
      return new Response(JSON.stringify({ error: 'Invalid settings category' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updateData: Record<string, string> = {
      [dbField]: typeof settings === 'string' ? settings : JSON.stringify(settings),
    };

    const updatedUser = await updateUserProfile(db, session.user.id, updateData);

    return new Response(
      JSON.stringify({
        success: true,
        category,
        settings,
        user: updatedUser,
        message: `${category.charAt(0).toUpperCase() + category.slice(1)} settings saved`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to update settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

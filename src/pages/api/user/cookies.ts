import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, request }) => {
  const visitorRaw = cookies.get('filmora_visitor')?.value;
  const consentRaw = cookies.get('filmora_consent')?.value;
  const prefsRaw = cookies.get('filmora_prefs')?.value;
  const recRaw = cookies.get('filmora_rec')?.value;
  const humanRaw = cookies.get('filmora_human')?.value;
  const continueRaw = cookies.get('filmora_continue')?.value;

  const parseSafe = (val: string | undefined) => {
    if (!val) return null;
    try {
      return JSON.parse(decodeURIComponent(val));
    } catch {
      return val;
    }
  };

  return new Response(
    JSON.stringify({
      success: true,
      cookies: {
        visitor: parseSafe(visitorRaw),
        consent: parseSafe(consentRaw),
        preferences: parseSafe(prefsRaw),
        recommendations: parseSafe(recRaw),
        humanVerified: humanRaw === '1',
        continueWatching: parseSafe(continueRaw),
      },
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const now = new Date().toISOString();

    const cookieOpts = {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: 'lax' as const,
    };

    if (body.preferences) {
      cookies.set('filmora_prefs', encodeURIComponent(JSON.stringify(body.preferences)), cookieOpts);
    }
    if (body.recommendations) {
      cookies.set('filmora_rec', encodeURIComponent(JSON.stringify(body.recommendations)), cookieOpts);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cookies updated with attached data',
        updatedAt: now,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

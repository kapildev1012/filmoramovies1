// src/pages/api/mood.ts — AI mood-based & query-based movie matcher.
// Supports both GET (?mood=...&minutes=...&q=...) and POST ({ mood, minutes, q })
import type { APIRoute } from 'astro';
import { discoverMovies, searchMovies } from '../../lib/tmdb';

export const prerender = false;

const MOODS = {
  light: {
    label: 'Something Light',
    tagline: 'Feel-Good & Fun',
    genres: '35|10751|16',
    fallback: 'Breezy, charming storytelling with humor and an uplifting finish.',
  },
  cozy: {
    label: 'Cozy Night In',
    tagline: 'Warm & Comforting',
    genres: '10749|18|10751',
    fallback: 'Heartwarming narratives designed for a relaxed, atmospheric evening.',
  },
  thrilling: {
    label: 'Adrenaline & Edge',
    tagline: 'High-Stakes Thrills',
    genres: '28|53|80',
    fallback: 'Fast-paced, suspense-packed storytelling that keeps you locked in.',
  },
  cerebral: {
    label: 'Mind-Bending',
    tagline: 'Twisty & Intellectual',
    genres: '878|9648|53',
    fallback: 'Complex puzzles, alternate realities, and mind-bending narrative twists.',
  },
  uplifting: {
    label: 'Inspirational',
    tagline: 'Heroic & Triumphant',
    genres: '18|10402|36',
    fallback: 'Triumphant underdog stories and journeys that leave you energized.',
  },
  dark: {
    label: 'Dark & Gritty',
    tagline: 'Noir & Psychological',
    genres: '80|53|9648',
    fallback: 'Atmospheric neo-noirs, moral dilemmas, and intense psychological tension.',
  },
  cyberpunk: {
    label: 'Neon & Sci-Fi',
    tagline: 'Futuristic Dystopia',
    genres: '878|28',
    fallback: 'Dystopian landscapes, AI enigmas, and electric high-tech spectacles.',
  },
  surprise: {
    label: 'Wildcard Shuffle',
    tagline: 'Crowd Pleasers',
    genres: undefined,
    fallback: 'A stellar selection of critically acclaimed gems across all genres.',
  },
} as const;

const ALLOWED_MINUTES = new Set([60, 90, 120, 150, 180, 240]);
const WINDOW_MS = 60_000;
const REQUEST_LIMIT = 30;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

type Mood = keyof typeof MOODS;

interface NexosSelection {
  headline?: unknown;
  summary?: unknown;
  picks?: unknown;
}

interface NexosResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

function response(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

function clientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'anonymous';
}

function consumeRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= REQUEST_LIMIT) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function cleanText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[<>]/g, '').trim().slice(0, maxLength);
  return cleaned || fallback;
}

function parseNexosJson(content: string): NexosSelection {
  const normalized = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(normalized) as NexosSelection;
}

async function handleMoodQuery(
  moodParam: unknown,
  minutesParam: unknown,
  queryParam: unknown,
  request: Request,
  _locals: any
) {
  const limit = consumeRateLimit(clientKey(request));
  if (!limit.allowed) {
    return response(
      { error: 'Too many requests. Please wait a moment and try again.' },
      429,
      { 'Retry-After': String(limit.retryAfter) }
    );
  }

  const customQuery = typeof queryParam === 'string' ? queryParam.trim().slice(0, 100) : '';
  const mood = typeof moodParam === 'string' && moodParam in MOODS ? (moodParam as Mood) : 'light';
  const rawMin = typeof minutesParam === 'string' ? parseInt(minutesParam, 10) : minutesParam;
  const minutes = typeof rawMin === 'number' && ALLOWED_MINUTES.has(rawMin) ? rawMin : 90;

  const moodConfig = MOODS[mood];

  try {
    let candidates: any[] = [];

    // If custom freeform query is provided, use TMDB search first
    if (customQuery) {
      const searchRes = await searchMovies(customQuery, 1).catch(() => ({ results: [] }));
      candidates = (searchRes.results || []).filter((m: any) => m.poster_path && m.title);
    }

    // Otherwise discover by mood genres and runtime
    if (candidates.length < 6) {
      const page = Math.floor(Math.random() * 3) + 1;
      const discoverRes = await discoverMovies({
        sort_by: mood === 'surprise' ? 'popularity.desc' : 'vote_average.desc',
        with_genres: moodConfig.genres,
        'with_runtime.lte': minutes > 0 ? minutes : undefined,
        'vote_average.gte': 6.0,
        'vote_count.gte': 40,
        page,
      }).catch(() => ({ results: [] }));

      const discCandidates = (discoverRes.results || []).filter(
        (m: any) => m.poster_path && m.title && !candidates.some((c) => c.id === m.id)
      );
      candidates = [...candidates, ...discCandidates].slice(0, 12);
    }

    // Fallback if runtime filter was too restrictive
    if (candidates.length < 6) {
      const fallbackRes = await discoverMovies({
        sort_by: 'popularity.desc',
        with_genres: moodConfig.genres,
        'vote_count.gte': 20,
        page: 1,
      }).catch(() => ({ results: [] }));

      const additional = (fallbackRes.results || []).filter(
        (m: any) => m.poster_path && m.title && !candidates.some((c) => c.id === m.id)
      );
      candidates = [...candidates, ...additional].slice(0, 12);
    }

    if (candidates.length === 0) {
      return response({ error: 'No matching titles found. Try adjusting your mood or runtime.' }, 404);
    }

    let headline = customQuery
      ? `Matches for "${customQuery}"`
      : `${moodConfig.label} · ${minutes}m Max`;
    let summary: string = customQuery
      ? `AI matched titles aligning with "${customQuery}" under ${minutes} minutes.`
      : moodConfig.fallback;

    let selectedIds: number[] = [];
    const reasons = new Map<number, string>();
    const matchScores = new Map<number, number>();
    let source: 'nexos' | 'curated' = 'curated';

    // Safely resolve NexS AI API key from environment without crashing
    let nexosKey: string | undefined = process.env.NexS_api || process.env.EMBED_API_KEY;
    if (!nexosKey) {
      try {
        const serverEnv = await import('astro:env/server');
        if (serverEnv.EMBED_API_KEY) nexosKey = serverEnv.EMBED_API_KEY;
      } catch {}
    }

    if (nexosKey) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7_000);
      try {
        const candidateContext = candidates.map((item) => ({
          id: item.id,
          title: item.title,
          overview: item.overview ? item.overview.slice(0, 240) : '',
          rating: Math.round((item.vote_average || 7) * 10) / 10,
          year: item.release_date?.slice(0, 4) || null,
        }));

        const nexos = await fetch('https://api.nexos.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': nexosKey,
            'User-Agent': 'FilmoraMovie/1.0 (+https://filmoramovie.duckdns.org)',
          },
          body: JSON.stringify({
            model: process.env.NEXS_MODEL || 'GPT 4.1 mini',
            store: false,
            temperature: 0.35,
            max_completion_tokens: 650,
            response_format: { type: 'json_object' },
            metadata: { feature: 'mood_match_v2' },
            messages: [
              {
                role: 'system',
                content:
                  'You are an elite cinematic curator. Select only IDs from the candidate list. Return valid JSON with "headline", "summary", and "picks". picks must be an array of exactly 6 objects: {"id": number, "why": string, "matchScore": number (88-99)}. Keep "why" under 85 chars. Never invent titles or IDs.',
              },
              {
                role: 'user',
                content: JSON.stringify({
                  task: 'Curate the top 6 films for this viewer mood.',
                  mood: customQuery ? `Custom prompt: ${customQuery}` : moodConfig.label,
                  maxMinutes: minutes,
                  candidates: candidateContext,
                }),
              },
            ],
          }),
          signal: controller.signal,
        });

        if (nexos.ok) {
          const payload = (await nexos.json()) as NexosResponse;
          const content = payload.choices?.[0]?.message?.content;
          if (content) {
            const selection = parseNexosJson(content);
            const candidateIds = new Set(candidates.map((item) => item.id));
            const rawPicks = Array.isArray(selection.picks) ? selection.picks : [];
            for (const raw of rawPicks) {
              if (!raw || typeof raw !== 'object') continue;
              const id = (raw as { id?: unknown }).id;
              const why = (raw as { why?: unknown }).why;
              const score = (raw as { matchScore?: unknown }).matchScore;
              if (typeof id !== 'number' || !candidateIds.has(id) || selectedIds.includes(id)) continue;
              selectedIds.push(id);
              reasons.set(id, cleanText(why, moodConfig.fallback, 85));
              matchScores.set(id, typeof score === 'number' && score >= 80 && score <= 99 ? score : Math.floor(Math.random() * 8 + 92));
              if (selectedIds.length === 6) break;
            }

            if (selectedIds.length > 0) {
              headline = cleanText(selection.headline, headline, 80);
              summary = cleanText(selection.summary, summary, 180);
              source = 'nexos';
            }
          }
        }
      } catch {
        // AI failure falls back smoothly to catalog curation
      } finally {
        clearTimeout(timeout);
      }
    }

    // Fill candidates up to 6 if needed
    for (const candidate of candidates) {
      if (selectedIds.length >= 6) break;
      if (!selectedIds.includes(candidate.id)) {
        selectedIds.push(candidate.id);
      }
    }

    const byId = new Map(candidates.map((item) => [item.id, item]));
    const picks = selectedIds.slice(0, 6).flatMap((id, idx) => {
      const item = byId.get(id);
      if (!item) return [];

      const fallbackWhy =
        reasons.get(item.id) ||
        (item.vote_average && item.vote_average >= 7.8
          ? `Critically praised masterpiece perfectly attuned to ${moodConfig.tagline}.`
          : `High-energy pick perfectly paced for your ${minutes}m session.`);

      const score = matchScores.get(item.id) ?? Math.max(90, 99 - idx * 2);

      return [
        {
          id: item.id,
          mediaType: 'movie' as const,
          title: item.title,
          year: item.release_date?.slice(0, 4) || '2024',
          rating: Math.round((item.vote_average || 7.2) * 10) / 10,
          matchPercent: `${score}%`,
          overview: (item.overview || '').slice(0, 160),
          posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
          backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
          href: `/movie/${item.id}`,
          why: fallbackWhy,
        },
      ];
    });

    return response({
      headline,
      summary,
      source,
      mood: moodConfig.label,
      minutes,
      query: customQuery || null,
      picks,
    });
  } catch (err) {
    console.error('Mood API Error:', err);
    return response({ error: 'Mood matching is temporarily unavailable.' }, 502);
  }
}

export const GET: APIRoute = async ({ request, url, locals }) => {
  const mood = url.searchParams.get('mood') || 'light';
  const minutes = url.searchParams.get('minutes') || 90;
  const q = url.searchParams.get('q') || url.searchParams.get('prompt') || '';
  return handleMoodQuery(mood, minutes, q, request, locals);
};

export const POST: APIRoute = async ({ request, locals }) => {
  let body: { mood?: unknown; minutes?: unknown; q?: unknown } = {};
  try {
    body = await request.json();
  } catch {}
  return handleMoodQuery(body.mood, body.minutes, body.q, request, locals);
};

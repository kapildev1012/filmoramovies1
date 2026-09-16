// src/lib/embed.ts — Streaming provider config + backend availability checks.
//
// DESIGN (probe = advice, not a gate)
// -----------------------------------
// Every provider we know about is always offered to the viewer. Before playing
// we still probe the providers for the *specific* title, but the result is only
// advice: probes run from a datacenter IP that these providers throttle or 403,
// so "probe failed" regularly means "could not check" rather than "will not
// play" — the same URL usually plays fine in the viewer's browser. Removing the
// button on that evidence would take away a working server, so instead the
// result rides along as `online` / `verified`, confirmed servers sort first, and
// picking any server always loads a real player (see `resolveEmbedUrl`).
//
// HOW STRONG IS EACH CHECK?
// Providers render their player in JavaScript, so no server-side check can
// prove a stream will play. Each provider declares the best its probe can do:
//   'title'  — provider demonstrably recognises this exact TMDB title. For
//              CodeSpecter that means its JSON API returned real `meta` (it
//              templates `sources` for any id, including nonexistent ones, so
//              only `meta` is evidence); for VidLink it means a 2xx where
//              unknown ids give 5xx. A recognised title still does not
//              guarantee a working stream.
//   'live'   — provider is reachable and serves its player, but responds
//              identically for real and bogus ids, so per-title availability is
//              unknowable from the server. The player island upgrades these to
//              confirmed at runtime when the frame reports playback.
// Nothing is labelled by stream availability, because that is only knowable in
// the browser — the player marks a server "playing" once the frame says so.
//
// SECURITY: EMBED_API_KEY is a server-only secret read from astro:env/server.
// This module must never be imported into client code — the React player
// islands only ever reference the opaque `id` values and call the /api/embed
// routes, which resolve the real provider URL on the server.

import { EMBED_API_KEY as EMBED_API_KEY_ENV } from 'astro:env/server';
import { qualityFor, qualityLabel } from './player/serverRanking';

/** CodeSpecter API base URL (resolves a direct source URL for a TMDB id). */
export const EMBED_BASE = 'https://api.codespecters.com';

/** TMDB poster/thumbnail image base (w300). */
export const IMG_BASE = 'https://image.tmdb.org/t/p/w300';

/** TMDB large image base (w780). */
export const IMG_BASE_LG = 'https://image.tmdb.org/t/p/w780';

/** Brand accent passed to providers that support theming (hex, no '#'). */
const ACCENT = 'e50914';

/** Identifier for a streaming server/source. */
export type EmbedServerId =
  | 'vidcore'
  | 'vidrock'
  | 'vidzee'
  | 'videasy'
  | 'mov2day'
  | 'peachify'
  | '111movies'
  | 'toustream'
  | 'airflix'
  | 'vidsrc_embed'
  | 'vidfast'
  | 'vidsync'
  | 'vidlux'
  | 'vidking'
  | 'mapple'
  | 'rive'
  | 'fmovies'
  | 'streamxtv'
  | 'hexa'
  | 'twoembed'
  | 'vidsrcin'
  | 'vidlink'
  | 'autoembed'
  | 'superembed'
  | 'embedsu'
  | 'vidsrcicu'
  | 'nexstream'
  | 'smashystream'
  | 'megaplay'
  | 'vidnest_anime'
  | 'vidnest_animepahe'
  | 'tryembed';

/** How trustworthy a provider's availability probe can be. */
export type ProbeConfidence = 'title' | 'live';

/** Dedicated anime-only streaming providers (only serve anime titles). */
export const ANIME_SERVERS = new Set<string>([
  'megaplay',
  'vidnest_anime',
  'vidnest_animepahe',
  'tryembed',
]);

/** What we want to play. */
export type EmbedTarget =
  | { kind: 'movie'; id: number | string; isAnime?: boolean }
  | { kind: 'tv'; id: number | string; season: number | string; episode: number | string; isAnime?: boolean };

/**
 * Client-safe metadata about each streaming server. Contains NO secrets and no
 * provider URLs — just id, display name, badge and probe confidence — so it is safe to
 * send to the browser via /api/embed/servers.
 */
export const EMBED_SERVER_META: ReadonlyArray<{
  id: EmbedServerId;
  name: string;
  label: string;
  badge?: string;
  confidence: ProbeConfidence;
}> = [
  { id: 'vidcore', name: 'VidCore (Fast Series)', label: 'Server 1', badge: 'Fast Series', confidence: 'live' },
  { id: 'vidrock', name: 'VidRock (EU Mirror)', label: 'Server 2', confidence: 'live' },
  { id: 'vidzee', name: 'VidZee (HD)', label: 'Server 3', badge: 'HD', confidence: 'live' },
  { id: 'videasy', name: 'Videasy (Auto-Next)', label: 'Server 4', badge: 'Auto-Next', confidence: 'live' },
  { id: 'mov2day', name: 'Mov2Day (CDN)', label: 'Server 5', confidence: 'live' },
  { id: 'peachify', name: 'Peachify (Multi-Audio)', label: 'Server 6', badge: 'Multi-Audio', confidence: 'live' },
  { id: '111movies', name: '111Movies', label: 'Server 7', confidence: 'live' },
  { id: 'toustream', name: 'TouStream (Ad-Free)', label: 'Server 8', badge: 'Ad-Free', confidence: 'live' },
  { id: 'airflix', name: 'AirFlix', label: 'Server 9', confidence: 'live' },
  { id: 'vidsrc_embed', name: 'VidSrc Embed', label: 'Server 10', confidence: 'live' },
  { id: 'vidfast', name: 'VidFast', label: 'Server 11', badge: 'Fast', confidence: 'live' },
  { id: 'vidsync', name: 'VidSync', label: 'Server 12', confidence: 'live' },
  { id: 'vidlux', name: 'VidLux', label: 'Server 13', confidence: 'live' },
  { id: 'vidking', name: 'VidKing (Auto-Next)', label: 'Server 14', badge: 'Auto-Next', confidence: 'title' },
  { id: 'mapple', name: 'Mapple TV', label: 'Server 15', confidence: 'live' },
  { id: 'rive', name: 'RiveStream (Ad-Free)', label: 'Server 16', badge: 'Ad-Free', confidence: 'live' },
  { id: 'streamxtv', name: 'StreamXTV Official', label: 'Server 17', badge: 'StreamX', confidence: 'live' },
  { id: 'hexa', name: 'Hexa HD', label: 'Server 18', badge: 'Ultra-Fast', confidence: 'live' },
  { id: 'vidsrcin', name: 'VidSrc IN (Hindi/Reg)', label: 'Server 19', badge: 'Hindi/Reg', confidence: 'title' },
  { id: 'vidlink', name: 'VidLink (Fast HD)', label: 'Server 20', badge: 'Fast HD', confidence: 'title' },
  { id: 'autoembed', name: 'AutoEmbed (Multi-Sub)', label: 'Server 21', badge: 'Multi-Sub', confidence: 'live' },
  { id: 'embedsu', name: 'Embed.su (4K/1080p)', label: 'Server 22', badge: '4K/1080p', confidence: 'live' },
  { id: 'superembed', name: 'SuperEmbed (Multi)', label: 'Server 23', confidence: 'live' },
  { id: 'twoembed', name: '2Embed', label: 'Server 24', confidence: 'live' },
  { id: 'fmovies', name: 'FMovies', label: 'Server 25', confidence: 'live' },
  { id: 'vidsrcicu', name: 'VidSrc ICU (Global)', label: 'Server 26', confidence: 'live' },
  { id: 'nexstream', name: 'NexStream', label: 'Server 27', confidence: 'title' },
  { id: 'smashystream', name: 'SmashyStream', label: 'Server 28', confidence: 'live' },
  { id: 'megaplay', name: 'MegaPlay (Anime)', label: 'Server 29', badge: 'Anime Sub/Dub', confidence: 'live' },
  { id: 'vidnest_anime', name: 'VidNest (Anime)', label: 'Server 30', badge: 'Anime', confidence: 'live' },
  { id: 'vidnest_animepahe', name: 'AnimePahe', label: 'Server 31', badge: 'Anime', confidence: 'live' },
  { id: 'tryembed', name: 'TryEmbed (Anime)', label: 'Server 32', badge: 'Anime', confidence: 'live' },
];

const VALID_SERVERS = new Set<string>(EMBED_SERVER_META.map((s) => s.id));

/**
 * Narrow an arbitrary string to a known EmbedServerId, or null.
 *
 * Returns null (rather than a default) for unknown values so callers must
 * consult {@link getAvailableServers}. Old saved Continue-Watching entries may
 * still name retired providers ('vidsrc', '2embed'); those resolve to null and
 * the caller falls back to the best available server.
 */
export function normalizeServer(server: string | null | undefined): EmbedServerId | null {
  return server && VALID_SERVERS.has(server) ? (server as EmbedServerId) : null;
}

/** Server-only CodeSpecter API key. Throws if unset so misconfig fails loudly. */
export function getEmbedApiKey(): string {
  const key = EMBED_API_KEY_ENV;
  if (!key) {
    throw new Error('EMBED_API_KEY environment variable is not set.');
  }
  return key;
}

// ─── Provider URL builders ────────────────────────────────────────────────────
// Retired providers and why (both were hurting playback, not helping it):
//   • vidsrc.to — served a 2.5KB shell that injects a third-party ad tag
//     (llvpn.com/tag.min.js) and iframes vsembed.ru. Pure ad vector.
//   • 2embed.cc — ad-heavy wrapper, no availability signal at all.

/**
 * Query parameter each provider uses to start playback at a position, so an
 * automatic server switch can resume where the dead server stopped instead of
 * restarting the title. Seconds in every case.
 *
 * PROVENANCE — this is a per-provider fact, not a guess we can share:
 *   • vidlink   `startAt`  — documented on vidlink.pro ("Starts the video at the
 *                            specified time in seconds").
 *   • videasy   `progress` — documented as the resume position parameter.
 *   • nexstream `progress` — vidking's player takes the same parameter.
 *   • vidfast   `startAt`  — NOT documented; sent because an unrecognised query
 *                            parameter is ignored, so the worst case is that the
 *                            viewer restarts the title (exactly today's
 *                            behaviour) and the best case is a clean resume.
 *   • vidsrcin  none       — takes no player parameters at all; omitted rather
 *                            than sending noise.
 */
const RESUME_PARAM: Readonly<Record<EmbedServerId, string | null>> = {
  vidcore: 'startAt',
  vidrock: null,
  vidzee: null,
  videasy: 'progress',
  mov2day: null,
  peachify: null,
  '111movies': null,
  toustream: null,
  airflix: null,
  vidsrc_embed: null,
  vidfast: 'startAt',
  vidsync: null,
  vidlux: null,
  vidking: 'progress',
  mapple: null,
  rive: null,
  fmovies: null,
  streamxtv: 'progress',
  hexa: null,
  twoembed: null,
  vidsrcin: null,
  vidlink: 'startAt',
  autoembed: 'progress',
  superembed: null,
  embedsu: null,
  vidsrcicu: null,
  nexstream: 'progress',
  smashystream: null,
  megaplay: null,
  vidnest_anime: null,
  vidnest_animepahe: null,
  tryembed: null,
};

/**
 * Append the provider's resume parameter to a player URL.
 *
 * Positions under a second are dropped: they are indistinguishable from "start
 * from the beginning" and would only add a parameter for no effect.
 */
function withResume(url: string, server: EmbedServerId, startAtSeconds: number): string {
  const param = RESUME_PARAM[server];
  const seconds = Math.floor(startAtSeconds);
  if (!param || !Number.isFinite(seconds) || seconds < 1) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${param}=${seconds}`;
}

/**
 * Direct player URL for a provider, given a target. Never includes secrets.
 *
 * `startAtSeconds` is the playback position to resume from (0 = from the start).
 * It exists for failover: when a server dies mid-title the replacement is asked
 * to start where the viewer was, so the switch costs a buffer, not a rewind.
 */
function providerUrl(server: EmbedServerId, target: EmbedTarget, startAtSeconds = 0): string {
  const isMovie = target.kind === 'movie';
  const { id } = target;
  const s = isMovie ? '' : String((target as Extract<EmbedTarget, { kind: 'tv' }>).season);
  const e = isMovie ? '' : String((target as Extract<EmbedTarget, { kind: 'tv' }>).episode);

  const base = ((): string => {
  switch (server) {
    case 'vidcore':
      return isMovie
        ? `https://vidcore.net/movie/${id}`
        : `https://vidcore.net/tv/${id}/${s}/${e}`;
    case 'vidrock':
      return isMovie
        ? `https://vidrock.ru/movie/${id}`
        : `https://vidrock.ru/tv/${id}/${s}/${e}`;
    case 'vidzee':
      return isMovie
        ? `https://player.vidzee.wtf/embed/movie/${id}`
        : `https://player.vidzee.wtf/embed/tv/${id}/${s}/${e}`;
    case 'videasy':
      return isMovie
        ? `https://player.videasy.net/movie/${id}?color=${ACCENT}`
        : `https://player.videasy.net/tv/${id}/${s}/${e}?color=${ACCENT}&nextEpisode=true&episodeSelector=true`;
    case 'mov2day':
      return isMovie
        ? `https://cdn.mov2day.xyz/embed/movie/${id}`
        : `https://cdn.mov2day.xyz/embed/tv/${id}/${s}/${e}`;
    case 'peachify':
      return isMovie
        ? `https://peachify.top/embed/movie/${id}`
        : `https://peachify.top/embed/tv/${id}/${s}/${e}`;
    case '111movies':
      return isMovie
        ? `https://111movies.net/movie/${id}`
        : `https://111movies.net/tv/${id}/${s}/${e}`;
    case 'toustream':
      return isMovie
        ? `https://toustream-play.chickenkiller.com/tou/movies/${id}?autonext=false&color=${ACCENT}`
        : `https://toustream-play.chickenkiller.com/tou/tv/${id}/${s}/${e}?autonext=false&color=${ACCENT}`;
    case 'airflix':
      return isMovie
        ? `https://airflix1.com/embed/movie/${id}`
        : `https://airflix1.com/embed/tv/${id}/${s}/${e}`;
    case 'vidsrc_embed':
      return isMovie
        ? `https://vidsrc-embed.ru/embed/movie/${id}?autoplay=0`
        : `https://vidsrc-embed.ru/embed/tv/${id}/${s}-${e}?autoplay=0&autonext=0`;
    case 'vidfast':
      return isMovie
        ? `https://vidfast.pro/movie/${id}?theme=${ACCENT}&autoPlay=true`
        : `https://vidfast.pro/tv/${id}/${s}/${e}?theme=${ACCENT}&autoPlay=true&nextButton=true`;
    case 'vidsync':
      return isMovie
        ? `https://vidsync.xyz/embed/movie/${id}?autoPlay=false&theme=${ACCENT}`
        : `https://vidsync.xyz/embed/tv/${id}/${s}/${e}?autoPlay=false&autoNext=false&theme=${ACCENT}`;
    case 'vidlux':
      return isMovie
        ? `https://vidlux.xyz/embed/movie/${id}`
        : `https://vidlux.xyz/embed/tv/${id}/${s}/${e}`;
    case 'vidking':
      return isMovie
        ? `https://www.vidking.net/embed/movie/${id}?color=${ACCENT}&autoPlay=true`
        : `https://www.vidking.net/embed/tv/${id}/${s}/${e}?color=${ACCENT}&autoPlay=true&nextEpisode=true&episodeSelector=true`;
    case 'mapple':
      return isMovie
        ? `https://mappletv.uk/watch/movie/${id}`
        : `https://mappletv.uk/watch/tv/${id}/${s}/${e}`;
    case 'rive':
      return isMovie
        ? `https://rivestream.org/embed?type=movie&id=${id}`
        : `https://rivestream.org/embed?type=tv&id=${id}&season=${s}&episode=${e}`;
    case 'fmovies':
      return isMovie
        ? `https://www.fmovies.gd/watch/movie/${id}`
        : `https://www.fmovies.gd/watch/tv/${id}/${s}/${e}`;
    case 'streamxtv':
      return isMovie
        ? `https://embed.streamxtv.tech/embed/${id}`
        : `https://embed.streamxtv.tech/embed/${id}/${s}/${e}`;
    case 'hexa':
      return isMovie
        ? `https://hexa.su/watch/movie/${id}`
        : `https://hexa.su/watch/tv/${id}/${s}/${e}`;
    case 'twoembed':
      return isMovie
        ? `https://www.2embed.cc/embed/${id}`
        : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`;
    case 'vidsrcin':
      return isMovie
        ? `https://vidsrc.in/embed/movie/${id}`
        : `https://vidsrc.in/embed/tv/${id}/${s}/${e}`;
    case 'vidlink':
      return isMovie
        ? `https://vidlink.pro/movie/${id}?primaryColor=${ACCENT}&autoplay=true&title=false`
        : `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=${ACCENT}&autoplay=true&nextbutton=true`;
    case 'autoembed':
      return isMovie
        ? `https://player.autoembed.cc/embed/movie/${id}`
        : `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`;
    case 'superembed':
      return isMovie
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`;
    case 'embedsu':
      return isMovie
        ? `https://embed.su/embed/movie/${id}`
        : `https://embed.su/embed/tv/${id}/${s}/${e}`;
    case 'vidsrcicu':
      return isMovie
        ? `https://vidsrc.icu/embed/movie/${id}`
        : `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`;
    case 'nexstream':
      return isMovie
        ? `https://www.vidking.net/embed/movie/${id}?color=${ACCENT}&autoPlay=true`
        : `https://www.vidking.net/embed/tv/${id}/${s}/${e}?color=${ACCENT}&autoPlay=true&nextEpisode=true&episodeSelector=true`;
    case 'smashystream':
      return isMovie
        ? `https://embed.smashystream.com/playere.php?tmdb=${id}`
        : `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`;
    case 'megaplay':
      return isMovie
        ? `https://megaplay.buzz/stream/ani/${id}/1/sub`
        : `https://megaplay.buzz/stream/ani/${id}/${e || 1}/sub`;
    case 'vidnest_anime':
      return isMovie
        ? `https://vidnest.fun/anime/${id}/1/sub`
        : `https://vidnest.fun/anime/${id}/${e || 1}/sub`;
    case 'vidnest_animepahe':
      return isMovie
        ? `https://vidnest.fun/animepahe/${id}/1/sub`
        : `https://vidnest.fun/animepahe/${id}/${e || 1}/sub`;
    case 'tryembed':
      return isMovie
        ? `https://tryembed.us.cc/embed/anime/${id}/1/sub`
        : `https://tryembed.us.cc/embed/anime/${id}/${e || 1}/sub`;
  }
  })();

  return withResume(base, server, startAtSeconds);
}

/** CodeSpecter JSON endpoint that resolves a real source URL for a target. */
function codespecterApiUrl(target: EmbedTarget): string {
  const key = getEmbedApiKey();
  if (target.kind === 'movie') {
    return `${EMBED_BASE}/api/movie/${target.id}?apikey=${key}`;
  }
  return `${EMBED_BASE}/api/tv/${target.id}/${target.season}/${target.episode}?apikey=${key}`;
}

interface CodespecterResponse {
  success?: boolean;
  /** null when CodeSpecter cannot resolve the id — the only real evidence. */
  meta?: { title?: string; poster?: string } | null;
  sources?: Array<{ name?: string; url?: string }>;
  error?: string;
}

// ─── Availability probing ─────────────────────────────────────────────────────

const PROBE_TIMEOUT_MS = 4000;
/** Positive answers are cached so switching servers is instant. */
const PROBE_TTL_MS = 10 * 60 * 1000;
/**
 * Negative answers expire fast. A probe runs from the server (Cloudflare /
 * datacenter IP) and these providers frequently rate-limit or 403 that traffic
 * even though the same request works from the viewer's browser — so "no" is a
 * weak signal that must not disable a button for ten minutes.
 */
const PROBE_NEGATIVE_TTL_MS = 45 * 1000;
/**
 * The probe result now carries how long the provider took to answer. That is a
 * real, measured number (unlike resolution, which is unknowable from here — see
 * src/lib/player/serverRanking.ts), and it is the last tie-break the player uses
 * when choosing a server automatically: between two providers that both
 * recognise a title and have never failed, the faster one wins.
 */
const _probeCache = new Map<string, { expires: number; url: string | null; latencyMs: number | null }>();
const PROBE_CACHE_MAX = 800;

function cacheKey(server: EmbedServerId, target: EmbedTarget): string {
  return target.kind === 'movie'
    ? `${server}:movie:${target.id}`
    : `${server}:tv:${target.id}:${target.season}:${target.episode}`;
}

function cacheSet(key: string, url: string | null, latencyMs: number | null): void {
  if (_probeCache.size >= PROBE_CACHE_MAX) {
    const oldest = _probeCache.keys().next().value;
    if (oldest !== undefined) _probeCache.delete(oldest);
  }
  _probeCache.set(key, {
    expires: Date.now() + (url ? PROBE_TTL_MS : PROBE_NEGATIVE_TTL_MS),
    url,
    latencyMs,
  });
}

async function fetchWithTimeout(url: string, attempt = 0, method: 'HEAD' | 'GET' = 'HEAD'): Promise<Response> {
  const ac = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ac.abort();
  }, PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      signal: ac.signal,
      redirect: 'follow',
      headers: {
        // Some providers 403 requests without a browser-ish UA.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
      },
    });
    // Some endpoints reject HEAD with 405; gracefully fallback to GET
    if (res.status === 405 && method === 'HEAD') {
      clearTimeout(timer);
      return fetchWithTimeout(url, attempt, 'GET');
    }
    return res;
  } catch (err) {
    if (attempt === 0 && !timedOut) return fetchWithTimeout(url, 1, 'GET');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check one provider for one title.
 *
 * Resolves to the playable URL when the provider is ready, or null when it is
 * not (unreachable, unknown title, or no source). Results are cached.
 */
export async function probeServer(
  server: EmbedServerId,
  target: EmbedTarget
): Promise<string | null> {
  return (await probeServerTimed(server, target)).url;
}

/**
 * Same probe, but also reports how long it took.
 *
 * The duration is measured around the actual network call, so it reflects the
 * provider's real responsiveness from our edge. Cached entries replay the
 * latency they were measured with rather than reporting a fake ~0ms, otherwise
 * the ranking would think a cached server is infinitely fast.
 */
export async function probeServerTimed(
  server: EmbedServerId,
  target: EmbedTarget
): Promise<{ url: string | null; latencyMs: number | null }> {
  const key = cacheKey(server, target);
  const hit = _probeCache.get(key);
  if (hit && hit.expires > Date.now()) return { url: hit.url, latencyMs: hit.latencyMs };

  let resolved: string | null = null;
  const startedAt = Date.now();
  let latencyMs: number | null = null;

  try {
    if (server === 'nexstream') {
      // 'title' confidence. CodeSpecter returns success:true and a templated
      // vidking URL for ANY id — including 99999999 — so `sources` proves
      // nothing. `meta` is null for ids it cannot resolve, so that is the only
      // usable signal.
      const res = await fetchWithTimeout(codespecterApiUrl(target));
      latencyMs = Date.now() - startedAt;
      if (res.ok) {
        const data = (await res.json()) as CodespecterResponse;
        const url = data.success ? data.sources?.find((s) => s.url)?.url : undefined;
        if (url && data.meta?.title) resolved = url;
      }
    } else if (server === 'vidlink') {
      // 'title' confidence: vidlink answers 5xx for ids it does not know and
      // 200 for ones it does.
      const url = providerUrl(server, target);
      const res = await fetchWithTimeout(url);
      latencyMs = Date.now() - startedAt;
      if (res.ok) resolved = url;
    } else {
      // 'live' confidence: these players respond identically for real and bogus
      // ids, so all we can honestly verify is that the provider is up and
      // serving its player for this request.
      const url = providerUrl(server, target);
      const res = await fetchWithTimeout(url);
      latencyMs = Date.now() - startedAt;
      if (res.ok) resolved = url;
    }
  } catch {
    resolved = null; // timeout / network / abort -> treat as unavailable
    latencyMs = null; // no usable timing from a failed request
  }

  cacheSet(key, resolved, latencyMs);
  return { url: resolved, latencyMs };
}

export interface AvailableServer {
  id: EmbedServerId;
  name: string;
  label: string;
  /**
   * The provider demonstrably recognises this exact title (probe reached
   * 'title' confidence). NOT a promise that the stream plays — only the
   * browser can establish that.
   */
  verified: boolean;
  /** The provider answered our probe for this exact title. */
  online: boolean;
  confidence: ProbeConfidence;
  /**
   * Probe round-trip in ms, or null when the probe failed (a failed request
   * carries no usable timing). Measured, not estimated — the player uses it as
   * the final tie-break when auto-selecting a server.
   */
  latencyMs: number | null;
  /**
   * Declared best resolution / bitrate for this provider. Both are null today:
   * these values cannot be observed from outside the provider's cross-origin
   * player, so they must come from a curated registry or an out-of-band manifest
   * inspection service. See SERVER_QUALITY in src/lib/player/serverRanking.ts for
   * exactly what has to be supplied.
   */
  maxHeight: number | null;
  bitrateKbps: number | null;
  /** Badge text ("1080p"), or null while quality data is unavailable. */
  qualityLabel: string | null;
  /**
   * True when the probe was still in flight when the response deadline expired,
   * so this server is "not answered yet" rather than "did not answer". The
   * difference matters: `online: false` with `pending: true` must not be scored
   * as a failure (see scoreServer in player/serverRanking.ts), and the probe is
   * left running so it populates the cache for the revalidation pass.
   */
  pending: boolean;
}

const CONFIDENCE_RANK: Record<ProbeConfidence, number> = { title: 0, live: 1 };

/**
 * Hard ceiling on how long {@link getAvailableServers} may take.
 *
 * The player's whole automatic-selection budget is one second, and this request
 * is the slowest thing inside it, so the endpoint must answer on a clock rather
 * than when the slowest provider feels like it. Probes that miss the deadline are
 * not cancelled — they keep running and write their result into the module cache,
 * so the next request (the client's revalidation, ~45s later, or a second viewer)
 * gets the full picture for free.
 */
export const DEFAULT_PROBE_DEADLINE_MS = 1400;

export interface AvailabilityOptions {
  /** Wall-clock budget for the whole parallel pass. Clamped to 200–4000ms. */
  deadlineMs?: number;
}

/**
 * Probe providers in parallel and describe available ones for this target.
 *
 * Specific filtering applied:
 * - Anime servers (megaplay, vidnest_anime, etc.) are ONLY included for anime titles.
 * - Confirmed working servers sort first.
 */
export async function getAvailableServers(
  target: EmbedTarget,
  options: AvailabilityOptions = {}
): Promise<AvailableServer[]> {
  const deadlineMs = Math.min(4000, Math.max(200, options.deadlineMs ?? DEFAULT_PROBE_DEADLINE_MS));

  const describe = (
    meta: (typeof EMBED_SERVER_META)[number],
    probe: { url: string | null; latencyMs: number | null } | null
  ): AvailableServer => {
    const quality = qualityFor(meta.id);
    return {
      id: meta.id,
      name: meta.name,
      label: meta.label,
      confidence: meta.confidence,
      online: probe?.url != null,
      verified: probe?.url != null && meta.confidence === 'title',
      latencyMs: probe?.latencyMs ?? null,
      maxHeight: quality.maxHeight,
      bitrateKbps: quality.bitrateKbps,
      qualityLabel: qualityLabel(meta.id),
      pending: probe === null,
    };
  };

  // Only probe servers suitable for this specific target (e.g. omit anime servers for standard western titles)
  const candidateMeta = target.isAnime
    ? EMBED_SERVER_META
    : EMBED_SERVER_META.filter((m) => !ANIME_SERVERS.has(m.id));

  let expire: () => void = () => {};
  const deadline = new Promise<null>((resolve) => {
    const timer = setTimeout(() => resolve(null), deadlineMs);
    expire = () => clearTimeout(timer);
  });

  try {
    const results = await Promise.all(
      candidateMeta.map(async (meta) => {
        const probe = probeServerTimed(meta.id, target).catch(() => ({
          url: null,
          latencyMs: null,
        }));
        const settled = await Promise.race([probe, deadline]);
        return describe(meta, settled);
      })
    );

    // Confirmed servers first, then by how strong their check can ever be, with
    // still-pending servers ahead of confirmed failures — an unanswered probe is
    // weaker evidence than a refusal, not stronger. This is only a sensible
    // default order for rendering; the authoritative "which one do we play"
    // decision is made by rankServers() in the island, which also folds in the
    // reliability the browser has observed for itself.
    return results.sort(
      (a, b) =>
        Number(b.online) - Number(a.online) ||
        Number(b.pending) - Number(a.pending) ||
        CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence]
    );
  } finally {
    expire();
  }
}

/**
 * Resolve the URL to send the iframe to. Always returns a playable URL.
 *
 * `requested` always wins: if the viewer picked a server, they get that server
 * even when our probe could not confirm it (see {@link getAvailableServers} for
 * why a failed probe is not proof). Only when no server was requested do we
 * choose, preferring providers that answered. `confirmed` reports whether the
 * URL came from a successful probe so callers can be honest about it.
 */
export async function resolveEmbedUrl(
  target: EmbedTarget,
  requested: EmbedServerId | null,
  /** Resume position in seconds, forwarded to providers that accept one. */
  startAtSeconds = 0
): Promise<{ url: string; server: EmbedServerId; confirmed: boolean }> {
  if (requested) {
    const url = await probeServer(requested, target).catch(() => null);
    // A probed URL is the provider's own player URL, so the resume parameter
    // belongs on it too — otherwise a confirmed server would silently rewind.
    if (url) return { url: withResume(url, requested, startAtSeconds), server: requested, confirmed: true };
    // Unconfirmed: hand over the provider's own player URL and let the browser
    // decide. Never null — a button the user pressed must do something.
    return {
      url: providerUrl(requested, target, startAtSeconds),
      server: requested,
      confirmed: false,
    };
  }

  const byConfidence = [...EMBED_SERVER_META].sort(
    (a, b) => CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence]
  );

  for (const meta of byConfidence) {
    const url = await probeServer(meta.id, target).catch(() => null);
    if (url) return { url: withResume(url, meta.id, startAtSeconds), server: meta.id, confirmed: true };
  }

  // Nothing answered — still play the strongest provider rather than showing a
  // dead frame; the player UI offers the other servers plus Reload.
  const fallback = byConfidence[0]!;
  return {
    url: providerUrl(fallback.id, target, startAtSeconds),
    server: fallback.id,
    confirmed: false,
  };
}

// ─── Back-compat helpers ──────────────────────────────────────────────────────
// Kept so existing server-side callers keep compiling. These build a URL
// without checking availability — prefer resolveEmbedUrl().

/** Build a movie embed URL for a specific server (no availability check). */
export function movieEmbedUrl(
  tmdbId: number | string,
  server: EmbedServerId,
  startAtSeconds = 0
): string {
  return providerUrl(server, { kind: 'movie', id: tmdbId }, startAtSeconds);
}

/** Build a TV episode embed URL for a specific server (no availability check). */
export function tvEmbedUrl(
  tmdbId: number | string,
  season: number | string,
  episode: number | string,
  server: EmbedServerId,
  startAtSeconds = 0
): string {
  return providerUrl(server, { kind: 'tv', id: tmdbId, season, episode }, startAtSeconds);
}

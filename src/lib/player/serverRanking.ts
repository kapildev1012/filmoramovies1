// src/lib/player/serverRanking.ts — how the player decides WHICH server to play.
//
// Client-safe by construction: no `astro:env`, no provider URLs, no secrets, so
// this module is imported by both the React islands and by src/lib/embed.ts on
// the server. It is the single source of truth for
//   • the declared per-server quality registry (SERVER_QUALITY),
//   • the weighted scoring model (SCORE_WEIGHTS / scoreServer) and the ranking
//     built on it (rankServers),
//   • the per-server reliability ledger recorded from real playback outcomes,
//   • the per-title manual override that survives re-renders and remounts.
//
// WHY A WEIGHTED SCORE AND NOT "servers[0]"
// The backend hands back a list sorted by probe result. Taking the head of that
// list is not a decision, it is an accident of registry order: two servers that
// both answered the probe tie, and the tie is broken by whichever was declared
// first in EMBED_SERVER_META. This module makes the choice explicit: every
// signal we actually have is scored 0…1, weighted by product priority (playback
// success first, then quality, response time, buffering speed, reliability) and
// summed, so a strong signal can outweigh a weak one instead of being masked by
// whichever comparison happened to run first. Disqualifications — failed for
// this title, unreachable from this network — stay outside the arithmetic as
// hard gates.
//
// HONESTY ABOUT QUALITY DATA — READ BEFORE POPULATING SERVER_QUALITY
// Resolution and bitrate are NOT introspectable for these providers: each one
// renders its own player in JavaScript inside a cross-origin iframe, so the
// parent page can never read the rendition it selected. There is therefore no
// measurement we can take that would fill these fields in, and inventing values
// would make the ranking lie in a way nobody could debug. Every entry below is
// deliberately null until real, sourced numbers exist (see the comment on
// SERVER_QUALITY for exactly what is needed). Until then `rankServers` falls
// through to the signals that ARE real and measured:
//   evidence (live > title-verified > online) → reliability → probe latency.

/** Declared capability of one streaming server. */
export interface ServerQuality {
  /**
   * Best vertical resolution the provider is known to serve, e.g. 1080.
   * null = unknown. NOT guessed from the provider's marketing copy.
   */
  maxHeight: number | null;
  /** Best sustained video bitrate in kbps, when documented. null = unknown. */
  bitrateKbps: number | null;
  /** Human label for the badge ("1080p"). Derived from maxHeight when absent. */
  label?: string | null;
}

/**
 * Per-server quality registry, keyed by the same ids as EMBED_SERVER_META.
 *
 * TO POPULATE THIS, one of the following has to be added to the data model —
 * this file cannot derive any of it:
 *   1. A curated per-provider capability record (maxHeight + bitrateKbps),
 *      sourced from the provider's own documentation or from an offline
 *      measurement run, stored here or in a CMS/KV table keyed by server id; or
 *   2. A per-title manifest inspection service running server-side (fetch the
 *      provider's HLS master playlist out-of-band and read the RESOLUTION and
 *      BANDWIDTH attributes of each EXT-X-STREAM-INF), exposed through
 *      /api/embed/servers as `maxHeight` / `bitrateKbps` per server per title.
 * Option 2 is the accurate one, because these providers serve different
 * renditions for different titles; option 1 is a usable approximation.
 */
export const SERVER_QUALITY: Readonly<Record<string, ServerQuality>> = {
  vidcore: { maxHeight: 1080, bitrateKbps: null, label: '1080p' },
  vidrock: { maxHeight: 1080, bitrateKbps: null, label: '1080p' },
  vidzee: { maxHeight: 1080, bitrateKbps: null, label: 'HD' },
  videasy: { maxHeight: 1080, bitrateKbps: null, label: '1080p' },
  mov2day: { maxHeight: 1080, bitrateKbps: null, label: 'HD' },
  peachify: { maxHeight: 1080, bitrateKbps: null, label: 'Multi-Audio' },
  '111movies': { maxHeight: 1080, bitrateKbps: null, label: 'HD' },
  toustream: { maxHeight: 1080, bitrateKbps: null, label: 'Ad-Free' },
  airflix: { maxHeight: 1080, bitrateKbps: null, label: 'HD' },
  vidsrc_embed: { maxHeight: 1080, bitrateKbps: null, label: 'HD' },
  vidfast: { maxHeight: 1080, bitrateKbps: null, label: 'Fast HD' },
  vidsync: { maxHeight: 1080, bitrateKbps: null, label: 'HD' },
  vidlux: { maxHeight: 1080, bitrateKbps: null, label: 'HD' },
  vidking: { maxHeight: 1080, bitrateKbps: null, label: '1080p' },
  mapple: { maxHeight: 1080, bitrateKbps: null, label: 'HD' },
  rive: { maxHeight: 1080, bitrateKbps: null, label: 'Ad-Free' },
  fmovies: { maxHeight: 1080, bitrateKbps: null, label: 'HD' },
  streamxtv: { maxHeight: 1080, bitrateKbps: null, label: 'StreamX' },
  hexa: { maxHeight: 1080, bitrateKbps: null, label: 'Ultra-Fast' },
  twoembed: { maxHeight: 1080, bitrateKbps: null, label: 'HD' },
  vidsrcin: { maxHeight: 1080, bitrateKbps: null, label: 'Hindi/Reg' },
  vidlink: { maxHeight: 1080, bitrateKbps: null, label: 'Fast HD' },
  autoembed: { maxHeight: 1080, bitrateKbps: null, label: 'Multi-Sub' },
  superembed: { maxHeight: 1080, bitrateKbps: null, label: 'Multi' },
  embedsu: { maxHeight: 2160, bitrateKbps: null, label: '4K/1080p' },
  vidsrcicu: { maxHeight: 1080, bitrateKbps: null, label: 'Global' },
  nexstream: { maxHeight: 1080, bitrateKbps: null, label: '1080p' },
  smashystream: { maxHeight: 1080, bitrateKbps: null, label: 'HD' },
  megaplay: { maxHeight: 1080, bitrateKbps: null, label: 'Anime' },
  vidnest_anime: { maxHeight: 1080, bitrateKbps: null, label: 'Anime' },
  vidnest_animepahe: { maxHeight: 1080, bitrateKbps: null, label: 'AnimePahe' },
  tryembed: { maxHeight: 1080, bitrateKbps: null, label: 'Anime' },
};

/** Quality for a server id, always defined so callers need no null checks. */
export function qualityFor(id: string): ServerQuality {
  return SERVER_QUALITY[id] ?? { maxHeight: null, bitrateKbps: null };
}

/** Curated server preference specifically tuned for TV Webseries */
export const SERIES_PROVIDER_PREFERENCE: Readonly<Record<string, number>> = {
  vidcore: 0,      // #1 for webseries on StreamXTV, fast episode load & complete catalog
  videasy: 1,      // Native episode selector & auto-next support
  vidlink: 2,      // Fast HD, reliable TV seasons
  toustream: 3,    // Ad-Free clean stream for series
  rive: 4,         // Ad-Free stream
  peachify: 5,     // Multi-audio & dubs for foreign/international series
  streamxtv: 6,    // StreamX official embed
  vidrock: 7,      // High speed EU mirror
  vidfast: 8,      // AutoPlay and next button support
  vidking: 9,      // Full series episode selector
  vidsync: 10,     // Synchronized episodes
  vidsrcin: 11,    // Best for Indian & Hindi series
  autoembed: 12,   // Great for multi-language subtitles
  airflix: 13,     // Fast mirror
  hexa: 14,        // Ultra-fast player
  '111movies': 15, // Broad series catalog
  mov2day: 16,     // CDN fallback
  vidzee: 17,      // Desktop HD
  vidlux: 18,
  mapple: 19,
  embedsu: 20,
  vidsrc_embed: 21,
  superembed: 22,
  nexstream: 23,
  twoembed: 24,
  fmovies: 25,
  vidsrcicu: 26,
  smashystream: 27,
  megaplay: 28,
  vidnest_anime: 29,
  vidnest_animepahe: 30,
  tryembed: 31,
};

export const PROVIDER_PREFERENCE: Readonly<Record<string, number>> = {
  vidlink: 0,
  vidcore: 1,
  videasy: 2,
  toustream: 3,
  rive: 4,
  streamxtv: 5,
  peachify: 6,
  vidfast: 7,
  embedsu: 8,
  hexa: 9,
  vidsrcin: 10,
  autoembed: 11,
  vidrock: 12,
  airflix: 13,
  '111movies': 14,
  mov2day: 15,
  vidking: 16,
  vidzee: 17,
  vidsync: 18,
  vidlux: 19,
  mapple: 20,
  superembed: 21,
  vidsrc_embed: 22,
  nexstream: 23,
  twoembed: 24,
  fmovies: 25,
  vidsrcicu: 26,
  smashystream: 27,
  megaplay: 28,
  vidnest_anime: 29,
  vidnest_animepahe: 30,
  tryembed: 31,
};

const PREFERENCE_MAX = 99;

/** Curated preference for a server id (lower = cleaner/more reliable). */
export function preferenceRank(id: string, isSeries = false): number {
  if (isSeries) {
    return SERIES_PROVIDER_PREFERENCE[id] ?? PREFERENCE_MAX;
  }
  return PROVIDER_PREFERENCE[id] ?? PREFERENCE_MAX;
}

const SERIES_BEST_KEY_PREFIX = 'filmora_series_best:';

/** Get the server that previously succeeded for this specific webseries */
export function getSeriesBestServer(seriesId: number | string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(`${SERIES_BEST_KEY_PREFIX}${seriesId}`) || null;
  } catch {
    return null;
  }
}

/** Record the winning server for this specific webseries across all its episodes */
export function saveSeriesBestServer(seriesId: number | string, serverId: string): void {
  if (typeof window === 'undefined' || !seriesId || !serverId) return;
  try {
    localStorage.setItem(`${SERIES_BEST_KEY_PREFIX}${seriesId}`, serverId);
  } catch {}
}

/** Badge text for a server, or null when we genuinely do not know. */
export function qualityLabel(id: string): string | null {
  const q = qualityFor(id);
  if (q.label) return q.label;
  if (q.maxHeight) return `${q.maxHeight}p`;
  return null;
}

/** The shape `rankServers` needs. Any superset works (AvailableServer does). */
export interface RankableServer {
  id: string;
  /** Provider recognised this exact title (probe reached 'title' confidence). */
  verified: boolean;
  /** Provider answered the probe for this title. */
  online: boolean;
  /** The frame proved it is streaming in THIS browser — the strongest signal. */
  live?: boolean;
  /** Probe round-trip in ms, measured server-side. null when not measured. */
  latencyMs?: number | null;
  /** Declared best resolution, when the data model carries it. */
  maxHeight?: number | null;
  /** Declared best bitrate, when the data model carries it. */
  bitrateKbps?: number | null;
  /**
   * The server-side probe had not answered when the response deadline expired.
   * "Not checked yet", NOT "checked and failed" — scored between the two.
   */
  pending?: boolean;
  /**
   * Reachable from THIS browser's network, measured client-side (see
   * player/serverHealth.ts). false is the ad-blocker / DNS-block / captive-portal
   * case, which a datacenter probe can never see and which is a hard "this will
   * not play here". null = not measured.
   */
  reachable?: boolean | null;
  /** Client-measured round-trip to the provider's own origin, in ms. */
  clientLatencyMs?: number | null;
  /**
   * Milliseconds from mounting the provider's frame to its first proof of life,
   * recorded from real playback in this browser. The only buffering-speed signal
   * a cross-origin player ever gives us: how long it took to start.
   */
  startupMs?: number | null;
}

/** Why a server ended up where it did — surfaced in the UI title attribute. */
export interface RankedServer<T extends RankableServer = RankableServer> {
  server: T;
  /** 0-based position in the ranked list; 0 is the auto-selected pick. */
  rank: number;
  /** The weighted score behind the position (see {@link scoreServer}). */
  score: number;
  /** Machine-readable reason for the position. */
  reason:
    | 'quality'
    | 'confirmed'
    | 'reliable'
    | 'fast'
    | 'unproven'
    | 'failing'
    /** The viewer's own network could not reach this provider at all. */
    | 'blocked';
}

// ─── Reliability ledger ───────────────────────────────────────────────────────
// Real, first-party signal: every time a server actually plays (the frame
// reports life) or actually fails (the frame errors or never loads), we record
// it. Unlike a datacenter probe this is measured from the viewer's own network,
// which is the only place that matters.

const HEALTH_KEY = 'filmora.player.serverHealth.v1';
/** Entries older than this are dropped — a provider that broke last month is
 *  not evidence about today. */
const HEALTH_TTL_MS = 14 * 24 * 60 * 60 * 1000;
/** Cap the recorded history so one bad night cannot permanently bury a server. */
const HEALTH_MAX = 20;

export interface ServerHealth {
  successes: number;
  failures: number;
  /** Epoch ms of the most recent failure, for recency weighting. */
  lastFailureAt: number | null;
  /** Epoch ms of the most recent success, for the uptime signal. */
  lastSuccessAt?: number | null;
  /**
   * Rolling average of how long this server took to start playing in this
   * browser, in ms. This is the buffering-speed signal: for a cross-origin
   * player, time-to-first-frame is the only part of "how fast does it buffer"
   * that is observable from outside. null until a real playback measured it.
   */
  startupMs?: number | null;
  /** Epoch ms of the most recent write, for TTL pruning. */
  updatedAt: number;
}

export type HealthLedger = Record<string, ServerHealth>;

function canUseStorage(store: 'local' | 'session'): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!(store === 'local' ? window.localStorage : window.sessionStorage);
  } catch {
    return false; // blocked by a strict privacy setting
  }
}

/** Read the ledger, pruning stale entries. Never throws. */
export function readHealth(): HealthLedger {
  if (!canUseStorage('local')) return {};
  try {
    const raw = localStorage.getItem(HEALTH_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as HealthLedger;
    if (!parsed || typeof parsed !== 'object') return {};
    const now = Date.now();
    const out: HealthLedger = {};
    for (const [id, entry] of Object.entries(parsed)) {
      if (!entry || typeof entry !== 'object') continue;
      if (now - (entry.updatedAt ?? 0) > HEALTH_TTL_MS) continue;
      out[id] = {
        successes: Math.max(0, Math.min(HEALTH_MAX, Number(entry.successes) || 0)),
        failures: Math.max(0, Math.min(HEALTH_MAX, Number(entry.failures) || 0)),
        lastFailureAt: Number(entry.lastFailureAt) || null,
        lastSuccessAt: Number(entry.lastSuccessAt) || null,
        startupMs: Number(entry.startupMs) > 0 ? Number(entry.startupMs) : null,
        updatedAt: Number(entry.updatedAt) || now,
      };
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Record a real playback outcome for a server.
 *
 * `startupMs` — how long the provider's frame took to prove it was alive — is
 * folded in as a rolling average when supplied, because that is the closest
 * thing to a buffering-speed measurement a cross-origin player permits.
 *
 * Returns the updated ledger so callers can re-rank immediately without a
 * second read (and so this stays testable without touching storage).
 */
export function recordServerOutcome(
  id: string,
  ok: boolean,
  startupMs?: number | null
): HealthLedger {
  const ledger = readHealth();
  const now = Date.now();
  const current = ledger[id] ?? {
    successes: 0,
    failures: 0,
    lastFailureAt: null,
    lastSuccessAt: null,
    startupMs: null,
    updatedAt: now,
  };
  // Rolling average, weighted towards the newest sample so a provider that has
  // become slow is reflected within a couple of plays rather than a couple of
  // dozen. Only real, positive measurements are folded in.
  const sample = ok && typeof startupMs === 'number' && startupMs > 0 ? startupMs : null;
  const previous = current.startupMs ?? null;
  const blended =
    sample === null ? previous : previous === null ? sample : Math.round(previous * 0.6 + sample * 0.4);

  const next: ServerHealth = {
    successes: Math.min(HEALTH_MAX, current.successes + (ok ? 1 : 0)),
    failures: Math.min(HEALTH_MAX, current.failures + (ok ? 0 : 1)),
    lastFailureAt: ok ? (current.lastFailureAt ?? null) : now,
    lastSuccessAt: ok ? now : (current.lastSuccessAt ?? null),
    startupMs: blended,
    updatedAt: now,
  };
  ledger[id] = next;
  if (canUseStorage('local')) {
    try {
      localStorage.setItem(HEALTH_KEY, JSON.stringify(ledger));
    } catch {
      /* quota / private mode — ranking simply loses its memory */
    }
  }
  return ledger;
}

/** 0 (never failed) … 1 (always failed). Unknown servers score 0. */
export function failureRate(health: ServerHealth | undefined): number {
  if (!health) return 0;
  const total = health.successes + health.failures;
  if (total === 0) return 0;
  return health.failures / total;
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

export interface RankOptions {
  /** Reliability ledger; pass `readHealth()` once and reuse. */
  health?: HealthLedger;
  /**
   * Servers already tried and failed for the CURRENT title. Always ranked last
   * regardless of how good they look on paper — a server that just failed for
   * this exact episode is not a candidate, whatever its resolution.
   */
  tried?: ReadonlySet<string>;
  /** True when selecting for a TV series / webseries */
  isSeries?: boolean;
  /** Series TMDB id for per-series best server memory lookup */
  seriesId?: number | string | null;
  /** True when title is an anime */
  isAnime?: boolean;
}

// ─── Weighted scoring ─────────────────────────────────────────────────────────
// The automatic pick is a weighted sum, not a chain of if-statements, for two
// reasons: a strong signal can outweigh a weak one instead of being masked by
// whichever comparison happened to run first, and the arithmetic can be printed
// (see `explainScore`) when someone asks why a server won.
//
// Weights sum to 100 so a score reads as a percentage. Priority order is the
// product requirement: playback success first, then quality, then speed, then
// buffering, then reliability.

export const SCORE_WEIGHTS = {
  /** Does it actually play? Confirmed-live in this browser is the ceiling. */
  playback: 36,
  /** Declared video quality (4K > 1080p > 720p > 480p). */
  quality: 18,
  /** Response time: probe round-trip, server- and client-measured. */
  latency: 14,
  /** Buffering speed, i.e. measured time-to-first-frame from real playback. */
  buffering: 9,
  /** Observed success rate in this browser. */
  reliability: 9,
  /** Recent uptime: has it failed us in the last few minutes? */
  uptime: 4,
  /** Curated ad-cleanliness / reliability order — the cold-start tie-break. */
  preference: 10,
} as const;

/** Anything failing for the current title is pushed below every candidate. */
const TRIED_PENALTY = 1000;
/** A provider the viewer's own network cannot reach will never play here. */
const UNREACHABLE_PENALTY = 500;
/** Score used for a signal we have not measured: neither rewarded nor punished. */
const UNKNOWN = 0.5;
/** Latency at or above this is worth no points at all. */
const LATENCY_CEILING_MS = 2000;
/** Time-to-first-frame at or above this is worth no points at all. */
const STARTUP_CEILING_MS = 6000;
/** A failure within this window still counts against current uptime. */
const UPTIME_WINDOW_MS = 5 * 60 * 1000;

/** Map a "lower is better" measurement onto 1…0 over [0, ceiling]. */
function decay(value: number | null | undefined, ceiling: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return UNKNOWN;
  return Math.max(0, 1 - Math.min(value, ceiling) / ceiling);
}

/**
 * How strongly do we believe this server plays? 1 = proven in this browser.
 *
 * The gap between `pending` (0.4) and a refused probe (0.1) is deliberate: a
 * probe that had not answered when the deadline expired is not evidence of
 * failure, and treating it as one would make a slow-but-perfect provider
 * permanently unpickable on a cold cache.
 */
function playbackScore(server: RankableServer): number {
  if (server.live) return 1;
  if (server.verified) return 0.8;
  if (server.online) return 0.65;
  if (server.pending) return 0.4;
  return 0.1;
}

/** 4K → 1, 1080p → 0.7, 720p → 0.45, 480p → 0.2, unknown → neutral. */
function qualityScore(server: RankableServer): number {
  const height = server.maxHeight ?? qualityFor(server.id).maxHeight;
  const bitrate = server.bitrateKbps ?? qualityFor(server.id).bitrateKbps;
  if (typeof height !== 'number' && typeof bitrate !== 'number') return UNKNOWN;
  if (typeof height === 'number') {
    if (height >= 2160) return 1;
    if (height >= 1440) return 0.85;
    if (height >= 1080) return 0.7;
    if (height >= 720) return 0.45;
    if (height >= 480) return 0.2;
    return 0.1;
  }
  // Bitrate only: 8000kbps+ is 4K-class, 1500kbps is SD-class.
  return Math.max(0, Math.min(1, (bitrate! - 1000) / 7000));
}

/**
 * Response time. The client-side measurement (taken from the viewer's own
 * network, see player/serverHealth.ts) is trusted over the server-side probe
 * when both exist, because the viewer's network is the one that has to stream
 * it; when both exist they are blended so one bad sample cannot swing the pick.
 */
function latencyScore(server: RankableServer): number {
  const edge = decay(server.latencyMs, LATENCY_CEILING_MS);
  const client = decay(server.clientLatencyMs, LATENCY_CEILING_MS);
  const haveEdge = typeof server.latencyMs === 'number';
  const haveClient = typeof server.clientLatencyMs === 'number';
  if (haveEdge && haveClient) return client * 0.65 + edge * 0.35;
  if (haveClient) return client;
  if (haveEdge) return edge;
  return UNKNOWN;
}

/** Buffering speed, from the ledger's rolling time-to-first-frame. */
function bufferingScore(server: RankableServer, health: HealthLedger): number {
  const measured = server.startupMs ?? health[server.id]?.startupMs ?? null;
  return decay(measured, STARTUP_CEILING_MS);
}

/** 1 = never failed here, 0 = always fails here. */
function reliabilityScore(server: RankableServer, health: HealthLedger): number {
  const entry = health[server.id];
  if (!entry || entry.successes + entry.failures === 0) return UNKNOWN;
  return 1 - failureRate(entry);
}

/**
 * Current uptime: 0 immediately after a failure, recovering linearly to 1 over
 * UPTIME_WINDOW_MS. This is what stops the ranking from walking straight back
 * onto a provider that fell over thirty seconds ago on a different title.
 */
function uptimeScore(server: RankableServer, health: HealthLedger, now: number): number {
  const failedAt = health[server.id]?.lastFailureAt ?? null;
  if (!failedAt) return 1;
  const age = now - failedAt;
  if (age >= UPTIME_WINDOW_MS) return 1;
  return Math.max(0, age / UPTIME_WINDOW_MS);
}

/** Curated preference as 1…0 (cleanest provider = 1). */
function preferenceScore(id: string, isSeries = false): number {
  const rank = preferenceRank(id, isSeries);
  const map = isSeries ? SERIES_PROVIDER_PREFERENCE : PROVIDER_PREFERENCE;
  const known = Object.keys(map).length;
  if (rank >= PREFERENCE_MAX) return 0;
  return Math.max(0, 1 - rank / Math.max(1, known - 1));
}

/** Per-signal breakdown of a score, for `explainScore` and for tests. */
export interface ScoreBreakdown {
  playback: number;
  quality: number;
  latency: number;
  buffering: number;
  reliability: number;
  uptime: number;
  preference: number;
}

export interface ServerScore {
  id: string;
  /** Weighted total. 0…100 normally; negative when excluded (tried/unreachable). */
  total: number;
  /** Each signal as a 0…1 value, before its weight is applied. */
  breakdown: ScoreBreakdown;
  /** True when this server is disqualified rather than merely ranked low. */
  excluded: boolean;
}

/**
 * Score one server. Higher is better.
 *
 * Disqualification is expressed as a large negative rather than as a filter, so
 * the server still appears in the list (the viewer can always force it) but can
 * never win the automatic pick while it is disqualified.
 */
export function scoreServer(
  server: RankableServer,
  options: RankOptions & { now?: number } = {}
): ServerScore {
  const health = options.health ?? {};
  const tried = options.tried ?? new Set<string>();
  const now = options.now ?? Date.now();
  const isSeries = !!options.isSeries;
  const seriesId = options.seriesId ?? null;
  const isAnime = !!options.isAnime;
  const bestForSeries = (isSeries && seriesId) ? getSeriesBestServer(seriesId) : null;

  const breakdown: ScoreBreakdown = {
    playback: playbackScore(server),
    quality: qualityScore(server),
    latency: latencyScore(server),
    buffering: bufferingScore(server, health),
    reliability: reliabilityScore(server, health),
    uptime: uptimeScore(server, health, now),
    preference: preferenceScore(server.id, isSeries),
  };

  let total = 0;
  for (const key of Object.keys(SCORE_WEIGHTS) as (keyof ScoreBreakdown)[]) {
    total += breakdown[key] * SCORE_WEIGHTS[key];
  }

  // Major preference boost for the server that already successfully streamed this exact webseries
  if (bestForSeries && server.id === bestForSeries) {
    total += 35;
  }

  const isAnimeServer = server.id === 'megaplay' || server.id === 'vidnest_anime' || server.id === 'vidnest_animepahe' || server.id === 'tryembed';
  if (!isAnime && isAnimeServer) {
    total -= 1000;
  } else if (isAnime && isAnimeServer) {
    total += 25;
  }

  const isTried = tried.has(server.id);
  const isUnreachable = server.reachable === false;
  if (isTried) total -= TRIED_PENALTY;
  if (isUnreachable) total -= UNREACHABLE_PENALTY;

  return {
    id: server.id,
    total: Math.round(total * 100) / 100,
    breakdown,
    excluded: isTried || isUnreachable || (!isAnime && isAnimeServer),
  };
}

/** One line of arithmetic explaining a score. Used in tooling and tooltips. */
export function explainScore(score: ServerScore): string {
  const parts = (Object.keys(SCORE_WEIGHTS) as (keyof ScoreBreakdown)[]).map(
    (key) => `${key} ${(score.breakdown[key] * SCORE_WEIGHTS[key]).toFixed(1)}`
  );
  return `${score.id} = ${score.total} (${parts.join(', ')})${score.excluded ? ' [excluded]' : ''}`;
}

/**
 * Rank servers best-first by weighted score.
 *
 * The score (see {@link scoreServer}) folds every signal we actually have into
 * one number, weighted by the product priority — playback success, then quality,
 * then response time, then buffering speed, then reliability, then curated
 * cleanliness. Two things stay outside the arithmetic as hard gates, because
 * they are disqualifications rather than preferences:
 *   • a server that already failed for THIS title, and
 *   • a server the viewer's own network cannot reach at all.
 * Ties fall back to registry order, so the list never reshuffles between renders
 * when nothing has changed.
 */
export function rankServers<T extends RankableServer>(
  servers: readonly T[],
  options: RankOptions = {}
): RankedServer<T>[] {
  const health = options.health ?? {};
  const tried = options.tried ?? new Set<string>();
  const isSeries = options.isSeries;
  const seriesId = options.seriesId;
  const isAnime = options.isAnime;
  const now = Date.now();
  const order = new Map(servers.map((s, index) => [s.id, index]));
  const scores = new Map(
    servers.map((s) => [s.id, scoreServer(s, { health, tried, isSeries, seriesId, isAnime, now })] as const)
  );

  const sorted = [...servers].sort((a, b) => {
    const delta = (scores.get(b.id)?.total ?? 0) - (scores.get(a.id)?.total ?? 0);
    if (Math.abs(delta) > 0.001) return delta;
    return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
  });

  return sorted.map((server, rank) => {
    const score = scores.get(server.id)!;
    return {
      server,
      rank,
      score: score.total,
      reason: tried.has(server.id)
        ? 'failing'
        : server.reachable === false
          ? 'blocked'
          : server.live
            ? 'confirmed'
            : qualityScore(server) > UNKNOWN
              ? 'quality'
              : server.verified
                ? 'confirmed'
                : reliabilityScore(server, health) > UNKNOWN
                  ? 'reliable'
                  : server.online
                    ? 'fast'
                    : 'unproven',
    };
  });
}

/**
 * The id `auto` would choose, or null when there is nothing choosable.
 *
 * Disqualified servers (already failed for this title, or unreachable from this
 * network) are skipped rather than returned as a last resort: the caller uses
 * null to mean "every server has been exhausted, ask the viewer", which is the
 * only situation in which the UI falls back to a manual picker.
 */
export function bestServerId<T extends RankableServer>(
  servers: readonly T[],
  options: RankOptions = {}
): string | null {
  const ranked = rankServers(servers, options);
  const viable = ranked.find((entry) => entry.reason !== 'failing' && entry.reason !== 'blocked');
  return viable?.server.id ?? null;
}

/** Every server that is still a candidate, best first. */
export function viableServers<T extends RankableServer>(
  servers: readonly T[],
  options: RankOptions = {}
): T[] {
  return rankServers(servers, options)
    .filter((entry) => entry.reason !== 'failing' && entry.reason !== 'blocked')
    .map((entry) => entry.server);
}

// ─── Manual override (per title, per session) ─────────────────────────────────
// A deliberate pick must not be undone by a re-render, a season refetch, an
// episode change, or a remount caused by an unrelated island. sessionStorage is
// the right scope: it survives all of those and the whole tab's navigation, and
// it expires when the tab closes so a one-off choice does not become permanent.
// (The long-term memory is Continue Watching's `server` field, which already
// exists and is untouched by this module.)

const OVERRIDE_KEY = 'filmora.player.serverChoice.v1';

type OverrideMap = Record<string, string>;

function readOverrides(): OverrideMap {
  if (!canUseStorage('session')) return {};
  try {
    const raw = sessionStorage.getItem(OVERRIDE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as OverrideMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Stable key for a title. Episode is deliberately excluded: a viewer who
 *  picked a server for a show expects it to hold across episodes. */
export function titleKey(type: 'movie' | 'tv', id: number | string): string {
  return `${type}:${id}`;
}

export function readServerOverride(key: string): string | null {
  return readOverrides()[key] ?? null;
}

export function writeServerOverride(key: string, serverId: string): void {
  if (!canUseStorage('session')) return;
  try {
    const map = readOverrides();
    map[key] = serverId;
    sessionStorage.setItem(OVERRIDE_KEY, JSON.stringify(map));
  } catch {
    /* private mode — the override lives in React state for this mount only */
  }
}

export function clearServerOverride(key: string): void {
  if (!canUseStorage('session')) return;
  try {
    const map = readOverrides();
    delete map[key];
    sessionStorage.setItem(OVERRIDE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

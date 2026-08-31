import React from 'react';
import type { DBUser, DBProfile, DBWatchlistEntry } from '../../../../lib/db';
import type { ContinueEntry } from '../../../../lib/continueWatching';
import {
  IconOverview,
  IconPlay,
  IconFilm,
  IconActivity,
  IconWatchlist,
  IconPreferences,
  IconTrash,
  IconSparkles,
} from '../ProfileIcons';

interface OverviewPanelProps {
  user: DBUser;
  activeProfile: DBProfile | null;
  watchlist: DBWatchlistEntry[];
  continueWatching: ContinueEntry[];
  onRemoveContinue: (id: number, mediaType: 'movie' | 'tv') => void;
  onNavigateTab: (tabId: string) => void;
}

function getPosterSrc(item: { posterUrl?: string | null; posterPath?: string | null }): string | null {
  const raw = item.posterUrl || item.posterPath;
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) {
    return raw;
  }
  return `https://image.tmdb.org/t/p/w342/${raw.replace(/^\//, '')}`;
}

export default function OverviewPanel({
  user,
  activeProfile,
  watchlist,
  continueWatching,
  onRemoveContinue,
  onNavigateTab,
}: OverviewPanelProps) {
  const genres = (() => {
    try {
      return user.genres ? JSON.parse(user.genres) : ['Action', 'Sci-Fi', 'Thriller'];
    } catch {
      return ['Action', 'Sci-Fi', 'Thriller'];
    }
  })();

  const totalWatched = continueWatching.length + 12;
  const estimatedHours = Math.round(totalWatched * 1.6);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      {/* ══════════════════════════════════════════
          1. STREAMING CONTROL HUB HEADER (BLACK BG)
      ══════════════════════════════════════════ */}
      <div className="p-5 sm:p-7 rounded-3xl bg-black border border-white/15 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-neutral-900 text-white border border-white/20 flex-none shadow-md">
                <IconOverview className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                Streaming Control Hub
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-white/60">
              Real-time playback telemetry, household ID status, and one-tap resume.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3.5 py-1.5 rounded-full bg-neutral-900 border border-white/20 text-white text-xs font-bold flex items-center gap-2 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active ID: <strong className="text-white">{activeProfile?.name || 'Main ID'}</strong></span>
            </span>
          </div>
        </div>

        {/* ── Quick Navigation Ribbon ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <a
            href="/movies"
            className="flex-none px-4 py-2 rounded-xl bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow active:scale-95"
          >
            🎬 Movies
          </a>
          <a
            href="/series"
            className="flex-none px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold border border-white/15 transition-colors"
          >
            📺 TV Series
          </a>
          <button
            type="button"
            onClick={() => onNavigateTab('watchlist')}
            className="flex-none px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold border border-white/15 transition-colors"
          >
            📑 My Watchlist ({watchlist.length})
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('music')}
            className="flex-none px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold border border-white/15 transition-colors"
          >
            🎵 Spotify Music Hub
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('profiles')}
            className="flex-none px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold border border-white/15 transition-colors"
          >
            👨‍👩‍👧 Household IDs
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          2. 4 TELEMETRY INSIGHT CARDS (TRUE BLACK)
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat 1: Titles Streamed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black border border-white/15 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs text-white/50 font-bold">
            <span>Titles Streamed</span>
            <IconFilm className="w-4 h-4 text-white/70" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{totalWatched}</div>
          <div className="text-[10px] text-emerald-400 font-bold">+4 this week</div>
        </div>

        {/* Stat 2: Hours Streamed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black border border-white/15 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs text-white/50 font-bold">
            <span>Watch Time</span>
            <IconActivity className="w-4 h-4 text-white/70" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">~{estimatedHours}h</div>
          <div className="text-[10px] text-white/50 font-mono">4K Dolby Vision</div>
        </div>

        {/* Stat 3: Watchlist Count */}
        <div
          onClick={() => onNavigateTab('watchlist')}
          className="p-4 sm:p-5 rounded-2xl bg-black border border-white/15 hover:border-white/40 shadow-xl space-y-1.5 cursor-pointer transition-all active:scale-95 group"
        >
          <div className="flex items-center justify-between text-xs text-white/50 font-bold">
            <span>Saved Watchlist</span>
            <IconWatchlist className="w-4 h-4 text-white/70" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono group-hover:text-white/90">
            {watchlist.length}
          </div>
          <div className="text-[10px] text-white/70 font-bold">View list →</div>
        </div>

        {/* Stat 4: Top Favorite Genre */}
        <div
          onClick={() => onNavigateTab('preferences')}
          className="p-4 sm:p-5 rounded-2xl bg-black border border-white/15 hover:border-white/40 shadow-xl space-y-1.5 cursor-pointer transition-all active:scale-95 group"
        >
          <div className="flex items-center justify-between text-xs text-white/50 font-bold">
            <span>Top Genre</span>
            <IconPreferences className="w-4 h-4 text-white/70" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white truncate group-hover:text-white/90">
            {genres[0] || 'Action'}
          </div>
          <div className="text-[10px] text-white/70 font-bold">Preferences →</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          3. CONTINUE WATCHING FAST RAIL (BLACK BG)
      ══════════════════════════════════════════ */}
      <div className="p-5 sm:p-7 rounded-3xl bg-black border border-white/15 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-neutral-900 border border-white/20 flex items-center justify-center text-white">
              <IconPlay className="w-3.5 h-3.5 fill-current" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>Continue Watching</span>
              <span className="text-xs font-normal text-white/50">({continueWatching.length})</span>
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('activity')}
            className="text-xs font-bold text-white/70 hover:text-white transition-colors"
          >
            Full History →
          </button>
        </div>

        {continueWatching.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3 rounded-2xl bg-neutral-950 border border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white/80 border border-white/15 flex items-center justify-center mx-auto shadow-inner">
              <IconFilm className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-black text-white">No active playback in progress</h4>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                Stream any movie or series to automatically resume from where you stopped across all your devices.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="/movies"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-lg active:scale-95"
              >
                <span>Explore Movies</span>
                <span>➔</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {continueWatching.map((item) => {
              const href = item.mediaType === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`;
              const progressPct =
                item.durationSeconds && item.positionSeconds
                  ? Math.min(100, Math.round((item.positionSeconds / item.durationSeconds) * 100))
                  : 50;
              const remainingMin =
                item.durationSeconds && item.positionSeconds
                  ? Math.max(1, Math.round((item.durationSeconds - item.positionSeconds) / 60))
                  : null;
              const posterSrc = getPosterSrc(item);

              return (
                <div
                  key={`${item.mediaType}-${item.id}`}
                  className="p-3.5 rounded-2xl border border-white/10 hover:border-white/30 bg-neutral-950 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Poster with Play Hover Overlay */}
                    <a
                      href={href}
                      className="w-14 sm:w-16 h-20 sm:h-22 rounded-xl overflow-hidden bg-black flex-none relative block group/poster shadow"
                    >
                      {posterSrc ? (
                        <img
                          src={posterSrc}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-white/30 bg-neutral-900">
                          <IconFilm className="w-5 h-5 text-white/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow">
                          <IconPlay className="w-3 h-3 fill-black ml-0.5" />
                        </div>
                      </div>
                    </a>

                    {/* Metadata & Progress */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div>
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
                          {item.mediaType === 'movie' ? 'Movie' : `S${item.season || 1} E${item.episode || 1}`}
                        </span>
                        <h4 className="text-xs font-black text-white truncate mt-1 group-hover:text-white/90 transition-colors">
                          {item.title}
                        </h4>
                      </div>

                      {/* Progress Bar & Time */}
                      <div className="space-y-1">
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-white h-full rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-white/50 font-mono">
                          <span>{progressPct}% watched</span>
                          {remainingMin && <span>{remainingMin}m left</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Resume + Remove */}
                  <div className="flex items-center gap-2 pt-2.5 mt-2.5 border-t border-white/5">
                    <a
                      href={href}
                      className="flex-1 py-2 px-3 rounded-xl bg-white text-black text-center text-xs font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow"
                    >
                      <IconPlay className="w-3 h-3 fill-black" />
                      <span>Resume</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => onRemoveContinue(item.id, item.mediaType)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-300 transition-colors"
                      title="Remove from continue watching"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import type { DBWatchlistEntry } from '../../../../lib/db';
import { IconWatchlist, IconFilm, IconPlay, IconTrash } from '../ProfileIcons';

interface WatchlistPanelProps {
  watchlist: DBWatchlistEntry[];
  onRemoveFromWatchlist: (tmdbId: number, mediaType: string) => Promise<void>;
  onShowToast: (msg: string) => void;
}

export default function WatchlistPanel({
  watchlist,
  onRemoveFromWatchlist,
  onShowToast,
}: WatchlistPanelProps) {
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'alpha'>('newest');
  const [search, setSearch] = useState('');

  let list = watchlist.filter((item) => {
    const matchType = filter === 'all' || item.media_type === filter;
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  if (sortBy === 'alpha') {
    list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  }

  const handleRemove = async (tmdbId: number, mediaType: string, title: string) => {
    await onRemoveFromWatchlist(tmdbId, mediaType);
    onShowToast(`Removed "${title}" from Watchlist`);
  };

  return (
    <div className="space-y-5 sm:space-y-7 animate-in fade-in select-none text-white">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white text-black border border-white/15 flex-none shadow-md">
              <IconWatchlist className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </span>
            <span>My Saved Watchlist ({watchlist.length})</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            All your bookmarked movies and TV series synced across all your devices.
          </p>
        </div>

        <a
          href="/movies"
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-lg active:scale-95 flex items-center gap-1.5"
        >
          <span>+</span> Browse Catalog
        </a>
      </div>

      {/* ── Filters, Sort & Search ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
          {(['all', 'movie', 'tv'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border snap-center ${
                filter === t
                  ? 'bg-white text-black border-white shadow-md font-black'
                  : 'bg-black text-white/70 hover:text-white border-white/15'
              }`}
            >
              {t === 'all' ? `All (${watchlist.length})` : t === 'movie' ? `Movies (${watchlist.filter(i => i.media_type === 'movie').length})` : `Series (${watchlist.filter(i => i.media_type === 'tv').length})`}
            </button>
          ))}
        </div>

        {/* Sort & Search */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-black border border-white/20 text-white text-xs font-bold focus:outline-none cursor-pointer shadow"
          >
            <option value="newest" className="bg-neutral-900 text-white">Recently Saved</option>
            <option value="alpha" className="bg-neutral-900 text-white">Alphabetical (A-Z)</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search list…"
            className="px-3.5 py-2 rounded-xl bg-black border border-white/20 text-white text-xs placeholder-white/30 focus:outline-none focus:border-white transition-all w-full sm:w-48 shadow-inner"
          />
        </div>
      </div>

      {/* ── Watchlist Grid ── */}
      {list.length === 0 ? (
        <div className="p-10 sm:p-14 text-center space-y-3 rounded-3xl bg-black border border-white/20 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-white/80 border border-white/15 flex items-center justify-center mx-auto text-xl">
            🔖
          </div>
          <h4 className="text-sm font-black text-white">No saved titles found</h4>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            Click the "+ Watchlist" button on any movie or series to bookmark it here for instant access.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {list.map((item) => {
            const poster = item.poster_path
              ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
              : null;
            const playHref = `/${item.media_type}/${item.tmdb_id}`;

            return (
              <div
                key={`${item.media_type}_${item.tmdb_id}`}
                className="group relative overflow-hidden flex flex-col justify-between shadow-2xl bg-black border border-white/15 hover:border-white/40 transition-all rounded-2xl"
              >
                {/* Poster */}
                <a href={playHref} className="block aspect-[2/3] w-full bg-neutral-950 relative overflow-hidden">
                  {poster ? (
                    <img
                      src={poster}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
                      <IconFilm className="w-6 h-6" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow">
                      <IconPlay className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(item.tmdb_id, item.media_type, item.title);
                    }}
                    className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-black/80 hover:bg-rose-600 text-white/80 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-colors shadow active:scale-90 z-20"
                    title="Remove from watchlist"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </a>

                {/* Details */}
                <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-white/10 text-white/90 border border-white/15 font-mono">
                      {item.media_type === 'movie' ? 'Film' : 'Series'}
                    </span>
                    <a href={playHref} className="block text-xs font-black text-white truncate mt-1 group-hover:text-white/90 transition-colors">
                      {item.title}
                    </a>
                  </div>

                  <a
                    href={playHref}
                    className="w-full py-1.5 px-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-[11px] font-black uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1 active:scale-95 shadow"
                  >
                    <span>Watch</span>
                    <span className="text-xs">➔</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

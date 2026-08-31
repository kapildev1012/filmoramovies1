import React, { useState } from 'react';
import type { ContinueEntry } from '../../../../lib/continueWatching';
import { IconActivity, IconFilm, IconPlay, IconTrash } from '../ProfileIcons';

interface ActivityPanelProps {
  continueWatching: ContinueEntry[];
  onRemoveContinue: (id: number, mediaType: 'movie' | 'tv') => void;
  onClearAllHistory: () => void;
  onShowToast: (msg: string) => void;
}

function getPosterSrc(item: { posterUrl?: string | null; posterPath?: string | null }): string | null {
  const raw = item.posterUrl || item.posterPath;
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) {
    return raw;
  }
  return `https://image.tmdb.org/t/p/w342/${raw.replace(/^\//, '')}`;
}

export default function ActivityPanel({
  continueWatching,
  onRemoveContinue,
  onClearAllHistory,
  onShowToast,
}: ActivityPanelProps) {
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [search, setSearch] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filtered = continueWatching.filter((item) => {
    const matchType = filter === 'all' || item.mediaType === filter;
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleClear = () => {
    onClearAllHistory();
    setShowClearConfirm(false);
    onShowToast('Watch history cleared successfully.');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white/10 text-white border border-white/15">
              <IconActivity className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span>Watching Activity &amp; Playback History</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Review your in-progress streaming titles, manage resume timestamps, and clear viewing records.
          </p>
        </div>

        {continueWatching.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 border border-white/10 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
          >
            <IconTrash className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* ── Filters & Search Strip ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['all', 'movie', 'tv'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === t
                  ? 'bg-white text-black shadow-md'
                  : 'bg-neutral-900 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              {t === 'all' ? 'All Activity' : t === 'movie' ? 'Movies' : 'TV Series'}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter history titles…"
          className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs placeholder-white/30 focus:outline-none focus:border-white transition-all w-full sm:w-60"
        />
      </div>

      {/* ── History Items Grid ── */}
      {filtered.length === 0 ? (
        <div className="profile-card p-10 sm:p-14 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-white/80 border border-white/15 flex items-center justify-center mx-auto">
            <IconFilm className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-black text-white">No viewing records found</h4>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            Playback progress and timestamps will automatically appear here as you stream.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
          {filtered.map((item) => {
            const progressPct =
              item.positionSeconds && item.durationSeconds
                ? Math.round((item.positionSeconds / item.durationSeconds) * 100)
                : 50;

            const dateStr = item.updatedAt
              ? new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'Recent';

            const posterSrc = getPosterSrc(item);
            const playHref = item.mediaType === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`;

            return (
              <div
                key={`${item.mediaType}_${item.id}`}
                className="profile-card group p-3.5 rounded-2xl flex flex-col justify-between space-y-3 shadow-lg hover:border-white/30 transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <a href={playHref} className="w-14 h-20 rounded-xl overflow-hidden bg-neutral-950 flex-none shadow block relative group/poster">
                    {posterSrc ? (
                      <img src={posterSrc} alt={item.title} className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
                        <IconFilm className="w-5 h-5" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow">
                        <IconPlay className="w-3 h-3 fill-black ml-0.5" />
                      </div>
                    </div>
                  </a>

                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-white/10 text-white/70">
                      {item.mediaType}
                    </span>
                    <a href={playHref} className="block text-xs font-black text-white truncate group-hover:text-white/90 transition-colors">
                      {item.title}
                    </a>
                    {item.season && item.episode && (
                      <p className="text-[10px] text-white/50 font-mono font-bold">
                        Season {item.season} · Ep {item.episode}
                      </p>
                    )}
                    <p className="text-[10px] text-white/40 font-mono">Streamed {dateStr}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                    <div className="bg-white h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-white/40 font-mono">
                    <span>{progressPct}% watched</span>
                    <span>{item.server ? `via ${item.server}` : 'Direct HD'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <a
                    href={playHref}
                    className="text-xs font-black text-white flex items-center gap-1 hover:text-neutral-300 transition-colors"
                  >
                    <span>Resume</span>
                    <span>➔</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemoveContinue(item.id, item.mediaType)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-300 transition-colors"
                    title="Remove item"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Clear Confirm Modal ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <IconTrash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black">Clear All Playback History?</h3>
              <p className="text-xs text-white/60 mt-1">
                This will reset your resume positions and remove all continue watching titles from your profile.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider shadow"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

type Mood = 'light' | 'cozy' | 'thrilling' | 'cerebral' | 'uplifting' | 'surprise';

type Pick = {
  id: number;
  mediaType: 'movie';
  title: string;
  year: string;
  rating: number;
  overview: string;
  posterUrl: string | null;
  href: string;
  why: string;
};

type MoodResult = {
  headline: string;
  summary: string;
  source: 'nexos' | 'curated';
  picks: Pick[];
};

// SVG Vector Icons for 100% Emoji-Free Clean Look
function MoodIcon({ type, className = "w-4 h-4" }: { type: Mood; className?: string }) {
  switch (type) {
    case 'light':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="4" strokeWidth="2" />
          <path strokeWidth="2" strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14l-1.41 1.41" />
        </svg>
      );
    case 'cozy':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
        </svg>
      );
    case 'thrilling':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'cerebral':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 'uplifting':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    case 'surprise':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="2" y="2" width="20" height="20" rx="4" strokeWidth="2" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="16" cy="16" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
  }
}

const MOODS: Array<{ value: Mood; label: string; desc: string }> = [
  { value: 'light', label: 'Light', desc: 'Easy & Fun' },
  { value: 'cozy', label: 'Cozy', desc: 'Warm & Comfy' },
  { value: 'thrilling', label: 'Thrilling', desc: 'Action' },
  { value: 'cerebral', label: 'Cerebral', desc: 'Sci-Fi & Deep' },
  { value: 'uplifting', label: 'Uplifting', desc: 'Feel-Good' },
  { value: 'surprise', label: 'Surprise', desc: 'Wildcard' },
];

const TIMES = [60, 90, 120, 180] as const;

const WATCHLIST_KEY = 'filmora_watchlist';
const PREFS_KEY = 'filmora_mood_prefs';

interface WatchlistEntry {
  id: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  addedAt: string;
}

function readWatchlist(): WatchlistEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeWatchlist(entries: WatchlistEntry[]) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent('filmora:watchlist-updated'));
  } catch {}
}

function posterPathFromUrl(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\/image\.tmdb\.org\/t\/p\/w\d+/, '') || null;
}

export default function MoodMatch() {
  const [mood, setMood] = useState<Mood>('light');
  const [minutes, setMinutes] = useState<(typeof TIMES)[number]>(90);
  const [result, setResult] = useState<MoodResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [toast, setToast] = useState('');
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => () => activeRequest.current?.abort(), []);

  // Restore visitor's last mood + time preference
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
      if (raw && typeof raw === 'object') {
        if (typeof raw.mood === 'string' && MOODS.some((m) => m.value === raw.mood)) {
          setMood(raw.mood as Mood);
        }
        if (typeof raw.minutes === 'number' && (TIMES as readonly number[]).includes(raw.minutes)) {
          setMinutes(raw.minutes as (typeof TIMES)[number]);
        }
      }
    } catch {}
    setSavedIds(readWatchlist().map((w) => w.id));
  }, []);

  const savePrefs = (nextMood: Mood, nextMinutes: (typeof TIMES)[number]) => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ mood: nextMood, minutes: nextMinutes }));
    } catch {}
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  const toggleSave = (pick: Pick) => {
    const isSaved = savedIds.includes(pick.id);
    const nextSaved = isSaved
      ? savedIds.filter((id) => id !== pick.id)
      : [...savedIds, pick.id];
    setSavedIds(nextSaved);

    const list = readWatchlist();
    const nextList = isSaved
      ? list.filter((w) => w.id !== pick.id)
      : [
          ...list,
          {
            id: pick.id,
            mediaType: pick.mediaType,
            title: pick.title,
            posterPath: posterPathFromUrl(pick.posterUrl),
            addedAt: new Date().toISOString(),
          },
        ];
    writeWatchlist(nextList);
    showToast(isSaved ? `Removed "${pick.title}"` : `Saved "${pick.title}"`);
  };

  const findMatches = async () => {
    activeRequest.current?.abort();
    const ac = new AbortController();
    activeRequest.current = ac;
    setLoading(true);
    setError('');

    try {
      savePrefs(mood, minutes);
      const res = await fetch(`/api/mood?mood=${mood}&minutes=${minutes}`, { signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MoodResult = await res.json();
      setResult(data);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('Could not curate matches at the moment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative w-full max-w-6xl mx-auto my-4 sm:my-6 px-3 sm:px-4">
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl bg-neutral-900/95 border border-white/20 text-white text-xs font-semibold shadow-2xl backdrop-blur-xl animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          {toast}
        </div>
      )}

      {/* Main Compact Card */}
      <div className="relative rounded-2xl p-3.5 sm:p-5 overflow-hidden border border-white/10 bg-neutral-950/80 backdrop-blur-2xl shadow-xl space-y-3.5 sm:space-y-4">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white flex-none">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>What fits your mood?</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/80">
                  AI Matcher
                </span>
              </h2>
              <p className="text-[11px] text-white/50 hidden xs:block">
                Pick a vibe and available time to curate personalized movie matches.
              </p>
            </div>
          </div>
        </div>

        {/* Stretched Duration Bar — Sleek Grey Full Width */}
        <div className="w-full flex items-center p-1 rounded-xl bg-neutral-900/90 border border-neutral-800 gap-1">
          <span className="text-[10px] font-bold text-neutral-400 px-2 uppercase tracking-wider hidden sm:inline flex-none">
            Duration:
          </span>
          {TIMES.map((t) => {
            const isSelected = minutes === t;
            const label = t === 60 ? '60 min' : t === 90 ? '90 min' : t === 120 ? '2 hr' : '3 hr';
            return (
              <button
                key={t}
                type="button"
                onClick={() => setMinutes(t)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center active:scale-95 whitespace-nowrap ${
                  isSelected
                    ? 'bg-neutral-800 text-white font-black border border-neutral-600 shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Vibe Selection & Action Bar (One-Line Scrollable on Mobile) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Vibe Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none snap-x snap-mandatory flex-1">
            {MOODS.map((m) => {
              const isSelected = mood === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`flex-none snap-center flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                    isSelected
                      ? 'bg-neutral-800 text-white border-neutral-600 shadow-md font-bold'
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                  }`}
                >
                  <MoodIcon type={m.value} className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Trigger Button */}
          <button
            type="button"
            onClick={findMatches}
            disabled={loading}
            className="flex-none py-2 px-5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Matching…</span>
              </>
            ) : (
              <>
                <span>Curate</span>
                <span className="text-xs">➔</span>
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3 pt-2 border-t border-white/10 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-sm font-black text-white">{result.headline}</h3>
                <p className="text-xs text-white/50">{result.summary}</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 self-start sm:self-auto uppercase">
                {result.picks.length} Picks Curated
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {result.picks.map((pick) => {
                const isSaved = savedIds.includes(pick.id);
                return (
                  <div
                    key={pick.id}
                    className="group relative rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-white/30 overflow-hidden flex flex-col transition-all shadow-lg"
                  >
                    {/* Poster */}
                    <a href={pick.href} className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950 block">
                      {pick.posterUrl ? (
                        <img
                          src={pick.posterUrl}
                          alt={pick.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
                          No Poster
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1 border border-white/10">
                        <span>★</span>
                        <span>{pick.rating.toFixed(1)}</span>
                      </div>
                    </a>

                    {/* Meta info */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                      <div>
                        <a href={pick.href} className="text-xs font-bold text-white hover:underline line-clamp-1">
                          {pick.title}
                        </a>
                        <div className="text-[10px] text-white/40 font-mono">{pick.year}</div>
                        <p className="text-[10px] text-white/60 line-clamp-2 mt-1 leading-snug">
                          {pick.why || pick.overview}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSave(pick)}
                        className={`w-full py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center justify-center gap-1 ${
                          isSaved
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span>{isSaved ? '❤️' : '🤍'}</span>
                        <span>{isSaved ? 'Saved' : 'Watchlist'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

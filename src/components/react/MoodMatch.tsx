import { useEffect, useRef, useState } from 'react';

type Mood = 'light' | 'cozy' | 'thrilling' | 'cerebral' | 'uplifting' | 'dark' | 'cyberpunk' | 'surprise';

type Pick = {
  id: number;
  mediaType: 'movie';
  title: string;
  year: string;
  rating: number;
  matchPercent?: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl?: string | null;
  href: string;
  why: string;
};

type MoodResult = {
  headline: string;
  summary: string;
  source: 'nexos' | 'curated';
  mood?: string;
  minutes?: number;
  query?: string | null;
  picks: Pick[];
};

// Clean SVG Vector Icons (100% Emoji-Free)
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
    case 'dark':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    case 'cyberpunk':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
  { value: 'light', label: 'Light & Fun', desc: 'Easygoing laughs' },
  { value: 'cozy', label: 'Cozy Night', desc: 'Warm & comforting' },
  { value: 'thrilling', label: 'Adrenaline', desc: 'Non-stop action' },
  { value: 'cerebral', label: 'Mind-Bending', desc: 'Twisty sci-fi' },
  { value: 'uplifting', label: 'Inspirational', desc: 'Triumphant' },
  { value: 'dark', label: 'Dark & Gritty', desc: 'Intense neo-noir' },
  { value: 'cyberpunk', label: 'Cyberpunk', desc: 'Futuristic neon' },
  { value: 'surprise', label: 'Wildcard', desc: 'Surprise me' },
];

const TIMES = [60, 90, 120, 150, 180] as const;

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
  const [mood, setMood] = useState<Mood>('thrilling');
  const [minutes, setMinutes] = useState<(typeof TIMES)[number]>(120);
  const [customPrompt, setCustomPrompt] = useState('');
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

    // Auto-fetch initial matches so the module is immediately engaging
    findMatches('thrilling', 120, '');
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
    showToast(isSaved ? `Removed "${pick.title}" from Watchlist` : `Saved "${pick.title}" to Watchlist`);
  };

  const findMatches = async (targetMood = mood, targetMinutes = minutes, promptText = customPrompt) => {
    activeRequest.current?.abort();
    const ac = new AbortController();
    activeRequest.current = ac;
    setLoading(true);
    setError('');

    try {
      savePrefs(targetMood, targetMinutes);
      let url = `/api/mood?mood=${targetMood}&minutes=${targetMinutes}`;
      if (promptText.trim()) {
        url += `&q=${encodeURIComponent(promptText.trim())}`;
      }
      const res = await fetch(url, { signal: ac.signal });
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

  const handlePromptSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    findMatches(mood, minutes, customPrompt);
  };

  return (
    <section className="relative w-full max-w-6xl mx-auto my-6 sm:my-8 px-3 sm:px-4">
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-black/95 border border-purple-500/40 text-white text-xs font-semibold shadow-2xl backdrop-blur-xl animate-in fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
          {toast}
        </div>
      )}

      {/* Main Luxury Obsidian Card */}
      <div className="relative rounded-3xl p-4 sm:p-6 overflow-hidden border border-purple-500/20 bg-gradient-to-b from-[#0f0c1b]/95 to-[#07060c]/98 backdrop-blur-2xl shadow-2xl shadow-purple-950/30 space-y-4 sm:space-y-5">
        {/* Subtle purple ambient glow on top edge */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-500/15">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-purple-950/70 border border-purple-500/35 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-950/50 flex-none">
              <svg className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  What fits your mood?
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  AI Matcher
                </span>
              </div>
              <p className="text-xs text-white/55 mt-0.5">
                Neural-powered recommendations curated by mood, time, and custom craving.
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <button
            type="button"
            onClick={() => findMatches(mood, minutes, customPrompt)}
            disabled={loading}
            className="self-end sm:self-auto py-2.5 px-6 rounded-xl bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-950/60 border border-purple-400/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Matching…</span>
              </>
            ) : (
              <>
                <span>Curate Picks</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Freeform Prompt Input */}
        <form onSubmit={handlePromptSubmit} className="relative w-full">
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 w-4 h-4 text-purple-400/80 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Or describe what you want... (e.g. 'cyberpunk heist', '90s cozy rom-com', 'mind-bending twist')"
              className="w-full h-11 rounded-2xl bg-black/50 border border-purple-500/25 pl-10 pr-24 text-xs text-white placeholder-white/35 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40 transition-all"
            />
            {customPrompt ? (
              <button
                type="button"
                onClick={() => setCustomPrompt('')}
                className="absolute right-12 text-[10px] text-white/40 hover:text-white px-1.5 py-0.5 rounded"
              >
                ✕
              </button>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 h-8 px-3 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-[11px] border border-purple-400/25 transition-all flex items-center gap-1 disabled:opacity-50"
            >
              <span>Match</span>
            </button>
          </div>
        </form>

        {/* Vibe Selection Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-white/60 uppercase tracking-wider px-0.5">
            <span>Select Vibe</span>
            {result?.source === 'nexos' && (
              <span className="text-[10px] text-purple-400 lowercase font-mono">
                ✨ enhanced with gpt 4.1 mini
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x snap-mandatory">
            {MOODS.map((m) => {
              const isSelected = mood === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    setMood(m.value);
                    findMatches(m.value, minutes, customPrompt);
                  }}
                  className={`flex-none snap-center flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl border text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-400/50 shadow-lg shadow-purple-950/60 font-black'
                      : 'bg-black/40 border-purple-500/20 text-white/60 hover:bg-purple-950/40 hover:text-white hover:border-purple-500/35'
                  }`}
                >
                  <MoodIcon
                    type={m.value}
                    className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-purple-400'}`}
                  />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration Bar */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-white/60 uppercase tracking-wider px-0.5">
            Available Time
          </div>
          <div className="w-full flex items-center p-1 rounded-2xl bg-black/40 border border-purple-500/20 gap-1">
            {TIMES.map((t) => {
              const isSelected = minutes === t;
              const label =
                t === 60 ? '≤ 60 min' : t === 90 ? '≤ 90 min' : t === 120 ? '≤ 2 hours' : t === 150 ? '≤ 2.5 hours' : '3+ hours';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setMinutes(t);
                    findMatches(mood, t, customPrompt);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center active:scale-95 whitespace-nowrap ${
                    isSelected
                      ? 'bg-purple-600 text-white font-black border border-purple-400/40 shadow-md shadow-purple-950/40'
                      : 'text-white/50 hover:text-white hover:bg-purple-950/30'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !result && (
          <div className="pt-3 border-t border-purple-500/15 animate-pulse">
            <div className="h-4 w-48 bg-purple-950/60 rounded mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-2xl bg-purple-950/30 border border-purple-500/15" />
              ))}
            </div>
          </div>
        )}

        {/* Results Showcase */}
        {result && (
          <div className="space-y-3.5 pt-3 border-t border-purple-500/15 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>{result.headline}</span>
                </h3>
                <p className="text-xs text-white/60 line-clamp-1">{result.summary}</p>
              </div>
              <span className="text-[10px] font-mono text-purple-300 self-start sm:self-auto uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25">
                {result.picks.length} Neural Matches
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {result.picks.map((pick) => {
                const isSaved = savedIds.includes(pick.id);
                return (
                  <div
                    key={pick.id}
                    className="group relative rounded-2xl bg-black/60 border border-purple-500/20 hover:border-purple-400/50 overflow-hidden flex flex-col transition-all shadow-xl hover:shadow-purple-950/40 hover:-translate-y-1"
                  >
                    {/* Poster */}
                    <a href={pick.href} className="relative aspect-[2/3] w-full overflow-hidden bg-black block">
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

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-purple-950/85 backdrop-blur-md text-[9px] font-bold text-purple-200 border border-purple-500/30">
                        {pick.matchPercent || '98% Match'}
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1 border border-white/10">
                        <span>★</span>
                        <span>{pick.rating.toFixed(1)}</span>
                      </div>
                    </a>

                    {/* Meta info & AI Explanation */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <a href={pick.href} className="text-xs font-bold text-white hover:text-purple-300 line-clamp-1">
                          {pick.title}
                        </a>
                        <div className="text-[10px] text-white/45 font-mono">{pick.year}</div>

                        {/* AI "Why it fits" badge */}
                        <div className="mt-1.5 p-1.5 rounded-lg bg-purple-950/40 border border-purple-500/20">
                          <p className="text-[10px] text-purple-200/90 line-clamp-2 leading-tight">
                            {pick.why || pick.overview}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <a
                          href={pick.href}
                          className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold text-center transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          <span>Play</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => toggleSave(pick)}
                          aria-label={isSaved ? "Remove from watchlist" : "Add to watchlist"}
                          className={`w-8 h-7 rounded-lg text-[10px] font-bold border transition-colors flex items-center justify-center ${
                            isSaved
                              ? 'bg-purple-500/30 text-purple-300 border-purple-400'
                              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </div>
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

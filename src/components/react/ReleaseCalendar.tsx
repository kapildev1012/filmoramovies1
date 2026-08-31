import React, { useState, useMemo, useEffect } from 'react';

export interface CalendarItem {
  id: number | string;
  title: string;
  type: 'movie' | 'tv';
  date: string;
  posterUrl: string;
  backdropUrl: string;
  overview: string;
  rating: number;
  genres?: string[];
  network?: string;
}

interface ReleaseCalendarProps {
  movies: CalendarItem[];
  series: CalendarItem[];
}

const WATCHLIST_KEY = 'filmora_watchlist';

export default function ReleaseCalendar({ movies, series }: ReleaseCalendarProps) {
  const [selectedTab, setSelectedTab] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedDayOffset, setSelectedDayOffset] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [toast, setToast] = useState('');

  // 7-Day sequence
  const days = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      list.push({ offset: i, dateStr, dayName, dayNum });
    }
    return list;
  }, []);

  // Load saved watchlist
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
      if (Array.isArray(raw)) setSavedIds(raw.map((item: any) => item.id));
    } catch {}
  }, []);

  const toggleSave = (item: CalendarItem) => {
    const isSaved = savedIds.includes(Number(item.id));
    const nextSaved = isSaved
      ? savedIds.filter((id) => id !== Number(item.id))
      : [...savedIds, Number(item.id)];
    setSavedIds(nextSaved);

    try {
      const raw = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
      const nextList = isSaved
        ? raw.filter((w: any) => w.id !== Number(item.id))
        : [
            ...raw,
            {
              id: Number(item.id),
              mediaType: item.type,
              title: item.title,
              posterPath: item.posterUrl ? item.posterUrl.replace(/^https?:\/\/image\.tmdb\.org\/t\/p\/w\d+/, '') : null,
              addedAt: new Date().toISOString(),
            },
          ];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(nextList));
      window.dispatchEvent(new CustomEvent('filmora:watchlist-updated'));
      setToast(isSaved ? `Removed "${item.title}"` : `Saved "${item.title}"`);
      setTimeout(() => setToast(''), 2000);
    } catch {}
  };

  // Combined sorted releases
  const allItems = useMemo(() => {
    return [...movies, ...series].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [movies, series]);

  // Filtered releases
  const filteredItems = useMemo(() => {
    let list = allItems;

    if (selectedTab === 'movie') list = list.filter((i) => i.type === 'movie');
    if (selectedTab === 'tv') list = list.filter((i) => i.type === 'tv');

    if (selectedDayOffset !== null) {
      const selectedDate = days[selectedDayOffset]?.dateStr;
      if (selectedDate) {
        list = list.filter((i) => i.date === selectedDate);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) =>
        i.title.toLowerCase().includes(q) || i.overview.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allItems, selectedTab, selectedDayOffset, days, searchQuery]);

  // Formatted date badge helper
  const getRelativeDateLabel = (dateStr: string) => {
    if (!dateStr) return 'Upcoming';
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ── 7-Day Day Selector Strip (Clean One-Line Scroll on Mobile) ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-white/50">
            Airing Schedule
          </span>
          {selectedDayOffset !== null && (
            <button
              onClick={() => setSelectedDayOffset(null)}
              className="text-[11px] font-bold text-white/80 hover:text-white transition-colors"
            >
              Show All Days ✕
            </button>
          )}
        </div>

        {/* ONE-LINE HORIZONTAL SCROLL BAR FOR DAY BUTTONS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {days.map((day) => {
            const isSelected = selectedDayOffset === day.offset;
            const countForDay = allItems.filter((i) => i.date === day.dateStr).length;

            return (
              <button
                key={day.offset}
                onClick={() => setSelectedDayOffset(isSelected ? null : day.offset)}
                className={`flex-none min-w-[78px] sm:min-w-[96px] md:flex-1 snap-center flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl border transition-all text-center active:scale-95 ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-xl scale-[1.02]'
                    : 'bg-neutral-900/80 border-white/10 hover:bg-neutral-800 hover:border-white/20 text-white/80'
                }`}
              >
                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${isSelected ? 'text-black/60' : 'text-white/50'}`}>
                  {day.dayName}
                </span>
                <span className="text-xs sm:text-sm font-black mt-0.5 whitespace-nowrap">
                  {day.dayNum}
                </span>
                {countForDay > 0 && (
                  <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full mt-1 ${
                    isSelected ? 'bg-black/10 text-black' : 'bg-white/10 text-white/70'
                  }`}>
                    {countForDay}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Filter & Search Toolbar (Single Line Controls) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-xl">
        {/* Type Switcher in One Line */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-white/5 overflow-x-auto scrollbar-none flex-none">
          {(['all', 'movie', 'tv'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                selectedTab === tab
                  ? 'bg-white text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All Releases' : tab === 'movie' ? 'Movies' : 'Series'}
            </button>
          ))}
        </div>

        {/* View Mode & Search */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          {/* Search box */}
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder="Search schedule…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-1.5 px-3 pl-8 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-all"
            />
            <svg className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Grid vs Timeline toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5 flex-none">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'timeline' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'
              }`}
              title="Timeline View"
              aria-label="Timeline View"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Releases Display ── */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/40 rounded-3xl border border-dashed border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-white">No releases match your filter</h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            Try picking a different date or clearing your search term.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredItems.map((item) => {
            const isSaved = savedIds.includes(Number(item.id));
            return (
              <div
                key={`${item.type}_${item.id}`}
                className="group relative flex flex-col bg-neutral-900/80 rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:-translate-y-1 shadow-lg"
              >
                {/* Image Aspect ratio container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950">
                  <img
                    src={item.backdropUrl || item.posterUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/30 to-transparent" />

                  {/* Date Sticker */}
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white border border-white/10 shadow-lg">
                    {getRelativeDateLabel(item.date)}
                  </div>

                  {/* Bookmark Button */}
                  <button
                    type="button"
                    onClick={() => toggleSave(item)}
                    className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-md border transition-all active:scale-90 ${
                      isSaved
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-black/60 text-white/70 border-white/10 hover:bg-black/80'
                    }`}
                    aria-label="Save to watchlist"
                  >
                    <svg className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>

                  {/* Type Badge */}
                  <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black uppercase text-white tracking-wider border border-white/10">
                    {item.type === 'movie' ? 'Movie' : 'Series'}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-1 group-hover:text-white/80 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-white/50 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.overview || 'Premiere scheduled for release across streaming platforms.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[11px] font-bold text-white/60">
                      ★ {item.rating ? item.rating.toFixed(1) : 'NR'}
                    </span>
                    <a
                      href={`/${item.type}/${item.id}`}
                      className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white hover:text-black text-white text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95"
                    >
                      <span>Watch</span>
                      <span>➔</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TIMELINE / LIST VIEW ── */
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const isSaved = savedIds.includes(Number(item.id));
            return (
              <div
                key={`timeline_${item.type}_${item.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-white/20 transition-all hover:bg-neutral-900"
              >
                <div className="flex items-center gap-3">
                  {/* Small Poster */}
                  <img
                    src={item.posterUrl || item.backdropUrl}
                    alt={item.title}
                    className="w-12 h-16 rounded-xl object-cover flex-none bg-neutral-950 border border-white/10"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-white/10 text-white/80 text-[10px] font-black uppercase">
                        {item.type}
                      </span>
                      <span className="text-xs font-bold text-white/50">
                        {getRelativeDateLabel(item.date)}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-white/50 line-clamp-1">
                      {item.overview}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => toggleSave(item)}
                    className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSaved ? 'bg-white text-black border-white' : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                  <a
                    href={`/${item.type}/${item.id}`}
                    className="py-1.5 px-3 rounded-xl bg-white text-black text-xs font-bold hover:opacity-90 transition-all"
                  >
                    Details ➔
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Toast */}
      {toast && (
        <div className="fixed bottom-20 right-6 z-50 px-4 py-2 rounded-xl bg-neutral-900/95 border border-white/20 text-white text-xs font-bold shadow-2xl backdrop-blur-md">
          {toast}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import { REAL_CHANNELS, type LiveChannel } from '../../pages/api/tv/channels';

const CATEGORIES = [
  { id: 'all', label: 'All Channels' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'sports', label: 'Sports' },
  { id: 'news', label: 'News 24/7' },
  { id: 'documentary', label: 'Documentary' },
  { id: 'movies', label: 'Cinema' },
  { id: 'music', label: 'Music' },
  { id: 'kids', label: 'Animation' },
];

const COUNTRIES = [
  { id: 'all', label: 'All Regions' },
  { id: 'USA', label: 'USA' },
  { id: 'UK', label: 'UK' },
  { id: 'Germany', label: 'Germany' },
  { id: 'India', label: 'India' },
  { id: 'Global', label: 'Global' },
];

const FAVORITES_KEY = 'filmora_favorite_channels';

export default function LiveChannels() {
  const [channels, setChannels] = useState<LiveChannel[]>(REAL_CHANNELS);
  const [activeChannelIndex, setActiveChannelIndex] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showScheduleDrawer, setShowScheduleDrawer] = useState<boolean>(false);
  const [toast, setToast] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const activeChannel = channels[activeChannelIndex] || channels[0] || REAL_CHANNELS[0];

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      if (Array.isArray(saved)) setFavorites(saved);
    } catch {}
  }, []);

  const toggleFavorite = useCallback((channelId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const exists = prev.includes(channelId);
      const next = exists ? prev.filter((id) => id !== channelId) : [...prev, channelId];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {}
      setToast(exists ? 'Removed from favorites' : 'Saved to favorites');
      setTimeout(() => setToast(''), 2000);
      return next;
    });
  }, []);

  // Fetch updated channel data
  useEffect(() => {
    fetch('/api/tv/channels')
      .then((r) => r.json())
      .then((data) => {
        if (data.channels && Array.isArray(data.channels)) {
          setChannels(data.channels);
        }
      })
      .catch(() => {});
  }, []);

  // HLS stream playback handler
  useEffect(() => {
    if (activeChannel.streamType !== 'hls') {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(activeChannel.streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = activeChannel.streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel]);

  // Channel navigation
  const nextChannel = useCallback(() => {
    setActiveChannelIndex((prev) => (prev + 1) % channels.length);
  }, [channels.length]);

  const prevChannel = useCallback(() => {
    setActiveChannelIndex((prev) => (prev - 1 + channels.length) % channels.length);
  }, [channels.length]);

  // Filtered channel lineup
  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      if (selectedCategory === 'favorites' && !favorites.includes(ch.id)) return false;
      const matchCat = selectedCategory === 'all' || selectedCategory === 'favorites' || ch.category === selectedCategory;
      const matchCountry = selectedCountry === 'all' || ch.country === selectedCountry;
      const matchSearch =
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.epg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.country.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchCountry && matchSearch;
    });
  }, [channels, selectedCategory, selectedCountry, searchQuery, favorites]);

  // Cast handler
  const handleCast = () => {
    const video = videoRef.current as any;
    if (video) {
      if (typeof video.webkitShowPlaybackTargetPicker === 'function') {
        video.webkitShowPlaybackTargetPicker();
      } else if (video.remote && typeof video.remote.prompt === 'function') {
        video.remote.prompt().catch(() => {});
      }
    }
  };

  // Picture in picture handler
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch {}
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ── Main Cinema Broadcast Stage ── */}
      <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
        <div className="aspect-[16/9] max-h-[620px] w-full relative flex items-center justify-center bg-neutral-950">
          {activeChannel.streamType === 'hls' ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              autoPlay
              playsInline
              muted={isMuted}
              controls
            />
          ) : (
            <iframe
              key={activeChannel.id}
              src={activeChannel.streamUrl}
              className="w-full h-full border-0 bg-black"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              title={activeChannel.name}
            />
          )}

          {/* Top-Left Live Status Badge */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 sm:gap-2 bg-black/80 backdrop-blur-md px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-white/15 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-md shadow-red-500" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white">LIVE</span>
            <span className="text-[10px] sm:text-xs text-white/70 font-semibold hidden xs:inline">· {activeChannel.viewers}</span>
          </div>

          {/* Top-Right Resolution, Cast & Favorite Buttons */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={(e) => toggleFavorite(activeChannel.id, e)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-md text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95 ${
                favorites.includes(activeChannel.id)
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-black/60 text-white/80 border-white/15 hover:bg-black/80'
              }`}
              title="Add to Favorites"
              aria-label="Add to Favorites"
            >
              <svg className="w-3.5 h-3.5" fill={favorites.includes(activeChannel.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="hidden sm:inline">{favorites.includes(activeChannel.id) ? 'Favorited' : 'Save'}</span>
            </button>

            {/* Mobile Cast Button */}
            {activeChannel.streamType === 'hls' && (
              <button
                onClick={handleCast}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-xs font-bold text-white border border-white/15 transition-all flex items-center gap-1.5 active:scale-95"
                title="Cast Stream"
                aria-label="Cast to TV"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 16.1A5 5 0 015.9 20M2 12.05A9 9 0 019.95 20M2 8V6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2h-6M2 20h.01" />
                </svg>
                <span className="hidden sm:inline">Cast</span>
              </button>
            )}

            <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] sm:text-[11px] font-black text-white uppercase border border-white/15">
              {activeChannel.quality}
            </span>
          </div>

          {/* Quick On-Stage Mobile Channel Switcher */}
          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
            <button
              onClick={prevChannel}
              className="pointer-events-auto w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 backdrop-blur-md transition-all active:scale-90 opacity-70 hover:opacity-100"
              title="Previous Channel"
              aria-label="Previous Channel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <button
              onClick={nextChannel}
              className="pointer-events-auto w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 backdrop-blur-md transition-all active:scale-90 opacity-70 hover:opacity-100"
              title="Next Channel"
              aria-label="Next Channel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Rich EPG Live Program Guide Banner ── */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-neutral-950 via-neutral-900 to-neutral-900/90 border-t border-white/10 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Active Channel Details */}
            <div className="flex items-center gap-3.5">
              <img
                src={activeChannel.logo}
                alt={activeChannel.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border border-white/10 shadow-xl flex-none bg-neutral-950"
              />
              <div className="space-y-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-black text-white text-base sm:text-2xl tracking-tight truncate">
                    {activeChannel.name}
                  </h2>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15">
                    {activeChannel.category}
                  </span>
                  <span className="text-[11px] text-white/50 font-bold">
                    {activeChannel.country}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-white/90 font-bold flex items-center gap-1.5 truncate">
                  <span className="text-emerald-400">● AIRING:</span> {activeChannel.epg.title}
                </p>

                <p className="text-xs text-white/50 line-clamp-1 max-w-2xl hidden xs:block">
                  {activeChannel.epg.description}
                </p>
              </div>
            </div>

            {/* Up Next & Schedule Toggle Button */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="text-xs text-white/60 bg-black/60 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border border-white/10 space-y-0.5 flex-1 sm:flex-initial">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-extrabold uppercase text-white/40">Up Next</span>
                  <span className="text-[10px] font-bold text-white/70">{activeChannel.epg.endsAt}</span>
                </div>
                <p className="font-bold text-white line-clamp-1 text-xs">{activeChannel.epg.nextTitle}</p>
              </div>

              <button
                onClick={() => setShowScheduleDrawer(!showScheduleDrawer)}
                className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{showScheduleDrawer ? 'Hide Guide' : 'Today Guide'}</span>
              </button>
            </div>
          </div>

          {/* Live Show Progress Bar */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-white/60">
              <span className="text-emerald-400">Broadcast Progress ({activeChannel.epg.progress}%)</span>
              <span>Ends at {activeChannel.epg.endsAt}</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500 rounded-full"
                style={{ width: `${activeChannel.epg.progress}%` }}
              />
            </div>
          </div>

          {/* Expandable 24-Hour EPG Schedule Drawer */}
          {showScheduleDrawer && activeChannel.epg.schedule && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>24-Hour Programming Schedule</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {activeChannel.epg.schedule.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 sm:p-3 rounded-xl border text-xs space-y-1 ${
                      item.isLive
                        ? 'bg-white/15 border-white text-white shadow-md'
                        : 'bg-black/40 border-white/10 text-white/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-white/50">{item.time}</span>
                      {item.isLive && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-500 text-white">
                          AIRING NOW
                        </span>
                      )}
                    </div>
                    <p className={`font-bold line-clamp-1 ${item.isLive ? 'text-white' : 'text-white/80'}`}>
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Category & Country Filter Bar ── */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-md'
                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border-white/10'
                }`}
              >
                <span>{cat.label}</span>
                {cat.id === 'favorites' && favorites.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-black/20 text-black' : 'bg-white/20 text-white'}`}>
                    {favorites.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Region & Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          {/* Country Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {COUNTRIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCountry(c.id)}
                className={`flex-none px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  selectedCountry === c.id
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-white/5 text-white/50 hover:text-white border-white/5'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search live channels & shows…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-3 pl-8 rounded-xl bg-neutral-900/90 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-all"
            />
            <svg className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Channel Lineup Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredChannels.length === 0 ? (
          <div className="col-span-full py-12 text-center space-y-3 bg-neutral-950/60 rounded-3xl border border-white/10">
            <svg className="w-10 h-10 mx-auto text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-bold text-white/70">No channels found in this category.</p>
            <button
              onClick={() => { setSelectedCategory('all'); setSelectedCountry('all'); setSearchQuery(''); }}
              className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredChannels.map((ch) => {
            const isCurrent = activeChannel.id === ch.id;
            const isFav = favorites.includes(ch.id);
            const globalIndex = channels.findIndex((c) => c.id === ch.id);

            return (
              <div
                key={ch.id}
                onClick={() => {
                  setActiveChannelIndex(globalIndex >= 0 ? globalIndex : 0);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`group flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer active:scale-98 relative overflow-hidden ${
                  isCurrent
                    ? 'bg-neutral-900 border-white text-white shadow-xl ring-1 ring-white'
                    : 'bg-neutral-900/60 border-white/10 hover:bg-neutral-850 hover:border-white/20 text-white/80'
                }`}
              >
                {/* Logo */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-950 border border-white/10 flex-none shadow-md">
                  <img
                    src={ch.logo}
                    alt={ch.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Channel Details */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className={`text-xs font-black truncate ${isCurrent ? 'text-white' : 'text-white/90'}`}>
                      {ch.name}
                    </h3>
                    <button
                      onClick={(e) => toggleFavorite(ch.id, e)}
                      className={`text-xs p-1 transition-transform active:scale-125 ${
                        isFav ? 'text-white' : 'text-white/30 hover:text-white/70'
                      }`}
                      title={isFav ? 'Remove Favorite' : 'Save Favorite'}
                      aria-label="Toggle Favorite"
                    >
                      <svg className="w-3.5 h-3.5" fill={isFav ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-xs text-white/70 line-clamp-1 font-semibold">
                    {ch.epg.title}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
                    <span className="truncate">{ch.category}</span>
                    <span className="font-semibold text-white/60">{ch.viewers} live</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-16 right-6 z-50 px-4 py-2 rounded-xl bg-neutral-900/95 border border-white/20 text-white text-xs font-bold shadow-2xl backdrop-blur-md">
          {toast}
        </div>
      )}
    </div>
  );
}

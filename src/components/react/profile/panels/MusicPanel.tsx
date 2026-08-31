import React, { useState, useEffect, useRef } from 'react';
import { IconMusic, IconPlay } from '../ProfileIcons';
import { FREE_MUSIC_LIBRARY, type FreeTrack } from '../../music/MusicCustomizerStation';

interface MusicPanelProps {
  initialSettings?: string | null;
  onSaveSettings: (field: any, jsonString: string) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

const SUGGESTED_SEARCH_CHIPS = [
  'Hans Zimmer', 'Interstellar', 'Oppenheimer', 'Dune', 'Arijit Singh',
  'Kesariya', 'Diljit Dosanjh', 'The Weeknd', 'Taylor Swift', 'Lo-Fi'
];

export default function MusicPanel({
  initialSettings,
  onSaveSettings,
  onShowToast,
}: MusicPanelProps) {
  const parsed = initialSettings ? JSON.parse(initialSettings) : {};

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [currentTrack, setCurrentTrack] = useState<FreeTrack>(FREE_MUSIC_LIBRARY[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const [likedSongIds, setLikedSongIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('filmora_liked_songs');
      if (saved) setLikedSongIds(JSON.parse(saved));
    } catch { }
  }, []);

  const toggleLikeSong = (trackId: string) => {
    let updated: string[];
    if (likedSongIds.includes(trackId)) {
      updated = likedSongIds.filter((id) => id !== trackId);
      onShowToast('Removed from Liked Songs');
    } else {
      updated = [...likedSongIds, trackId];
      onShowToast('Added to Liked Songs ❤️');
    }
    setLikedSongIds(updated);
    try {
      localStorage.setItem('filmora_liked_songs', JSON.stringify(updated));
    } catch { }
  };

  const handlePlayTrack = (track: FreeTrack) => {
    setCurrentTrack(track);
    setIsSearchFocused(false);
    onShowToast(`Now Playing: "${track.title}" by ${track.artist}`);
  };

  const searchSuggestions = FREE_MUSIC_LIBRARY.filter((track) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q) ||
      track.albumOrFilm.toLowerCase().includes(q)
    );
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim();
    let customYtId = '';
    if (query.includes('youtube.com/watch?v=')) {
      customYtId = query.split('v=')[1].split('&')[0];
    } else if (query.includes('youtu.be/')) {
      customYtId = query.split('youtu.be/')[1].split('?')[0];
    }

    const exactMatch = FREE_MUSIC_LIBRARY.find(
      (t) => t.title.toLowerCase() === query.toLowerCase() || t.artist.toLowerCase() === query.toLowerCase()
    );

    if (exactMatch) {
      handlePlayTrack(exactMatch);
      return;
    }

    const newTrack: FreeTrack = {
      id: `searched-${Date.now()}`,
      title: customYtId ? 'Custom Track / Video' : query,
      artist: 'Universal Search',
      albumOrFilm: 'Free Music Cloud',
      category: 'global',
      duration: 'Full Track',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
      youtubeId: customYtId || '4NRXx6U8ABQ',
      bitrate: 'Lossless Stream',
    };

    FREE_MUSIC_LIBRARY.unshift(newTrack);
    handlePlayTrack(newTrack);
    setIsSearchFocused(false);
    onShowToast(`Loaded "${query}" ✓`);
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSaveSettings(
      'music_settings',
      JSON.stringify({
        preferredCategory: activeCategory,
      })
    );
    setSaving(false);
    if (ok) onShowToast('Music streaming preferences saved ✓');
    else onShowToast('Failed to save music settings.');
  };

  const filteredTracks = FREE_MUSIC_LIBRARY.filter((track) => {
    const matchCat = activeCategory === 'all' || (activeCategory === 'liked' ? likedSongIds.includes(track.id) : track.category === activeCategory);
    const matchSearch =
      !searchQuery.trim() ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.albumOrFilm.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in select-none text-white">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white text-black border border-white/15 flex-none shadow-md">
              <IconMusic className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </span>
            <span>Free Cinema Music &amp; Exact Soundtracks</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Stream the exact soundtracks, pop chartbusters, and Bollywood hits with 100% free unlimited playback.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto px-6 py-2.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
        >
          {saving ? 'Saving…' : 'Save Setup'}
        </button>
      </div>

      {/* ══════════════════════════════════════════
          PROPER SEARCH BAR WITH LIVE AUTO-SUGGESTIONS
      ══════════════════════════════════════════ */}
      <div ref={searchContainerRef} className="p-5 sm:p-6 rounded-3xl bg-black border border-white/20 shadow-2xl space-y-3 relative z-30">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <span>🔍 Instant Music &amp; Soundtrack Search</span>
          </h3>
          <p className="text-[11px] text-white/50">Live auto-complete suggestions appear as you type.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-white/40 pointer-events-none text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              placeholder="Search by song name (e.g. Interstellar, Kesariya, Blinding Lights, Diljit Dosanjh)..."
              className="w-full pl-9 pr-20 py-2.5 rounded-xl bg-neutral-950 border border-white/20 text-white text-xs placeholder-white/30 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/40 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchFocused(false);
                }}
                className="absolute right-16 text-xs text-white/40 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-black text-[11px] uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow active:scale-95 flex-none"
            >
              Play
            </button>
          </div>

          {/* Auto-Suggestions Dropdown */}
          {isSearchFocused && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 p-2.5 rounded-2xl bg-neutral-950/95 border border-white/20 shadow-2xl backdrop-blur-2xl max-h-72 overflow-y-auto space-y-1 z-50 animate-in fade-in">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/40 border-b border-white/10 mb-1 flex items-center justify-between">
                <span>Matching Tracks ({searchSuggestions.length})</span>
                <span className="text-emerald-400">Tap to play</span>
              </div>
              {searchSuggestions.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handlePlayTrack(track)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-900 flex-none relative">
                      <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                      <p className="text-[10px] text-white/50 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">{track.duration}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Quick Chips */}
        <div className="flex items-center gap-1 flex-wrap pt-0.5">
          <span className="text-[9px] font-bold uppercase text-white/40 mr-1">Trending:</span>
          {SUGGESTED_SEARCH_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setSearchQuery(chip);
                const match = FREE_MUSIC_LIBRARY.find(
                  (t) => t.title.toLowerCase().includes(chip.toLowerCase()) || t.artist.toLowerCase().includes(chip.toLowerCase())
                );
                if (match) handlePlayTrack(match);
              }}
              className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white/70 text-[10px] font-bold transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          EXACT FULL-TRACK AUDIO/VIDEO PLAYER STAGE (16:9)
      ══════════════════════════════════════════ */}
      <div className="p-5 sm:p-7 rounded-3xl bg-black border border-white/20 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/15 overflow-hidden flex-none shadow-md">
              <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono">
                {currentTrack.bitrate} · 100% FREE STREAM
              </span>
              <h3 className="text-base font-black text-white truncate">{currentTrack.title}</h3>
              <p className="text-xs text-white/50 truncate">{currentTrack.artist} · {currentTrack.albumOrFilm}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleLikeSong(currentTrack.id)}
            className={`p-2 rounded-xl text-xs font-bold border transition-colors self-start sm:self-auto ${likedSongIds.includes(currentTrack.id) ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-neutral-900 border-white/15 text-white/60'
              }`}
          >
            {likedSongIds.includes(currentTrack.id) ? '❤️ Liked' : '🤍 Like'}
          </button>
        </div>

        {/* Real Exact Full-Song Embedded Media Frame (Locked 16:9 Aspect Ratio) */}
        <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden bg-black border border-white/20 shadow-2xl aspect-[16/9]">
          <iframe
            key={currentTrack.youtubeId}
            src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3`}
            title={currentTrack.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FREE TRACKS LIBRARY & SEARCH
      ══════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-black text-white">Curated Free Soundtracks &amp; Hits</h3>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: '🌟 All Songs' },
            { id: 'liked', label: `❤️ Liked (${likedSongIds.length})` },
            { id: 'ost', label: '🎬 Movie OSTs' },
            { id: 'global', label: '🔥 Global Hits' },
            { id: 'bollywood', label: '🇮🇳 Bollywood' },
            { id: 'lofi', label: '🎧 Lo-Fi' },
            { id: 'anime', label: '🌸 Anime' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeCategory === cat.id
                  ? 'bg-white text-black shadow'
                  : 'bg-black text-white/70 hover:text-white border border-white/15'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tracks List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredTracks.map((track) => {
            const isSelected = currentTrack.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group shadow-lg active:scale-95 ${isSelected
                    ? 'bg-neutral-900 border-white shadow-xl ring-1 ring-white/40'
                    : 'bg-black border-white/15 hover:border-white/30'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-950 flex-none relative">
                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-black">▶</span>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs font-black text-white truncate">{track.title}</h4>
                    <p className="text-[11px] text-white/50 truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-none ml-2">
                  <span className="text-[11px] font-mono text-white/50">{track.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

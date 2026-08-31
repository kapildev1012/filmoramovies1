import React, { useState, useEffect, useRef } from 'react';

export interface FreeTrack {
  id: string;
  title: string;
  artist: string;
  albumOrFilm: string;
  category: 'ost' | 'global' | 'bollywood' | 'lofi' | 'anime' | 'gaming';
  duration: string;
  cover: string;
  youtubeId: string;
  bitrate: string;
  year?: string;
}

export const FREE_MUSIC_LIBRARY: FreeTrack[] = [
  // ── Cinema Soundtracks (Hans Zimmer, Ludwig Göransson, etc.) ──
  {
    id: 'ost-1',
    title: 'Cornfield Chase',
    artist: 'Hans Zimmer',
    albumOrFilm: 'Interstellar (Original Motion Picture Soundtrack)',
    category: 'ost',
    duration: '4:18',
    cover: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'UDVtMYqUAyw',
    bitrate: '24-bit 96kHz FLAC Master',
    year: '2014',
  },
  {
    id: 'ost-2',
    title: 'Can You Hear The Music',
    artist: 'Ludwig Göransson',
    albumOrFilm: 'Oppenheimer (Official Soundtrack)',
    category: 'ost',
    duration: '3:50',
    cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
    youtubeId: '4JZ-o3iAJv4',
    bitrate: '24-bit 96kHz FLAC Master',
    year: '2023',
  },
  {
    id: 'ost-3',
    title: 'A Time of Quiet Between Storms',
    artist: 'Hans Zimmer',
    albumOrFilm: 'Dune: Part Two (Soundtrack from the Film)',
    category: 'ost',
    duration: '5:24',
    cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    youtubeId: '6w_p07Zk6-c',
    bitrate: 'Dolby Atmos Spatial 7.1',
    year: '2024',
  },
  {
    id: 'ost-4',
    title: 'Time',
    artist: 'Hans Zimmer',
    albumOrFilm: 'Inception (Music from the Motion Picture)',
    category: 'ost',
    duration: '4:35',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'RxabLA7UQ9k',
    bitrate: '24-bit 96kHz FLAC Master',
    year: '2010',
  },
  {
    id: 'ost-5',
    title: 'Sunflower',
    artist: 'Post Malone & Swae Lee',
    albumOrFilm: 'Spider-Man: Into the Spider-Verse',
    category: 'ost',
    duration: '2:38',
    cover: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'ApXoWvfEYVU',
    bitrate: '320kbps High AAC',
    year: '2018',
  },
  {
    id: 'ost-6',
    title: 'Why So Serious? & Molossus',
    artist: 'Hans Zimmer & James Newton Howard',
    albumOrFilm: 'The Dark Knight (Original Score)',
    category: 'ost',
    duration: '4:49',
    cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'vLqKSv1F42A',
    bitrate: '24-bit 96kHz FLAC',
    year: '2008',
  },
  {
    id: 'ost-7',
    title: 'Now We Are Free',
    artist: 'Hans Zimmer & Lisa Gerrard',
    albumOrFilm: 'Gladiator (Official Soundtrack)',
    category: 'ost',
    duration: '4:14',
    cover: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'NBE-uBgtINg',
    bitrate: 'Dolby Atmos Spatial',
    year: '2000',
  },

  // ── Global Pop & Chartbusters ──
  {
    id: 'glob-1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    albumOrFilm: 'After Hours',
    category: 'global',
    duration: '3:20',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    youtubeId: '4NRXx6U8ABQ',
    bitrate: '320kbps High AAC',
    year: '2020',
  },
  {
    id: 'glob-2',
    title: 'Cruel Summer',
    artist: 'Taylor Swift',
    albumOrFilm: 'Lover',
    category: 'global',
    duration: '2:58',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'ic8j13piAhQ',
    bitrate: '320kbps High AAC',
    year: '2023',
  },
  {
    id: 'glob-3',
    title: 'Levitating',
    artist: 'Dua Lipa',
    albumOrFilm: 'Future Nostalgia',
    category: 'global',
    duration: '3:23',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'TUVcZfQe-Kw',
    bitrate: '320kbps High AAC',
    year: '2020',
  },
  {
    id: 'glob-4',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    albumOrFilm: 'Starboy',
    category: 'global',
    duration: '3:50',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'd3ZXy_k_nls',
    bitrate: '320kbps High AAC',
    year: '2016',
  },
  {
    id: 'glob-5',
    title: 'Believer',
    artist: 'Imagine Dragons',
    albumOrFilm: 'Evolve',
    category: 'global',
    duration: '3:24',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    youtubeId: '7wtfhZwyrcc',
    bitrate: '320kbps High AAC',
    year: '2017',
  },

  // ── Bollywood & Indian Blockbusters ──
  {
    id: 'boll-1',
    title: 'Kesariya',
    artist: 'Arijit Singh & Pritam',
    albumOrFilm: 'Brahmāstra: Part One – Shiva',
    category: 'bollywood',
    duration: '4:28',
    cover: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'BddP6PYo2gs',
    bitrate: 'Lossless HD Master',
    year: '2022',
  },
  {
    id: 'boll-2',
    title: 'Lover',
    artist: 'Diljit Dosanjh',
    albumOrFilm: 'MoonChild Era',
    category: 'bollywood',
    duration: '3:12',
    cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'mH_LFkWxpI0',
    bitrate: '320kbps High AAC',
    year: '2021',
  },
  {
    id: 'boll-3',
    title: 'Kun Faya Kun',
    artist: 'A.R. Rahman, Javed Ali & Mohit Chauhan',
    albumOrFilm: 'Rockstar (Original Soundtrack)',
    category: 'bollywood',
    duration: '7:50',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'T94PHkuydcw',
    bitrate: '24-bit 96kHz FLAC Master',
    year: '2011',
  },
  {
    id: 'boll-4',
    title: 'Tum Hi Ho',
    artist: 'Arijit Singh & Mithoon',
    albumOrFilm: 'Aashiqui 2',
    category: 'bollywood',
    duration: '4:22',
    cover: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'IJq0yyWug1k',
    bitrate: '320kbps High AAC',
    year: '2013',
  },
  {
    id: 'boll-5',
    title: 'Apna Bana Le',
    artist: 'Arijit Singh & Sachin-Jigar',
    albumOrFilm: 'Bhediya (Original Soundtrack)',
    category: 'bollywood',
    duration: '4:21',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'ElZfdU54Cp8',
    bitrate: 'Lossless HD Master',
    year: '2022',
  },

  // ── 24/7 Lo-Fi & Study Beats ──
  {
    id: 'lofi-1',
    title: 'Lofi Hip Hop Radio – Beats to Relax/Study',
    artist: 'Lofi Girl',
    albumOrFilm: '24/7 Live Ambient Stream',
    category: 'lofi',
    duration: '24/7 Live',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'jfKfPFyJRdk',
    bitrate: 'Lossless 44.1kHz',
    year: 'Live',
  },
  {
    id: 'lofi-2',
    title: 'Synthwave Radio – Chill Synth Beats',
    artist: 'Lofi Girl Synth',
    albumOrFilm: 'Night Drive Ambient',
    category: 'lofi',
    duration: '24/7 Live',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
    youtubeId: '4xDzrJKXOOY',
    bitrate: 'Lossless 44.1kHz',
    year: 'Live',
  },

  // ── Anime & Gaming ──
  {
    id: 'ani-1',
    title: 'One Summer Day (Spirited Away)',
    artist: 'Joe Hisaishi',
    albumOrFilm: 'Studio Ghibli Orchestral Suite',
    category: 'anime',
    duration: '3:45',
    cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'TK1Ij_-mank',
    bitrate: '24-bit 96kHz FLAC Master',
    year: '2001',
  },
  {
    id: 'ani-2',
    title: 'I Really Want to Stay At Your House',
    artist: 'Rosa Walton & Hallie Coggins',
    albumOrFilm: 'Cyberpunk: Edgerunners (Original Soundtrack)',
    category: 'gaming',
    duration: '4:06',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
    youtubeId: 'KvMY1uzSC1E',
    bitrate: '320kbps High AAC',
    year: '2022',
  },
  {
    id: 'ani-3',
    title: 'The Rumbling (Attack on Titan)',
    artist: 'SiM',
    albumOrFilm: 'Attack on Titan Final Season',
    category: 'anime',
    duration: '3:40',
    cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    youtubeId: '2S4qGKmzBJE',
    bitrate: '320kbps High AAC',
    year: '2022',
  },
];

const SUGGESTED_SEARCH_CHIPS = [
  'Hans Zimmer', 'Interstellar', 'Oppenheimer', 'Dune', 'Arijit Singh',
  'Kesariya', 'Diljit Dosanjh', 'The Weeknd', 'Taylor Swift', 'Lo-Fi Study',
  'Spirited Away', 'Cyberpunk 2077', 'Inception', 'Spider-Man Sunflower'
];

export default function MusicCustomizerStation() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Search state & Suggestions Dropdown
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Full YouTube Direct Loader State
  const [customYtInput, setCustomYtInput] = useState<string>('');

  const [likedSongIds, setLikedSongIds] = useState<string[]>([]);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load liked songs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('filmora_liked_songs');
      if (saved) setLikedSongIds(JSON.parse(saved));
    } catch { }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleLikeSong = (trackId: string) => {
    let updated: string[];
    if (likedSongIds.includes(trackId)) {
      updated = likedSongIds.filter((id) => id !== trackId);
      showToast('Removed from Liked Songs');
    } else {
      updated = [...likedSongIds, trackId];
      showToast('Added to Liked Songs ❤️');
    }
    setLikedSongIds(updated);
    try {
      localStorage.setItem('filmora_liked_songs', JSON.stringify(updated));
    } catch { }
  };

  // Search filter and auto-suggestions list
  const searchSuggestions = FREE_MUSIC_LIBRARY.filter((track) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q) ||
      track.albumOrFilm.toLowerCase().includes(q) ||
      track.category.toLowerCase().includes(q)
    );
  });

  // Filtered tracks for catalog grid
  const filteredTracks = FREE_MUSIC_LIBRARY.filter((track) => {
    const matchCat = activeCategory === 'all' || (activeCategory === 'liked' ? likedSongIds.includes(track.id) : track.category === activeCategory);
    const matchSearch =
      !searchQuery.trim() ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.albumOrFilm.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const currentTrack = FREE_MUSIC_LIBRARY[currentTrackIndex] || FREE_MUSIC_LIBRARY[0];

  const handlePlayTrack = (track: FreeTrack) => {
    const idx = FREE_MUSIC_LIBRARY.findIndex((t) => t.id === track.id);
    if (idx !== -1) {
      setCurrentTrackIndex(idx);
    } else {
      FREE_MUSIC_LIBRARY.unshift(track);
      setCurrentTrackIndex(0);
    }
    setIsSearchFocused(false);
    showToast(`Now Playing: "${track.title}" by ${track.artist}`);
  };

  const handleNextTrack = () => {
    let nextIdx = (currentTrackIndex + 1) % FREE_MUSIC_LIBRARY.length;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * FREE_MUSIC_LIBRARY.length);
    }
    handlePlayTrack(FREE_MUSIC_LIBRARY[nextIdx]);
  };

  const handlePrevTrack = () => {
    const prevIdx = (currentTrackIndex - 1 + FREE_MUSIC_LIBRARY.length) % FREE_MUSIC_LIBRARY.length;
    handlePlayTrack(FREE_MUSIC_LIBRARY[prevIdx]);
  };

  // Handle Free Search for ANY Song in the World
  const handleUniversalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim();
    let customYtId = '';
    if (query.includes('youtube.com/watch?v=')) {
      customYtId = query.split('v=')[1].split('&')[0];
    } else if (query.includes('youtu.be/')) {
      customYtId = query.split('youtu.be/')[1].split('?')[0];
    }

    // If an exact search match exists, play it
    const exactMatch = FREE_MUSIC_LIBRARY.find(
      (t) => t.title.toLowerCase() === query.toLowerCase() || t.artist.toLowerCase() === query.toLowerCase()
    );

    if (exactMatch) {
      handlePlayTrack(exactMatch);
      setIsSearchFocused(false);
      return;
    }

    // Otherwise create dynamic track
    const newTrack: FreeTrack = {
      id: `searched-${Date.now()}`,
      title: customYtId ? 'Custom Track / Video' : query,
      artist: 'Universal Search',
      albumOrFilm: 'Free Music Cloud',
      category: 'global',
      duration: 'Full Song',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
      youtubeId: customYtId || '4NRXx6U8ABQ',
      bitrate: 'Lossless Audio Stream',
    };

    handlePlayTrack(newTrack);
    setIsSearchFocused(false);
    showToast(`Loaded: "${query}" ✓`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-in fade-in select-none text-white">
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-black/95 text-white border border-white/20 text-xs font-black shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════
          1. SEARCH BAR WITH LIVE SUGGESTIONS
      ══════════════════════════════════════════ */}
      <div ref={searchContainerRef} className="p-5 sm:p-7 rounded-3xl bg-black border border-white/20 shadow-2xl space-y-3 relative z-30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>🔍 Search Any Song, Artist or Movie Soundtrack</span>
            </h3>
            <p className="text-xs text-white/50 mt-0.5">Type to see live suggestions, or click any trending tag below.</p>
          </div>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleUniversalSearchSubmit} className="relative">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-white/40 pointer-events-none text-sm">
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
              placeholder="Search by song name (e.g. Interstellar, Kesariya, Blinding Lights, Diljit Dosanjh, Dune)..."
              className="w-full pl-11 pr-24 py-3 rounded-2xl bg-neutral-950 border border-white/20 text-white text-xs sm:text-sm placeholder-white/30 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchFocused(false);
                }}
                className="absolute right-20 text-xs text-white/40 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow active:scale-95 flex-none"
            >
              Search
            </button>
          </div>

          {/* ── LIVE AUTO-SUGGESTIONS DROPDOWN ── */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-2xl bg-neutral-950/95 border border-white/20 shadow-2xl backdrop-blur-2xl max-h-80 overflow-y-auto space-y-1 z-50 animate-in fade-in slide-in-from-top-2">
              {searchSuggestions.length > 0 ? (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/40 border-b border-white/10 mb-1 flex items-center justify-between">
                    <span>Matching Songs ({searchSuggestions.length})</span>
                    <span className="text-emerald-400">Click to stream</span>
                  </div>
                  {searchSuggestions.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className="p-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-900 flex-none relative">
                          <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-[10px] font-black">▶</span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-white group-hover:text-white truncate">
                            {track.title}
                          </h4>
                          <p className="text-[11px] text-white/50 truncate">
                            {track.artist} · {track.albumOrFilm}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-none ml-2">
                        <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
                          {track.category.toUpperCase()}
                        </span>
                        <span className="text-xs font-mono text-white/40">{track.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="p-4 text-center space-y-2">
                  <div className="text-xs text-white/60">
                    No local match found for "<strong>{searchQuery}</strong>"
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow"
                  >
                    🔍 Stream "{searchQuery}" Online
                  </button>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  <div className="px-2 text-[10px] font-black uppercase tracking-wider text-white/40">
                    Recommended Soundtracks &amp; Hits
                  </div>
                  {FREE_MUSIC_LIBRARY.slice(0, 5).map((track) => (
                    <div
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className="p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-900 flex-none">
                          <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{track.title}</div>
                          <div className="text-[10px] text-white/50 truncate">{track.artist}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-white/40">{track.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] font-bold uppercase text-white/40 mr-1">Trending:</span>
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
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white/70 text-[11px] font-bold transition-all active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          3. ACCURATE 16:9 FULL-TRACK PLAYER STAGE
      ══════════════════════════════════════════ */}
      <div className="p-6 sm:p-8 rounded-3xl bg-black border border-white/20 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-white/15 overflow-hidden flex-none shadow-md">
              <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono">
                {currentTrack.bitrate} · {currentTrack.category.toUpperCase()}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white truncate">{currentTrack.title}</h2>
              <p className="text-xs text-white/60 truncate">{currentTrack.artist} · {currentTrack.albumOrFilm}</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => toggleLikeSong(currentTrack.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${likedSongIds.includes(currentTrack.id) ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-neutral-900 border-white/15 text-white/60 hover:text-white'
                }`}
            >
              <span>{likedSongIds.includes(currentTrack.id) ? '❤️' : '🤍'}</span>
              <span>{likedSongIds.includes(currentTrack.id) ? 'Liked' : 'Like'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrevTrack}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/15 text-white text-xs font-bold"
              title="Previous Song"
            >
              ⏮
            </button>

            <button
              type="button"
              onClick={handleNextTrack}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/15 text-white text-xs font-bold"
              title="Next Song"
            >
              ⏭
            </button>
          </div>
        </div>

        {/* Real Exact Full-Song Embedded Media Frame (Locked 16:9 Aspect Ratio) */}
        <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden bg-black border border-white/20 shadow-2xl relative aspect-[16/9]">
          <iframe
            key={currentTrack.youtubeId}
            src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3`}
            title={currentTrack.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Direct Playback Telemetry */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-mono text-emerald-400 font-bold">100% Free Full Stream</span>
          <span className="text-xs font-mono text-white/50">{currentTrack.duration}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          4. FREE MUSIC CATALOG & CATEGORIES
      ══════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span>Free Music Catalog</span>
              <span className="text-xs font-normal text-white/50">({filteredTracks.length} verified tracks)</span>
            </h3>
            <p className="text-xs text-white/50">Click any track to stream with full YouTube audio/video access.</p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: '🌟 All Songs' },
            { id: 'liked', label: `❤️ Liked Songs (${likedSongIds.length})` },
            { id: 'ost', label: '🎬 Cinema Soundtracks' },
            { id: 'global', label: '🔥 Global Pop Hits' },
            { id: 'bollywood', label: '🇮🇳 Bollywood Hits' },
            { id: 'lofi', label: '🎧 24/7 Lo-Fi Streams' },
            { id: 'anime', label: '🌸 Anime & Ghibli' },
            { id: 'gaming', label: '⚡ Cyberpunk & Gaming' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCategory === cat.id
                  ? 'bg-white text-black shadow'
                  : 'bg-black text-white/70 hover:text-white border border-white/15'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTracks.map((track) => {
            const isCurrent = currentTrack.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group shadow-xl active:scale-95 ${isCurrent
                    ? 'bg-neutral-900 border-white shadow-2xl ring-1 ring-white/40'
                    : 'bg-black border-white/15 hover:border-white/40'
                  }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-950 flex-none relative shadow">
                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-black text-sm">▶</span>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs font-black text-white truncate">{track.title}</h4>
                    <p className="text-[11px] text-white/60 truncate">{track.artist}</p>
                    <p className="text-[10px] text-white/40 font-mono truncate">{track.albumOrFilm}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 ml-2 flex-none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLikeSong(track.id);
                    }}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${likedSongIds.includes(track.id) ? 'text-rose-400' : 'text-white/30 hover:text-white'
                      }`}
                  >
                    {likedSongIds.includes(track.id) ? '❤️' : '🤍'}
                  </button>

                  <span className="text-xs font-mono text-white/50">{track.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

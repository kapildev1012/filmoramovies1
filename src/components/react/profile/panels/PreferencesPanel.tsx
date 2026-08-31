import React, { useState } from 'react';
import type { DBUser } from '../../../../lib/db';
import { IconPreferences, IconSparkles } from '../ProfileIcons';

interface PreferencesPanelProps {
  user: DBUser;
  onUpdatePreferences: (genres: string[], language: string) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

const ALL_GENRES = [
  'Action', 'Adventure', 'Anime', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Thriller',
  'Mystery', 'Family', 'Animation', 'War', 'Western', 'Music'
];

const LANGUAGES = [
  'English (US)', 'English (UK)', 'Hindi (हिन्दी)', 'Spanish (Español)',
  'French (Français)', 'German (Deutsch)', 'Japanese (日本語)', 'Korean (한국어)'
];

const STREAMING_VIBES = [
  { id: 'adrenaline', label: '🔥 Adrenaline & High Octane', desc: 'Fast-paced action, stunts, and blockbuster chases' },
  { id: 'mindbend', label: '🧠 Mind-Bending & Sci-Fi', desc: 'Time travel, multiverse, psychological twists' },
  { id: 'darknoir', label: '🌑 Dark & Gritty Noir', desc: 'Crime thrillers, detectives, and suspenseful mysteries' },
  { id: 'feelgood', label: '✨ Feel-Good & Uplifting', desc: 'Heartwarming comedies, inspiring journeys' },
];

export default function PreferencesPanel({
  user,
  onUpdatePreferences,
  onShowToast,
}: PreferencesPanelProps) {
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(() => {
    try {
      return user.genres ? JSON.parse(user.genres) : ['Action', 'Sci-Fi', 'Thriller'];
    } catch {
      return ['Action', 'Sci-Fi', 'Thriller'];
    }
  });
  const [language, setLanguage] = useState<string>(user.language || 'English (US)');
  const [selectedVibe, setSelectedVibe] = useState<string>('mindbend');
  const [saving, setSaving] = useState(false);

  const toggleFavorite = (g: string) => {
    if (favoriteGenres.includes(g)) {
      if (favoriteGenres.length > 1) {
        setFavoriteGenres(favoriteGenres.filter((item) => item !== g));
      }
    } else {
      setFavoriteGenres([...favoriteGenres, g]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await onUpdatePreferences(favoriteGenres, language);
    setSaving(false);
    if (ok) {
      onShowToast('Streaming recommendation preferences saved ✓');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      {/* ── Dulo Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-purple-500/20">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20 text-pink-400 border border-purple-500/30 shadow-lg shadow-purple-900/20">
              <IconPreferences className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="bg-gradient-to-r from-white via-white to-pink-200 bg-clip-text text-transparent">
              Streaming Preferences &amp; Recommendations
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Fine-tune Filmora's AI recommendation engine with your favorite genres, movie vibes, and audio languages.
          </p>
        </div>

        {/* Dulo Gradient Primary Action Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-pink-900/40 active:scale-95 flex items-center gap-2"
        >
          <IconSparkles className="w-3.5 h-3.5 text-white" />
          <span>{saving ? 'Saving…' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════
          1. DULO FAVORITE GENRES SELECTOR
      ══════════════════════════════════════════ */}
      <div className="p-5 sm:p-7 rounded-3xl bg-neutral-900/90 border border-purple-500/20 shadow-xl space-y-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider text-purple-300">
              Favorite Genres (AI Feed Priority)
            </h3>
            <p className="text-xs text-white/50 mt-0.5">Select your top streaming genres to personalize homepage rails.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 text-[10px] font-black uppercase border border-pink-500/30">
            {favoriteGenres.length} Selected
          </span>
        </div>

        {/* Dulo Glowing Pills Matrix */}
        <div className="flex flex-wrap gap-2.5 relative z-10 pt-1">
          {ALL_GENRES.map((g) => {
            const isFav = favoriteGenres.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleFavorite(g)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 shadow-md ${
                  isFav
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white border border-pink-400/50 shadow-lg shadow-purple-900/40 ring-1 ring-white/20'
                    : 'bg-neutral-950/80 text-white/70 hover:bg-neutral-900 hover:text-white border border-white/10 hover:border-purple-500/40'
                }`}
              >
                <span className={isFav ? 'text-white' : 'text-white/40'}>{isFav ? '✓' : '+'}</span>
                <span>{g}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          2. DULO MOOD & STREAMING VIBES
      ══════════════════════════════════════════ */}
      <div className="p-5 sm:p-7 rounded-3xl bg-neutral-900/90 border border-purple-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider text-pink-300">
              Primary Movie &amp; Series Vibe
            </h3>
            <p className="text-xs text-white/50 mt-0.5">Defines the default tone of recommended movie drops.</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
            Vibe Signal
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STREAMING_VIBES.map((vibe) => {
            const isVibe = selectedVibe === vibe.id;
            return (
              <div
                key={vibe.id}
                onClick={() => setSelectedVibe(vibe.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-md active:scale-95 ${
                  isVibe
                    ? 'bg-gradient-to-br from-purple-950/80 via-pink-950/50 to-neutral-950 border-pink-500 text-white shadow-xl shadow-purple-950/50 ring-1 ring-pink-400/40'
                    : 'bg-neutral-950/70 border-white/10 hover:border-purple-500/30 text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-white">{vibe.label}</div>
                  {isVibe && (
                    <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-black uppercase">
                      Active Vibe
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/50 mt-1">{vibe.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          3. AUDIO TRACK & PREFERRED LANGUAGE
      ══════════════════════════════════════════ */}
      <div className="p-5 sm:p-7 rounded-3xl bg-neutral-900/90 border border-purple-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider text-purple-300">
            Preferred Audio Language Track
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
            Audio Channel
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLanguage(l)}
              className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 shadow-md ${
                language === l
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-pink-400 shadow-lg shadow-purple-900/30 ring-1 ring-white/20'
                  : 'bg-neutral-950/70 border-white/10 hover:border-purple-500/30 text-white/70 hover:text-white'
              }`}
            >
              <div className="text-xs font-black">{l}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

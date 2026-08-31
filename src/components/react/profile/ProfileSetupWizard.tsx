import React, { useState } from 'react';
import type { DBUser, DBProfile } from '../../../lib/db';
import {
  IconUser,
  IconPreferences,
  IconPlayback,
  IconSparkles,
  IconShield,
  IconGlobe,
  IconCamera,
} from './ProfileIcons';

interface ProfileSetupWizardProps {
  user: DBUser;
  activeProfile: DBProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteSetup: (userData: Partial<DBUser>, profileData?: { name: string; color: string; isKids: boolean }) => Promise<boolean>;
  onShowToast: (msg: string) => void;
  mode?: 'user_onboarding' | 'new_profile';
}

const PALETTE = [
  '#ffffff', '#7c3aed', '#ec4899', '#3b82f6', '#10b981',
  '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#14b8a6'
];

const AVATAR_PRESETS = [
  { id: 'p-1', name: 'Cyberpunk', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop' },
  { id: 'p-2', name: 'Director', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop' },
  { id: 'p-3', name: 'Noir Pilot', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop' },
  { id: 'p-4', name: 'Cosmic', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop' },
];

const GENRE_OPTIONS = [
  'Action', 'Sci-Fi', 'Thriller', 'Drama', 'Anime', 'Comedy',
  'Crime', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Adventure'
];

const LANGUAGE_OPTIONS = [
  'English (US)', 'English (UK)', 'Hindi (हिन्दी)', 'Spanish (Español)',
  'French (Français)', 'German (Deutsch)', 'Japanese (日本語)', 'Korean (한국어)'
];

const REGION_OPTIONS = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'Global'
];

export default function ProfileSetupWizard({
  user,
  activeProfile,
  isOpen,
  onClose,
  onCompleteSetup,
  onShowToast,
  mode = 'user_onboarding',
}: ProfileSetupWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState(mode === 'new_profile' ? '' : (user.name || ''));
  const [username, setUsername] = useState(mode === 'new_profile' ? '' : (user.username || ''));
  const [bio, setBio] = useState(mode === 'new_profile' ? 'Filmora Household Cinema Member' : (user.bio || 'Cinema & Anime enthusiast · 4K Dolby Atmos Streamer'));
  const [avatarColor, setAvatarColor] = useState(activeProfile?.avatar_color || '#ffffff');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isKids, setIsKids] = useState(false);
  const [country, setCountry] = useState(user.country || 'Global');

  // Genres & Language
  const initialGenres: string[] = (() => {
    try {
      return user.genres ? JSON.parse(user.genres) : ['Action', 'Sci-Fi', 'Thriller'];
    } catch {
      return ['Action', 'Sci-Fi', 'Thriller'];
    }
  })();
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
  const [selectedLanguage, setSelectedLanguage] = useState(user.language || 'English (US)');

  // Playback & Quality
  const [streamQuality, setStreamQuality] = useState<'4k' | '1080p' | 'auto'>('4k');
  const [audioFormat, setAudioFormat] = useState<'atmos' | 'stereo'>('atmos');
  const [autoplayNext, setAutoplayNext] = useState<boolean>(true);
  const [ambientLighting, setAmbientLighting] = useState<boolean>(true);

  if (!isOpen) return null;

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genre));
      }
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleFinish = async () => {
    if (!name.trim()) {
      onShowToast('Please enter a profile name');
      setStep(1);
      return;
    }

    setLoading(true);
    const ok = await onCompleteSetup(
      {
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio: bio.trim(),
        country,
        language: selectedLanguage,
        genres: JSON.stringify(selectedGenres),
        avatar_url: avatarUrl || user.avatar_url,
      },
      mode === 'new_profile'
        ? { name: name.trim(), color: avatarColor, isKids }
        : undefined
    );

    setLoading(false);
    if (ok) {
      onShowToast(mode === 'new_profile' ? 'Household Profile created successfully! ✓' : 'Profile setup completed! Welcome to Filmora ✓');
      onClose();
    } else {
      onShowToast('Profile preferences saved ✓');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in select-none">
      <div className="relative w-full max-w-xl bg-black border border-white/20 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden space-y-5 text-white max-h-[92vh] overflow-y-auto scrollbar-none">
        {/* Background atmospheric lighting */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* ── Top Header & Step Progress Indicator ── */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-black uppercase border border-white/15">
                {mode === 'new_profile' ? 'New Household Pass' : 'Filmora VIP Setup'}
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">Step {step} of 4</span>
            </div>
            <h3 className="text-base sm:text-xl font-black text-white mt-1">
              {step === 1 && '1. Identity, Avatar & Pass Color'}
              {step === 2 && '2. Favorite Genres & Languages'}
              {step === 3 && '3. 4K Engine & Audio Staging'}
              {step === 4 && '4. Review & Launch Member Pass'}
            </h3>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── Step Progress Indicator Bars ── */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-white shadow' : 'bg-neutral-800'
              }`}
            />
          ))}
        </div>

        {/* ══════════════════════════════════════════
            STEP 1: IDENTITY, AVATAR & PASS COLOR
        ══════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            {/* Live Profile Pass Avatar Preview */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-white/15 flex flex-col sm:flex-row items-center gap-4">
              <div
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-black shadow-2xl flex-none border-2 border-white overflow-hidden relative"
                style={{ backgroundColor: avatarUrl ? '#000000' : avatarColor }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(name || user.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                <label className="text-[11px] font-black uppercase text-white/50 tracking-wider">
                  Select Cinema Avatar or Pass Color
                </label>

                {/* Character presets */}
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {AVATAR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAvatarUrl(p.url)}
                      className={`w-8 h-8 rounded-xl overflow-hidden border transition-transform active:scale-90 ${
                        avatarUrl === p.url ? 'border-white ring-2 ring-white scale-105' : 'border-white/20 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(null)}
                      className="text-[10px] text-white/50 hover:text-white underline pl-1"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Color Palette */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setAvatarColor(c);
                        setAvatarUrl(null);
                      }}
                      className={`w-5 h-5 rounded-full transition-transform active:scale-90 ${
                        !avatarUrl && avatarColor === c ? 'ring-2 ring-white scale-110 shadow' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Inputs: Name, Handle, Bio */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-white/80 block mb-1">Profile / Member Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kapil"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs placeholder-white/30 focus:outline-none focus:border-white transition-all font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-black text-white/80 block mb-1">Public Cinema Handle</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-white/40 font-mono font-bold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="kapil"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs placeholder-white/30 focus:outline-none focus:border-white transition-all font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-white/80 block mb-1">Bio / Streaming Quote</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Cinema enthusiast, 4K sci-fi lover"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs placeholder-white/30 focus:outline-none focus:border-white transition-all"
                />
              </div>

              {/* Kids Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950 border border-white/15">
                <div>
                  <div className="text-xs font-black text-white">Kids Mode Restriction</div>
                  <div className="text-[10px] text-white/50">Restricts content strictly to family and G/PG ratings</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsKids(!isKids)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    isKids ? 'bg-white text-black' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                      isKids ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP 2: GENRES & LANGUAGE PREFERENCES
        ══════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-white">
                  Favorite Genres <span className="text-[10px] text-white/50">(Personalize recommendations)</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  {selectedGenres.length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {GENRE_OPTIONS.map((genre) => {
                  const isSelected = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all active:scale-95 border ${
                        isSelected
                          ? 'bg-white text-black border-white shadow-lg'
                          : 'bg-neutral-950 text-white/70 border-white/15 hover:border-white/30'
                      }`}
                    >
                      <span>{isSelected ? '✓ ' : '+ '}</span>
                      <span>{genre}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-black text-white block mb-1">Preferred Audio &amp; Subtitles</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs focus:outline-none"
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l} value={l} className="bg-neutral-900 text-white">
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-white block mb-1">Country / Regional Catalog</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs focus:outline-none"
                >
                  {REGION_OPTIONS.map((r) => (
                    <option key={r} value={r} className="bg-neutral-900 text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP 3: 4K ENGINE & AUDIO STAGING
        ══════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            {/* Stream Quality Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black text-white block">Default Stream Resolution</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '4k', label: '4K Ultra HD', desc: 'Direct 2160p HDR' },
                  { id: '1080p', label: '1080p Full HD', desc: 'Balanced Bandwidth' },
                  { id: 'auto', label: 'Adaptive Auto', desc: 'Data Saver' },
                ].map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setStreamQuality(q.id as any)}
                    className={`p-3 rounded-2xl text-left border transition-all active:scale-95 shadow-md ${
                      streamQuality === q.id
                        ? 'bg-white text-black border-white shadow-xl'
                        : 'bg-neutral-950 text-white/70 border-white/15 hover:border-white/30'
                    }`}
                  >
                    <div className="text-xs font-black">{q.label}</div>
                    <div className={`text-[10px] mt-0.5 ${streamQuality === q.id ? 'opacity-80' : 'text-white/40'}`}>
                      {q.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Channel Tier */}
            <div className="space-y-2">
              <label className="text-xs font-black text-white block">Acoustic Audio Channel</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'atmos', label: 'Dolby Atmos Spatial 7.1', desc: 'Cinema spatial sound staging' },
                  { id: 'stereo', label: 'Stereo Hi-Fi 320kbps', desc: 'Standard high-definition audio' },
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAudioFormat(a.id as any)}
                    className={`p-3 rounded-2xl text-left border transition-all active:scale-95 shadow-md ${
                      audioFormat === a.id
                        ? 'bg-white text-black border-white shadow-xl'
                        : 'bg-neutral-950 text-white/70 border-white/15 hover:border-white/30'
                    }`}
                  >
                    <div className="text-xs font-black">{a.label}</div>
                    <div className={`text-[10px] mt-0.5 ${audioFormat === a.id ? 'opacity-80' : 'text-white/40'}`}>
                      {a.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Toggles */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-white/15">
                <div>
                  <div className="text-xs font-black text-white">Autoplay Next Episode</div>
                  <div className="text-[10px] text-white/50">Seamless series binge streaming</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoplayNext(!autoplayNext)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    autoplayNext ? 'bg-white' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                      autoplayNext ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-white/15">
                <div>
                  <div className="text-xs font-black text-white">Atmospheric Ambient Glow</div>
                  <div className="text-[10px] text-white/50">Dynamic color extraction glow around video player</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAmbientLighting(!ambientLighting)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    ambientLighting ? 'bg-white' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                      ambientLighting ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP 4: REVIEW & LAUNCH MEMBER PASS
        ══════════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            {/* VIP Cinema Member Pass Card */}
            <div className="p-5 rounded-3xl bg-neutral-950 border-2 border-white/30 shadow-2xl space-y-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                  FILMORA CINEMA PASS
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-black uppercase">
                  4K Ultra HD
                </span>
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-black shadow-xl flex-none border-2 border-white overflow-hidden"
                  style={{ backgroundColor: avatarUrl ? '#000000' : avatarColor }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(name || user.name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="text-base font-black text-white flex items-center gap-2">
                    <span>{name || user.name || 'Kapil'}</span>
                    <span className="w-4 h-4 rounded-full bg-sky-500 text-black flex items-center justify-center text-[9px] font-black">
                      ✓
                    </span>
                  </div>
                  <div className="text-xs text-white/60 font-mono font-bold">
                    @{username || 'user'} · {country}
                  </div>
                  {isKids && (
                    <span className="inline-block text-[9px] font-black uppercase px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Kids Safe
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white/40 block text-[9px]">RESOLUTION</span>
                  <strong className="text-white font-bold">{streamQuality.toUpperCase()} HDR</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white/40 block text-[9px]">AUDIO</span>
                  <strong className="text-white font-bold">Dolby Atmos</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white/40 block text-[9px]">LANGUAGE</span>
                  <strong className="text-white font-bold truncate block">{selectedLanguage.split(' ')[0]}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white/40 block text-[9px]">GENRES</span>
                  <strong className="text-white font-bold">{selectedGenres.length} Boosted</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer Navigation Buttons ── */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs border border-white/15 transition-all active:scale-95"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !name.trim()) {
                  onShowToast('Please enter a display name');
                  return;
                }
                setStep(step + 1);
              }}
              className="px-6 py-2.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-lg active:scale-95"
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="px-7 py-2.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-2xl active:scale-95 flex items-center gap-2"
            >
              <IconSparkles className="w-3.5 h-3.5 fill-black" />
              <span>{loading ? 'Launching Pass…' : 'Launch & Save Profile'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

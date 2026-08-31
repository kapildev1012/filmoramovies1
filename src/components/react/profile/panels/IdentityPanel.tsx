import React, { useState } from 'react';
import type { DBUser } from '../../../../lib/db';
import { IconUser, IconGlobe, IconCalendar, IconSparkles } from '../ProfileIcons';

interface IdentityPanelProps {
  user: DBUser;
  onUpdateProfile: (data: Partial<DBUser>) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'India', 'Japan', 'Brazil', 'Mexico', 'Global'
];

const LANGUAGES = [
  'English (US)', 'English (UK)', 'Spanish (Español)', 'French (Français)',
  'German (Deutsch)', 'Hindi (हिन्दी)', 'Japanese (日本語)', 'Portuguese (Português)'
];

const TIMEZONES = [
  'UTC-08:00 (Pacific Time)', 'UTC-05:00 (Eastern Time)', 'UTC+00:00 (London/GMT)',
  'UTC+01:00 (Central European)', 'UTC+05:30 (India/IST)', 'UTC+09:00 (Tokyo/JST)'
];

const BANNERS = [
  { id: '/images/profile-banner-default.jpg', label: 'Cosmic Cinema', url: '/images/profile-banner-default.jpg' },
  { id: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80', label: 'Interstellar', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80' },
  { id: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80', label: 'Cyberpunk', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80' },
  { id: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&auto=format&fit=crop&q=80', label: 'Aurora Night', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&auto=format&fit=crop&q=80' },
];

export default function IdentityPanel({ user, onUpdateProfile, onShowToast }: IdentityPanelProps) {
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [country, setCountry] = useState(user.country || 'Global');
  const [language, setLanguage] = useState(user.language || 'English (US)');
  const [timezone, setTimezone] = useState(user.timezone || 'UTC+00:00 (London/GMT)');
  const [dob, setDob] = useState(user.dob || '');
  const [bannerUrl, setBannerUrl] = useState(user.banner_url || '/images/profile-banner-default.jpg');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const ok = await onUpdateProfile({
      name,
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
      bio,
      country,
      language,
      timezone,
      dob,
      banner_url: bannerUrl,
    });

    setSaving(false);
    if (ok) {
      onShowToast('Profile details saved to database ✓');
    } else {
      setError('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white/10 text-white border border-white/15">
              <IconUser className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span>Profile Identity &amp; Bio</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Update your public streaming persona, handle, region, and background wallpaper.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="self-start sm:self-auto px-6 py-2.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── 1. Name & Username ── */}
        <div className="profile-card p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Identity &amp; Handle
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
              Public Persona
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/70">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
                placeholder="Alex Morgan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs focus:outline-none focus:border-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/70">Unique Username (@handle)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-white/40 font-mono font-bold">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  maxLength={30}
                  placeholder="alex_morgan"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs focus:outline-none focus:border-white transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white/70">Streaming Bio / Tagline</label>
              <span className="text-[10px] text-white/40 font-mono">{bio.length}/300</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Sci-Fi fanatic, Marvel marathoner, and late-night anime streamer…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs focus:outline-none focus:border-white transition-all resize-none font-medium leading-relaxed"
            />
          </div>
        </div>

        {/* ── 2. Background Wallpaper Presets ── */}
        <div className="profile-card p-5 sm:p-7 space-y-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Profile Background Wallpaper
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Select a cinematic cover photo for your profile header.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BANNERS.map((b) => (
              <div
                key={b.id}
                onClick={() => setBannerUrl(b.url)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all active:scale-95 ${
                  bannerUrl === b.url ? 'border-white shadow-xl ring-2 ring-white/50' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div
                  className="h-20 sm:h-24 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${b.url})` }}
                />
                <div className="p-2 bg-neutral-950 text-center">
                  <div className="text-[11px] font-bold text-white truncate">{b.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. Localization & Region ── */}
        <div className="profile-card p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Localization &amp; Region
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
              Global
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/70">Country / Catalog</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs focus:outline-none focus:border-white transition-all"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} className="bg-neutral-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/70">Display Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs focus:outline-none focus:border-white transition-all"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l} className="bg-neutral-900 text-white">
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/70">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs focus:outline-none focus:border-white transition-all"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} className="bg-neutral-900 text-white">
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

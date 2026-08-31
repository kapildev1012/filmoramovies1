import React, { useState } from 'react';
import type { DBUser, DBProfile } from '../../../lib/db';
import {
  IconCamera,
  IconGlobe,
  IconCalendar,
  IconSparkles,
  IconShield,
  IconPlayback,
} from './ProfileIcons';

interface ProfileHeaderProps {
  user: DBUser;
  profiles: DBProfile[];
  activeProfile: DBProfile | null;
  completionScore: number;
  onSwitchProfile: (profileId: string) => void;
  onOpenAvatarModal: () => void;
  onNavigateTab: (tabId: string) => void;
  onOpenSetupWizard?: () => void;
}

function formatUserIdentifier(email?: string | null) {
  if (!email) return '';
  if (email.endsWith('@phone.filmora.local')) {
    const raw = email.replace('@phone.filmora.local', '');
    if (raw.startsWith('91') && raw.length === 12) {
      return `+91 ${raw.slice(2, 7)} ${raw.slice(7)}`;
    }
    return `+${raw}`;
  }
  return email;
}

function cleanUsername(rawUsername?: string | null, rawName?: string | null) {
  if (!rawUsername && !rawName) return 'user';
  const val = rawUsername || rawName || '';
  return val.replace(/@gmail\.com$/i, '').replace(/gmailcom$/i, '');
}

export default function ProfileHeader({
  user,
  profiles,
  activeProfile,
  completionScore,
  onSwitchProfile,
  onOpenAvatarModal,
  onNavigateTab,
  onOpenSetupWizard,
}: ProfileHeaderProps) {
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSwitchDropdown(false);
      }
    }
    if (showSwitchDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSwitchDropdown]);

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Aug 2026';

  const avatarUrl = activeProfile?.avatar_url || user.avatar_url;
  const avatarColor = activeProfile?.avatar_color || '#7c3aed';
  const bannerImage = user.banner_url || '/images/profile-banner-default.jpg';
  const displayIdentifier = formatUserIdentifier(user.email);
  const displayUsername = cleanUsername(user.username, user.name);

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch {}
  };

  return (
    <div
      className="relative rounded-3xl border border-white/20 shadow-2xl mb-6 sm:mb-8 bg-neutral-950 bg-cover bg-center transition-all duration-700 z-30"
      style={{
        backgroundImage: `url(${bannerImage})`,
      }}
    >
      {/* ── Full Cinematic Atmospheric Background Overlays ── */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-black/60 pointer-events-none" />
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-black/90 via-neutral-950/75 to-black/90 pointer-events-none" />
      <div className="absolute inset-0 rounded-3xl backdrop-blur-[2px] pointer-events-none" />

      {/* ── Quick Change Banner Button (Top-Right) ── */}
      <button
        type="button"
        onClick={() => onNavigateTab('identity')}
        className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-20 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-[11px] font-black border border-white/20 transition-all flex items-center gap-1.5 active:scale-95 shadow-lg"
        title="Change Background Wallpaper"
      >
        <IconCamera className="w-3.5 h-3.5 text-white/80" />
        <span className="hidden xs:inline">Change Cover</span>
      </button>

      {/* ── Profile Header Body (Full Width over BG) ── */}
      <div className="p-5 sm:p-8 lg:p-10 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          {/* Avatar & User Identity Column */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
            {/* Avatar with status beacon */}
            <div className="relative group cursor-pointer flex-none active:scale-95 transition-transform" onClick={onOpenAvatarModal}>
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-3xl overflow-hidden border-4 border-neutral-950 shadow-2xl flex items-center justify-center text-2xl sm:text-3xl font-black text-white relative transition-transform duration-300 group-hover:scale-105 ring-2 ring-white/30"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl sm:text-4xl font-black">{(user.name || 'U').charAt(0).toUpperCase()}</span>
                )}
                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-[10px] sm:text-xs font-black text-white">
                  <IconCamera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="uppercase tracking-wider">Change</span>
                </div>
              </div>
              {/* Online status beacon */}
              <div
                className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 border-2 border-neutral-950 shadow-lg"
                title="Active Session Online"
              />
            </div>

            {/* Name, Handle, Badges & Telemetry Row */}
            <div className="space-y-2.5 max-w-xl">
              {/* 1. Name & Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{user.name}</span>
                  {/* Verified Check Badge */}
                  <span className="w-5 h-5 rounded-full bg-sky-500 text-black flex items-center justify-center text-[11px] font-black shadow-sm" title="Verified Account">
                    ✓
                  </span>
                </h1>

                <span className="px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-black border border-white/25 flex items-center gap-1.5 shadow-md backdrop-blur-md">
                  <IconSparkles className="w-3.5 h-3.5 text-white/90" />
                  <span>Ultra HD Member</span>
                </span>

                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-bold border border-white/15 flex items-center gap-1">
                  <IconPlayback className="w-3 h-3" />
                  <span>4K Dolby Vision</span>
                </span>

                {activeProfile?.is_kids ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                    Kids
                  </span>
                ) : null}
              </div>

              {/* 2. Handle & Contact Identification Chips */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleCopy(`@${displayUsername}`, 'handle')}
                  className="px-3 py-1 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 font-mono font-bold text-white shadow-sm flex items-center gap-1.5 transition-colors"
                  title="Click to copy handle"
                >
                  <span>@{displayUsername}</span>
                  <span className="text-[10px] text-white/40">{copiedText === 'handle' ? '✓ Copied' : '📋'}</span>
                </button>

                {displayIdentifier && (
                  <button
                    type="button"
                    onClick={() => handleCopy(displayIdentifier, 'phone')}
                    className="px-3 py-1 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 font-mono text-white/90 text-[11px] shadow-sm flex items-center gap-1.5 transition-colors"
                    title="Click to copy phone/email"
                  >
                    <span>{displayIdentifier}</span>
                    <span className="text-[10px] text-white/40">{copiedText === 'phone' ? '✓ Copied' : '📋'}</span>
                  </button>
                )}
              </div>

              {/* 3. Bio / Tagline */}
              {user.bio ? (
                <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed max-w-md pt-0.5 drop-shadow">
                  "{user.bio}"
                </p>
              ) : (
                <p className="text-xs text-white/50 italic">
                  "Stream 4K movies and Dolby Atmos series on Filmora."
                </p>
              )}

              {/* 4. Streaming Telemetry & Membership Info */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-white/60 pt-0.5 font-mono">
                <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10">
                  <IconCalendar className="w-3.5 h-3.5 text-white/70" />
                  <span>Member since {memberSince}</span>
                </span>
                <span className="text-white/30">·</span>
                <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10">
                  <IconGlobe className="w-3.5 h-3.5 text-white/70" />
                  <span>{user.country || 'Global'}</span>
                </span>
                <span className="text-white/30">·</span>
                <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/10 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Direct 1 Gbps</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Tools: Status Meter + Profile Switcher (Sleek One-Line Pair) */}
          <div className="flex items-center gap-2.5 pt-2 lg:pt-0 w-full sm:w-auto">
            {/* Status Button (Launches Wizard if incomplete or navigates to identity) */}
            <div
              onClick={() => {
                if (onOpenSetupWizard) {
                  onOpenSetupWizard();
                } else {
                  onNavigateTab('identity');
                }
              }}
              className="flex-1 sm:flex-initial h-12 px-3.5 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all cursor-pointer flex items-center gap-2.5 shadow-xl active:scale-95 group"
              title="Click to launch Setup Wizard & Complete Profile"
            >
              <div className="relative w-8 h-8 flex items-center justify-center flex-none">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-white transition-all duration-500"
                    strokeDasharray={`${completionScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[9px] font-black text-white">{completionScore}%</span>
              </div>
              <div className="space-y-0.5 text-left min-w-0">
                <div className="text-[11px] font-bold text-white leading-tight group-hover:text-white/90">
                  Status
                </div>
                <div className="text-[10px] text-white/60 font-semibold truncate">
                  {completionScore === 100 ? 'Verified ✓' : 'Setup ➔'}
                </div>
              </div>
            </div>

            {/* Profile Switch Dropdown */}
            <div ref={dropdownRef} className="relative flex-1 sm:flex-initial z-40">
              <button
                type="button"
                onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
                className="w-full sm:w-auto h-12 px-3.5 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold transition-all border border-white/20 hover:border-white/40 flex items-center justify-between gap-2.5 shadow-xl active:scale-95"
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-sm flex-none border border-white/15"
                  style={{ backgroundColor: avatarColor }}
                >
                  {(activeProfile?.name || user.name).charAt(0)}
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[9px] text-white/50 font-bold uppercase leading-none">Profile</div>
                  <div className="text-xs font-black text-white truncate leading-tight mt-0.5">
                    {activeProfile?.name || 'Main'}
                  </div>
                </div>
                <svg className={`w-3.5 h-3.5 text-white/50 transition-transform ${showSwitchDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSwitchDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-neutral-900/98 border border-white/20 shadow-2xl p-2 z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase text-white/40 tracking-wider">
                    Switch Viewing Profile
                  </div>
                  <div className="space-y-1 my-1">
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSwitchProfile(p.id);
                          setShowSwitchDropdown(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all ${
                          p.id === activeProfile?.id
                            ? 'bg-white text-black shadow'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white shadow"
                            style={{ backgroundColor: p.avatar_color }}
                          >
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div>{p.name}</div>
                            {p.is_kids ? (
                              <div className="text-[9px] opacity-60 font-semibold">Kids Profile</div>
                            ) : null}
                          </div>
                        </div>
                        {p.id === activeProfile?.id && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/10 text-black">
                            Active
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="pt-1.5 border-t border-white/10 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenSetupWizard) {
                          onOpenSetupWizard();
                        } else {
                          onNavigateTab('profiles');
                        }
                        setShowSwitchDropdown(false);
                      }}
                      className="w-full py-1.5 text-center text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      + Add New Viewing ID
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab('profiles');
                        setShowSwitchDropdown(false);
                      }}
                      className="w-full py-1 text-center text-[11px] font-bold text-white/50 hover:text-white transition-colors"
                    >
                      Manage All Profiles
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

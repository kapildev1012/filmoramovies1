import React from 'react';
import {
  IconOverview,
  IconUser,
  IconAvatar,
  IconProfiles,
  IconActivity,
  IconWatchlist,
  IconPreferences,
  IconPlayback,
  IconAppearance,
  IconNotification,
  IconSecurity,
  IconPrivacy,
  IconMusic,
} from './ProfileIcons';

export interface TabItem {
  id: string;
  label: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  category?: string;
  badge?: string | number;
}

export const PROFILE_TABS: TabItem[] = [
  { id: 'overview', label: 'Overview', IconComponent: IconOverview, category: 'Account' },
  { id: 'identity', label: 'Profile & Bio', IconComponent: IconUser, category: 'Account' },
  { id: 'avatar', label: 'Avatar Studio', IconComponent: IconAvatar, category: 'Account' },
  { id: 'profiles', label: 'Viewing Profiles', IconComponent: IconProfiles, category: 'Streaming' },
  { id: 'activity', label: 'Watch Activity', IconComponent: IconActivity, category: 'Streaming' },
  { id: 'watchlist', label: 'My Watchlist', IconComponent: IconWatchlist, category: 'Streaming' },
  { id: 'preferences', label: 'Genres & Languages', IconComponent: IconPreferences, category: 'Streaming' },
  { id: 'playback', label: 'Playback & Subtitles', IconComponent: IconPlayback, category: 'Settings' },
  { id: 'appearance', label: 'Appearance & Theme', IconComponent: IconAppearance, category: 'Settings' },
  { id: 'notifications', label: 'Notifications', IconComponent: IconNotification, category: 'Settings' },
  { id: 'security', label: 'Security & Devices', IconComponent: IconSecurity, category: 'Security' },
  { id: 'privacy', label: 'Privacy & Parental', IconComponent: IconPrivacy, category: 'Security' },
  { id: 'music', label: 'Music Streaming', IconComponent: IconMusic, category: 'Streaming' },
];

interface ProfileNavProps {
  activeTab: string;
  searchQuery: string;
  onSelectTab: (tabId: string) => void;
  onSearchChange: (q: string) => void;
  watchlistCount?: number;
  profilesCount?: number;
}

export default function ProfileNav({
  activeTab,
  searchQuery,
  onSelectTab,
  onSearchChange,
  watchlistCount = 0,
  profilesCount = 1,
}: ProfileNavProps) {
  const filteredTabs = PROFILE_TABS.filter((t) =>
    t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ── Settings Search Bar ── */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search settings, playback, security…"
          className="w-full py-2.5 px-3.5 pl-9 rounded-2xl bg-neutral-950 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all font-medium shadow-inner"
        />
        <svg className="w-4 h-4 text-white/40 absolute left-3 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-2.5 text-xs text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Mobile Horizontal Scroll Tabs (Single Continuous Row, Flush Inset) ── */}
      <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory px-0.5">
        {filteredTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.IconComponent;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex-none snap-center px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 border whitespace-nowrap shadow-sm ${
                isActive
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-neutral-950 text-white/70 hover:text-white border-white/15'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-white/60'}`} />
              <span>{tab.label}</span>
              {tab.id === 'watchlist' && watchlistCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-black/15 text-black font-black' : 'bg-white/15 text-white font-bold'}`}>
                  {watchlistCount}
                </span>
              )}
              {tab.id === 'profiles' && profilesCount > 1 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-black/15 text-black font-black' : 'bg-white/15 text-white font-bold'}`}>
                  {profilesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Desktop Category Stack Navigation ── */}
      <div className="hidden lg:block space-y-5">
        {['Account', 'Streaming', 'Settings', 'Security'].map((cat) => {
          const catTabs = filteredTabs.filter((t) => t.category === cat);
          if (catTabs.length === 0) return null;

          return (
            <div key={cat} className="space-y-1">
              <div className="px-3.5 py-1 text-[10px] font-extrabold uppercase text-white/40 tracking-wider">
                {cat}
              </div>
              <div className="space-y-1">
                {catTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.IconComponent;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onSelectTab(tab.id)}
                      className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group active:scale-[0.98] border ${
                        isActive
                          ? 'bg-white text-black border-white shadow-xl translate-x-1'
                          : 'bg-black text-white/70 hover:text-white hover:bg-neutral-950 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`p-1.5 rounded-xl transition-colors ${
                          isActive ? 'bg-black text-white' : 'bg-neutral-900 text-white/70 group-hover:text-white'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="truncate">{tab.label}</span>
                      </div>

                      {tab.id === 'watchlist' && watchlistCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isActive ? 'bg-black/15 text-black' : 'bg-white/15 text-white'
                        }`}>
                          {watchlistCount}
                        </span>
                      )}
                      {tab.id === 'profiles' && profilesCount > 1 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isActive ? 'bg-black/15 text-black' : 'bg-white/15 text-white'
                        }`}>
                          {profilesCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

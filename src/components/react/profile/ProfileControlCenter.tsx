import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DBUser, DBProfile, DBWatchlistEntry } from '../../../lib/db';
import { getContinueWatching, removeContinueWatching, type ContinueEntry } from '../../../lib/continueWatching';

import ProfileHeader from './ProfileHeader';
import ProfileNav from './ProfileNav';
import ProfileCoolStats from './ProfileCoolStats';
import ProfileSetupWizard from './ProfileSetupWizard';

import OverviewPanel from './panels/OverviewPanel';
import IdentityPanel from './panels/IdentityPanel';
import AvatarPanel from './panels/AvatarPanel';
import ViewingProfilesPanel from './panels/ViewingProfilesPanel';
import ActivityPanel from './panels/ActivityPanel';
import WatchlistPanel from './panels/WatchlistPanel';
import PreferencesPanel from './panels/PreferencesPanel';
import PlaybackPanel from './panels/PlaybackPanel';
import AppearancePanel from './panels/AppearancePanel';
import NotificationPanel from './panels/NotificationPanel';
import SecurityPanel from './panels/SecurityPanel';
import PrivacyPanel from './panels/PrivacyPanel';
import MusicPanel from './panels/MusicPanel';

interface ProfileControlCenterProps {
  initialUser: DBUser;
  initialProfiles: DBProfile[];
  initialActiveProfile: DBProfile | null;
  initialWatchlist: DBWatchlistEntry[];
}

export default function ProfileControlCenter({
  initialUser,
  initialProfiles,
  initialActiveProfile,
  initialWatchlist,
}: ProfileControlCenterProps) {
  const [user, setUser] = useState<DBUser>(initialUser);
  const [profiles, setProfiles] = useState<DBProfile[]>(initialProfiles);
  const [activeProfile, setActiveProfile] = useState<DBProfile | null>(initialActiveProfile);
  const [watchlist, setWatchlist] = useState<DBWatchlistEntry[]>(initialWatchlist);
  const [continueList, setContinueList] = useState<ContinueEntry[]>([]);

  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<string>('');

  // Setup Wizard State
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [wizardMode, setWizardMode] = useState<'user_onboarding' | 'new_profile'>('user_onboarding');

  // Sync hash routing on load & navigation
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) setActiveTab(hash);

    const handleHashChange = () => {
      const h = window.location.hash.replace('#', '');
      if (h) setActiveTab(h);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  // Load Continue Watching from client store
  useEffect(() => {
    setContinueList(getContinueWatching());

    const syncContinue = () => {
      setContinueList(getContinueWatching());
    };
    window.addEventListener('filmora:continue-updated', syncContinue);
    return () => window.removeEventListener('filmora:continue-updated', syncContinue);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  // ── Calculate Profile Completion Score ──
  const completionScore = useMemo(() => {
    let score = 0;
    if (user.name) score += 20;
    if (user.avatar_url) score += 20;
    if (user.username) score += 15;
    if (user.bio) score += 15;
    if (user.genres && JSON.parse(user.genres).length > 0) score += 15;
    if (user.country && user.country !== 'Global') score += 15;
    return Math.min(score, 100);
  }, [user]);

  // Check if first-time setup wizard should be prompted
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('filmora_onboarding_dismissed');
      const hasGenres = user.genres && JSON.parse(user.genres).length > 0;
      if (!dismissed && (!hasGenres || completionScore < 40)) {
        // Prompt wizard on first visit
        setShowSetupWizard(true);
        setWizardMode('user_onboarding');
      }
    } catch {}
  }, []);

  const handleOpenSetupWizard = (mode: 'user_onboarding' | 'new_profile' = 'user_onboarding') => {
    setWizardMode(mode);
    setShowSetupWizard(true);
  };

  const handleCloseSetupWizard = () => {
    setShowSetupWizard(false);
    try {
      localStorage.setItem('filmora_onboarding_dismissed', 'true');
    } catch {}
  };

  // ── API Handlers ──

  // 1. Update Profile Fields (Name, username, bio, country, etc.)
  const handleUpdateProfile = async (data: Partial<DBUser>): Promise<boolean> => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok || resData.error) throw new Error(resData.error);
      if (resData.user) setUser(resData.user);
      return true;
    } catch {
      return false;
    }
  };

  // 2. Update Avatar
  const handleUpdateAvatar = async (avatarUrl: string | null): Promise<boolean> => {
    try {
      let res;
      if (avatarUrl) {
        res = await fetch('/api/user/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: avatarUrl }),
        });
      } else {
        res = await fetch('/api/user/avatar', { method: 'DELETE' });
      }
      const resData = await res.json();
      if (!res.ok || resData.error) throw new Error(resData.error);
      if (resData.user) setUser(resData.user);
      return true;
    } catch {
      return false;
    }
  };

  // 3. Switch Profile
  const handleSwitchProfile = async (profileId: string) => {
    try {
      const res = await fetch('/api/profile/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);

      const target = profiles.find((p) => p.id === profileId);
      if (target) {
        setActiveProfile(target);
        showToast(`Switched viewing profile to "${target.name}"`);
      }
    } catch (err: any) {
      showToast('Could not switch profile');
    }
  };

  // 4. Create Profile
  const handleCreateProfile = async (name: string, color: string, isKids: boolean): Promise<boolean> => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          avatar_color: color,
          is_kids: isKids ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      if (data.profile) {
        setProfiles((prev) => [...prev, data.profile]);
      }
      return true;
    } catch {
      return false;
    }
  };

  // 5. Update Profile Item
  const handleUpdateProfileItem = async (profileId: string, data: Partial<DBProfile>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/profile/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok || resData.error) throw new Error(resData.error);
      if (resData.profile) {
        setProfiles((prev) => prev.map((p) => (p.id === profileId ? resData.profile : p)));
        if (activeProfile?.id === profileId) setActiveProfile(resData.profile);
      }
      return true;
    } catch {
      return false;
    }
  };

  // 6. Delete Profile
  const handleDeleteProfile = async (profileId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/profile/${profileId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      return true;
    } catch {
      return false;
    }
  };

  // Complete Setup Wizard
  const handleCompleteWizardSetup = async (
    userData: Partial<DBUser>,
    profileData?: { name: string; color: string; isKids: boolean }
  ): Promise<boolean> => {
    try {
      localStorage.setItem('filmora_onboarding_dismissed', 'true');
      if (profileData && wizardMode === 'new_profile') {
        await handleCreateProfile(profileData.name, profileData.color, profileData.isKids);
      } else {
        await handleUpdateProfile(userData);
      }
      return true;
    } catch {
      return false;
    }
  };

  // 7. Watch Activity
  const handleRemoveContinue = (id: number, mediaType: 'movie' | 'tv') => {
    removeContinueWatching(id, mediaType);
    setContinueList(getContinueWatching());
    showToast('Removed from continue watching');
  };

  const handleClearAllHistory = () => {
    try {
      localStorage.removeItem('filmora_continue');
      setContinueList([]);
      window.dispatchEvent(new CustomEvent('filmora:continue-updated'));
    } catch {}
  };

  // 8. Watchlist Remove
  const handleRemoveFromWatchlist = async (id: number, mediaType: string) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdb_id: id, media_type: mediaType }),
      });
      if (res.ok) {
        setWatchlist((prev) => prev.filter((w) => !(w.tmdb_id === id && w.media_type === mediaType)));
        showToast('Removed from your watchlist');
      }
    } catch {
      showToast('Could not remove item');
    }
  };

  // 9. Preferences
  const handleUpdatePreferences = async (genres: string[], language: string): Promise<boolean> => {
    return handleUpdateProfile({
      genres: JSON.stringify(genres),
      language,
    });
  };

  // 10. Generic Settings Handlers
  const handleSaveSettings = async (field: keyof DBUser, jsonString: string): Promise<boolean> => {
    return handleUpdateProfile({
      [field]: jsonString,
    } as any);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── 1. Master Profile Header ── */}
      <ProfileHeader
        user={user}
        profiles={profiles}
        activeProfile={activeProfile}
        completionScore={completionScore}
        onSwitchProfile={handleSwitchProfile}
        onOpenAvatarModal={() => handleSelectTab('avatar')}
        onNavigateTab={handleSelectTab}
        onOpenSetupWizard={() => handleOpenSetupWizard('user_onboarding')}
      />

      {/* ── Cool Live Telemetry & Audio/Stream Engine ── */}
      <ProfileCoolStats />

      {/* ── 2. Dashboard Body (Sidebar Nav + Active Control Panel) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 sm:gap-8 items-start">
        {/* Navigation Sidebar with sticky viewport locking on desktop */}
        <aside className="lg:sticky lg:top-24 z-20">
          <ProfileNav
            activeTab={activeTab}
            searchQuery={searchQuery}
            onSelectTab={handleSelectTab}
            onSearchChange={setSearchQuery}
            watchlistCount={watchlist.length}
            profilesCount={profiles.length}
          />
        </aside>

        {/* Dynamic Control Panel */}
        <main className="min-w-0 p-3.5 sm:p-7 lg:p-10 rounded-3xl bg-black border border-white/20 shadow-2xl transition-all duration-300">
          {activeTab === 'overview' && (
            <OverviewPanel
              user={user}
              activeProfile={activeProfile}
              watchlist={watchlist}
              continueWatching={continueList}
              onNavigateTab={handleSelectTab}
              onRemoveContinue={handleRemoveContinue}
            />
          )}

          {activeTab === 'identity' && (
            <IdentityPanel
              user={user}
              onUpdateProfile={handleUpdateProfile}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'avatar' && (
            <AvatarPanel
              user={user}
              onUpdateAvatar={handleUpdateAvatar}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'profiles' && (
            <ViewingProfilesPanel
              user={user}
              profiles={profiles}
              activeProfile={activeProfile}
              onSwitchProfile={handleSwitchProfile}
              onCreateProfile={handleCreateProfile}
              onUpdateProfileItem={handleUpdateProfileItem}
              onDeleteProfile={handleDeleteProfile}
              onShowToast={showToast}
              onOpenSetupWizard={() => handleOpenSetupWizard('new_profile')}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityPanel
              continueWatching={continueList}
              onRemoveContinue={handleRemoveContinue}
              onClearAllHistory={handleClearAllHistory}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'watchlist' && (
            <WatchlistPanel
              watchlist={watchlist}
              onRemoveFromWatchlist={handleRemoveFromWatchlist}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'preferences' && (
            <PreferencesPanel
              user={user}
              onUpdatePreferences={handleUpdatePreferences}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'playback' && (
            <PlaybackPanel
              initialSettings={user.playback_settings}
              onSaveSettings={handleSaveSettings}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'appearance' && (
            <AppearancePanel
              initialSettings={user.appearance_settings}
              onSaveSettings={handleSaveSettings}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationPanel
              initialSettings={user.notification_settings}
              onSaveSettings={handleSaveSettings}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'security' && (
            <SecurityPanel
              user={user}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyPanel
              initialPrivacy={user.privacy_settings}
              initialParental={user.parental_settings}
              onSaveSettings={handleSaveSettings}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'music' && (
            <MusicPanel
              initialSettings={user.music_settings}
              onSaveSettings={handleSaveSettings}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* ── 3. Step-by-Step Onboarding & Profile Setup Wizard Modal ── */}
      <ProfileSetupWizard
        user={user}
        activeProfile={activeProfile}
        isOpen={showSetupWizard}
        mode={wizardMode}
        onClose={handleCloseSetupWizard}
        onCompleteSetup={handleCompleteWizardSetup}
        onShowToast={showToast}
      />

      {/* ── Toast Notification Banner ── */}
      {toast && (
        <div className="fixed bottom-16 right-8 z-50 px-5 py-3 rounded-2xl bg-neutral-900/95 border border-white/20 text-white text-xs font-bold shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

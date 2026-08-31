import React, { useState } from 'react';
import { IconNotification } from '../ProfileIcons';

interface NotificationPanelProps {
  initialSettings?: string | null;
  onSaveSettings: (field: any, jsonString: string) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

export default function NotificationPanel({
  initialSettings,
  onSaveSettings,
  onShowToast,
}: NotificationPanelProps) {
  const parsed = initialSettings ? JSON.parse(initialSettings) : {};

  const [notifyReleases, setNotifyReleases] = useState(parsed.notify_releases ?? true);
  const [notifyWatchlist, setNotifyWatchlist] = useState(parsed.notify_watchlist ?? true);
  const [notifyNewsletter, setNotifyNewsletter] = useState(parsed.notify_newsletter ?? false);
  const [emailUpdates, setEmailUpdates] = useState(parsed.email_updates ?? true);
  const [pushNotifications, setPushNotifications] = useState(parsed.push_notifications ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      notify_releases: notifyReleases,
      notify_watchlist: notifyWatchlist,
      notify_newsletter: notifyNewsletter,
      email_updates: emailUpdates,
      push_notifications: pushNotifications,
    };
    const ok = await onSaveSettings('notification_settings', JSON.stringify(data));
    setSaving(false);
    if (ok) {
      onShowToast('Notification preferences saved ✓');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white/10 text-white border border-white/15">
              <IconNotification className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span>Alerts &amp; Notifications</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Choose what alerts and new release recommendations you receive.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto px-6 py-2.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
        >
          {saving ? 'Saving…' : 'Save Notifications'}
        </button>
      </div>

      {/* ── 1. Content Alerts ── */}
      <div className="profile-card p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Streaming Release Alerts
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
            Live Triggers
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-white">New Movie &amp; Series Premieres</div>
              <div className="text-[11px] text-white/50">Alert me when highly anticipated blockbusters drop.</div>
            </div>
            <button
              type="button"
              onClick={() => setNotifyReleases(!notifyReleases)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                notifyReleases ? 'bg-white' : 'bg-white/15'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                  notifyReleases ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-white">Watchlist Availability &amp; New Episodes</div>
              <div className="text-[11px] text-white/50">Notify when saved series release new seasons.</div>
            </div>
            <button
              type="button"
              onClick={() => setNotifyWatchlist(!notifyWatchlist)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                notifyWatchlist ? 'bg-white' : 'bg-white/15'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                  notifyWatchlist ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Delivery Channels ── */}
      <div className="profile-card p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Delivery Channels
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
            Routing
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-white">Browser &amp; Device Push Notifications</div>
              <div className="text-[11px] text-white/50">Instant on-screen popups when a stream goes live.</div>
            </div>
            <button
              type="button"
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                pushNotifications ? 'bg-white' : 'bg-white/15'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                  pushNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-white">Weekly Streaming Digest Email</div>
              <div className="text-[11px] text-white/50">Curated top 10 movies and trending series of the week.</div>
            </div>
            <button
              type="button"
              onClick={() => setEmailUpdates(!emailUpdates)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                emailUpdates ? 'bg-white' : 'bg-white/15'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                  emailUpdates ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

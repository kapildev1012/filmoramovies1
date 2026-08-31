import React, { useState } from 'react';
import { IconPrivacy, IconShield, IconTrash } from '../ProfileIcons';

interface PrivacyPanelProps {
  initialPrivacy?: string | null;
  initialParental?: string | null;
  onSaveSettings: (field: any, jsonString: string) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

const MATURITY_RATINGS = [
  { id: 'ALL', label: 'All Content Ratings', desc: 'No restrictions (TV-MA / R rated titles included)' },
  { id: 'TV-14', label: 'Teens & Below (PG-13 / TV-14)', desc: 'Blocks mature and adult-oriented scenes' },
  { id: 'PG', label: 'Family Friendly (G / PG)', desc: 'Restricts titles strictly to kids and family movies' },
];

export default function PrivacyPanel({
  initialPrivacy,
  initialParental,
  onSaveSettings,
  onShowToast,
}: PrivacyPanelProps) {
  const privacyData = initialPrivacy ? JSON.parse(initialPrivacy) : {};
  const parentalData = initialParental ? JSON.parse(initialParental) : {};

  const [dataSharing, setDataSharing] = useState(privacyData.data_sharing ?? false);
  const [activityHistory, setActivityHistory] = useState(privacyData.activity_history ?? true);
  const [privateBrowsing, setPrivateBrowsing] = useState(privacyData.private_browsing ?? false);

  const [parentalRating, setParentalRating] = useState(parentalData.parental_rating || 'ALL');
  const [parentalPin, setParentalPin] = useState(parentalData.parental_pin || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const pData = {
      data_sharing: dataSharing,
      activity_history: activityHistory,
      private_browsing: privateBrowsing,
    };
    const parData = {
      parental_rating: parentalRating,
      parental_pin: parentalPin,
    };

    await onSaveSettings('privacy_settings', JSON.stringify(pData));
    await onSaveSettings('parental_settings', JSON.stringify(parData));

    setSaving(false);
    onShowToast('Privacy & Parental restrictions updated ✓');
  };

  const handleExport = () => {
    const backupData = {
      filmora_export: true,
      timestamp: new Date().toISOString(),
      privacy: { dataSharing, activityHistory, privateBrowsing },
      parental: { parentalRating, parentalPin: parentalPin ? '****' : null },
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filmora-user-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('GDPR Data archive exported ✓');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white/10 text-white border border-white/15">
              <IconPrivacy className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span>Privacy, Parental &amp; Data Controls</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Manage your analytics consent, parental maturity ratings, and data export.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto px-6 py-2.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
        >
          {saving ? 'Saving…' : 'Save Privacy'}
        </button>
      </div>

      {/* ── 1. Parental Controls & PIN Lock ── */}
      <div className="profile-card p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Parental Maturity Ratings &amp; PIN Lock
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
            Child Safety
          </span>
        </div>

        {/* Maturity Limit Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-white/70">Maturity Rating Cap</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MATURITY_RATINGS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setParentalRating(r.id)}
                className={`p-4 rounded-2xl border text-left transition-all active:scale-98 flex flex-col justify-between space-y-2 shadow-md ${
                  parentalRating === r.id
                    ? 'bg-white text-black border-white shadow-xl'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="text-xs font-black">{r.label}</div>
                <p className={`text-[11px] ${parentalRating === r.id ? 'opacity-80' : 'text-white/50'}`}>
                  {r.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 4-digit PIN */}
        <div className="space-y-1.5 max-w-xs pt-1">
          <label className="block text-xs font-bold text-white/70">4-Digit Parental PIN</label>
          <input
            type="password"
            maxLength={4}
            value={parentalPin}
            onChange={(e) => setParentalPin(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="••••"
            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-white transition-all"
          />
        </div>
      </div>

      {/* ── 2. Privacy & Telemetry Toggles ── */}
      <div className="profile-card p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Privacy &amp; Analytics
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
            GDPR Compliant
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-white">Record Watch History Signals</div>
              <div className="text-[11px] text-white/50">Allow saving timestamps to improve recommendations.</div>
            </div>
            <button
              type="button"
              onClick={() => setActivityHistory(!activityHistory)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                activityHistory ? 'bg-white' : 'bg-white/15'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                  activityHistory ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-white">Private Incognito Streaming</div>
              <div className="text-[11px] text-white/50">Stream movies without adding them to continue watching.</div>
            </div>
            <button
              type="button"
              onClick={() => setPrivateBrowsing(!privateBrowsing)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                privateBrowsing ? 'bg-white' : 'bg-white/15'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                  privateBrowsing ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Data Export & Account Actions ── */}
      <div className="profile-card p-5 sm:p-7 space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-wider">
          Data Export &amp; Portability
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-950/70 border border-white/10">
          <div>
            <div className="text-xs font-black text-white">Download Account Data JSON</div>
            <div className="text-[11px] text-white/50">Export your preferences, watch stats, and configurations.</div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all active:scale-95"
          >
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}

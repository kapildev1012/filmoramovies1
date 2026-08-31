import React, { useState } from 'react';
import type { DBUser, DBProfile } from '../../../../lib/db';
import { IconProfiles, IconUser, IconTrash, IconSparkles, IconShield } from '../ProfileIcons';

interface ViewingProfilesPanelProps {
  user: DBUser;
  profiles: DBProfile[];
  activeProfile: DBProfile | null;
  onSwitchProfile: (profileId: string) => Promise<void>;
  onCreateProfile: (name: string, color: string, isKids: boolean) => Promise<boolean>;
  onUpdateProfileItem: (profileId: string, data: Partial<DBProfile>) => Promise<boolean>;
  onDeleteProfile: (profileId: string) => Promise<boolean>;
  onShowToast: (msg: string) => void;
  onOpenSetupWizard?: () => void;
}

const PALETTE = [
  '#7c3aed', '#ec4899', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#8b5cf6', '#6366f1', '#14b8a6'
];

export default function ViewingProfilesPanel({
  user,
  profiles,
  activeProfile,
  onSwitchProfile,
  onCreateProfile,
  onUpdateProfileItem,
  onDeleteProfile,
  onShowToast,
  onOpenSetupWizard,
}: ViewingProfilesPanelProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<DBProfile | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#7c3aed');
  const [isKids, setIsKids] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    if (onOpenSetupWizard) {
      onOpenSetupWizard();
      return;
    }
    setEditingProfile(null);
    setName('');
    setColor(PALETTE[profiles.length % PALETTE.length]);
    setIsKids(false);
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (p: DBProfile) => {
    setEditingProfile(p);
    setName(p.name);
    setColor(p.avatar_color || '#7c3aed');
    setIsKids(!!p.is_kids);
    setError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a profile name.');
      return;
    }
    setLoading(true);
    setError(null);

    let ok = false;
    if (editingProfile) {
      ok = await onUpdateProfileItem(editingProfile.id, {
        name,
        avatar_color: color,
        is_kids: isKids ? 1 : 0,
      });
    } else {
      ok = await onCreateProfile(name, color, isKids);
    }

    setLoading(false);
    if (ok) {
      setShowModal(false);
      onShowToast(editingProfile ? 'Profile updated ✓' : 'New profile created ✓');
    } else {
      setError('Operation failed. Maximum 5 profiles per account.');
    }
  };

  const handleDelete = async (p: DBProfile) => {
    if (confirm(`Are you sure you want to delete profile "${p.name}"? All individual watch progress for this profile will be removed.`)) {
      const ok = await onDeleteProfile(p.id);
      if (ok) onShowToast(`Profile "${p.name}" deleted.`);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white/10 text-white border border-white/15">
              <IconProfiles className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span>Household Viewing Profiles</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Create up to 5 individual IDs with personalized continue watching, ratings, and kids content filters.
          </p>
        </div>

        {profiles.length < 5 && (
          <button
            type="button"
            onClick={openCreateModal}
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-lg active:scale-95 flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Add Viewing ID</span>
          </button>
        )}
      </div>

      {/* ── Profiles Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {profiles.map((p) => {
          const isActive = p.id === activeProfile?.id;
          return (
            <div
              key={p.id}
              className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 relative flex flex-col justify-between space-y-4 shadow-xl ${
                isActive
                  ? 'bg-white/10 border-white shadow-2xl ring-2 ring-white/40'
                  : 'profile-card hover:border-white/20'
              }`}
            >
              {/* Profile Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg flex-none ring-2 ring-white/20 relative"
                    style={{ backgroundColor: p.avatar_color }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                    {isActive && (
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-950 shadow" />
                    )}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-base font-black text-white truncate">{p.name}</h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.is_kids ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase flex items-center gap-1">
                          <IconShield className="w-2.5 h-2.5" />
                          <span>Kids Safe</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/80 border border-white/10 text-[9px] font-bold">
                          General Streaming
                        </span>
                      )}
                      {p.is_default ? (
                        <span className="px-2 py-0.5 rounded-md bg-white/15 text-white text-[9px] font-bold">
                          Master
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {isActive && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-black uppercase shadow-sm">
                    Active
                  </span>
                )}
              </div>

              {/* Profile Subtext / Features */}
              <div className="text-[11px] text-white/50 space-y-0.5">
                <div>Individual watchlist &amp; continue watching</div>
                <div>{p.is_kids ? 'PG / Family content only' : 'All 4K streaming libraries'}</div>
              </div>

              {/* Profile Card Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                {!isActive ? (
                  <button
                    type="button"
                    onClick={() => onSwitchProfile(p.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white hover:text-black text-white text-xs font-bold transition-all active:scale-95 text-center"
                  >
                    Switch To ID
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-2 px-3 rounded-xl bg-white text-black text-xs font-black shadow cursor-default text-center"
                  >
                    Currently Active
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openEditModal(p)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
                  title="Edit Profile Details"
                >
                  ✎
                </button>

                {!p.is_default && (
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-300 transition-colors"
                    title="Delete Profile"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* ── Slot Card: Add New Profile ── */}
        {profiles.length < 5 && (
          <div
            onClick={openCreateModal}
            className="p-6 rounded-3xl border border-dashed border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2.5 min-h-[190px] group shadow-xl active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-white border border-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">+</span>
            </div>
            <div>
              <div className="text-sm font-black text-white group-hover:text-white/90">
                Create New Household ID
              </div>
              <div className="text-[11px] text-white/50 max-w-[200px] mt-0.5">
                Set up personalized recommendations for family or living room TV
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Direct Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black">
                {editingProfile ? 'Edit Profile Details' : 'Create Viewing Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/80 block mb-1">Profile Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Living Room TV, Maya, Kids"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs focus:outline-none focus:border-white transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/80 block mb-2">Avatar Color</label>
                <div className="flex flex-wrap gap-2">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform active:scale-90 ${
                        color === c ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="text-xs font-bold text-white">Kids Content Filter</div>
                  <div className="text-[10px] text-white/50">Only show titles rated for young audiences</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsKids(!isKids)}
                  className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    isKids ? 'bg-white' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                      isKids ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow"
                >
                  {loading ? 'Saving…' : editingProfile ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef } from 'react';
import type { DBUser } from '../../../../lib/db';
import { IconAvatar, IconCamera, IconTrash, IconSparkles } from '../ProfileIcons';

interface AvatarPanelProps {
  user: DBUser;
  onUpdateAvatar: (avatarUrl: string | null) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

const CINEMA_AVATARS = [
  { id: 'av-1', name: 'Cyberpunk Pilot', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&h=240&fit=crop' },
  { id: 'av-2', name: 'Cinema Director', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=240&fit=crop' },
  { id: 'av-3', name: 'Neon Noir Detective', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&h=240&fit=crop' },
  { id: 'av-4', name: 'Retro Synth Gamer', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&h=240&fit=crop' },
  { id: 'av-5', name: 'Anime Vanguard', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=240&h=240&fit=crop' },
  { id: 'av-6', name: 'Space Explorer', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&h=240&fit=crop' },
  { id: 'av-7', name: 'Action Hero', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=240&h=240&fit=crop' },
  { id: 'av-8', name: 'Sci-Fi Android', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=240&h=240&fit=crop' },
];

export default function AvatarPanel({ user, onUpdateAvatar, onShowToast }: AvatarPanelProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.avatar_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async (urlToSave: string | null) => {
    setSaving(true);
    setError(null);
    const ok = await onUpdateAvatar(urlToSave);
    setSaving(false);
    if (ok) {
      onShowToast(urlToSave ? 'Avatar updated successfully ✓' : 'Avatar reset to default ✓');
    } else {
      setError('Failed to save avatar. Please try again.');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white/10 text-white border border-white/15">
              <IconAvatar className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span>Avatar Studio &amp; Presets</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Upload a custom portrait or pick from Filmora's exclusive character gallery.
          </p>
        </div>

        {previewUrl && previewUrl !== user.avatar_url && (
          <button
            type="button"
            onClick={() => handleSaveAvatar(previewUrl)}
            disabled={saving}
            className="self-start sm:self-auto px-6 py-2.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
          >
            {saving ? 'Saving…' : 'Apply Avatar'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 font-semibold">
          {error}
        </div>
      )}

      {/* ── Active Avatar Preview & Upload Canvas ── */}
      <div className="profile-card p-5 sm:p-7 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 shadow-xl">
        {/* Live Preview Ring */}
        <div className="relative flex-none">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-4 border-neutral-950 shadow-2xl bg-neutral-950 flex items-center justify-center relative ring-2 ring-white/20">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-black text-white">{(user.name || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-black uppercase shadow">
            Active
          </span>
        </div>

        {/* Upload Controls */}
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div>
            <h3 className="text-sm font-black text-white">Upload Custom Profile Portrait</h3>
            <p className="text-xs text-white/50 mt-0.5">Supports PNG, JPG, WebP photos up to 5MB.</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all active:scale-95 flex items-center gap-2"
            >
              <IconCamera className="w-4 h-4 text-white/80" />
              <span>Choose Photo File</span>
            </button>

            {previewUrl && (
              <button
                type="button"
                onClick={() => handleSaveAvatar(previewUrl)}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-neutral-200 shadow-lg active:scale-95 transition-all"
              >
                {saving ? 'Saving…' : 'Save Photo'}
              </button>
            )}

            {user.avatar_url && (
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  handleSaveAvatar(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5"
              >
                <IconTrash className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Studio Preset Characters Gallery ── */}
      <div className="profile-card p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Studio Character Presets
            </h3>
            <p className="text-xs text-white/50 mt-0.5">Choose from exclusive cinema portraits.</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
            Curated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {CINEMA_AVATARS.map((av) => (
            <div
              key={av.id}
              onClick={() => {
                setPreviewUrl(av.url);
                handleSaveAvatar(av.url);
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center space-y-2 group shadow-md active:scale-95 ${
                previewUrl === av.url
                  ? 'bg-white/10 border-white shadow-xl ring-2 ring-white/50'
                  : 'bg-white/5 border-white/10 hover:border-white/25'
              }`}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-950 flex-none shadow">
                <img src={av.url} alt={av.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="text-xs font-bold text-white truncate w-full">{av.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

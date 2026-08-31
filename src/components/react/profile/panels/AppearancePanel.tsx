import React, { useState } from 'react';
import { IconAppearance } from '../ProfileIcons';

interface AppearancePanelProps {
  initialSettings?: string | null;
  onSaveSettings: (field: any, jsonString: string) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

const THEMES = [
  { id: 'cinema_dark', label: 'Cinema Dark', desc: 'Deep obsidian with clean monochrome accents', bg: 'linear-gradient(135deg, #0f1016 0%, #171717 100%)' },
  { id: 'oled_black', label: 'Midnight OLED', desc: 'True #000000 black optimized for OLED displays', bg: 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)' },
  { id: 'cosmic_purple', label: 'Cosmic Gradient', desc: 'Galactic deep violet ambient backlight', bg: 'linear-gradient(135deg, #180828 0%, #2e0854 100%)' },
  { id: 'royal_navy', label: 'Deep Sapphire', desc: 'Deep sapphire navy with oceanic highlights', bg: 'linear-gradient(135deg, #081828 0%, #0d2847 100%)' },
];

const DENSITIES = [
  { id: 'comfortable', label: 'Comfortable Spacing', desc: 'Spacious cards and generous padding for big screen viewing' },
  { id: 'compact', label: 'Compact Matrix', desc: 'Higher density poster rails with more titles visible at once' },
];

export default function AppearancePanel({
  initialSettings,
  onSaveSettings,
  onShowToast,
}: AppearancePanelProps) {
  const parsed = initialSettings ? JSON.parse(initialSettings) : {};

  const [theme, setTheme] = useState(parsed.theme || 'cinema_dark');
  const [density, setDensity] = useState(parsed.density || 'comfortable');
  const [ambientGlow, setAmbientGlow] = useState(parsed.ambientGlow ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async (selectedTheme: string, selectedDensity: string, glow: boolean = ambientGlow) => {
    setSaving(true);
    const data = {
      theme: selectedTheme,
      density: selectedDensity,
      ambientGlow: glow,
    };
    const ok = await onSaveSettings('appearance_settings', JSON.stringify(data));
    setSaving(false);
    if (ok) {
      onShowToast('Display appearance settings updated ✓');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white/10 text-white border border-white/15">
              <IconAppearance className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span>Appearance, Display &amp; Atmosphere</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Customize Filmora's visual colorway, background ambiance, and interface layout density.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave(theme, density, ambientGlow)}
          disabled={saving}
          className="self-start sm:self-auto px-6 py-2.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
        >
          {saving ? 'Saving…' : 'Save Appearance'}
        </button>
      </div>

      {/* ── Theme Selection ── */}
      <div className="profile-card p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Interface Theme Presets
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
            Display Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTheme(t.id);
                handleSave(t.id, density, ambientGlow);
              }}
              className={`p-5 rounded-2xl border text-left transition-all active:scale-98 relative overflow-hidden shadow-lg ${
                theme === t.id
                  ? 'border-white ring-2 ring-white/60 shadow-xl'
                  : 'border-white/10 hover:border-white/30'
              }`}
              style={{ background: t.bg }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black text-white drop-shadow">{t.label}</span>
                {theme === t.id && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-black uppercase shadow">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-white/70 leading-relaxed drop-shadow-sm">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Layout Density & Ambient Glow ── */}
      <div className="profile-card p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Catalog Grid Density &amp; Lighting
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
            Layout Spacing
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DENSITIES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setDensity(d.id);
                handleSave(theme, d.id, ambientGlow);
              }}
              className={`p-4 rounded-2xl border text-left transition-all active:scale-98 shadow-md ${
                density === d.id
                  ? 'bg-white text-black border-white shadow-xl'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="text-xs font-black">{d.label}</div>
              <p className={`text-[11px] mt-1 ${density === d.id ? 'opacity-80' : 'text-white/50'}`}>
                {d.desc}
              </p>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950/70 border border-white/10 pt-4">
          <div>
            <div className="text-xs font-bold text-white">Atmospheric Ambient Lighting</div>
            <div className="text-[10px] text-white/50">Dynamic color extraction glow around movie posters and video player</div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !ambientGlow;
              setAmbientGlow(next);
              handleSave(theme, density, next);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
              ambientGlow ? 'bg-white' : 'bg-white/15'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                ambientGlow ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

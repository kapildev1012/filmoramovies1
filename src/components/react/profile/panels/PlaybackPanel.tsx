import React, { useState } from 'react';
import { IconPlayback } from '../ProfileIcons';

interface PlaybackPanelProps {
  initialSettings?: string | null;
  onSaveSettings: (field: any, jsonString: string) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

const QUALITIES = [
  { id: 'auto', label: 'Auto (Adaptive Bandwidth)', badge: 'Recommended' },
  { id: '4k', label: '4K Ultra HD (2160p HDR)', badge: 'Lossless' },
  { id: '1080p', label: '1080p Full HD', badge: 'High' },
  { id: '720p', label: '720p Standard HD', badge: 'Data Saver' },
];

const AUDIO_QUALITIES = [
  { id: 'lossless', label: 'Dolby Atmos / 24-bit FLAC', badge: 'Cinema Spatial' },
  { id: 'high', label: '5.1 Surround / 320kbps AAC', badge: 'High Definition' },
  { id: 'normal', label: 'Stereo / 160kbps AAC', badge: 'Standard' },
];

const SUBTITLE_LANGS = [
  'English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Hindi', 'Portuguese', 'Arabic'
];

const SUBTITLE_SIZES = ['small', 'medium', 'large', 'x-large'] as const;
const SUBTITLE_BGS = [
  { id: 'none', label: 'Transparent' },
  { id: 'semi', label: 'Semi-Transparent (50%)' },
  { id: 'solid', label: 'Solid Black (100%)' },
];

export default function PlaybackPanel({
  initialSettings,
  onSaveSettings,
  onShowToast,
}: PlaybackPanelProps) {
  const parsed = initialSettings ? JSON.parse(initialSettings) : {};

  const [videoQuality, setVideoQuality] = useState(parsed.video_quality || 'auto');
  const [audioQuality, setAudioQuality] = useState(parsed.audio_quality || 'lossless');
  const [autoplayNext, setAutoplayNext] = useState(parsed.autoplay_next ?? true);
  const [autoplayTrailers, setAutoplayTrailers] = useState(parsed.autoplay_trailers ?? false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(parsed.subtitles_enabled ?? true);
  const [subtitleLanguage, setSubtitleLanguage] = useState(parsed.subtitle_language || 'English');
  const [subtitleSize, setSubtitleSize] = useState<string>(parsed.subtitle_size || 'medium');
  const [subtitleBg, setSubtitleBg] = useState<string>(parsed.subtitle_bg || 'semi');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      video_quality: videoQuality,
      audio_quality: audioQuality,
      autoplay_next: autoplayNext,
      autoplay_trailers: autoplayTrailers,
      subtitles_enabled: subtitlesEnabled,
      subtitle_language: subtitleLanguage,
      subtitle_size: subtitleSize,
      subtitle_bg: subtitleBg,
    };
    const ok = await onSaveSettings('playback_settings', JSON.stringify(data));
    setSaving(false);
    if (ok) {
      onShowToast('Playback & Subtitle settings synced ✓');
    }
  };

  const getSubSizePx = () => {
    switch (subtitleSize) {
      case 'small': return 'text-xs';
      case 'large': return 'text-lg';
      case 'x-large': return 'text-xl';
      default: return 'text-sm sm:text-base';
    }
  };

  const getSubBgClass = () => {
    switch (subtitleBg) {
      case 'none': return 'bg-transparent text-shadow-md';
      case 'solid': return 'bg-black px-3 py-1';
      default: return 'bg-black/60 backdrop-blur-xs px-3 py-1';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-white/10 text-white border border-white/15">
              <IconPlayback className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span>Playback, Bitrate &amp; Subtitles</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Configure default video stream resolution, audio engine, and cinema subtitle rendering.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto px-6 py-2.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
        >
          {saving ? 'Saving…' : 'Save Playback'}
        </button>
      </div>

      {/* ── 1. Video Quality Selector ── */}
      <div className="profile-card p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Stream Resolution &amp; Bitrate
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
            4K HDR Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUALITIES.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setVideoQuality(q.id)}
              className={`p-4 rounded-2xl border text-left transition-all active:scale-98 flex items-center justify-between shadow-md ${
                videoQuality === q.id
                  ? 'bg-white text-black border-white shadow-xl'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div>
                <div className="text-xs font-black">{q.label}</div>
                <div className={`text-[10px] mt-0.5 ${videoQuality === q.id ? 'opacity-80' : 'text-white/40'}`}>
                  Direct hardware decoding stream
                </div>
              </div>
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${videoQuality === q.id ? 'bg-black/10 text-black' : 'bg-white/10 text-white/80'}`}>
                {q.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Spatial Audio Engine ── */}
      <div className="profile-card p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Audio Channel &amp; Surround Sound
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold">
            Dolby Atmos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {AUDIO_QUALITIES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAudioQuality(a.id)}
              className={`p-4 rounded-2xl border text-left transition-all active:scale-98 shadow-md ${
                audioQuality === a.id
                  ? 'bg-white text-black border-white shadow-xl'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="text-xs font-black">{a.label}</div>
              <div className={`text-[10px] mt-1 ${audioQuality === a.id ? 'opacity-80' : 'text-white/40'}`}>
                {a.badge}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Autoplay Behaviors ── */}
      <div className="profile-card p-5 sm:p-7 space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-wider">
          Autoplay &amp; Playback Behaviors
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950/70 border border-white/10">
            <div>
              <div className="text-xs font-bold text-white">Autoplay Next Episode</div>
              <div className="text-[10px] text-white/50">Automatically start the next episode after credits finish</div>
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

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950/70 border border-white/10">
            <div>
              <div className="text-xs font-bold text-white">Autoplay Previews &amp; Trailers</div>
              <div className="text-[10px] text-white/50">Play muted movie trailers while browsing hero banners</div>
            </div>
            <button
              type="button"
              onClick={() => setAutoplayTrailers(!autoplayTrailers)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                autoplayTrailers ? 'bg-white' : 'bg-white/15'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-neutral-950 transition-transform ${
                  autoplayTrailers ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Cinema Subtitles Customizer ── */}
      <div className="profile-card p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Closed Captions &amp; Subtitles
          </h3>
          <button
            type="button"
            onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              subtitlesEnabled ? 'bg-white text-black font-black' : 'bg-white/10 text-white/60'
            }`}
          >
            {subtitlesEnabled ? 'Enabled by Default' : 'Off'}
          </button>
        </div>

        {/* Live Subtitle Cinema Preview Card */}
        <div className="h-32 sm:h-40 rounded-2xl bg-neutral-950 border border-white/15 relative overflow-hidden flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80)',
            }}
          />
          <div className="relative z-10 text-center">
            <span className={`text-white font-semibold rounded-lg ${getSubSizePx()} ${getSubBgClass()}`}>
              "We used to look up at the sky and wonder at our place in the stars."
            </span>
          </div>
        </div>

        {/* Subtitle Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/70">Language</label>
            <select
              value={subtitleLanguage}
              onChange={(e) => setSubtitleLanguage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs focus:outline-none"
            >
              {SUBTITLE_LANGS.map((lang) => (
                <option key={lang} value={lang} className="bg-neutral-900 text-white">
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/70">Text Size</label>
            <div className="grid grid-cols-4 gap-1">
              {SUBTITLE_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSubtitleSize(size)}
                  className={`py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                    subtitleSize === size
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-950 border-white/15 text-white/60 hover:text-white'
                  }`}
                >
                  {size.replace('-', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/70">Background Opacity</label>
            <select
              value={subtitleBg}
              onChange={(e) => setSubtitleBg(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-white/15 text-white text-xs focus:outline-none"
            >
              {SUBTITLE_BGS.map((bg) => (
                <option key={bg.id} value={bg.id} className="bg-neutral-900 text-white">
                  {bg.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

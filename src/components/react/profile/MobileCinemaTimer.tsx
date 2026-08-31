import React, { useState, useEffect, useRef } from 'react';

interface MobileCinemaTimerProps {
  onShowToast?: (msg: string) => void;
}

const TIMER_PRESETS = [
  { mins: 15, label: '15m', title: 'Power Nap' },
  { mins: 30, label: '30m', title: '1 Episode' },
  { mins: 45, label: '45m', title: 'Late Night' },
  { mins: 60, label: '60m', title: '1 Hour' },
  { mins: 90, label: '90m', title: 'Feature Film' },
  { mins: 120, label: '2h', title: 'Double Feature' },
];

export default function MobileCinemaTimer({ onShowToast }: MobileCinemaTimerProps) {
  const [selectedMins, setSelectedMins] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [fadeAudio, setFadeAudio] = useState<boolean>(true);
  const [darkSleepLock, setDarkSleepLock] = useState<boolean>(true);
  const [todayWatchMinutes] = useState<number>(142); // 2h 22m mock watch time
  const [dailyGoal] = useState<number>(180); // 3h daily budget

  const timerRef = useRef<number | null>(null);

  // Load saved timer state on mount
  useEffect(() => {
    try {
      const savedTimer = localStorage.getItem('filmora_cinema_timer');
      if (savedTimer) {
        const { endsAt, total } = JSON.parse(savedTimer);
        const now = Date.now();
        if (endsAt > now) {
          const rem = Math.floor((endsAt - now) / 1000);
          setTotalSeconds(total);
          setSecondsRemaining(rem);
          setIsRunning(true);
        } else {
          localStorage.removeItem('filmora_cinema_timer');
        }
      }
    } catch {}
  }, []);

  // Interval ticker
  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (onShowToast) onShowToast('🌙 Cinema Sleep Timer Finished! Stream Paused.');
            localStorage.removeItem('filmora_cinema_timer');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, secondsRemaining, onShowToast]);

  const handleSetPreset = (mins: number) => {
    setSelectedMins(mins);
    const secs = mins * 60;
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setIsRunning(true);

    try {
      localStorage.setItem(
        'filmora_cinema_timer',
        JSON.stringify({
          endsAt: Date.now() + secs * 1000,
          total: secs,
        })
      );
    } catch {}

    if (onShowToast) onShowToast(`Sleep Timer Set: ${mins} minutes ⏳`);
  };

  const handleCancelTimer = () => {
    setIsRunning(false);
    setSelectedMins(null);
    setSecondsRemaining(0);
    setTotalSeconds(0);
    try {
      localStorage.removeItem('filmora_cinema_timer');
    } catch {}
    if (onShowToast) onShowToast('Cinema Sleep Timer Cancelled');
  };

  const handleTogglePlayPause = () => {
    if (secondsRemaining <= 0) return;
    setIsRunning(!isRunning);
    if (onShowToast) {
      onShowToast(!isRunning ? 'Timer Resumed ▶' : 'Timer Paused ⏸');
    }
  };

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // SVG circular gauge math
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-black border border-white/20 shadow-2xl space-y-4 text-white relative overflow-hidden select-none">
      {/* ── Background Glow Accent ── */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm shadow-md flex-none">
            ⏳
          </span>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>Cinema Sleep Timer &amp; Screen Wellness</span>
            </h3>
            <p className="text-[10px] text-white/50">Auto-pause streams, fade audio, and dark-lock screens.</p>
          </div>
        </div>

        {isRunning && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Active</span>
          </span>
        )}
      </div>

      {/* ── Creative Interactive Gauge + Digital Display ── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
        {/* Glowing Circular Radial Clock */}
        <div className="relative w-36 h-36 flex items-center justify-center flex-none">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated Progress Stroke */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="url(#timerGradient)"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Digital Countdown Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {secondsRemaining > 0 ? (
              <>
                <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight animate-pulse">
                  {formatTime(secondsRemaining)}
                </span>
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider mt-0.5 font-mono">
                  {isRunning ? 'Counting Down' : 'Paused'}
                </span>
              </>
            ) : (
              <>
                <span className="text-lg font-black text-white/40 font-mono">--:--</span>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider mt-0.5">
                  Timer Off
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Action Controls & Daily Watch Budget Gauge */}
        <div className="flex-1 w-full space-y-3">
          {/* Active Timer Quick Toggle Controls */}
          {secondsRemaining > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlayPause}
                className="flex-1 py-2 px-3 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>{isRunning ? '⏸ Pause' : '▶ Resume'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancelTimer}
                className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 border border-white/15 text-xs font-bold transition-colors active:scale-95"
              >
                ✕ Cancel
              </button>
            </div>
          )}

          {/* Daily Screen Time Budget Bar */}
          <div className="p-3 rounded-2xl bg-neutral-950 border border-white/15 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60 font-bold text-[11px] flex items-center gap-1">
                <span>📱 Today's Watch Time:</span>
                <span className="text-white font-mono font-black">2h 22m</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {Math.round((todayWatchMinutes / dailyGoal) * 100)}% of 3h goal
              </span>
            </div>

            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (todayWatchMinutes / dailyGoal) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Creative Quick Preset Buttons Strip ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-white/60">
          <span>Tap to Set Sleep Timer:</span>
          {selectedMins && (
            <span className="text-white font-mono text-[10px]">
              Preset: {selectedMins} mins
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {TIMER_PRESETS.map((preset) => {
            const isCurrentPreset = selectedMins === preset.mins && secondsRemaining > 0;
            return (
              <button
                key={preset.mins}
                type="button"
                onClick={() => handleSetPreset(preset.mins)}
                className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center active:scale-95 shadow-md ${
                  isCurrentPreset
                    ? 'bg-white text-black border-white shadow-xl ring-2 ring-white/40'
                    : 'bg-neutral-950 text-white/80 hover:text-white border-white/15 hover:border-white/30'
                }`}
              >
                <span className="text-xs font-black font-mono">{preset.label}</span>
                <span className={`text-[9px] font-medium mt-0.5 truncate max-w-full ${isCurrentPreset ? 'text-black/70 font-bold' : 'text-white/40'}`}>
                  {preset.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Auto-Off Smart Defense Toggles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
        <div className="p-2.5 rounded-xl bg-neutral-950 border border-white/10 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
              <span>🌙 Smooth Audio Fade</span>
            </span>
            <p className="text-[10px] text-white/40">Fades volume over last 60 seconds</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFadeAudio(!fadeAudio);
              if (onShowToast) onShowToast(!fadeAudio ? 'Audio Fade Enabled ✓' : 'Audio Fade Disabled');
            }}
            className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
              fadeAudio ? 'bg-white' : 'bg-white/20'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                fadeAudio ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-neutral-950 border border-white/10 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
              <span>💤 OLED Pitch Black Lock</span>
            </span>
            <p className="text-[10px] text-white/40">Protects battery &amp; prevents burn-in</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDarkSleepLock(!darkSleepLock);
              if (onShowToast) onShowToast(!darkSleepLock ? 'OLED Dark Lock Active ✓' : 'Dark Lock Disabled');
            }}
            className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
              darkSleepLock ? 'bg-white' : 'bg-white/20'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-black transition-transform ${
                darkSleepLock ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

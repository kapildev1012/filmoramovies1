import React, { useState, useEffect } from 'react';
import { IconWifi, IconSpeed, IconShield } from './ProfileIcons';

export default function ProfileCoolStats() {
  const [ping, setPing] = useState(16);
  const [bitrate, setBitrate] = useState(88.4);

  // Micro-fluctuation for cool live diagnostic feel
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(14 + Math.random() * 6));
      setBitrate(parseFloat((86 + Math.random() * 5).toFixed(1)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-4 sm:mb-6">
      {/* ── Mobile Compact 3-Pill Strip ── */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        {/* Network */}
        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center shadow-lg">
          <div className="flex items-center gap-1 text-[10px] text-white/50 font-bold uppercase">
            <IconWifi className="w-3 h-3 text-emerald-400" />
            <span>Ping</span>
          </div>
          <div className="text-xs font-black text-white font-mono mt-0.5">{ping}ms</div>
          <span className="text-[9px] text-emerald-400 font-bold">Optimal</span>
        </div>

        {/* Bitrate */}
        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center shadow-lg">
          <div className="flex items-center gap-1 text-[10px] text-white/50 font-bold uppercase">
            <IconSpeed className="w-3 h-3 text-white/80" />
            <span>Bitrate</span>
          </div>
          <div className="text-xs font-black text-white font-mono mt-0.5">{bitrate}M</div>
          <span className="text-[9px] text-white/60 font-bold">4K HDR</span>
        </div>

        {/* Audio */}
        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center shadow-lg">
          <div className="flex items-center gap-1 text-[10px] text-white/50 font-bold uppercase">
            <IconShield className="w-3 h-3 text-white/80" />
            <span>Audio</span>
          </div>
          <div className="text-xs font-black text-white font-mono mt-0.5 truncate max-w-full">Atmos</div>
          <span className="text-[9px] text-white/60 font-bold">Spatial</span>
        </div>
      </div>

      {/* ── Desktop Expanded Cards ── */}
      <div className="hidden md:grid grid-cols-3 gap-4">
        {/* Network */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
              <IconWifi className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black text-white/40 tracking-wider">Network Health</div>
              <div className="text-xs font-black text-white font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{ping}ms Ultra-Low Latency</span>
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
            Optimal
          </span>
        </div>

        {/* Bitrate */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <IconSpeed className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black text-white/40 tracking-wider">Stream Throughput</div>
              <div className="text-xs font-black text-white font-mono">{bitrate} Mbps (4K HDR)</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[9px] font-black uppercase">
            Lossless
          </span>
        </div>

        {/* Audio */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <IconShield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black text-white/40 tracking-wider">Spatial Audio Engine</div>
              <div className="text-xs font-black text-white">Dolby Atmos / 24-bit FLAC</div>
            </div>
          </div>

          <div className="flex items-end gap-1 h-5 px-1">
            <span className="w-1 bg-white/60 rounded-full h-3" />
            <span className="w-1 bg-white/80 rounded-full h-5" />
            <span className="w-1 bg-white/40 rounded-full h-2" />
            <span className="w-1 bg-white/90 rounded-full h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

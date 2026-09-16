import { useEffect, useState } from 'react';
import { CastIcon, CloseIcon } from './Icons';

interface CastModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  streamUrl?: string | null;
}

export default function CastModal({ isOpen, onClose, title = 'Stream', streamUrl }: CastModalProps) {
  const [copied, setCopied] = useState(false);
  const [nativeCastAttempted, setNativeCastAttempted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNativeCastAttempted(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const tryNativeCast = () => {
    setNativeCastAttempted(true);
    // In cross-origin iframes, we can't trigger AirPlay directly from the parent window.
    // We try to find a video element if it exists in the top document (e.g. YouTube trailer).
    try {
      const video = document.querySelector('video') as any;
      if (video) {
        if (typeof video.webkitShowPlaybackTargetPicker === 'function') {
          video.webkitShowPlaybackTargetPicker();
          return;
        }
        if (video.remote && typeof video.remote.prompt === 'function') {
          video.remote.prompt().catch(() => {});
          return;
        }
      }
    } catch {}
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  };

  const openDirect = () => {
    if (streamUrl) {
      window.open(streamUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(currentUrl, '_blank');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#030305]/90 backdrop-blur-[28px] animate-in fade-in duration-300"
      aria-modal="true"
      role="dialog"
      aria-labelledby="cast-modal-title"
    >
      <div className="relative w-full max-w-[420px] rounded-3xl bg-gradient-to-b from-[#0e0c16] to-[#06050a] border border-purple-500/25 p-6 sm:p-7 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.9),0_0_50px_-12px_rgba(124,58,237,0.18)] overflow-hidden text-white transition-all transform animate-in zoom-in-95 duration-300">
        
        {/* Top hairline purple glow */}
        <div className="absolute top-0 left-[20%] right-[20%] h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" aria-hidden="true" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-90 z-10"
          aria-label="Close cast modal"
        >
          <CloseIcon size={16} />
        </button>

        {/* Header section */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#19122b] to-[#0e0a19] border border-purple-500/35 flex items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_24px_-4px_rgba(124,58,237,0.35)] mb-1">
            {/* Pulsing ambient glow behind icon */}
            <div className="absolute inset-[-3px] rounded-[20px] bg-purple-600/30 blur-[10px] animate-pulse" aria-hidden="true" />
            <CastIcon size={26} />
          </div>
          
          <div className="space-y-1">
            <h3 id="cast-modal-title" className="text-xl font-extrabold text-white tracking-tight">
              Cast to Smart TV
            </h3>
            <p className="text-sm text-white/60 font-medium px-4 line-clamp-1">
              {title}
            </p>
          </div>
        </div>

        {/* Casting Options */}
        <div className="space-y-3.5">
          {/* Option 1: Native Trigger / AirPlay */}
          <button
            type="button"
            onClick={tryNativeCast}
            className="w-full p-4 rounded-2xl bg-gradient-to-b from-[#161129] to-[#0f0b1d] border border-purple-500/20 hover:border-purple-400/50 hover:shadow-[0_8px_30px_-10px_rgba(147,51,234,0.3)] transition-all flex items-center justify-between text-left group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-110 group-hover:bg-purple-600/30 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-[13px] font-bold text-white group-hover:text-purple-300 transition-colors">
                  AirPlay / Cast Device
                </div>
                <div className="text-xs text-white/50 font-medium mt-0.5">
                  {nativeCastAttempted ? 'Device search triggered' : 'Tap to scan for TVs on your Wi-Fi'}
                </div>
              </div>
            </div>
            <span className="text-purple-400 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Connect
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </span>
          </button>

          {/* Option 2: Mobile Screen Mirroring Instructions */}
          <div className="p-4 rounded-2xl bg-[#090710]/80 border border-white/5 space-y-2.5">
            <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" aria-hidden="true" />
              How to Cast from Phone
            </div>
            <ul className="text-[11.5px] text-white/60 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <b className="text-white flex-none tracking-wide">iOS / Apple TV:</b>
                <span>Swipe down Control Center, tap <b>Screen Mirroring</b>.</span>
              </li>
              <li className="flex items-start gap-2">
                <b className="text-white flex-none tracking-wide">Android / LG:</b>
                <span>Swipe down Quick Settings, tap <b>Smart View</b> or <b>Cast</b>.</span>
              </li>
            </ul>
          </div>

          {/* Action Row */}
          <div className="flex gap-2.5">
            {/* Option 3: Open in Clean Native Window */}
            <button
              type="button"
              onClick={openDirect}
              className="flex-1 p-3.5 rounded-2xl bg-[#110d1f] hover:bg-[#1a1331] border border-white/10 hover:border-purple-500/40 transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 group"
            >
              <svg className="w-4 h-4 text-purple-300 group-hover:text-purple-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="text-xs font-bold text-white">Clean Tab</span>
            </button>

            {/* Option 4: Smart TV Link Share */}
            <button
              type="button"
              onClick={copyUrl}
              className="flex-1 p-3.5 rounded-2xl bg-[#110d1f] hover:bg-[#1a1331] border border-white/10 hover:border-purple-500/40 transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 group"
            >
              <svg className="w-4 h-4 text-purple-300 group-hover:text-purple-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-bold text-white">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center">
          <p className="text-[10.5px] text-white/40 font-medium text-center flex items-center gap-1.5">
            <svg className="w-3 h-3 text-purple-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Supports Samsung, LG, Sony, Apple TV & Fire TV
          </p>
        </div>
      </div>
    </div>
  );
}


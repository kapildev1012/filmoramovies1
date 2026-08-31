"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Play, Phone, Mail, Lock, User as UserIcon, Sparkles, KeyRound } from "lucide-react";

export interface Slide {
  img: string;
  title: string;
  tagline: string;
}

interface Props {
  slides: Slide[];
  error?: string | null;
}

export default function AuthShowcase({ slides, error }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const list = slides.length ? slides : [{ img: "", title: "Filmora", tagline: "" }];

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((c) => (c + 1) % list.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [list.length]);

  return (
    <section
      className="min-h-screen p-3 antialiased [font-synthesis:none]"
      style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
    >
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">

        {/* ── LEFT: cinematic showcase (always dark) ── */}
        <div className="relative flex min-h-[600px] justify-center overflow-hidden rounded-3xl bg-black px-7 py-12 text-white sm:px-10 lg:min-h-0 lg:py-16 border border-white/10 shadow-2xl">
          {/* ambient glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/3 h-[50vh] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[90px]"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.25), rgba(168,85,247,0.15) 45%, transparent 70%)" }}
          />

          <div className="relative flex w-full max-w-[500px] flex-col items-center">
            {/* Brand */}
            <a href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white">
              <span className="grid size-8 place-items-center rounded-lg" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                <Play className="size-4 fill-white text-white" />
              </span>
              Filmora
            </a>

            {/* Poster grid */}
            <div className="relative mt-10 grid w-full grid-cols-[1.55fr_1fr] gap-2">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-black to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-black to-transparent" />
              <ImageTile src={list[0]?.img} active={activeIndex === 0} className="row-span-2 h-[250px]" />
              <ImageTile src={list[1 % list.length]?.img} active={activeIndex === 1 % list.length} className="h-[121px]" />
              <ImageTile src={list[3 % list.length]?.img} active={activeIndex === 3 % list.length} className="h-[121px]" />
              <ImageTile src={list[2 % list.length]?.img} active={activeIndex === 2 % list.length} className="col-span-2 h-[120px]" />
            </div>

            {/* Caption card */}
            <div className="mt-6 w-full rounded-2xl border border-dashed border-white/15 px-5 py-4 backdrop-blur-md bg-white/[0.02]">
              <div className="flex items-end gap-4">
                <p className="line-clamp-3 flex-1 text-xs leading-4 text-white/60">
                  <span className="font-bold text-white">{list[activeIndex]?.title}</span>
                  {list[activeIndex]?.tagline ? ` — ${list[activeIndex]?.tagline}` : ""}
                </p>
                <a href="/movies" aria-label="Browse movies" className="grid size-8 shrink-0 place-items-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30">
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </div>

            <p className="mt-7 max-w-[300px] text-center text-xl font-bold tracking-tight text-white">
              Where every movie &amp; series finds you
            </p>

            {/* Dots */}
            <div className="mt-auto flex gap-2 pb-4 pt-8">
              {list.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={activeIndex === index ? "h-1 w-10 rounded-full bg-white" : "h-1 w-4 rounded-full bg-white/35"}
                  aria-label={`Show slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: auth form ── */}
        <div className="flex min-h-[600px] items-center justify-center px-6 py-10 sm:px-10 lg:min-h-0 lg:px-14 xl:px-20">
          <AuthForm error={error} />
        </div>
      </div>
    </section>
  );
}

function ImageTile({ src, active, className }: { src?: string; active: boolean; className: string }) {
  return (
    <div className={`${className} relative overflow-visible rounded-xl ${active ? "z-10" : "z-0"}`}>
      {src ? (
        <img
          src={src}
          alt=""
          className={`h-full w-full rounded-xl object-cover transition-opacity duration-700 ${active ? "opacity-100" : "opacity-40"}`}
          loading="eager"
        />
      ) : (
        <div className="h-full w-full rounded-xl bg-white/5" />
      )}
      <FocusCorners active={active} />
    </div>
  );
}

function FocusCorners({ active }: { active: boolean }) {
  const base = `pointer-events-none absolute h-4 w-4 border-white/60 transition-all duration-500 ease-out ${active ? "translate-x-0 translate-y-0 opacity-100" : "opacity-0"}`;
  return (
    <>
      <div className={`${base} -left-2 -top-2 border-l border-t ${active ? "" : "-translate-x-2 -translate-y-2"}`} />
      <div className={`${base} -right-2 -top-2 border-r border-t ${active ? "" : "translate-x-2 -translate-y-2"}`} />
      <div className={`${base} -bottom-2 -left-2 border-b border-l ${active ? "" : "-translate-x-2 translate-y-2"}`} />
      <div className={`${base} -bottom-2 -right-2 border-b border-r ${active ? "" : "translate-x-2 translate-y-2"}`} />
    </>
  );
}

function AuthForm({ error: initialError }: { error?: string | null }) {
  const [authMethod, setAuthMethod] = useState<'otp' | 'email'>('otp');
  
  // Phone OTP States
  const [phoneNumber, setPhoneNumber] = useState('+91 ');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [otpLoading, setOtpLoading] = useState(false);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  // Email States
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(initialError || null);

  // OTP Countdown Timer
  useEffect(() => {
    if (!otpSent || countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  // Send Phone OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMsg('Please enter a valid mobile phone number.');
      return;
    }
    setOtpLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to send OTP');

      setOtpSent(true);
      setCountdown(30);
      if (data.previewCode) setDemoCodeHint(data.previewCode);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending OTP code');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg('Please enter the verification code.');
      return;
    }
    setOtpLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Invalid OTP code');

      window.location.href = data.redirect || '/';
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed');
      setOtpLoading(false);
    }
  };

  // Email / Password Auth
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setEmailLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Authentication failed');
      }
      window.location.href = data.redirect || '/';
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in');
      setEmailLoading(false);
    }
  };

  // 1-Click Guest Login
  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Guest login failed');
      window.location.href = data.redirect || '/';
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to login as guest');
      setGuestLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[480px] space-y-6">
      <div className="text-center space-y-2">
        <h1
          className="text-3xl sm:text-4xl font-black tracking-tight"
          style={{ color: "var(--color-text)" }}
        >
          Sign In to Filmora
        </h1>
        <p className="text-xs sm:text-sm text-white/60">
          Sync your watchlist, resume playback, and unlock unlimited streaming.
        </p>

        {/* Primary Method Switcher (Phone OTP vs Email) */}
        <div className="flex items-center justify-center p-1 rounded-2xl bg-white/5 border border-white/10 w-fit mx-auto mt-4">
          <button
            type="button"
            onClick={() => { setAuthMethod('otp'); setErrorMsg(null); }}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              authMethod === 'otp'
                ? 'bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Mobile OTP</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('email'); setErrorMsg(null); }}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              authMethod === 'email'
                ? 'bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Login</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-semibold"
          role="alert"
          style={{ background: "rgba(238,68,68,0.12)", border: "1px solid rgba(238,68,68,0.3)", color: "#f87171" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {errorMsg}
        </div>
      )}

      {/* ── Official Multi-Provider OAuth 2.0 Grid ── */}
      <div className="space-y-2.5">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/40 text-center">
          Official Single-Tap Sign In
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Official Google OAuth */}
          <a
            href="/api/auth/google"
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-bold transition-all bg-white/5 hover:bg-white/10 border border-white/10 text-white active:scale-95 shadow-md"
            title="Sign In with Official Google Account"
          >
            <GoogleIcon />
            <span>Google</span>
          </a>

          {/* Official Discord OAuth */}
          <a
            href="/api/auth/discord"
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-bold transition-all bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/40 text-white active:scale-95 shadow-md"
            title="Sign In with Official Discord Account"
          >
            <DiscordIcon />
            <span>Discord</span>
          </a>

          {/* Official X / Twitter OAuth */}
          <a
            href="/api/auth/x"
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-bold transition-all bg-white/10 hover:bg-white/15 border border-white/20 text-white active:scale-95 shadow-md"
            title="Sign In with Official X (Twitter)"
          >
            <XIcon />
            <span>X (Twitter)</span>
          </a>

          {/* Official Telegram Login */}
          <a
            href="/api/auth/telegram?username=TelegramMember"
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-bold transition-all bg-[#2AABEE]/20 hover:bg-[#2AABEE]/30 border border-[#2AABEE]/40 text-white active:scale-95 shadow-md"
            title="Sign In with Official Telegram"
          >
            <TelegramIcon />
            <span>Telegram</span>
          </a>
        </div>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
          {authMethod === 'otp' ? 'Or Enter Mobile Number' : 'Or Enter Email'}
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* ── 1. Phone Number OTP Form ── */}
      {authMethod === 'otp' && (
        <div className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/70">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 size-4 text-white/40 pointer-events-none" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000 or +91 9876543210"
                    required
                    className="w-full h-11 rounded-2xl bg-white/5 border border-white/10 px-4 pl-10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-all font-mono"
                  />
                </div>
                <p className="text-[10px] text-white/40">
                  We will send a 6-digit verification code to this number.
                </p>
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-purple-600/30 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 mx-auto flex items-center justify-center text-xl shadow-lg">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Enter 6-Digit OTP Code</h3>
                <p className="text-xs text-white/60">
                  Sent to <span className="font-mono text-purple-300 font-bold">{phoneNumber}</span>
                </p>
                {demoCodeHint && (
                  <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-[11px] text-purple-200">
                    💡 Test Code: <span className="font-mono font-bold tracking-widest">{demoCodeHint}</span> or <span className="font-mono font-bold">123456</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="• • • • • •"
                  autoFocus
                  required
                  className="w-full h-14 rounded-2xl bg-white/5 border border-purple-500/50 px-4 text-center text-xl tracking-[0.6em] font-mono text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-purple-600/30 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Verify Code &amp; Sign In</span>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-white/50 hover:text-white font-semibold"
                >
                  ← Change Number
                </button>
                <button
                  type="button"
                  disabled={countdown > 0}
                  onClick={handleSendOtp}
                  className={`font-semibold ${
                    countdown > 0 ? 'text-white/30 cursor-not-allowed' : 'text-purple-400 hover:text-purple-300'
                  }`}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── 2. Email / Password Form ── */}
      {authMethod === 'email' && (
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {emailMode === 'signup' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/70">Your Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 size-4 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  required
                  className="w-full h-11 rounded-2xl bg-white/5 border border-white/10 px-4 pl-10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/70">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 size-4 text-white/40 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full h-11 rounded-2xl bg-white/5 border border-white/10 px-4 pl-10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/70">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 size-4 text-white/40 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-11 rounded-2xl bg-white/5 border border-white/10 px-4 pl-10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={emailLoading}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-purple-600/30 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {emailLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{emailMode === 'signin' ? 'Sign In with Email' : 'Create Account'}</span>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
              className="text-xs text-white/60 hover:text-purple-300 font-semibold"
            >
              {emailMode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </form>
      )}

      {/* ── Instant 1-Click Guest Pass ── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={guestLoading}
          className="w-full h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{guestLoading ? 'Signing In as Guest…' : '1-Click Instant Guest Access'}</span>
        </button>
      </div>
    </div>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
      <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="#2AABEE">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
    </svg>
  );
}

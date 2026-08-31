import { useState, useEffect, useCallback, useRef } from 'react';
import type { HeroSlide } from '../../lib/tmdb';
import { OriginButton } from '../ui/origin-button';

const SLIDE_MS = 4000; // 4 seconds per slide
const MAX_GENRES = 3;  // keep the chip row on a single line

function backdropSrcSet(url: string): string | undefined {
  if (!url.includes('/w1280/')) return undefined;
  const widths = [780, 1280];
  return widths
    .map((w) => `${url.replace('/w1280/', `/w${w}/`)} ${w}w`)
    .join(', ');
}

interface Props {
  slides: HeroSlide[];
  label?: string;
}

export default function HeroCarousel({ slides, label }: Props) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goTo = useCallback((i: number) => {
    if (count === 0) return;
    setIndex(((i % count) + count) % count);
  }, [count]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const paused = hoverPaused || userPaused;
  const autoplays = !reduceMotion && count > 1;

  const remainingRef = useRef(SLIDE_MS);
  const startedAtRef = useRef(0);

  useEffect(() => {
    remainingRef.current = SLIDE_MS;
  }, [index]);

  useEffect(() => {
    if (!autoplays || paused) {
      if (startedAtRef.current) {
        remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
        startedAtRef.current = 0;
      }
      return;
    }
    startedAtRef.current = Date.now();
    const id = window.setTimeout(next, remainingRef.current);
    return () => window.clearTimeout(id);
  }, [index, paused, autoplays, next]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  }, [next, prev]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setHoverPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    setHoverPaused(false);
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      (dx < 0 ? next : prev)();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (count === 0) return null;

  const slide = slides[index];
  const genres = slide.genres.slice(0, MAX_GENRES);

  return (
    <section
      className={`nf-hero ${count === 1 ? 'nf-hero--single' : ''}`}
      aria-roledescription="carousel"
      aria-label={label ? `${label} carousel` : 'Featured content'}
      tabIndex={0}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setHoverPaused(true)}
      onBlur={() => setHoverPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Background Stages ── */}
      <div className="nf-stage" aria-hidden="true">
        {slides.map((s, i) => {
          const shouldLoad = i === index || i === (index + 1) % count || i === (index - 1 + count) % count;
          const srcSet = s.backdropUrl ? backdropSrcSet(s.backdropUrl) : undefined;
          return (
            <div key={s.id} className={`nf-bg ${i === index ? 'nf-bg--active' : ''}`}>
              {s.backdropUrl && shouldLoad && (
                <img
                  src={s.backdropUrl}
                  srcSet={srcSet}
                  sizes="100vw"
                  alt=""
                  className="nf-bg-img"
                  loading={i === index ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={i === index ? 'high' : 'low'}
                />
              )}
            </div>
          );
        })}
        {/* Cinema Vignette Gradients */}
        <div className="nf-grad-bottom" />
        <div className="nf-grad-left" />
        <div className="nf-grad-top" />
      </div>

      {/* ── Content Panel ── */}
      <div className="nf-content-wrap" aria-live="polite" aria-atomic="true">
        <div className="nf-content" key={slide.id}>
          {/* Creative Meta Pill Row */}
          <div className="nf-meta">
            <span className="nf-type-badge">
              {slide.mediaType === 'movie' ? '🎬 Film' : '📺 Series'}
            </span>
            {slide.rating > 0 && (
              <span className="nf-imdb">
                <span className="nf-imdb-lozenge">★</span>
                <span>{slide.rating.toFixed(1)}</span>
              </span>
            )}
            <span className="nf-pill font-mono">4K Ultra HD</span>
            {slide.releaseYear && <span className="nf-pill font-mono">{slide.releaseYear}</span>}
          </div>

          {/* Title */}
          <h1 className="nf-title">{slide.title}</h1>

          {/* Genre Chips */}
          {genres.length > 0 && (
            <div className="nf-genres">
              {genres.map((g) => (
                <span key={g} className="nf-genre">{g}</span>
              ))}
            </div>
          )}

          {/* Overview */}
          {slide.overview && (
            <p className="nf-overview">{slide.overview}</p>
          )}

          {/* Primary CTA Buttons Row */}
          <div className="nf-actions flex flex-row gap-3 items-center w-full max-w-[500px]">
            <OriginButton
              onClick={() => { window.location.href = slide.href; }}
              className="flex-1 md:flex-none md:w-[240px] h-[48px] md:h-[55px] rounded-full !bg-white hover:!bg-neutral-200 !text-black font-black uppercase tracking-wider shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
              aria-label={`Watch ${slide.title} now`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6 4.75a.75.75 0 0 1 1.18-.61l12 7.25a.75.75 0 0 1 0 1.22l-12 7.25A.75.75 0 0 1 6 19.25V4.75z" />
              </svg>
              <span>Watch Now</span>
            </OriginButton>
            <WatchlistBtn id={slide.id} mediaType={slide.mediaType} title={slide.title} posterUrl={slide.posterUrl} />
          </div>
        </div>
      </div>

      {/* ── Bottom Control Strip & Animated Progress Indicator ── */}
      {count > 1 && (
        <div className={`nf-strip ${paused ? 'is-paused' : ''}`}>
          <div className="nf-strip-left">
            <span className="nf-counter" aria-hidden="true">
              <b>{String(index + 1).padStart(2, '0')}</b>
              <i>/</i>
              {String(count).padStart(2, '0')}
            </span>
            <div className={`nf-dots ${autoplays ? '' : 'nf-dots--static'}`} aria-label="Slide navigation">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-current={i === index ? 'true' : undefined}
                  aria-label={`Go to slide ${i + 1} of ${count}: ${s.title}`}
                  className={`nf-dot ${i === index ? 'nf-dot--active' : ''}`}
                  onClick={() => goTo(i)}
                >
                  <span
                    className="nf-dot-fill"
                    style={{ animationDuration: `${SLIDE_MS}ms` }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="nf-strip-right">
            {autoplays && (
              <button
                type="button"
                className="nf-ctl"
                onClick={() => setUserPaused((v) => !v)}
                aria-label={userPaused ? 'Resume slideshow' : 'Pause slideshow'}
              >
                {userPaused
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.75a.75.75 0 0 1 1.18-.61l11 7.25a.75.75 0 0 1 0 1.22l-11 7.25A.75.75 0 0 1 7 19.25V4.75z"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>}
              </button>
            )}
            <button type="button" className="nf-ctl nf-ctl--prev" onClick={prev} aria-label="Previous slide">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button type="button" className="nf-ctl nf-ctl--next" onClick={next} aria-label="Next slide">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes nf-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nf-kenburns {
          from { transform: scale(1.05); }
          to   { transform: scale(1); }
        }
        @keyframes nf-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        .nf-hero {
          position: relative;
          width: 100%;
          min-height: 100svh;
          max-height: 100svh;
          display: grid;
          grid-template-rows: 1fr auto;
          overflow: hidden;
          background: #000;
          outline: none;
          touch-action: pan-y;
        }
        .nf-hero:focus-visible { box-shadow: inset 0 0 0 2px rgba(255,255,255,0.6); }

        @media (max-width: 767px) {
          .nf-hero { min-height: 100svh; max-height: 100svh; }
          .nf-bg-img { object-position: center 20% !important; }
        }

        .nf-stage { position: absolute; inset: 0; }
        .nf-bg { position: absolute; inset: 0; opacity: 0; transition: opacity 0.8s ease; will-change: opacity; }
        .nf-bg--active { opacity: 1; }
        .nf-bg-img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; display: block; }
        .nf-bg--active .nf-bg-img { animation: nf-kenburns 5s ease-out forwards; }

        /* Pure OLED Black Cinema Vignette Overlays */
        .nf-grad-bottom {
          position: absolute; inset: 0;
          background: linear-gradient(
            to top,
            #000 0%,
            rgba(0,0,0,0.98) 22%,
            rgba(0,0,0,0.7) 48%,
            rgba(0,0,0,0.15) 75%,
            transparent 100%
          );
        }
        .nf-grad-left {
          position: absolute; inset: 0;
          background: linear-gradient(
            to right,
            rgba(0,0,0,0.85) 0%,
            rgba(0,0,0,0.45) 40%,
            transparent 75%
          );
        }
        .nf-grad-top {
          position: absolute; top: 0; left: 0; right: 0; height: 140px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.65), transparent);
        }

        .nf-content-wrap {
          position: relative;
          z-index: 2;
          align-self: end;
          padding: 0 4% 1.5rem;
          width: 100%;
        }
        .nf-content { max-width: 680px; }
        .nf-hero--single .nf-content-wrap { padding-bottom: 5rem; }

        @media (max-width: 767px) {
          .nf-content-wrap {
            padding: 0 1.25rem 4.5rem;
            text-align: left;
          }
          .nf-content {
            max-width: 100%;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .nf-hero--single .nf-content-wrap {
            padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 1rem);
          }
          .nf-grad-bottom {
            background: linear-gradient(
              to top,
              #000 0%,
              rgba(0,0,0,0.98) 28%,
              rgba(0,0,0,0.8) 55%,
              rgba(0,0,0,0.2) 80%,
              transparent 100%
            );
          }
        }

        /* Meta row */
        .nf-meta {
          display: inline-flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
          margin-bottom: 0.625rem;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          animation: nf-fade-up 0.5s ease backwards;
        }
        .nf-type-badge {
          font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.04em;
          color: #fff;
          white-space: nowrap;
        }
        .nf-imdb {
          display: inline-flex; align-items: center; gap: 0.25rem;
          font-size: 0.8125rem; font-weight: 800; color: #fff;
        }
        .nf-imdb-lozenge {
          color: #facc15; font-weight: 900; font-size: 0.75rem;
        }
        .nf-pill {
          font-size: 0.75rem; color: rgba(255,255,255,0.7); font-weight: 700;
        }
        .nf-pill::before {
          content: '·'; margin-right: 0.5rem; opacity: 0.4;
        }

        /* Title */
        .nf-title {
          font-size: clamp(2rem, 5.5vw, 3.5rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: #fff;
          margin: 0 0 0.5rem;
          text-shadow: 0 4px 30px rgba(0,0,0,0.8);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          animation: nf-fade-up 0.5s ease backwards; animation-delay: 80ms;
        }

        /* Genres */
        .nf-genres {
          display: flex; gap: 0.4rem; margin-bottom: 0.75rem; flex-wrap: wrap;
          animation: nf-fade-up 0.5s ease backwards; animation-delay: 120ms;
        }
        .nf-genre {
          font-size: 0.75rem; font-weight: 700;
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.15);
          white-space: nowrap;
        }

        /* Overview */
        .nf-overview {
          font-size: 0.95rem;
          line-height: 1.5;
          color: rgba(255,255,255,0.8);
          margin: 0 0 1.25rem;
          max-width: 560px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          animation: nf-fade-up 0.5s ease backwards; animation-delay: 160ms;
          text-shadow: 0 2px 10px rgba(0,0,0,0.8);
        }

        /* Bottom Strip */
        .nf-strip {
          position: relative; z-index: 3;
          display: flex; align-items: center; justify-content: space-between;
          gap: 1rem;
          padding: 0 4% 1.75rem;
        }
        .nf-strip-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
        .nf-strip-right { display: flex; align-items: center; gap: 0.5rem; }

        .nf-counter {
          font-size: 0.75rem; font-variant-numeric: tabular-nums;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.5);
          white-space: nowrap;
        }
        .nf-counter b { color: #fff; font-weight: 700; }
        .nf-counter i { font-style: normal; margin: 0 0.3rem; opacity: 0.5; }

        .nf-dots { display: flex; gap: 0.4rem; align-items: center; }
        .nf-dot {
          position: relative; overflow: hidden;
          width: 14px; height: 4px; border-radius: 999px; border: none;
          background: rgba(255,255,255,0.28); cursor: pointer; padding: 0;
          transition: width 0.35s ease, background 0.25s ease;
        }
        .nf-dot:hover { background: rgba(255,255,255,0.55); }
        .nf-dot--active { width: 36px; background: rgba(255,255,255,0.3); }
        .nf-dot-fill {
          position: absolute; inset: 0;
          background: #fff; border-radius: inherit;
          transform: scaleX(0); transform-origin: left center;
        }
        .nf-dot--active .nf-dot-fill { animation-name: nf-progress; animation-timing-function: linear; animation-fill-mode: forwards; }
        .nf-strip.is-paused .nf-dot--active .nf-dot-fill { animation-play-state: paused; }
        .nf-dots--static .nf-dot--active .nf-dot-fill { animation: none; transform: scaleX(1); }

        .nf-ctl {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.75); cursor: pointer;
          transition: all 0.18s ease;
        }
        .nf-ctl:hover { background: rgba(255,255,255,0.2); color: #fff; transform: scale(1.08); }

        @media (max-width: 767px) {
          .nf-strip {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
            height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .nf-content-wrap {
            padding: 0 1.25rem calc(68px + env(safe-area-inset-bottom, 0px) + 1.25rem) !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nf-bg { transition: none; }
          .nf-bg--active .nf-bg-img { animation: none; }
          .nf-content > * { animation: none; opacity: 1; transform: none; }
          .nf-dot--active .nf-dot-fill { animation: none; transform: scaleX(1); }
        }
      `}</style>
    </section>
  );
}

function WatchlistBtn({ id, mediaType, title, posterUrl }: {
  id: number; mediaType: 'movie' | 'tv'; title: string; posterUrl: string | null;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const wl = JSON.parse(localStorage.getItem('filmora_watchlist') || '[]') as Array<{ id: number; mediaType: string }>;
      setSaved(wl.some((i) => i.id === id && i.mediaType === mediaType));
    } catch {}
  }, [id, mediaType]);

  const toggle = () => {
    try {
      const wl = JSON.parse(localStorage.getItem('filmora_watchlist') || '[]') as Array<{
        id: number; mediaType: string; title: string; posterUrl: string | null; addedAt: string;
      }>;
      const idx = wl.findIndex((i) => i.id === id && i.mediaType === mediaType);
      if (idx >= 0) {
        const next = wl.filter((_, i) => i !== idx);
        localStorage.setItem('filmora_watchlist', JSON.stringify(next));
        setSaved(false);
        fetch('/api/watchlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdbId: id, mediaType })
        }).catch(() => {});
      } else {
        const next = [...wl, { id, mediaType, title, posterUrl, addedAt: new Date().toISOString() }];
        localStorage.setItem('filmora_watchlist', JSON.stringify(next));
        setSaved(true);
        fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdbId: id, mediaType, title, posterPath: posterUrl })
        }).catch(() => {});
      }
      window.dispatchEvent(new CustomEvent('filmora:watchlist-updated'));
    } catch {}
  };

  return (
    <OriginButton
      onClick={toggle}
      className={`shrink-0 h-[48px] w-[48px] md:h-[55px] md:w-[55px] rounded-full backdrop-blur-2xl text-white ${saved ? 'bg-white/20 border-white/40' : 'bg-black/40 border-white/20'}`}
      style={{ paddingLeft: 0, paddingRight: 0 }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`}
      title={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
    >
      {saved ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      )}
    </OriginButton>
  );
}

import { defineMiddleware } from 'astro:middleware';

const PUBLIC_PAGE = /^(?:\/(?:movies|series|anime|netflix|prime|appletv|search)\/?|\/(?:movie|series)\/\d+\/?)$/;

function isPublicCatalogPage(pathname: string): boolean {
  return pathname === '/' || PUBLIC_PAGE.test(pathname);
}

function detectDevice(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) return 'mobile';
  return 'desktop';
}

function generateRandomId(prefix = 'v'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}${Date.now().toString(36)}`;
}

/**
 * Cache key for a page.
 */
function cacheKeyFor(url: URL, request: Request): Request {
  const key = new URL(url.href);
  key.searchParams.set('__b', __BUILD_ID__);
  return new Request(key.toString(), { method: 'GET', headers: request.headers });
}

/** Check if we're running on Cloudflare (has edge cache + cfContext). */
function isCloudflare(): boolean {
  return typeof caches !== 'undefined' && import.meta.env.DEPLOY_TARGET !== 'vercel';
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url, locals, cookies } = context;
  const isGet = request.method === 'GET' || request.method === 'HEAD';
  const isApi = url.pathname.startsWith('/api/');
  const isStaticAsset = url.pathname.startsWith('/_astro/') || url.pathname.includes('.');

  // ── 1. Attach/Refresh fully structured cookies on each page refresh ─────────
  if (isGet && !isStaticAsset && !isApi) {
    const now = new Date().toISOString();
    const ua = request.headers.get('user-agent') || '';
    const device = detectDevice(ua);

    // Read or initialize visitor cookie data
    let existingVisitor: any = null;
    try {
      const raw = cookies.get('filmora_visitor')?.value;
      if (raw) existingVisitor = JSON.parse(decodeURIComponent(raw));
    } catch {}

    const visitorId = existingVisitor?.visitorId || generateRandomId('v');
    const visits = (typeof existingVisitor?.visits === 'number' ? existingVisitor.visits : 0) + 1;
    const firstVisit = existingVisitor?.firstVisit || now;

    const visitorData = {
      visitorId,
      visits,
      lastVisit: now,
      firstVisit,
      pageViews: (existingVisitor?.pageViews || 0) + 1,
      device,
      preferredGenre: existingVisitor?.preferredGenre || 'Action',
      recSeed: Date.now().toString(36),
    };

    locals.visitor = visitorData;

    // Fully attached cookie data suite
    const consentData = {
      essential: true,
      preferences: true,
      analytics: true,
      consentedAt: now,
      version: '2.0',
    };

    const prefsData = {
      theme: 'dark',
      quality: '1080p',
      autoplay: true,
      audio: 'original',
      subtitles: 'en',
      server: 'auto',
      lastSync: now,
    };

    const recData = {
      affinity: ['Action', 'Sci-Fi', 'Drama', 'Thriller', 'Adventure'],
      affinityScore: 0.98,
      trendingBoost: true,
      recAlgorithm: 'smart-v2',
      seed: visitorData.recSeed,
      refreshedAt: now,
    };

    const cookieOpts = {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,            // accessible to client JS and server SSR
      sameSite: 'lax' as const,
    };

    // Attach all cookies to the response
    cookies.set('filmora_visitor', encodeURIComponent(JSON.stringify(visitorData)), cookieOpts);
    cookies.set('filmora_consent', encodeURIComponent(JSON.stringify(consentData)), cookieOpts);
    cookies.set('filmora_prefs', encodeURIComponent(JSON.stringify(prefsData)), cookieOpts);
    cookies.set('filmora_rec', encodeURIComponent(JSON.stringify(recData)), cookieOpts);
    cookies.set('filmora_human', '1', { ...cookieOpts, maxAge: 60 * 60 * 24 }); // 24h
  }

  // ── 2. Edge caching for public catalog pages ────────────────────────────────
  const isAuthenticated = (request.headers.get('cookie') ?? '').includes('filmora_session=');

  if (!isGet || isAuthenticated || !isPublicCatalogPage(url.pathname)) {
    return next();
  }

  if (import.meta.env.DEV) {
    return next();
  }

  const useEdgeCache = isCloudflare();
  type EdgeCacheStorage = CacheStorage & { default: Cache };
  const edgeCache = useEdgeCache
    ? (caches as EdgeCacheStorage).default
    : null;

  const cacheKey = cacheKeyFor(url, request);

  if (edgeCache) {
    const cached = await edgeCache.match(cacheKey);
    if (cached) return cached;
  }

  const rendered = await next();
  const contentType = rendered.headers.get('content-type') ?? '';
  if (!rendered.ok || !contentType.includes('text/html')) return rendered;

  const headers = new Headers(rendered.headers);
  headers.set('Cache-Control', 'public, max-age=30, s-maxage=300, stale-while-revalidate=86400');
  headers.set('Vary', 'Accept-Encoding');
  const response = new Response(rendered.body, {
    status: rendered.status,
    statusText: rendered.statusText,
    headers,
  });

  if (edgeCache && request.method === 'GET' && locals.cfContext) {
    const cacheWrite = edgeCache.put(cacheKey, response.clone());
    locals.cfContext.waitUntil(cacheWrite);
  }

  return response;
});


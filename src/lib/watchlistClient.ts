// src/lib/watchlistClient.ts — Unified Client & Server Watchlist Synchronizer

export interface WatchlistItem {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  posterUrl?: string | null;
  addedAt?: string;
}

const STORAGE_KEY = 'filmora_watchlist';

export function getLocalWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function isItemInWatchlist(id: number, mediaType: 'movie' | 'tv'): boolean {
  const list = getLocalWatchlist();
  return list.some((item) => Number(item.id) === Number(id) && item.mediaType === mediaType);
}

export async function toggleWatchlist(item: {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  posterUrl?: string | null;
}): Promise<{ isSaved: boolean; list: WatchlistItem[] }> {
  if (typeof window === 'undefined') return { isSaved: false, list: [] };

  const current = getLocalWatchlist();
  const exists = current.some(
    (w) => Number(w.id) === Number(item.id) && w.mediaType === item.mediaType
  );

  let next: WatchlistItem[];

  if (exists) {
    next = current.filter(
      (w) => !(Number(w.id) === Number(item.id) && w.mediaType === item.mediaType)
    );
    // Send background delete to server
    fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId: item.id, mediaType: item.mediaType }),
    }).catch(() => {});
  } else {
    const entry: WatchlistItem = {
      id: Number(item.id),
      mediaType: item.mediaType,
      title: item.title,
      posterPath: item.posterPath || item.posterUrl || null,
      addedAt: new Date().toISOString(),
    };
    next = [entry, ...current];
    // Send background add to server
    fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdbId: item.id,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath || item.posterUrl || null,
      }),
    }).catch(() => {});
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}

  window.dispatchEvent(new CustomEvent('filmora:watchlist-updated', { detail: { next, item } }));
  return { isSaved: !exists, list: next };
}

/**
 * Initial sync on page load: fetches user's cloud watchlist from DB and merges with local storage.
 */
export async function syncWatchlist(): Promise<WatchlistItem[]> {
  if (typeof window === 'undefined') return [];
  const localList = getLocalWatchlist();

  try {
    const res = await fetch('/api/watchlist');
    if (!res.ok) return localList;
    const data = await res.json();

    if (data.items && Array.isArray(data.items)) {
      const serverItems: WatchlistItem[] = data.items.map((item: any) => ({
        id: Number(item.tmdb_id),
        mediaType: item.media_type,
        title: item.title,
        posterPath: item.poster_path,
        posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
        addedAt: item.added_at,
      }));

      // Merge unique items
      const mergedMap = new Map<string, WatchlistItem>();
      serverItems.forEach((i) => mergedMap.set(`${i.mediaType}_${i.id}`, i));
      localList.forEach((i) => mergedMap.set(`${i.mediaType}_${i.id}`, i));

      const merged = Array.from(mergedMap.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

      // Push any local-only items up to server DB
      if (localList.length > serverItems.length) {
        fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syncItems: merged }),
        }).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('filmora:watchlist-updated'));
      return merged;
    }
  } catch {}

  return localList;
}

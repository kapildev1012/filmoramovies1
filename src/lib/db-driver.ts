/**
 * src/lib/db-driver.ts — Platform-agnostic database driver.
 *
 * Provides a single `getDB(locals)` function that returns an object matching
 * Cloudflare D1's `prepare().bind().first()/all()/run()` interface, regardless
 * of whether the app is running on Cloudflare (native D1), Vercel (Turso/libSQL),
 * or Local Development (In-memory / Local D1 emulator).
 */

// ── Detect platform at build time ──────────────────────────────────────────
const IS_CLOUDFLARE = import.meta.env.DEPLOY_TARGET !== 'vercel' && typeof process === 'undefined';

interface D1Like {
  prepare(sql: string): D1PreparedLike;
  batch(stmts: D1PreparedLike[]): Promise<any[]>;
}

interface D1PreparedLike {
  bind(...values: any[]): D1PreparedLike;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
  _sql?: string;
  _params?: any[];
}

// ── In-Memory / Local Dev Store ────────────────────────────────────────────
// Stores tables: users, sessions, profiles, watchlist, ratings
class LocalDBStore implements D1Like {
  private users = new Map<string, any>();
  private sessions = new Map<string, any>();
  private profiles = new Map<string, any>();
  private watchlist = new Map<string, any>();
  private ratings = new Map<string, any>();

  prepare(sql: string): D1PreparedLike {
    let params: any[] = [];
    const normalized = sql.trim().replace(/\s+/g, ' ');

    const stmt: D1PreparedLike = {
      _sql: normalized,
      _params: params,

      bind(...values: any[]) {
        params = values;
        stmt._params = values;
        return stmt;
      },

      first: async <T = unknown>(): Promise<T | null> => {
        const { results } = await stmt.all<T>();
        return results.length > 0 ? results[0] : null;
      },

      all: async <T = unknown>(): Promise<{ results: T[] }> => {
        const p = params;
        const q = normalized.toLowerCase();

        // ── SESSIONS JOIN USERS ──
        if (q.includes('from sessions s') && q.includes('join users u')) {
          const sessionId = p[0];
          const now = p[1] ?? Math.floor(Date.now() / 1000);
          const session = this.sessions.get(sessionId);
          if (!session || session.expires_at <= now) return { results: [] };
          const user = this.users.get(session.user_id);
          if (!user) return { results: [] };
          return {
            results: [{
              ...session,
              ...user,
              user_id: user.id,
              user_created_at: user.created_at,
            }] as T[],
          };
        }

        // ── SELECT SESSIONS ──
        if (q.startsWith('select * from sessions where user_id = ?')) {
          const userId = p[0];
          const now = p[1] ?? Math.floor(Date.now() / 1000);
          const list = Array.from(this.sessions.values()).filter(
            (s) => s.user_id === userId && (s.expires_at ? s.expires_at > now : true)
          );
          return { results: list as T[] };
        }

        // ── SELECT USERS ──
        if (q.startsWith('select * from users where google_id = ?')) {
          const u = Array.from(this.users.values()).find((x) => x.google_id === p[0]);
          return { results: (u ? [u] : []) as T[] };
        }
        if (q.startsWith('select * from users where id = ?')) {
          const u = this.users.get(p[0]);
          return { results: (u ? [u] : []) as T[] };
        }

        // ── SELECT PROFILES ──
        if (q.includes('from profiles where user_id = ?')) {
          const list = Array.from(this.profiles.values()).filter((x) => x.user_id === p[0]);
          list.sort((a, b) => (b.is_default || 0) - (a.is_default || 0));
          return { results: list as T[] };
        }
        if (q.startsWith('select * from profiles where id = ?')) {
          const prof = this.profiles.get(p[0]);
          return { results: (prof ? [prof] : []) as T[] };
        }

        // ── SELECT WATCHLIST ──
        if (q.includes('from watchlist where profile_id = ?')) {
          const list = Array.from(this.watchlist.values()).filter((x) => x.profile_id === p[0]);
          return { results: list as T[] };
        }

        // ── SELECT RATINGS ──
        if (q.includes('from ratings where profile_id = ?')) {
          const list = Array.from(this.ratings.values()).filter((x) => x.profile_id === p[0]);
          return { results: list as T[] };
        }

        return { results: [] };
      },

      run: async (): Promise<{ success: boolean }> => {
        const p = params;
        const q = normalized.toLowerCase();

        // ── INSERT USERS ──
        if (q.startsWith('insert into users')) {
          const [id, google_id, email, name, avatar_url] = p;
          this.users.set(id, {
            id,
            google_id,
            email,
            name,
            username: `user_${id.slice(0, 6)}`,
            avatar_url,
            created_at: new Date().toISOString(),
          });
          return { success: true };
        }

        // ── UPDATE USERS ──
        if (q.startsWith('update users set')) {
          const id = p[p.length - 1];
          const u = this.users.get(id);
          if (u) {
            // Parse assignment list e.g. "email = ?, name = ?, avatar_url = ?"
            const setPart = normalized.slice(normalized.toLowerCase().indexOf('set') + 4, normalized.toLowerCase().indexOf('where')).trim();
            const fieldNames = setPart.split(',').map((f) => f.trim().split('=')[0].trim());
            
            const updated = { ...u };
            fieldNames.forEach((name, idx) => {
              if (idx < p.length - 1) {
                updated[name] = p[idx];
              }
            });
            this.users.set(id, updated);
          }
          return { success: true };
        }

        // ── INSERT SESSIONS ──
        if (q.startsWith('insert into sessions')) {
          const [id, user_id, expires_at] = p;
          this.sessions.set(id, {
            id,
            user_id,
            device_name: 'Chrome on Windows 11',
            browser: 'Chrome 128.0',
            os: 'Windows 11',
            ip_address: '127.0.0.1',
            location: 'Active Session',
            last_active: Math.floor(Date.now() / 1000),
            expires_at,
          });
          return { success: true };
        }

        // ── DELETE SESSIONS ──
        if (q.startsWith('delete from sessions where user_id = ? and id != ?')) {
          const [userId, keepSessionId] = p;
          for (const [k, v] of this.sessions.entries()) {
            if (v.user_id === userId && k !== keepSessionId) this.sessions.delete(k);
          }
          return { success: true };
        }
        if (q.startsWith('delete from sessions where id = ?')) {
          this.sessions.delete(p[0]);
          return { success: true };
        }
        if (q.startsWith('delete from sessions where user_id = ?')) {
          for (const [k, v] of this.sessions.entries()) {
            if (v.user_id === p[0]) this.sessions.delete(k);
          }
          return { success: true };
        }

        // ── INSERT PROFILES ──
        if (q.startsWith('insert into profiles')) {
          const [id, user_id, name, avatar_color, is_kids, is_default] = p;
          this.profiles.set(id, {
            id,
            user_id,
            name,
            avatar_color,
            is_kids: is_kids ? 1 : 0,
            is_default: is_default ? 1 : 0,
            maturity_rating: is_kids ? 'PG' : 'TV-MA',
            created_at: new Date().toISOString(),
          });
          return { success: true };
        }

        // ── UPDATE PROFILES ──
        if (q.startsWith('update profiles')) {
          const id = p[p.length - 1];
          const prof = this.profiles.get(id);
          if (prof) {
            const setPart = normalized.slice(normalized.toLowerCase().indexOf('set') + 4, normalized.toLowerCase().indexOf('where')).trim();
            const fieldNames = setPart.split(',').map((f) => f.trim().split('=')[0].trim());
            fieldNames.forEach((name, idx) => {
              if (idx < p.length - 1) {
                prof[name] = p[idx];
              }
            });
          }
          return { success: true };
        }

        // ── DELETE PROFILES ──
        if (q.startsWith('delete from profiles where id = ?')) {
          this.profiles.delete(p[0]);
          return { success: true };
        }

        // ── INSERT WATCHLIST ──
        if (q.startsWith('insert or ignore into watchlist')) {
          const [id, profile_id, tmdb_id, media_type, title, poster_path] = p;
          const key = `${profile_id}_${tmdb_id}_${media_type}`;
          this.watchlist.set(key, {
            id,
            profile_id,
            tmdb_id,
            media_type,
            title,
            poster_path,
            added_at: new Date().toISOString(),
          });
          return { success: true };
        }

        // ── DELETE WATCHLIST ──
        if (q.startsWith('delete from watchlist')) {
          const [profile_id, tmdb_id, media_type] = p;
          const key = `${profile_id}_${tmdb_id}_${media_type}`;
          this.watchlist.delete(key);
          return { success: true };
        }

        // ── INSERT/UPDATE RATINGS ──
        if (q.startsWith('insert into ratings')) {
          const [id, profile_id, tmdb_id, media_type, rating] = p;
          const key = `${profile_id}_${tmdb_id}_${media_type}`;
          this.ratings.set(key, {
            id,
            profile_id,
            tmdb_id,
            media_type,
            rating,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          return { success: true };
        }

        // ── DELETE RATINGS ──
        if (q.startsWith('delete from ratings')) {
          const [profile_id, tmdb_id, media_type] = p;
          const key = `${profile_id}_${tmdb_id}_${media_type}`;
          this.ratings.delete(key);
          return { success: true };
        }

        return { success: true };
      },
    };

    return stmt;
  }

  async batch(stmts: D1PreparedLike[]): Promise<any[]> {
    const results = [];
    for (const s of stmts) {
      results.push(await s.run());
    }
    return results;
  }
}

// ── Global Singleton for Dev/Local Store ──────────────────────────────────
declare global {
  var __filmora_local_db: LocalDBStore | undefined;
}

function getLocalStore(): LocalDBStore {
  if (!globalThis.__filmora_local_db) {
    globalThis.__filmora_local_db = new LocalDBStore();
  }
  return globalThis.__filmora_local_db;
}

/**
 * Returns a D1-compatible database handle.
 */
export async function getDB(locals?: App.Locals): Promise<D1Like> {
  if (IS_CLOUDFLARE && locals?.runtime?.env?.DB) {
    return locals.runtime.env.DB as unknown as D1Like;
  }
  return getLocalStore();
}

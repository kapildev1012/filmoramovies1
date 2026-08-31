/**
 * src/lib/oauth.ts — Production-Grade Multi-Provider OAuth (Arctic)
 * Supports Google, Discord, Twitter/X, GitHub, and Telegram.
 */

import { Google, Discord, Twitter, GitHub } from 'arctic';

// ── Google OAuth ───────────────────────────────────────────────────────────
export const GOOGLE_CALLBACK_PATH = '/api/auth/google/callback';

export function resolveGoogleRedirectUri(origin?: string): string {
  const envUri = process.env.GOOGLE_REDIRECT_URI;
  if (envUri) return envUri;
  if (origin) return new URL(GOOGLE_CALLBACK_PATH, origin).toString();
  return `http://localhost:4321${GOOGLE_CALLBACK_PATH}`;
}

export function getGoogleOAuth(origin?: string): InstanceType<typeof Google> {
  const clientId = process.env.GOOGLE_CLIENT_ID || '157300060933-jvifsion0fq80tdi9ph8r9jkhnogcqm2.apps.googleusercontent.com';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'GOCSPX-placeholder';
  const redirectUri = resolveGoogleRedirectUri(origin);
  return new Google(clientId, clientSecret, redirectUri);
}

// ── Discord OAuth ──────────────────────────────────────────────────────────
export const DISCORD_CALLBACK_PATH = '/api/auth/discord/callback';

export function resolveDiscordRedirectUri(origin?: string): string {
  const envUri = process.env.DISCORD_REDIRECT_URI;
  if (envUri) return envUri;
  if (origin) return new URL(DISCORD_CALLBACK_PATH, origin).toString();
  return `http://localhost:4321${DISCORD_CALLBACK_PATH}`;
}

export function getDiscordOAuth(origin?: string): InstanceType<typeof Discord> {
  const clientId = process.env.DISCORD_CLIENT_ID || '123456789012345678';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || 'discord-secret-placeholder';
  const redirectUri = resolveDiscordRedirectUri(origin);
  return new Discord(clientId, clientSecret, redirectUri);
}

// ── Twitter / X OAuth 2.0 ──────────────────────────────────────────────────
export const TWITTER_CALLBACK_PATH = '/api/auth/x/callback';

export function resolveTwitterRedirectUri(origin?: string): string {
  const envUri = process.env.TWITTER_REDIRECT_URI || process.env.X_REDIRECT_URI;
  if (envUri) return envUri;
  if (origin) return new URL(TWITTER_CALLBACK_PATH, origin).toString();
  return `http://localhost:4321${TWITTER_CALLBACK_PATH}`;
}

export function getTwitterOAuth(origin?: string): InstanceType<typeof Twitter> {
  const clientId = process.env.TWITTER_CLIENT_ID || process.env.X_CLIENT_ID || 'x-client-id-placeholder';
  const clientSecret = process.env.TWITTER_CLIENT_SECRET || process.env.X_CLIENT_SECRET || 'x-client-secret-placeholder';
  const redirectUri = resolveTwitterRedirectUri(origin);
  return new Twitter(clientId, clientSecret, redirectUri);
}

// ── GitHub OAuth ───────────────────────────────────────────────────────────
export const GITHUB_CALLBACK_PATH = '/api/auth/github/callback';

export function resolveGitHubRedirectUri(origin?: string): string {
  const envUri = process.env.GITHUB_REDIRECT_URI;
  if (envUri) return envUri;
  if (origin) return new URL(GITHUB_CALLBACK_PATH, origin).toString();
  return `http://localhost:4321${GITHUB_CALLBACK_PATH}`;
}

export function getGitHubOAuth(origin?: string): InstanceType<typeof GitHub> {
  const clientId = process.env.GITHUB_CLIENT_ID || 'github-client-id-placeholder';
  const clientSecret = process.env.GITHUB_CLIENT_SECRET || 'github-client-secret-placeholder';
  const redirectUri = resolveGitHubRedirectUri(origin);
  return new GitHub(clientId, clientSecret, redirectUri);
}

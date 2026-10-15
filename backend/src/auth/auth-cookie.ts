import type { CookieOptions } from 'express';

export const AUTH_COOKIE = 'access_token';
/** Lifetime of both the JWT and its cookie. */
export const AUTH_TTL_SECONDS = 24 * 60 * 60;

export function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_TTL_SECONDS * 1000,
  };
}

/** The auth token from a raw `Cookie` header, if present. */
export function tokenFromCookieHeader(header: string | undefined): string | undefined {
  for (const part of header?.split(';') ?? []) {
    const [name, ...value] = part.trim().split('=');
    if (name === AUTH_COOKIE) return decodeURIComponent(value.join('='));
  }
  return undefined;
}

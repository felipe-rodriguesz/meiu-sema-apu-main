import type { CookieOptions, Request } from 'express';

export function sessionCookieName(production: boolean): string {
  return production ? '__Host-sema_session' : 'sema_session';
}

export function sessionCookieOptions(production: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: production,
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  };
}

export function sessionToken(request: Request, production: boolean): string | null {
  const name = sessionCookieName(production) + '=';
  const part = request.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(name));
  return part?.slice(name.length) || null;
}

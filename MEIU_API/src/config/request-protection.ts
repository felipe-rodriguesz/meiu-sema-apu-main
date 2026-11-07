import type { Request, Response, NextFunction } from 'express';
import { sessionCookieName } from '../modules/auth/session-cookie';

type Counter = { count: number; expires: number };
const period = 15 * 60 * 1000;
const maxCounters = 20000;

export function requestProtection(origins: string[], production: boolean) {
  const counters = new Map<string, Counter>();

  function allow(key: string, limit: number, now: number): { allowed: boolean; remaining: number; retry: number } {
    if (counters.size >= maxCounters) {
      for (const [name, entry] of counters) if (entry.expires <= now) counters.delete(name);
    }
    const entry = counters.get(key);
    if (!entry || entry.expires <= now) {
      if (counters.size >= maxCounters) return { allowed: false, remaining: 0, retry: 60 };
      counters.set(key, { count: 1, expires: now + period });
      return { allowed: true, remaining: limit - 1, retry: 0 };
    }
    if (entry.count >= limit) return { allowed: false, remaining: 0, retry: Math.ceil((entry.expires - now) / 1000) };
    entry.count++;
    return { allowed: true, remaining: limit - entry.count, retry: 0 };
  }

  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    // Express accepts case-insensitive routes and an optional trailing slash.
    // Apply the same limit to every spelling of these endpoints.
    const path = req.path.toLowerCase().replace(/\/+$/, '');
    const isLogin = req.method === 'POST' && path === '/api/v1/auth/login';
    const isPublicRegistration = req.method === 'POST' && path === '/api/v1/descartes';
    const origin = req.headers.origin;
    const hasSession = req.headers.cookie?.split(';').some(part => part.trim().startsWith(sessionCookieName(production) + '='));

    // Cookies are sent automatically; reject cross-origin writes even from same-site subdomains.
    if ((hasSession && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) || (isLogin && origin)) {
      if (!origin || !origins.includes(origin)) return res.status(403).json({ message: 'Origem da requisição não autorizada.' });
    }

    if (isLogin || isPublicRegistration) {
      const now = Date.now();
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const checks: [string, number][] = isLogin
        ? [['login:ip:' + ip, 15]]
        : [['registro:ip:' + ip, 30]];
      for (const [key, limit] of checks) {
        const result = allow(key, limit, now);
        if (!result.allowed) {
          res.setHeader('Retry-After', String(result.retry));
          return res.status(429).json({ message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
        }
      }
    }
    next();
  };
}

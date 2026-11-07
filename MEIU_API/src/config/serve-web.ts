import { existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

// Optional single-service deployment: API, public form and admin share one origin.
export function serveWeb(app: NestExpressApplication, directory?: string) {
  if (!directory) return;
  const root = resolve(directory);
  for (const file of ['index.html', 'admin/index.html']) {
    if (!existsSync(resolve(root, file))) throw new Error('Compilação web ausente: ' + file);
  }
  const policy = helmet.contentSecurityPolicy({ directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
    connectSrc: ["'self'", 'https://nominatim.openstreetmap.org'],
    fontSrc: ["'self'", 'data:'], objectSrc: ["'none'"], baseUri: ["'self'"],
    formAction: ["'self'"], frameAncestors: ["'none'"],
  }});
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (/^\/api(?:\/|$)/i.test(req.path)) return next();
    if (req.path.split('/').some(part => part.startsWith('.'))) return res.sendStatus(404);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    policy(req, res, next);
  });
  app.useStaticAssets(root, { dotfiles: 'deny', index: false, fallthrough: true });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!['GET', 'HEAD'].includes(req.method) || /^\/api(?:\/|$)/i.test(req.path)) return next();
    if (extname(req.path)) return res.sendStatus(404);
    if (req.path === '/admin') return res.redirect(301, '/admin/');
    const entry = /^\/admin\//.test(req.path) ? 'admin/index.html' : 'index.html';
    res.sendFile(resolve(root, entry));
  });
}

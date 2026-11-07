import { readFileSync } from 'node:fs';

export function databaseOptions(env: Record<string, any>) {
  if (!env.DATABASE_URL) throw new Error('Configure DATABASE_URL.');
  const url = new URL(env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL deve apontar para PostgreSQL.');
  const ssl = env.DATABASE_SSL ?? (env.NODE_ENV === 'production' ? 'true' : 'false');
  if (!['true', 'false'].includes(ssl)) throw new Error('DATABASE_SSL deve ser true ou false.');
  // Centraliza TLS; parâmetros da URL não podem desabilitar a validação do certificado.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
  return {
    type: 'postgres' as const,
    url: url.toString(),
    ssl: ssl === 'true' ? {
      rejectUnauthorized: true,
      ...(env.DATABASE_CA_FILE ? { ca: readFileSync(env.DATABASE_CA_FILE, 'utf8') } : {}),
    } : false as const,
    synchronize: false,
    extra: { max: 10 },
  };
}

export function validateEnvironment(env: Record<string, any>) {
  databaseOptions(env);
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || /minha_chave|troque|change.me/i.test(env.JWT_SECRET)) {
    throw new Error('Configure JWT_SECRET com um segredo aleatório de pelo menos 32 caracteres.');
  }
  const origins = String(env.CORS_ORIGINS || env.RENDER_EXTERNAL_URL || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!origins.length || origins.some(origin => {
    try { return new URL(origin).origin !== origin || !/^https?:\/\//.test(origin); } catch { return true; }
  })) throw new Error('CORS_ORIGINS deve conter origens HTTP(S) completas, separadas por vírgula e sem barra final.');
  const port = Number(env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida.');
  const proxyHops = Number(env.TRUST_PROXY_HOPS || 0);
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 2) throw new Error('TRUST_PROXY_HOPS deve ser 0, 1 ou 2.');
  return { ...env, PORT: port, TRUST_PROXY_HOPS: proxyHops, CORS_ORIGINS: origins.join(',') };
}

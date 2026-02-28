function intEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

export const config = {
  port: intEnv('PORT', 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  maxItems: intEnv('MAX_ITEMS', 50),
  maxNameLength: intEnv('MAX_NAME_LENGTH', 200),
  colesSessionTtlMs: intEnv('COLES_SESSION_TTL_MS', 300_000),
  resultCacheTtlMs: intEnv('RESULT_CACHE_TTL_MS', 30_000),
  maxConcurrentPerStore: intEnv('MAX_CONCURRENT_PER_STORE', 2),
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  aldiOrigin: 'https://www.aldi.com.au',
  aldiReferer: 'https://www.aldi.com.au/',
} as const;

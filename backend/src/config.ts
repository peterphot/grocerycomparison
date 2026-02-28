export const config = {
  port: Number(process.env.PORT ?? 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 10_000),
  colesSessionTtlMs: Number(process.env.COLES_SESSION_TTL_MS ?? 300_000),
  resultCacheTtlMs: Number(process.env.RESULT_CACHE_TTL_MS ?? 30_000),
  maxConcurrentPerStore: Number(process.env.MAX_CONCURRENT_PER_STORE ?? 2),
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  aldiOrigin: 'https://www.aldi.com.au',
  aldiReferer: 'https://www.aldi.com.au/',
} as const;

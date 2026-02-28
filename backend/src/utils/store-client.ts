import type { StoreName } from '@grocery/shared';
import { StoreApiError } from '@grocery/shared';
import { httpGet, type HttpClientOptions } from './http-client.js';
import { RateLimiter } from './rate-limiter.js';

const ALLOWED_HOSTS: Record<StoreName, readonly string[]> = {
  woolworths: ['woolworths.com.au'],
  coles: ['coles.com.au'],
  aldi: ['api.aldi.com.au'],
  harrisfarm: ['harrisfarm.com.au'],
};

/** Shared rate limiter instance — all store adapters must use this to enforce per-store concurrency. */
export const sharedRateLimiter = new RateLimiter(2);

function validateUrl(url: string, store: StoreName): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new StoreApiError(`Invalid URL`, store, undefined, false);
  }
  if (parsed.protocol !== 'https:') {
    throw new StoreApiError(`Disallowed protocol: ${parsed.protocol}`, store, undefined, false);
  }
  const allowed = ALLOWED_HOSTS[store];
  const hostnameMatch = allowed.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
  );
  if (!hostnameMatch) {
    throw new StoreApiError(`Disallowed host: ${parsed.hostname}`, store, undefined, false);
  }
}

export interface StoreClient {
  get: <T = unknown>(url: string, opts?: Omit<HttpClientOptions, 'store'>) => Promise<T>;
}

export function createStoreClient(store: StoreName, rateLimiter?: RateLimiter): StoreClient {
  const limiter = rateLimiter ?? sharedRateLimiter;
  return {
    get: async <T = unknown>(url: string, opts?: Omit<HttpClientOptions, 'store'>): Promise<T> => {
      validateUrl(url, store);
      return limiter.execute(store, () => httpGet<T>(url, { ...opts, store }));
    },
  };
}

import { StoreApiError } from '@grocery/shared';
import type { StoreName } from '@grocery/shared';

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

const DEFAULT_TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 500;
const MAX_RETRIES = 1;

export interface HttpClientOptions {
  headers?: Record<string, string>;
  store: StoreName;
  timeoutMs?: number;
}

export async function httpGet<T = unknown>(url: string, options: HttpClientOptions): Promise<T> {
  return fetchWithRetry<T>(url, options, MAX_RETRIES);
}

async function fetchWithRetry<T>(
  url: string,
  options: HttpClientOptions,
  retries: number,
): Promise<T> {
  const mergedHeaders = { ...DEFAULT_HEADERS, ...options.headers };
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: mergedHeaders,
      signal: controller.signal,
    });

    if (!res.ok) {
      const isRetryable = res.status >= 500;
      if (isRetryable && retries > 0) {
        await delay(RETRY_DELAY_MS);
        return fetchWithRetry<T>(url, options, retries - 1);
      }
      throw new StoreApiError(`HTTP ${res.status}`, options.store, res.status, isRetryable);
    }

    try {
      return (await res.json()) as T;
    } catch {
      throw new StoreApiError('Invalid JSON response', options.store, res.status, false);
    }
  } catch (err) {
    if (err instanceof StoreApiError) throw err;
    if (retries > 0) {
      await delay(RETRY_DELAY_MS);
      return fetchWithRetry<T>(url, options, retries - 1);
    }
    throw new StoreApiError(
      err instanceof Error && err.name === 'AbortError'
        ? 'Request timed out'
        : 'Network error',
      options.store,
      undefined,
      true,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

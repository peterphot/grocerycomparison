import { StoreApiError } from '@grocery/shared';
import type { StoreName } from '@grocery/shared';

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

const DEFAULT_TIMEOUT_MS = 10_000;

interface HttpClientOptions {
  headers?: Record<string, string>;
  store: StoreName;
  timeoutMs?: number;
}

export async function httpGet(url: string, options: HttpClientOptions): Promise<any> {
  return fetchWithRetry(url, options, 1);
}

async function fetchWithRetry(
  url: string,
  options: HttpClientOptions,
  retries: number,
): Promise<any> {
  const mergedHeaders = { ...DEFAULT_HEADERS, ...options.headers };
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      headers: mergedHeaders,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const isRetryable = res.status >= 500;
      if (isRetryable && retries > 0) {
        await delay(500);
        return fetchWithRetry(url, options, retries - 1);
      }
      throw new StoreApiError(`HTTP ${res.status}`, options.store, res.status, isRetryable);
    }

    return res.json();
  } catch (err) {
    if (err instanceof StoreApiError) throw err;
    if (retries > 0) {
      await delay(500);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw new StoreApiError(
      err instanceof Error ? err.message : 'Network error',
      options.store,
      undefined,
      true,
    );
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

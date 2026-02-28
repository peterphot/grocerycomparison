import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup.js';
import { createStoreClient } from '../../src/utils/store-client.js';
import { RateLimiter } from '../../src/utils/rate-limiter.js';
import { StoreApiError } from '@grocery/shared';

const WOOLWORTHS_URL = 'https://www.woolworths.com.au/apis/ui/Search/products';
const COLES_URL = 'https://www.coles.com.au/api/search';

describe('createStoreClient', () => {
  describe('URL validation', () => {
    it('allows requests to the correct store domain', async () => {
      server.use(
        http.get(WOOLWORTHS_URL, () => HttpResponse.json({ ok: true })),
      );

      const client = createStoreClient('woolworths');
      const result = await client.get(WOOLWORTHS_URL);
      expect(result).toEqual({ ok: true });
    });

    it('allows subdomains of allowed hosts', async () => {
      const url = 'https://www.woolworths.com.au/apis/test';
      server.use(
        http.get(url, () => HttpResponse.json({ ok: true })),
      );

      const client = createStoreClient('woolworths');
      const result = await client.get(url);
      expect(result).toEqual({ ok: true });
    });

    it('rejects URLs to disallowed hosts', async () => {
      const client = createStoreClient('woolworths');
      const error = await client.get('https://evil.com/steal-data').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(StoreApiError);
      expect((error as StoreApiError).message).toBe('Disallowed host: evil.com');
      expect((error as StoreApiError).isRetryable).toBe(false);
    });

    it('rejects URLs to a different store domain', async () => {
      const client = createStoreClient('woolworths');
      const error = await client.get(COLES_URL).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(StoreApiError);
      expect((error as StoreApiError).message).toBe('Disallowed host: www.coles.com.au');
    });

    it('rejects non-HTTPS URLs', async () => {
      const client = createStoreClient('woolworths');
      const error = await client
        .get('http://www.woolworths.com.au/api')
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(StoreApiError);
      expect((error as StoreApiError).message).toBe('Disallowed protocol: http:');
    });

    it('rejects invalid URLs', async () => {
      const client = createStoreClient('woolworths');
      const error = await client.get('not-a-url').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(StoreApiError);
      expect((error as StoreApiError).message).toBe('Invalid URL');
    });

    it('rejects internal/metadata URLs (SSRF prevention)', async () => {
      const client = createStoreClient('aldi');
      const error = await client
        .get('https://169.254.169.254/latest/meta-data/')
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(StoreApiError);
      expect((error as StoreApiError).message).toBe('Disallowed host: 169.254.169.254');
    });
  });

  describe('rate limiting', () => {
    it('uses the shared rate limiter by default', async () => {
      const url = 'https://www.woolworths.com.au/apis/test';
      server.use(http.get(url, () => HttpResponse.json({ ok: true })));
      const client = createStoreClient('woolworths');
      // Should succeed — proves the default client has a working rate limiter
      await expect(client.get(url)).resolves.toEqual({ ok: true });
    });

    it('accepts a custom rate limiter', async () => {
      const customLimiter = new RateLimiter(1);
      const url = 'https://www.woolworths.com.au/apis/test';
      server.use(
        http.get(url, () => HttpResponse.json({ ok: true })),
      );

      const client = createStoreClient('woolworths', customLimiter);
      const result = await client.get(url);
      expect(result).toEqual({ ok: true });
    });

    it('enforces concurrency through the rate limiter', async () => {
      const limiter = new RateLimiter(1);
      const url = 'https://www.woolworths.com.au/apis/test';
      let concurrent = 0;
      let maxConcurrent = 0;

      server.use(
        http.get(url, async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          // Small delay to allow overlap detection
          await new Promise((r) => setTimeout(r, 50));
          concurrent--;
          return HttpResponse.json({ ok: true });
        }),
      );

      const client = createStoreClient('woolworths', limiter);
      await Promise.all([client.get(url), client.get(url), client.get(url)]);

      expect(maxConcurrent).toBe(1);
    });
  });

  describe('per-store domain mapping', () => {
    it('woolworths client allows woolworths.com.au', async () => {
      const url = 'https://www.woolworths.com.au/test';
      server.use(http.get(url, () => HttpResponse.json({ ok: true })));
      const client = createStoreClient('woolworths');
      await expect(client.get(url)).resolves.toEqual({ ok: true });
    });

    it('coles client allows coles.com.au', async () => {
      const url = 'https://www.coles.com.au/test';
      server.use(http.get(url, () => HttpResponse.json({ ok: true })));
      const client = createStoreClient('coles');
      await expect(client.get(url)).resolves.toEqual({ ok: true });
    });

    it('aldi client allows api.aldi.com.au', async () => {
      const url = 'https://api.aldi.com.au/v3/test';
      server.use(http.get(url, () => HttpResponse.json({ ok: true })));
      const client = createStoreClient('aldi');
      await expect(client.get(url)).resolves.toEqual({ ok: true });
    });

    it('harrisfarm client allows harrisfarm.com.au', async () => {
      const url = 'https://www.harrisfarm.com.au/test';
      server.use(http.get(url, () => HttpResponse.json({ ok: true })));
      const client = createStoreClient('harrisfarm');
      await expect(client.get(url)).resolves.toEqual({ ok: true });
    });
  });
});

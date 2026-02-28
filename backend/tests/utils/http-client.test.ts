import { describe, it, expect } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../setup.js';
import { httpGet } from '../../src/utils/http-client.js';
import { StoreApiError } from '@grocery/shared';

const TEST_URL = 'http://test.example.com/api/data';

describe('httpGet', () => {
  it('sends Chrome User-Agent header on every request', async () => {
    let capturedHeaders: Headers | undefined;
    server.use(
      http.get(TEST_URL, ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ ok: true });
      }),
    );

    await httpGet(TEST_URL, { store: 'woolworths' });

    expect(capturedHeaders?.get('user-agent')).toContain('Chrome');
  });

  it('merges per-request headers with defaults', async () => {
    let capturedHeaders: Headers | undefined;
    server.use(
      http.get(TEST_URL, ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ ok: true });
      }),
    );

    await httpGet(TEST_URL, {
      store: 'woolworths',
      headers: { 'X-Custom': 'test-value' },
    });

    expect(capturedHeaders?.get('user-agent')).toContain('Chrome');
    expect(capturedHeaders?.get('x-custom')).toBe('test-value');
  });

  it('throws StoreApiError on 404 (not retryable)', async () => {
    server.use(
      http.get(TEST_URL, () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    const error = await httpGet(TEST_URL, { store: 'coles' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(StoreApiError);
    expect((error as StoreApiError).statusCode).toBe(404);
    expect((error as StoreApiError).isRetryable).toBe(false);
  });

  it('throws StoreApiError on 500 (retryable), retries once then succeeds', async () => {
    let callCount = 0;
    server.use(
      http.get(TEST_URL, () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({ success: true });
      }),
    );

    const result = await httpGet(TEST_URL, { store: 'aldi' });
    expect(callCount).toBe(2);
    expect(result).toEqual({ success: true });
  });

  it('does not retry more than once on persistent 5xx', async () => {
    let callCount = 0;
    server.use(
      http.get(TEST_URL, () => {
        callCount++;
        return new HttpResponse(null, { status: 503 });
      }),
    );

    const error = await httpGet(TEST_URL, { store: 'woolworths' }).catch((e: unknown) => e);
    expect(callCount).toBe(2); // original + 1 retry
    expect(error).toBeInstanceOf(StoreApiError);
    expect((error as StoreApiError).isRetryable).toBe(true);
  });

  it('throws on timeout', async () => {
    server.use(
      http.get(TEST_URL, async () => {
        await delay('infinite');
        return HttpResponse.json({ ok: true });
      }),
    );

    const error = await httpGet(TEST_URL, { store: 'harrisfarm', timeoutMs: 100 }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(StoreApiError);
    expect((error as StoreApiError).store).toBe('harrisfarm');
  }, 10_000);
});

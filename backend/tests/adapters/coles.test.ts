import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import fs from 'node:fs';
import path from 'node:path';
import { StoreApiError } from '@grocery/shared';

const milkFixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../fixtures/coles-milk.json'), 'utf-8'),
);

const homepageHtml = fs.readFileSync(
  path.join(__dirname, '../fixtures/coles-homepage.html'),
  'utf-8',
);

import { ColesAdapter } from '../../src/adapters/coles';
import { ColesSessionManager } from '../../src/utils/coles-session';

describe('ColesAdapter', () => {
  let adapter: ColesAdapter;
  let sessionManager: ColesSessionManager;

  beforeEach(() => {
    sessionManager = new ColesSessionManager();

    // Mock homepage for session manager
    server.use(
      http.get('https://www.coles.com.au/', () => {
        return new HttpResponse(homepageHtml, {
          headers: { 'Content-Type': 'text/html' },
        });
      }),
    );

    // Mock search endpoint
    server.use(
      http.get('https://www.coles.com.au/_next/data/:buildId/search/products.json', ({ request }) => {
        const url = new URL(request.url);
        const keyword = url.searchParams.get('keyword');
        if (keyword) {
          return HttpResponse.json(milkFixture);
        }
        return HttpResponse.json({ pageProps: { searchResults: { results: [] } } });
      }),
    );

    adapter = new ColesAdapter(sessionManager);
  });

  it('returns ProductMatch[] from valid SSR response', async () => {
    const results = await adapter.searchProduct('milk');
    // 4 items in fixture: 2 available PRODUCT, 1 PROMOTION (filtered), 1 unavailable PRODUCT (filtered)
    expect(results).toHaveLength(2);
    expect(results[0].store).toBe('coles');
    expect(results[0].productName).toBe('Full Cream Milk');
    expect(results[0].price).toBe(4.65);
  });

  it('filters out non-PRODUCT types', async () => {
    const results = await adapter.searchProduct('milk');
    const names = results.map((r) => r.productName);
    expect(names).not.toContain('Half Price Milk Special');
  });

  it('maps pricing.unit fields to unitPrice/unitMeasure', async () => {
    const results = await adapter.searchProduct('milk');
    const fullCream = results.find((r) => r.productName === 'Full Cream Milk')!;
    expect(fullCream.unitPrice).toBe(1.55);
    expect(fullCream.unitMeasure).toBe('L');
  });

  it('normalises unitMeasure casing ("l" to "L")', async () => {
    const results = await adapter.searchProduct('milk');
    for (const product of results) {
      if (product.unitMeasure) {
        // Should not contain lowercase "l" as a unit — should be "L"
        expect(product.unitMeasure).not.toBe('l');
      }
    }
  });

  it('computes unitPriceNormalised', async () => {
    const results = await adapter.searchProduct('milk');
    const fullCream = results.find((r) => r.productName === 'Full Cream Milk')!;
    // size "3L" → parsePackageSize → {qty: 3000, unit: 'ml'}
    // computeNormalisedUnitPrice(4.65, 3000, 'ml') = (4.65/3000)*100 = 0.155
    expect(fullCream.unitPriceNormalised).toBe(0.155);
  });

  it('filters out unavailable products', async () => {
    const results = await adapter.searchProduct('milk');
    const names = results.map((r) => r.productName);
    expect(names).not.toContain('Soy Milk');
  });

  it('throws StoreApiError on persistent error', async () => {
    server.use(
      http.get('https://www.coles.com.au/_next/data/:buildId/search/products.json', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(adapter.searchProduct('milk')).rejects.toThrow(StoreApiError);
  });

  it('isAvailable returns true when session succeeds', async () => {
    expect(await adapter.isAvailable()).toBe(true);
  });

  it('isAvailable returns false when session fails', async () => {
    server.use(
      http.get('https://www.coles.com.au/', () => {
        return new HttpResponse('<html></html>', {
          headers: { 'Content-Type': 'text/html' },
        });
      }),
    );
    const freshAdapter = new ColesAdapter(new ColesSessionManager());
    expect(await freshAdapter.isAvailable()).toBe(false);
  });
});

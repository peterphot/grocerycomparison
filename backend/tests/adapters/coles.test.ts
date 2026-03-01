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
        const q = url.searchParams.get('q');
        if (q) {
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

  it('populates productUrl with slugified Coles product URL', async () => {
    const results = await adapter.searchProduct('milk');
    const fullCream = results.find((r) => r.productName === 'Full Cream Milk')!;
    expect(fullCream.productUrl).toBe(
      'https://www.coles.com.au/product/full-cream-milk-8150288',
    );
  });

  it('handles Coles product URL slug with special characters', async () => {
    const results = await adapter.searchProduct('milk');
    const liteMilk = results.find((r) => r.productName === 'Lite Milk')!;
    expect(liteMilk.productUrl).toBe(
      'https://www.coles.com.au/product/lite-milk-8150290',
    );
  });

  it('wraps session failure as StoreApiError', async () => {
    server.use(
      http.get('https://www.coles.com.au/', () => {
        return new HttpResponse('<html></html>', {
          headers: { 'Content-Type': 'text/html' },
        });
      }),
    );
    const freshAdapter = new ColesAdapter(new ColesSessionManager());
    await expect(freshAdapter.searchProduct('milk')).rejects.toThrow(StoreApiError);
  });

  it('throws StoreApiError on persistent error', async () => {
    server.use(
      http.get('https://www.coles.com.au/_next/data/:buildId/search/products.json', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(adapter.searchProduct('milk')).rejects.toThrow(StoreApiError);
  });

  describe('category filtering', () => {
    it('filters to same aisle as top result', async () => {
      const fixture = {
        pageProps: {
          searchResults: {
            results: [
              {
                _type: 'PRODUCT', id: 1, name: 'Full Cream Milk 2L', brand: 'Coles',
                size: '2L', availability: true,
                pricing: { now: 3.10, unit: { quantity: 1, ofMeasureQuantity: 1, ofMeasureUnits: 'l', price: 1.55 } },
                onlineHeirs: [{ aisle: 'Full Cream Milk', category: 'Milk', subCategory: 'Dairy, Eggs & Fridge' }],
              },
              {
                _type: 'PRODUCT', id: 2, name: 'Full Cream Milk 3L', brand: 'Coles',
                size: '3L', availability: true,
                pricing: { now: 4.65, unit: { quantity: 1, ofMeasureQuantity: 1, ofMeasureUnits: 'l', price: 1.55 } },
                onlineHeirs: [{ aisle: 'Full Cream Milk', category: 'Milk', subCategory: 'Dairy, Eggs & Fridge' }],
              },
              {
                _type: 'PRODUCT', id: 3, name: 'Chocolate Milk 600ml', brand: 'Oak',
                size: '600ml', availability: true,
                pricing: { now: 3.50, unit: { quantity: 1, ofMeasureQuantity: 1, ofMeasureUnits: 'l', price: 5.83 } },
                onlineHeirs: [{ aisle: 'Flavoured Milk', category: 'Milk', subCategory: 'Dairy, Eggs & Fridge' }],
              },
            ],
          },
        },
      };
      server.use(
        http.get('https://www.coles.com.au/_next/data/:buildId/search/products.json', () => {
          return HttpResponse.json(fixture);
        }),
      );

      const results = await adapter.searchProduct('milk');
      const names = results.map((r) => r.productName);

      // Only "Full Cream Milk" aisle products survive
      expect(names).toContain('Full Cream Milk 2L');
      expect(names).toContain('Full Cream Milk 3L');
      expect(names).not.toContain('Chocolate Milk 600ml');
    });

    it('broadens to category when aisle yields only 1 result', async () => {
      const fixture = {
        pageProps: {
          searchResults: {
            results: [
              {
                _type: 'PRODUCT', id: 1, name: 'A2 Milk 2L', brand: 'A2',
                size: '2L', availability: true,
                pricing: { now: 6.50, unit: { quantity: 1, ofMeasureQuantity: 1, ofMeasureUnits: 'l', price: 3.25 } },
                onlineHeirs: [{ aisle: 'Specialty Milk', category: 'Milk', subCategory: 'Dairy, Eggs & Fridge' }],
              },
              {
                _type: 'PRODUCT', id: 2, name: 'Full Cream Milk 2L', brand: 'Coles',
                size: '2L', availability: true,
                pricing: { now: 3.10, unit: { quantity: 1, ofMeasureQuantity: 1, ofMeasureUnits: 'l', price: 1.55 } },
                onlineHeirs: [{ aisle: 'Full Cream Milk', category: 'Milk', subCategory: 'Dairy, Eggs & Fridge' }],
              },
              {
                _type: 'PRODUCT', id: 3, name: 'Biscuits 250g', brand: 'Arnott',
                size: '250g', availability: true,
                pricing: { now: 3.50, unit: { quantity: 1, ofMeasureQuantity: 100, ofMeasureUnits: 'g', price: 1.40 } },
                onlineHeirs: [{ aisle: 'Sweet Biscuits', category: 'Biscuits', subCategory: 'Pantry' }],
              },
            ],
          },
        },
      };
      server.use(
        http.get('https://www.coles.com.au/_next/data/:buildId/search/products.json', () => {
          return HttpResponse.json(fixture);
        }),
      );

      const results = await adapter.searchProduct('milk');
      const names = results.map((r) => r.productName);

      // "Specialty Milk" aisle has only 1 result → broadens to "Milk" category
      expect(names).toContain('A2 Milk 2L');
      expect(names).toContain('Full Cream Milk 2L');
      // Different category filtered out
      expect(names).not.toContain('Biscuits 250g');
    });

    it('falls back to top 3 when all products have unique categories', async () => {
      const fixture = {
        pageProps: {
          searchResults: {
            results: [
              {
                _type: 'PRODUCT', id: 1, name: 'Product A', brand: 'Brand',
                size: '100g', availability: true,
                pricing: { now: 1.00 },
                onlineHeirs: [{ aisle: 'Aisle A', category: 'Cat A', subCategory: 'Sub A' }],
              },
              {
                _type: 'PRODUCT', id: 2, name: 'Product B', brand: 'Brand',
                size: '200g', availability: true,
                pricing: { now: 2.00 },
                onlineHeirs: [{ aisle: 'Aisle B', category: 'Cat B', subCategory: 'Sub B' }],
              },
              {
                _type: 'PRODUCT', id: 3, name: 'Product C', brand: 'Brand',
                size: '300g', availability: true,
                pricing: { now: 3.00 },
                onlineHeirs: [{ aisle: 'Aisle C', category: 'Cat C', subCategory: 'Sub C' }],
              },
              {
                _type: 'PRODUCT', id: 4, name: 'Product D', brand: 'Brand',
                size: '400g', availability: true,
                pricing: { now: 4.00 },
                onlineHeirs: [{ aisle: 'Aisle D', category: 'Cat D', subCategory: 'Sub D' }],
              },
            ],
          },
        },
      };
      server.use(
        http.get('https://www.coles.com.au/_next/data/:buildId/search/products.json', () => {
          return HttpResponse.json(fixture);
        }),
      );

      const results = await adapter.searchProduct('product');

      // All unique categories → aisle yields 1, category yields 1 → top 3 fallback
      expect(results).toHaveLength(3);
      expect(results[0].productName).toBe('Product A');
      expect(results[1].productName).toBe('Product B');
      expect(results[2].productName).toBe('Product C');
    });

    it('returns top 3 when top product has no onlineHeirs', async () => {
      const fixture = {
        pageProps: {
          searchResults: {
            results: [
              {
                _type: 'PRODUCT', id: 1, name: 'No Heirs Item', brand: 'Brand',
                size: '100g', availability: true,
                pricing: { now: 1.00 },
              },
              {
                _type: 'PRODUCT', id: 2, name: 'Item B', brand: 'Brand',
                size: '200g', availability: true,
                pricing: { now: 2.00 },
                onlineHeirs: [{ aisle: 'Aisle X', category: 'Cat X', subCategory: 'Sub X' }],
              },
              {
                _type: 'PRODUCT', id: 3, name: 'Item C', brand: 'Brand',
                size: '300g', availability: true,
                pricing: { now: 3.00 },
                onlineHeirs: [{ aisle: 'Aisle X', category: 'Cat X', subCategory: 'Sub X' }],
              },
              {
                _type: 'PRODUCT', id: 4, name: 'Item D', brand: 'Brand',
                size: '400g', availability: true,
                pricing: { now: 4.00 },
                onlineHeirs: [{ aisle: 'Aisle X', category: 'Cat X', subCategory: 'Sub X' }],
              },
            ],
          },
        },
      };
      server.use(
        http.get('https://www.coles.com.au/_next/data/:buildId/search/products.json', () => {
          return HttpResponse.json(fixture);
        }),
      );

      const results = await adapter.searchProduct('item');

      // Top product has no onlineHeirs → falls back to top 3
      expect(results).toHaveLength(3);
      expect(results[0].productName).toBe('No Heirs Item');
    });

    it('returns single result unchanged', async () => {
      const fixture = {
        pageProps: {
          searchResults: {
            results: [
              {
                _type: 'PRODUCT', id: 1, name: 'Only Item', brand: 'Brand',
                size: '100g', availability: true,
                pricing: { now: 1.00 },
                onlineHeirs: [{ aisle: 'Aisle A', category: 'Cat A', subCategory: 'Sub A' }],
              },
            ],
          },
        },
      };
      server.use(
        http.get('https://www.coles.com.au/_next/data/:buildId/search/products.json', () => {
          return HttpResponse.json(fixture);
        }),
      );

      const results = await adapter.searchProduct('only');

      expect(results).toHaveLength(1);
      expect(results[0].productName).toBe('Only Item');
    });
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

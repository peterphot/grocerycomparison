import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import { WoolworthsAdapter } from '../../src/adapters/woolworths';
import { StoreApiError } from '@grocery/shared';
import fixture from '../fixtures/woolworths-milk.json';

function mockSearchSuccess(body: unknown = fixture) {
  server.use(
    http.get('https://www.woolworths.com.au/apis/ui/Search/products', () => {
      return HttpResponse.json(body);
    }),
  );
}

function mockSearch500() {
  server.use(
    http.get('https://www.woolworths.com.au/apis/ui/Search/products', () => {
      return new HttpResponse(null, { status: 500 });
    }),
  );
}

function mockNetworkError() {
  server.use(
    http.get('https://www.woolworths.com.au/apis/ui/Search/products', () => {
      return HttpResponse.error();
    }),
  );
}

describe('WoolworthsAdapter', () => {
  const adapter = new WoolworthsAdapter();

  it('returns ProductMatch[] from valid API response', async () => {
    mockSearchSuccess();
    const results = await adapter.searchProduct('milk');
    expect(results).toHaveLength(2);
  });

  it('maps DisplayName to productName correctly', async () => {
    mockSearchSuccess();
    const results = await adapter.searchProduct('milk');
    expect(results[0].productName).toBe('Woolworths Full Cream Milk 3L');
  });

  it('maps CupPrice/CupMeasure to unitPrice/unitMeasure', async () => {
    mockSearchSuccess();
    const results = await adapter.searchProduct('milk');
    expect(results[0].unitPrice).toBe(1.55);
    expect(results[0].unitMeasure).toBe('L');
  });

  it('computes unitPriceNormalised from PackageSize', async () => {
    mockSearchSuccess();
    const results = await adapter.searchProduct('milk');
    // parsePackageSize("3L") -> {qty:3000, unit:"ml"}
    // computeNormalisedUnitPrice(4.65, 3000, "ml") -> +((4.65/3000)*100).toFixed(3) = 0.155
    expect(results[0].unitPriceNormalised).toBe(0.155);
  });

  it('flattens nested Products[].Products[] groups', async () => {
    mockSearchSuccess();
    const results = await adapter.searchProduct('milk');
    // Fixture has 3 products across 2 groups, 2 are available
    expect(results).toHaveLength(2);
  });

  it('filters out unavailable products', async () => {
    mockSearchSuccess();
    const results = await adapter.searchProduct('milk');
    const names = results.map((r) => r.productName);
    expect(names).not.toContain('Dairy Farmers Full Cream Milk 1L');
  });

  it('returns empty array when API returns no products', async () => {
    mockSearchSuccess({ Products: [] });
    const results = await adapter.searchProduct('milk');
    expect(results).toEqual([]);
  });

  it('throws StoreApiError on 500', async () => {
    mockSearch500();
    await expect(adapter.searchProduct('milk')).rejects.toThrow(StoreApiError);
  });

  it('normalises CupMeasure to lowercase (100G -> 100g)', async () => {
    mockSearchSuccess({
      Products: [
        {
          Products: [
            {
              Stockcode: 100001,
              UrlFriendlyName: 'vegemite',
              DisplayName: 'Vegemite 380g',
              Price: 7.70,
              PackageSize: '380g',
              CupPrice: 2.03,
              CupMeasure: '100G',
              Brand: 'Vegemite',
              IsAvailable: true,
            },
          ],
        },
      ],
    });
    const results = await adapter.searchProduct('vegemite');
    expect(results[0].unitMeasure).toBe('100g');
    expect(results[0].unitPrice).toBe(2.03);
  });

  it('normalises CupMeasure L and kg correctly', async () => {
    mockSearchSuccess({
      Products: [
        {
          Products: [
            {
              Stockcode: 100002,
              UrlFriendlyName: 'woolworths-milk',
              DisplayName: 'Milk 3L',
              Price: 4.65,
              PackageSize: '3L',
              CupPrice: 1.55,
              CupMeasure: '1L',
              Brand: 'Woolworths',
              IsAvailable: true,
            },
            {
              Stockcode: 100003,
              UrlFriendlyName: 'sunrice-rice',
              DisplayName: 'Rice 1KG',
              Price: 3.00,
              PackageSize: '1kg',
              CupPrice: 3.00,
              CupMeasure: '1KG',
              Brand: 'SunRice',
              IsAvailable: true,
            },
          ],
        },
      ],
    });
    const results = await adapter.searchProduct('milk');
    expect(results[0].unitMeasure).toBe('L');
    expect(results[1].unitMeasure).toBe('kg');
  });

  it('populates productUrl with direct Woolworths product page URL', async () => {
    mockSearchSuccess();
    const results = await adapter.searchProduct('milk');
    expect(results[0].productUrl).toBe(
      'https://www.woolworths.com.au/shop/productdetails/888137/woolworths-full-cream-milk',
    );
    expect(results[1].productUrl).toBe(
      'https://www.woolworths.com.au/shop/productdetails/888138/woolworths-lite-milk',
    );
  });

  it('isAvailable returns true when API responds', async () => {
    mockSearchSuccess();
    const result = await adapter.isAvailable();
    expect(result).toBe(true);
  });

  it('isAvailable returns false when API is unreachable', async () => {
    mockNetworkError();
    const result = await adapter.isAvailable();
    expect(result).toBe(false);
  });
});

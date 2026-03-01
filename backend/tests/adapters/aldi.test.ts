import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup.js';
import { AldiAdapter } from '../../src/adapters/aldi.js';
import { StoreApiError } from '@grocery/shared';
import aldiMilkFixture from '../fixtures/aldi-milk.json';

const ALDI_API_URL = 'https://api.aldi.com.au/v3/product-search*';

describe('AldiAdapter', () => {
  const adapter = new AldiAdapter();

  it('returns ProductMatch[] from valid API response', async () => {
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return HttpResponse.json(aldiMilkFixture);
      }),
    );

    const results = await adapter.searchProduct('milk');

    expect(results).toHaveLength(4);
    expect(results[0].store).toBe('aldi');
    expect(results[0].productName).toBe('Farmdale Full Cream Milk 2L');
    expect(results[0].brand).toBe('FARMDALE');
    expect(results[0].available).toBe(true);
  });

  it('converts price from cents to dollars', async () => {
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return HttpResponse.json(aldiMilkFixture);
      }),
    );

    const results = await adapter.searchProduct('milk');

    expect(results[0].price).toBe(2.69);
    expect(results[1].price).toBe(2.15);
  });

  it('includes products regardless of notForSale flag (price comparison only)', async () => {
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return HttpResponse.json(aldiMilkFixture);
      }),
    );

    const results = await adapter.searchProduct('milk');
    const names = results.map(r => r.productName);

    // notForSale items are included because Aldi marks most products as
    // not-for-sale (no online ordering) but prices are still valid for comparison
    expect(names).toContain('Milk Frother');
  });

  it('computes unitPrice and unitMeasure from sellingSize', async () => {
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return HttpResponse.json(aldiMilkFixture);
      }),
    );

    const results = await adapter.searchProduct('milk');

    // "2L" → 2000ml → unitPrice per L: 2.69/2000*1000 = 1.345 → toFixed(2) = 1.34
    expect(results[0].unitPrice).toBe(1.34);
    expect(results[0].unitMeasure).toBe('L');
    expect(results[0].unitPriceNormalised).toBeTypeOf('number');
  });

  it('sets unit fields to null when sellingSize is null', async () => {
    // Create a fixture with a non-notForSale item that has null sellingSize
    const fixture = {
      data: [
        {
          sku: '000000000000999999',
          name: 'Mystery Item',
          brandName: 'TEST',
          urlSlugText: 'test-mystery-item',
          sellingSize: null,
          notForSale: false,
          price: { amount: 500, amountRelevantDisplay: '$5.00', currencyCode: 'AUD' },
        },
      ],
    };
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const results = await adapter.searchProduct('mystery');

    expect(results[0].unitPrice).toBeNull();
    expect(results[0].unitMeasure).toBeNull();
    expect(results[0].unitPriceNormalised).toBeNull();
  });

  it('sets unit fields to null when sellingSize is unparseable', async () => {
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return HttpResponse.json(aldiMilkFixture);
      }),
    );

    const results = await adapter.searchProduct('milk');

    // "assorted" is unparseable
    const cheese = results.find(r => r.productName === 'Specialty Cheese Selection');
    expect(cheese).toBeDefined();
    expect(cheese!.unitPrice).toBeNull();
    expect(cheese!.unitMeasure).toBeNull();
    expect(cheese!.unitPriceNormalised).toBeNull();
  });

  it('sends Origin and Referer headers', async () => {
    let capturedHeaders: Headers | undefined;
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ data: [] });
      }),
    );

    await adapter.searchProduct('test');

    expect(capturedHeaders?.get('Origin')).toBe('https://www.aldi.com.au');
    expect(capturedHeaders?.get('Referer')).toBe('https://www.aldi.com.au/');
  });

  it('populates productUrl with direct Aldi product page URL', async () => {
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return HttpResponse.json(aldiMilkFixture);
      }),
    );

    const results = await adapter.searchProduct('milk');

    expect(results[0].productUrl).toBe(
      'https://www.aldi.com.au/product/farmdale-full-cream-milk-2l-000000000000567890',
    );
    expect(results[1].productUrl).toBe(
      'https://www.aldi.com.au/product/farmdale-thickened-cream-300ml-000000000000567891',
    );
  });

  it('returns empty array when no products found', async () => {
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return HttpResponse.json({ data: [] });
      }),
    );

    const results = await adapter.searchProduct('nonexistent');

    expect(results).toEqual([]);
  });

  it('isAvailable returns true when API responds', async () => {
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return HttpResponse.json({ data: [] });
      }),
    );

    expect(await adapter.isAvailable()).toBe(true);
  });

  it('isAvailable returns false when API is unreachable', async () => {
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return HttpResponse.error();
      }),
    );

    expect(await adapter.isAvailable()).toBe(false);
  });

  it('throws StoreApiError on 500', async () => {
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const error = await adapter.searchProduct('milk').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(StoreApiError);
    expect((error as StoreApiError).store).toBe('aldi');
  });
});

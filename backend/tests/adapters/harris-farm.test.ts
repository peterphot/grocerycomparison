import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup.js';
import { HarrisFarmAdapter } from '../../src/adapters/harris-farm.js';
import { StoreApiError } from '@grocery/shared';
import fixture from '../fixtures/harrisfarm-milk.json';

const SUGGEST_URL = 'https://www.harrisfarm.com.au/search/suggest.json*';

describe('HarrisFarmAdapter', () => {
  const adapter = new HarrisFarmAdapter();

  it('returns ProductMatch[] from Shopify suggest response', async () => {
    server.use(
      http.get('https://www.harrisfarm.com.au/search/suggest.json', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const results = await adapter.searchProduct('milk');

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.store === 'harrisfarm')).toBe(true);
    expect(results.every((r) => r.available === true)).toBe(true);
  });

  it('parses price string to float correctly', async () => {
    server.use(
      http.get('https://www.harrisfarm.com.au/search/suggest.json', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const results = await adapter.searchProduct('milk');
    const milk = results.find((r) => r.productName.includes('Lite Milk'));

    expect(milk?.price).toBe(3.2);
  });

  it('extracts "2L" from title and computes unit price', async () => {
    server.use(
      http.get('https://www.harrisfarm.com.au/search/suggest.json', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const results = await adapter.searchProduct('milk');
    const milk = results.find((r) => r.productName.includes('Lite Milk 2L'));

    expect(milk).toBeDefined();
    expect(milk!.packageSize).toBe('2L');
    expect(milk!.unitPrice).toBeTypeOf('number');
    expect(milk!.unitMeasure).toBe('L');
    expect(milk!.unitPriceNormalised).toBeTypeOf('number');
  });

  it('extracts "500g" from title', async () => {
    server.use(
      http.get('https://www.harrisfarm.com.au/search/suggest.json', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const results = await adapter.searchProduct('yoghurt');
    const yoghurt = results.find((r) => r.productName.includes('500g'));

    expect(yoghurt).toBeDefined();
    expect(yoghurt!.packageSize).toBe('500g');
  });

  it('sets unit fields to null when title has no size', async () => {
    server.use(
      http.get('https://www.harrisfarm.com.au/search/suggest.json', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const results = await adapter.searchProduct('fruit');
    const box = results.find((r) => r.productName.includes('Seasonal Fruit'));

    expect(box).toBeDefined();
    expect(box!.packageSize).toBe('');
    expect(box!.unitPrice).toBeNull();
    expect(box!.unitMeasure).toBeNull();
    expect(box!.unitPriceNormalised).toBeNull();
  });

  it('populates productUrl with Harris Farm Shopify URL from handle', async () => {
    server.use(
      http.get('https://www.harrisfarm.com.au/search/suggest.json', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const results = await adapter.searchProduct('milk');

    expect(results[0].productUrl).toBe(
      'https://www.harrisfarm.com.au/products/milk-lite-2l-harris-farm-88662',
    );
    expect(results[1].productUrl).toBe(
      'https://www.harrisfarm.com.au/products/yoghurt-greek-500g-harris-farm',
    );
    expect(results[2].productUrl).toBe(
      'https://www.harrisfarm.com.au/products/seasonal-fruit-box',
    );
  });

  it('falls back to price when price_max is absent', async () => {
    server.use(
      http.get('https://www.harrisfarm.com.au/search/suggest.json', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const results = await adapter.searchProduct('fruit');
    const box = results.find((r) => r.productName.includes('Seasonal Fruit'));

    // Seasonal Fruit Box fixture has no price_max, so should use price "35.00"
    expect(box?.price).toBe(35.0);
  });

  it('filters out unavailable products', async () => {
    server.use(
      http.get('https://www.harrisfarm.com.au/search/suggest.json', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const results = await adapter.searchProduct('milk');
    const organic = results.find((r) => r.productName.includes('Organic'));

    expect(organic).toBeUndefined();
  });

  it('throws StoreApiError on 500', async () => {
    server.use(
      http.get('https://www.harrisfarm.com.au/search/suggest.json', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const error = await adapter.searchProduct('milk').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(StoreApiError);
    expect((error as StoreApiError).store).toBe('harrisfarm');
  });

  it('returns empty array when no products found', async () => {
    server.use(
      http.get('https://www.harrisfarm.com.au/search/suggest.json', () => {
        return HttpResponse.json({
          resources: { results: { products: [] } },
        });
      }),
    );

    const results = await adapter.searchProduct('xyznonexistent');
    expect(results).toEqual([]);
  });
});

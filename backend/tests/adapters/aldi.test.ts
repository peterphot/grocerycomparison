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

    // Category filter keeps only "Milk" subcategory items (2 of 5)
    expect(results).toHaveLength(2);
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
    expect(results[1].price).toBe(1.65);
  });

  it('includes products regardless of notForSale flag (price comparison only)', async () => {
    // Use a fixture where all products share the same subcategory so filtering keeps them all
    const fixture = {
      data: [
        {
          sku: '001', name: 'Milk 2L', brandName: 'FARM', urlSlugText: 'milk-2l',
          sellingSize: '2L', notForSale: false,
          price: { amount: 269, amountRelevantDisplay: '$2.69', currencyCode: 'AUD' },
          categories: [{ id: 'c1', name: 'Dairy' }, { id: 'c2', name: 'Milk' }],
        },
        {
          sku: '002', name: 'Milk Frother', brandName: 'EXPRESSI', urlSlugText: 'milk-frother',
          sellingSize: null, notForSale: true,
          price: { amount: 3199, amountRelevantDisplay: '$31.99', currencyCode: 'AUD' },
          categories: [{ id: 'c1', name: 'Dairy' }, { id: 'c2', name: 'Milk' }],
        },
      ],
    };
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return HttpResponse.json(fixture);
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
          categories: [],
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
    // Use a fixture where the unparseable item shares subcategory with another so it survives filtering
    const fixture = {
      data: [
        {
          sku: '001', name: 'Specialty Cheese Selection', brandName: 'EMPORIUM',
          urlSlugText: 'cheese-selection', sellingSize: 'assorted', notForSale: false,
          price: { amount: 899, amountRelevantDisplay: '$8.99', currencyCode: 'AUD' },
          categories: [{ id: 'c1', name: 'Dairy' }, { id: 'c2', name: 'Cheese' }],
        },
        {
          sku: '002', name: 'Cheddar Block 500g', brandName: 'WESTACRE',
          urlSlugText: 'cheddar-block', sellingSize: '500g', notForSale: false,
          price: { amount: 499, amountRelevantDisplay: '$4.99', currencyCode: 'AUD' },
          categories: [{ id: 'c1', name: 'Dairy' }, { id: 'c2', name: 'Cheese' }],
        },
      ],
    };
    server.use(
      http.get('https://api.aldi.com.au/v3/product-search', () => {
        return HttpResponse.json(fixture);
      }),
    );

    const results = await adapter.searchProduct('cheese');

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
      'https://www.aldi.com.au/product/farmdale-light-milk-1l-000000000000567893',
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

  describe('category filtering', () => {
    it('filters out products from different subcategory than top result', async () => {
      server.use(
        http.get('https://api.aldi.com.au/v3/product-search', () => {
          return HttpResponse.json(aldiMilkFixture);
        }),
      );

      const results = await adapter.searchProduct('milk');
      const names = results.map(r => r.productName);

      // Only "Milk" subcategory items survive (matches top result's subcategory)
      expect(names).toContain('Farmdale Full Cream Milk 2L');
      expect(names).toContain('Farmdale Light Milk 1L');
      // Different subcategories filtered out
      expect(names).not.toContain('Milk Frother');
      expect(names).not.toContain('Farmdale Thickened Cream 300ml');
      expect(names).not.toContain('Specialty Cheese Selection');
    });

    it('falls back to parent category when subcategory yields <=1 result', async () => {
      const fixture = {
        data: [
          {
            sku: '001', name: 'Thickened Cream 300ml', brandName: 'FARM',
            urlSlugText: 'cream-300ml', sellingSize: '300ml', notForSale: false,
            price: { amount: 215, amountRelevantDisplay: '$2.15', currencyCode: 'AUD' },
            categories: [{ id: 'c1', name: 'Dairy, Eggs & Fridge' }, { id: 'c2', name: 'Cream & Custard' }],
          },
          {
            sku: '002', name: 'Camembert 200g', brandName: 'EMPORIUM',
            urlSlugText: 'camembert-200g', sellingSize: '200g', notForSale: false,
            price: { amount: 399, amountRelevantDisplay: '$3.99', currencyCode: 'AUD' },
            categories: [{ id: 'c1', name: 'Dairy, Eggs & Fridge' }, { id: 'c3', name: 'Cheese' }],
          },
          {
            sku: '003', name: 'Chocolate Bar 100g', brandName: 'CHOCEUR',
            urlSlugText: 'choc-bar', sellingSize: '100g', notForSale: false,
            price: { amount: 199, amountRelevantDisplay: '$1.99', currencyCode: 'AUD' },
            categories: [{ id: 'c4', name: 'Confectionery' }, { id: 'c5', name: 'Chocolate' }],
          },
        ],
      };
      server.use(
        http.get('https://api.aldi.com.au/v3/product-search', () => {
          return HttpResponse.json(fixture);
        }),
      );

      const results = await adapter.searchProduct('cream');
      const names = results.map(r => r.productName);

      // Subcategory "Cream & Custard" has only 1 result → broadens to "Dairy, Eggs & Fridge"
      expect(names).toContain('Thickened Cream 300ml');
      expect(names).toContain('Camembert 200g');
      // Different parent category filtered out
      expect(names).not.toContain('Chocolate Bar 100g');
    });

    it('falls back to top 3 when parent category also yields <=1 result', async () => {
      const fixture = {
        data: [
          {
            sku: '001', name: 'Product A', brandName: 'BRAND',
            urlSlugText: 'product-a', sellingSize: '100g', notForSale: false,
            price: { amount: 100, amountRelevantDisplay: '$1.00', currencyCode: 'AUD' },
            categories: [{ id: 'c1', name: 'Category A' }, { id: 'c2', name: 'Sub A' }],
          },
          {
            sku: '002', name: 'Product B', brandName: 'BRAND',
            urlSlugText: 'product-b', sellingSize: '200g', notForSale: false,
            price: { amount: 200, amountRelevantDisplay: '$2.00', currencyCode: 'AUD' },
            categories: [{ id: 'c3', name: 'Category B' }, { id: 'c4', name: 'Sub B' }],
          },
          {
            sku: '003', name: 'Product C', brandName: 'BRAND',
            urlSlugText: 'product-c', sellingSize: '300g', notForSale: false,
            price: { amount: 300, amountRelevantDisplay: '$3.00', currencyCode: 'AUD' },
            categories: [{ id: 'c5', name: 'Category C' }, { id: 'c6', name: 'Sub C' }],
          },
          {
            sku: '004', name: 'Product D', brandName: 'BRAND',
            urlSlugText: 'product-d', sellingSize: '400g', notForSale: false,
            price: { amount: 400, amountRelevantDisplay: '$4.00', currencyCode: 'AUD' },
            categories: [{ id: 'c7', name: 'Category D' }, { id: 'c8', name: 'Sub D' }],
          },
        ],
      };
      server.use(
        http.get('https://api.aldi.com.au/v3/product-search', () => {
          return HttpResponse.json(fixture);
        }),
      );

      const results = await adapter.searchProduct('product');

      // All unique categories → subcategory filter yields 1, parent filter yields 1 → top 3 fallback
      expect(results).toHaveLength(3);
      expect(results[0].productName).toBe('Product A');
      expect(results[1].productName).toBe('Product B');
      expect(results[2].productName).toBe('Product C');
    });

    it('returns top 3 when top product has no categories', async () => {
      const fixture = {
        data: [
          {
            sku: '001', name: 'No Cat Item', brandName: 'BRAND',
            urlSlugText: 'no-cat', sellingSize: '100g', notForSale: false,
            price: { amount: 100, amountRelevantDisplay: '$1.00', currencyCode: 'AUD' },
            categories: [],
          },
          {
            sku: '002', name: 'Item B', brandName: 'BRAND',
            urlSlugText: 'item-b', sellingSize: '200g', notForSale: false,
            price: { amount: 200, amountRelevantDisplay: '$2.00', currencyCode: 'AUD' },
            categories: [{ id: 'c1', name: 'Cat' }, { id: 'c2', name: 'Sub' }],
          },
          {
            sku: '003', name: 'Item C', brandName: 'BRAND',
            urlSlugText: 'item-c', sellingSize: '300g', notForSale: false,
            price: { amount: 300, amountRelevantDisplay: '$3.00', currencyCode: 'AUD' },
            categories: [{ id: 'c1', name: 'Cat' }, { id: 'c2', name: 'Sub' }],
          },
          {
            sku: '004', name: 'Item D', brandName: 'BRAND',
            urlSlugText: 'item-d', sellingSize: '400g', notForSale: false,
            price: { amount: 400, amountRelevantDisplay: '$4.00', currencyCode: 'AUD' },
            categories: [{ id: 'c1', name: 'Cat' }, { id: 'c2', name: 'Sub' }],
          },
        ],
      };
      server.use(
        http.get('https://api.aldi.com.au/v3/product-search', () => {
          return HttpResponse.json(fixture);
        }),
      );

      const results = await adapter.searchProduct('item');

      // Top product has no categories → falls back to top 3
      expect(results).toHaveLength(3);
      expect(results[0].productName).toBe('No Cat Item');
    });
  });
});

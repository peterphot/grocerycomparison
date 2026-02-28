import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoreAdapter } from '../../src/adapters/store-adapter.js';
import type { ProductMatch, ShoppingListItem, ComparisonResponse } from '@grocery/shared';
import { makeMatch } from '../helpers/data-builders.js';

function createMockAdapter(storeName: string, results: ProductMatch[][]): StoreAdapter {
  let callIndex = 0;
  return {
    storeName: storeName as any,
    displayName: storeName,
    searchProduct: vi.fn(async (_query: string) => {
      const result = results[callIndex] ?? [];
      callIndex++;
      return result;
    }),
    isAvailable: vi.fn(async () => true),
  };
}

function createFailingAdapter(storeName: string): StoreAdapter {
  return {
    storeName: storeName as any,
    displayName: storeName,
    searchProduct: vi.fn(async () => { throw new Error(`${storeName} is down`); }),
    isAvailable: vi.fn(async () => false),
  };
}

function makeItem(overrides?: Partial<ShoppingListItem>): ShoppingListItem {
  return {
    id: 'item-1',
    name: 'milk',
    quantity: 1,
    isBrandSpecific: false,
    ...overrides,
  };
}

describe('SearchOrchestrator', () => {
  let SearchOrchestrator: any;
  let buildComparisonResponse: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../../src/services/search-orchestrator.js');
    SearchOrchestrator = mod.SearchOrchestrator;
  });

  describe('search', () => {
    it('calls all 4 adapters for each item', async () => {
      const adapters = [
        createMockAdapter('woolworths', [[makeMatch({ store: 'woolworths', price: 3 })]]),
        createMockAdapter('coles', [[makeMatch({ store: 'coles', price: 4 })]]),
        createMockAdapter('aldi', [[makeMatch({ store: 'aldi', price: 5 })]]),
        createMockAdapter('harrisfarm', [[makeMatch({ store: 'harrisfarm', price: 6 })]]),
      ];
      const orchestrator = new SearchOrchestrator(adapters);
      const items = [makeItem({ id: 'item-1', name: 'milk' })];

      await orchestrator.search(items);

      for (const adapter of adapters) {
        expect(adapter.searchProduct).toHaveBeenCalledWith('milk');
        expect(adapter.searchProduct).toHaveBeenCalledTimes(1);
      }
    });

    it('returns ComparisonResponse with all stores', async () => {
      const adapters = [
        createMockAdapter('woolworths', [[makeMatch({ store: 'woolworths', price: 3 })]]),
        createMockAdapter('coles', [[makeMatch({ store: 'coles', price: 4 })]]),
        createMockAdapter('aldi', [[makeMatch({ store: 'aldi', price: 5 })]]),
        createMockAdapter('harrisfarm', [[makeMatch({ store: 'harrisfarm', price: 6 })]]),
      ];
      const orchestrator = new SearchOrchestrator(adapters);
      const items = [makeItem({ id: 'item-1', name: 'milk' })];

      const result: ComparisonResponse = await orchestrator.search(items);

      expect(result).toHaveProperty('storeTotals');
      expect(result).toHaveProperty('mixAndMatch');
      expect(result).toHaveProperty('searchResults');
      expect(result.searchResults).toHaveLength(1);
      expect(result.searchResults[0].shoppingListItemId).toBe('item-1');
      expect(result.searchResults[0].shoppingListItemName).toBe('milk');
      expect(result.searchResults[0].matches.length).toBeGreaterThanOrEqual(4);
    });

    it('selects cheapest match for brand-agnostic items', async () => {
      const adapters = [
        createMockAdapter('woolworths', [[
          makeMatch({ store: 'woolworths', price: 5.00, productName: 'Expensive Milk' }),
          makeMatch({ store: 'woolworths', price: 2.00, productName: 'Cheap Milk' }),
        ]]),
        createMockAdapter('coles', [[]]),
        createMockAdapter('aldi', [[]]),
        createMockAdapter('harrisfarm', [[]]),
      ];
      const orchestrator = new SearchOrchestrator(adapters);
      const items = [makeItem({ isBrandSpecific: false })];

      const result = await orchestrator.search(items);
      // For brand-agnostic: all matches should be included, result-builder handles cheapest selection
      // But the orchestrator should include all matches so result-builder can pick
      const woolworthsMatches = result.searchResults[0].matches.filter(
        (m: ProductMatch) => m.store === 'woolworths'
      );
      expect(woolworthsMatches).toHaveLength(2);
    });

    it('selects first match for brand-specific items', async () => {
      const adapters = [
        createMockAdapter('woolworths', [[
          makeMatch({ store: 'woolworths', price: 5.00, productName: 'Brand A Milk' }),
          makeMatch({ store: 'woolworths', price: 2.00, productName: 'Brand B Milk' }),
        ]]),
        createMockAdapter('coles', [[
          makeMatch({ store: 'coles', price: 4.00, productName: 'Brand A Milk' }),
          makeMatch({ store: 'coles', price: 1.00, productName: 'Brand B Milk' }),
        ]]),
        createMockAdapter('aldi', [[]]),
        createMockAdapter('harrisfarm', [[]]),
      ];
      const orchestrator = new SearchOrchestrator(adapters);
      const items = [makeItem({ isBrandSpecific: true })];

      const result = await orchestrator.search(items);
      // For brand-specific: only include first match per store (API-relevance order)
      const woolworthsMatches = result.searchResults[0].matches.filter(
        (m: ProductMatch) => m.store === 'woolworths'
      );
      const colesMatches = result.searchResults[0].matches.filter(
        (m: ProductMatch) => m.store === 'coles'
      );
      expect(woolworthsMatches).toHaveLength(1);
      expect(woolworthsMatches[0].productName).toBe('Brand A Milk');
      expect(colesMatches).toHaveLength(1);
      expect(colesMatches[0].productName).toBe('Brand A Milk');
    });

    it('returns partial results when one adapter fails', async () => {
      const adapters = [
        createMockAdapter('woolworths', [[makeMatch({ store: 'woolworths', price: 3 })]]),
        createFailingAdapter('coles'),
        createMockAdapter('aldi', [[makeMatch({ store: 'aldi', price: 5 })]]),
        createMockAdapter('harrisfarm', [[makeMatch({ store: 'harrisfarm', price: 6 })]]),
      ];
      const orchestrator = new SearchOrchestrator(adapters);
      const items = [makeItem()];

      const result = await orchestrator.search(items);

      // Should still return a valid response
      expect(result).toHaveProperty('storeTotals');
      expect(result).toHaveProperty('searchResults');
      // Should have matches from working stores but not from coles
      const colesMatches = result.searchResults[0].matches.filter(
        (m: ProductMatch) => m.store === 'coles'
      );
      expect(colesMatches).toHaveLength(0);
      // But other stores should have matches
      const woolworthsMatches = result.searchResults[0].matches.filter(
        (m: ProductMatch) => m.store === 'woolworths'
      );
      expect(woolworthsMatches).toHaveLength(1);
    });

    it('marks all items as unavailable for a failed store', async () => {
      const adapters = [
        createMockAdapter('woolworths', [
          [makeMatch({ store: 'woolworths', price: 3 })],
          [makeMatch({ store: 'woolworths', price: 4 })],
        ]),
        createFailingAdapter('coles'),
        createMockAdapter('aldi', [
          [makeMatch({ store: 'aldi', price: 5 })],
          [makeMatch({ store: 'aldi', price: 6 })],
        ]),
        createMockAdapter('harrisfarm', [
          [makeMatch({ store: 'harrisfarm', price: 7 })],
          [makeMatch({ store: 'harrisfarm', price: 8 })],
        ]),
      ];
      const orchestrator = new SearchOrchestrator(adapters);
      const items = [
        makeItem({ id: 'item-1', name: 'milk' }),
        makeItem({ id: 'item-2', name: 'bread' }),
      ];

      const result = await orchestrator.search(items);

      // Both items should have no coles matches
      for (const searchResult of result.searchResults) {
        const colesMatches = searchResult.matches.filter(
          (m: ProductMatch) => m.store === 'coles'
        );
        expect(colesMatches).toHaveLength(0);
      }
    });

    it('fans out concurrently - does not wait for each store sequentially', async () => {
      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;

      const makeTimedAdapter = (storeName: string, delay: number): StoreAdapter => ({
        storeName: storeName as any,
        displayName: storeName,
        searchProduct: vi.fn(async () => {
          concurrentCalls++;
          maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);
          await new Promise((resolve) => setTimeout(resolve, delay));
          concurrentCalls--;
          return [makeMatch({ store: storeName as any, price: 1 })];
        }),
        isAvailable: vi.fn(async () => true),
      });

      const adapters = [
        makeTimedAdapter('woolworths', 50),
        makeTimedAdapter('coles', 50),
        makeTimedAdapter('aldi', 50),
        makeTimedAdapter('harrisfarm', 50),
      ];
      const orchestrator = new SearchOrchestrator(adapters);
      const items = [makeItem()];

      const start = Date.now();
      await orchestrator.search(items);
      const elapsed = Date.now() - start;

      // If sequential, would take 4 * 50 = 200ms. Concurrent should be ~50ms.
      expect(elapsed).toBeLessThan(150);
      // All 4 adapters should have been called concurrently
      expect(maxConcurrentCalls).toBeGreaterThanOrEqual(4);
    });
  });

  describe('cache', () => {
    it('returns cached result on identical query within 30s', async () => {
      const adapters = [
        createMockAdapter('woolworths', [
          [makeMatch({ store: 'woolworths', price: 3 })],
          [makeMatch({ store: 'woolworths', price: 99 })], // different result if called again
        ]),
        createMockAdapter('coles', [[], []]),
        createMockAdapter('aldi', [[], []]),
        createMockAdapter('harrisfarm', [[], []]),
      ];
      const orchestrator = new SearchOrchestrator(adapters);
      const items = [makeItem({ id: 'item-1', name: 'milk', quantity: 1 })];

      const result1 = await orchestrator.search(items);
      const result2 = await orchestrator.search(items);

      // Should return the same cached result
      expect(result1).toEqual(result2);
      // Adapter should only have been called once
      expect(adapters[0].searchProduct).toHaveBeenCalledTimes(1);
    });

    it('fetches fresh result after cache TTL expires', async () => {
      vi.useFakeTimers();
      const adapters = [
        createMockAdapter('woolworths', [
          [makeMatch({ store: 'woolworths', price: 3 })],
          [makeMatch({ store: 'woolworths', price: 99 })],
        ]),
        createMockAdapter('coles', [[], []]),
        createMockAdapter('aldi', [[], []]),
        createMockAdapter('harrisfarm', [[], []]),
      ];
      const orchestrator = new SearchOrchestrator(adapters);
      const items = [makeItem({ id: 'item-1', name: 'milk', quantity: 1 })];

      await orchestrator.search(items);

      // Advance time past 30s TTL
      vi.advanceTimersByTime(31_000);

      await orchestrator.search(items);

      // Adapter should have been called twice (cache expired)
      expect(adapters[0].searchProduct).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('treats different item orderings as the same cache key', async () => {
      const adapters = [
        createMockAdapter('woolworths', [
          [makeMatch({ store: 'woolworths', price: 3 })], // for milk
          [makeMatch({ store: 'woolworths', price: 4 })], // for bread
        ]),
        createMockAdapter('coles', [[], []]),
        createMockAdapter('aldi', [[], []]),
        createMockAdapter('harrisfarm', [[], []]),
      ];
      const orchestrator = new SearchOrchestrator(adapters);

      const items1 = [
        makeItem({ id: 'item-1', name: 'milk', quantity: 2 }),
        makeItem({ id: 'item-2', name: 'bread', quantity: 1 }),
      ];
      const items2 = [
        makeItem({ id: 'item-2', name: 'bread', quantity: 1 }),
        makeItem({ id: 'item-1', name: 'milk', quantity: 2 }),
      ];

      await orchestrator.search(items1);
      await orchestrator.search(items2);

      // Should have only called adapters once (second call hits cache)
      expect(adapters[0].searchProduct).toHaveBeenCalledTimes(2); // once per item in first search
    });
  });
});

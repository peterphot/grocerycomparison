import type { ShoppingListItem, ComparisonResponse, ItemSearchResult, ProductMatch } from '@grocery/shared';
import type { StoreAdapter } from '../adapters/store-adapter.js';
import { buildComparisonResponse } from './result-builder.js';
import { config } from '../config.js';

interface CacheEntry {
  response: ComparisonResponse;
  expiresAt: number;
}

function buildCacheKey(items: ShoppingListItem[]): string {
  return [...items]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => `${item.quantity}×${item.name}×${item.isBrandSpecific ? 'B' : 'G'}`)
    .join(',');
}

export class SearchOrchestrator {
  private adapters: StoreAdapter[];
  private cache = new Map<string, CacheEntry>();

  constructor(adapters: StoreAdapter[]) {
    this.adapters = adapters;
  }

  async search(items: ShoppingListItem[]): Promise<ComparisonResponse> {
    const cacheKey = buildCacheKey(items);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.response;
    }

    // Fan out: for each adapter, search all items concurrently
    const adapterResults = await Promise.allSettled(
      this.adapters.map(async (adapter) => {
        const settled = await Promise.allSettled(
          items.map((item) => adapter.searchProduct(item.name))
        );
        const itemResults = settled.map((r) => (r.status === 'fulfilled' ? r.value : []));
        return { adapter, itemResults };
      })
    );

    // Build ItemSearchResult[] from the adapter results
    const searchResults: ItemSearchResult[] = items.map((item, itemIndex) => {
      const matches: ProductMatch[] = [];

      for (const adapterResult of adapterResults) {
        if (adapterResult.status === 'rejected') continue;

        const { itemResults } = adapterResult.value;
        let adapterMatches = itemResults[itemIndex] ?? [];

        // Brand-specific: only keep first match per store
        if (item.isBrandSpecific && adapterMatches.length > 0) {
          adapterMatches = [adapterMatches[0]];
        }

        matches.push(...adapterMatches);
      }

      return {
        shoppingListItemId: item.id,
        shoppingListItemName: item.name,
        quantity: item.quantity,
        matches,
      };
    });

    const response = buildComparisonResponse(searchResults);

    this.cache.set(cacheKey, {
      response,
      expiresAt: Date.now() + config.resultCacheTtlMs,
    });

    return response;
  }
}

import type { ShoppingListItem, ComparisonResponse, ItemSearchResult, ProductMatch } from '@grocery/shared';
import { StoreApiError } from '@grocery/shared';
import type { StoreAdapter } from '../adapters/store-adapter.js';
import { buildComparisonResponse } from './result-builder.js';
import { config } from '../config.js';

/** Map internal errors to safe user-facing messages. */
function sanitizeStoreError(error: unknown): string {
  if (error instanceof StoreApiError) {
    if (error.statusCode && error.statusCode >= 500) return 'Store service temporarily unavailable';
    if (error.message === 'Request timed out') return 'Store did not respond in time';
  }
  return 'Unable to fetch results from this store';
}

const MAX_CACHE_ENTRIES = 1000;

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

/** Simple concurrency limiter — runs at most `limit` tasks at a time. */
function pLimit(limit: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  function next() {
    if (queue.length > 0 && active < limit) {
      active++;
      queue.shift()!();
    }
  }

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      queue.push(() => {
        fn().then(resolve, reject).finally(() => {
          active--;
          next();
        });
      });
      next();
    });
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

    // Fan out: for each adapter, search items with per-adapter concurrency limit
    const storeErrors: Record<string, string> = {};

    const adapterResults = await Promise.allSettled(
      this.adapters.map(async (adapter) => {
        const limit = pLimit(config.maxConcurrentPerStore);
        const settled = await Promise.allSettled(
          items.map((item) => limit(() => adapter.searchProduct(item.name)))
        );

        // Check for per-item failures within this adapter
        const failures = settled.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
          const firstFailure = failures[0] as PromiseRejectedResult;
          if (failures.length === settled.length) {
            storeErrors[adapter.storeName] = sanitizeStoreError(firstFailure.reason);
          } else {
            storeErrors[adapter.storeName] = `Some items could not be fetched (${failures.length} of ${settled.length} failed)`;
          }
        }

        const itemResults = settled.map((r) => (r.status === 'fulfilled' ? r.value : []));
        return { adapter, itemResults };
      })
    );

    // Capture adapter-level errors (when entire adapter promise rejects)
    for (let i = 0; i < adapterResults.length; i++) {
      const adapterResult = adapterResults[i];
      if (adapterResult.status === 'rejected') {
        const adapter = this.adapters[i];
        storeErrors[adapter.storeName] = sanitizeStoreError(adapterResult.reason);
      }
    }

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

    const response: ComparisonResponse = {
      ...buildComparisonResponse(searchResults),
      ...(Object.keys(storeErrors).length > 0 ? { storeErrors } : {}),
    };

    // Evict expired entries before inserting
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) this.cache.delete(key);
    }

    // Enforce max cache size (evict oldest — Map preserves insertion order)
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, {
      response,
      expiresAt: Date.now() + config.resultCacheTtlMs,
    });

    return response;
  }
}

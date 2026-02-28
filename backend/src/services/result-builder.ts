import type {
  StoreName,
  ProductMatch,
  ItemSearchResult,
  StoreTotal,
  StoreItemResult,
  MixAndMatchResult,
  MixAndMatchItem,
  ComparisonResponse,
} from '@grocery/shared';
import { ALL_STORES, STORE_DISPLAY_NAMES } from '@grocery/shared';

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function cheapestAvailableMatch(
  matches: ProductMatch[],
  store: StoreName,
): ProductMatch | null {
  const storeMatches = matches.filter((m) => m.store === store && m.available);
  if (storeMatches.length === 0) return null;
  return storeMatches.reduce((best, curr) => (curr.price < best.price ? curr : best));
}

export function buildStoreTotals(results: ItemSearchResult[]): StoreTotal[] {
  const totals = ALL_STORES.map((store) => {
    const items: StoreItemResult[] = results.map((result) => {
      const match = cheapestAvailableMatch(result.matches, store);
      const lineTotal = match ? roundCents(match.price * result.quantity) : 0;
      return {
        shoppingListItemId: result.shoppingListItemId,
        shoppingListItemName: result.shoppingListItemName,
        quantity: result.quantity,
        match,
        lineTotal,
      };
    });
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const unavailableCount = items.filter((item) => item.match === null).length;
    return {
      store,
      storeName: STORE_DISPLAY_NAMES[store],
      items,
      total: roundCents(total),
      unavailableCount,
      allItemsAvailable: unavailableCount === 0,
    };
  });

  return totals.sort((a, b) => {
    const aFullyUnavail = a.unavailableCount === a.items.length;
    const bFullyUnavail = b.unavailableCount === b.items.length;
    if (aFullyUnavail !== bFullyUnavail) return aFullyUnavail ? 1 : -1;
    return a.total - b.total;
  });
}

export function buildMixAndMatch(results: ItemSearchResult[]): MixAndMatchResult {
  const items: MixAndMatchItem[] = results.map((result) => {
    const availableMatches = result.matches.filter((m) => m.available);
    if (availableMatches.length === 0) {
      return {
        shoppingListItemId: result.shoppingListItemId,
        shoppingListItemName: result.shoppingListItemName,
        quantity: result.quantity,
        cheapestMatch: null,
        lineTotal: 0,
      };
    }
    // When any match provides unitPriceNormalised, compare by that metric.
    // Matches missing unitPriceNormalised are treated as Infinity so they lose
    // to matches with known per-unit pricing — this intentionally favours stores
    // that report comparable unit prices over those that don't.
    const hasNormalised = availableMatches.some((m) => m.unitPriceNormalised !== null);
    const cheapest = availableMatches.reduce((best, curr) => {
      if (hasNormalised) {
        const bestVal = best.unitPriceNormalised ?? Infinity;
        const currVal = curr.unitPriceNormalised ?? Infinity;
        return currVal < bestVal ? curr : best;
      }
      return curr.price < best.price ? curr : best;
    });
    return {
      shoppingListItemId: result.shoppingListItemId,
      shoppingListItemName: result.shoppingListItemName,
      quantity: result.quantity,
      cheapestMatch: cheapest,
      lineTotal: roundCents(cheapest.price * result.quantity),
    };
  });
  const total = roundCents(items.reduce((sum, item) => sum + item.lineTotal, 0));
  return { items, total };
}

export function buildComparisonResponse(results: ItemSearchResult[]): ComparisonResponse {
  return {
    storeTotals: buildStoreTotals(results),
    mixAndMatch: buildMixAndMatch(results),
  };
}

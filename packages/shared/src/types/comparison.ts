import type { StoreName, ProductMatch } from './product.js';

export interface StoreItemResult {
  shoppingListItemId: string;
  shoppingListItemName: string;
  quantity: number;
  match: ProductMatch | null;
  lineTotal: number;
}

export interface StoreTotal {
  store: StoreName;
  storeName: string;
  items: StoreItemResult[];
  total: number;
  unavailableCount: number;
  allItemsAvailable: boolean;
}

export interface MixAndMatchItem {
  shoppingListItemId: string;
  shoppingListItemName: string;
  quantity: number;
  cheapestMatch: ProductMatch | null;
  lineTotal: number;
}

export interface MixAndMatchResult {
  items: MixAndMatchItem[];
  total: number;
}

export interface ComparisonResponse {
  storeTotals: StoreTotal[];
  mixAndMatch: MixAndMatchResult;
}

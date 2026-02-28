import type { StoreName, ProductMatch, ItemSearchResult, ShoppingListItem } from '@grocery/shared';

export function makeMatch(overrides?: Partial<ProductMatch>): ProductMatch {
  return {
    store: 'woolworths',
    productName: 'Test Product',
    brand: 'Test Brand',
    price: 4.50,
    packageSize: '1L',
    unitPrice: 4.50,
    unitMeasure: 'L',
    unitPriceNormalised: 0.45,
    available: true,
    ...overrides,
  };
}

export function makeSearchResult(overrides?: Partial<ItemSearchResult>): ItemSearchResult {
  return {
    shoppingListItemId: 'item-1',
    shoppingListItemName: 'milk 2L',
    quantity: 1,
    matches: [],
    ...overrides,
  };
}

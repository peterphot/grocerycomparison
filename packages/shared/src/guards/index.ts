import type { ShoppingListItem } from '../types/shopping-list.js';
import type { ProductMatch } from '../types/product.js';
import type { ComparisonResponse } from '../types/comparison.js';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isShoppingListItem(value: unknown): value is ShoppingListItem {
  if (!isObject(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.quantity === 'number' &&
    typeof value.isBrandSpecific === 'boolean'
  );
}

export function isProductMatch(value: unknown): value is ProductMatch {
  if (!isObject(value)) return false;

  return (
    typeof value.store === 'string' &&
    typeof value.productName === 'string' &&
    typeof value.brand === 'string' &&
    typeof value.price === 'number' &&
    typeof value.packageSize === 'string' &&
    (value.unitPrice === null || typeof value.unitPrice === 'number') &&
    (value.unitMeasure === null || typeof value.unitMeasure === 'string') &&
    (value.unitPriceNormalised === null || typeof value.unitPriceNormalised === 'number') &&
    typeof value.available === 'boolean'
  );
}

export function isComparisonResponse(value: unknown): value is ComparisonResponse {
  if (!isObject(value)) return false;

  if (!Array.isArray(value.storeTotals)) return false;
  if (!isObject(value.mixAndMatch)) return false;
  if (!Array.isArray(value.searchResults)) return false;

  const mix = value.mixAndMatch as Record<string, unknown>;
  if (!Array.isArray(mix.items)) return false;
  if (typeof mix.total !== 'number') return false;

  return true;
}

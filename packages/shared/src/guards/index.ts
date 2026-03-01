import type { ShoppingListItem } from '../types/shopping-list';
import type { ProductMatch } from '../types/product';
import type { ComparisonResponse } from '../types/comparison';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isShoppingListItem(value: unknown): value is ShoppingListItem {
  if (!isObject(value)) return false;

  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.quantity !== 'number' ||
    typeof value.isBrandSpecific !== 'boolean'
  ) {
    return false;
  }

  // Reject empty/whitespace-only names and names exceeding 200 chars
  const trimmed = (value.name as string).trim();
  if (trimmed.length === 0 || (value.name as string).length > 200) return false;

  // Reject non-finite, non-integer, or out-of-range quantities
  const qty = value.quantity as number;
  if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty < 1 || qty > 999) return false;

  return true;
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
    typeof value.available === 'boolean' &&
    (value.productUrl === null || typeof value.productUrl === 'string')
  );
}

export function isComparisonResponse(value: unknown): value is ComparisonResponse {
  if (!isObject(value)) return false;

  if (!Array.isArray(value.storeTotals)) return false;
  if (!isObject(value.mixAndMatch)) return false;

  const mix = value.mixAndMatch as Record<string, unknown>;
  if (!Array.isArray(mix.items)) return false;
  if (typeof mix.total !== 'number') return false;

  return true;
}

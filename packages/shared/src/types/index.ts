// Shopping list types
export type { ShoppingListItem, ShoppingList } from './shopping-list.js';

// Product types
export type { StoreName, ProductMatch, ItemSearchResult } from './product.js';
export { ALL_STORES, STORE_DISPLAY_NAMES } from './product.js';

// Comparison types
export type {
  StoreTotal,
  StoreItemResult,
  MixAndMatchResult,
  MixAndMatchItem,
  ComparisonResponse,
} from './comparison.js';

// Error classes
export { StoreApiError, ApiError } from './errors.js';

// Type guards
export {
  isShoppingListItem,
  isProductMatch,
  isComparisonResponse,
} from '../guards/index.js';

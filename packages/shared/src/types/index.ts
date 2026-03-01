// Shopping list types
export type { ShoppingListItem, ShoppingList } from './shopping-list';

// Product types
export type { StoreName, ProductMatch, ItemSearchResult } from './product';
export { ALL_STORES, STORE_DISPLAY_NAMES } from './product';

// Comparison types
export type {
  StoreTotal,
  StoreItemResult,
  MixAndMatchResult,
  MixAndMatchItem,
  ComparisonResponse,
} from './comparison';

// Error classes
export { StoreApiError, ApiError } from './errors';

// Type guards
export {
  isShoppingListItem,
  isProductMatch,
  isComparisonResponse,
} from '../guards/index';

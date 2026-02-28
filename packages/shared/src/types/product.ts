export type StoreName = "woolworths" | "coles" | "aldi" | "harrisfarm";

export interface ProductMatch {
  store: StoreName;
  productName: string;
  brand: string;
  price: number;
  packageSize: string;
  unitPrice: number | null;
  unitMeasure: string | null;
  unitPriceNormalised: number | null;
  available: boolean;
}

export interface ItemSearchResult {
  shoppingListItemId: string;
  shoppingListItemName: string;
  quantity: number;
  matches: ProductMatch[];
}

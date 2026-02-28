export type StoreName = "woolworths" | "coles" | "aldi" | "harrisfarm";

export const ALL_STORES = ['woolworths', 'coles', 'aldi', 'harrisfarm'] as const satisfies readonly StoreName[];

export const STORE_DISPLAY_NAMES: Record<StoreName, string> = {
  woolworths: 'Woolworths',
  coles: 'Coles',
  aldi: 'Aldi',
  harrisfarm: 'Harris Farm',
};

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

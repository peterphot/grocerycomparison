import type {
  ComparisonResponse,
  ProductMatch,
  StoreTotal,
  StoreItemResult,
  MixAndMatchItem,
} from '@grocery/shared';

type StoreName = 'woolworths' | 'coles' | 'aldi' | 'harrisfarm';

interface ProductDef {
  productName: string;
  brand: string;
  price: number;
  packageSize: string;
  unitPrice: number | null;
  unitMeasure: string | null;
  unitPriceNormalised: number | null;
}

const STORE_DISPLAY: Record<StoreName, string> = {
  woolworths: 'Woolworths',
  coles: 'Coles',
  aldi: 'Aldi',
  harrisfarm: 'Harris Farm',
};

function makeProduct(store: StoreName, def: ProductDef): ProductMatch {
  return {
    store,
    productName: def.productName,
    brand: def.brand,
    price: def.price,
    packageSize: def.packageSize,
    unitPrice: def.unitPrice,
    unitMeasure: def.unitMeasure,
    unitPriceNormalised: def.unitPriceNormalised,
    available: true,
  };
}

function makeStoreItem(
  id: string,
  name: string,
  quantity: number,
  match: ProductMatch | null,
): StoreItemResult {
  return {
    shoppingListItemId: id,
    shoppingListItemName: name,
    quantity,
    match,
    lineTotal: match ? match.price * quantity : 0,
  };
}

function makeStoreTotal(
  store: StoreName,
  items: StoreItemResult[],
): StoreTotal {
  const unavailableCount = items.filter((i) => !i.match).length;
  return {
    store,
    storeName: STORE_DISPLAY[store],
    items,
    total: items.reduce((sum, i) => sum + i.lineTotal, 0),
    unavailableCount,
    allItemsAvailable: unavailableCount === 0,
  };
}

function makeMixItem(
  id: string,
  name: string,
  quantity: number,
  cheapestMatch: ProductMatch | null,
): MixAndMatchItem {
  return {
    shoppingListItemId: id,
    shoppingListItemName: name,
    quantity,
    cheapestMatch,
    lineTotal: cheapestMatch ? cheapestMatch.price * quantity : 0,
  };
}

// -- Product definitions --

const MILK: Record<StoreName, ProductDef> = {
  woolworths: { productName: 'Woolworths Full Cream Milk 2L', brand: 'Woolworths', price: 3.50, packageSize: '2L', unitPrice: 1.75, unitMeasure: 'L', unitPriceNormalised: 0.175 },
  coles: { productName: 'Coles Full Cream Milk 2L', brand: 'Coles', price: 3.30, packageSize: '2L', unitPrice: 1.65, unitMeasure: 'L', unitPriceNormalised: 0.165 },
  aldi: { productName: 'Farmdale Full Cream Milk 2L', brand: 'Farmdale', price: 2.69, packageSize: '2L', unitPrice: 1.35, unitMeasure: 'L', unitPriceNormalised: 0.135 },
  harrisfarm: { productName: 'Harris Farm Full Cream Milk 2L', brand: 'Harris Farm', price: 4.20, packageSize: '2L', unitPrice: 2.10, unitMeasure: 'L', unitPriceNormalised: 0.21 },
};

const BREAD: Record<string, ProductDef> = {
  woolworths: { productName: 'Woolworths White Bread 700g', brand: 'Woolworths', price: 3.80, packageSize: '700g', unitPrice: 0.54, unitMeasure: '100g', unitPriceNormalised: 0.54 },
  coles: { productName: 'Coles White Bread 700g', brand: 'Coles', price: 3.50, packageSize: '700g', unitPrice: 0.50, unitMeasure: '100g', unitPriceNormalised: 0.50 },
  // Aldi: bread unavailable (null match)
  harrisfarm: { productName: 'Harris Farm Sourdough 700g', brand: 'Harris Farm', price: 4.50, packageSize: '700g', unitPrice: 0.64, unitMeasure: '100g', unitPriceNormalised: 0.64 },
};

// -- Exported fixtures --

export const defaultResponse: ComparisonResponse = {
  storeTotals: [
    makeStoreTotal('woolworths', [
      makeStoreItem('item-1', 'milk', 1, makeProduct('woolworths', MILK.woolworths)),
      makeStoreItem('item-2', 'bread', 1, makeProduct('woolworths', BREAD.woolworths)),
    ]),
    makeStoreTotal('coles', [
      makeStoreItem('item-1', 'milk', 1, makeProduct('coles', MILK.coles)),
      makeStoreItem('item-2', 'bread', 1, makeProduct('coles', BREAD.coles)),
    ]),
    makeStoreTotal('aldi', [
      makeStoreItem('item-1', 'milk', 1, makeProduct('aldi', MILK.aldi)),
      makeStoreItem('item-2', 'bread', 1, null), // bread unavailable at Aldi
    ]),
    makeStoreTotal('harrisfarm', [
      makeStoreItem('item-1', 'milk', 1, makeProduct('harrisfarm', MILK.harrisfarm)),
      makeStoreItem('item-2', 'bread', 1, makeProduct('harrisfarm', BREAD.harrisfarm)),
    ]),
  ],
  mixAndMatch: {
    items: [
      makeMixItem('item-1', 'milk', 1, makeProduct('aldi', MILK.aldi)),
      makeMixItem('item-2', 'bread', 1, makeProduct('coles', BREAD.coles)),
    ],
    total: MILK.aldi.price + BREAD.coles.price,
  },
  searchResults: [],
};

/**
 * Build a response where "milk" has the given quantity, with lineTotal = price * quantity.
 */
export function buildQuantityResponse(quantity: number): ComparisonResponse {
  const stores: StoreName[] = ['woolworths', 'coles', 'aldi', 'harrisfarm'];

  const storeTotals = stores.map((store) =>
    makeStoreTotal(store, [
      makeStoreItem('item-1', 'milk', quantity, makeProduct(store, MILK[store])),
    ]),
  );

  return {
    storeTotals,
    mixAndMatch: {
      items: [
        makeMixItem('item-1', 'milk', quantity, makeProduct('aldi', MILK.aldi)),
      ],
      total: MILK.aldi.price * quantity,
    },
    searchResults: [],
  };
}

import type { ComparisonResponse } from '@grocery/shared';

export const mockComparisonResponse: ComparisonResponse = {
  storeTotals: [
    {
      store: 'woolworths',
      storeName: 'Woolworths',
      items: [
        { shoppingListItemId: 'item-1', shoppingListItemName: 'milk 2L', quantity: 1, match: { store: 'woolworths', productName: 'Woolworths Full Cream Milk 2L', brand: 'Woolworths', price: 3.30, packageSize: '2L', unitPrice: 1.65, unitMeasure: 'L', unitPriceNormalised: 0.165, available: true, productUrl: 'https://www.woolworths.com.au/shop/search/products?searchTerm=Woolworths%20Full%20Cream%20Milk%202L' }, lineTotal: 3.30 },
        { shoppingListItemId: 'item-2', shoppingListItemName: 'bread', quantity: 2, match: { store: 'woolworths', productName: 'Woolworths Soft White Bread 700g', brand: 'Woolworths', price: 3.80, packageSize: '700g', unitPrice: 0.54, unitMeasure: '100g', unitPriceNormalised: 0.54, available: true, productUrl: 'https://www.woolworths.com.au/shop/search/products?searchTerm=Woolworths%20Soft%20White%20Bread%20700g' }, lineTotal: 7.60 },
        { shoppingListItemId: 'item-3', shoppingListItemName: 'eggs', quantity: 1, match: { store: 'woolworths', productName: 'Woolworths Free Range Eggs 12pk', brand: 'Woolworths', price: 6.00, packageSize: '12 pack', unitPrice: null, unitMeasure: null, unitPriceNormalised: null, available: true, productUrl: 'https://www.woolworths.com.au/shop/search/products?searchTerm=Woolworths%20Free%20Range%20Eggs%2012pk' }, lineTotal: 6.00 },
      ],
      total: 16.90,
      unavailableCount: 0,
      allItemsAvailable: true,
    },
    {
      store: 'coles',
      storeName: 'Coles',
      items: [
        { shoppingListItemId: 'item-1', shoppingListItemName: 'milk 2L', quantity: 1, match: { store: 'coles', productName: 'Coles Full Cream Milk 2L', brand: 'Coles', price: 3.10, packageSize: '2L', unitPrice: 1.55, unitMeasure: 'L', unitPriceNormalised: 0.155, available: true, productUrl: 'https://www.coles.com.au/product/coles-full-cream-milk-2l-123456' }, lineTotal: 3.10 },
        { shoppingListItemId: 'item-2', shoppingListItemName: 'bread', quantity: 2, match: { store: 'coles', productName: 'Coles White Bread 700g', brand: 'Coles', price: 3.50, packageSize: '700g', unitPrice: 0.50, unitMeasure: '100g', unitPriceNormalised: 0.50, available: true, productUrl: 'https://www.coles.com.au/product/coles-white-bread-700g-234567' }, lineTotal: 7.00 },
        { shoppingListItemId: 'item-3', shoppingListItemName: 'eggs', quantity: 1, match: { store: 'coles', productName: 'Coles Free Range Eggs 12pk', brand: 'Coles', price: 5.50, packageSize: '12 pack', unitPrice: null, unitMeasure: null, unitPriceNormalised: null, available: true, productUrl: 'https://www.coles.com.au/product/coles-free-range-eggs-12pk-345678' }, lineTotal: 5.50 },
      ],
      total: 15.60,
      unavailableCount: 0,
      allItemsAvailable: true,
    },
    {
      store: 'aldi',
      storeName: 'Aldi',
      items: [
        { shoppingListItemId: 'item-1', shoppingListItemName: 'milk 2L', quantity: 1, match: { store: 'aldi', productName: 'Farmdale Milk 2L', brand: 'Farmdale', price: 2.69, packageSize: '2L', unitPrice: 1.35, unitMeasure: 'L', unitPriceNormalised: 0.135, available: true, productUrl: 'https://www.aldi.com.au/en/search/?text=Farmdale%20Milk%202L' }, lineTotal: 2.69 },
        { shoppingListItemId: 'item-2', shoppingListItemName: 'bread', quantity: 2, match: { store: 'aldi', productName: 'Baker Life White Bread 700g', brand: 'Baker Life', price: 1.89, packageSize: '700g', unitPrice: 0.27, unitMeasure: '100g', unitPriceNormalised: 0.27, available: true, productUrl: 'https://www.aldi.com.au/en/search/?text=Baker%20Life%20White%20Bread%20700g' }, lineTotal: 3.78 },
        { shoppingListItemId: 'item-3', shoppingListItemName: 'eggs', quantity: 1, match: null, lineTotal: 0 },
      ],
      total: 6.47,
      unavailableCount: 1,
      allItemsAvailable: false,
    },
    {
      store: 'harrisfarm',
      storeName: 'Harris Farm',
      items: [
        { shoppingListItemId: 'item-1', shoppingListItemName: 'milk 2L', quantity: 1, match: { store: 'harrisfarm', productName: 'Harris Farm Milk 2L', brand: 'Harris Farm', price: 3.20, packageSize: '2L', unitPrice: 1.60, unitMeasure: 'L', unitPriceNormalised: 0.160, available: true, productUrl: 'https://www.harrisfarm.com.au/products/harris-farm-milk-2l' }, lineTotal: 3.20 },
        { shoppingListItemId: 'item-2', shoppingListItemName: 'bread', quantity: 2, match: { store: 'harrisfarm', productName: 'Harris Farm Sourdough 700g', brand: 'Harris Farm', price: 5.50, packageSize: '700g', unitPrice: 0.79, unitMeasure: '100g', unitPriceNormalised: 0.79, available: true, productUrl: 'https://www.harrisfarm.com.au/products/harris-farm-sourdough-700g' }, lineTotal: 11.00 },
        { shoppingListItemId: 'item-3', shoppingListItemName: 'eggs', quantity: 1, match: { store: 'harrisfarm', productName: 'Harris Farm Free Range Eggs 12pk', brand: 'Harris Farm', price: 7.00, packageSize: '12 pack', unitPrice: null, unitMeasure: null, unitPriceNormalised: null, available: true, productUrl: 'https://www.harrisfarm.com.au/products/harris-farm-free-range-eggs-12pk' }, lineTotal: 7.00 },
      ],
      total: 21.20,
      unavailableCount: 0,
      allItemsAvailable: true,
    },
  ],
  mixAndMatch: {
    items: [
      { shoppingListItemId: 'item-1', shoppingListItemName: 'milk 2L', quantity: 1, cheapestMatch: { store: 'aldi', productName: 'Farmdale Milk 2L', brand: 'Farmdale', price: 2.69, packageSize: '2L', unitPrice: 1.35, unitMeasure: 'L', unitPriceNormalised: 0.135, available: true, productUrl: 'https://www.aldi.com.au/en/search/?text=Farmdale%20Milk%202L' }, lineTotal: 2.69 },
      { shoppingListItemId: 'item-2', shoppingListItemName: 'bread', quantity: 2, cheapestMatch: { store: 'aldi', productName: 'Baker Life White Bread 700g', brand: 'Baker Life', price: 1.89, packageSize: '700g', unitPrice: 0.27, unitMeasure: '100g', unitPriceNormalised: 0.27, available: true, productUrl: 'https://www.aldi.com.au/en/search/?text=Baker%20Life%20White%20Bread%20700g' }, lineTotal: 3.78 },
      { shoppingListItemId: 'item-3', shoppingListItemName: 'eggs', quantity: 1, cheapestMatch: { store: 'coles', productName: 'Coles Free Range Eggs 12pk', brand: 'Coles', price: 5.50, packageSize: '12 pack', unitPrice: null, unitMeasure: null, unitPriceNormalised: null, available: true, productUrl: 'https://www.coles.com.au/product/coles-free-range-eggs-12pk-345678' }, lineTotal: 5.50 },
    ],
    total: 11.97,
  },
};

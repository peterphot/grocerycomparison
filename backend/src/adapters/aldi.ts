import type { ProductMatch } from '@grocery/shared';
import { createStoreClient, type StoreClient } from '../utils/store-client';
import { parsePackageSize, computeDisplayUnitPrice, computeNormalisedUnitPrice } from '../utils/unit-price';
import { validateProductUrl } from '../utils/product-url';
import type { StoreAdapter } from './store-adapter';

interface AldiCategory {
  id: string;
  name: string;
}

interface AldiProduct {
  sku: string;
  name: string;
  brandName: string;
  urlSlugText: string;
  sellingSize: string | null;
  notForSale: boolean;
  price: { amount: number; amountRelevantDisplay: string; currencyCode: string };
  categories: AldiCategory[];
}

interface AldiResponse {
  data: AldiProduct[];
}

export class AldiAdapter implements StoreAdapter {
  readonly storeName = 'aldi' as const;
  readonly displayName = 'Aldi';
  private client: StoreClient;

  private static readonly HEADERS = {
    Origin: 'https://www.aldi.com.au',
    Referer: 'https://www.aldi.com.au/',
  };

  constructor(client?: StoreClient) {
    this.client = client ?? createStoreClient(this.storeName);
  }

  async searchProduct(query: string): Promise<ProductMatch[]> {
    const url = `https://api.aldi.com.au/v3/product-search?q=${encodeURIComponent(query)}&serviceType=walk-in`;
    const data = await this.client.get<AldiResponse>(url, { headers: AldiAdapter.HEADERS });
    const filtered = this.filterByCategory(data.data || []);
    return filtered.map(p => this.mapProduct(p));
  }

  private filterByCategory(products: AldiProduct[]): AldiProduct[] {
    if (products.length <= 1) return products;

    const topProduct = products[0];
    const topSubcategory = topProduct.categories[topProduct.categories.length - 1]?.name;

    if (!topSubcategory) return products.slice(0, 3);

    // Filter to same subcategory as top result
    const subcategoryFiltered = products.filter(p => {
      const sub = p.categories[p.categories.length - 1]?.name;
      return sub === topSubcategory;
    });
    if (subcategoryFiltered.length > 1) return subcategoryFiltered;

    // Fallback: broaden to parent category
    const topParent = topProduct.categories[0]?.name;
    if (topParent) {
      const parentFiltered = products.filter(p => p.categories[0]?.name === topParent);
      if (parentFiltered.length > 1) return parentFiltered;
    }

    // Final fallback: top 3 by API position
    return products.slice(0, 3);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.searchProduct('test');
      return true;
    } catch {
      return false;
    }
  }

  private mapProduct(p: AldiProduct): ProductMatch {
    const price = +(p.price.amount / 100).toFixed(2);
    const parsed = p.sellingSize ? parsePackageSize(p.sellingSize) : null;
    const display = parsed ? computeDisplayUnitPrice(price, parsed.qty, parsed.unit) : null;
    const normalised = parsed ? computeNormalisedUnitPrice(price, parsed.qty, parsed.unit) : null;

    const productUrl = p.urlSlugText && p.sku
      ? validateProductUrl(
          `https://www.aldi.com.au/product/${p.urlSlugText}-${p.sku}`,
          this.storeName,
        )
      : null;

    return {
      store: this.storeName,
      productName: p.name,
      brand: p.brandName,
      price,
      packageSize: p.sellingSize || '',
      unitPrice: display?.unitPrice ?? null,
      unitMeasure: display?.unitMeasure ?? null,
      unitPriceNormalised: normalised,
      available: true,
      productUrl,
    };
  }
}

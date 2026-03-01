import type { ProductMatch } from '@grocery/shared';
import { createStoreClient, type StoreClient } from '../utils/store-client';
import { parsePackageSize, computeDisplayUnitPrice, computeNormalisedUnitPrice } from '../utils/unit-price';
import { validateProductUrl } from '../utils/product-url';
import type { StoreAdapter } from './store-adapter';

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  available: boolean;
  price: string;
  price_max?: string;
  tags?: string[];
  vendor: string;
}

interface ShopifySuggestResponse {
  resources: { results: { products: ShopifyProduct[] } };
}

export class HarrisFarmAdapter implements StoreAdapter {
  readonly storeName = 'harrisfarm' as const;
  readonly displayName = 'Harris Farm';
  private client: StoreClient;

  constructor(client?: StoreClient) {
    this.client = client ?? createStoreClient(this.storeName);
  }

  async searchProduct(query: string): Promise<ProductMatch[]> {
    const url = `https://www.harrisfarm.com.au/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=10`;
    const data = await this.client.get<ShopifySuggestResponse>(url);
    return (data.resources?.results?.products || [])
      .filter(p => p.available)
      .map(p => this.mapProduct(p));
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.searchProduct('test');
      return true;
    } catch {
      return false;
    }
  }

  private mapProduct(p: ShopifyProduct): ProductMatch {
    const price = parseFloat(p.price_max ?? p.price);
    const sizeMatch = p.title.match(/(\d+(?:\.\d+)?)\s*(kg|ml|g|l)\b/i);
    const parsed = parsePackageSize(p.title);
    const display = parsed ? computeDisplayUnitPrice(price, parsed.qty, parsed.unit) : null;
    const normalised = parsed ? computeNormalisedUnitPrice(price, parsed.qty, parsed.unit) : null;

    const rawUrl = p.handle
      ? `https://www.harrisfarm.com.au/products/${p.handle}`
      : null;
    const productUrl = rawUrl ? validateProductUrl(rawUrl, this.storeName) : null;

    return {
      store: this.storeName,
      productName: p.title,
      brand: p.vendor === 'HFM' ? 'Harris Farm' : p.vendor,
      price,
      packageSize: sizeMatch ? `${sizeMatch[1]}${sizeMatch[2]}` : '',
      unitPrice: display?.unitPrice ?? null,
      unitMeasure: display?.unitMeasure ?? null,
      unitPriceNormalised: normalised,
      available: true,
      productUrl,
    };
  }
}

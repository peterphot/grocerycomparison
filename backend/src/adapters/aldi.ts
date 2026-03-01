import type { ProductMatch } from '@grocery/shared';
import { createStoreClient, type StoreClient } from '../utils/store-client';
import { parsePackageSize, computeDisplayUnitPrice, computeNormalisedUnitPrice } from '../utils/unit-price';
import type { StoreAdapter } from './store-adapter';

interface AldiProduct {
  sku: string;
  name: string;
  brandName: string;
  sellingSize: string | null;
  notForSale: boolean;
  price: { amount: number; amountRelevantDisplay: string; currencyCode: string };
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
    return (data.data || []).map(p => this.mapProduct(p));
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
    };
  }
}

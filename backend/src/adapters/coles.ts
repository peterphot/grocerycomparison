import type { ProductMatch } from '@grocery/shared';
import { StoreApiError } from '@grocery/shared';
import { createStoreClient, type StoreClient } from '../utils/store-client';
import { parsePackageSize, computeNormalisedUnitPrice } from '../utils/unit-price';
import { ColesSessionManager } from '../utils/coles-session';
import type { StoreAdapter } from './store-adapter';

interface ColesProduct {
  _type: string;
  id: number;
  name: string;
  brand?: string;
  size?: string;
  availability?: boolean;
  pricing?: {
    now: number;
    unit?: {
      price: number;
      ofMeasureUnits: string;
    };
  };
}

interface ColesSearchResponse {
  pageProps: {
    searchResults: {
      results: ColesProduct[];
    };
  };
}

function normaliseUnitMeasure(unit: string): string {
  if (unit === 'l') return 'L';
  return unit;
}

export class ColesAdapter implements StoreAdapter {
  readonly storeName = 'coles' as const;
  readonly displayName = 'Coles';
  private client: StoreClient;

  constructor(private readonly sessionManager: ColesSessionManager, client?: StoreClient) {
    this.client = client ?? createStoreClient(this.storeName);
  }

  async searchProduct(query: string): Promise<ProductMatch[]> {
    let buildId: string;
    let cookies: string;
    try {
      ({ buildId, cookies } = await this.sessionManager.ensureSession());
    } catch (err) {
      throw new StoreApiError(
        err instanceof Error ? err.message : 'Session refresh failed',
        'coles',
        undefined,
        true,
      );
    }

    const url = `https://www.coles.com.au/_next/data/${buildId}/search/products.json?keyword=${encodeURIComponent(query)}`;

    const data = await this.client.get<ColesSearchResponse>(url, {
      headers: {
        Cookie: cookies,
      },
    });

    const results = data.pageProps.searchResults.results;

    return results
      .filter((item) => item._type === 'PRODUCT' && item.availability === true && item.pricing)
      .map((item) => {
        const pricing = item.pricing!;
        const pkg = item.size ? parsePackageSize(item.size) : null;
        const unitPrice = pricing.unit?.price ?? null;
        const rawUnit = pricing.unit?.ofMeasureUnits ?? null;
        const unitMeasure = rawUnit ? normaliseUnitMeasure(rawUnit) : null;
        const unitPriceNormalised = pkg
          ? computeNormalisedUnitPrice(pricing.now, pkg.qty, pkg.unit)
          : null;

        return {
          store: this.storeName,
          productName: item.name,
          brand: item.brand || '',
          price: pricing.now,
          packageSize: item.size || '',
          unitPrice,
          unitMeasure,
          unitPriceNormalised,
          available: true,
        };
      });
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.sessionManager.ensureSession();
      return true;
    } catch {
      return false;
    }
  }
}

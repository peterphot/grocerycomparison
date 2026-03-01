import type { ProductMatch } from '@grocery/shared';
import { StoreApiError } from '@grocery/shared';
import { createStoreClient, type StoreClient } from '../utils/store-client';
import { parsePackageSize, computeNormalisedUnitPrice } from '../utils/unit-price';
import { ColesSessionManager } from '../utils/coles-session';
import { validateProductUrl } from '../utils/product-url';
import type { StoreAdapter } from './store-adapter';

interface ColesOnlineHeir {
  aisle: string;
  category: string;
  subCategory: string;
}

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
  onlineHeirs?: ColesOnlineHeir[];
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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

    const url = `https://www.coles.com.au/_next/data/${buildId}/search/products.json?q=${encodeURIComponent(query)}`;

    const data = await this.client.get<ColesSearchResponse>(url, {
      headers: {
        Cookie: cookies,
      },
    });

    const results = data.pageProps.searchResults.results;
    const available = results.filter(
      (item) => item._type === 'PRODUCT' && item.availability === true && item.pricing,
    );
    const filtered = this.filterByCategory(available);

    return filtered
      .map((item) => {
        const pricing = item.pricing!;
        const pkg = item.size ? parsePackageSize(item.size) : null;
        const unitPrice = pricing.unit?.price ?? null;
        const rawUnit = pricing.unit?.ofMeasureUnits ?? null;
        const unitMeasure = rawUnit ? normaliseUnitMeasure(rawUnit) : null;
        const unitPriceNormalised = pkg
          ? computeNormalisedUnitPrice(pricing.now, pkg.qty, pkg.unit)
          : null;

        const productUrl = validateProductUrl(
          `https://www.coles.com.au/product/${slugify(item.name)}-${item.id}`,
          this.storeName,
        );

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
          productUrl,
        };
      });
  }

  private filterByCategory(products: ColesProduct[]): ColesProduct[] {
    if (products.length <= 1) return products;

    const topProduct = products[0];
    const topAisle = topProduct.onlineHeirs?.[0]?.aisle;

    if (!topAisle) return products.slice(0, 3);

    // Filter to same aisle as top result (most specific category)
    const aisleFiltered = products.filter(
      (p) => p.onlineHeirs?.[0]?.aisle === topAisle,
    );
    if (aisleFiltered.length > 1) return aisleFiltered;

    // Fallback: broaden to category level (e.g., "Milk")
    const topCategory = topProduct.onlineHeirs?.[0]?.category;
    if (topCategory) {
      const categoryFiltered = products.filter(
        (p) => p.onlineHeirs?.[0]?.category === topCategory,
      );
      if (categoryFiltered.length > 1) return categoryFiltered;
    }

    // Final fallback: top 3 by API position
    return products.slice(0, 3);
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

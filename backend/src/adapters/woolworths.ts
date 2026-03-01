import type { ProductMatch } from '@grocery/shared';
import { createStoreClient, type StoreClient } from '../utils/store-client';
import { parsePackageSize, computeNormalisedUnitPrice } from '../utils/unit-price';
import type { StoreAdapter } from './store-adapter';

interface WoolworthsProduct {
  DisplayName: string;
  Price: number;
  PackageSize: string;
  CupPrice: number;
  CupMeasure: string;
  Brand: string;
  IsAvailable: boolean;
}

interface WoolworthsResponse {
  Products: { Products: WoolworthsProduct[] }[];
}

export class WoolworthsAdapter implements StoreAdapter {
  readonly storeName = 'woolworths' as const;
  readonly displayName = 'Woolworths';
  private client: StoreClient;

  constructor(client?: StoreClient) {
    this.client = client ?? createStoreClient(this.storeName);
  }

  async searchProduct(query: string): Promise<ProductMatch[]> {
    const url = `https://www.woolworths.com.au/apis/ui/Search/products?searchTerm=${encodeURIComponent(query)}&pageSize=10`;
    const data = await this.client.get<WoolworthsResponse>(url);
    const products = (data.Products || []).flatMap(group => group.Products || []);
    return products.filter(p => p.IsAvailable).map(p => this.mapProduct(p));
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.get('https://www.woolworths.com.au/apis/ui/Search/products?searchTerm=test&pageSize=1');
      return true;
    } catch {
      return false;
    }
  }

  private mapProduct(p: WoolworthsProduct): ProductMatch {
    const unitPrice = p.CupPrice ?? null;
    const unitMeasure = p.CupMeasure ? this.normaliseMeasure(p.CupMeasure) : null;

    const packageParsed = parsePackageSize(p.PackageSize || '');
    const unitPriceNormalised = packageParsed
      ? computeNormalisedUnitPrice(p.Price, packageParsed.qty, packageParsed.unit)
      : null;

    const productUrl = `https://www.woolworths.com.au/shop/search/products?searchTerm=${encodeURIComponent(p.DisplayName)}`;

    return {
      store: this.storeName,
      productName: p.DisplayName,
      brand: p.Brand || '',
      price: p.Price,
      packageSize: p.PackageSize || '',
      unitPrice,
      unitMeasure,
      unitPriceNormalised,
      available: true,
      productUrl,
    };
  }

  private normaliseMeasure(cupMeasure: string): string {
    // Normalise to consistent casing: "1L" -> "L", "1KG" -> "kg", "100G" -> "100g"
    // Strip leading "1" when followed by a unit letter (e.g., "1L" -> "L")
    const stripped = cupMeasure.replace(/^1(?=[a-zA-Z])/, '') || cupMeasure;
    // Lowercase everything except "L" (litre) which is conventionally uppercase
    // Match the number prefix + unit suffix pattern
    const match = stripped.match(/^(\d*)([a-zA-Z]+)$/);
    if (!match) return stripped;
    const [, num, unit] = match;
    const lowerUnit = unit.toLowerCase();
    // "L" stays uppercase, everything else lowercase: g, kg, ml
    const normalisedUnit = lowerUnit === 'l' ? 'L' : lowerUnit;
    return num + normalisedUnit;
  }
}

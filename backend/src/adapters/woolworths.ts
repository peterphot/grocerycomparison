import type { ProductMatch } from '@grocery/shared';
import { httpGet } from '../utils/http-client';
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

  async searchProduct(query: string): Promise<ProductMatch[]> {
    const url = `https://www.woolworths.com.au/apis/ui/Search/products?searchTerm=${encodeURIComponent(query)}&pageSize=24`;
    const data = await httpGet<WoolworthsResponse>(url, { store: this.storeName });
    const products = (data.Products || []).flatMap(group => group.Products || []);
    return products.filter(p => p.IsAvailable).map(p => this.mapProduct(p));
  }

  async isAvailable(): Promise<boolean> {
    try {
      await httpGet('https://www.woolworths.com.au/apis/ui/Search/products?searchTerm=test&pageSize=1', { store: this.storeName });
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
    };
  }

  private normaliseMeasure(cupMeasure: string): string {
    // "1L" -> "L", "1kg" -> "kg", "100g" -> "100g", "100ml" -> "100ml"
    return cupMeasure.replace(/^1(?=[a-zA-Z])/, '') || cupMeasure;
  }
}

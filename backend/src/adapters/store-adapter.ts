import type { ProductMatch, StoreName } from '@grocery/shared';

export interface StoreAdapter {
  readonly storeName: StoreName;
  readonly displayName: string;
  searchProduct(query: string): Promise<ProductMatch[]>;
  isAvailable(): Promise<boolean>;
}

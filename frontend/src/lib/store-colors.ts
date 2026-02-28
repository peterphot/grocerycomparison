import type { StoreName } from '@grocery/shared';

export type StoreColorKey = StoreName | 'mixandmatch';

export const STORE_COLORS: Record<StoreColorKey, string> = {
  woolworths: '#00A347',
  coles: '#E2001A',
  aldi: '#003087',
  harrisfarm: '#2D5E2A',
  mixandmatch: '#7C3AED',
};

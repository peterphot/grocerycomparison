import type { StoreName } from '@grocery/shared';
import { ALL_STORES, STORE_DISPLAY_NAMES as _STORE_DISPLAY_NAMES } from '@grocery/shared';

export type StoreColorKey = StoreName | 'mixandmatch';

export const STORE_COLORS: Record<StoreColorKey, string> = {
  woolworths: '#00A347',
  coles: '#E2001A',
  aldi: '#003087',
  harrisfarm: '#2D5E2A',
  mixandmatch: '#7C3AED',
};

export const STORE_DISPLAY_NAMES = _STORE_DISPLAY_NAMES;

export const ALL_STORE_KEYS: readonly StoreName[] = ALL_STORES;

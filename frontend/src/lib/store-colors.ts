import type { StoreName } from '@grocery/shared';

export type StoreColorKey = StoreName | 'mixandmatch';

export const STORE_COLORS: Record<StoreColorKey, string> = {
  woolworths: '#00A347',
  coles: '#E2001A',
  aldi: '#003087',
  harrisfarm: '#2D5E2A',
  mixandmatch: '#7C3AED',
};

export const STORE_DISPLAY_NAMES: Record<StoreName, string> = {
  woolworths: 'Woolworths',
  coles: 'Coles',
  aldi: 'Aldi',
  harrisfarm: 'Harris Farm',
};

export const ALL_STORE_KEYS: StoreName[] = ['woolworths', 'coles', 'aldi', 'harrisfarm'];

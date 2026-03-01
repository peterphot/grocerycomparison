import type { StoreName } from '@grocery/shared';

const ALLOWED_PRODUCT_HOSTS: Record<StoreName, string[]> = {
  woolworths: ['www.woolworths.com.au'],
  coles: ['www.coles.com.au'],
  aldi: ['www.aldi.com.au'],
  harrisfarm: ['www.harrisfarm.com.au'],
};

export function validateProductUrl(url: string, store: StoreName): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    const allowed = ALLOWED_PRODUCT_HOSTS[store];
    if (!allowed.includes(parsed.hostname)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

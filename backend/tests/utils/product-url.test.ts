import { describe, it, expect } from 'vitest';
import { validateProductUrl } from '../../src/utils/product-url';

describe('validateProductUrl', () => {
  it('accepts valid Woolworths product URL', () => {
    expect(
      validateProductUrl('https://www.woolworths.com.au/shop/productdetails/888137/milk', 'woolworths'),
    ).toBe('https://www.woolworths.com.au/shop/productdetails/888137/milk');
  });

  it('accepts valid Coles product URL', () => {
    expect(
      validateProductUrl('https://www.coles.com.au/product/full-cream-milk-123', 'coles'),
    ).toBe('https://www.coles.com.au/product/full-cream-milk-123');
  });

  it('accepts valid Aldi product URL', () => {
    expect(
      validateProductUrl('https://www.aldi.com.au/product/milk-2l-000000000000567890', 'aldi'),
    ).toBe('https://www.aldi.com.au/product/milk-2l-000000000000567890');
  });

  it('accepts valid Harris Farm product URL', () => {
    expect(
      validateProductUrl('https://www.harrisfarm.com.au/products/milk-2l', 'harrisfarm'),
    ).toBe('https://www.harrisfarm.com.au/products/milk-2l');
  });

  it('rejects URL with wrong hostname for store', () => {
    expect(
      validateProductUrl('https://www.evil.com/shop/productdetails/888137/milk', 'woolworths'),
    ).toBeNull();
  });

  it('rejects URL with http protocol', () => {
    expect(
      validateProductUrl('http://www.woolworths.com.au/shop/productdetails/888137/milk', 'woolworths'),
    ).toBeNull();
  });

  it('rejects javascript: protocol', () => {
    expect(
      validateProductUrl('javascript:alert(1)', 'woolworths'),
    ).toBeNull();
  });

  it('rejects invalid URL string', () => {
    expect(
      validateProductUrl('not-a-url', 'woolworths'),
    ).toBeNull();
  });

  it('rejects mismatched store and host', () => {
    expect(
      validateProductUrl('https://www.coles.com.au/product/milk-123', 'woolworths'),
    ).toBeNull();
  });
});

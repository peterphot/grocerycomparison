import { describe, it, expect } from 'vitest';
import {
  parsePackageSize,
  computeDisplayUnitPrice,
  computeNormalisedUnitPrice,
} from '../../src/utils/unit-price.js';

describe('parsePackageSize', () => {
  it('parses "500g" to { qty: 500, unit: "g" }', () => {
    expect(parsePackageSize('500g')).toEqual({ qty: 500, unit: 'g' });
  });

  it('parses "2kg" to { qty: 2000, unit: "g" }', () => {
    expect(parsePackageSize('2kg')).toEqual({ qty: 2000, unit: 'g' });
  });

  it('parses "1.5L" to { qty: 1500, unit: "ml" }', () => {
    expect(parsePackageSize('1.5L')).toEqual({ qty: 1500, unit: 'ml' });
  });

  it('parses "600ml" to { qty: 600, unit: "ml" }', () => {
    expect(parsePackageSize('600ml')).toEqual({ qty: 600, unit: 'ml' });
  });

  it('parses "2 x 250ml" to { qty: 500, unit: "ml" }', () => {
    expect(parsePackageSize('2 x 250ml')).toEqual({ qty: 500, unit: 'ml' });
  });

  it('parses "380g" to { qty: 380, unit: "g" }', () => {
    expect(parsePackageSize('380g')).toEqual({ qty: 380, unit: 'g' });
  });

  it('returns null for "16oz" (imperial not supported)', () => {
    expect(parsePackageSize('16oz')).toBeNull();
  });

  it('returns null for "1lb" (imperial not supported)', () => {
    expect(parsePackageSize('1lb')).toBeNull();
  });

  it('is case insensitive for "500G"', () => {
    expect(parsePackageSize('500G')).toEqual({ qty: 500, unit: 'g' });
  });

  it('is case insensitive for "2KG"', () => {
    expect(parsePackageSize('2KG')).toEqual({ qty: 2000, unit: 'g' });
  });

  it('is case insensitive for "1.5l"', () => {
    expect(parsePackageSize('1.5l')).toEqual({ qty: 1500, unit: 'ml' });
  });

  it('returns null for empty string', () => {
    expect(parsePackageSize('')).toBeNull();
  });

  it('returns null for "pack of 4"', () => {
    expect(parsePackageSize('pack of 4')).toBeNull();
  });

  it('returns null for "each"', () => {
    expect(parsePackageSize('each')).toBeNull();
  });

  it('returns null for "assorted"', () => {
    expect(parsePackageSize('assorted')).toBeNull();
  });
});

describe('computeDisplayUnitPrice', () => {
  it('500g @ $4.45 -> { unitPrice: 0.89, unitMeasure: "100g" }', () => {
    expect(computeDisplayUnitPrice(4.45, 500, 'g')).toEqual({
      unitPrice: 0.89,
      unitMeasure: '100g',
    });
  });

  it('2kg @ $11.00 -> { unitPrice: 5.50, unitMeasure: "kg" }', () => {
    expect(computeDisplayUnitPrice(11.0, 2000, 'g')).toEqual({
      unitPrice: 5.50,
      unitMeasure: 'kg',
    });
  });

  it('600ml @ $1.50 -> { unitPrice: 0.25, unitMeasure: "100ml" }', () => {
    expect(computeDisplayUnitPrice(1.5, 600, 'ml')).toEqual({
      unitPrice: 0.25,
      unitMeasure: '100ml',
    });
  });

  it('2L @ $3.10 -> { unitPrice: 1.55, unitMeasure: "L" }', () => {
    expect(computeDisplayUnitPrice(3.1, 2000, 'ml')).toEqual({
      unitPrice: 1.55,
      unitMeasure: 'L',
    });
  });

  it('count/each -> { unitPrice: price, unitMeasure: "each" }', () => {
    expect(computeDisplayUnitPrice(2.99, 1, 'each')).toEqual({
      unitPrice: 2.99,
      unitMeasure: 'each',
    });
  });

  it('returns null for zero quantity', () => {
    expect(computeDisplayUnitPrice(5.0, 0, 'g')).toBeNull();
  });

  it('returns null for NaN price', () => {
    expect(computeDisplayUnitPrice(NaN, 500, 'g')).toBeNull();
  });

  it('returns null for Infinity quantity', () => {
    expect(computeDisplayUnitPrice(5.0, Infinity, 'ml')).toBeNull();
  });

  it('returns null for NaN quantity', () => {
    expect(computeDisplayUnitPrice(5.0, NaN, 'g')).toBeNull();
  });
});

describe('computeNormalisedUnitPrice', () => {
  it('500g @ $4.45 -> 0.89 (per 100g)', () => {
    expect(computeNormalisedUnitPrice(4.45, 500, 'g')).toBe(0.89);
  });

  it('2kg @ $11.00 -> 0.55 (per 100g)', () => {
    expect(computeNormalisedUnitPrice(11.0, 2000, 'g')).toBe(0.55);
  });

  it('600ml @ $1.50 -> 0.25 (per 100ml)', () => {
    expect(computeNormalisedUnitPrice(1.5, 600, 'ml')).toBe(0.25);
  });

  it('2L @ $3.10 -> 0.155 (per 100ml)', () => {
    expect(computeNormalisedUnitPrice(3.1, 2000, 'ml')).toBeCloseTo(0.155, 3);
  });

  it('returns null for count-based', () => {
    expect(computeNormalisedUnitPrice(2.99, 1, 'each')).toBeNull();
  });

  it('returns null for NaN price', () => {
    expect(computeNormalisedUnitPrice(NaN, 500, 'g')).toBeNull();
  });

  it('returns null for Infinity price', () => {
    expect(computeNormalisedUnitPrice(Infinity, 500, 'ml')).toBeNull();
  });

  it('returns null for NaN quantity', () => {
    expect(computeNormalisedUnitPrice(5.0, NaN, 'g')).toBeNull();
  });
});

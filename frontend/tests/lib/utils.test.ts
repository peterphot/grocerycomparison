import { describe, it, expect } from 'vitest';
import { formatPrice, formatUnitPrice } from '../../src/lib/utils';

describe('formatPrice', () => {
  it('formats 4.65 to "$4.65"', () => {
    expect(formatPrice(4.65)).toBe('$4.65');
  });

  it('formats 4.6 to "$4.60"', () => {
    expect(formatPrice(4.6)).toBe('$4.60');
  });

  it('rounds 1.5678 to "$1.57"', () => {
    expect(formatPrice(1.5678)).toBe('$1.57');
  });

  it('formats 0 to "$0.00"', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});

describe('formatUnitPrice', () => {
  it('formats (1.55, "L") to "$1.55 / L"', () => {
    expect(formatUnitPrice(1.55, 'L')).toBe('$1.55 / L');
  });

  it('formats (0.89, "100g") to "$0.89 / 100g"', () => {
    expect(formatUnitPrice(0.89, '100g')).toBe('$0.89 / 100g');
  });
});

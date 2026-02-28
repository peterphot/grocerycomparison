// Metric only — Australian market

export type BaseUnit = 'g' | 'ml';
export type UnitType = BaseUnit | 'each';

export interface PackageSize {
  qty: number;
  unit: BaseUnit;
}

const MULTI_PACK_RE = /(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|ml|g|l)\b/i;
const SINGLE_RE = /(\d+(?:\.\d+)?)\s*(kg|ml|g|l)\b/i;

function normalise(qty: number, unit: string): PackageSize | null {
  const u = unit.toLowerCase();
  if (u === 'kg') return { qty: qty * 1000, unit: 'g' };
  if (u === 'l') return { qty: qty * 1000, unit: 'ml' };
  if (u === 'g') return { qty, unit: 'g' };
  if (u === 'ml') return { qty, unit: 'ml' };
  return null;
}

export function parsePackageSize(sizeString: string): PackageSize | null {
  let match = sizeString.match(MULTI_PACK_RE);
  if (match) {
    const count = parseFloat(match[1]);
    const perUnit = parseFloat(match[2]);
    return normalise(count * perUnit, match[3]);
  }
  match = sizeString.match(SINGLE_RE);
  if (match) {
    return normalise(parseFloat(match[1]), match[2]);
  }
  return null;
}

export function computeDisplayUnitPrice(
  price: number,
  quantityInBaseUnit: number,
  unit: UnitType,
): { unitPrice: number; unitMeasure: string } | null {
  if (!Number.isFinite(price) || !Number.isFinite(quantityInBaseUnit)) return null;
  if (unit === 'each') {
    return { unitPrice: price, unitMeasure: 'each' };
  }
  if (quantityInBaseUnit <= 0) return null;

  if (unit === 'g') {
    if (quantityInBaseUnit >= 1000) {
      return { unitPrice: +((price / quantityInBaseUnit) * 1000).toFixed(2), unitMeasure: 'kg' };
    }
    return { unitPrice: +((price / quantityInBaseUnit) * 100).toFixed(2), unitMeasure: '100g' };
  }
  if (unit === 'ml') {
    if (quantityInBaseUnit >= 1000) {
      return { unitPrice: +((price / quantityInBaseUnit) * 1000).toFixed(2), unitMeasure: 'L' };
    }
    return { unitPrice: +((price / quantityInBaseUnit) * 100).toFixed(2), unitMeasure: '100ml' };
  }
  return null;
}

export function computeNormalisedUnitPrice(
  price: number,
  quantityInBaseUnit: number,
  unit: UnitType,
): number | null {
  if (!Number.isFinite(price) || !Number.isFinite(quantityInBaseUnit)) return null;
  if (unit === 'each') return null;
  if (quantityInBaseUnit <= 0) return null;
  // Always per 100 base units (100g or 100ml) — 2dp for display, 3dp for normalised comparison
  return +((price / quantityInBaseUnit) * 100).toFixed(3);
}

import type { StoreTotal } from '@grocery/shared';

const priceFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
});

export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}

export function formatUnitPrice(unitPrice: number, unitMeasure: string): string {
  return `${priceFormatter.format(unitPrice)} / ${unitMeasure}`;
}

export function findCheapestStore(storeTotals: StoreTotal[]): StoreTotal {
  const fullyAvailable = storeTotals.filter(st => st.allItemsAvailable);
  const pool = fullyAvailable.length > 0 ? fullyAvailable : storeTotals;
  return pool.reduce((min, st) => (st.total < min.total ? st : min), pool[0]);
}

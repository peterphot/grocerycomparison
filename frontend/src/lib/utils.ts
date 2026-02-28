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
  const withResults = storeTotals.filter(st => st.total > 0);
  if (withResults.length === 0) return storeTotals[0];
  const fullyAvailable = withResults.filter(st => st.allItemsAvailable);
  const pool = fullyAvailable.length > 0 ? fullyAvailable : withResults;
  return pool.reduce((min, st) => (st.total < min.total ? st : min), pool[0]);
}

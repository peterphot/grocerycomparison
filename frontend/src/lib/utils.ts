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

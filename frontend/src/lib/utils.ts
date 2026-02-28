export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatUnitPrice(unitPrice: number, unitMeasure: string): string {
  return `$${unitPrice.toFixed(2)} / ${unitMeasure}`;
}

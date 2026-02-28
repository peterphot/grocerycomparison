import type { StoreItemResult } from '@grocery/shared';
import { formatPrice, formatUnitPrice } from '../../lib/utils';

interface ItemRowProps {
  item: StoreItemResult;
}

export function ItemRow({ item }: ItemRowProps) {
  if (!item.match) {
    return (
      <div className="py-2 px-3 border-b border-zinc-100">
        <p className="text-sm text-zinc-400 italic">Not available</p>
      </div>
    );
  }

  return (
    <div className="py-2 px-3 border-b border-zinc-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-zinc-900">{item.match.productName}</p>
          <p className="text-xs text-zinc-500">{item.match.packageSize}</p>
          {item.match.unitPrice !== null && item.match.unitMeasure !== null && (
            <p className="text-xs text-zinc-400">{formatUnitPrice(item.match.unitPrice, item.match.unitMeasure)}</p>
          )}
        </div>
        <p className="text-sm font-semibold text-zinc-900">{formatPrice(item.lineTotal)}</p>
      </div>
    </div>
  );
}

import { memo } from 'react';
import type { ProductMatch } from '@grocery/shared';
import { formatPrice, formatUnitPrice } from '../../lib/utils';

interface ItemRowProps {
  match: ProductMatch | null;
  lineTotal: number;
  shoppingListItemName?: string;
  quantity?: number;
}

export const ItemRow = memo(function ItemRow({ match, lineTotal, shoppingListItemName, quantity }: ItemRowProps) {
  if (!match) {
    return (
      <div className="py-2 px-3 border-b border-zinc-100">
        {shoppingListItemName && (
          <p className="text-xs font-medium text-zinc-700 mb-0.5">{shoppingListItemName}</p>
        )}
        <p className="text-sm text-zinc-400 italic">Not available</p>
      </div>
    );
  }

  return (
    <div className="py-2 px-3 border-b border-zinc-100">
      {shoppingListItemName && (
        <p className="text-xs font-medium text-zinc-700 mb-0.5">{shoppingListItemName}</p>
      )}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-zinc-900">{match.productName}</p>
          <p className="text-xs text-zinc-500">{match.packageSize}</p>
          {match.unitPrice !== null && match.unitMeasure !== null && (
            <p className="text-xs text-zinc-400">{formatUnitPrice(match.unitPrice, match.unitMeasure)}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {quantity !== undefined && quantity > 1 && (
            <span className="bg-zinc-100 text-xs text-zinc-500 rounded px-1 py-0.5">
              qty {quantity}
            </span>
          )}
          <p className="text-sm font-semibold text-zinc-900">{formatPrice(lineTotal)}</p>
        </div>
      </div>
    </div>
  );
});

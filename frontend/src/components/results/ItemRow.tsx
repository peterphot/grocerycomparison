import { memo } from 'react';
import type { ProductMatch } from '@grocery/shared';
import { STORE_COLORS, type StoreColorKey } from '../../lib/store-colors';
import { formatPrice, formatUnitPrice } from '../../lib/utils';

const STORE_LABELS: Record<string, string> = {
  woolworths: 'Woolworths',
  coles: 'Coles',
  aldi: 'Aldi',
  harrisfarm: 'Harris Farm',
};

interface ItemRowProps {
  match: ProductMatch | null;
  lineTotal: number;
  shoppingListItemName?: string;
  quantity?: number;
  showStoreSource?: boolean;
}

export const ItemRow = memo(function ItemRow({ match, lineTotal, shoppingListItemName, quantity, showStoreSource }: ItemRowProps) {
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
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-zinc-900 truncate">{match.productName}</p>
            {showStoreSource && (
              <span
                className="flex-shrink-0 text-[10px] font-medium text-white rounded px-1 py-0.5 leading-tight"
                style={{ backgroundColor: STORE_COLORS[match.store as StoreColorKey] ?? '#6b7280' }}
              >
                {STORE_LABELS[match.store] ?? match.store}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">{match.packageSize}</p>
          {match.unitPrice !== null && match.unitMeasure !== null && (
            <p className="text-xs text-zinc-400">{formatUnitPrice(match.unitPrice, match.unitMeasure)}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {quantity !== undefined && (
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

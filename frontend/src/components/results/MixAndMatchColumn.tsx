import type { MixAndMatchResult } from '@grocery/shared';
import { StoreHeader } from './StoreHeader';
import { formatPrice, formatUnitPrice } from '../../lib/utils';

interface MixAndMatchColumnProps {
  mixAndMatch: MixAndMatchResult;
}

export function MixAndMatchColumn({ mixAndMatch }: MixAndMatchColumnProps) {
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <StoreHeader storeName="Mix & Match" store="mixandmatch" isCheapest={false} />
      {mixAndMatch.items.map((item) => (
        <div key={item.shoppingListItemId} className="py-2 px-3 border-b border-zinc-100">
          {item.cheapestMatch ? (
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-zinc-900">{item.cheapestMatch.productName}</p>
                <p className="text-xs text-zinc-500">{item.cheapestMatch.packageSize}</p>
                {item.cheapestMatch.unitPrice !== null && item.cheapestMatch.unitMeasure !== null && (
                  <p className="text-xs text-zinc-400">{formatUnitPrice(item.cheapestMatch.unitPrice, item.cheapestMatch.unitMeasure)}</p>
                )}
              </div>
              <p className="text-sm font-semibold text-zinc-900">{formatPrice(item.lineTotal)}</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 italic">Not available</p>
          )}
        </div>
      ))}
      <div className="px-3 py-2 bg-zinc-50 font-semibold text-right text-sm">
        {formatPrice(mixAndMatch.total)}
      </div>
    </div>
  );
}

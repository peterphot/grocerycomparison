import type { MixAndMatchResult } from '@grocery/shared';
import { StoreHeader } from './StoreHeader';
import { ItemRow } from './ItemRow';
import { formatPrice } from '../../lib/utils';

interface MixAndMatchColumnProps {
  mixAndMatch: MixAndMatchResult;
}

export function MixAndMatchColumn({ mixAndMatch }: MixAndMatchColumnProps) {
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <StoreHeader storeName="Mix & Match" store="mixandmatch" isCheapest={false} />
      {mixAndMatch.items.map((item) => (
        <ItemRow key={item.shoppingListItemId} match={item.cheapestMatch} lineTotal={item.lineTotal} />
      ))}
      <div className="px-3 py-2 bg-zinc-50 font-semibold text-right text-sm">
        {formatPrice(mixAndMatch.total)}
      </div>
    </div>
  );
}

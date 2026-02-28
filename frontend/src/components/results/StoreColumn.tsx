import type { StoreTotal } from '@grocery/shared';
import { StoreHeader } from './StoreHeader';
import { ItemRow } from './ItemRow';
import { formatPrice } from '../../lib/utils';

interface StoreColumnProps {
  storeTotal: StoreTotal;
  isCheapest: boolean;
}

export function StoreColumn({ storeTotal, isCheapest }: StoreColumnProps) {
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <StoreHeader storeName={storeTotal.storeName} store={storeTotal.store} isCheapest={isCheapest} />
      {storeTotal.items.map((item) => (
        <ItemRow key={item.shoppingListItemId} match={item.match} lineTotal={item.lineTotal} />
      ))}
      <div className="px-3 py-2 bg-zinc-50 font-semibold text-right text-sm">
        {formatPrice(storeTotal.total)}
      </div>
    </div>
  );
}

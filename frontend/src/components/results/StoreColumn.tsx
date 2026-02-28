import type { StoreTotal } from '@grocery/shared';
import { StoreHeader } from './StoreHeader';
import { ItemRow } from './ItemRow';
import { ResultColumn } from './ResultColumn';

interface StoreColumnProps {
  storeTotal: StoreTotal;
  isCheapest: boolean;
}

export function StoreColumn({ storeTotal, isCheapest }: StoreColumnProps) {
  return (
    <ResultColumn
      header={<StoreHeader storeName={storeTotal.storeName} store={storeTotal.store} isCheapest={isCheapest} />}
      total={storeTotal.total}
    >
      {storeTotal.items.map((item) => (
        <ItemRow key={item.shoppingListItemId} match={item.match} lineTotal={item.lineTotal} />
      ))}
    </ResultColumn>
  );
}

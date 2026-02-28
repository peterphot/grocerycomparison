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
      header={
        <StoreHeader
          storeName={storeTotal.storeName}
          store={storeTotal.store}
          isCheapest={isCheapest}
          total={storeTotal.total}
        />
      }
      total={storeTotal.total}
      data-testid={`store-column-${storeTotal.store}`}
    >
      {storeTotal.items.map((item) => (
        <ItemRow
          key={item.shoppingListItemId}
          match={item.match}
          lineTotal={item.lineTotal}
          shoppingListItemName={item.shoppingListItemName}
          quantity={item.quantity}
        />
      ))}
      {storeTotal.unavailableCount > 0 && (
        <div className="px-3 py-1.5 text-xs text-zinc-500 bg-zinc-50">
          {storeTotal.unavailableCount} {storeTotal.unavailableCount === 1 ? 'item' : 'items'} unavailable
        </div>
      )}
    </ResultColumn>
  );
}

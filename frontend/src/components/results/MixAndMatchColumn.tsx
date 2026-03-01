import { memo } from 'react';
import type { MixAndMatchResult } from '@grocery/shared';
import { StoreHeader } from './StoreHeader';
import { ItemRow } from './ItemRow';
import { ResultColumn } from './ResultColumn';

interface MixAndMatchColumnProps {
  mixAndMatch: MixAndMatchResult;
}

export const MixAndMatchColumn = memo(function MixAndMatchColumn({ mixAndMatch }: MixAndMatchColumnProps) {
  return (
    <ResultColumn
      header={
        <StoreHeader
          storeName="Mix & Match"
          store="mixandmatch"
          isCheapest={false}
          total={mixAndMatch.total}
        />
      }
      total={mixAndMatch.total}
      className="border-2 border-violet-600 shadow-[0_4px_16px_rgba(124,58,237,0.12)]"
    >
      {mixAndMatch.items.map((item) => (
        <ItemRow
          key={item.shoppingListItemId}
          match={item.cheapestMatch}
          lineTotal={item.lineTotal}
          shoppingListItemName={item.shoppingListItemName}
          quantity={item.quantity}
          showStoreSource={true}
        />
      ))}
    </ResultColumn>
  );
});

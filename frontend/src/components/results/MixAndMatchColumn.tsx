import type { MixAndMatchResult } from '@grocery/shared';
import { StoreHeader } from './StoreHeader';
import { ItemRow } from './ItemRow';
import { ResultColumn } from './ResultColumn';

interface MixAndMatchColumnProps {
  mixAndMatch: MixAndMatchResult;
}

export function MixAndMatchColumn({ mixAndMatch }: MixAndMatchColumnProps) {
  return (
    <ResultColumn
      header={<StoreHeader storeName="Mix & Match" store="mixandmatch" isCheapest={false} />}
      total={mixAndMatch.total}
    >
      {mixAndMatch.items.map((item) => (
        <ItemRow
          key={item.shoppingListItemId}
          match={item.cheapestMatch}
          lineTotal={item.lineTotal}
          shoppingListItemName={item.shoppingListItemName}
        />
      ))}
    </ResultColumn>
  );
}

import { useMemo } from 'react';
import type { ComparisonResponse } from '@grocery/shared';
import { StoreColumn } from './StoreColumn';
import { MixAndMatchColumn } from './MixAndMatchColumn';
import { formatPrice, findCheapestStore } from '../../lib/utils';

interface ComparisonResultsProps {
  response: ComparisonResponse;
}

export function ComparisonResults({ response }: ComparisonResultsProps) {
  if (response.storeTotals.length === 0) return null;

  const cheapestStore = useMemo(
    () => findCheapestStore(response.storeTotals),
    [response.storeTotals],
  );

  const columnCount = response.storeTotals.length + 1;

  return (
    <div>
      <div className="mb-4 p-3 bg-green-50 rounded-xl text-center text-sm font-medium text-green-800">
        Best single store: {cheapestStore.storeName} {formatPrice(cheapestStore.total)}
      </div>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {response.storeTotals.map((storeTotal) => (
          <StoreColumn
            key={storeTotal.store}
            storeTotal={storeTotal}
            isCheapest={storeTotal.store === cheapestStore.store}
          />
        ))}
        <MixAndMatchColumn mixAndMatch={response.mixAndMatch} />
      </div>
    </div>
  );
}

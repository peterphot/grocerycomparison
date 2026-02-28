import type { ComparisonResponse } from '@grocery/shared';
import { StoreColumn } from './StoreColumn';
import { MixAndMatchColumn } from './MixAndMatchColumn';
import { formatPrice } from '../../lib/utils';

interface ComparisonResultsProps {
  response: ComparisonResponse;
}

export function ComparisonResults({ response }: ComparisonResultsProps) {
  if (response.storeTotals.length === 0) return null;

  const cheapestStore = response.storeTotals.reduce((min, st) =>
    st.total < min.total ? st : min
  , response.storeTotals[0]);

  return (
    <div>
      <div className="mb-4 p-3 bg-green-50 rounded-xl text-center text-sm font-medium text-green-800">
        Best single store: {cheapestStore.storeName} {formatPrice(cheapestStore.total)}
      </div>
      <div className="grid grid-cols-5 gap-4">
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

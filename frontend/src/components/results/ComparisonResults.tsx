'use client';

import { useMemo, useState } from 'react';
import type { ComparisonResponse, StoreTotal } from '@grocery/shared';
import { StoreColumn } from './StoreColumn';
import { MixAndMatchColumn } from './MixAndMatchColumn';
import { StoreHeader } from './StoreHeader';
import { ItemRow } from './ItemRow';
import { ResultColumn } from './ResultColumn';
import { formatPrice, findCheapestStore } from '../../lib/utils';
import { STORE_COLORS, type StoreColorKey } from '../../lib/store-colors';

interface ComparisonResultsProps {
  response: ComparisonResponse;
}

type TabKey = StoreColorKey;

export function ComparisonResults({ response }: ComparisonResultsProps) {
  const cheapestStore = useMemo(
    () => findCheapestStore(response.storeTotals),
    [response.storeTotals],
  );

  const allUnavailable = useMemo(
    () => response.storeTotals.every((st) => st.total === 0),
    [response.storeTotals],
  );

  // Mobile tab state: stores + mix & match
  const [activeTab, setActiveTab] = useState<TabKey>(
    response.storeTotals[0]?.store ?? 'mixandmatch',
  );

  if (response.storeTotals.length === 0) return null;

  const columnCount = response.storeTotals.length + 1;

  const tabs: Array<{ key: TabKey; label: string }> = [
    ...response.storeTotals.map((st) => ({ key: st.store as TabKey, label: st.storeName })),
    { key: 'mixandmatch' as TabKey, label: 'Mix & Match' },
  ];

  const activeStore = response.storeTotals.find((st) => st.store === activeTab);

  return (
    <div>
      {/* Banner */}
      {allUnavailable ? (
        <div className="mb-4 p-3 bg-zinc-100 rounded-xl text-center text-sm font-medium text-zinc-600">
          No results found across any store
        </div>
      ) : (
        <div className="mb-4 p-3 bg-green-50 rounded-xl text-center text-sm font-medium text-green-800">
          Best single store: {cheapestStore.storeName} {formatPrice(cheapestStore.total)}
        </div>
      )}

      {/* Mobile tabs (visible below md) */}
      <div className="md:hidden" data-testid="mobile-store-tabs">
        <div className="flex overflow-x-auto gap-1 mb-3 pb-1" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div data-testid="mobile-store-panel">
          {activeTab === 'mixandmatch' ? (
            <MixAndMatchColumn mixAndMatch={response.mixAndMatch} />
          ) : activeStore ? (
            <StoreColumn
              storeTotal={activeStore}
              isCheapest={activeStore.store === cheapestStore.store}
            />
          ) : null}
        </div>
      </div>

      {/* Desktop grid (visible at md and above) */}
      <div
        className="hidden md:grid gap-4"
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

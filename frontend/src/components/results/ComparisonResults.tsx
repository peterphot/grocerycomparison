'use client';

import { useMemo, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import type { ComparisonResponse, ShoppingListItem, StoreTotal } from '@grocery/shared';
import { StoreColumn } from './StoreColumn';
import { MixAndMatchColumn } from './MixAndMatchColumn';
import { SummaryPanel } from './SummaryPanel';
import { SavingsTip } from './SavingsTip';
import { ItemRow } from './ItemRow';
import { ResultColumn } from './ResultColumn';
import { formatPrice, findCheapestStore } from '../../lib/utils';
import { STORE_COLORS, type StoreColorKey } from '../../lib/store-colors';

interface ComparisonResultsProps {
  response: ComparisonResponse;
  items?: ShoppingListItem[];
  onEditList?: () => void;
}

type TabKey = StoreColorKey;

export function ComparisonResults({ response, items, onEditList }: ComparisonResultsProps) {
  if (response.storeTotals.length === 0) return null;

  const cheapestStore = useMemo(
    () => findCheapestStore(response.storeTotals),
    [response.storeTotals],
  );

  const allUnavailable = useMemo(
    () => response.storeTotals.every((st) => st.total === 0),
    [response.storeTotals],
  );

  const mixMatchSavings = useMemo(() => {
    if (allUnavailable) return 0;
    return cheapestStore.total - response.mixAndMatch.total;
  }, [cheapestStore, response.mixAndMatch.total, allUnavailable]);

  const columnCount = response.storeTotals.length + 1;

  // Mobile tab state: stores + mix & match
  const [activeTab, setActiveTab] = useState<TabKey>(
    response.storeTotals[0]?.store ?? 'mixandmatch',
  );

  const tabs: Array<{ key: TabKey; label: string }> = [
    ...response.storeTotals.map((st) => ({ key: st.store as TabKey, label: st.storeName })),
    { key: 'mixandmatch' as TabKey, label: 'Mix & Match' },
  ];

  const activeStore = response.storeTotals.find((st) => st.store === activeTab);

  // Calculate savings for active store on mobile
  const activeStoreSavings = useMemo(() => {
    if (activeTab === 'mixandmatch' || !activeStore) return 0;
    return activeStore.total - response.mixAndMatch.total;
  }, [activeTab, activeStore, response.mixAndMatch.total]);

  return (
    <div>
      {/* Banner (C3 - rich content) */}
      {allUnavailable ? (
        <div className="mb-4 p-3 bg-zinc-100 rounded-xl text-center text-sm font-medium text-zinc-600">
          No results found across any store
        </div>
      ) : (
        <div className="mb-4 p-4 bg-white rounded-xl shadow-sm flex flex-wrap items-center gap-3">
          <CircleCheck size={20} className="text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium text-zinc-700">
            Results found
          </span>
          <span className="text-sm text-zinc-500">
            Cheapest single store: {cheapestStore.storeName} {formatPrice(cheapestStore.total)}
          </span>
          <span className="text-sm text-zinc-500">
            Best mix &amp; match: {formatPrice(response.mixAndMatch.total)}
          </span>
          {mixMatchSavings > 0 && (
            <span className="bg-green-100 text-green-700 text-xs font-medium rounded-full px-2.5 py-0.5 ml-auto">
              Save {formatPrice(mixMatchSavings)} with mix &amp; match
            </span>
          )}
        </div>
      )}

      {/* Mobile tabs (visible below md) */}
      <div className="md:hidden" data-testid="mobile-store-tabs">
        <div className="flex overflow-x-auto gap-1 mb-3 pb-1" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const isMixMatch = tab.key === 'mixandmatch';

            let tabClassName: string;
            if (isActive && isMixMatch) {
              tabClassName = 'flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-colors bg-violet-100 text-violet-600';
            } else if (isActive) {
              tabClassName = 'flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-colors text-white';
            } else {
              tabClassName = 'flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-colors bg-zinc-100 text-zinc-600 hover:bg-zinc-200';
            }

            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={tabClassName}
                style={isActive && !isMixMatch ? { backgroundColor: STORE_COLORS[tab.key] } : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div data-testid="mobile-store-panel">
          {activeTab === 'mixandmatch' ? (
            <MixAndMatchColumn mixAndMatch={response.mixAndMatch} />
          ) : activeStore ? (
            <>
              <StoreColumn
                storeTotal={activeStore}
                isCheapest={activeStore.store === cheapestStore.store}
              />
              {activeStoreSavings > 0 && (
                <SavingsTip savings={activeStoreSavings} />
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Desktop layout (visible at md and above) */}
      <div className="hidden md:flex gap-4">
        {/* Summary panel (C2) */}
        {items && items.length > 0 && onEditList && (
          <SummaryPanel items={items} onEditList={onEditList} />
        )}

        {/* Store columns grid */}
        <div
          className="flex-1 grid gap-4"
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
    </div>
  );
}

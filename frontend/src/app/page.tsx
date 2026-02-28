'use client';

import { useCallback, useRef, useState } from 'react';
import type { ComparisonResponse, ShoppingListItem } from '@grocery/shared';
import { ShoppingListForm } from '../components/shopping-list/ShoppingListForm';
import { ComparisonResults } from '../components/results/ComparisonResults';
import { Header } from '../components/common/Header';
import { ComparisonSkeleton } from '../components/common/ComparisonSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';
import { searchGroceries } from '../lib/api';
import { ApiError } from '../lib/errors';

type PageState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; data: ComparisonResponse }
  | { status: 'error'; message: string };

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 408) return 'This is taking longer than usual. Try again?';
    if (error.status === 429) return 'Too many requests. Please wait a moment and try again.';
  }
  return "We couldn't reach any stores right now. Try again shortly.";
}

export default function Home(): React.ReactElement {
  const [pageState, setPageState] = useState<PageState>({ status: 'idle' });
  const lastItemsRef = useRef<ShoppingListItem[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async (items: ShoppingListItem[]) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    lastItemsRef.current = items;
    setPageState({ status: 'loading' });
    try {
      const data = await searchGroceries(items, controller.signal);
      setPageState({ status: 'results', data });
    } catch (error) {
      if (controller.signal.aborted) return;
      setPageState({ status: 'error', message: getErrorMessage(error) });
    }
  }, []);

  const handleRetry = useCallback(() => {
    void handleSubmit(lastItemsRef.current);
  }, [handleSubmit]);

  const handleEditList = useCallback(() => {
    abortRef.current?.abort();
    setPageState({ status: 'idle' });
  }, []);

  const isResults = pageState.status === 'results';

  return (
    <main className="min-h-screen flex flex-col bg-[#F6FAF6]">
      <Header
        showEdit={isResults}
        onEditList={handleEditList}
      />
      <div className="flex flex-col md:flex-row flex-1">
        <div className="w-full md:w-[420px] p-4">
          {/* On mobile with results: form is hidden (use Edit button in header) */}
          <div className={isResults ? 'hidden md:block' : ''}>
            <ShoppingListForm
              onSubmit={handleSubmit}
              initialItems={lastItemsRef.current.length > 0 ? lastItemsRef.current : undefined}
            />
          </div>
        </div>
        <div className="flex-1 p-4">
          {pageState.status === 'idle' && <EmptyState />}
          {pageState.status === 'loading' && <ComparisonSkeleton />}
          {pageState.status === 'results' && (
            <ComparisonResults
              response={pageState.data}
              items={lastItemsRef.current}
              onEditList={handleEditList}
            />
          )}
          {pageState.status === 'error' && (
            <ErrorBanner
              message={pageState.message}
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>
    </main>
  );
}

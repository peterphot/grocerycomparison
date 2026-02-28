'use client';

import { useState } from 'react';
import type { ComparisonResponse } from '@grocery/shared';
import type { ShoppingListItem } from '../hooks/useShoppingList';
import { ShoppingListForm } from '../components/shopping-list/ShoppingListForm';
import { ComparisonResults } from '../components/results/ComparisonResults';
import { Header } from '../components/common/Header';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';
import { searchGroceries } from '../lib/api';

type PageState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; data: ComparisonResponse }
  | { status: 'error'; message: string };

export default function Home(): React.ReactElement {
  const [pageState, setPageState] = useState<PageState>({ status: 'idle' });

  const handleSubmit = async (items: ShoppingListItem[]) => {
    setPageState({ status: 'loading' });
    try {
      const data = await searchGroceries(items);
      setPageState({ status: 'results', data });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      setPageState({ status: 'error', message });
    }
  };

  const handleEditList = () => {
    setPageState({ status: 'idle' });
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-col md:flex-row flex-1">
        <div className="w-full md:w-[420px] p-4">
          {pageState.status !== 'results' && (
            <ShoppingListForm onSubmit={handleSubmit} />
          )}
          {pageState.status === 'results' && (
            <button
              onClick={handleEditList}
              className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-200"
            >
              Edit List
            </button>
          )}
        </div>
        <div className="flex-1 p-4">
          {pageState.status === 'idle' && <EmptyState />}
          {pageState.status === 'loading' && <LoadingSpinner />}
          {pageState.status === 'results' && (
            <ComparisonResults response={pageState.data} />
          )}
          {pageState.status === 'error' && (
            <ErrorBanner
              message={pageState.message}
              onRetry={handleEditList}
            />
          )}
        </div>
      </div>
    </main>
  );
}

import type { ComparisonResponse, ShoppingListItem } from '@grocery/shared';
import { ApiError } from './errors';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function searchGroceries(
  items: ShoppingListItem[],
  signal?: AbortSignal,
): Promise<ComparisonResponse> {
  const response = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
    signal,
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<ComparisonResponse>;
}

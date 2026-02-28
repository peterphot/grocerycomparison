import type { ComparisonResponse, ShoppingListItem } from '@grocery/shared';
import { ApiError } from './errors';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function searchGroceries(
  items: ShoppingListItem[],
  signal?: AbortSignal,
): Promise<ComparisonResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
      );
    }

    return response.json() as Promise<ComparisonResponse>;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('timeout', 408);
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('timeout', 408);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

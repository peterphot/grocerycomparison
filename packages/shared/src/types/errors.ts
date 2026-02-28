import type { StoreName } from './product.js';

export class StoreApiError extends Error {
  constructor(
    message: string,
    public readonly store: StoreName,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = false,
  ) {
    super(message);
    this.name = 'StoreApiError';
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

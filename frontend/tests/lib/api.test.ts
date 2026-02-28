import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import { searchGroceries } from '../../src/lib/api';
import { ApiError } from '../../src/lib/errors';
import { mockComparisonResponse } from '../fixtures/comparison-response';

const items = [
  { id: '1', name: 'milk 2L', quantity: 1, isBrandSpecific: false },
];

describe('searchGroceries', () => {
  it('POSTs items to /api/search and returns ComparisonResponse', async () => {
    server.use(
      http.post('http://localhost:4000/api/search', () => {
        return HttpResponse.json(mockComparisonResponse);
      }),
    );

    const result = await searchGroceries(items);
    expect(result).toEqual(mockComparisonResponse);
  });

  it('throws ApiError with status 400 on bad request', async () => {
    server.use(
      http.post('http://localhost:4000/api/search', () => {
        return new HttpResponse(JSON.stringify({ message: 'Bad request' }), {
          status: 400,
        });
      }),
    );

    try {
      await searchGroceries(items);
      expect.fail('Expected ApiError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
    }
  });

  it('throws ApiError with status 500 on server error', async () => {
    server.use(
      http.post('http://localhost:4000/api/search', () => {
        return new HttpResponse(JSON.stringify({ message: 'Server error' }), {
          status: 500,
        });
      }),
    );

    try {
      await searchGroceries(items);
      expect.fail('Expected ApiError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(500);
    }
  });

  it('includes Content-Type: application/json header', async () => {
    let receivedContentType: string | null = null;

    server.use(
      http.post('http://localhost:4000/api/search', ({ request }) => {
        receivedContentType = request.headers.get('Content-Type');
        return HttpResponse.json(mockComparisonResponse);
      }),
    );

    await searchGroceries(items);
    expect(receivedContentType).toBe('application/json');
  });
});

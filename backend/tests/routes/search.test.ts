import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock the SearchOrchestrator module before importing app
vi.mock('../../src/services/search-orchestrator.js', () => {
  const mockSearch = vi.fn();
  return {
    SearchOrchestrator: vi.fn().mockImplementation(() => ({
      search: mockSearch,
    })),
    __mockSearch: mockSearch,
  };
});

import app from '../../src/app';
import { SearchOrchestrator } from '../../src/services/search-orchestrator.js';

// Get reference to mock search function
const { __mockSearch: mockSearch } = await vi.importMock<{ __mockSearch: ReturnType<typeof vi.fn> }>(
  '../../src/services/search-orchestrator.js',
);

const validItem = {
  id: '1',
  name: 'Milk',
  quantity: 1,
  isBrandSpecific: false,
};

const fakeComparisonResponse = {
  storeTotals: [],
  mixAndMatch: { items: [], total: 0 },
  searchResults: [],
};

describe('POST /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with ComparisonResponse for valid request', async () => {
    mockSearch.mockResolvedValue(fakeComparisonResponse);

    const res = await request(app)
      .post('/api/search')
      .send({ items: [validItem] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeComparisonResponse);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('returns 400 when items array is missing from body', async () => {
    const res = await request(app)
      .post('/api/search')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'items must be a non-empty array' });
  });

  it('returns 400 when items array is empty', async () => {
    const res = await request(app)
      .post('/api/search')
      .send({ items: [] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'items must be a non-empty array' });
  });

  it('returns 400 when an item is missing required fields', async () => {
    const res = await request(app)
      .post('/api/search')
      .send({ items: [{ id: '1', name: 'Milk' }] }); // missing quantity and isBrandSpecific

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid item at index 0' });
  });

  it('returns 500 when orchestrator throws unexpected error', async () => {
    mockSearch.mockRejectedValue(new Error('Something broke'));

    const res = await request(app)
      .post('/api/search')
      .send({ items: [validItem] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('includes Access-Control-Allow-Origin header for localhost:3000', async () => {
    mockSearch.mockResolvedValue(fakeComparisonResponse);

    const res = await request(app)
      .post('/api/search')
      .set('Origin', 'http://localhost:3000')
      .send({ items: [validItem] });

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('responds to OPTIONS preflight with 204', async () => {
    const res = await request(app)
      .options('/api/search')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.status).toBe(204);
  });
});

describe('GET /api/health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

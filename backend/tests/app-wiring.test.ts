import { describe, it, expect, vi, beforeAll } from 'vitest';

// Spy on SearchOrchestrator constructor to capture the adapters passed to it
const constructorSpy = vi.fn();
vi.mock('../src/services/search-orchestrator.js', () => ({
  SearchOrchestrator: class MockOrchestrator {
    constructor(adapters: unknown[]) {
      constructorSpy(adapters);
    }
    async search() {
      return { storeTotals: [], mixAndMatch: { items: [], total: 0 } };
    }
  },
}));

describe('App adapter wiring', () => {
  beforeAll(async () => {
    // Dynamically import app so the mocks are in place
    await import('../src/app.js');
  });

  it('should construct SearchOrchestrator with 4 adapters', () => {
    expect(constructorSpy).toHaveBeenCalledTimes(1);
    const adapters = constructorSpy.mock.calls[0][0];
    expect(adapters).toHaveLength(4);
  });

  it('should include a WoolworthsAdapter', () => {
    const adapters = constructorSpy.mock.calls[0][0] as Array<{ storeName: string }>;
    expect(adapters.some((a) => a.storeName === 'woolworths')).toBe(true);
  });

  it('should include a ColesAdapter', () => {
    const adapters = constructorSpy.mock.calls[0][0] as Array<{ storeName: string }>;
    expect(adapters.some((a) => a.storeName === 'coles')).toBe(true);
  });

  it('should include an AldiAdapter', () => {
    const adapters = constructorSpy.mock.calls[0][0] as Array<{ storeName: string }>;
    expect(adapters.some((a) => a.storeName === 'aldi')).toBe(true);
  });

  it('should include a HarrisFarmAdapter', () => {
    const adapters = constructorSpy.mock.calls[0][0] as Array<{ storeName: string }>;
    expect(adapters.some((a) => a.storeName === 'harrisfarm')).toBe(true);
  });
});

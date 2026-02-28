import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import fs from 'node:fs';
import path from 'node:path';

const homepageHtml = fs.readFileSync(
  path.join(__dirname, '../fixtures/coles-homepage.html'),
  'utf-8',
);

// We import the class under test — this will fail until implementation exists
import { ColesSessionManager } from '../../src/utils/coles-session';

describe('ColesSessionManager', () => {
  let session: ColesSessionManager;
  let fetchCount: number;

  beforeEach(() => {
    session = new ColesSessionManager();
    fetchCount = 0;

    server.use(
      http.get('https://www.coles.com.au/', () => {
        fetchCount++;
        return new HttpResponse(homepageHtml, {
          headers: {
            'Content-Type': 'text/html',
            'Set-Cookie': 'session_id=test123; Path=/',
          },
        });
      }),
    );
  });

  it('extracts buildId from __NEXT_DATA__', async () => {
    const result = await session.ensureSession();
    expect(result.buildId).toBe('abc123buildid');
  });

  it('caches session within TTL', async () => {
    await session.ensureSession();
    await session.ensureSession();
    expect(fetchCount).toBe(1);
  });

  it('refreshes after TTL expires', async () => {
    vi.useFakeTimers();
    try {
      await session.ensureSession();
      expect(fetchCount).toBe(1);

      // Advance past 5 minutes TTL
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      await session.ensureSession();
      expect(fetchCount).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('handles concurrent calls — only one fetch fires', async () => {
    const results = await Promise.all([
      session.ensureSession(),
      session.ensureSession(),
      session.ensureSession(),
    ]);
    expect(fetchCount).toBe(1);
    // All should return same buildId
    for (const r of results) {
      expect(r.buildId).toBe('abc123buildid');
    }
  });
});

import { describe, it, expect } from 'vitest';
import { RateLimiter } from '../../src/utils/rate-limiter.js';

describe('RateLimiter', () => {
  it('allows up to 2 concurrent calls', async () => {
    const limiter = new RateLimiter(2);
    const key = 'test-store';

    // Both should resolve immediately
    await limiter.acquire(key);
    await limiter.acquire(key);

    // Release both
    limiter.release(key);
    limiter.release(key);
  });

  it('3rd call waits until one completes', async () => {
    const limiter = new RateLimiter(2);
    const key = 'test-store';
    const order: number[] = [];

    await limiter.acquire(key);
    await limiter.acquire(key);

    // 3rd acquire should block
    let thirdResolved = false;
    const thirdPromise = limiter.acquire(key).then(() => {
      thirdResolved = true;
      order.push(3);
    });

    // Give microtasks a chance to run
    await Promise.resolve();
    expect(thirdResolved).toBe(false);

    // Release one slot - should unblock the 3rd
    limiter.release(key);

    await thirdPromise;
    expect(thirdResolved).toBe(true);

    // Cleanup
    limiter.release(key);
    limiter.release(key);
  });
});

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

    await limiter.acquire(key);
    await limiter.acquire(key);

    // 3rd acquire should block
    let thirdResolved = false;
    const thirdPromise = limiter.acquire(key).then(() => {
      thirdResolved = true;
    });

    // Give microtasks a chance to run
    await Promise.resolve();
    expect(thirdResolved).toBe(false);

    // Release one slot - should unblock the 3rd
    limiter.release(key);

    await thirdPromise;
    expect(thirdResolved).toBe(true);

    // Cleanup: release the 2 remaining slots
    limiter.release(key);
    limiter.release(key);
  });

  it('throws on release without matching acquire', () => {
    const limiter = new RateLimiter(2);
    expect(() => limiter.release('unknown-key')).toThrow(
      'release called without matching acquire',
    );
  });

  it('rejects when queue exceeds maxQueueSize', async () => {
    const limiter = new RateLimiter(1, 2); // max 1 concurrent, max 2 queued

    await limiter.acquire('store');

    // Queue 2 waiters (at the limit)
    const p1 = limiter.acquire('store');
    const p2 = limiter.acquire('store');

    // 3rd queued should throw
    await expect(limiter.acquire('store')).rejects.toThrow('queue full');

    // Cleanup
    limiter.release('store'); // unblocks p1
    await p1;
    limiter.release('store'); // unblocks p2
    await p2;
    limiter.release('store');
  });

  it('execute() guarantees release even on error', async () => {
    const limiter = new RateLimiter(1);
    const key = 'test-store';

    // execute with a throwing function
    await expect(
      limiter.execute(key, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    // Slot should be released — next acquire should not block
    await limiter.acquire(key);
    limiter.release(key);
  });

  it('execute() returns the function result', async () => {
    const limiter = new RateLimiter(2);
    const result = await limiter.execute('store', async () => 42);
    expect(result).toBe(42);
  });
});

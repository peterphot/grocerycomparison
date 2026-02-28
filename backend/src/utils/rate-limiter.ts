const DEFAULT_MAX_QUEUE_SIZE = 50;

export class RateLimiter {
  private running = new Map<string, number>();
  private queue = new Map<string, (() => void)[]>();

  constructor(
    private maxConcurrent: number = 2,
    private maxQueueSize: number = DEFAULT_MAX_QUEUE_SIZE,
  ) {}

  async acquire(key: string): Promise<void> {
    const current = this.running.get(key) || 0;
    if (current < this.maxConcurrent) {
      this.running.set(key, current + 1);
      return;
    }
    const q = this.queue.get(key) || [];
    if (q.length >= this.maxQueueSize) {
      throw new Error(`Rate limiter queue full for key: ${key}`);
    }
    return new Promise<void>((resolve) => {
      q.push(resolve);
      this.queue.set(key, q);
    });
  }

  release(key: string): void {
    const q = this.queue.get(key) || [];
    if (q.length > 0) {
      const next = q.shift()!;
      if (q.length === 0) {
        this.queue.delete(key);
      }
      next();
    } else {
      const current = this.running.get(key) ?? 0;
      if (current <= 0) {
        throw new Error(`RateLimiter: release called without matching acquire for key "${key}"`);
      }
      if (current === 1) {
        this.running.delete(key);
      } else {
        this.running.set(key, current - 1);
      }
    }
  }

  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    await this.acquire(key);
    try {
      return await fn();
    } finally {
      this.release(key);
    }
  }
}

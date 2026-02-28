export class RateLimiter {
  private running = new Map<string, number>();
  private queue = new Map<string, (() => void)[]>();

  constructor(private maxConcurrent: number = 2) {}

  async acquire(key: string): Promise<void> {
    const current = this.running.get(key) || 0;
    if (current < this.maxConcurrent) {
      this.running.set(key, current + 1);
      return;
    }
    return new Promise<void>((resolve) => {
      const q = this.queue.get(key) || [];
      q.push(resolve);
      this.queue.set(key, q);
    });
  }

  release(key: string): void {
    const q = this.queue.get(key) || [];
    if (q.length > 0) {
      const next = q.shift()!;
      this.queue.set(key, q);
      next();
    } else {
      this.running.set(key, (this.running.get(key) || 1) - 1);
    }
  }
}

import { DEFAULT_USER_AGENT } from './http-client';

export class ColesSessionManager {
  private cookies: string | null = null;
  private buildId: string | null = null;
  private lastRefreshed = 0;
  private refreshPromise: Promise<void> | null = null;
  private readonly TTL = 5 * 60 * 1000;

  async ensureSession(): Promise<{ cookies: string; buildId: string }> {
    if (!this.refreshPromise && this.isExpired()) {
      this.refreshPromise = this.refresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    if (this.refreshPromise) await this.refreshPromise;
    return { cookies: this.cookies!, buildId: this.buildId! };
  }

  private isExpired(): boolean {
    return !this.buildId || Date.now() - this.lastRefreshed > this.TTL;
  }

  private async refresh(): Promise<void> {
    const res = await fetch('https://www.coles.com.au/', {
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });
    const html = await res.text();
    const match = html.match(/"buildId"\s*:\s*"([^"]+)"/);
    if (!match) throw new Error('Could not extract buildId from Coles homepage');
    this.buildId = match[1];
    this.cookies = res.headers.getSetCookie().join('; ');
    this.lastRefreshed = Date.now();
  }
}

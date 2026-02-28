import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// We import from app.ts (not index.ts) to avoid starting the server
import app from '../src/app';

describe('Express app', () => {
  describe('GET /api/health', () => {
    it('should return 200 with { status: "ok" }', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('MSW configuration', () => {
    it('should not emit MSW warnings for supertest requests', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        await request(app).get('/api/health');
        const mswWarnings = warnSpy.mock.calls.filter(
          (args) => typeof args[0] === 'string' && args[0].includes('[MSW]'),
        );
        expect(mswWarnings).toHaveLength(0);
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  describe('CORS', () => {
    it('should include Access-Control-Allow-Origin header for allowed origin', async () => {
      const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

      const res = await request(app)
        .get('/api/health')
        .set('Origin', allowedOrigin);

      expect(res.headers['access-control-allow-origin']).toBe(allowedOrigin);
    });

    it('should handle preflight OPTIONS request with CORS headers', async () => {
      const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

      const res = await request(app)
        .options('/api/health')
        .set('Origin', allowedOrigin)
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(allowedOrigin);
    });

    it('should not reflect a disallowed origin in Access-Control-Allow-Origin', async () => {
      const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://evil.example.com');

      // With a static string origin, cors always sets the header to the configured origin.
      // The browser enforces that the response origin must match the requesting origin,
      // so http://evil.example.com will be blocked client-side since the header says localhost:3000.
      expect(res.headers['access-control-allow-origin']).toBe(allowedOrigin);
      expect(res.headers['access-control-allow-origin']).not.toBe('http://evil.example.com');
    });
  });

  describe('app module isolation', () => {
    it('should export an Express app without calling listen()', () => {
      // If we got here without an error, the import succeeded without starting a server.
      // Verify the export is a function (Express app is a callable function).
      expect(typeof app).toBe('function');
      // Verify it has Express-like properties
      expect(typeof app.get).toBe('function');
      expect(typeof app.use).toBe('function');
      expect(typeof app.listen).toBe('function');
    });
  });
});

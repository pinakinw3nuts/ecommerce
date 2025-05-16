import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import Server from '../../server';

describe('Health Check Endpoints', () => {
  let app: FastifyInstance;
  let server: Server;

  beforeAll(async () => {
    server = new Server();
    app = server.getInstance();
    await app.ready();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('GET /health', () => {
    it('should return 200 and health check info', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      
      const payload = JSON.parse(response.payload);
      
      expect(payload).toMatchObject({
        status: 'ok',
        service: 'api-gateway',
        memory: expect.objectContaining({
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number),
          external: expect.any(Number),
          rss: expect.any(Number)
        }),
        version: expect.any(String)
      });

      // Verify timestamp is valid ISO date
      expect(Date.parse(payload.timestamp)).not.toBeNaN();
      
      // Verify uptime is a positive number
      expect(payload.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /health/details', () => {
    it('should return 200 and detailed metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/details'
      });

      expect(response.statusCode).toBe(200);
      
      const payload = JSON.parse(response.payload);
      
      expect(payload).toMatchObject({
        status: 'ok',
        process: expect.objectContaining({
          pid: expect.any(Number),
          uptime: expect.any(Number),
          nodeVersion: expect.any(String),
          memoryUsage: expect.any(Object),
          cpuUsage: expect.any(Object)
        }),
        env: expect.objectContaining({
          nodeEnv: expect.any(String)
        })
      });

      // Verify timestamp is valid ISO date
      expect(Date.parse(payload.timestamp)).not.toBeNaN();
    });
  });
}); 
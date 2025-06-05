// @ts-nocheck
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { StartedPostgreSqlContainer, PostgreSqlContainer } from 'testcontainers';
import { DataSource } from 'typeorm';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { buildApp } from '../index';
import { User } from '../entities/user.entity';

describe('Health Check', () => {
  let app: FastifyInstance;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer()
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    // Create TypeORM connection
    dataSource = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
      entities: [User],
      synchronize: true,
      logging: false, // Disable query logging
    });

    await dataSource.initialize();

    // Build Fastify app with test configuration
    app = await buildApp({
      database: dataSource,
      jwt: {
        secret: 'test_secret',
        refreshSecret: 'test_refresh_secret',
        expiresIn: '1h',
        refreshExpiresIn: '7d',
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await dataSource.destroy();
    await container.stop();
  });

  describe('GET /health', () => {
    test('should return healthy status when all services are up', async () => {
      const response = await supertest(app.server).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        services: {
          database: {
            status: 'healthy',
          },
          server: {
            status: 'healthy',
          },
        },
      });

      // Check additional fields
      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      expect(response.body.version).toBeDefined();
      expect(response.body.services.database.latency).toBeTypeOf('number');
      expect(response.body.services.server.uptime).toBeTypeOf('number');
    });

    test('should return unhealthy status when database is down', async () => {
      // Close the database connection to simulate failure
      await dataSource.destroy();

      const response = await supertest(app.server).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        status: 'unhealthy',
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.error).toBeDefined();

      // Reconnect database for cleanup
      await dataSource.initialize();
    });
  });
}); 
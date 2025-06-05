// @ts-nocheck
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { StartedPostgreSqlContainer, PostgreSqlContainer } from 'testcontainers';
import { DataSource } from 'typeorm';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { buildApp } from '../index';
import { User } from '../entities/user.entity';

describe('Auth Routes', () => {
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

  beforeEach(async () => {
    // Clean up database before each test
    await dataSource.getRepository(User).clear();
  });

  afterAll(async () => {
    await app.close();
    await dataSource.destroy();
    await container.stop();
  });

  describe('POST /api/auth/signup', () => {
    test('should successfully register a new user', async () => {
      const response = await supertest(app.server)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        message: 'User registered successfully',
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    test('should fail with invalid email format', async () => {
      const response = await supertest(app.server)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid email format');
    });

    test('should fail with weak password', async () => {
      const response = await supertest(app.server)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Password must be at least 8 characters');
    });

    test('should fail with duplicate email', async () => {
      // First registration
      await supertest(app.server)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      // Duplicate registration
      const response = await supertest(app.server)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Another User',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await supertest(app.server)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });
    });

    test('should successfully login with correct credentials', async () => {
      const response = await supertest(app.server)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    test('should fail with incorrect password', async () => {
      const response = await supertest(app.server)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should fail with non-existent email', async () => {
      const response = await supertest(app.server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should fail with invalid email format', async () => {
      const response = await supertest(app.server)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid email format');
    });
  });
}); 
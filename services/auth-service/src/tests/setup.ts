import { beforeAll } from 'vitest';
import { config } from 'dotenv';

beforeAll(() => {
  // Load test environment variables
  config({ path: '.env.test' });

  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Set default timeout for all tests
  process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = '/var/run/docker.sock';
}); 
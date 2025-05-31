import fastify from 'fastify';
import { addressRoutes } from '../routes/address.routes';
import { AppDataSource } from '../config/dataSource';
import '@fastify/swagger';

// Extend FastifyInstance type to include test methods
declare module 'fastify' {
  interface FastifyInstance {
    inject: any;
    register: any;
    close: any;
  }
}

// TypeScript doesn't recognize Jest globals in strict mode
// We need to declare them explicitly
declare const jest: any;
declare const describe: any;
declare const beforeAll: any;
declare const afterAll: any;
declare const it: any;
declare const expect: any;

let app: any;

// Mock authentication middleware
jest.mock('../middlewares/auth', () => ({
  authMiddleware: jest.fn((request: any, reply: any) => {
    request.user = { userId: 'test-user-id' };
  })
}));

beforeAll(async () => {
  app = fastify();
  await AppDataSource.initialize();
  await app.register(addressRoutes);
});

afterAll(async () => {
  await app.close();
  await AppDataSource.destroy();
});

describe('Address API', () => {
  it('should create a new address', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/',
      payload: {
        fullName: 'Test User',
        addressLine1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        pincode: '400001',
        phone: '1234567890',
        type: 'SHIPPING'
      }
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.payload)).toHaveProperty('id');
  });

  it('should list addresses for a user', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toBeInstanceOf(Array);
  });

  it('should get an address by ID', async () => {
    // First create an address
    const createResponse = await app.inject({
      method: 'POST',
      url: '/',
      payload: {
        fullName: 'Test User',
        addressLine1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        pincode: '400001',
        phone: '1234567890',
        type: 'SHIPPING'
      }
    });
    
    const createdAddress = JSON.parse(createResponse.payload);
    
    // Then get it by ID
    const getResponse = await app.inject({
      method: 'GET',
      url: `/${createdAddress.id}`
    });

    expect(getResponse.statusCode).toBe(200);
    expect(JSON.parse(getResponse.payload)).toHaveProperty('id', createdAddress.id);
  });
}); 
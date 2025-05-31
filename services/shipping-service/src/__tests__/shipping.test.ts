import fastify, { FastifyInstance } from 'fastify';
import { shippingRoutes } from '../routes/shipping.routes';
import { AppDataSource } from '../config/dataSource';

let app: FastifyInstance;

beforeAll(async () => {
  app = fastify();
  await AppDataSource.initialize();
  await app.register(shippingRoutes);
});

afterAll(async () => {
  await app.close();
  await AppDataSource.destroy();
});

describe('Shipping API', () => {
  it('should calculate shipping for a valid method and pincode', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/calculate?methodId=standard&pincode=400001'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toHaveProperty('baseRate');
    expect(JSON.parse(response.payload)).toHaveProperty('eta');
  });

  it('should return available shipping methods for a pincode', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/methods?pincode=400001'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toBeInstanceOf(Array);
  });
}); 
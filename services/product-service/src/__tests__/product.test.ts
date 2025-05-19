import fastify, { FastifyInstance } from 'fastify';
import { productRoutes } from '../routes/product.routes';
import { AppDataSource } from '../config/dataSource';

let app: FastifyInstance;

beforeAll(async () => {
  app = fastify();
  await AppDataSource.initialize();
  await app.register(productRoutes);
});

afterAll(async () => {
  await app.close();
  await AppDataSource.destroy();
});

describe('Product API', () => {
  it('should create a new product', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        categoryId: '1'
      }
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.payload)).toHaveProperty('id');
  });

  it('should get a product by slug', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/products/test-product'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toHaveProperty('name', 'Test Product');
  });
}); 
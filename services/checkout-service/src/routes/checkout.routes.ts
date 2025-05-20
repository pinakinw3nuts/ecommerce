import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

export default fp(async function checkoutRoutes(
  fastify: FastifyInstance
) {
  // Routes will be implemented here
  fastify.get('/preview', async () => {
    return { message: 'Checkout preview endpoint' };
  });
}); 
import { FastifyInstance } from 'fastify';
import { configureHealthCheck } from '../plugins/healthCheck';

export default async function (fastify: FastifyInstance) {
  await configureHealthCheck(fastify);
} 
import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from '../services/payment.service';
import { PaymentMethodType, PaymentMethodStatus } from '../entities/payment-method.entity';
import { z } from 'zod';

const createSchema = z.object({
  type: z.nativeEnum(PaymentMethodType),
  provider: z.string(),
  card: z.object({
    number: z.string(),
    exp_month: z.number(),
    exp_year: z.number(),
    cvc: z.string()
  }),
  isDefault: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

const updateSchema = z.object({
  status: z.nativeEnum(PaymentMethodStatus).optional(),
  isDefault: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

export class PaymentMethodController {
  constructor(private paymentService: PaymentService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any)?.userId;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    const data = createSchema.parse(request.body) as {
      type: PaymentMethodType;
      provider: string;
      card: { number: string; exp_month: number; exp_year: number; cvc: string };
      isDefault?: boolean | undefined;
      metadata?: Record<string, any> | undefined;
    };
    const result = await this.paymentService.createPaymentMethod(userId, data);
    return reply.status(201).send(result);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any)?.userId;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    const result = await this.paymentService.getPaymentMethods(userId);
    return reply.send(result);
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any)?.userId;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as any;
    const result = await this.paymentService.getPaymentMethodById(userId, id);
    if (!result) return reply.status(404).send({ error: 'Not found' });
    return reply.send(result);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any)?.userId;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as any;
    const data = updateSchema.parse(request.body) as Partial<{
      status?: PaymentMethodStatus;
      isDefault?: boolean | undefined;
      metadata?: Record<string, any> | undefined;
    }>;
    const result = await this.paymentService.updatePaymentMethod(userId, id, data);
    return reply.send(result);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any)?.userId;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as any;
    await this.paymentService.deletePaymentMethod(userId, id);
    return reply.status(204).send();
  }
} 
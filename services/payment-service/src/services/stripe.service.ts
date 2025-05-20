import Stripe from 'stripe';
import logger from '../utils/logger';

export class StripeService {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-08-16'
    });
  }

  async createPayment(data: {
    amount: number;
    currency: string;
    paymentMethodId: string;
    description?: string;
  }) {
    try {
      // Create a payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        payment_method: data.paymentMethodId,
        ...(data.description && { description: data.description }),
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });

      return paymentIntent;
    } catch (error) {
      logger.error({ err: error }, 'Stripe payment creation failed');
      throw error;
    }
  }

  async createRefund(paymentIntentId: string, amount?: number) {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundParams);
      return refund;
    } catch (error) {
      logger.error({ err: error }, 'Stripe refund creation failed');
      throw error;
    }
  }

  async createPaymentMethod(data: {
    type: string;
    card: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    };
  }) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: data.card
      });

      return paymentMethod;
    } catch (error) {
      logger.error({ err: error }, 'Stripe payment method creation failed');
      throw error;
    }
  }

  async getPaymentMethod(paymentMethodId: string) {
    try {
      return await this.stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      logger.error({ err: error }, 'Failed to retrieve Stripe payment method');
      throw error;
    }
  }

  async deletePaymentMethod(paymentMethodId: string) {
    try {
      return await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      logger.error({ err: error }, 'Failed to delete Stripe payment method');
      throw error;
    }
  }

  async handleWebhookEvent(
    payload: Buffer,
    signature: string,
    webhookSecret: string
  ) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      return event;
    } catch (error) {
      logger.error({ err: error }, 'Failed to verify Stripe webhook signature');
      throw error;
    }
  }
} 
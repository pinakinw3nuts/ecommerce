import { Repository } from 'typeorm';
import { PaymentGateway, PaymentGatewayType } from '../entities/payment-gateway.entity';
import { logger } from '../utils/logger';

const gatewayLogger = logger.child({ service: 'PaymentGatewayService' });

export class PaymentGatewayService {
  private paymentGatewayRepo: Repository<PaymentGateway>;

  constructor(paymentGatewayRepo: Repository<PaymentGateway>) {
    this.paymentGatewayRepo = paymentGatewayRepo;
  }

  /**
   * Get all payment gateways
   */
  async getAllGateways(options: {
    enabled?: boolean | undefined;
    type?: PaymentGatewayType | undefined;
    supportRefunds?: boolean | undefined;
    supportSubscriptions?: boolean | undefined;
    country?: string | undefined;
    currency?: string | undefined;
  } = {}): Promise<PaymentGateway[]> {
    const query = this.paymentGatewayRepo.createQueryBuilder('gateway')
      .orderBy('gateway.display_order', 'ASC');

    if (options.enabled !== undefined) {
      query.andWhere('gateway.enabled = :enabled', { enabled: options.enabled });
    }

    if (options.type) {
      query.andWhere('gateway.type = :type', { type: options.type });
    }

    if (options.supportRefunds !== undefined) {
      query.andWhere('gateway.supports_refunds = :supportsRefunds', { supportsRefunds: options.supportRefunds });
    }

    if (options.supportSubscriptions !== undefined) {
      query.andWhere('gateway.supports_subscriptions = :supportsSubscriptions', { supportsSubscriptions: options.supportSubscriptions });
    }

    if (options.country) {
      query.andWhere(`
        (gateway.supported_countries @> :country::jsonb OR gateway.supported_countries = '[]'::jsonb) 
        AND NOT (gateway.excluded_countries @> :country::jsonb)
      `, { country: JSON.stringify(options.country) });
    }

    if (options.currency) {
      query.andWhere(`
        (gateway.supported_currencies @> :currency::jsonb OR gateway.supported_currencies = '[]'::jsonb)
      `, { currency: JSON.stringify(options.currency) });
    }

    return query.getMany();
  }

  /**
   * Get a payment gateway by code
   */
  async getGatewayByCode(code: string): Promise<PaymentGateway | null> {
    return this.paymentGatewayRepo.findOne({ where: { code } });
  }

  /**
   * Create a new payment gateway
   */
  async createGateway(data: {
    code: string;
    name: string;
    type: PaymentGatewayType;
    description?: string | undefined;
    enabled?: boolean | undefined;
    displayOrder?: number | undefined;
    iconUrl?: string | undefined;
    redirectUrl?: string | undefined;
    webhookUrl?: string | undefined;
    supportsRefunds?: boolean | undefined;
    supportsSubscriptions?: boolean | undefined;
    supportsSavedCards?: boolean | undefined;
    minAmount?: number | undefined;
    maxAmount?: number | undefined;
    transactionFeePercent?: number | undefined;
    transactionFeeFixed?: number | undefined;
    supportedCountries?: string[] | undefined;
    excludedCountries?: string[] | undefined;
    supportedCurrencies?: string[] | undefined;
    defaultOrderStatus?: string | undefined;
    paymentInstructions?: string | undefined;
    checkoutFields?: Record<string, any>[] | undefined;
    apiCredentials?: Record<string, any> | undefined;
    settings?: Record<string, any> | undefined;
    metadata?: Record<string, any> | undefined;
  }): Promise<PaymentGateway> {
    if (!data.code) {
      throw new Error('Gateway code is required');
    }

    const existingGateway = await this.getGatewayByCode(data.code);
    if (existingGateway) {
      throw new Error(`Payment gateway with code ${data.code} already exists`);
    }

    const gateway = this.paymentGatewayRepo.create(data as Partial<PaymentGateway>);
    await this.paymentGatewayRepo.save(gateway);

    gatewayLogger.info({ gatewayCode: gateway.code }, 'Payment gateway created');
    return gateway;
  }

  /**
   * Update a payment gateway
   */
  async updateGateway(code: string, data: {
    name?: string | undefined;
    type?: PaymentGatewayType | undefined;
    description?: string | undefined;
    enabled?: boolean | undefined;
    displayOrder?: number | undefined;
    iconUrl?: string | undefined;
    redirectUrl?: string | undefined;
    webhookUrl?: string | undefined;
    supportsRefunds?: boolean | undefined;
    supportsSubscriptions?: boolean | undefined;
    supportsSavedCards?: boolean | undefined;
    minAmount?: number | undefined;
    maxAmount?: number | undefined;
    transactionFeePercent?: number | undefined;
    transactionFeeFixed?: number | undefined;
    supportedCountries?: string[] | undefined;
    excludedCountries?: string[] | undefined;
    supportedCurrencies?: string[] | undefined;
    defaultOrderStatus?: string | undefined;
    paymentInstructions?: string | undefined;
    checkoutFields?: Record<string, any>[] | undefined;
    apiCredentials?: Record<string, any> | undefined;
    settings?: Record<string, any> | undefined;
    metadata?: Record<string, any> | undefined;
  }): Promise<PaymentGateway> {
    const gateway = await this.getGatewayByCode(code);
    if (!gateway) {
      throw new Error(`Payment gateway with code ${code} not found`);
    }

    Object.assign(gateway, data);
    await this.paymentGatewayRepo.save(gateway);

    gatewayLogger.info({ gatewayCode: gateway.code }, 'Payment gateway updated');
    return gateway;
  }

  /**
   * Enable or disable a payment gateway
   */
  async setGatewayStatus(code: string, enabled: boolean): Promise<PaymentGateway> {
    const gateway = await this.getGatewayByCode(code);
    if (!gateway) {
      throw new Error(`Payment gateway with code ${code} not found`);
    }

    gateway.enabled = enabled;
    await this.paymentGatewayRepo.save(gateway);

    gatewayLogger.info({ gatewayCode: gateway.code, enabled }, 'Payment gateway status updated');
    return gateway;
  }

  /**
   * Update payment gateway display order
   */
  async updateGatewayOrder(orders: { code: string; order: number }[]): Promise<void> {
    const promises = orders.map(({ code, order }) => {
      return this.paymentGatewayRepo.update({ code }, { displayOrder: order });
    });

    await Promise.all(promises);
    gatewayLogger.info('Payment gateway display orders updated');
  }

  /**
   * Get available payment gateways for a specific order
   */
  async getAvailableGatewaysForOrder(orderData: {
    amount: number;
    currency: string;
    country?: string | undefined;
    items?: Array<{ productId: string; categoryId?: string | undefined }> | undefined;
  }): Promise<PaymentGateway[]> {
    const query = this.paymentGatewayRepo.createQueryBuilder('gateway')
      .where('gateway.enabled = :enabled', { enabled: true })
      .orderBy('gateway.display_order', 'ASC');

    // Check amount constraints
    if (orderData.amount) {
      query.andWhere(`
        (gateway.min_amount IS NULL OR gateway.min_amount <= :amount) AND
        (gateway.max_amount IS NULL OR gateway.max_amount >= :amount)
      `, { amount: orderData.amount });
    }

    // Check currency support
    if (orderData.currency) {
      query.andWhere(`
        (gateway.supported_currencies @> :currency::jsonb OR gateway.supported_currencies = '[]'::jsonb)
      `, { currency: JSON.stringify(orderData.currency) });
    }

    // Check country support
    if (orderData.country) {
      query.andWhere(`
        (gateway.supported_countries @> :country::jsonb OR gateway.supported_countries = '[]'::jsonb) 
        AND NOT (gateway.excluded_countries @> :country::jsonb)
      `, { country: JSON.stringify(orderData.country) });
    }

    return query.getMany();
  }

  /**
   * Calculate transaction fee for a payment gateway
   */
  calculateTransactionFee(gateway: PaymentGateway, amount: number): number {
    const percentFee = (gateway.transactionFeePercent / 100) * amount;
    const totalFee = percentFee + (gateway.transactionFeeFixed || 0);
    return parseFloat(totalFee.toFixed(2));
  }

  /**
   * Delete a payment gateway
   */
  async deleteGateway(code: string): Promise<void> {
    const gateway = await this.getGatewayByCode(code);
    if (!gateway) {
      throw new Error(`Payment gateway with code ${code} not found`);
    }

    await this.paymentGatewayRepo.remove(gateway);
    gatewayLogger.info({ gatewayCode: code }, 'Payment gateway deleted');
  }
} 
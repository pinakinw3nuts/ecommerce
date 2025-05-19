import { AppDataSource } from '../config/dataSource';
import { Coupon } from '../entities/Coupon';
import { Product } from '../entities/Product';
import { In, MoreThan } from 'typeorm';

export class CouponService {
  private couponRepo = AppDataSource.getRepository(Coupon);
  private productRepo = AppDataSource.getRepository(Product);

  async createCoupon(data: {
    code: string;
    name: string;
    description?: string;
    discountAmount: number;
    discountType: 'PERCENTAGE' | 'FIXED';
    startDate: Date;
    endDate: Date;
    minimumPurchaseAmount?: number;
    usageLimit?: number;
    perUserLimit?: number;
    isFirstPurchaseOnly?: boolean;
    productIds?: string[];
  }) {
    // Validate discount amount for percentage type
    if (data.discountType === 'PERCENTAGE' && (data.discountAmount <= 0 || data.discountAmount > 100)) {
      throw new Error('Percentage discount must be between 0 and 100');
    }

    // Validate dates
    if (new Date(data.startDate) > new Date(data.endDate)) {
      throw new Error('Start date must be before end date');
    }

    let products: Product[] = [];
    if (data.productIds && data.productIds.length > 0) {
      products = await this.productRepo.findBy({ id: In(data.productIds) });
    }

    const coupon = this.couponRepo.create({
      ...data,
      products
    });

    return this.couponRepo.save(coupon);
  }

  async getCouponById(id: string) {
    return this.couponRepo.findOne({
      where: { id },
      relations: ['products']
    });
  }

  async getCouponByCode(code: string) {
    return this.couponRepo.findOne({
      where: { code },
      relations: ['products']
    });
  }

  async listCoupons(options?: {
    skip?: number;
    take?: number;
    isActive?: boolean;
    includeExpired?: boolean;
  }) {
    const currentDate = new Date();
    const where: any = {};

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (!options?.includeExpired) {
      where.endDate = MoreThan(currentDate);
    }

    return this.couponRepo.find({
      where,
      skip: options?.skip,
      take: options?.take,
      order: { createdAt: 'DESC' },
      relations: ['products']
    });
  }

  async updateCoupon(id: string, data: Partial<{
    name: string;
    description: string;
    discountAmount: number;
    discountType: 'PERCENTAGE' | 'FIXED';
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    minimumPurchaseAmount: number;
    usageLimit: number;
    perUserLimit: number;
    isFirstPurchaseOnly: boolean;
    productIds: string[];
  }>) {
    const coupon = await this.getCouponById(id);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Validate discount amount for percentage type
    if (data.discountType === 'PERCENTAGE' && data.discountAmount !== undefined) {
      if (data.discountAmount <= 0 || data.discountAmount > 100) {
        throw new Error('Percentage discount must be between 0 and 100');
      }
    }

    // Validate dates
    if (data.startDate && data.endDate) {
      if (new Date(data.startDate) > new Date(data.endDate)) {
        throw new Error('Start date must be before end date');
      }
    }

    // Update products if productIds are provided
    if (data.productIds) {
      const products = await this.productRepo.findBy({ id: In(data.productIds) });
      coupon.products = products;
      delete data.productIds;
    }

    Object.assign(coupon, data);
    return this.couponRepo.save(coupon);
  }

  async deleteCoupon(id: string) {
    const coupon = await this.getCouponById(id);
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    await this.couponRepo.softDelete(id);
    return true;
  }

  async validateCoupon(code: string, userId: string, totalAmount: number, productIds: string[]) {
    const coupon = await this.getCouponByCode(code);
    
    if (!coupon) {
      throw new Error('Invalid coupon code');
    }

    if (!coupon.isActive) {
      throw new Error('Coupon is not active');
    }

    const currentDate = new Date();
    if (currentDate < coupon.startDate || currentDate > coupon.endDate) {
      throw new Error('Coupon is expired or not yet valid');
    }

    if (coupon.minimumPurchaseAmount && totalAmount < coupon.minimumPurchaseAmount) {
      throw new Error(`Minimum purchase amount of ${coupon.minimumPurchaseAmount} required`);
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new Error('Coupon usage limit reached');
    }

    // Validate product-specific coupon
    if (coupon.products.length > 0) {
      const validProductIds = coupon.products.map(p => p.id);
      const hasValidProduct = productIds.some(id => validProductIds.includes(id));
      if (!hasValidProduct) {
        throw new Error('Coupon is not valid for these products');
      }
    }

    // Calculate discount
    let discountAmount = coupon.discountAmount;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (totalAmount * coupon.discountAmount) / 100;
    }

    return {
      isValid: true,
      discountAmount,
      coupon
    };
  }
} 
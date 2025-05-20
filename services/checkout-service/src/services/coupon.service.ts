import { Repository, DeepPartial } from 'typeorm';
import { Coupon, CouponType } from '../entities/Coupon';

export class CouponValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CouponValidationError';
  }
}

export class CouponService {
  constructor(
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async create(data: DeepPartial<Coupon>): Promise<Coupon> {
    const coupon = this.couponRepository.create(data);
    return this.couponRepository.save(coupon);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.couponRepository.findOne({ where: { code } });
  }

  async findById(id: string): Promise<Coupon | null> {
    return this.couponRepository.findOne({ where: { id } });
  }

  async update(id: string, data: {
    code?: string;
    type?: CouponType;
    value?: number;
    expiresAt?: Date | null;
    maxUses?: number | null;
    isActive?: boolean;
    minimumPurchaseAmount?: number | null;
    applicableProducts?: string[] | null;
  }): Promise<Coupon> {
    // Get existing coupon
    const existingCoupon = await this.findById(id);
    if (!existingCoupon) {
      throw new Error('Coupon not found');
    }

    // Filter out undefined values to prevent overwriting with undefined
    const filteredData = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value
      }), {});

    // Update the entity
    await this.couponRepository.update(id, filteredData);

    // Fetch and return the updated entity
    const updatedCoupon = await this.findById(id);
    if (!updatedCoupon) {
      throw new Error('Coupon not found after update');
    }

    return updatedCoupon;
  }

  async validateCoupon(code: string, subtotal: number): Promise<{ 
    isValid: boolean; 
    message?: string;
    coupon?: Coupon;
  }> {
    const coupon = await this.findByCode(code);

    if (!coupon) {
      return { isValid: false, message: 'Coupon not found' };
    }

    if (!coupon.isActive) {
      return { isValid: false, message: 'Coupon is inactive' };
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { isValid: false, message: 'Coupon has expired' };
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return { isValid: false, message: 'Coupon usage limit reached' };
    }

    if (coupon.minimumPurchaseAmount && subtotal < coupon.minimumPurchaseAmount) {
      return { 
        isValid: false, 
        message: `Minimum purchase amount of ${coupon.minimumPurchaseAmount} required` 
      };
    }

    return { isValid: true, coupon };
  }

  calculateDiscountAmount(coupon: Coupon, subtotal: number): number {
    if (coupon.type === CouponType.PERCENTAGE) {
      // Calculate percentage discount
      const discountAmount = (subtotal * coupon.value) / 100;
      return Number(discountAmount.toFixed(2));
    } else {
      // Fixed amount discount
      return Math.min(coupon.value, subtotal);
    }
  }

  async applyCoupon(code: string, subtotal: number): Promise<{
    discountAmount: number;
    coupon: Coupon;
  }> {
    const validation = await this.validateCoupon(code, subtotal);

    if (!validation.isValid || !validation.coupon) {
      throw new CouponValidationError(validation.message || 'Invalid coupon');
    }

    const discountAmount = this.calculateDiscountAmount(validation.coupon, subtotal);

    // Increment usage count
    await this.couponRepository.update(
      { id: validation.coupon.id },
      { currentUses: () => 'current_uses + 1' }
    );

    return {
      discountAmount,
      coupon: validation.coupon
    };
  }

  async releaseCoupon(code: string): Promise<void> {
    const coupon = await this.findByCode(code);
    
    if (coupon && coupon.currentUses > 0) {
      await this.couponRepository.update(
        { id: coupon.id },
        { currentUses: () => 'current_uses - 1' }
      );
    }
  }

  async delete(id: string): Promise<void> {
    const coupon = await this.findById(id);
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    await this.couponRepository.delete(id);
  }

  async findAll(params: {
    page: number;
    limit: number;
    isActive?: boolean;
    type?: CouponType;
  }): Promise<[Coupon[], number]> {
    const { page, limit, isActive, type } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.couponRepository.createQueryBuilder('coupon');

    // Add filters only if they are defined
    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('coupon.isActive = :isActive', { isActive });
    }

    if (type) {
      queryBuilder.andWhere('coupon.type = :type', { type });
    }

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Add pagination
    queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('coupon.createdAt', 'DESC');

    const coupons = await queryBuilder.getMany();

    return [coupons, total];
  }
} 
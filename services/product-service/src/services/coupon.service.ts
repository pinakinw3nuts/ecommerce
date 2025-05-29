import { AppDataSource } from '../config/dataSource';
import { Coupon } from '../entities/Coupon';
import { Product } from '../entities/Product';
import { In, MoreThan, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';

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
    // Check if coupon code already exists
    const existingCoupon = await this.couponRepo.findOne({
      where: { code: data.code }
    });

    if (existingCoupon) {
      throw new Error(`Coupon code '${data.code}' already exists`);
    }

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
    valueMin?: number;
    valueMax?: number;
    discountType?: 'PERCENTAGE' | 'FIXED';
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
  }) {
    const currentDate = new Date();
    const where: any = {};

    console.log('listCoupons - Input options:', options);

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    // Only filter by endDate if includeExpired is explicitly set to false
    if (options?.includeExpired === false) {
      where.endDate = MoreThan(currentDate);
    }
    
    // Add filter by discount type if specified
    if (options?.discountType) {
      where.discountType = options.discountType;
    }
    
    // Add filter by discount amount range
    if (options?.valueMin !== undefined) {
      where.discountAmount = MoreThanOrEqual(options.valueMin);
    }
    
    if (options?.valueMax !== undefined) {
      if (where.discountAmount) {
        // If we already have a min condition, use a raw where clause
        where.discountAmount = Between(
          options.valueMin !== undefined ? options.valueMin : 0,
          options.valueMax
        );
      } else {
        where.discountAmount = LessThanOrEqual(options.valueMax);
      }
    }

    console.log('listCoupons - Query conditions:', where);

    // Set up sorting
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrderInput = options?.sortOrder || 'DESC';
    // Normalize sort order to uppercase
    const sortOrder = typeof sortOrderInput === 'string' 
      ? sortOrderInput.toUpperCase() as 'ASC' | 'DESC'
      : 'DESC';
    
    // Create order object
    const order: any = {};
    order[sortBy] = sortOrder;
    
    console.log('Sorting by:', sortBy, sortOrder);

    try {
      // First try to get total count
      const total = await this.couponRepo.count();
      console.log('Total coupons in database:', total);

      // Now try to get all coupons without any conditions
      const allCoupons = await this.couponRepo.find();
      console.log('All coupons without conditions count:', allCoupons.length);

      // Then try with our conditions
      const result = await this.couponRepo.find({
        where,
        skip: options?.skip,
        take: options?.take,
        order,
        relations: ['products']
      });

      console.log('listCoupons - Filtered results count:', result.length);
      return result;
    } catch (error) {
      console.error('Error in listCoupons:', error);
      throw error;
    }
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
    console.log('Updating coupon with ID:', id);
    console.log('Update data received:', JSON.stringify(data, null, 2));
    
    const coupon = await this.getCouponById(id);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    console.log('Current coupon state:', JSON.stringify({
      id: coupon.id,
      code: coupon.code,
      isActive: coupon.isActive
    }, null, 2));

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

    // Explicitly handle isActive field
    if (data.isActive !== undefined) {
      console.log('Setting isActive to:', data.isActive);
      coupon.isActive = data.isActive;
    }

    // Update other fields
    const { isActive, ...otherData } = data;
    Object.assign(coupon, otherData);
    
    console.log('Coupon after updates (before save):', JSON.stringify({
      id: coupon.id,
      code: coupon.code,
      isActive: coupon.isActive
    }, null, 2));
    
    const updatedCoupon = await this.couponRepo.save(coupon);
    
    console.log('Coupon after save:', JSON.stringify({
      id: updatedCoupon.id,
      code: updatedCoupon.code,
      isActive: updatedCoupon.isActive
    }, null, 2));
    
    return updatedCoupon;
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
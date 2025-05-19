import { AppDataSource } from '../config/dataSource';
import { ProductBundle } from '../entities/ProductBundle';
import { Product } from '../entities/Product';
import { In } from 'typeorm';

export class BundleService {
  private bundleRepo = AppDataSource.getRepository(ProductBundle);
  private productRepo = AppDataSource.getRepository(Product);

  async createBundle(data: {
    name: string;
    description?: string;
    price: number;
    discountPercentage?: number;
    startDate?: Date;
    endDate?: Date;
    stockQuantity?: number;
    metadata?: {
      thumbnail?: string;
      savings?: number;
      originalPrice?: number;
    };
    productIds: string[];
  }) {
    const products = await this.productRepo.findBy({ id: In(data.productIds) });
    
    // Calculate original price and savings if not provided
    if (!data.metadata?.originalPrice) {
      const originalPrice = products.reduce((sum, product) => sum + product.price, 0);
      data.metadata = {
        ...data.metadata,
        originalPrice,
        savings: originalPrice - data.price
      };
    }

    const bundle = this.bundleRepo.create({
      ...data,
      products
    });

    return this.bundleRepo.save(bundle);
  }

  async listBundles(options?: {
    skip?: number;
    take?: number;
    isActive?: boolean;
    includeExpired?: boolean;
  }) {
    const currentDate = new Date();
    const where: any = {
      isActive: options?.isActive ?? true
    };

    if (!options?.includeExpired) {
      where.endDate = null;
      // Include bundles that haven't ended yet
      where.endDate = {
        $or: [
          { $gt: currentDate },
          { $eq: null }
        ]
      };
    }

    return this.bundleRepo.find({
      where,
      relations: ['products'],
      skip: options?.skip,
      take: options?.take,
      order: { createdAt: 'DESC' }
    });
  }

  async getBundleById(id: string) {
    return this.bundleRepo.findOne({
      where: { id },
      relations: ['products']
    });
  }

  async updateBundle(id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    discountPercentage: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    stockQuantity: number;
    metadata: {
      thumbnail?: string;
      savings?: number;
      originalPrice?: number;
    };
    productIds: string[];
  }>) {
    const bundle = await this.bundleRepo.findOneOrFail({ 
      where: { id },
      relations: ['products']
    });

    if (data.productIds) {
      const products = await this.productRepo.findBy({ id: In(data.productIds) });
      bundle.products = products;

      // Recalculate original price and savings if price changes
      if (data.price || data.productIds) {
        const originalPrice = products.reduce((sum, product) => sum + product.price, 0);
        data.metadata = {
          ...bundle.metadata,
          ...data.metadata,
          originalPrice,
          savings: originalPrice - (data.price ?? bundle.price)
        };
      }
    }

    Object.assign(bundle, data);
    return this.bundleRepo.save(bundle);
  }

  async deleteBundle(id: string) {
    const bundle = await this.bundleRepo.findOneOrFail({ where: { id } });
    return this.bundleRepo.remove(bundle);
  }

  async addProductToBundle(bundleId: string, productId: string) {
    const bundle = await this.bundleRepo.findOneOrFail({
      where: { id: bundleId },
      relations: ['products']
    });
    
    const product = await this.productRepo.findOneOrFail({ where: { id: productId } });
    bundle.products.push(product);

    // Update original price and savings
    const originalPrice = bundle.products.reduce((sum, p) => sum + p.price, 0);
    bundle.metadata = {
      ...bundle.metadata,
      originalPrice,
      savings: originalPrice - bundle.price
    };

    return this.bundleRepo.save(bundle);
  }

  async removeProductFromBundle(bundleId: string, productId: string) {
    const bundle = await this.bundleRepo.findOneOrFail({
      where: { id: bundleId },
      relations: ['products']
    });
    
    bundle.products = bundle.products.filter(p => p.id !== productId);

    // Update original price and savings
    const originalPrice = bundle.products.reduce((sum, p) => sum + p.price, 0);
    bundle.metadata = {
      ...bundle.metadata,
      originalPrice,
      savings: originalPrice - bundle.price
    };

    return this.bundleRepo.save(bundle);
  }
} 
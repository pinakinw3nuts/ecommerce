import { AppDataSource } from '../config/dataSource';
import { Brand } from '../entities/Brand';
import { Product } from '../entities/Product';

export class BrandService {
  private brandRepo = AppDataSource.getRepository(Brand);
  private productRepo = AppDataSource.getRepository(Product);

  async createBrand(data: {
    name: string;
    description?: string;
    logoUrl?: string;
    website?: string;
  }) {
    const brand = this.brandRepo.create(data);
    return this.brandRepo.save(brand);
  }

  async getBrandById(id: string) {
    return this.brandRepo.findOne({
      where: { id },
      relations: ['products']
    });
  }

  async listBrands(options?: { 
    skip?: number; 
    take?: number;
    isActive?: boolean;
  }) {
    return this.brandRepo.find({
      where: options?.isActive !== undefined ? { isActive: options.isActive } : undefined,
      skip: options?.skip,
      take: options?.take,
      order: { name: 'ASC' },
      relations: ['products']
    });
  }

  async updateBrand(id: string, data: Partial<{
    name: string;
    description: string;
    logoUrl: string;
    website: string;
    isActive: boolean;
  }>) {
    await this.brandRepo.update(id, data);
    return this.getBrandById(id);
  }

  async deleteBrand(id: string) {
    const brand = await this.getBrandById(id);
    if (!brand) {
      throw new Error('Brand not found');
    }
    await this.brandRepo.softDelete(id);
    return true;
  }

  async getBrandProducts(brandId: string, options?: {
    skip?: number;
    take?: number;
  }) {
    return this.productRepo.find({
      where: { brand: { id: brandId } },
      skip: options?.skip,
      take: options?.take,
      order: { createdAt: 'DESC' }
    });
  }
} 
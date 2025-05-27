import { AppDataSource } from '../config/dataSource';
import { Category } from '../entities/Category';
import { generateSlug } from '../utils/slugify';
import { FindOptionsWhere, Like, IsNull, DeepPartial, FindOneOptions } from 'typeorm';

export class CategoryService {
  private categoryRepo = AppDataSource.getRepository(Category);

  async createCategory(data: {
    name: string;
    description?: string;
    parentId?: string | null;
    imageUrl?: string;
    isActive?: boolean;
  }): Promise<Category> {
    const slug = generateSlug(data.name);
    const category = this.categoryRepo.create({
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      imageUrl: data.imageUrl,
      isActive: data.isActive,
      slug,
    });
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: string, data: Partial<{
    name: string;
    description: string;
    parentId: string | null;
    imageUrl: string;
    isActive: boolean;
  }>): Promise<Category> {
    const category = await this.categoryRepo.findOneByOrFail({ id });
    
    const updateData: Partial<Category> = {
      ...data,
    };
    
    if (data.name) {
      updateData.slug = generateSlug(data.name);
    }
    
    Object.assign(category, updateData);
    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: string) {
    const category = await this.getCategoryById(id);
    if (!category) {
      throw new Error('Category not found');
    }
    await this.categoryRepo.softDelete(id);
    return true;
  }

  async listCategories(options?: {
    skip?: number;
    take?: number;
    search?: string;
    isActive?: boolean;
    parentId?: string | null;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const where: FindOptionsWhere<Category> = {};
    
    if (options?.search) {
      where.name = Like(`%${options.search}%`);
    }
    
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    
    if (options?.parentId !== undefined) {
      where.parentId = options.parentId === null ? IsNull() : options.parentId;
    }

    const orderBy: any = {};
    if (options?.sortBy) {
      orderBy[options.sortBy] = options?.sortOrder || 'ASC';
    } else {
      orderBy.createdAt = 'DESC';
    }

    const [categories, total] = await this.categoryRepo.findAndCount({
      where,
      skip: options?.skip,
      take: options?.take,
      order: orderBy,
      relations: ['products', 'children', 'parent'],
    });

    return {
      categories,
      total,
      hasMore: options?.take ? (options.skip || 0) + options.take < total : false,
    };
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return this.categoryRepo.findOne({
      where: { id },
      relations: ['products', 'children', 'parent']
    });
  }

  async bulkDeleteCategories(ids: string[]) {
    await this.categoryRepo.softDelete(ids);
    return true;
  }

  async getCategoryProducts(categoryId: string, options?: {
    skip?: number;
    take?: number;
  }) {
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
      relations: ['products'],
    });

    if (!category) {
      return [];
    }

    // If no pagination options, return all products
    if (!options?.skip && !options?.take) {
      return category.products;
    }

    // Apply pagination manually to the products array
    const start = options.skip || 0;
    const end = options.take ? start + options.take : undefined;
    return category.products.slice(start, end);
  }
} 
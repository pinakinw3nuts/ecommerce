import { AppDataSource } from '../config/dataSource';
import { Tag } from '../entities/Tag';
import { Product } from '../entities/Product';
import { In } from 'typeorm';

export class TagService {
  private tagRepo = AppDataSource.getRepository(Tag);
  private productRepo = AppDataSource.getRepository(Product);

  async createTag(data: {
    name: string;
    slug?: string;
    isActive?: boolean;
  }) {
    // Generate slug if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const tag = this.tagRepo.create({
      name: data.name,
      slug,
      isActive: data.isActive !== undefined ? data.isActive : true
    });
    
    return this.tagRepo.save(tag);
  }

  async getTagById(id: string) {
    return this.tagRepo.findOne({
      where: { id },
      relations: ['products']
    });
  }

  async listTags(options?: { 
    skip?: number; 
    take?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const query = this.tagRepo.createQueryBuilder('tag');
    
    if (options?.search) {
      query.where('tag.name LIKE :search', { search: `%${options.search}%` });
    }
    
    // Add isActive filter if specified
    if (options?.isActive !== undefined) {
      const condition = options.search ? 'AND' : 'WHERE';
      query.andWhere(`tag.isActive = :isActive`, { isActive: options.isActive });
    }
    
    // Count total before applying pagination
    const countQuery = query.clone();
    const total = await countQuery.getCount();
    
    if (options?.skip) {
      query.skip(options.skip);
    }
    
    if (options?.take) {
      query.take(options.take);
    }
    
    // Apply sorting
    if (options?.sortBy) {
      const sortOrder = options?.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      query.orderBy(`tag.${options.sortBy}`, sortOrder as 'ASC' | 'DESC');
    } else {
      query.orderBy('tag.name', 'ASC');
    }
    
    const tags = await query.getMany();
    
    return {
      tags,
      total,
      hasMore: options?.take ? (options.skip || 0) + options.take < total : false,
    };
  }

  async updateTag(id: string, data: Partial<{
    name: string;
    slug: string;
    isActive: boolean;
  }>) {
    // If name is updated but slug isn't, update the slug too
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    
    await this.tagRepo.update(id, data);
    return this.getTagById(id);
  }

  async deleteTag(id: string) {
    const tag = await this.getTagById(id);
    if (!tag) {
      throw new Error('Tag not found');
    }
    
    // Check if tag is used by any products
    const productsWithTag = await this.productRepo
      .createQueryBuilder('product')
      .innerJoin('product.tags', 'tag')
      .where('tag.id = :id', { id })
      .getCount();
    
    if (productsWithTag > 0) {
      // Just remove the tag from the products instead of deleting it
      await this.productRepo
        .createQueryBuilder()
        .relation(Product, 'tags')
        .of(await this.productRepo.find({ where: { tags: { id } } }))
        .remove(tag);
    }
    
    await this.tagRepo.delete(id);
    return true;
  }

  async getTagProducts(tagId: string, options?: {
    skip?: number;
    take?: number;
  }) {
    return this.productRepo
      .createQueryBuilder('product')
      .innerJoin('product.tags', 'tag')
      .where('tag.id = :tagId', { tagId })
      .skip(options?.skip || 0)
      .take(options?.take || 10)
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  }
  
  async updateTagsStatus(tagIds: string[], isActive: boolean) {
    // Update multiple tags at once
    const result = await this.tagRepo.update(
      { id: In(tagIds) },
      { isActive }
    );
    
    return {
      count: result.affected || 0,
      success: true
    };
  }
} 
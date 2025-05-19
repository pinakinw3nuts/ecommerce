import { AppDataSource } from '../config/dataSource';
import { ProductAttribute } from '../entities/ProductAttribute';
import { AttributeValue } from '../entities/AttributeValue';
import { Product } from '../entities/Product';

export class AttributeService {
  private attributeRepo = AppDataSource.getRepository(ProductAttribute);
  private valueRepo = AppDataSource.getRepository(AttributeValue);
  private productRepo = AppDataSource.getRepository(Product);

  async createAttribute(data: {
    name: string;
    description?: string;
    type: 'select' | 'multiple' | 'text' | 'number' | 'boolean';
    isFilterable?: boolean;
    isRequired?: boolean;
    sortOrder?: number;
    values?: Array<{
      value: string;
      displayValue?: string;
      metadata?: {
        hexColor?: string;
        imageUrl?: string;
        sortOrder?: number;
      };
    }>;
  }) {
    const attribute = this.attributeRepo.create({
      ...data,
      values: data.values?.map(v => this.valueRepo.create(v))
    });

    return this.attributeRepo.save(attribute);
  }

  async listAttributes(options?: {
    skip?: number;
    take?: number;
    isActive?: boolean;
  }) {
    return this.attributeRepo.find({
      where: { isActive: options?.isActive ?? true },
      relations: ['values'],
      skip: options?.skip,
      take: options?.take,
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
  }

  async getAttributeById(id: string) {
    return this.attributeRepo.findOne({
      where: { id },
      relations: ['values']
    });
  }

  async updateAttribute(id: string, data: Partial<{
    name: string;
    description: string;
    type: 'select' | 'multiple' | 'text' | 'number' | 'boolean';
    isFilterable: boolean;
    isRequired: boolean;
    sortOrder: number;
    isActive: boolean;
  }>) {
    const attribute = await this.attributeRepo.findOneOrFail({ where: { id } });
    Object.assign(attribute, data);
    return this.attributeRepo.save(attribute);
  }

  async deleteAttribute(id: string) {
    const attribute = await this.attributeRepo.findOneOrFail({ where: { id } });
    return this.attributeRepo.remove(attribute);
  }

  async addAttributeValue(attributeId: string, data: {
    value: string;
    displayValue?: string;
    metadata?: {
      hexColor?: string;
      imageUrl?: string;
      sortOrder?: number;
    };
  }) {
    const attribute = await this.attributeRepo.findOneOrFail({ where: { id: attributeId } });
    const value = this.valueRepo.create({
      ...data,
      attribute
    });
    return this.valueRepo.save(value);
  }

  async updateAttributeValue(id: string, data: Partial<{
    value: string;
    displayValue: string;
    metadata: {
      hexColor?: string;
      imageUrl?: string;
      sortOrder?: number;
    };
    isActive: boolean;
  }>) {
    const value = await this.valueRepo.findOneOrFail({ where: { id } });
    Object.assign(value, data);
    return this.valueRepo.save(value);
  }

  async deleteAttributeValue(id: string) {
    const value = await this.valueRepo.findOneOrFail({ where: { id } });
    return this.valueRepo.remove(value);
  }

  async assignAttributesToProduct(productId: string, attributeValues: string[]) {
    const product = await this.productRepo.findOneOrFail({ 
      where: { id: productId },
      relations: ['attributes']
    });
    
    const values = await this.valueRepo.findByIds(attributeValues);
    product.attributes = values;
    
    return this.productRepo.save(product);
  }
} 
import { AppDataSource } from '../config/dataSource';
import { PriceList } from '../entities/PriceList';
import { CustomerGroup } from '../entities/CustomerGroup';
import { ProductPrice } from '../entities/ProductPrice';
import { createLogger } from '../utils/logger';
import { In, IsNull } from 'typeorm';

const logger = createLogger('price-list-service');

/**
 * Interface for creating a price list
 */
export interface CreatePriceListInput {
  name: string;
  description?: string;
  currency: string;
  customerGroupId?: string;
  active?: boolean;
  priority?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Interface for updating a price list
 */
export interface UpdatePriceListInput {
  name?: string;
  description?: string;
  currency?: string;
  customerGroupId?: string | null;
  active?: boolean;
  priority?: number;
  startDate?: Date | null;
  endDate?: Date | null;
}

/**
 * Interface for price list search options
 */
export interface PriceListSearchOptions {
  search?: string;
  currency?: string;
  customerGroupId?: string;
  active?: boolean;
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Service for managing price lists
 */
export class PriceListService {
  private priceListRepo = AppDataSource.getRepository(PriceList);
  private customerGroupRepo = AppDataSource.getRepository(CustomerGroup);
  private productPriceRepo = AppDataSource.getRepository(ProductPrice);

  /**
   * Create a new price list
   */
  async createPriceList(data: CreatePriceListInput): Promise<PriceList> {
    try {
      logger.debug({ data }, 'Creating price list');

      // Validate customer group if provided
      if (data.customerGroupId) {
        const customerGroup = await this.customerGroupRepo.findOne({
          where: { id: data.customerGroupId }
        });

        if (!customerGroup) {
          throw new Error(`Customer group with ID ${data.customerGroupId} not found`);
        }
      }

      // Create the price list
      const priceList = this.priceListRepo.create({
        name: data.name,
        description: data.description,
        currency: data.currency,
        customerGroupId: data.customerGroupId,
        active: data.active !== undefined ? data.active : true,
        priority: data.priority !== undefined ? data.priority : 0,
        startDate: data.startDate,
        endDate: data.endDate
      });

      // Save and return the price list
      const savedPriceList = await this.priceListRepo.save(priceList);
      logger.info({ priceListId: savedPriceList.id }, 'Price list created');
      
      return savedPriceList;
    } catch (error) {
      logger.error({ error, data }, 'Error creating price list');
      throw error;
    }
  }

  /**
   * Get a price list by ID
   */
  async getPriceListById(id: string, includeRelations: boolean = false): Promise<PriceList | null> {
    try {
      const relations = includeRelations ? ['customerGroup', 'productPrices'] : [];
      
      return this.priceListRepo.findOne({
        where: { id },
        relations
      });
    } catch (error) {
      logger.error({ error, id }, 'Error getting price list');
      throw error;
    }
  }

  /**
   * Search for price lists with various filters
   */
  async searchPriceLists(options: PriceListSearchOptions = {}): Promise<{ 
    priceLists: PriceList[]; 
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        search,
        currency,
        customerGroupId,
        active,
        skip = 0,
        take = 10,
        sortBy = 'priority',
        sortOrder = 'DESC'
      } = options;

      // Build query
      const query = this.priceListRepo.createQueryBuilder('priceList');
      
      // Apply filters
      if (search) {
        query.andWhere('(priceList.name LIKE :search OR priceList.description LIKE :search)', 
          { search: `%${search}%` });
      }
      
      if (currency) {
        query.andWhere('priceList.currency = :currency', { currency });
      }
      
      if (customerGroupId === null) {
        query.andWhere('priceList.customerGroupId IS NULL');
      } else if (customerGroupId) {
        query.andWhere('priceList.customerGroupId = :customerGroupId', { customerGroupId });
      }
      
      if (active !== undefined) {
        query.andWhere('priceList.active = :active', { active });
      }
      
      // Count total before pagination
      const total = await query.getCount();
      
      // Apply pagination
      query.skip(skip).take(take);
      
      // Apply sorting
      const validSortColumns = ['name', 'currency', 'priority', 'active', 'createdAt', 'updatedAt'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'priority';
      query.orderBy(`priceList.${sortColumn}`, sortOrder);
      
      // Add secondary sort for consistent pagination
      if (sortColumn !== 'name') {
        query.addOrderBy('priceList.name', 'ASC');
      }
      
      // Execute query
      const priceLists = await query.getMany();
      
      return {
        priceLists,
        total,
        hasMore: skip + take < total
      };
    } catch (error) {
      logger.error({ error, options }, 'Error searching price lists');
      throw error;
    }
  }

  /**
   * Update a price list
   */
  async updatePriceList(id: string, data: UpdatePriceListInput): Promise<PriceList> {
    try {
      logger.debug({ id, data }, 'Updating price list');

      // Find price list
      const priceList = await this.priceListRepo.findOne({
        where: { id }
      });

      if (!priceList) {
        throw new Error(`Price list with ID ${id} not found`);
      }

      // Validate customer group if provided
      if (data.customerGroupId) {
        const customerGroup = await this.customerGroupRepo.findOne({
          where: { id: data.customerGroupId }
        });

        if (!customerGroup) {
          throw new Error(`Customer group with ID ${data.customerGroupId} not found`);
        }
      }

      // Update fields
      if (data.name !== undefined) priceList.name = data.name;
      if (data.description !== undefined) priceList.description = data.description;
      if (data.currency !== undefined) priceList.currency = data.currency;
      if (data.customerGroupId !== undefined) {
        // Allow null to remove customer group association
        priceList.customerGroupId = data.customerGroupId as string;
      }
      if (data.active !== undefined) priceList.active = data.active;
      if (data.priority !== undefined) priceList.priority = data.priority;
      if (data.startDate !== undefined) {
        // Allow null to remove date
        priceList.startDate = data.startDate as Date;
      }
      if (data.endDate !== undefined) {
        // Allow null to remove date
        priceList.endDate = data.endDate as Date;
      }

      // Save and return updated price list
      const updatedPriceList = await this.priceListRepo.save(priceList);
      logger.info({ priceListId: id }, 'Price list updated');
      
      return updatedPriceList;
    } catch (error) {
      logger.error({ error, id, data }, 'Error updating price list');
      throw error;
    }
  }

  /**
   * Delete a price list
   */
  async deletePriceList(id: string): Promise<boolean> {
    try {
      logger.debug({ id }, 'Deleting price list');

      // Check if price list exists
      const priceList = await this.priceListRepo.findOne({
        where: { id }
      });

      if (!priceList) {
        throw new Error(`Price list with ID ${id} not found`);
      }

      // Delete the price list (cascade will handle product prices)
      await this.priceListRepo.remove(priceList);
      
      logger.info({ priceListId: id }, 'Price list deleted');
      return true;
    } catch (error) {
      logger.error({ error, id }, 'Error deleting price list');
      throw error;
    }
  }

  /**
   * Bulk update price list status
   */
  async bulkUpdateStatus(ids: string[], active: boolean): Promise<number> {
    try {
      logger.debug({ ids, active }, 'Bulk updating price list status');

      const result = await this.priceListRepo.update(
        { id: In(ids) },
        { active }
      );

      logger.info({ count: result.affected, active }, 'Bulk updated price list status');
      return result.affected || 0;
    } catch (error) {
      logger.error({ error, ids, active }, 'Error bulk updating price list status');
      throw error;
    }
  }

  /**
   * Get price lists by customer group
   */
  async getPriceListsByCustomerGroup(customerGroupId: string): Promise<PriceList[]> {
    try {
      return this.priceListRepo.find({
        where: { customerGroupId },
        order: {
          priority: 'DESC',
          name: 'ASC'
        }
      });
    } catch (error) {
      logger.error({ error, customerGroupId }, 'Error getting price lists by customer group');
      throw error;
    }
  }

  /**
   * Clone a price list
   */
  async clonePriceList(id: string, newName: string, options: {
    includeProducts?: boolean;
    targetCustomerGroupId?: string | null;
    active?: boolean;
  } = {}): Promise<PriceList> {
    try {
      logger.debug({ id, newName, options }, 'Cloning price list');

      // Get source price list with product prices
      const sourcePriceList = await this.priceListRepo.findOne({
        where: { id },
        relations: options.includeProducts ? ['productPrices'] : []
      });

      if (!sourcePriceList) {
        throw new Error(`Price list with ID ${id} not found`);
      }

      // Validate target customer group if provided
      if (options.targetCustomerGroupId) {
        const customerGroup = await this.customerGroupRepo.findOne({
          where: { id: options.targetCustomerGroupId }
        });

        if (!customerGroup) {
          throw new Error(`Customer group with ID ${options.targetCustomerGroupId} not found`);
        }
      }

      // Create new price list with correct type handling for nullable fields
      const newPriceList = new PriceList();
      newPriceList.name = newName;
      newPriceList.description = `Cloned from ${sourcePriceList.name}`;
      newPriceList.currency = sourcePriceList.currency;
      newPriceList.customerGroupId = options.targetCustomerGroupId !== undefined 
        ? (options.targetCustomerGroupId as string) // Cast to string to satisfy TypeScript
        : sourcePriceList.customerGroupId;
      newPriceList.active = options.active !== undefined ? options.active : false;
      newPriceList.priority = sourcePriceList.priority;
      newPriceList.startDate = sourcePriceList.startDate;
      newPriceList.endDate = sourcePriceList.endDate;

      // Save new price list
      const savedPriceList = await this.priceListRepo.save(newPriceList);

      // Clone product prices if requested
      if (options.includeProducts && sourcePriceList.productPrices && sourcePriceList.productPrices.length > 0) {
        // Create array of new product prices
        const newProductPrices: Partial<ProductPrice>[] = [];
        
        for (const price of sourcePriceList.productPrices) {
          const newPrice = new ProductPrice();
          // Copy relevant properties
          newPrice.priceListId = savedPriceList.id;
          newPrice.productId = price.productId;
          newPrice.variantId = price.variantId;
          newPrice.basePrice = price.basePrice;
          newPrice.salePrice = price.salePrice;
          newPrice.saleStartDate = price.saleStartDate;
          newPrice.saleEndDate = price.saleEndDate;
          newPrice.tieredPrices = price.tieredPrices;
          newPrice.minPrice = price.minPrice;
          newPrice.maxPrice = price.maxPrice;
          newPrice.active = price.active;
          newPrice.externalReference = price.externalReference;
          
          newProductPrices.push(newPrice);
        }
        
        // Save all product prices
        if (newProductPrices.length > 0) {
          await this.productPriceRepo.save(newProductPrices);
        }
      }

      logger.info({ 
        sourcePriceListId: id, 
        newPriceListId: savedPriceList.id 
      }, 'Price list cloned');
      
      return savedPriceList;
    } catch (error) {
      logger.error({ error, id, newName, options }, 'Error cloning price list');
      throw error;
    }
  }

  /**
   * Get default price list
   */
  async getDefaultPriceList(currency: string): Promise<PriceList | null> {
    try {
      return this.priceListRepo.findOne({
        where: {
          currency,
          customerGroupId: IsNull(),
          active: true
        },
        order: {
          priority: 'DESC'
        }
      });
    } catch (error) {
      logger.error({ error, currency }, 'Error getting default price list');
      throw error;
    }
  }
}

// Export singleton instance
export const priceListService = new PriceListService(); 
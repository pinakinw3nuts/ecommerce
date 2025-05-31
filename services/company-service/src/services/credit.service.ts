import { DataSource, Repository, In } from 'typeorm';
import { Company } from '../entities/Company';
import logger from '../utils/logger';

// Define credit transaction types
export enum CreditTransactionType {
  CREDIT_ASSIGNMENT = 'CREDIT_ASSIGNMENT',
  CREDIT_INCREASE = 'CREDIT_INCREASE',
  INVOICE_PAYMENT = 'INVOICE_PAYMENT',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  CREDIT_ADJUSTMENT = 'CREDIT_ADJUSTMENT',
  CREDIT_REFUND = 'CREDIT_REFUND'
}

// Define credit transaction interface
export interface CreditTransaction {
  companyId: string;
  type: CreditTransactionType;
  amount: number;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
}

export class CreditService {
  private companyRepository: Repository<Company>;
  // In a real implementation, we would have a CreditTransaction entity and repository
  // For now, we'll simulate transactions in memory for demonstration
  private transactions: CreditTransaction[] = [];

  constructor(private dataSource: DataSource) {
    this.companyRepository = this.dataSource.getRepository(Company);
  }

  /**
   * Get company credit information
   */
  async getCreditInfo(companyId: string): Promise<{ 
    creditLimit: number; 
    availableCredit: number; 
    usedCredit: number;
  }> {
    try {
      const company = await this.companyRepository.findOneBy({ id: companyId });
      
      if (!company) {
        throw new Error(`Company with ID ${companyId} not found`);
      }

      const usedCredit = company.creditLimit - company.availableCredit;
      
      return {
        creditLimit: company.creditLimit,
        availableCredit: company.availableCredit,
        usedCredit
      };
    } catch (error) {
      logger.error({ error, companyId }, 'Error fetching company credit info');
      throw error;
    }
  }

  /**
   * Set credit limit for a company
   */
  async setCreditLimit(
    companyId: string, 
    newLimit: number, 
    userId: string,
    reason?: string
  ): Promise<{ 
    success: boolean; 
    creditLimit: number; 
    availableCredit: number;
    previousLimit: number;
  }> {
    return this.dataSource.transaction(async transactionManager => {
      try {
        if (newLimit < 0) {
          throw new Error('Credit limit cannot be negative');
        }

        const company = await transactionManager.findOneBy(Company, { id: companyId });
        
        if (!company) {
          throw new Error(`Company with ID ${companyId} not found`);
        }

        const previousLimit = company.creditLimit;
        const currentAvailable = company.availableCredit;
        
        // Calculate the difference between new and old limits
        const limitDifference = newLimit - previousLimit;
        
        // Adjust available credit accordingly
        const newAvailableCredit = currentAvailable + limitDifference;
        
        // Update company
        company.creditLimit = newLimit;
        company.availableCredit = newAvailableCredit;
        
        const updatedCompany = await transactionManager.save(company);
        
        // Record the transaction
        this.recordTransaction({
          companyId,
          type: CreditTransactionType.CREDIT_ASSIGNMENT,
          amount: limitDifference,
          description: reason || `Credit limit changed from ${previousLimit} to ${newLimit}`,
          createdBy: userId,
          createdAt: new Date()
        });
        
        logger.info({ 
          companyId, 
          previousLimit, 
          newLimit, 
          availableCredit: newAvailableCredit 
        }, 'Company credit limit updated');
        
        return {
          success: true,
          creditLimit: updatedCompany.creditLimit,
          availableCredit: updatedCompany.availableCredit,
          previousLimit
        };
      } catch (error) {
        logger.error({ error, companyId, newLimit }, 'Error setting company credit limit');
        throw error;
      }
    });
  }

  /**
   * Reserve credit for a purchase order or other transaction
   */
  async reserveCredit(
    companyId: string, 
    amount: number, 
    referenceId: string,
    referenceType: string,
    userId: string,
    description?: string
  ): Promise<{ 
    success: boolean; 
    availableCredit: number;
    transactionId: string;
  }> {
    return this.dataSource.transaction(async transactionManager => {
      try {
        if (amount <= 0) {
          throw new Error('Reserve amount must be positive');
        }

        const company = await transactionManager.findOneBy(Company, { id: companyId });
        
        if (!company) {
          throw new Error(`Company with ID ${companyId} not found`);
        }

        // Check if company has enough available credit
        if (company.availableCredit < amount) {
          throw new Error(`Insufficient available credit. Requested: ${amount}, Available: ${company.availableCredit}`);
        }
        
        // Deduct from available credit
        company.availableCredit -= amount;
        
        const updatedCompany = await transactionManager.save(company);
        
        // Generate a transaction ID (in a real implementation, this would be from the database)
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Record the transaction
        this.recordTransaction({
          companyId,
          type: CreditTransactionType.PURCHASE_ORDER,
          amount: -amount, // Negative amount for deduction
          referenceId,
          referenceType,
          description: description || `Credit reserved for ${referenceType} #${referenceId}`,
          createdBy: userId,
          createdAt: new Date()
        });
        
        logger.info({ 
          companyId, 
          amount, 
          referenceId,
          referenceType,
          availableCredit: updatedCompany.availableCredit 
        }, 'Credit reserved successfully');
        
        return {
          success: true,
          availableCredit: updatedCompany.availableCredit,
          transactionId
        };
      } catch (error) {
        logger.error({ 
          error, 
          companyId, 
          amount, 
          referenceId,
          referenceType 
        }, 'Error reserving credit');
        throw error;
      }
    });
  }

  /**
   * Release previously reserved credit (e.g., cancelled order)
   */
  async releaseCredit(
    companyId: string, 
    amount: number, 
    referenceId: string,
    referenceType: string,
    userId: string,
    description?: string
  ): Promise<{ 
    success: boolean; 
    availableCredit: number;
  }> {
    return this.dataSource.transaction(async transactionManager => {
      try {
        if (amount <= 0) {
          throw new Error('Release amount must be positive');
        }

        const company = await transactionManager.findOneBy(Company, { id: companyId });
        
        if (!company) {
          throw new Error(`Company with ID ${companyId} not found`);
        }
        
        // Add back to available credit
        company.availableCredit += amount;
        
        // Ensure available credit doesn't exceed limit
        if (company.availableCredit > company.creditLimit) {
          company.availableCredit = company.creditLimit;
        }
        
        const updatedCompany = await transactionManager.save(company);
        
        // Record the transaction
        this.recordTransaction({
          companyId,
          type: CreditTransactionType.CREDIT_REFUND,
          amount: amount, // Positive amount for addition
          referenceId,
          referenceType,
          description: description || `Credit released for ${referenceType} #${referenceId}`,
          createdBy: userId,
          createdAt: new Date()
        });
        
        logger.info({ 
          companyId, 
          amount, 
          referenceId,
          referenceType,
          availableCredit: updatedCompany.availableCredit 
        }, 'Credit released successfully');
        
        return {
          success: true,
          availableCredit: updatedCompany.availableCredit
        };
      } catch (error) {
        logger.error({ 
          error, 
          companyId, 
          amount, 
          referenceId,
          referenceType 
        }, 'Error releasing credit');
        throw error;
      }
    });
  }

  /**
   * Manually adjust credit (for admin operations)
   */
  async adjustCredit(
    companyId: string, 
    amount: number, 
    userId: string,
    reason: string
  ): Promise<{ 
    success: boolean; 
    availableCredit: number;
  }> {
    return this.dataSource.transaction(async transactionManager => {
      try {
        const company = await transactionManager.findOneBy(Company, { id: companyId });
        
        if (!company) {
          throw new Error(`Company with ID ${companyId} not found`);
        }
        
        // Adjust available credit
        company.availableCredit += amount;
        
        // Ensure available credit doesn't exceed limit and isn't negative
        if (company.availableCredit > company.creditLimit) {
          company.availableCredit = company.creditLimit;
        } else if (company.availableCredit < 0) {
          company.availableCredit = 0;
        }
        
        const updatedCompany = await transactionManager.save(company);
        
        // Record the transaction
        this.recordTransaction({
          companyId,
          type: CreditTransactionType.CREDIT_ADJUSTMENT,
          amount,
          description: reason || `Manual credit adjustment: ${amount > 0 ? 'Increase' : 'Decrease'} by ${Math.abs(amount)}`,
          createdBy: userId,
          createdAt: new Date()
        });
        
        logger.info({ 
          companyId, 
          amount, 
          reason,
          availableCredit: updatedCompany.availableCredit 
        }, 'Credit manually adjusted');
        
        return {
          success: true,
          availableCredit: updatedCompany.availableCredit
        };
      } catch (error) {
        logger.error({ 
          error, 
          companyId, 
          amount, 
          reason 
        }, 'Error adjusting credit');
        throw error;
      }
    });
  }

  /**
   * Get credit transactions for a company
   */
  async getCreditTransactions(
    companyId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      types?: CreditTransactionType[];
      referenceId?: string;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{
    transactions: CreditTransaction[];
    total: number;
  }> {
    try {
      // Filter transactions
      let filteredTransactions = this.transactions.filter(t => t.companyId === companyId);
      
      if (filters) {
        if (filters.startDate) {
          filteredTransactions = filteredTransactions.filter(t => 
            t.createdAt >= filters.startDate!
          );
        }
        
        if (filters.endDate) {
          filteredTransactions = filteredTransactions.filter(t => 
            t.createdAt <= filters.endDate!
          );
        }
        
        if (filters.types && filters.types.length > 0) {
          filteredTransactions = filteredTransactions.filter(t => 
            filters.types!.includes(t.type)
          );
        }
        
        if (filters.referenceId) {
          filteredTransactions = filteredTransactions.filter(t => 
            t.referenceId === filters.referenceId
          );
        }
      }
      
      // Sort by date descending
      filteredTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const total = filteredTransactions.length;
      
      // Apply pagination if provided
      if (pagination) {
        const { page, limit } = pagination;
        const startIndex = (page - 1) * limit;
        filteredTransactions = filteredTransactions.slice(startIndex, startIndex + limit);
      }
      
      return {
        transactions: filteredTransactions,
        total
      };
    } catch (error) {
      logger.error({ 
        error, 
        companyId, 
        filters,
        pagination
      }, 'Error fetching credit transactions');
      throw error;
    }
  }

  /**
   * Get credit utilization for multiple companies
   * Useful for admin dashboards and reports
   */
  async getBulkCreditUtilization(
    companyIds: string[]
  ): Promise<Array<{
    companyId: string;
    creditLimit: number;
    availableCredit: number;
    utilizationPercentage: number;
  }>> {
    try {
      const companies = await this.companyRepository.find({
        where: { id: In(companyIds) }
      });
      
      return companies.map(company => {
        const utilizationPercentage = company.creditLimit > 0 
          ? ((company.creditLimit - company.availableCredit) / company.creditLimit) * 100
          : 0;
          
        return {
          companyId: company.id,
          creditLimit: company.creditLimit,
          availableCredit: company.availableCredit,
          utilizationPercentage: Math.round(utilizationPercentage * 100) / 100 // Round to 2 decimal places
        };
      });
    } catch (error) {
      logger.error({ 
        error, 
        companyIds
      }, 'Error fetching bulk credit utilization');
      throw error;
    }
  }

  /**
   * Private method to record credit transactions
   * In a real implementation, this would save to a database
   */
  private recordTransaction(transaction: CreditTransaction): void {
    this.transactions.push(transaction);
    
    // In a real implementation, we would persist this to a database
    logger.debug({
      companyId: transaction.companyId,
      type: transaction.type,
      amount: transaction.amount,
      referenceId: transaction.referenceId
    }, 'Credit transaction recorded');
  }
} 
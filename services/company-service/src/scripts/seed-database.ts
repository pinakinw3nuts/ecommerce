import { AppDataSource } from '../config/dataSource';
import { Company } from '../entities/Company';
import { CompanyProfile } from '../entities/CompanyProfile';
import { CompanyUser } from '../entities/CompanyUser';
import { CompanyRole } from '../constants/roles';
import logger from '../utils/logger';

/**
 * Script to seed the database with initial data
 */
async function seedDatabase() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    logger.info('Database connection established');
    
    // Get repositories
    const companyRepository = AppDataSource.getRepository(Company);
    const companyProfileRepository = AppDataSource.getRepository(CompanyProfile);
    const companyUserRepository = AppDataSource.getRepository(CompanyUser);
    
    // Check if we already have data
    const companyCount = await companyRepository.count();
    
    if (companyCount > 0) {
      logger.info(`Database already has ${companyCount} companies. Skipping seed.`);
      await AppDataSource.destroy();
      return;
    }
    
    // Create sample companies
    logger.info('Seeding database with sample data...');
    
    // Sample company 1
    const company1 = companyRepository.create({
      name: 'Acme Corporation',
      gstNumber: 'GST123456789',
      creditLimit: 50000,
      availableCredit: 50000,
      country: 'USA',
      phoneNumber: '+1-555-123-4567',
      email: 'info@acmecorp.com',
      website: 'https://www.acmecorp.com',
      billingAddress: {
        street: '123 Business Ave',
        city: 'Metropolis',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      },
      shippingAddress: {
        street: '123 Business Ave',
        city: 'Metropolis',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      },
      settings: {
        allowPurchaseOrders: true,
        requirePOApproval: true,
        invoiceTermDays: 30,
        taxExempt: false,
        allowedPaymentMethods: ['credit_card', 'bank_transfer']
      }
    });
    
    await companyRepository.save(company1);
    
    // Create company profile
    const profile1 = companyProfileRepository.create({
      companyId: company1.id,
      industry: 'Manufacturing',
      businessType: 'Corporation',
      yearEstablished: 1985,
      numberOfEmployees: 500,
      description: 'Leading manufacturer of innovative products',
      logoUrl: 'https://example.com/acme-logo.png',
      socialProfiles: {
        linkedin: 'https://linkedin.com/company/acme',
        twitter: 'https://twitter.com/acme'
      },
      documents: [
        {
          name: 'Company Registration',
          type: 'pdf',
          url: 'https://example.com/docs/acme-registration.pdf',
          uploadedAt: new Date()
        }
      ]
    });
    
    await companyProfileRepository.save(profile1);
    
    // Create company user
    const user1 = companyUserRepository.create({
      userId: '00000000-0000-0000-0000-000000000001', // Sample user ID
      companyId: company1.id,
      role: CompanyRole.ADMIN,
      title: 'CEO',
      department: 'Executive',
      permissions: {
        canManageUsers: true,
        canViewReports: true,
        canApproveOrders: true,
        orderApprovalLimit: 10000,
        canManageProducts: true
      },
      isActive: true,
      hasAcceptedInvitation: true
    });
    
    await companyUserRepository.save(user1);
    
    // Sample company 2
    const company2 = companyRepository.create({
      name: 'TechNova Solutions',
      gstNumber: 'GST987654321',
      creditLimit: 25000,
      availableCredit: 25000,
      country: 'Canada',
      phoneNumber: '+1-555-987-6543',
      email: 'contact@technova.com',
      website: 'https://www.technova.com',
      billingAddress: {
        street: '456 Innovation Drive',
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5V 2N4',
        country: 'Canada'
      },
      shippingAddress: {
        street: '456 Innovation Drive',
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5V 2N4',
        country: 'Canada'
      },
      settings: {
        allowPurchaseOrders: true,
        requirePOApproval: false,
        invoiceTermDays: 15,
        taxExempt: false,
        allowedPaymentMethods: ['credit_card', 'bank_transfer', 'credit_account']
      }
    });
    
    await companyRepository.save(company2);
    
    // Create company profile
    const profile2 = companyProfileRepository.create({
      companyId: company2.id,
      industry: 'Technology',
      businessType: 'Private Company',
      yearEstablished: 2010,
      numberOfEmployees: 120,
      description: 'Innovative technology solutions provider',
      logoUrl: 'https://example.com/technova-logo.png',
      socialProfiles: {
        linkedin: 'https://linkedin.com/company/technova',
        twitter: 'https://twitter.com/technova'
      },
      documents: [
        {
          name: 'Company Registration',
          type: 'pdf',
          url: 'https://example.com/docs/technova-registration.pdf',
          uploadedAt: new Date()
        }
      ]
    });
    
    await companyProfileRepository.save(profile2);
    
    // Create company user
    const user2 = companyUserRepository.create({
      userId: '00000000-0000-0000-0000-000000000002', // Sample user ID
      companyId: company2.id,
      role: CompanyRole.ADMIN,
      title: 'CTO',
      department: 'Technology',
      permissions: {
        canManageUsers: true,
        canViewReports: true,
        canApproveOrders: true,
        orderApprovalLimit: 5000,
        canManageProducts: true
      },
      isActive: true,
      hasAcceptedInvitation: true
    });
    
    await companyUserRepository.save(user2);
    
    logger.info('Database seeded successfully');
    
    // Close the connection
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error seeding database:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    logger.info('Database seeding process completed');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Database seeding process failed:', error);
    process.exit(1);
  }); 
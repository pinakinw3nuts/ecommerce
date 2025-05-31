import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { AppDataSource } from '../config/dataSource';
import { Company } from '../entities/Company';
import { CompanyUser } from '../entities/CompanyUser';
import { CompanyProfile } from '../entities/CompanyProfile';
import { CompanyService } from '../services/company.service';
import { CompanyUserService } from '../services/companyUser.service';
import { CreditService } from '../services/credit.service';

/**
 * Plugin that decorates Fastify with database repositories and services
 */
export const databasePlugin = fp(async (fastify: FastifyInstance) => {
  // Decorate fastify with the data source
  fastify.decorate('dataSource', AppDataSource);
  
  // Get repositories
  const companyRepository = AppDataSource.getRepository(Company);
  const companyUserRepository = AppDataSource.getRepository(CompanyUser);
  const companyProfileRepository = AppDataSource.getRepository(CompanyProfile);
  
  // Decorate fastify with repositories
  fastify.decorate('repositories', {
    company: companyRepository,
    companyUser: companyUserRepository,
    companyProfile: companyProfileRepository
  });
  
  // Create and decorate with services
  const companyService = new CompanyService(AppDataSource);
  const companyUserService = new CompanyUserService(AppDataSource);
  const creditService = new CreditService(AppDataSource);
  
  fastify.decorate('services', {
    company: companyService,
    companyUser: companyUserService,
    credit: creditService
  });
  
  // Clean up on close
  fastify.addHook('onClose', async (instance) => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      instance.log.info('Database connection closed');
    }
  });
}); 
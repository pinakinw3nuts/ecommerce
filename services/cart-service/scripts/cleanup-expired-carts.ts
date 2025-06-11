#!/usr/bin/env node

/**
 * Script to clean up expired carts
 * 
 * This script can be run as a scheduled job to remove expired carts from the database.
 * It connects to the database, finds all expired carts, and removes them.
 * 
 * Usage:
 *   npx ts-node scripts/cleanup-expired-carts.ts
 */

import { AppDataSource } from '../src/config/database';
import { CartService } from '../src/services/cart.service';
import { Cart } from '../src/entities/Cart';
import { CartItem } from '../src/entities/CartItem';
import { createLogger } from '../src/utils/logger';
import { Logger } from 'pino';

// Cast the logger to the correct type
const logger = createLogger('CleanupScript') as Logger;

async function main() {
  try {
    logger.info('Starting cleanup of expired carts');
    
    // Initialize database connection
    logger.info('Initializing database connection');
    await AppDataSource.initialize();
    logger.info('Database connection initialized');
    
    // Get repositories
    const cartRepository = AppDataSource.getRepository(Cart);
    const cartItemRepository = AppDataSource.getRepository(CartItem);
    
    // Create cart service
    const cartService = new CartService(cartRepository, cartItemRepository);
    
    // Clean up expired carts
    logger.info('Cleaning up expired carts');
    await cartService.cleanupExpiredCarts();
    logger.info('Cleanup completed');
    
    // Close database connection
    await AppDataSource.destroy();
    logger.info('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error cleaning up expired carts');
    
    // Try to close database connection if open
    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        logger.info('Database connection closed after error');
      }
    } catch (closeError) {
      logger.error({ error: closeError }, 'Error closing database connection');
    }
    
    process.exit(1);
  }
}

// Run the script
main(); 
import { DataSource } from 'typeorm';
import { config } from './env';
import { User } from '../entities/User';
import { Product } from '../entities/Product';
import { ProductVariant } from '../entities/ProductVariant';
import { Category } from '../entities/Category';
import { Brand } from '../entities/Brand';
import { Tag } from '../entities/Tag';
import { ProductImage } from '../entities/ProductImage';
import { ProductReview } from '../entities/ProductReview';
import { Offer } from '../entities/Offer';
import { Coupon } from '../entities/Coupon';
import { AttributeValue } from '../entities/AttributeValue';
import { ProductBundle } from '../entities/ProductBundle';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Address } from '../entities/Address';
import { LoyaltyProgram } from '../entities/LoyaltyProgram';
import { Notification } from '../entities/Notification';
import { Inventory } from '../entities/Inventory';
import { InventoryMovement } from '../entities/InventoryMovement';
import { Review } from '../entities/Review';
import { ProductRating } from '../entities/ProductRating';
import { ShippingProvider } from '../entities/ShippingProvider';
import { ShippingZone } from '../entities/ShippingZone';
import { ShippingRate } from '../entities/ShippingRate';
import { ShippingMethod } from '../entities/ShippingMethod';
import { Shipment } from '../entities/Shipment';
import { Tracking } from '../entities/Tracking';
import { PaymentGateway } from '../entities/PaymentGateway';
import { PaymentMethod } from '../entities/PaymentMethod';
import { Payment } from '../entities/Payment';
import { Refund } from '../entities/Refund';
import { Company } from '../entities/Company';
import { CompanyProfile } from '../entities/CompanyProfile';
import { CompanyUser } from '../entities/CompanyUser';
import { ContentBlock } from '../entities/ContentBlock';
import { ContentHistory } from '../entities/ContentHistory';
import { ContentRevision } from '../entities/ContentRevision';
import { ContentTranslation } from '../entities/ContentTranslation';
import { Media } from '../entities/Media';
import { Currency } from '../entities/Currency';
import { CustomerGroup } from '../entities/CustomerGroup';
import { PriceList } from '../entities/PriceList';
import { ProductPrice } from '../entities/ProductPrice';
import { Wishlist } from '../entities/Wishlist';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  // Disable synchronize in production - use migrations instead
  synchronize: false, // Always false for production safety
  logging: config.nodeEnv === 'development',
  entities: [
    User,
    Product,
    ProductVariant,
    Category,
    Brand,
    Tag,
    ProductImage,
    ProductReview,
    Offer,
    Coupon,
    AttributeValue,
    ProductBundle,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Address,
    LoyaltyProgram,
    Notification,
    Inventory,
    InventoryMovement,
    Review,
    ProductRating,
    ShippingProvider,
    ShippingZone,
    ShippingRate,
    ShippingMethod,
    Shipment,
    Tracking,
    PaymentGateway,
    PaymentMethod,
    Payment,
    Refund,
    Company,
    CompanyProfile,
    CompanyUser,
    ContentBlock,
    ContentHistory,
    ContentRevision,
    ContentTranslation,
    Media,
    Currency,
    CustomerGroup,
    PriceList,
    ProductPrice,
    Wishlist
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  // Migration configuration
  migrationsRun: false, // Don't run migrations automatically
  migrationsTableName: 'migrations',
});

import { seedAdminUser, seedBasicData, seedSampleAddresses, seedLoyaltyPrograms, seedSampleNotifications, seedSampleInventory, seedSampleReviews, seedSampleShipping, seedSamplePayments, seedSampleCompanies, seedSampleContent, seedSamplePricing, seedSampleWishlist } from '../utils/seed';

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
    
    // Check if we need to run migrations
    const pendingMigrations = await AppDataSource.showMigrations();
    if (pendingMigrations) {
      console.log('⚠️  Pending migrations detected. Please run migrations manually.');
      console.log('   Run: npm run migrate');
    }
    
    // Only seed basic data if we're in development and no migrations are pending
    if (config.nodeEnv === 'development' && !pendingMigrations) {
      console.log('🌱 Seeding basic development data...');
      
      // Seed admin user only
      await seedAdminUser();
      
      console.log('✅ Basic development data seeded successfully');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabase() {
  try {
    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
} 
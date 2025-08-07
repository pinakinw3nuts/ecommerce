import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database';
import { User, UserRole, UserStatus } from '../entities/User';
import { Category } from '../entities/Category';
import { Brand } from '../entities/Brand';
import { Tag } from '../entities/Tag';
import { Product } from '../entities/Product';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { Address, AddressType } from '../entities/Address';
import { LoyaltyProgram } from '../entities/LoyaltyProgram';
import { Notification, NotificationType, NotificationChannel, NotificationStatus } from '../entities/Notification';
import { Inventory } from '../entities/Inventory';
import { InventoryMovement, MovementType } from '../entities/InventoryMovement';
import { Review } from '../entities/Review';
import { ProductRating } from '../entities/ProductRating';
import { ShippingProvider, ProviderType, ProviderStatus } from '../entities/ShippingProvider';
import { ShippingZone, ZoneType } from '../entities/ShippingZone';
import { ShippingMethod, MethodType, MethodStatus } from '../entities/ShippingMethod';
import { ShippingRate, RateType } from '../entities/ShippingRate';
import { PaymentGateway, PaymentGatewayType } from '../entities/PaymentGateway';
import { PaymentMethod, PaymentMethodType, PaymentMethodStatus, PaymentMethodCategory } from '../entities/PaymentMethod';
import { Payment, PaymentStatus, PaymentProvider } from '../entities/Payment';
import { Refund, RefundStatus } from '../entities/Refund';
import { Company } from '../entities/Company';
import { CompanyProfile } from '../entities/CompanyProfile';
import { CompanyUser } from '../entities/CompanyUser';
import { CompanyRole } from '../entities/CompanyRole';
import { ContentBlock, ContentBlockType } from '../entities/ContentBlock';
import { Currency } from '../entities/Currency';
import { CustomerGroup } from '../entities/CustomerGroup';
import { PriceList } from '../entities/PriceList';
import { ProductPrice } from '../entities/ProductPrice';
import { Wishlist } from '../entities/Wishlist';
import { logger } from './logger';

export async function seedAdminUser() {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      logger.info('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = userRepository.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    });

    await userRepository.save(adminUser);
    
    logger.info('Admin user created successfully');
  } catch (error) {
    logger.error('Error seeding admin user:', error);
  }
}

export async function seedBasicData() {
  try {
    // Seed basic categories
    const categoryRepository = AppDataSource.getRepository(Category);
    const basicCategories = [
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies' },
      { name: 'Sports', slug: 'sports', description: 'Sports equipment and accessories' },
      { name: 'Books', slug: 'books', description: 'Books and publications' }
    ];

    for (const categoryData of basicCategories) {
      const existingCategory = await categoryRepository.findOneBy({ slug: categoryData.slug });
      if (!existingCategory) {
        const category = categoryRepository.create(categoryData);
        await categoryRepository.save(category);
        logger.info(`Created basic category: ${categoryData.name}`);
      }
    }

    // Seed basic brands
    const brandRepository = AppDataSource.getRepository(Brand);
    const basicBrands = [
      { name: 'Apple', description: 'Technology company', logoUrl: '/brands/apple.png' },
      { name: 'Nike', description: 'Sports and athletic wear', logoUrl: '/brands/nike.png' },
      { name: 'Samsung', description: 'Electronics manufacturer', logoUrl: '/brands/samsung.png' },
      { name: 'Adidas', description: 'Sports and casual wear', logoUrl: '/brands/adidas.png' },
      { name: 'Sony', description: 'Electronics and entertainment', logoUrl: '/brands/sony.png' }
    ];

    for (const brandData of basicBrands) {
      const existingBrand = await brandRepository.findOneBy({ name: brandData.name });
      if (!existingBrand) {
        const brand = brandRepository.create(brandData);
        await brandRepository.save(brand);
        logger.info(`Created basic brand: ${brandData.name}`);
      }
    }

    // Seed basic tags
    const tagRepository = AppDataSource.getRepository(Tag);
    const basicTags = [
      { name: 'New', slug: 'new' },
      { name: 'Sale', slug: 'sale' },
      { name: 'Featured', slug: 'featured' },
      { name: 'Popular', slug: 'popular' },
      { name: 'Trending', slug: 'trending' }
    ];

    for (const tagData of basicTags) {
      const existingTag = await tagRepository.findOneBy({ slug: tagData.slug });
      if (!existingTag) {
        const tag = tagRepository.create(tagData);
        await tagRepository.save(tag);
        logger.info(`Created basic tag: ${tagData.name}`);
      }
    }

    // Seed sample products
    const productRepository = AppDataSource.getRepository(Product);
    const existingProducts = await productRepository.count();
    
    if (existingProducts === 0) {
      const electronicsCategory = await categoryRepository.findOneBy({ slug: 'electronics' });
      const appleBrand = await brandRepository.findOneBy({ name: 'Apple' });
      const newTag = await tagRepository.findOneBy({ slug: 'new' });
      const featuredTag = await tagRepository.findOneBy({ slug: 'featured' });

      if (electronicsCategory && appleBrand) {
        const sampleProducts = [
          {
            name: 'iPhone 15 Pro',
            slug: 'iphone-15-pro',
            description: 'The latest iPhone with advanced features and premium design.',
            price: 999.99,
            mediaUrl: '/products/iphone-15-pro.jpg',
            isFeatured: true,
            isPublished: true,
            category: electronicsCategory,
            brand: appleBrand,
            tags: [newTag, featuredTag].filter((tag): tag is Tag => tag !== null),
            stockQuantity: 50,
            isInStock: true,
            keywords: ['iphone', 'smartphone', 'apple', 'mobile']
          },
          {
            name: 'MacBook Air M2',
            slug: 'macbook-air-m2',
            description: 'Lightweight laptop with powerful M2 chip for productivity.',
            price: 1199.99,
            mediaUrl: '/products/macbook-air-m2.jpg',
            isFeatured: true,
            isPublished: true,
            category: electronicsCategory,
            brand: appleBrand,
            tags: [featuredTag].filter((tag): tag is Tag => tag !== null),
            stockQuantity: 25,
            isInStock: true,
            keywords: ['macbook', 'laptop', 'apple', 'computer']
          }
        ];

        for (const productData of sampleProducts) {
          const product = productRepository.create(productData);
          await productRepository.save(product);
          logger.info(`Created sample product: ${productData.name}`);
        }
      }
    }

    // Create sample cart for admin user
    await seedSampleCart();

    logger.info('Basic data seeding completed');
  } catch (error) {
    logger.error('Error seeding basic data:', error);
  }
}

export async function seedSampleCart() {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const cartRepository = AppDataSource.getRepository(Cart);
    const cartItemRepository = AppDataSource.getRepository(CartItem);
    const productRepository = AppDataSource.getRepository(Product);

    // Find admin user
    const adminUser = await userRepository.findOne({
      where: { email: 'admin@example.com' }
    });

    if (!adminUser) {
      logger.warn('Admin user not found, skipping cart seeding');
      return;
    }

    // Check if cart already exists
    const existingCart = await cartRepository.findOne({
      where: { userId: adminUser.id, isCheckedOut: false }
    });

    if (existingCart) {
      logger.info('Sample cart already exists for admin user');
      return;
    }

    // Get some products to add to cart
    const products = await productRepository.find({
      relations: ['category', 'brand', 'images'],
      take: 2
    });

    if (products.length === 0) {
      logger.warn('No products found, skipping cart seeding');
      return;
    }

    // Create cart
    const cart = cartRepository.create({
      userId: adminUser.id,
      total: 0,
      itemCount: 0,
      isCheckedOut: false,
      metadata: {
        deviceId: 'seed-device',
        source: 'seed-data'
      }
    });

    const savedCart = await cartRepository.save(cart);
    logger.info(`Created sample cart: ${savedCart.id}`);

    // Add cart items
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const quantity = i + 1; // 1, 2, etc.

      const productSnapshot = {
        name: product.name,
        description: product.description,
        imageUrl: product.images?.[0]?.url || undefined,
        additionalImages: product.images?.slice(1).map(img => img.url) || [],
        sku: undefined,
        brand: product.brand ? {
          id: product.brand.id,
          name: product.brand.name,
          logoUrl: product.brand.logoUrl || undefined,
        } : undefined,
        category: product.category ? {
          id: product.category.id,
          name: product.category.name,
        } : undefined,
        attributes: {},
        dimensions: undefined,
        originalPrice: product.price,
        salePrice: product.salePrice || undefined,
        slug: product.slug,
        metadata: {},
      };

      const cartItem = cartItemRepository.create({
        cartId: savedCart.id,
        productId: product.id,
        variantId: null,
        quantity: quantity,
        price: product.price,
        productSnapshot: productSnapshot
      });

      await cartItemRepository.save(cartItem);
      logger.info(`Added cart item: ${product.name} (quantity: ${quantity})`);
    }

    // Update cart totals
    const cartWithItems = await cartRepository.findOne({
      where: { id: savedCart.id },
      relations: ['items']
    });

    if (cartWithItems) {
      cartWithItems.calculateTotals();
      await cartRepository.save(cartWithItems);
      logger.info(`Updated cart totals: ${cartWithItems.itemCount} items, $${cartWithItems.total}`);
    }

    logger.info('Sample cart seeding completed');
  } catch (error) {
    logger.error('Error seeding sample cart:', error);
  }
}

export async function seedSampleAddresses() {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const addressRepository = AppDataSource.getRepository(Address);

    const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
    if (!adminUser) {
      logger.warn('Admin user not found, skipping address seeding');
      return;
    }

    const existingAddresses = await addressRepository.find({ where: { userId: adminUser.id } });
    if (existingAddresses.length > 0) {
      logger.info('Sample addresses already exist for admin user');
      return;
    }

    // Create sample addresses
    const sampleAddresses = [
      {
        userId: adminUser.id,
        type: AddressType.HOME,
        firstName: 'Admin',
        lastName: 'User',
        street: '123 Main Street',
        apartment: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        country: 'US',
        postalCode: '10001',
        phone: '+1-555-0123',
        instructions: 'Ring doorbell twice',
        isDefault: true,
      },
      {
        userId: adminUser.id,
        type: AddressType.WORK,
        firstName: 'Admin',
        lastName: 'User',
        street: '456 Business Ave',
        city: 'New York',
        state: 'NY',
        country: 'US',
        postalCode: '10002',
        phone: '+1-555-0124',
        isDefault: false,
      }
    ];

    for (const addressData of sampleAddresses) {
      const address = addressRepository.create(addressData);
      await addressRepository.save(address);
      logger.info(`Created sample address: ${addressData.type} for ${adminUser.email}`);
    }

    logger.info('Sample addresses seeding completed');
  } catch (error) {
    logger.error('Error seeding sample addresses:', error);
  }
}

export async function seedLoyaltyPrograms() {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const loyaltyRepository = AppDataSource.getRepository(LoyaltyProgram);

    const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
    if (!adminUser) {
      logger.warn('Admin user not found, skipping loyalty program seeding');
      return;
    }

    const existingLoyalty = await loyaltyRepository.findOne({ where: { userId: adminUser.id } });
    if (existingLoyalty) {
      logger.info('Loyalty program already exists for admin user');
      return;
    }

    // Create loyalty program with some points
    const loyaltyProgram = LoyaltyProgram.create(adminUser.id);
    loyaltyProgram.addPoints(2500); // This will upgrade to SILVER tier
    
    await loyaltyRepository.save(loyaltyProgram);
    logger.info(`Created loyalty program for ${adminUser.email} with ${loyaltyProgram.points} points (${loyaltyProgram.tier} tier)`);

    logger.info('Loyalty program seeding completed');
  } catch (error) {
    logger.error('Error seeding loyalty programs:', error);
  }
}

export async function seedSampleNotifications() {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const notificationRepository = AppDataSource.getRepository(Notification);

    const adminUser = await userRepository.findOne({ where: { email: 'admin@example.com' } });
    if (!adminUser) {
      logger.warn('Admin user not found, skipping notification seeding');
      return;
    }

    const existingNotifications = await notificationRepository.find({ where: { to: adminUser.email } });
    if (existingNotifications.length > 0) {
      logger.info('Sample notifications already exist');
      return;
    }

    // Create sample notifications
    const sampleNotifications = [
      {
        to: adminUser.email,
        type: NotificationType.ORDER_CONFIRMED,
        channel: NotificationChannel.EMAIL,
        priority: 'NORMAL' as any,
        status: NotificationStatus.SENT,
        subject: 'Order Confirmation - #ORD-12345',
        content: 'Thank you for your order. Your order #ORD-12345 has been confirmed and is being processed.',
        htmlContent: '<h1>Order Confirmation</h1><p>Thank you for your order. Your order #ORD-12345 has been confirmed and is being processed.</p>',
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        metadata: {
          userId: adminUser.id,
          orderId: 'ORD-12345',
          source: 'seed',
        },
      },
      {
        to: adminUser.email,
        type: NotificationType.SHIPPING_UPDATE,
        channel: NotificationChannel.EMAIL,
        priority: 'NORMAL' as any,
        status: NotificationStatus.SENT,
        subject: 'Shipping Update - #ORD-12345',
        content: 'Your order #ORD-12345 has been shipped and is on its way to you.',
        htmlContent: '<h1>Shipping Update</h1><p>Your order #ORD-12345 has been shipped and is on its way to you.</p>',
        sentAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        metadata: {
          userId: adminUser.id,
          orderId: 'ORD-12345',
          source: 'seed',
        },
      },
      {
        to: adminUser.email,
        type: NotificationType.PAYMENT_SUCCESSFUL,
        channel: NotificationChannel.EMAIL,
        priority: 'HIGH' as any,
        status: NotificationStatus.SENT,
        subject: 'Payment Successful - #ORD-12345',
        content: 'We have successfully received your payment for order #ORD-12345.',
        htmlContent: '<h1>Payment Successful</h1><p>We have successfully received your payment for order #ORD-12345.</p>',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        metadata: {
          userId: adminUser.id,
          orderId: 'ORD-12345',
          source: 'seed',
        },
      },
      {
        to: adminUser.email,
        type: NotificationType.ABANDONED_CART,
        channel: NotificationChannel.EMAIL,
        priority: 'LOW' as any,
        status: NotificationStatus.QUEUED,
        subject: 'Complete your purchase - items waiting in your cart',
        content: 'We noticed you have items waiting in your cart. Don\'t miss out on these great products!',
        htmlContent: '<h1>Complete Your Purchase</h1><p>We noticed you have items waiting in your cart. Don\'t miss out on these great products!</p>',
        metadata: {
          userId: adminUser.id,
          source: 'seed',
        },
      }
    ];

    for (const notificationData of sampleNotifications) {
      const notification = notificationRepository.create(notificationData);
      await notificationRepository.save(notification);
      logger.info(`Created sample notification: ${notificationData.type} for ${adminUser.email}`);
    }

    logger.info('Sample notifications seeding completed');
  } catch (error) {
    logger.error('Error seeding sample notifications:', error);
  }
}

export async function seedSampleInventory() {
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const inventoryRepository = AppDataSource.getRepository(Inventory);
    const movementRepository = AppDataSource.getRepository(InventoryMovement);

    // Get some products to create inventory for
    const products = await productRepository.find({ take: 3 });
    
    if (products.length === 0) {
      logger.warn('No products found, skipping inventory seeding');
      return;
    }

    const existingInventory = await inventoryRepository.count();
    if (existingInventory > 0) {
      logger.info('Sample inventory already exists');
      return;
    }

    // Create sample inventory items
    const sampleInventory = [
      {
        productId: products[0].id,
        sku: `${products[0].slug.toUpperCase()}-MAIN`,
        stock: 50,
        location: 'Main Warehouse',
        threshold: 10,
        metadata: {
          supplier: 'Main Supplier',
          cost: 25.00,
          source: 'seed',
        },
      },
      {
        productId: products[0].id,
        sku: `${products[0].slug.toUpperCase()}-SECONDARY`,
        stock: 25,
        location: 'Secondary Warehouse',
        threshold: 5,
        metadata: {
          supplier: 'Secondary Supplier',
          cost: 27.50,
          source: 'seed',
        },
      },
      {
        productId: products[1]?.id,
        sku: `${products[1]?.slug.toUpperCase()}-MAIN`,
        stock: 15,
        location: 'Main Warehouse',
        threshold: 8,
        metadata: {
          supplier: 'Main Supplier',
          cost: 15.00,
          source: 'seed',
        },
      },
      {
        productId: products[2]?.id,
        sku: `${products[2]?.slug.toUpperCase()}-MAIN`,
        stock: 5, // Low stock item
        location: 'Main Warehouse',
        threshold: 10,
        metadata: {
          supplier: 'Main Supplier',
          cost: 35.00,
          source: 'seed',
        },
      },
    ];

    for (const inventoryData of sampleInventory) {
      if (!inventoryData.productId) continue;
      
      const inventory = inventoryRepository.create(inventoryData);
      const savedInventory = await inventoryRepository.save(inventory);
      
      // Create initial movement record
      if (savedInventory.stock > 0) {
        const movement = movementRepository.create({
          inventoryId: savedInventory.id,
          type: MovementType.INITIAL,
          quantity: savedInventory.stock,
          previousStock: 0,
          newStock: savedInventory.stock,
          reference: 'Initial stock - seed data',
          metadata: { source: 'seed' },
        });
        await movementRepository.save(movement);
      }
      
      logger.info(`Created sample inventory: ${savedInventory.sku} at ${savedInventory.location}`);
    }

    logger.info('Sample inventory seeding completed');
  } catch (error) {
    logger.error('Error seeding sample inventory:', error);
  }
} 

export async function seedSampleReviews() {
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const userRepository = AppDataSource.getRepository(User);
    const reviewRepository = AppDataSource.getRepository(Review);
    const productRatingRepository = AppDataSource.getRepository(ProductRating);

    // Get some products and users to create reviews for
    const products = await productRepository.find({ take: 3 });
    const users = await userRepository.find({ take: 2 });
    
    if (products.length === 0 || users.length === 0) {
      logger.warn('No products or users found, skipping review seeding');
      return;
    }

    const existingReviews = await reviewRepository.count();
    if (existingReviews > 0) {
      logger.info('Sample reviews already exist');
      return;
    }

    // Create sample reviews
    const sampleReviews = [
      {
        userId: users[0].id,
        productId: products[0].id,
        rating: 5,
        comment: 'Excellent product! Highly recommend.',
        isPublished: true,
        isVerifiedPurchase: true,
        metadata: { source: 'seed' },
      },
      {
        userId: users[0].id,
        productId: products[0].id,
        rating: 4,
        comment: 'Great quality, fast shipping.',
        isPublished: true,
        isVerifiedPurchase: true,
        metadata: { source: 'seed' },
      },
      {
        userId: users[1]?.id,
        productId: products[0].id,
        rating: 3,
        comment: 'Good product but could be better.',
        isPublished: true,
        isVerifiedPurchase: false,
        metadata: { source: 'seed' },
      },
      {
        userId: users[0].id,
        productId: products[1]?.id,
        rating: 5,
        comment: 'Amazing! Exceeded my expectations.',
        isPublished: true,
        isVerifiedPurchase: true,
        metadata: { source: 'seed' },
      },
      {
        userId: users[1]?.id,
        productId: products[1]?.id,
        rating: 4,
        comment: 'Very satisfied with this purchase.',
        isPublished: true,
        isVerifiedPurchase: true,
        metadata: { source: 'seed' },
      },
      {
        userId: users[0].id,
        productId: products[2]?.id,
        rating: 2,
        comment: 'Not what I expected. Disappointed.',
        isPublished: false, // This review needs moderation
        isVerifiedPurchase: true,
        metadata: { source: 'seed' },
      },
    ];

    for (const reviewData of sampleReviews) {
      if (!reviewData.productId || !reviewData.userId) continue;
      
      const review = reviewRepository.create(reviewData);
      const savedReview = await reviewRepository.save(review);
      
      logger.info(`Created sample review: ${savedReview.rating} stars for product ${savedReview.productId}`);
    }

    // Create product ratings for the products
    for (const product of products) {
      const reviews = await reviewRepository.find({
        where: { productId: product.id, isPublished: true }
      });

      if (reviews.length > 0) {
        const ratings = reviews.map(r => r.rating);
        const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        
        // Calculate rating distribution
        const ratingDistribution: { [key: string]: number } = {};
        for (let i = 1; i <= 5; i++) {
          ratingDistribution[i.toString()] = ratings.filter(r => r === i).length;
        }

        const productRating = productRatingRepository.create({
          productId: product.id,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: reviews.length,
          ratingDistribution,
        });

        await productRatingRepository.save(productRating);
        logger.info(`Created product rating for ${product.name}: ${averageRating.toFixed(1)} stars (${reviews.length} reviews)`);
      }
    }

    logger.info('Sample reviews seeding completed');
  } catch (error) {
    logger.error('Error seeding sample reviews:', error);
  }
}

export async function seedSampleShipping() {
  try {
    const providerRepository = AppDataSource.getRepository(ShippingProvider);
    const zoneRepository = AppDataSource.getRepository(ShippingZone);
    const methodRepository = AppDataSource.getRepository(ShippingMethod);
    const rateRepository = AppDataSource.getRepository(ShippingRate);

    // Check if shipping data already exists
    const existingProviders = await providerRepository.count();
    if (existingProviders > 0) {
      logger.info('Sample shipping data already exists');
      return;
    }

    // Create shipping providers
    const providers = [
      {
        name: 'FedEx',
        type: ProviderType.FEDEX,
        description: 'Federal Express shipping services',
        logoUrl: '/shipping/fedex.png',
        website: 'https://www.fedex.com',
        capabilities: {
          domestic: true,
          international: true,
          express: true,
          ground: true,
          tracking: true,
          insurance: true,
          signature: true
        },
        baseRate: 0,
        handlingFee: 2.50,
        priority: 1
      },
      {
        name: 'UPS',
        type: ProviderType.UPS,
        description: 'United Parcel Service shipping services',
        logoUrl: '/shipping/ups.png',
        website: 'https://www.ups.com',
        capabilities: {
          domestic: true,
          international: true,
          express: true,
          ground: true,
          tracking: true,
          insurance: true,
          signature: true
        },
        baseRate: 0,
        handlingFee: 2.00,
        priority: 2
      },
      {
        name: 'USPS',
        type: ProviderType.USPS,
        description: 'United States Postal Service',
        logoUrl: '/shipping/usps.png',
        website: 'https://www.usps.com',
        capabilities: {
          domestic: true,
          international: true,
          express: false,
          ground: true,
          tracking: true,
          insurance: true,
          signature: false
        },
        baseRate: 0,
        handlingFee: 1.50,
        priority: 3
      }
    ];

    const createdProviders: ShippingProvider[] = [];
    for (const providerData of providers) {
      const provider = providerRepository.create(providerData);
      const savedProvider = await providerRepository.save(provider);
      createdProviders.push(savedProvider);
      logger.info(`Created shipping provider: ${savedProvider.name}`);
    }

    // Create shipping zones
    const zones = [
      {
        name: 'Domestic US',
        type: ZoneType.DOMESTIC,
        country: 'US',
        description: 'All US states and territories',
        priority: 1
      },
      {
        name: 'International',
        type: ZoneType.INTERNATIONAL,
        description: 'All international destinations',
        priority: 2
      },
      {
        name: 'Local Pickup',
        type: ZoneType.CUSTOM,
        description: 'Local pickup from store',
        priority: 0
      }
    ];

    const createdZones: ShippingZone[] = [];
    for (const zoneData of zones) {
      const zone = zoneRepository.create(zoneData);
      const savedZone = await zoneRepository.save(zone);
      createdZones.push(savedZone);
      logger.info(`Created shipping zone: ${savedZone.name}`);
    }

    // Create shipping methods for each provider
    const methods = [
      // FedEx methods
      {
        name: 'FedEx Express',
        type: MethodType.EXPRESS,
        providerId: createdProviders[0].id,
        description: 'Fastest delivery option',
        estimatedDays: 1,
        requiresSignature: true,
        requiresInsurance: false,
        isTrackable: true,
        isInternational: true,
        priority: 1
      },
      {
        name: 'FedEx Ground',
        type: MethodType.GROUND,
        providerId: createdProviders[0].id,
        description: 'Standard ground shipping',
        estimatedDays: 3,
        requiresSignature: false,
        requiresInsurance: false,
        isTrackable: true,
        isInternational: false,
        priority: 2
      },
      // UPS methods
      {
        name: 'UPS Next Day Air',
        type: MethodType.NEXT_DAY,
        providerId: createdProviders[1].id,
        description: 'Next business day delivery',
        estimatedDays: 1,
        requiresSignature: true,
        requiresInsurance: false,
        isTrackable: true,
        isInternational: false,
        priority: 1
      },
      {
        name: 'UPS Ground',
        type: MethodType.GROUND,
        providerId: createdProviders[1].id,
        description: 'Standard ground shipping',
        estimatedDays: 5,
        requiresSignature: false,
        requiresInsurance: false,
        isTrackable: true,
        isInternational: false,
        priority: 2
      },
      // USPS methods
      {
        name: 'USPS Priority Mail',
        type: MethodType.STANDARD,
        providerId: createdProviders[2].id,
        description: 'Priority mail service',
        estimatedDays: 3,
        requiresSignature: false,
        requiresInsurance: false,
        isTrackable: true,
        isInternational: false,
        priority: 1
      },
      {
        name: 'USPS First Class',
        type: MethodType.ECONOMY,
        providerId: createdProviders[2].id,
        description: 'Economy shipping option',
        estimatedDays: 7,
        requiresSignature: false,
        requiresInsurance: false,
        isTrackable: true,
        isInternational: false,
        priority: 2
      }
    ];

    const createdMethods: ShippingMethod[] = [];
    for (const methodData of methods) {
      const method = methodRepository.create(methodData);
      const savedMethod = await methodRepository.save(method);
      createdMethods.push(savedMethod);
      logger.info(`Created shipping method: ${savedMethod.name}`);
    }

    // Create shipping rates
    const rates = [
      // FedEx rates
      {
        providerId: createdProviders[0].id,
        zoneId: createdZones[0].id, // Domestic
        methodId: createdMethods[0].id, // FedEx Express
        rateType: RateType.WEIGHT_BASED,
        baseRate: 15.00,
        additionalRate: 2.50,
        handlingFee: 2.50,
        estimatedDays: 1,
        priority: 1
      },
      {
        providerId: createdProviders[0].id,
        zoneId: createdZones[0].id, // Domestic
        methodId: createdMethods[1].id, // FedEx Ground
        rateType: RateType.WEIGHT_BASED,
        baseRate: 8.00,
        additionalRate: 1.50,
        handlingFee: 2.50,
        estimatedDays: 3,
        priority: 2
      },
      // UPS rates
      {
        providerId: createdProviders[1].id,
        zoneId: createdZones[0].id, // Domestic
        methodId: createdMethods[2].id, // UPS Next Day Air
        rateType: RateType.WEIGHT_BASED,
        baseRate: 18.00,
        additionalRate: 3.00,
        handlingFee: 2.00,
        estimatedDays: 1,
        priority: 1
      },
      {
        providerId: createdProviders[1].id,
        zoneId: createdZones[0].id, // Domestic
        methodId: createdMethods[3].id, // UPS Ground
        rateType: RateType.WEIGHT_BASED,
        baseRate: 7.50,
        additionalRate: 1.25,
        handlingFee: 2.00,
        estimatedDays: 5,
        priority: 2
      },
      // USPS rates
      {
        providerId: createdProviders[2].id,
        zoneId: createdZones[0].id, // Domestic
        methodId: createdMethods[4].id, // USPS Priority Mail
        rateType: RateType.WEIGHT_BASED,
        baseRate: 6.50,
        additionalRate: 1.00,
        handlingFee: 1.50,
        estimatedDays: 3,
        priority: 1
      },
      {
        providerId: createdProviders[2].id,
        zoneId: createdZones[0].id, // Domestic
        methodId: createdMethods[5].id, // USPS First Class
        rateType: RateType.WEIGHT_BASED,
        baseRate: 4.00,
        additionalRate: 0.75,
        handlingFee: 1.50,
        estimatedDays: 7,
        priority: 2
      }
    ];

    for (const rateData of rates) {
      const rate = rateRepository.create(rateData);
      await rateRepository.save(rate);
      logger.info(`Created shipping rate for ${rateData.providerId} - ${rateData.methodId}`);
    }

    logger.info('Sample shipping data seeding completed');
  } catch (error) {
    logger.error('Error seeding sample shipping data:', error);
  }
}

export async function seedSamplePayments() {
  try {
    const gatewayRepository = AppDataSource.getRepository(PaymentGateway);
    const paymentMethodRepository = AppDataSource.getRepository(PaymentMethod);
    const paymentRepository = AppDataSource.getRepository(Payment);
    const refundRepository = AppDataSource.getRepository(Refund);
    const userRepository = AppDataSource.getRepository(User);

    // Check if payment data already exists
    const existingGateways = await gatewayRepository.count();
    if (existingGateways > 0) {
      logger.info('Sample payment data already exists');
      return;
    }

    // Get admin user for sample data
    const adminUser = await userRepository.findOneBy({ email: 'admin@example.com' });
    if (!adminUser) {
      logger.warn('Admin user not found, skipping payment seeding');
      return;
    }

    // Create payment gateways
    const gateways = [
      {
        code: 'stripe',
        name: 'Stripe',
        description: 'Online payment processing platform',
        type: PaymentGatewayType.DIRECT,
        enabled: true,
        displayOrder: 1,
        iconUrl: '/payment/stripe.png',
        supportsRefunds: true,
        supportsSubscriptions: true,
        supportsSavedCards: true,
        minAmount: 0.50,
        maxAmount: 999999.99,
        transactionFeePercent: 2.9,
        transactionFeeFixed: 0.30,
        supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        defaultOrderStatus: 'pending',
        apiCredentials: {
          publishableKey: 'pk_test_sample',
          secretKey: 'sk_test_sample'
        },
        settings: {
          webhookEndpoint: '/api/payments/webhooks/stripe',
          captureMethod: 'automatic'
        }
      },
      {
        code: 'paypal',
        name: 'PayPal',
        description: 'Digital payment platform',
        type: PaymentGatewayType.REDIRECT,
        enabled: true,
        displayOrder: 2,
        iconUrl: '/payment/paypal.png',
        redirectUrl: 'https://www.paypal.com/checkout',
        supportsRefunds: true,
        supportsSubscriptions: true,
        supportsSavedCards: false,
        minAmount: 1.00,
        maxAmount: 10000.00,
        transactionFeePercent: 3.5,
        transactionFeeFixed: 0.35,
        supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        defaultOrderStatus: 'pending',
        apiCredentials: {
          clientId: 'client_id_sample',
          clientSecret: 'client_secret_sample'
        },
        settings: {
          webhookEndpoint: '/api/payments/webhooks/paypal',
          environment: 'sandbox'
        }
      },
      {
        code: 'razorpay',
        name: 'Razorpay',
        description: 'Payment gateway for India',
        type: PaymentGatewayType.DIRECT,
        enabled: true,
        displayOrder: 3,
        iconUrl: '/payment/razorpay.png',
        supportsRefunds: true,
        supportsSubscriptions: true,
        supportsSavedCards: true,
        minAmount: 1.00,
        maxAmount: 100000.00,
        transactionFeePercent: 2.0,
        transactionFeeFixed: 0.00,
        supportedCountries: ['IN'],
        supportedCurrencies: ['INR', 'USD'],
        defaultOrderStatus: 'pending',
        apiCredentials: {
          keyId: 'rzp_test_sample',
          keySecret: 'secret_sample'
        },
        settings: {
          webhookEndpoint: '/api/payments/webhooks/razorpay',
          captureMethod: 'automatic'
        }
      }
    ];

    const createdGateways: PaymentGateway[] = [];
    for (const gatewayData of gateways) {
      const gateway = gatewayRepository.create(gatewayData);
      const savedGateway = await gatewayRepository.save(gateway);
      createdGateways.push(savedGateway);
      logger.info(`Created payment gateway: ${savedGateway.name}`);
    }

    // Create sample payment methods for admin user
    const paymentMethods = [
      {
        userId: adminUser.id,
        type: PaymentMethodType.CARD,
        provider: 'stripe',
        providerMethodId: 'pm_card_visa_sample',
        last4: '4242',
        expiryMonth: '12',
        expiryYear: '2025',
        brand: 'visa',
        status: PaymentMethodStatus.ACTIVE,
        category: PaymentMethodCategory.ONLINE,
        isDefault: true,
        supportedCurrencies: ['USD', 'EUR'],
        transactionFeePercent: 2.9,
        transactionFeeFixed: 0.30
      },
      {
        userId: adminUser.id,
        type: PaymentMethodType.CARD,
        provider: 'stripe',
        providerMethodId: 'pm_card_mastercard_sample',
        last4: '5555',
        expiryMonth: '10',
        expiryYear: '2026',
        brand: 'mastercard',
        status: PaymentMethodStatus.ACTIVE,
        category: PaymentMethodCategory.ONLINE,
        isDefault: false,
        supportedCurrencies: ['USD', 'EUR'],
        transactionFeePercent: 2.9,
        transactionFeeFixed: 0.30
      }
    ];

    const createdPaymentMethods: PaymentMethod[] = [];
    for (const methodData of paymentMethods) {
      const paymentMethod = paymentMethodRepository.create(methodData);
      const savedMethod = await paymentMethodRepository.save(paymentMethod);
      createdPaymentMethods.push(savedMethod);
      logger.info(`Created payment method: ${savedMethod.brand} ending in ${savedMethod.last4}`);
    }

    // Create sample payments
    const payments = [
      {
        orderId: 'order_sample_1',
        userId: adminUser.id,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        transactionId: 'txn_sample_1',
        currency: 'USD',
        amount: 99.99,
        providerPaymentId: 'pi_sample_1',
        paymentMethodId: createdPaymentMethods[0].id,
        providerResponse: {
          id: 'pi_sample_1',
          status: 'succeeded',
          amount: 9999,
          currency: 'usd'
        },
        metadata: {
          orderNumber: 'ORD-001',
          customerEmail: adminUser.email
        }
      },
      {
        orderId: 'order_sample_2',
        userId: adminUser.id,
        provider: PaymentProvider.PAYPAL,
        status: PaymentStatus.COMPLETED,
        transactionId: 'txn_sample_2',
        currency: 'USD',
        amount: 149.99,
        providerPaymentId: 'pay_sample_1',
        paymentMethodId: createdPaymentMethods[1].id,
        providerResponse: {
          id: 'pay_sample_1',
          status: 'completed',
          amount: 149.99,
          currency: 'USD'
        },
        metadata: {
          orderNumber: 'ORD-002',
          customerEmail: adminUser.email
        }
      }
    ];

    const createdPayments: Payment[] = [];
    for (const paymentData of payments) {
      const payment = paymentRepository.create(paymentData);
      const savedPayment = await paymentRepository.save(payment);
      createdPayments.push(savedPayment);
      logger.info(`Created payment: ${savedPayment.transactionId} for ${savedPayment.amount} ${savedPayment.currency}`);
    }

    // Create sample refund
    const refunds = [
      {
        paymentId: createdPayments[0].id,
        amount: 25.00,
        reason: 'Customer requested partial refund',
        requestedBy: adminUser.id,
        status: RefundStatus.COMPLETED,
        transactionId: 'ref_sample_1',
        metadata: {
          refundReason: 'Customer dissatisfaction',
          processedBy: adminUser.id
        }
      }
    ];

    for (const refundData of refunds) {
      const refund = refundRepository.create(refundData);
      await refundRepository.save(refund);
      logger.info(`Created refund: ${refund.transactionId} for ${refund.amount}`);
    }

    logger.info('Sample payment data seeding completed');
  } catch (error) {
    logger.error('Error seeding sample payment data:', error);
  }
}

export async function seedSampleCompanies() {
  try {
    const companyRepository = AppDataSource.getRepository(Company);
    const companyProfileRepository = AppDataSource.getRepository(CompanyProfile);
    const companyUserRepository = AppDataSource.getRepository(CompanyUser);
    const userRepository = AppDataSource.getRepository(User);

    // Check if company data already exists
    const existingCompanies = await companyRepository.count();
    if (existingCompanies > 0) {
      logger.info('Sample company data already exists');
      return;
    }

    // Get admin user for sample data
    const adminUser = await userRepository.findOneBy({ email: 'admin@example.com' });
    if (!adminUser) {
      logger.warn('Admin user not found, skipping company seeding');
      return;
    }

    // Create sample companies
    const companies = [
      {
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
      },
      {
        name: 'TechStart Inc',
        gstNumber: 'GST987654321',
        creditLimit: 25000,
        availableCredit: 25000,
        country: 'Canada',
        phoneNumber: '+1-416-555-0123',
        email: 'contact@techstart.ca',
        website: 'https://www.techstart.ca',
        billingAddress: {
          street: '456 Innovation Drive',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M5V 3A8',
          country: 'Canada'
        },
        shippingAddress: {
          street: '456 Innovation Drive',
          city: 'Toronto',
          state: 'ON',
          postalCode: 'M5V 3A8',
          country: 'Canada'
        },
        settings: {
          allowPurchaseOrders: true,
          requirePOApproval: false,
          invoiceTermDays: 15,
          taxExempt: true,
          allowedPaymentMethods: ['credit_card', 'paypal']
        }
      }
    ];

    const createdCompanies: Company[] = [];
    for (const companyData of companies) {
      const company = companyRepository.create(companyData);
      const savedCompany = await companyRepository.save(company);
      createdCompanies.push(savedCompany);
      logger.info(`Created company: ${savedCompany.name}`);
    }

    // Create company profiles
    const profiles = [
      {
        companyId: createdCompanies[0].id,
        businessType: 'Corporation',
        yearEstablished: 1985,
        industry: 'Manufacturing',
        numberOfEmployees: 500,
        description: 'Leading manufacturer of innovative products',
        logoUrl: 'https://example.com/acme-logo.png',
        socialProfiles: {
          linkedin: 'https://linkedin.com/company/acme',
          twitter: 'https://twitter.com/acme'
        },
        taxInformation: {
          taxId: 'TAX123456789',
          vatNumber: 'VAT123456789'
        },
        bankInformation: {
          accountName: 'Acme Corporation',
          accountNumber: '1234567890',
          bankName: 'First National Bank',
          routingNumber: '021000021'
        },
        additionalContacts: [
          {
            name: 'John Smith',
            title: 'Procurement Manager',
            email: 'procurement@acmecorp.com',
            phone: '+1-555-123-4568',
            isPrimary: true
          }
        ],
        documents: [
          {
            name: 'Company Registration',
            type: 'pdf',
            url: 'https://example.com/docs/acme-registration.pdf',
            uploadedAt: new Date()
          }
        ]
      },
      {
        companyId: createdCompanies[1].id,
        businessType: 'Startup',
        yearEstablished: 2020,
        industry: 'Technology',
        numberOfEmployees: 25,
        description: 'Innovative tech startup focused on AI solutions',
        logoUrl: 'https://example.com/techstart-logo.png',
        socialProfiles: {
          linkedin: 'https://linkedin.com/company/techstart',
          twitter: 'https://twitter.com/techstart'
        },
        taxInformation: {
          taxId: 'TAX987654321',
          vatNumber: 'VAT987654321'
        },
        bankInformation: {
          accountName: 'TechStart Inc',
          accountNumber: '0987654321',
          bankName: 'Royal Bank of Canada',
          routingNumber: '003000010'
        },
        additionalContacts: [
          {
            name: 'Sarah Johnson',
            title: 'Operations Director',
            email: 'operations@techstart.ca',
            phone: '+1-416-555-0124',
            isPrimary: true
          }
        ]
      }
    ];

    for (const profileData of profiles) {
      const profile = companyProfileRepository.create(profileData);
      await companyProfileRepository.save(profile);
      logger.info(`Created company profile for: ${profileData.companyId}`);
    }

    // Create company users (assign admin user to both companies)
    const companyUsers = [
      {
        companyId: createdCompanies[0].id,
        userId: adminUser.id,
        role: CompanyRole.OWNER,
        title: 'CEO',
        department: 'Executive',
        permissions: {
          canManageUsers: true,
          canViewReports: true,
          canApproveOrders: true,
          orderApprovalLimit: undefined,
          canManageProducts: true
        },
        isActive: true,
        hasAcceptedInvitation: true
      },
      {
        companyId: createdCompanies[1].id,
        userId: adminUser.id,
        role: CompanyRole.ADMIN,
        title: 'CTO',
        department: 'Technology',
        permissions: {
          canManageUsers: true,
          canViewReports: true,
          canApproveOrders: true,
          orderApprovalLimit: 10000,
          canManageProducts: true
        },
        isActive: true,
        hasAcceptedInvitation: true
      }
    ];

    for (const userData of companyUsers) {
      const companyUser = companyUserRepository.create(userData);
      await companyUserRepository.save(companyUser);
      logger.info(`Created company user: ${userData.role} for company ${userData.companyId}`);
    }

    logger.info('Sample company data seeding completed');
  } catch (error) {
    logger.error('Error seeding sample company data:', error);
  }
}

export async function seedSampleContent() {
  try {
    const contentRepository = AppDataSource.getRepository(ContentBlock);

    // Check if content already exists
    const existingContent = await contentRepository.count();
    if (existingContent > 0) {
      console.log('📝 Sample content already exists, skipping...');
      return;
    }

    console.log('📄 Seeding sample content...');

    // Create sample content blocks
    const contentBlocks = [
      {
        title: 'About Us',
        slug: 'about-us',
        type: ContentBlockType.PAGE,
        content: {
          sections: [
            {
              type: 'hero',
              title: 'Welcome to Our Store',
              subtitle: 'Your trusted partner for quality products',
              image: '/images/about-hero.jpg'
            },
            {
              type: 'text',
              content: 'We are committed to providing the best products and services to our customers. With years of experience in the industry, we understand what our customers need and strive to exceed their expectations.'
            },
            {
              type: 'features',
              items: [
                {
                  title: 'Quality Products',
                  description: 'We source only the highest quality products from trusted manufacturers.',
                  icon: 'star'
                },
                {
                  title: 'Fast Delivery',
                  description: 'Quick and reliable delivery to your doorstep.',
                  icon: 'truck'
                },
                {
                  title: 'Customer Support',
                  description: '24/7 customer support to help you with any questions.',
                  icon: 'support'
                }
              ]
            }
          ]
        },
        isPublished: true,
        metaTitle: 'About Us - Your Trusted Partner',
        metaDescription: 'Learn more about our company, our mission, and our commitment to providing quality products and excellent service.',
        metaKeywords: 'about us, company, mission, quality, service',
        sortOrder: 1,
        locale: 'en'
      },
      {
        title: 'Contact Us',
        slug: 'contact-us',
        type: ContentBlockType.PAGE,
        content: {
          sections: [
            {
              type: 'hero',
              title: 'Get in Touch',
              subtitle: 'We\'d love to hear from you',
              image: '/images/contact-hero.jpg'
            },
            {
              type: 'contact_form',
              fields: [
                { name: 'name', type: 'text', required: true, label: 'Full Name' },
                { name: 'email', type: 'email', required: true, label: 'Email Address' },
                { name: 'phone', type: 'tel', required: false, label: 'Phone Number' },
                { name: 'message', type: 'textarea', required: true, label: 'Message' }
              ]
            },
            {
              type: 'contact_info',
              address: '123 Business Street, City, State 12345',
              phone: '+1 (555) 123-4567',
              email: 'contact@example.com',
              hours: 'Monday - Friday: 9:00 AM - 6:00 PM'
            }
          ]
        },
        isPublished: true,
        metaTitle: 'Contact Us - Get in Touch',
        metaDescription: 'Contact us for any questions, support, or inquiries. We\'re here to help you.',
        metaKeywords: 'contact, support, help, inquiry',
        sortOrder: 2,
        locale: 'en'
      },
      {
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        type: ContentBlockType.PAGE,
        content: {
          sections: [
            {
              type: 'text',
              content: 'This Privacy Policy describes how we collect, use, and protect your personal information when you use our website and services.'
            },
            {
              type: 'text',
              content: 'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.'
            },
            {
              type: 'text',
              content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.'
            }
          ]
        },
        isPublished: true,
        metaTitle: 'Privacy Policy',
        metaDescription: 'Learn about how we collect, use, and protect your personal information.',
        metaKeywords: 'privacy, policy, data protection',
        sortOrder: 3,
        locale: 'en'
      },
      {
        title: 'Terms of Service',
        slug: 'terms-of-service',
        type: ContentBlockType.PAGE,
        content: {
          sections: [
            {
              type: 'text',
              content: 'These Terms of Service govern your use of our website and services. By using our services, you agree to these terms.'
            },
            {
              type: 'text',
              content: 'You may not use our services for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction.'
            },
            {
              type: 'text',
              content: 'We reserve the right to modify these terms at any time. We will notify users of any material changes.'
            }
          ]
        },
        isPublished: true,
        metaTitle: 'Terms of Service',
        metaDescription: 'Read our terms of service to understand the rules and guidelines for using our website and services.',
        metaKeywords: 'terms, service, conditions, rules',
        sortOrder: 4,
        locale: 'en'
      },
      {
        title: 'Homepage Banner',
        slug: 'homepage-banner',
        type: ContentBlockType.BANNER,
        content: {
          title: 'Welcome to Our Store',
          subtitle: 'Discover amazing products at great prices',
          cta_text: 'Shop Now',
          cta_link: '/products',
          background_image: '/images/banner-bg.jpg',
          overlay_color: 'rgba(0,0,0,0.5)'
        },
        isPublished: true,
        sortOrder: 1,
        locale: 'en'
      }
    ];

    await contentRepository.save(contentBlocks);

    console.log('✅ Sample content seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding sample content:', error);
    throw error;
  }
} 

export async function seedSamplePricing() {
  try {
    const currencyRepository = AppDataSource.getRepository(Currency);
    const customerGroupRepository = AppDataSource.getRepository(CustomerGroup);
    const priceListRepository = AppDataSource.getRepository(PriceList);
    const productPriceRepository = AppDataSource.getRepository(ProductPrice);
    const productRepository = AppDataSource.getRepository(Product);

    // Check if pricing data already exists
    const existingCurrencies = await currencyRepository.count();
    if (existingCurrencies > 0) {
      console.log('💰 Sample pricing data already exists, skipping...');
      return;
    }

    console.log('💰 Seeding sample pricing data...');

    // Seed currencies
    const currencies = [
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        exchangeRate: 1,
        isDefault: true,
        isActive: true,
        decimalPlaces: 2,
        format: '{{amount}}',
        rateLastUpdated: new Date()
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        exchangeRate: 0.85,
        isDefault: false,
        isActive: true,
        decimalPlaces: 2,
        format: '{{amount}}',
        rateLastUpdated: new Date()
      },
      {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        exchangeRate: 0.75,
        isDefault: false,
        isActive: true,
        decimalPlaces: 2,
        format: '{{amount}}',
        rateLastUpdated: new Date()
      },
      {
        code: 'JPY',
        name: 'Japanese Yen',
        symbol: '¥',
        exchangeRate: 110.0,
        isDefault: false,
        isActive: true,
        decimalPlaces: 0,
        format: '{{amount}}',
        rateLastUpdated: new Date()
      }
    ];

    await currencyRepository.save(currencies);

    // Seed customer groups
    const customerGroups = [
      {
        name: 'Retail Customers',
        description: 'Regular retail customers',
        active: true,
        priority: 0,
        metadata: {
          discountPercentage: 0,
          specialOffers: false
        }
      },
      {
        name: 'Wholesale Customers',
        description: 'Business customers with wholesale pricing',
        active: true,
        priority: 1,
        metadata: {
          discountPercentage: 15,
          specialOffers: true,
          minimumOrder: 1000
        }
      },
      {
        name: 'VIP Customers',
        description: 'Premium customers with exclusive pricing',
        active: true,
        priority: 2,
        metadata: {
          discountPercentage: 20,
          specialOffers: true,
          exclusiveAccess: true
        }
      }
    ];

    const savedCustomerGroups = await customerGroupRepository.save(customerGroups);

    // Seed price lists
    const priceLists = [
      {
        name: 'Standard Retail',
        description: 'Standard retail pricing for all customers',
        currency: 'USD',
        customerGroupId: undefined, // Available to all customers
        active: true,
        priority: 0,
        startDate: new Date('2024-01-01'),
        endDate: undefined
      },
      {
        name: 'Wholesale Pricing',
        description: 'Wholesale pricing for business customers',
        currency: 'USD',
        customerGroupId: savedCustomerGroups[1].id, // Wholesale customers
        active: true,
        priority: 1,
        startDate: new Date('2024-01-01'),
        endDate: undefined
      },
      {
        name: 'VIP Pricing',
        description: 'Exclusive pricing for VIP customers',
        currency: 'USD',
        customerGroupId: savedCustomerGroups[2].id, // VIP customers
        active: true,
        priority: 2,
        startDate: new Date('2024-01-01'),
        endDate: undefined
      },
      {
        name: 'Euro Pricing',
        description: 'Pricing in Euro currency',
        currency: 'EUR',
        customerGroupId: undefined,
        active: true,
        priority: 0,
        startDate: new Date('2024-01-01'),
        endDate: undefined
      }
    ];

    const savedPriceLists = await priceListRepository.save(priceLists);

    // Get some sample products to create prices for
    const sampleProducts = await productRepository.find({ take: 5 });
    
    if (sampleProducts.length > 0) {
      const productPrices: any[] = [];

      for (const product of sampleProducts) {
        // Standard retail price
        productPrices.push({
          priceListId: savedPriceLists[0].id,
          productId: product.id,
          basePrice: Math.floor(Math.random() * 200) + 50, // $50-$250
          salePrice: undefined,
          active: true
        });

        // Wholesale price (15% discount)
        const wholesalePrice = Math.floor(Math.random() * 200) + 50;
        productPrices.push({
          priceListId: savedPriceLists[1].id,
          productId: product.id,
          basePrice: wholesalePrice,
          salePrice: wholesalePrice * 0.85, // 15% discount
          active: true
        });

        // VIP price (20% discount)
        const vipPrice = Math.floor(Math.random() * 200) + 50;
        productPrices.push({
          priceListId: savedPriceLists[2].id,
          productId: product.id,
          basePrice: vipPrice,
          salePrice: vipPrice * 0.80, // 20% discount
          active: true
        });

        // Euro price (converted from USD)
        const euroPrice = Math.floor(Math.random() * 200) + 50;
        productPrices.push({
          priceListId: savedPriceLists[3].id,
          productId: product.id,
          basePrice: euroPrice * 0.85, // Convert to EUR
          salePrice: undefined,
          active: true
        });
      }

      await productPriceRepository.save(productPrices);
    }

    console.log('✅ Sample pricing data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding sample pricing data:', error);
    throw error;
  }
} 

export async function seedSampleWishlist() {
  try {
    const wishlistRepository = AppDataSource.getRepository(Wishlist);
    const userRepository = AppDataSource.getRepository(User);
    const productRepository = AppDataSource.getRepository(Product);

    const existingWishlist = await wishlistRepository.count();
    if (existingWishlist > 0) {
      console.log('💝 Sample wishlist data already exists, skipping...');
      return;
    }

    console.log('💝 Seeding sample wishlist data...');

    // Get some sample users and products
    const sampleUsers = await userRepository.find({ take: 3 });
    const sampleProducts = await productRepository.find({ take: 10 });

    if (sampleUsers.length === 0 || sampleProducts.length === 0) {
      console.log('⚠️ No users or products found for wishlist seeding');
      return;
    }

    const wishlistItems: any[] = [];

    // Create wishlist items for each user
    for (const user of sampleUsers) {
      // Each user gets 2-4 random products in their wishlist
      const numItems = Math.floor(Math.random() * 3) + 2; // 2-4 items
      const shuffledProducts = [...sampleProducts].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numItems && i < shuffledProducts.length; i++) {
        const product = shuffledProducts[i];
        
        wishlistItems.push({
          userId: user.id,
          productId: product.id,
          variantId: undefined, // No specific variant
          productName: product.name,
          productImage: '/images/placeholder.jpg', // Use placeholder image
          price: Math.floor(Math.random() * 200) + 50, // Random price $50-$250
          metadata: {
            addedFrom: 'sample-seed',
            category: 'Unknown',
            brand: 'Unknown'
          }
        });
      }
    }

    await wishlistRepository.save(wishlistItems);
    console.log('✅ Sample wishlist data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding sample wishlist data:', error);
    throw error;
  }
} 
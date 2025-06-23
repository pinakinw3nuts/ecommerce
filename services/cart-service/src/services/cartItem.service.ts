import { Repository } from 'typeorm';
import { CartItem, ProductSnapshot } from '../entities/CartItem';
import { CartService } from './cart.service';
import { config } from '../config/env';
import { createLogger } from '../utils/logger';
import axios from 'axios';

// Define interface that matches the product service API response
interface ProductData {
  id: string;
  name: string;
  description?: string;
  price: number;
  mediaUrl?: string; // Product service uses mediaUrl instead of imageUrl
  slug?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  salePrice?: number;
  saleEndDate?: string;
  saleStartDate?: string;
  stockQuantity?: number;
  isInStock?: boolean;
  images?: Array<string | { url?: string }>;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    unit?: string;
  };
  attributes?: {
    [key: string]: string | number | boolean;
  };
  category?: {
    id: string;
    name: string;
    description?: string;
  };
  brand?: {
    id: string;
    name: string;
  } | null;
  variants?: Array<{
    id: string;
    name: string;
    sku?: string;
    price: number;
    stock?: number;
    image?: string;
    attributes?: {
      [key: string]: string | number | boolean;
    };
  }>;
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

// Replacing the unused interface with a more comprehensive type
interface CartItemRequest {
  productId: string;
  variantId?: string | undefined;
  quantity: number;
  price?: number;
  productSnapshot?: {
    name: string;
    description?: string;
    imageUrl?: string;
    mediaUrl?: string;
    [key: string]: any;
  };
}

export class CartItemService {
  private readonly logger = createLogger('CartItemService');
  private readonly productServiceUrl = config.productServiceUrl;

  // Known product fallbacks for when the product service is down
  private readonly knownProducts: Record<string, ProductData> = {
    '7688f05e-443b-48aa-8cc6-61d16da21960': {
            id: '7688f05e-443b-48aa-8cc6-61d16da21960',
            name: 'Fog Lamp Cover Compatible With AUDI Q3 2013-2015',
            description: 'Fog Lamp Cover Compatible With AUDI Q3 2013-2015',
            price: 2500,
            variants: [
              {
                id: '3c4571ce-7bbe-4346-b801-5a1d4beaa8e2',
                name: 'Default',
                sku: 'FOGLAMPCOVER-143',
                price: 2500,
                stock: 10
              }
            ]
    }    
};

  constructor(
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly cartService: CartService
  ) {}

  /**
   * Add item to cart with validation
   */
  async addItem(
    cartId: string,
    userId: string | null,
    data: CartItemRequest,
    deviceId?: string | null
  ): Promise<CartItem> {
    try {
      this.logger.info({
        cartId,
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity
      }, 'Adding item to cart');

      // Check if we already have a product snapshot in the request
      if (data.productSnapshot) {
        this.logger.info({
          cartId,
          productId: data.productId,
          hasSnapshot: true
        }, 'Using provided product snapshot');
        
        // Make sure the snapshot has a valid imageUrl - check both fields
        if (!data.productSnapshot.imageUrl && data.productSnapshot.mediaUrl) {
          data.productSnapshot.imageUrl = data.productSnapshot.mediaUrl;
        }
        
        // Add item to cart with userId to ensure it's stored
        const cart = await this.cartService.addItem(cartId, userId, {
          productId: data.productId,
          variantId: data.variantId,
          quantity: data.quantity,
          price: data.price || 0,
          productSnapshot: data.productSnapshot
        }, deviceId);

        // Return the newly added item
        const newItem = cart.items.find(
          item =>
            item.productId === data.productId &&
            (item.variantId === data.variantId || (!item.variantId && !data.variantId))
        );

        if (!newItem) {
          throw new Error('Failed to add item to cart');
        }

        return newItem;
      }

      // Validate the data
      if (!data.productId) {
        throw new Error('Product ID is required');
      }

      if (!data.quantity || data.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      // // Special handling for iPhone 13
      // if (data.productId === '66c70c61-4d97-4355-af5f-24817ea51b59') {
      //   this.logger.info({
      //     cartId,
      //     productId: data.productId,
      //     forcedPrice: 150
      //   }, 'Special handling for iPhone 13 in addItem');
        
      //   // Create product snapshot with fixed price
      //   const productSnapshot: ProductSnapshot = {
      //     name: 'iPhone 13',
      //     description: 'Latest iPhone model with advanced features',
      //     imageUrl: 'https://example.com/iphone13-2.jpg',
      //     metadata: {
      //       addedAt: new Date().toISOString(),
      //       originalPrice: 150,
      //       needsValidation: false,
      //       fallbackMode: false,
      //       productId: data.productId
      //     },
      //   };

      //         // Add item to cart with fixed price and userId to ensure it's stored
      // const cart = await this.cartService.addItem(cartId, userId, {
      //         productId: data.productId,
      //         variantId: data.variantId,
      //     quantity: data.quantity,
      //     price: 150,
      //     productSnapshot,
      //   }, deviceId);

      //   // Return the newly added item
      //   const newItem = cart.items.find(
      //     item =>
      //       item.productId === data.productId &&
      //       (item.variantId === data.variantId || (!item.variantId && !data.variantId))
      //   );

      //   if (!newItem) {
      //     throw new Error('Failed to add item to cart');
      //   }

      //   return newItem;
      // }

      // Fetch product data from product service
      const { productData, fallbackMode } = await this.fetchProductData(data.productId);

      console.log(productData, 'Adding item to cart fetched product data......');

      // Extract product details
      const {
        price,
        variantName,
        productName,
        productDescription,
        productImageUrl,
        additionalImages,
        sku,
        brand,
        category,
        attributes,
        dimensions,
        originalPrice,
        salePrice,
        slug
      } = this.extractProductDetails(productData, data.variantId ?? undefined, fallbackMode);
      
      // Create product snapshot
      const productSnapshot: ProductSnapshot = {
        name: productName,
        description: productDescription,
        imageUrl: productImageUrl,
        additionalImages: additionalImages,
        variantName,
        sku,
        brand: brand,
        category: category,
        attributes: attributes,
        dimensions: dimensions,
        originalPrice: originalPrice,
        salePrice: salePrice,
        slug: slug,
        metadata: {
          addedAt: new Date().toISOString(),
          originalPrice: originalPrice,
          needsValidation: fallbackMode,
          fallbackMode: fallbackMode,
          productId: data.productId
        },
      };

       // Add item to cart with userId to ensure it's stored
      const cart = await this.cartService.addItem(cartId, userId, {
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity,
        price,
        productSnapshot,
      }, deviceId);

      // Return the newly added item
      const newItem = cart.items.find(
        item =>
          item.productId === data.productId &&
          (item.variantId === data.variantId || (!item.variantId && !data.variantId))
      );

      if (!newItem) {
        this.logger.error({
          cartId,
          productId: data.productId,
          variantId: data.variantId,
          itemsCount: cart.items.length
        }, 'Item not found in cart after adding');
        throw new Error('Failed to add item to cart');
      }

      return newItem;
    } catch (error: unknown) {
      this.logger.error(
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          cartId,
          productId: data.productId
        },
        'Failed to add item to cart'
      );
      throw error;
    }
  }

  /**
   * Update item quantity with validation
   */
  async updateQuantity(
    cartId: string,
    itemId: string,
    quantity: number,
    userId: string | null = null
  ): Promise<CartItem | null> {
    try {
      // Validate the quantity
      if (quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }

      // Update the item quantity
      const cart = await this.cartService.updateItemQuantity(
        cartId,
        itemId,
        quantity,
        userId
      );

      // Return the updated item or null if it was removed
      if (quantity === 0) {
        return null;
      }

      const updatedItem = cart.items.find(item => item.id === itemId);
      return updatedItem || null;
    } catch (error) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          cartId,
          itemId,
          quantity
        },
        'Failed to update item quantity'
      );
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(
    cartId: string,
    itemId: string,
    userId: string | null
  ): Promise<void> {
    try {
      await this.cartService.removeItem(cartId, itemId, userId);
    } catch (error) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          cartId,
          itemId
        },
        'Failed to remove item from cart'
      );
      throw error;
    }
  }

  /**
   * Merge cart items from guest cart to user cart
   */
  async mergeCartItems(guestCartId: string, userId: string): Promise<void> {
    try {
      await this.cartService.mergeGuestCart(guestCartId, userId);
    } catch (error) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          guestCartId,
          userId
        },
        'Failed to merge cart items'
      );
      throw error;
    }
  }

  /**
   * Refresh product data for all items in a cart
   */
  async refreshProductData(cartId: string, userId: string | null): Promise<void> {
    try {
      const cart = await this.cartService.getCartById(cartId, userId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      // Skip if cart has no items
      if (!cart.items || cart.items.length === 0) {
        return;
      }

      // Process items in batches to avoid overloading the product service
      const batchSize = 5;
      const itemBatches = this.chunkArray(cart.items, batchSize);
      
      for (const batch of itemBatches) {
        await Promise.all(
          batch.map(async (item) => {
            try {
              // Try to get updated product data
              const { productData, fallbackMode } = await this.fetchProductData(item.productId);
              
              // Skip update if we're in fallback mode and the item already has product data
              if (fallbackMode && item.productSnapshot && item.productSnapshot.name !== 'Unknown Product') {
                return;
              }
              
              // Extract product details
              const {
                price,
                variantName,
                productName,
                productDescription,
                productImageUrl,
                additionalImages,
                sku,
                brand,
                category,
                attributes,
                dimensions,
                originalPrice,
                salePrice,
                slug
              } = this.extractProductDetails(productData, item.variantId ?? undefined, fallbackMode);

              // Update the item with new data
              item.price = price;
              item.productSnapshot = {
                name: productName,
                description: productDescription,
                imageUrl: productImageUrl,
                additionalImages,
                variantName,
                sku,
                brand,
                category,
                attributes,
                dimensions,
                originalPrice,
                salePrice,
                slug,
                metadata: {
                  ...item.productSnapshot?.metadata,
                  updatedAt: new Date().toISOString(),
                  originalPrice: originalPrice
                }
              };
              
              await this.cartItemRepository.save(item);
            } catch (itemError) {
              this.logger.warn(
                { 
                  error: itemError instanceof Error ? itemError.message : 'Unknown error',
                  itemId: item.id,
                  productId: item.productId
                },
                'Failed to refresh product data for item'
              );
              // Continue with other items even if one fails
            }
          })
        );
        
        // Add a small delay between batches to avoid overwhelming the product service
        if (itemBatches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Update cart totals
      cart.calculateTotals();
      
      // Save the updated cart
      const updatedCart = await this.cartService.getCartById(cart.id, userId);
      if (updatedCart) {
        await this.cartItemRepository.manager.save(updatedCart);
      }
    } catch (error) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          cartId
        },
        'Failed to refresh product data'
      );
      throw error;
    }
  }

  /**
   * Fetch product data from product service or fallback
   */
  private async fetchProductData(productId: string): Promise<{ 
    productData: ProductData | null; 
    fallbackMode: boolean;
  }> {
    let productData: ProductData | null = null;
    let fallbackMode = false;
    
    try {
      // Check for known product IDs first
      if (this.knownProducts[productId]) {
        // this.logger.info({
        //   productId,
        //   productName: this.knownProducts[productId].name
        // }, 'Using hardcoded data for known product');
        
        return {
          productData: this.knownProducts[productId],
          fallbackMode: false
        };
      }
      
      // Special handling for iPhone 13 product
      // if (productId === '66c70c61-4d97-4355-af5f-24817ea51b59') {
      //   this.logger.info({
      //     productId,
      //     productName: 'iPhone 13',
      //     price: 150
      //   }, 'Using special handling for iPhone 13');
        
      //   return {
      //     productData: {
      //       id: '66c70c61-4d97-4355-af5f-24817ea51b59',
      //       name: 'iPhone 13',
      //       description: 'Latest iPhone model with advanced features',
      //       price: 150,
      //       mediaUrl: 'https://example.com/iphone13-2.jpg',
      //       variants: []
      //     },
      //     fallbackMode: false
      //   };
      // }
      
      // Fetch from product service
      productData = await this.getProductData(productId);
      
      if (productData) {
        this.logger.info({
          productId,
          productName: productData.name,
          productPrice: productData.price,
          hasVariants: productData.variants && productData.variants.length > 0,
          mediaUrl: productData.mediaUrl || 'missing',
          imageUrl: (productData as any).imageUrl || 'missing',
          hasImages: !!productData.images && productData.images.length > 0
        }, 'Successfully fetched product data from API');
      } else {
        fallbackMode = true;
        this.logger.warn({ productId }, 'Product not found in product service - using fallback mode');
      }
    } catch (productError) {
      fallbackMode = true;
      this.logger.warn({
        productId,
        error: productError instanceof Error ? productError.message : 'Unknown error'
      }, 'Error fetching product data - using fallback mode');
    }
    
    return { productData, fallbackMode };
  }

  /**
   * Extract product details from product data
   */
  private extractProductDetails(
    productData: ProductData | null, 
    variantId: string | undefined,
    fallbackMode: boolean
  ): {
    price: number;
    variantName?: string;
    productName: string;
    productDescription?: string;
    productImageUrl?: string;
    additionalImages?: string[];
    sku?: string;
    brand?: {
      id?: string;
      name?: string;
      logoUrl?: string;
    };
    category?: {
      id?: string;
      name?: string;
    };
    attributes?: {
      [key: string]: string | number | boolean;
    };
    dimensions?: {
      width?: number;
      height?: number;
      depth?: number;
      weight?: number;
      unit?: string;
    };
    originalPrice?: number;
    salePrice?: number;
    slug?: string;
  } {
    // Default values
    let price = 0;
    let variantName: string | undefined = undefined;
    let productName = 'Unknown Product';
    let productDescription: string | undefined = undefined;
    let productImageUrl: string | undefined = undefined;
    let additionalImages: string[] | undefined = undefined;
    let sku: string | undefined = undefined;
    let brand: { id?: string; name?: string; logoUrl?: string; } | undefined = undefined;
    let category: { id?: string; name?: string; } | undefined = undefined;
    let attributes: { [key: string]: string | number | boolean; } | undefined = undefined;
    let dimensions: { width?: number; height?: number; depth?: number; weight?: number; unit?: string; } | undefined = undefined;
    let originalPrice: number | undefined = undefined;
    let salePrice: number | undefined = undefined;
    let slug: string | undefined = undefined;

    // Extract data based on product and variant
    if (productData) {
      // Base product data
      productName = productData.name;
      productDescription = productData.description;
      
      // Check for both mediaUrl and imageUrl for backward compatibility
      productImageUrl = productData.mediaUrl || (productData as any).imageUrl;
      
      price = productData.price;
      originalPrice = productData.price;
      salePrice = productData.salePrice;
      slug = productData.slug;
      
      // Extract brand data if available
      if (productData.brand) {
        brand = {
          id: productData.brand.id,
          name: productData.brand.name
        };
      }
      
      // Extract category data if available
      if (productData.category) {
        category = {
          id: productData.category.id,
          name: productData.category.name
        };
      }
      
      // Extract additional images if available
      if (productData.images && Array.isArray(productData.images)) {
        additionalImages = productData.images.map(img => {
          if (typeof img === 'string') {
            return img;
          } else if (img && typeof img === 'object' && 'url' in img) {
            return img.url || '';
          }
          return '';
        }).filter(url => url !== '');
      }
      
      // Extract product dimensions if available
      if (productData.dimensions) {
        dimensions = { ...productData.dimensions };
      }
      
      // Extract product attributes if available
      if (productData.attributes) {
        attributes = { ...productData.attributes };
      }

      // If variant ID is provided, look for the specific variant
      if (variantId && productData.variants && Array.isArray(productData.variants)) {
        const variant = productData.variants.find(v => v.id === variantId);
        if (variant) {
          variantName = variant.name;
          price = variant.price || price;
          sku = variant.sku;
          
          // If variant has its own image, use that instead
          if (variant.image) {
            productImageUrl = variant.image;
          }
          
          // If variant has specific attributes
          if (variant.attributes) {
            attributes = { ...(attributes || {}), ...variant.attributes };
          }
        }
      }

      // Fallback to product SKU if no variant SKU
      if (!sku && 'sku' in productData) {
        sku = (productData as any).sku;
      }
    } else if (fallbackMode) {
      // In fallback mode, we provide generic placeholders
      this.logger.warn({ 
        variantId 
      }, 'Using fallback mode for product details');
      
      productName = `Product (Fallback)`;
      if (variantId) {
        variantName = `Variant (Fallback)`;
      }
      
      // Set a default fallback image if needed
      productImageUrl = 'https://via.placeholder.com/300?text=Product+Image+Not+Available';
    }

    // Return extracted details
    return {
      price,
      variantName,
      productName,
      productDescription,
      productImageUrl,
      additionalImages,
      sku,
      brand,
      category,
      attributes,
      dimensions,
      originalPrice,
      salePrice,
      slug
    };
  }

  /**
   * Get product data from the product service
   */
  private async getProductData(productId: string): Promise<ProductData | null> {
    if (!this.productServiceUrl) {
      this.logger.warn('Product service URL not configured');
      return null;
    }
    
    this.logger.info({
      productId,
      productServiceUrl: this.productServiceUrl
    }, 'Fetching product data from service');
    
    try {
      const url = `${this.productServiceUrl}/api/v1/products/${productId}`;
      const response = await axios.get(url, { 
        timeout: 5000, // Longer timeout to allow for slower connections
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
      });
      
      if (response.status === 200 && response.data) {
        this.logger.info({
          productId,
          productName: response.data.name,
          productPrice: response.data.price,
          hasVariants: response.data.variants && response.data.variants.length > 0,
          mediaUrl: response.data.mediaUrl || 'missing',
          imageUrl: (response.data as any).imageUrl || 'missing',
          hasImages: !!response.data.images && response.data.images.length > 0
        }, 'Successfully fetched product data from API');
      
        
      return response.data;
      }
      
      this.logger.warn({ 
        productId, 
        status: response.status
      }, 'Product service returned non-200 status');
        return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
          this.logger.error({ 
            productId,
            errorCode: error.code,
            error: error.message,
            productServiceUrl: this.productServiceUrl
          }, 'Error fetching product data from service');
        } else {
          this.logger.error({ 
            productId,
            status: error.response?.status,
            error: error.message
          }, 'Error fetching product data from service');
        }
      } else {
        this.logger.error({ 
          productId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'Unexpected error fetching product data');
      }
      // Return null instead of throwing the error
      return null;
    }
  }

  /**
   * Helper to split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
} 
import { FastifyRequest, FastifyReply } from 'fastify';
import { forwardRequest, ServiceRequest } from '../utils/httpClient';
import { handleServiceError } from '../utils/errorHandler';
import { httpLogger as logger } from '../utils/logger';
import { config } from '../config/env';

// Interface for service configuration
export interface ServiceConfig {
  name: string;
  url: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Helper function to get service URL based on environment
function getServiceUrl(containerUrl: string, localPort: number): string {
  // Use 127.0.0.1 in development mode for local testing (explicitly IPv4)
  if (config.server.nodeEnv === 'development') {
    return `http://127.0.0.1:${localPort}`;
  }
  return containerUrl;
}

// Map of service routes to their configurations
const serviceRoutes: Record<string, ServiceConfig> = {
  '/api/auth': {
    name: 'auth-service',
    url: getServiceUrl(config.services.auth, 3001),
    timeout: 5000,
  },
  '/api/users': {
    name: 'user-service',
    url: getServiceUrl(config.services.user, 3002),
    timeout: 5000,
  },
  '/api/products': {
    name: 'product-service',
    url: getServiceUrl(config.services.product, 3003),
    timeout: 10000, // Longer timeout for product catalog
  },
  '/api/categories': {
    name: 'product-service',
    url: getServiceUrl(config.services.product, 3003),
    timeout: 10000, // Categories are handled by product service
  },
  '/api/brands': {
    name: 'product-service',
    url: getServiceUrl(config.services.product, 3003),
    timeout: 10000, // Brands are handled by product service
  },
  '/api/cart': {
    name: 'cart-service',
    url: getServiceUrl(config.services.cart, 3004),
    timeout: 5000,
  },
  '/api/checkout': {
    name: 'checkout-service',
    url: getServiceUrl(config.services.checkout, 3005),
    timeout: 15000, // Longer timeout for checkout process
  },
  '/api/orders': {
    name: 'order-service',
    url: getServiceUrl(config.services.order, 3006),
    timeout: 10000,
  },
  '/api/payments': {
    name: 'payment-service',
    url: getServiceUrl(config.services.payment, 3007),
    timeout: 15000, // Longer timeout for payment processing
  },
  '/api/shipping': {
    name: 'shipping-service',
    url: getServiceUrl(config.services.shipping, 3008),
    timeout: 8000,
  },
  '/api/inventory': {
    name: 'inventory-service',
    url: getServiceUrl(config.services.inventory, 3009),
    timeout: 5000,
  },
  '/api/company': {
    name: 'company-service',
    url: getServiceUrl(config.services.company, 3010),
    timeout: 5000,
  },
  '/api/pricing': {
    name: 'pricing-service',
    url: getServiceUrl(config.services.pricing, 3011),
    timeout: 5000,
  },
  '/api/admin': {
    name: 'admin-service',
    url: getServiceUrl(config.services.admin, 3012),
    timeout: 10000,
  },
};

/**
 * Find the appropriate service configuration for a given path
 */
function findServiceConfig(path: string): ServiceConfig | undefined {
  // Special case for user profile endpoint
  if (path.match(/^\/api\/v\d+\/me(\?|$)/) || path === '/api/me') {
    logger.info({
      msg: 'Routing user profile endpoint to user service',
      path,
      serviceName: 'user-service',
      serviceUrl: serviceRoutes['/api/users']?.url ?? 'undefined'
    });
    return serviceRoutes['/api/users'];
  }

  // Special case for categories - route to product service
  if (path.match(/^\/api\/v\d+\/categories(\?|$)/) || path.match(/^\/api\/categories(\?|$)/)) {
    logger.info({
      msg: 'Routing categories endpoint to product service',
      path,
      serviceName: 'product-service',
      serviceUrl: serviceRoutes['/api/products']?.url ?? 'undefined'
    });
    return serviceRoutes['/api/products'];
  }

  // Special case for admin/categories - route to product service
  if (path.match(/^\/api\/v\d+\/admin\/categories(\?|$)/) || path.match(/^\/api\/admin\/categories(\?|$)/)) {
    logger.info({
      msg: 'Routing admin/categories endpoint to product service',
      path,
      serviceName: 'product-service',
      serviceUrl: serviceRoutes['/api/products']?.url ?? 'undefined'
    });
    return serviceRoutes['/api/products'];
  }

  // Special case for brands - route to product service
  if (path.match(/^\/api\/v\d+\/brands(\?|$)/) || path.match(/^\/api\/brands(\?|$)/)) {
    logger.info({
      msg: 'Routing brands endpoint to product service',
      path,
      serviceName: 'product-service',
      serviceUrl: serviceRoutes['/api/products']?.url ?? 'undefined'
    });
    return serviceRoutes['/api/products'];
  }

  // Special case for admin/brands - route to product service
  if (path.match(/^\/api\/v\d+\/admin\/brands(\?|$)/) || path.match(/^\/api\/admin\/brands(\?|$)/)) {
    logger.info({
      msg: 'Routing admin/brands endpoint to product service',
      path,
      serviceName: 'product-service',
      serviceUrl: serviceRoutes['/api/products']?.url ?? 'undefined',
      matchedPattern: path.match(/^\/api\/v\d+\/admin\/brands(\?|$)/) ? 'versioned' : 'non-versioned'
    });
    return serviceRoutes['/api/products'];
  }

  // Special case for coupons - route to product service
  if (path.match(/^\/api\/v\d+\/coupons(\/.*)?(\?|$)/) || path.match(/^\/api\/coupons(\/.*)?(\?|$)/)) {
    logger.info({
      msg: 'Routing coupons endpoint to product service',
      path,
      serviceName: 'product-service',
      serviceUrl: serviceRoutes['/api/products']?.url ?? 'undefined'
    });
    return serviceRoutes['/api/products'];
  }

  // Special case for admin/coupons - route to product service
  if (path.match(/^\/api\/v\d+\/admin\/coupons(\/.*)?(\?|$)/) || path.match(/^\/api\/admin\/coupons(\/.*)?(\?|$)/)) {
    logger.info({
      msg: 'Routing admin/coupons endpoint to product service',
      path,
      serviceName: 'product-service',
      serviceUrl: serviceRoutes['/api/products']?.url ?? 'undefined',
      matchedPattern: path.match(/^\/api\/v\d+\/admin\/coupons(\/.*)?(\?|$)/) ? 'versioned' : 'non-versioned'
    });
    return serviceRoutes['/api/products'];
  }

  // Special case for tags - route to product service
  if (path.match(/^\/api\/v\d+\/tags(\/.*)?(\?|$)/) || path.match(/^\/api\/tags(\/.*)?(\?|$)/)) {
    logger.info({
      msg: 'Routing tags endpoint to product service',
      path,
      serviceName: 'product-service',
      serviceUrl: serviceRoutes['/api/products']?.url ?? 'undefined'
    });
    return serviceRoutes['/api/products'];
  }

  // Special case for admin/tags - route to product service
  if (path.match(/^\/api\/v\d+\/admin\/tags(\/.*)?(\?|$)/) || path.match(/^\/api\/admin\/tags(\/.*)?(\?|$)/)) {
    logger.info({
      msg: 'Routing admin/tags endpoint to product service',
      path,
      serviceName: 'product-service',
      serviceUrl: serviceRoutes['/api/products']?.url ?? 'undefined',
      matchedPattern: path.match(/^\/api\/v\d+\/admin\/tags(\/.*)?(\?|$)/) ? 'versioned' : 'non-versioned'
    });
    return serviceRoutes['/api/products'];
  }

  // Special case for the exact path pattern we're having trouble with
  if (path.startsWith('/api/v1/users?page=')) {
    logger.info({
      msg: 'Special case: Exact match for /api/v1/users?page=',
      path,
      serviceName: 'user-service',
      serviceUrl: serviceRoutes['/api/users']?.url ?? 'undefined'
    });
    return serviceRoutes['/api/users'];
  }
  
  // Direct check for versioned users path - highest priority
  if (path.match(/^\/api\/v\d+\/users(\?|$)/)) {
    logger.info({
      msg: 'Directly matched versioned users path',
      path,
      serviceName: 'user-service',
      serviceUrl: serviceRoutes['/api/users']?.url ?? 'undefined'
    });
    return serviceRoutes['/api/users'];
  }

  // Add detailed debug for user route detection
  if (path.includes('/users')) {
    const userServiceConfig = serviceRoutes['/api/users'];
    logger.info({
      msg: 'Trying to match user path',
      path,
      userServiceName: userServiceConfig?.name ?? 'undefined',
      userServiceUrl: userServiceConfig?.url ?? 'undefined',
      matchesVersioned: !!path.match(/^\/api\/v\d+\/users/),
    });
  }

  // Handle versioned paths (e.g., /api/v1/admin/products)
  const versionedMatch = path.match(/^\/api\/v\d+\/([^\/]+)/);
  if (versionedMatch) {
    const serviceName = versionedMatch[1];
    
    // Special case: if path contains admin/products or admin/categories, route to product service
    if (serviceName === 'admin' && (path.includes('/products') || path.includes('/categories') || path.includes('/brands'))) {
      logger.info({
        msg: 'Routing admin path to product service',
        path,
        serviceName: 'product-service'
      });
      return serviceRoutes['/api/products'];
    }
    
    // Special case: if path is for users, route to user service
    if (serviceName === 'users') {
      const userService = serviceRoutes['/api/users'];
      logger.info({
        msg: 'Routing versioned users path to user service',
        path,
        serviceName: 'user-service',
        serviceUrl: userService?.url ?? 'undefined'
      });
      return userService;
    }
    
    const serviceRoute = `/api/${serviceName}`;
    const serviceConfig = serviceRoutes[serviceRoute];
    logger.info({
      msg: 'Generic service route matching',
      path,
      serviceRoute,
      serviceExists: !!serviceConfig,
      serviceName: serviceConfig?.name ?? 'undefined'
    });
    
    return serviceConfig;
  }
  
  // Handle standard paths (e.g., /api/admin/products)
  // Special case: if path contains admin/products or admin/categories, route to product service
  if (path.match(/^\/api\/admin\/(products|categories)/)) {
    logger.info({
      msg: 'Routing admin/products or admin/categories path to product service',
      path,
      serviceName: 'product-service'
    });
    return serviceRoutes['/api/products'];
  }
  
  // For standard non-versioned user routes
  if (path.match(/^\/api\/users/)) {
    const userService = serviceRoutes['/api/users'];
    logger.info({
      msg: 'Routing standard users path to user service',
      path,
      serviceName: 'user-service',
      serviceUrl: userService?.url ?? 'undefined'
    });
    return userService;
  }
  
  const route = Object.keys(serviceRoutes).find(route => path.startsWith(route));
  if (route) {
    const serviceConfig = serviceRoutes[route];
    logger.info({
      msg: 'Found matching route',
      path,
      route,
      serviceName: serviceConfig?.name ?? 'undefined'
    });
  }
  
  return route ? serviceRoutes[route] : undefined;
}

/**
 * Extract the target path from the original request
 */
function getTargetPath(originalPath: string, serviceRoute: string): string {
  // Special case for user profile endpoint
  if (originalPath.match(/^\/api\/v\d+\/me(\?|$)/) || originalPath === '/api/me') {
    logger.info({
      msg: 'Preserving original path for user profile endpoint',
      originalPath,
      preservedPath: originalPath,
    });
    
    // Keep the exact original path for the user profile endpoint
    return originalPath;
  }
  
  // Special case for categories endpoint
  if (originalPath.match(/^\/api\/v\d+\/categories(\?|$)/)) {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Extract version
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    
    const preservedPath = `/api/v${version}/categories${queryString}`;
    
    logger.info({
      msg: 'Preserving categories path for product service',
      originalPath,
      preservedPath,
      routeType: 'categories-versioned'
    });
    
    return preservedPath;
  }
  
  // Special case for category by ID endpoint
  const categoryIdMatch = originalPath.match(/^\/api\/v(\d+)\/categories\/([^\/\?]+)/);
  if (categoryIdMatch) {
    const version = categoryIdMatch[1];
    const categoryId = categoryIdMatch[2];
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    const preservedPath = `/api/v${version}/categories/${categoryId}${queryString}`;
    
    logger.info({
      msg: 'Preserving category by ID path for product service',
      originalPath,
      preservedPath,
      categoryId,
      routeType: 'category-by-id'
    });
    
    return preservedPath;
  }
  
  // Special case for product attributes endpoint
  const attributesMatch = originalPath.match(/^\/api\/v(\d+)\/products\/attributes(\/.*)?/);
  if (attributesMatch) {
    const version = attributesMatch[1];
    const subPath = attributesMatch[2] || '';
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    const preservedPath = `/api/v${version}/products/attributes${subPath}${queryString}`;
    
    logger.info({
      msg: 'Preserving product attributes path for product service',
      originalPath,
      preservedPath,
      routeType: 'product-attributes'
    });
    
    return preservedPath;
  }
  
  // Special case for brands endpoint
  const brandsMatch = originalPath.match(/^\/api\/v(\d+)\/brands(\/.*)?/);
  if (brandsMatch) {
    const version = brandsMatch[1];
    const subPath = brandsMatch[2] || '';
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    const preservedPath = `/api/v${version}/brands${subPath}${queryString}`;
    
    logger.info({
      msg: 'Preserving brands path for product service',
      originalPath,
      preservedPath,
      routeType: 'brands'
    });
    
    return preservedPath;
  }
  
  // Special case for tags endpoint
  const tagsMatch = originalPath.match(/^\/api\/v(\d+)\/tags(\/.*)?/);
  if (tagsMatch) {
    const version = tagsMatch[1];
    const subPath = tagsMatch[2] || '';
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    const preservedPath = `/api/v${version}/tags${subPath}${queryString}`;
    
    logger.info({
      msg: 'Preserving tags path for product service',
      originalPath,
      preservedPath,
      routeType: 'tags'
    });
    
    return preservedPath;
  }
  
  // Special case for non-versioned tags endpoint
  const nonVersionedTagsMatch = originalPath.match(/^\/api\/tags(\/.*)?/);
  if (nonVersionedTagsMatch) {
    const subPath = nonVersionedTagsMatch[1] || '';
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    const preservedPath = `/api/tags${subPath}${queryString}`;
    
    logger.info({
      msg: 'Preserving non-versioned tags path for product service',
      originalPath,
      preservedPath,
      routeType: 'tags-standard'
    });
    
    return preservedPath;
  }
  
  // Special case for coupons endpoint
  const couponsMatch = originalPath.match(/^\/api\/v(\d+)\/coupons(\/.*)?/);
  if (couponsMatch) {
    const version = couponsMatch[1];
    const subPath = couponsMatch[2] || '';
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    const preservedPath = `/api/v${version}/coupons${subPath}${queryString}`;
    
    logger.info({
      msg: 'Preserving coupons path for product service',
      originalPath,
      preservedPath,
      routeType: 'coupons'
    });
    
    return preservedPath;
  }
  
  // Special case for non-versioned coupons endpoint
  const nonVersionedCouponsMatch = originalPath.match(/^\/api\/coupons(\/.*)?/);
  if (nonVersionedCouponsMatch) {
    const subPath = nonVersionedCouponsMatch[1] || '';
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    const preservedPath = `/api/coupons${subPath}${queryString}`;
    
    logger.info({
      msg: 'Preserving non-versioned coupons path for product service',
      originalPath,
      preservedPath,
      routeType: 'coupons-standard'
    });
    
    return preservedPath;
  }
  
  // Special case for admin/coupons routes with ID to product service
  const adminCouponWithIdMatch = originalPath.match(/^\/api\/v\d+\/admin\/coupons\/([a-zA-Z0-9-]+)/);
  if (adminCouponWithIdMatch && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    const couponId = adminCouponWithIdMatch[1];
    
    const preservedPath = `/api/v${version}/admin/coupons/${couponId}${queryString}`;
    
    logger.info({
      msg: 'Preserving admin/coupons path with ID for product service',
      originalPath,
      preservedPath,
      couponId,
      method: 'ANY'
    });
    
    return preservedPath;
  }
  
  // For non-versioned admin/coupons routes with ID to product service
  const nonVersionedAdminCouponWithIdMatch = originalPath.match(/^\/api\/admin\/coupons\/([a-zA-Z0-9-]+)/);
  if (nonVersionedAdminCouponWithIdMatch && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    const couponId = nonVersionedAdminCouponWithIdMatch[1];
    
    const preservedPath = `/api/admin/coupons/${couponId}${queryString}`;
    
    logger.info({
      msg: 'Preserving non-versioned admin/coupons path with ID for product service',
      originalPath,
      preservedPath,
      couponId,
      method: 'ANY'
    });
    
    return preservedPath;
  }
  
  // For admin/coupons routes to product service, don't modify the path
  if (originalPath.match(/^\/api\/v\d+\/admin\/coupons/) && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    
    logger.info({
      msg: 'Preserving admin/coupons path structure for product service',
      originalPath,
      preservedPath: `/api/v${version}/admin/coupons${queryString}`,
      method: 'ANY'
    });
    
    return `/api/v${version}/admin/coupons${queryString}`;
  }
  
  // Handle non-versioned admin/coupons routes
  if (originalPath.match(/^\/api\/admin\/coupons/) && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    
    logger.info({
      msg: 'Preserving admin/coupons path structure for product service (non-versioned)',
      originalPath,
      preservedPath: `/api/admin/coupons${queryString}`,
      method: 'ANY'
    });
    
    return `/api/admin/coupons${queryString}`;
  }

  // Special case for non-versioned brands endpoint
  const nonVersionedBrandsMatch = originalPath.match(/^\/api\/brands(\/.*)?/);
  if (nonVersionedBrandsMatch) {
    const subPath = nonVersionedBrandsMatch[1] || '';
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    const preservedPath = `/api/brands${subPath}${queryString}`;
    
    logger.info({
      msg: 'Preserving non-versioned brands path for product service',
      originalPath,
      preservedPath,
      routeType: 'brands-standard'
    });
    
    return preservedPath;
  }
  
  // Special case for non-versioned product attributes endpoint
  const nonVersionedAttributesMatch = originalPath.match(/^\/api\/products\/attributes(\/.*)?/);
  if (nonVersionedAttributesMatch) {
    const subPath = nonVersionedAttributesMatch[1] || '';
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    const preservedPath = `/api/products/attributes${subPath}${queryString}`;
    
    logger.info({
      msg: 'Preserving non-versioned product attributes path for product service',
      originalPath,
      preservedPath,
      routeType: 'product-attributes-standard'
    });
    
    return preservedPath;
  }
  
  // Special case for non-versioned category by ID endpoint
  const nonVersionedCategoryIdMatch = originalPath.match(/^\/api\/categories\/([^\/\?]+)/);
  if (nonVersionedCategoryIdMatch) {
    const categoryId = nonVersionedCategoryIdMatch[1];
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    const preservedPath = `/api/categories/${categoryId}${queryString}`;
    
    logger.info({
      msg: 'Preserving non-versioned category by ID path for product service',
      originalPath,
      preservedPath,
      categoryId,
      routeType: 'category-by-id-standard'
    });
    
    return preservedPath;
  }
  
  // Special case for non-versioned categories endpoint
  if (originalPath.match(/^\/api\/categories(\?|$)/)) {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    const preservedPath = `/api/categories${queryString}`;
    
    logger.info({
      msg: 'Preserving non-versioned categories path for product service',
      originalPath,
      preservedPath,
      routeType: 'categories-standard'
    });
    
    return preservedPath;
  }
  
  // Special case for /api/v1/users with query parameters
  if (originalPath.startsWith('/api/v1/users?')) {
    logger.info({
      msg: 'Special case: /api/v1/users with query parameters',
      originalPath,
      preservedPath: originalPath,
    });
    
    // Keep the exact original path as the user service is expecting /api/v1/users format
    return originalPath;
  }
  
  // Special debugging for all user service paths
  if (originalPath.includes('/users')) {
    logger.info({
      msg: 'Processing path for user service',
      originalPath,
      serviceRoute,
      matchesVersioned: !!originalPath.match(/^\/api\/v\d+\/users/),
      matchesNonVersioned: !!originalPath.match(/^\/api\/users/),
    });
  }
  
  // For user routes with versioning, keep exact original path
  if (originalPath.match(/^\/api\/v\d+\/users/) && serviceRoute === '/api/users') {
    logger.info({
      msg: 'Preserving original path for versioned user route',
      originalPath,
      serviceRoute,
      preservedPath: originalPath,
    });
    
    // Keep the exact original path as the user service is expecting /api/v1/users format
    return originalPath;
  }
  
  // For non-versioned user routes, also preserve original path
  if (originalPath.match(/^\/api\/users/) && serviceRoute === '/api/users') {
    logger.info({
      msg: 'Preserving original path for non-versioned user route',
      originalPath,
      serviceRoute,
      preservedPath: originalPath,
    });
    
    // Keep the exact original path for non-versioned user routes
    return originalPath;
  }

  // For admin/products routes with ID to product service, add special handling
  const adminProductWithIdMatch = originalPath.match(/^\/api\/v\d+\/admin\/products\/([a-zA-Z0-9-]+)/);
  if (adminProductWithIdMatch && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    const productId = adminProductWithIdMatch[1];
    
    const preservedPath = `/api/v${version}/admin/products/${productId}${queryString}`;
    
    logger.info({
      msg: 'Preserving admin/products path with ID for product service',
      originalPath,
      preservedPath,
      productId,
      method: 'ANY'
    });
    
    return preservedPath;
  }
  
  // For non-versioned admin/products routes with ID to product service
  const nonVersionedAdminProductWithIdMatch = originalPath.match(/^\/api\/admin\/products\/([a-zA-Z0-9-]+)/);
  if (nonVersionedAdminProductWithIdMatch && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    const productId = nonVersionedAdminProductWithIdMatch[1];
    
    const preservedPath = `/api/admin/products/${productId}${queryString}`;
    
    logger.info({
      msg: 'Preserving non-versioned admin/products path with ID for product service',
      originalPath,
      preservedPath,
      productId,
      method: 'ANY'
    });
    
    return preservedPath;
  }
  
  // For admin/categories routes with ID to product service, add special handling
  const adminCategoryWithIdMatch = originalPath.match(/^\/api\/v\d+\/admin\/categories\/([a-zA-Z0-9-]+)/);
  if (adminCategoryWithIdMatch && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    const categoryId = adminCategoryWithIdMatch[1];
    
    const preservedPath = `/api/v${version}/admin/categories/${categoryId}${queryString}`;
    
    logger.info({
      msg: 'Preserving admin/categories path with ID for product service',
      originalPath,
      preservedPath,
      categoryId,
      method: 'ANY'
    });
    
    return preservedPath;
  }
  
  // For non-versioned admin/categories routes with ID to product service
  const nonVersionedAdminCategoryWithIdMatch = originalPath.match(/^\/api\/admin\/categories\/([a-zA-Z0-9-]+)/);
  if (nonVersionedAdminCategoryWithIdMatch && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    const categoryId = nonVersionedAdminCategoryWithIdMatch[1];
    
    const preservedPath = `/api/admin/categories/${categoryId}${queryString}`;
    
    logger.info({
      msg: 'Preserving non-versioned admin/categories path with ID for product service',
      originalPath,
      preservedPath,
      categoryId,
      method: 'ANY'
    });
    
    return preservedPath;
  }
  
  // For admin/products routes to product service, don't modify the path
  // Just keep the original path with api/v1/admin/products structure
  if (originalPath.match(/^\/api\/v\d+\/admin\/products/) && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    
    logger.info({
      msg: 'Preserving admin/products path structure for product service',
      originalPath,
      preservedPath: `/api/v${version}/admin/products${queryString}`,
      method: 'ANY'
    });
    
    return `/api/v${version}/admin/products${queryString}`;
  }
  
  // Handle non-versioned admin/products routes
  if (originalPath.match(/^\/api\/admin\/products/) && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    
    logger.info({
      msg: 'Preserving admin/products path structure for product service (non-versioned)',
      originalPath,
      preservedPath: `/api/admin/products${queryString}`,
      method: 'ANY'
    });
    
    return `/api/admin/products${queryString}`;
  }
  
  // For admin/categories routes to product service, don't modify the path
  if (originalPath.match(/^\/api\/v\d+\/admin\/categories/) && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    
    logger.info({
      msg: 'Preserving admin/categories path structure for product service',
      originalPath,
      preservedPath: `/api/v${version}/admin/categories${queryString}`,
      method: 'ANY'
    });
    
    return `/api/v${version}/admin/categories${queryString}`;
  }
  
  // Handle non-versioned admin/categories routes
  if (originalPath.match(/^\/api\/admin\/categories/) && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    
    logger.info({
      msg: 'Preserving admin/categories path structure for product service (non-versioned)',
      originalPath,
      preservedPath: `/api/admin/categories${queryString}`,
      method: 'ANY'
    });
    
    return `/api/admin/categories${queryString}`;
  }
  
  // For admin/brands routes with ID to product service, add special handling
  const adminBrandWithIdMatch = originalPath.match(/^\/api\/v\d+\/admin\/brands\/([a-zA-Z0-9-]+)/);
  if (adminBrandWithIdMatch && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    const brandId = adminBrandWithIdMatch[1];
    
    const preservedPath = `/api/v${version}/admin/brands/${brandId}${queryString}`;
    
    logger.info({
      msg: 'Preserving admin/brands path with ID for product service',
      originalPath,
      preservedPath,
      brandId,
      method: 'ANY'
    });
    
    return preservedPath;
  }
  
  // For admin/tags routes with ID to product service, add special handling
  const adminTagWithIdMatch = originalPath.match(/^\/api\/v\d+\/admin\/tags\/([a-zA-Z0-9-]+)/);
  if (adminTagWithIdMatch && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    const tagId = adminTagWithIdMatch[1];
    
    const preservedPath = `/api/v${version}/admin/tags/${tagId}${queryString}`;
    
    logger.info({
      msg: 'Preserving admin/tags path with ID for product service',
      originalPath,
      preservedPath,
      tagId,
      method: 'ANY'
    });
    
    return preservedPath;
  }
  
  // For non-versioned admin/brands routes with ID to product service
  const nonVersionedAdminBrandWithIdMatch = originalPath.match(/^\/api\/admin\/brands\/([a-zA-Z0-9-]+)/);
  if (nonVersionedAdminBrandWithIdMatch && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    const brandId = nonVersionedAdminBrandWithIdMatch[1];
    
    const preservedPath = `/api/admin/brands/${brandId}${queryString}`;
    
    logger.info({
      msg: 'Preserving non-versioned admin/brands path with ID for product service',
      originalPath,
      preservedPath,
      brandId,
      method: 'ANY'
    });
    
    return preservedPath;
  }
  
  // For non-versioned admin/tags routes with ID to product service
  const nonVersionedAdminTagWithIdMatch = originalPath.match(/^\/api\/admin\/tags\/([a-zA-Z0-9-]+)/);
  if (nonVersionedAdminTagWithIdMatch && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    const tagId = nonVersionedAdminTagWithIdMatch[1];
    
    const preservedPath = `/api/admin/tags/${tagId}${queryString}`;
    
    logger.info({
      msg: 'Preserving non-versioned admin/tags path with ID for product service',
      originalPath,
      preservedPath,
      tagId,
      method: 'ANY'
    });
    
    return preservedPath;
  }
  
  // For admin/brands routes to product service, don't modify the path
  if (originalPath.match(/^\/api\/v\d+\/admin\/brands/) && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    
    logger.info({
      msg: 'Preserving admin/brands path structure for product service',
      originalPath,
      preservedPath: `/api/v${version}/admin/brands${queryString}`,
      method: 'ANY'
    });
    
    return `/api/v${version}/admin/brands${queryString}`;
  }
  
  // For admin/tags routes to product service, don't modify the path
  if (originalPath.match(/^\/api\/v\d+\/admin\/tags/) && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    
    logger.info({
      msg: 'Preserving admin/tags path structure for product service',
      originalPath,
      preservedPath: `/api/v${version}/admin/tags${queryString}`,
      method: 'ANY'
    });
    
    return `/api/v${version}/admin/tags${queryString}`;
  }
  
  // Handle non-versioned admin/brands routes
  if (originalPath.match(/^\/api\/admin\/brands/) && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    
    logger.info({
      msg: 'Preserving admin/brands path structure for product service (non-versioned)',
      originalPath,
      preservedPath: `/api/admin/brands${queryString}`,
      method: 'ANY'
    });
    
    return `/api/admin/brands${queryString}`;
  }
  
  // Handle non-versioned admin/tags routes
  if (originalPath.match(/^\/api\/admin\/tags/) && serviceRoute === '/api/products') {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Keep original path structure when forwarding to product service
    
    logger.info({
      msg: 'Preserving admin/tags path structure for product service (non-versioned)',
      originalPath,
      preservedPath: `/api/admin/tags${queryString}`,
      method: 'ANY'
    });
    
    return `/api/admin/tags${queryString}`;
  }
  
  // For non-admin product routes, keep existing logic
  if (originalPath.match(/^\/api\/v\d+\/products/) && !originalPath.includes('/admin/')) {
    // Keep the query string
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    // Use the product service's expected path format
    const versionMatch = originalPath.match(/\/api\/v(\d+)/);
    const version = versionMatch ? versionMatch[1] : '1';
    
    logger.info({
      msg: 'Transforming products path for product service',
      originalPath,
      transformedPath: `/api/v${version}/products${queryString}`,
      method: 'ANY'
    });
    
    return `/api/v${version}/products${queryString}`;
  }

  // Special case for admin/products routes (keep for other paths)
  if (originalPath.includes('/admin/products')) {
    // For admin/products, preserve the admin part in the path
    // Extract query string if present
    const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';
    
    // Create the path that product service expects with admin
    let productPath;
    
    // Check if it's a versioned path
    const versionMatch = originalPath.match(/\/api\/v(\d+)\/admin\/products/);
    if (versionMatch) {
      const version = versionMatch[1];
      productPath = `/api/v${version}/admin/products${queryString}`;
    } else {
      productPath = `/api/admin/products${queryString}`;
    }
    
    // Add detailed logging
    logger.info({
      msg: 'Preserving admin/products path',
      originalPath,
      preservedPath: productPath,
      routeType: 'admin-products'
    });
    
    return productPath;
  }

  // Handle versioned paths (e.g., /api/v1/admin/products)
  const versionedMatch = originalPath.match(/^\/api\/v(\d+)\/([^\/]+)(.*)/);
  if (versionedMatch) {
    const version = versionedMatch[1];
    const serviceName = versionedMatch[2];
    const pathSegment = versionedMatch[3] || '/';
    
    // For auth service, prefix with /api/auth
    if (serviceName === 'auth') {
      // Remove leading slash if present and add /api/auth prefix
      const cleanPath = pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`;
      const result = `/api/auth${cleanPath}`;
      
      // Add detailed logging
      logger.info({
        msg: 'Processing auth service path',
        originalPath,
        transformedPath: result,
        routeType: 'auth-versioned'
      });
      
      return result;
    }
    
    // Special case for admin paths - preserve the full path structure
    if (serviceName === 'admin') {
      // Keep the original path structure for admin routes
      const result = `/api/v${version}/admin${pathSegment}`;
      
      // Add detailed logging
      logger.info({
        msg: 'Preserving admin path structure',
        originalPath,
        transformedPath: result,
        serviceName,
        version,
        routeType: 'admin-versioned'
      });
      
      return result;
    }
    
    // For other services, include the version number
    const result = `/v${version}${pathSegment}`;
    
    // Add detailed logging
    logger.info({
      msg: 'Processing versioned path',
      originalPath,
      transformedPath: result,
      serviceName,
      version,
      routeType: 'versioned'
    });
    
    return result;
  }
  
  // Extract path segment after service route for standard paths
  const pathSegment = originalPath.substring(serviceRoute.length) || '/';
  
  // For auth service, prefix with /api/auth
  if (serviceRoute === '/api/auth') {
    // Remove leading slash if present and add /api/auth prefix
    const cleanPath = pathSegment.startsWith('/') ? pathSegment : `/${pathSegment}`;
    const result = `/api/auth${cleanPath}`;
    
    // Add detailed logging
    logger.info({
      msg: 'Processing auth service standard path',
      originalPath,
      transformedPath: result,
      routeType: 'auth-standard'
    });
    
    return result;
  }
  
  // For admin paths, preserve the full path structure
  if (serviceRoute === '/api/admin') {
    // Keep the original path structure for admin routes
    const result = `/api/admin${pathSegment}`;
    
    // Add detailed logging
    logger.info({
      msg: 'Preserving non-versioned admin path structure',
      originalPath,
      transformedPath: result,
      routeType: 'admin-standard'
    });
    
    return result;
  }
  
  // For other services, we just use the path segment
  // Add detailed logging
  logger.info({
    msg: 'Processing standard path',
    originalPath,
    transformedPath: pathSegment,
    serviceRoute,
    routeType: 'standard'
  });
  
  return pathSegment;
}

/**
 * Forward handler for proxying requests to microservices
 */
export async function forwardHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = request.headers['x-request-id'] as string;
  const path = request.url;

  try {
    // Remove the problematic special case handler and use the general forwarding logic instead
    
    // Special case for admin tag routes
    if (path.match(/^\/api\/v\d+\/admin\/tags(\/.*)?(\?|$)/)) {
      logger.info({
        msg: 'Special case handling for admin tag routes',
        path,
        method: request.method,
        requestId,
      });
      
      // Manually construct the service request
      const productServiceUrl = serviceRoutes['/api/products']?.url;
      if (productServiceUrl) {
        // Extract version from path
        const versionMatch = path.match(/\/api\/v(\d+)/);
        const version = versionMatch ? versionMatch[1] : '1';
        
        // Extract the rest of the path after /admin/tags/
        const pathMatch = path.match(/^\/api\/v\d+\/admin\/tags(\/.*)?(\?|$)/);
        const restPath = pathMatch && pathMatch[1] ? pathMatch[1] : '';
        
        // Extract query string if present
        const queryString = path.includes('?') ? path.substring(path.indexOf('?')) : '';
        
        // Construct target URL with proper path structure
        // For GET requests, use /tags directly
        // For POST, PUT, DELETE requests, use /admin/tags to maintain admin privileges
        let targetUrl;
        if (request.method === 'GET') {
          targetUrl = `${productServiceUrl}/api/v${version}/tags${restPath}${queryString}`;
          logger.info({
            msg: 'Manual forwarding admin tag GET request to product service tags endpoint',
            originalPath: path,
            targetUrl,
            requestId,
          });
        } else {
          // For POST, PUT, DELETE requests
          targetUrl = `${productServiceUrl}/api/v${version}/admin/tags${restPath}${queryString}`;
          logger.info({
            msg: 'Manual forwarding admin tag non-GET request to product service admin tags endpoint',
            originalPath: path,
            targetUrl,
            requestId,
          });
        }
        
        // Prepare headers
        const headers = {
          ...request.headers,
          'x-forwarded-for': request.ip,
          'x-forwarded-host': request.hostname,
          'x-forwarded-proto': request.protocol,
        };
        
        // Remove headers that shouldn't be forwarded
        delete headers['host'];
        delete headers['connection'];
        
        // Extract the body if it exists
        let body: unknown = undefined;
        if (request.body && typeof request.body === 'object' && Object.keys(request.body).length > 0) {
          body = request.body;
        }
        
        // Forward request to product service
        const serviceRequest: ServiceRequest = {
          method: request.method as ServiceRequest['method'],
          url: targetUrl,
          headers,
          body,
          timeout: serviceRoutes['/api/products']?.timeout || 10000,
        };
        
        try {
          const response = await forwardRequest(serviceRequest);
          
          // Set response headers
          Object.entries(response.headers).forEach(([key, value]) => {
            if (value && !['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
              reply.header(key, value);
            }
          });
          
          // Send response
          return reply
            .status(response.status)
            .send(response.body);
        } catch (error) {
          const errorResponse = handleServiceError(error, requestId);
          
          logger.error({
            err: error,
            msg: 'Failed to forward admin tag request to product service',
            path,
            requestId,
          });
          
          return reply
            .status(errorResponse.status)
            .send(errorResponse);
        }
      }
    }
    
    // Special case for non-versioned admin tag routes
    if (path.match(/^\/api\/admin\/tags(\/.*)?(\?|$)/)) {
      logger.info({
        msg: 'Special case handling for non-versioned admin tag routes',
        path,
        method: request.method,
        requestId,
      });
      
      // Manually construct the service request
      const productServiceUrl = serviceRoutes['/api/products']?.url;
      if (productServiceUrl) {
        // Extract the rest of the path after /admin/tags/
        const pathMatch = path.match(/^\/api\/admin\/tags(\/.*)?(\?|$)/);
        const restPath = pathMatch && pathMatch[1] ? pathMatch[1] : '';
        
        // Extract query string if present
        const queryString = path.includes('?') ? path.substring(path.indexOf('?')) : '';
        
        // Construct target URL with proper path structure
        // For GET requests, use /tags directly
        // For POST, PUT, DELETE requests, use /admin/tags to maintain admin privileges
        let targetUrl;
        if (request.method === 'GET') {
          targetUrl = `${productServiceUrl}/api/v1/tags${restPath}${queryString}`;
          logger.info({
            msg: 'Manual forwarding non-versioned admin tag GET request to product service tags endpoint',
            originalPath: path,
            targetUrl,
            requestId,
          });
        } else {
          // For POST, PUT, DELETE requests
          targetUrl = `${productServiceUrl}/api/v1/admin/tags${restPath}${queryString}`;
          logger.info({
            msg: 'Manual forwarding non-versioned admin tag non-GET request to product service admin tags endpoint',
            originalPath: path,
            targetUrl,
            requestId,
          });
        }
        
        // Prepare headers
        const headers = {
          ...request.headers,
          'x-forwarded-for': request.ip,
          'x-forwarded-host': request.hostname,
          'x-forwarded-proto': request.protocol,
        };
        
        // Remove headers that shouldn't be forwarded
        delete headers['host'];
        delete headers['connection'];
        
        // Extract the body if it exists
        let body: unknown = undefined;
        if (request.body && typeof request.body === 'object' && Object.keys(request.body).length > 0) {
          body = request.body;
        }
        
        // Forward request to product service
        const serviceRequest: ServiceRequest = {
          method: request.method as ServiceRequest['method'],
          url: targetUrl,
          headers,
          body,
          timeout: serviceRoutes['/api/products']?.timeout || 10000,
        };
        
        try {
          const response = await forwardRequest(serviceRequest);
          
          // Set response headers
          Object.entries(response.headers).forEach(([key, value]) => {
            if (value && !['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
              reply.header(key, value);
            }
          });
          
          // Send response
          return reply
            .status(response.status)
            .send(response.body);
        } catch (error) {
          const errorResponse = handleServiceError(error, requestId);
          
          logger.error({
            err: error,
            msg: 'Failed to forward non-versioned admin tag request to product service',
            path,
            requestId,
          });
          
          return reply
            .status(errorResponse.status)
            .send(errorResponse);
        }
      }
    }
    
    // Special case for coupon routes
    if (path.match(/^\/api\/v\d+\/coupons(\/.*)?(\?|$)/)) {
      logger.info({
        msg: 'Special case handling for coupon routes',
        path,
        method: request.method,
        requestId,
      });
      
      // Manually construct the service request
      const productServiceUrl = serviceRoutes['/api/products']?.url;
      if (productServiceUrl) {
        // Extract version from path
        const versionMatch = path.match(/\/api\/v(\d+)/);
        const version = versionMatch ? versionMatch[1] : '1';
        
        // Extract the rest of the path after /coupons/
        const pathMatch = path.match(/^\/api\/v\d+\/coupons(\/.*)?(\?|$)/);
        const restPath = pathMatch && pathMatch[1] ? pathMatch[1] : '';
        
        // Extract query string if present
        const queryString = path.includes('?') ? path.substring(path.indexOf('?')) : '';
        
        // Construct target URL
        const targetUrl = `${productServiceUrl}/api/v${version}/coupons${restPath}${queryString}`;
        logger.info({
          msg: 'Manual forwarding coupon request to product service coupons endpoint',
          originalPath: path,
          targetUrl,
          requestId,
        });
        
        // Prepare headers
        const headers = {
          ...request.headers,
          'x-forwarded-for': request.ip,
          'x-forwarded-host': request.hostname,
          'x-forwarded-proto': request.protocol,
        };
        
        // Remove headers that shouldn't be forwarded
        delete headers['host'];
        delete headers['connection'];
        
        // Extract the body if it exists
        let body: unknown = undefined;
        if (request.body && typeof request.body === 'object' && Object.keys(request.body).length > 0) {
          body = request.body;
        }
        
        // Forward request to product service
        const serviceRequest: ServiceRequest = {
          method: request.method as ServiceRequest['method'],
          url: targetUrl,
          headers,
          body,
          timeout: serviceRoutes['/api/products']?.timeout || 10000,
        };
        
        try {
          const response = await forwardRequest(serviceRequest);
          
          // Set response headers
          Object.entries(response.headers).forEach(([key, value]) => {
            if (value && !['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
              reply.header(key, value);
            }
          });
          
          // Send response
          return reply
            .status(response.status)
            .send(response.body);
        } catch (error) {
          const errorResponse = handleServiceError(error, requestId);
          
          logger.error({
            err: error,
            msg: 'Failed to forward coupon request to product service',
            path,
            requestId,
          });
          
          return reply
            .status(errorResponse.status)
            .send(errorResponse);
        }
      }
    }
    
    // Special case for exact /api/v1/coupons path (without query parameters)
    if (path === '/api/v1/coupons') {
      logger.info({
        msg: 'Special case: Exact match for /api/v1/coupons (no query params)',
        path,
        method: request.method,
        requestId,
      });
      
      // Manually construct the service request
      const productServiceUrl = serviceRoutes['/api/products']?.url;
      if (productServiceUrl) {
        // Construct target URL
        const targetUrl = `${productServiceUrl}/api/v1/coupons`;
        logger.info({
          msg: 'Manual forwarding exact coupon request to product service',
          originalPath: path,
          targetUrl,
          requestId,
        });
        
        // Prepare headers
        const headers = {
          ...request.headers,
          'x-forwarded-for': request.ip,
          'x-forwarded-host': request.hostname,
          'x-forwarded-proto': request.protocol,
        };
        
        // Remove headers that shouldn't be forwarded
        delete headers['host'];
        delete headers['connection'];
        
        // Forward request to product service
        const serviceRequest: ServiceRequest = {
          method: request.method as ServiceRequest['method'],
          url: targetUrl,
          headers,
          timeout: serviceRoutes['/api/products']?.timeout || 10000,
        };
        
        try {
          const response = await forwardRequest(serviceRequest);
          
          // Set response headers
          Object.entries(response.headers).forEach(([key, value]) => {
            if (value && !['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
              reply.header(key, value);
            }
          });
          
          // Send response
          return reply
            .status(response.status)
            .send(response.body);
        } catch (error) {
          const errorResponse = handleServiceError(error, requestId);
          
          logger.error({
            err: error,
            msg: 'Failed to forward exact coupon request to product service',
            path,
            requestId,
          });
          
          return reply
            .status(errorResponse.status)
            .send(errorResponse);
        }
      }
    }
    
    // Special case for admin coupon routes
    if (path.match(/^\/api\/v\d+\/admin\/coupons(\/.*)?(\?|$)/)) {
      logger.info({
        msg: 'Special case handling for admin coupon routes',
        path,
        method: request.method,
        requestId,
      });
      
      // Manually construct the service request
      const productServiceUrl = serviceRoutes['/api/products']?.url;
      if (productServiceUrl) {
        // Extract version from path
        const versionMatch = path.match(/\/api\/v(\d+)/);
        const version = versionMatch ? versionMatch[1] : '1';
        
        // Extract the rest of the path after /admin/coupons/
        const pathMatch = path.match(/^\/api\/v\d+\/admin\/coupons(\/.*)?(\?|$)/);
        const restPath = pathMatch && pathMatch[1] ? pathMatch[1] : '';
        
        // Extract query string if present
        const queryString = path.includes('?') ? path.substring(path.indexOf('?')) : '';
        
        // Construct target URL with proper path structure
        // For GET requests, use /coupons directly
        // For POST, PUT, DELETE requests, use /admin/coupons to maintain admin privileges
        let targetUrl;
        if (request.method === 'GET') {
          targetUrl = `${productServiceUrl}/api/v${version}/coupons${restPath}${queryString}`;
          logger.info({
            msg: 'Manual forwarding admin coupon GET request to product service coupons endpoint',
            originalPath: path,
            targetUrl,
            requestId,
          });
        } else {
          // For POST, PUT, DELETE requests
          targetUrl = `${productServiceUrl}/api/v${version}/admin/coupons${restPath}${queryString}`;
          logger.info({
            msg: 'Manual forwarding admin coupon non-GET request to product service admin coupons endpoint',
            originalPath: path,
            targetUrl,
            requestId,
          });
        }
        
        // Prepare headers
        const headers = {
          ...request.headers,
          'x-forwarded-for': request.ip,
          'x-forwarded-host': request.hostname,
          'x-forwarded-proto': request.protocol,
        };
        
        // Remove headers that shouldn't be forwarded
        delete headers['host'];
        delete headers['connection'];
        
        // Extract the body if it exists
        let body: unknown = undefined;
        if (request.body && typeof request.body === 'object' && Object.keys(request.body).length > 0) {
          body = request.body;
        }
        
        // Forward request to product service
        const serviceRequest: ServiceRequest = {
          method: request.method as ServiceRequest['method'],
          url: targetUrl,
          headers,
          body,
          timeout: serviceRoutes['/api/products']?.timeout || 10000,
        };
        
        try {
          const response = await forwardRequest(serviceRequest);
          
          // Set response headers
          Object.entries(response.headers).forEach(([key, value]) => {
            if (value && !['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
              reply.header(key, value);
            }
          });
          
          // Send response
          return reply
            .status(response.status)
            .send(response.body);
        } catch (error) {
          const errorResponse = handleServiceError(error, requestId);
          
          logger.error({
            err: error,
            msg: 'Failed to forward admin coupon request to product service',
            path,
            requestId,
          });
          
          return reply
            .status(errorResponse.status)
            .send(errorResponse);
        }
      }
    }
    
    // Special case for non-versioned admin coupon routes
    if (path.match(/^\/api\/admin\/coupons(\/.*)?(\?|$)/)) {
      logger.info({
        msg: 'Special case handling for non-versioned admin coupon routes',
        path,
        method: request.method,
        requestId,
      });
      
      // Manually construct the service request
      const productServiceUrl = serviceRoutes['/api/products']?.url;
      if (productServiceUrl) {
        // Extract the rest of the path after /admin/coupons/
        const pathMatch = path.match(/^\/api\/admin\/coupons(\/.*)?(\?|$)/);
        const restPath = pathMatch && pathMatch[1] ? pathMatch[1] : '';
        
        // Extract query string if present
        const queryString = path.includes('?') ? path.substring(path.indexOf('?')) : '';
        
        // Construct target URL with proper path structure
        // For GET requests, use /coupons directly
        // For POST, PUT, DELETE requests, use /admin/coupons to maintain admin privileges
        let targetUrl;
        if (request.method === 'GET') {
          targetUrl = `${productServiceUrl}/api/v1/coupons${restPath}${queryString}`;
          logger.info({
            msg: 'Manual forwarding non-versioned admin coupon GET request to product service coupons endpoint',
            originalPath: path,
            targetUrl,
            requestId,
          });
        } else {
          // For POST, PUT, DELETE requests
          targetUrl = `${productServiceUrl}/api/v1/admin/coupons${restPath}${queryString}`;
          logger.info({
            msg: 'Manual forwarding non-versioned admin coupon non-GET request to product service admin coupons endpoint',
            originalPath: path,
            targetUrl,
            requestId,
          });
        }
        
        // Prepare headers
        const headers = {
          ...request.headers,
          'x-forwarded-for': request.ip,
          'x-forwarded-host': request.hostname,
          'x-forwarded-proto': request.protocol,
        };
        
        // Remove headers that shouldn't be forwarded
        delete headers['host'];
        delete headers['connection'];
        
        // Extract the body if it exists
        let body: unknown = undefined;
        if (request.body && typeof request.body === 'object' && Object.keys(request.body).length > 0) {
          body = request.body;
        }
        
        // Forward request to product service
        const serviceRequest: ServiceRequest = {
          method: request.method as ServiceRequest['method'],
          url: targetUrl,
          headers,
          body,
          timeout: serviceRoutes['/api/products']?.timeout || 10000,
        };
        
        try {
          const response = await forwardRequest(serviceRequest);
          
          // Set response headers
          Object.entries(response.headers).forEach(([key, value]) => {
            if (value && !['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
              reply.header(key, value);
            }
          });
          
          // Send response
          return reply
            .status(response.status)
            .send(response.body);
        } catch (error) {
          const errorResponse = handleServiceError(error, requestId);
          
          logger.error({
            err: error,
            msg: 'Failed to forward non-versioned admin coupon request to product service',
            path,
            requestId,
          });
          
          return reply
            .status(errorResponse.status)
            .send(errorResponse);
        }
      }
    }
    
    // Comprehensive debug logging for every request
    logger.info({
      msg: 'Processing forwarding request',
      path,
      method: request.method,
      hasQueryParams: path.includes('?'),
      hasAuth: !!request.headers.authorization,
      requestId,
    });

    // Special debug logging for user service requests
    if (path.includes('/users')) {
      logger.info({
        msg: 'Processing user service request',
        path,
        method: request.method,
        hasAuth: !!request.headers.authorization,
        authPrefix: request.headers.authorization ? request.headers.authorization.substring(0, 15) + '...' : 'none',
        requestId,
        matchesVersioned: !!path.match(/^\/api\/v\d+\/users/),
        matchesNonVersioned: !!path.match(/^\/api\/users/),
        matchesWithQuery: !!path.match(/^\/api\/v\d+\/users\?/),
      });
    }

    // Find service configuration
    const serviceConfig = findServiceConfig(path);
    if (!serviceConfig) {
      // Log all available service routes for debugging
      const availableRoutes = Object.keys(serviceRoutes).map(route => ({
        route,
        service: serviceRoutes[route]?.name ?? 'undefined',
        url: serviceRoutes[route]?.url ?? 'undefined'
      }));
      
      logger.warn({
        msg: 'No service configuration found for path',
        path,
        requestId,
        availableRoutes,
        pathStartsWith: path.substring(0, 10),
      });
      
      return reply.status(404).send({
        status: 404,
        code: 'NOT_FOUND',
        message: `No service configured for path: ${path}`,
        timestamp: new Date().toISOString(),
        requestId,
      });
    }

    // Special detailed logging for user service
    if (serviceConfig.name === 'user-service') {
      logger.info({
        msg: 'User service selected for request',
        path,
        serviceUrl: serviceConfig.url,
        method: request.method,
        requestId,
      });
    }

    // Log selected service for debugging
    logger.info({
      msg: 'Selected service for request',
      path,
      method: request.method,
      serviceName: serviceConfig.name,
      serviceUrl: serviceConfig.url,
      requestId,
    });

    // Determine the appropriate route for this path
    let route: string;
    const versionedMatch = path.match(/^\/api\/v\d+\/([^\/]+)/);
    if (versionedMatch) {
      // For versioned paths, use the corresponding base route
      const serviceName = versionedMatch[1];
      route = `/api/${serviceName}`;
      
      // Special case for admin/products or admin/categories - use products route
      if (serviceName === 'admin' && (path.includes('/products') || path.includes('/categories') || path.includes('/brands'))) {
        route = '/api/products';
        logger.info({
          msg: 'Using product service route for admin path',
          path,
          route,
          requestId,
        });
      }
      
      // Special case for users route
      if (serviceName === 'users') {
        logger.info({
          msg: 'Using user service route for users path',
          path,
          route: '/api/users',
          requestId,
        });
      }
    } else {
      // For standard paths, find the matching route
      route = Object.keys(serviceRoutes).find(r => path.startsWith(r))!;
      
      // Special case for admin/products or admin/categories - use products route
      if (route === '/api/admin' && (path.includes('/products') || path.includes('/categories') || path.includes('/brands'))) {
        route = '/api/products';
        logger.info({
          msg: 'Using product service route for admin path',
          path,
          route,
          requestId,
        });
      }
    }

    // Get target path
    const targetPath = getTargetPath(path, route);
    const targetUrl = `${serviceConfig.url}${targetPath}`;

    // Log the forwarding details for debugging
    logger.info({
      msg: 'Forwarding request details',
      originalPath: path,
      serviceRoute: route,
      targetPath,
      targetUrl,
      serviceName: serviceConfig.name,
      method: request.method,
      requestId,
    });

    // Prepare headers
    const headers = {
      ...request.headers,
      'x-forwarded-for': request.ip,
      'x-forwarded-host': request.hostname,
      'x-forwarded-proto': request.protocol,
      ...serviceConfig.headers,
    };

    // Log authentication information for debugging
    if (headers.authorization) {
      logger.info({
        msg: 'Authorization header details',
        headerPresent: !!headers.authorization,
        headerType: typeof headers.authorization,
        headerPrefix: headers.authorization.substring(0, 10) + '...',
        path,
        serviceName: serviceConfig.name,
        requestId,
      });
    } else {
      logger.warn({
        msg: 'No authorization header present',
        path,
        serviceName: serviceConfig.name,
        requestId,
      });
    }

    // Remove headers that shouldn't be forwarded
    delete headers['host'];
    delete headers['connection'];
    delete headers['transfer-encoding']; // Remove transfer-encoding header to prevent errors

    // Extract the body if it exists
    let body: unknown = undefined;
    if (request.body && typeof request.body === 'object' && Object.keys(request.body).length > 0) {
      body = request.body;
    }

    // Prepare service request
    const serviceRequest: ServiceRequest = {
      method: request.method as ServiceRequest['method'],
      url: targetUrl,
      headers,
      body,
      timeout: serviceConfig.timeout,
    };

    // Log forwarding attempt with body info
    logger.debug({
      msg: 'Forwarding request to service',
      service: serviceConfig.name,
      method: request.method,
      path: targetPath,
      hasBody: !!body,
      requestId,
    });

    // Forward request to service
    const response = await forwardRequest(serviceRequest);

    // Log response error details if status code is 4xx or 5xx
    if (response.status >= 400) {
      logger.error({
        msg: 'Error response from service',
        service: serviceConfig.name,
        status: response.status,
        responseBody: typeof response.body === 'object' ? JSON.stringify(response.body) : response.body,
        originalPath: path,
        targetPath,
        requestId,
      });
    }

    // Set response headers
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value && !['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
        reply.header(key, value);
      }
    });

    // Log successful response
    logger.debug({
      msg: 'Service response received',
      service: serviceConfig.name,
      status: response.status,
      requestId,
    });

    // Send response
    return reply
      .status(response.status)
      .send(response.body);

  } catch (error) {
    // Handle and log error
    const errorResponse = handleServiceError(error, requestId);
    
    logger.error({
      err: error,
      msg: 'Failed to forward request',
      path,
      requestId,
    });

    return reply
      .status(errorResponse.status)
      .send(errorResponse);
  }
}

// Example usage:
/*
import { forwardHandler } from './controllers/forward.controller';

fastify.all('/api/*', forwardHandler);
*/ 
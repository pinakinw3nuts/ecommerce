import { config } from './env';

// Helper function to get service URL based on environment
export function getServiceUrl(containerUrl: string, localPort: number): string {
  // Use 127.0.0.1 in development mode for local testing (explicitly IPv4)
  if (config.server.nodeEnv === 'development') {
    return `http://127.0.0.1:${localPort}`;
  }
  return containerUrl;
}

// Interface for service configuration
export interface ServiceConfig {
  name: string;
  url: string;
  timeout?: number;
  headers?: Record<string, string>;
  routes: string[];
  versionedRoutes?: boolean;
  adminRoutes?: boolean;
  specialCases?: {
    pattern: RegExp;
    handler: string;
  }[];
}

// Define all services with their configurations
export const services: Record<string, ServiceConfig> = {
  auth: {
    name: 'auth-service',
    url: getServiceUrl(config.services.auth, 3001),
    timeout: 5000,
    routes: ['/api/auth'],
    versionedRoutes: true,
  },
  user: {
    name: 'user-service',
    url: getServiceUrl(config.services.user, 3002),
    timeout: 5000,
    routes: [
      '/api/users',
      '/api/v1/users',
      '/api/v1/user/me',
      '/api/v1/addresses'
    ],
    versionedRoutes: true,
    specialCases: [
      {
        // Single pattern for user profile
        pattern: /^\/api\/v1\/user\/me(\?|$)/,
        handler: 'user'
      }
    ]
  },
  product: {
    name: 'product-service',
    url: getServiceUrl(config.services.product, 3003),
    timeout: 10000,
    routes: [
      '/api/products',
      '/api/v1/products',
      '/api/categories',
      '/api/v1/categories',
      '/api/brands',
      '/api/v1/brands',
      '/api/tags',
      '/api/v1/tags',
      '/api/coupons',
      '/api/v1/coupons'
    ],
    versionedRoutes: true,
    adminRoutes: true,
    specialCases: [
      {
        pattern: /^\/api\/v\d+\/admin\/(products|categories|brands|tags|coupons)(\/.*)?(\?|$)/,
        handler: 'product'
      },
      {
        pattern: /^\/api\/admin\/(products|categories|brands|tags|coupons)(\/.*)?(\?|$)/,
        handler: 'product'
      },
      {
        pattern: /^\/api\/v\d+\/products\/featured(\?|$)/,
        handler: 'product'
      },
      {
        pattern: /^\/api\/v\d+\/products\/([^\/]+)(\/.*)?(\?|$)/,
        handler: 'product'
      }
    ]
  },
  cms: {
    name: 'cms-service',
    url: getServiceUrl(config.services.cms, 3013),
    timeout: 5000,
    routes: [
      '/api/cms', 
      '/api/widget', 
      '/api/v1/widget',
      '/api/v1/cms'
    ],
    versionedRoutes: true,
    adminRoutes: true,
    specialCases: [
      {
        pattern: /^\/api\/cms\/(home|pages|sections|banners|widgets)(\/.*)?(\?|$)/,
        handler: 'cms'
      },
      {
        pattern: /^\/api\/v1\/widget\/(home|test)(\/.*)?(\?|$)/,
        handler: 'cms'
      },
      {
        pattern: /^\/api\/v1\/cms\/(.*?)(\?|$)/,
        handler: 'cms'
      }
    ]
  },
  cart: {
    name: 'cart-service',
    url: getServiceUrl(config.services.cart, 3004),
    timeout: 5000,
    routes: ['/api/cart'],
    versionedRoutes: true,
  },
  checkout: {
    name: 'checkout-service',
    url: getServiceUrl(config.services.checkout, 3005),
    timeout: 15000,
    routes: ['/api/checkout'],
    versionedRoutes: true,
  },
  order: {
    name: 'order-service',
    url: getServiceUrl(config.services.order, 3006),
    timeout: 10000,
    routes: ['/api/orders'],
    versionedRoutes: true,
  },
  payment: {
    name: 'payment-service',
    url: getServiceUrl(config.services.payment, 3007),
    timeout: 15000,
    routes: ['/api/payments'],
    versionedRoutes: true,
  },
  shipping: {
    name: 'shipping-service',
    url: getServiceUrl(config.services.shipping, 3008),
    timeout: 8000,
    routes: ['/api/shipping'],
    versionedRoutes: true,
  },
  inventory: {
    name: 'inventory-service',
    url: getServiceUrl(config.services.inventory, 3009),
    timeout: 5000,
    routes: ['/api/inventory'],
    versionedRoutes: true,
  },
  company: {
    name: 'company-service',
    url: getServiceUrl(config.services.company, 3010),
    timeout: 5000,
    routes: ['/api/company'],
    versionedRoutes: true,
  },
  pricing: {
    name: 'pricing-service',
    url: getServiceUrl(config.services.pricing, 3011),
    timeout: 5000,
    routes: ['/api/pricing'],
    versionedRoutes: true,
  },
  admin: {
    name: 'admin-service',
    url: getServiceUrl(config.services.admin, 3012),
    timeout: 10000,
    routes: ['/api/admin'],
    versionedRoutes: true,
  },
};

/**
 * Extract the base path without query parameters
 */
function extractBasePath(path: string): string {
  const queryIndex = path.indexOf('?');
  return queryIndex > -1 ? path.substring(0, queryIndex) : path;
}

// Function to find the appropriate service for a given path
export function findServiceForPath(path: string): ServiceConfig | undefined {
  // Extract base path without query parameters
  const basePath = extractBasePath(path);

  // First check special cases
  for (const [, service] of Object.entries(services)) {
    if (service.specialCases) {
      for (const specialCase of service.specialCases) {
        if (specialCase.pattern.test(path)) {
          return services[specialCase.handler];
        }
      }
    }
  }

  // Check for versioned paths
  const versionedMatch = basePath.match(/^\/api\/v\d+\/([^\/]+)/);
  if (versionedMatch) {
    const servicePath = versionedMatch[1];
    
    // Find service that handles this path
    for (const [, service] of Object.entries(services)) {
      if (service.versionedRoutes) {
        for (const route of service.routes) {
          const routeBase = route.split('/')[2]; // Extract the base path (e.g., 'users' from '/api/users')
          if (servicePath === routeBase) {
            return service;
          }
        }
      }
    }

    // Special case for admin routes
    if (servicePath === 'admin') {
      const adminPathMatch = basePath.match(/^\/api\/v\d+\/admin\/([^\/]+)/);
      if (adminPathMatch) {
        const adminResourceType = adminPathMatch[1];
        
        // Find service that handles admin routes for this resource
        for (const [, service] of Object.entries(services)) {
          if (service.adminRoutes) {
            for (const route of service.routes) {
              const routeBase = route.split('/')[2];
              if (adminResourceType === routeBase) {
                return service;
              }
            }
          }
        }
      }
    }
  }

  // Check for non-versioned paths
  for (const [, service] of Object.entries(services)) {
    for (const route of service.routes) {
      if (basePath.startsWith(route)) {
        return service;
      }
    }
  }

  return undefined;
}

// Function to get target path for the downstream service
export function getTargetPath(originalPath: string): string {
  // Extract base path without query parameters
  const basePath = extractBasePath(originalPath);
  const queryString = originalPath.includes('?') ? originalPath.substring(originalPath.indexOf('?')) : '';

  // Handle legacy user profile routes - redirect to new standard route
  if (basePath === '/users/me' || basePath === '/api/users/me' || 
      basePath === '/me' || basePath === '/api/me') {
    return `/api/v1/user/me${queryString}`;
  }

  // Handle versioned paths
  const versionedMatch = basePath.match(/^\/api\/v(\d+)\//);
  if (versionedMatch) {
    // Ensure we don't have duplicate version segments
    const version = versionedMatch[1];
    const pathAfterVersion = basePath.substring(versionedMatch[0].length);
    
    // Check if the path after version starts with 'v1/' or similar
    const duplicateVersionMatch = pathAfterVersion.match(/^v\d+\//);
    if (duplicateVersionMatch) {
      // Remove the duplicate version segment
      const cleanPath = pathAfterVersion.substring(duplicateVersionMatch[0].length);
      return `/api/v${version}/${cleanPath}${queryString}`;
    }
    
    return originalPath;
  }

  // For non-versioned paths, add v1 prefix
  if (basePath.startsWith('/api/')) {
    return `/api/v1${basePath.substring(4)}${queryString}`;
  }

  // For paths without /api prefix
  if (!basePath.startsWith('/api/')) {
    return `/api/v1${basePath}${queryString}`;
  }

  return originalPath;
}

// Export all service routes for the API status endpoint
export function getAllRoutes(): string[] {
  const allRoutes: string[] = [];
  
  for (const [, service] of Object.entries(services)) {
    for (const route of service.routes) {
      // Add base route
      allRoutes.push(route);
      
      // Add wildcard route
      allRoutes.push(`${route}/*`);
      
      // Add versioned routes if applicable
      if (service.versionedRoutes) {
        allRoutes.push(`/api/v:version${route.substring(4)}`);
        allRoutes.push(`/api/v:version${route.substring(4)}/*`);
      }
      
      // Add admin routes if applicable
      if (service.adminRoutes) {
        const routeBase = route.split('/')[2];
        allRoutes.push(`/api/admin/${routeBase}`);
        allRoutes.push(`/api/admin/${routeBase}/*`);
        
        if (service.versionedRoutes) {
          allRoutes.push(`/api/v:version/admin/${routeBase}`);
          allRoutes.push(`/api/v:version/admin/${routeBase}/*`);
        }
      }
    }
  }
  
  return allRoutes;
} 
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async redirects() {
    return [
      {
        source: '/images/:path*',
        destination: '/api/placeholder',
        permanent: false,
      },
    ];
  },
  env: {
    // API Gateway URL for microservices
    API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:3000',
    // Product service URL
    NEXT_PUBLIC_PRODUCT_SERVICE_URL: process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3003/api/v1',
    // Always use real API data, not mock data
    USE_MOCK_DATA: 'false',
    // Product API URL
    PRODUCT_API_URL: process.env.PRODUCT_API_URL || 'http://127.0.0.1:3003/api/v1',
    NEXT_PUBLIC_CART_SERVICE_URL: process.env.NEXT_PUBLIC_CART_SERVICE_URL || 'http://localhost:3004/api/v1',
    NEXT_PUBLIC_CHECKOUT_API_URL: process.env.NEXT_PUBLIC_CHECKOUT_API_URL || 'http://localhost:3005/api/v1',
    NEXT_PUBLIC_AUTH_SERVICE_URL: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001/api/v1',
    NEXT_PUBLIC_USER_SERVICE_URL: process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3002/api/v1',
    NEXT_PUBLIC_ORDER_SERVICE_URL: process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3006/api/v1',
    NEXT_PUBLIC_SHIPPING_SERVICE_URL: process.env.NEXT_PUBLIC_SHIPPING_SERVICE_URL || 'http://localhost:3008/api/v1',
    NEXT_PUBLIC_CMS_SERVICE_URL: process.env.NEXT_PUBLIC_CMS_SERVICE_URL || 'http://localhost:3015/api/v1',
    NEXT_PUBLIC_NOTIFICATION_SERVICE_URL: process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3009/api/v1',
    NEXT_PUBLIC_REVIEW_SERVICE_URL: process.env.NEXT_PUBLIC_REVIEW_SERVICE_URL || 'http://localhost:3010/api/v1',
    NEXT_PUBLIC_WISHLIST_SERVICE_URL: process.env.NEXT_PUBLIC_WISHLIST_SERVICE_URL || 'http://localhost:3011/api/v1',
    NEXT_PUBLIC_COMPANY_SERVICE_URL: process.env.NEXT_PUBLIC_COMPANY_SERVICE_URL || 'http://localhost:3012/api/v1',
    NEXT_PUBLIC_PRICING_SERVICE_URL: process.env.NEXT_PUBLIC_PRICING_SERVICE_URL || 'http://localhost:3013/api/v1',
    NEXT_PUBLIC_INVENTORY_SERVICE_URL: process.env.NEXT_PUBLIC_INVENTORY_SERVICE_URL || 'http://localhost:3014/api/v1',
    NEXT_PUBLIC_PAYMENT_SERVICE_URL: process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:3007/api/v1',
  },
  // Re-enable TypeScript and ESLint checking for proper development
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig; 
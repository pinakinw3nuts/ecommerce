/** @type {import('next').NextConfig} */
const nextConfig = {
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
    NEXT_PUBLIC_PRODUCT_SERVICE_URL: process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3003',
    // Always use real API data, not mock data
    USE_MOCK_DATA: 'false',
    // Product API URL
    PRODUCT_API_URL: process.env.PRODUCT_API_URL || 'http://127.0.0.1:3003/api/v1',
  },
  // Temporarily disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Temporarily disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 
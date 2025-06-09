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
    // Always use real API data, not mock data
    USE_MOCK_DATA: 'false',
  },
};

module.exports = nextConfig; 